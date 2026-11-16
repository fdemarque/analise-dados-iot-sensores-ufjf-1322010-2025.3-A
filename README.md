# Sentinela Pomba

**Protótipo:** https://sentinela-pomba.vercel.app

Protótipo IoT de **monitoramento hidrológico e previsão de cheias para Cataguases/MG**, desenvolvido para a disciplina
**1322010-2025.3-A, Análise de Dados de Dispositivos IoT e de Sensores** (Departamento de Ciência da Computação, UFJF).
Tema 1, Monitoramento Ambiental: níveis de rios e córregos.

O sistema cruza, em tempo real:

- **nível e vazão do Rio Pomba** em Cataguases e nas estações a montante (Astolfo Dutra, Barra do Xopotó no Rio Xopotó, Guarani). São dados **reais** da telemetria da ANA;
- **nível dos reservatórios** de 5 barragens a montante (CGH Ituerê, PCHs Ivan Botelho I/II/III e Zé Tunin). Também **real**, via ANA/Setor Elétrico;
- **instrumentação das comportas**: abertura, piezômetro, célula de carga e vibração. É **simulada** e pode chegar por gateway via `POST /api/telemetria`;
- **previsão horária de chuva** para 5 sub-bacias, incluindo o Ribeirão Meia Pataca, que não tem estação (Open-Meteo, **real**).

Com isso, o sistema projeta o nível em Cataguases para até 72h, avalia 8 regras de negócio `SE … ENTÃO …` e gera um índice de risco com insights.

> Protótipo acadêmico. **Não substitui os alertas oficiais do SGB (SAH-Pomba) e da Defesa Civil.**

## Telas

| Rota | Conteúdo |
|---|---|
| `/` | Painel: índice de risco, insights, nível observado e projetado com as cotas oficiais, estações a montante, chuva por sub-bacia e decomposição da projeção |
| `/barragens` | Nível real dos reservatórios, pressão medida × teórica (ρ·g·h), abertura de comporta, vibração, carga e índice de saúde |
| `/alertas` | Alertas ativos, catálogo formal das regras com a avaliação atual e o histórico de ocorrências |
| `/simulador` | Cenários de demonstração (cheia, abertura brusca de comporta, anomalia estrutural, falhas de sensor) e envio manual de telemetria |
| `/arquitetura` | Problema e usuários, diagrama end-to-end, dicionário de dados, modelo de projeção, riscos e resiliência, fontes |

## API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/estado?cenario=real\|cheia\|comporta\|estrutural\|falhas` | Estado completo: gêmeos digitais, projeção, alertas, regras e insights |
| POST | `/api/telemetria` | Ingestão de gateway. Aceita um objeto ou um array (lote) e é idempotente por `dispositivo_id + timestamp` |
| GET | `/api/telemetria` | Contrato do payload |
| GET | `/api/coleta` | Job agendado: coleta, avalia as regras, persiste os alertas e o resumo diário |
| GET | `/api/alertas` | Histórico de alertas |
| GET | `/api/saude` | Verifica a conexão com a planilha |

Exemplo de envio de telemetria:

```bash
curl -X POST https://sentinela-pomba.vercel.app/api/telemetria -H 'Content-Type: application/json' -d '{"dispositivo_id":"ze-tunin","timestamp":"2026-11-16T12:00:00Z","leituras":{"abertura_pct":18,"nivel_reservatorio_m":304.2,"pressao_kpa":150,"carga_pct":115,"vibracao_mm_s":9}}'
```

## Regras de negócio

| ID | Regra |
|---|---|
| R1 | SE nível ≥ 550/450/350 cm ENTÃO EMERGÊNCIA/ALERTA/ATENÇÃO (cotas oficiais SGB) |
| R2 | SE nível projetado em 12h ≥ 450 cm E chuva prevista em 24h ≥ 30 mm ENTÃO alerta antecipado com horário estimado |
| R3 | SE subida a montante ≥ 20 cm/h ENTÃO aviso de onda de cheia com ETA |
| R4 | SE Δabertura de comporta ≥ 30 p.p. em 30 min E reservatório ≥ 95% do NA máx. ENTÃO alerta de descarga brusca |
| R5 | SE desvio pressão × ρ·g·h ≥ 15% em 3 leituras E (vibração ≥ 7,1 mm/s OU carga ≥ 110%) ENTÃO emergência estrutural |
| R6 | SE chuva prevista em 3h no Meia Pataca ≥ 25 mm E chuva em 72h ≥ 60 mm ENTÃO alerta de enxurrada |
| R7 | SE sem leitura válida há > 240 min ENTÃO sensor OFFLINE, redundância e incerteza ampliada |
| R8 | SE leitura nula, fora de faixa ou com salto > 100 cm/15 min ENTÃO quarentena |

Os limiares ficam em `lib/config.ts`.

## Estrutura

```
lib/config.ts       estações, cotas, curvas-chave, barragens, sub-bacias, limiares
lib/fontes.ts       ingestão ANA (XML) e Open-Meteo
lib/modelo.ts       saneamento, curva-chave, propagação, chuva-vazão, projeção
lib/regras.ts       catálogo formal das regras
lib/estado.ts       orquestração end-to-end e motor de regras
lib/simulador.ts    sensores simulados e cenários
lib/store.ts        persistência (Google Sheets ou memória), idempotente
nodered/            fluxo Node-RED do gateway simulado (edge + store-and-forward)
docs/sheets-api.md  contrato da API de persistência (Google Sheets)
```

## Rodar localmente

```bash
npm install
npm run dev
```

## Coleta agendada

- **Vercel Cron** (`vercel.json`): consolidado diário às 10h UTC.
- **GitHub Actions** (`.github/workflows/coleta.yml`): a cada 15 min. Usa https://sentinela-pomba.vercel.app (ou a variável de repositório `APP_URL`, se definida).

## Persistência (Google Sheets)

A planilha **Sentinela Pomba – Banco de Prototipagem** (abas `telemetria`, `alertas` e `resumo_diario`) funciona como banco
por meio de um Apps Script publicado como Web App. O contrato da API está em [`docs/sheets-api.md`](docs/sheets-api.md).

Configure `SHEETS_WEBAPP_URL` e `SHEETS_TOKEN` em Vercel > Settings > Environment Variables (nunca no código) e verifique com `GET /api/saude`.
Sem essas variáveis, ou se a planilha não responder, o protótipo continua funcionando com memória do servidor (degradação graciosa).
As escritas são idempotentes pela coluna `chave`.

## Fontes

- ANA: telemetria hidrometeorológica (estações 58770000, 58735000, 58736000, 58730001, 58713550, 58730100, 58730900, 58731500, 58731800).
- SGB/CPRM: Relatório Anual do Sistema de Alerta Hidrológico da Bacia do Rio Pomba, 2024 (cotas de referência, curvas-chave, cheias históricas).
- Open-Meteo: previsão de precipitação.
- IBGE: Censo 2022.

Tempos de propagação, áreas de sub-bacia, NA máximo e cota dos piezômetros são **estimativas** a calibrar.
