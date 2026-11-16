# API de persistência: Google Sheets (Apps Script Web App)

Planilha **Sentinela Pomba – Banco de Prototipagem**, com as abas `telemetria`, `alertas` e `resumo_diario`.
A coluna A (`chave`) é a chave de idempotência.

Variáveis de ambiente, configuradas apenas na Vercel e **nunca no repositório**:

- `SHEETS_WEBAPP_URL`: URL `/exec` do Web App
- `SHEETS_TOKEN`: token de acesso total (somente backend/firmware)

## Leitura (GET)

```
GET {URL}?token=...&aba=telemetria|alertas|resumo_diario[&limite=100][&dispositivo_id=...][&desde=ISO]
GET {URL}?ping=1     health check (sem token)
```

O resultado vem do mais recente para o mais antigo. Na aba `telemetria`, `leituras` vem como objeto.

## Escrita (POST, `Content-Type: text/plain`)

```json
{ "token": "...", "aba": "telemetria", "modo": "inserir", "linhas": [ { } ] }
```

- `inserir` ignora chaves que já existem; `upsert` sobrescreve.
- Máximo de 500 linhas por lote.
- Resposta: `{"ok":true,"inseridas":N,"ignoradas":N,"atualizadas":N}`.
- Chave automática: na `telemetria` é `dispositivo_id|ts`, no `resumo_diario` é `dia`. Nos `alertas` a chave precisa ser enviada.

## Cuidados

- Toda resposta passa por um 302 para `script.googleusercontent.com`, que precisa ser seguido como GET. O `fetch` faz isso automaticamente. No ESP32, use `HTTPC_FORCE_FOLLOW_REDIRECTS` ou envie pelo backend.
- Grave datas sempre em ISO UTC, para manter consistentes o filtro `desde` e a ordenação.
- Na aba `resumo_diario`, formate as colunas A e B como **Texto simples**, para o Sheets não converter `dia` em data, o que quebraria o upsert.
- Cada chamada leva de 1 a 3 s e as escritas são serializadas. Prefira enviar em lote.

Implementação do cliente: [`lib/store.ts`](../lib/store.ts). Verificação: `GET /api/saude`.
