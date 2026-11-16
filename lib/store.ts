// Persistência: Google Sheets (Apps Script Web App) quando configurado; caso contrário, memória do processo.
// Escritas são idempotentes pela coluna "chave" (suporta retransmissão de dados).
// Contrato do Web App: veja docs/sheets-api.md.

export type TelemetriaGateway = {
  dispositivoId: string;
  ts: string;
  seq?: number;
  leituras: Record<string, number | boolean | null>;
  recebidoEm: string;
};

export type AlertaRegistro = {
  chave: string; // regra|alvo|cenário|janela: evita duplicar o mesmo alerta
  regra: string;
  severidade: string;
  alvo: string;
  titulo: string;
  mensagem: string;
  acao: string;
  cenario: string;
  criadoEm: string;
};

const URL_SHEETS = process.env.SHEETS_WEBAPP_URL;
const TOKEN = process.env.SHEETS_TOKEN;
export const persistenciaAtiva = Boolean(URL_SHEETS && TOKEN);
export const nomePersistencia = persistenciaAtiva ? 'google-sheets' : 'memoria';

type Mem = { telemetria: Map<string, TelemetriaGateway>; alertas: Map<string, AlertaRegistro>; cacheTele?: { em: number; dados: TelemetriaGateway[] } };
const g = globalThis as unknown as { __sentinela?: Mem };
const mem: Mem = (g.__sentinela ??= { telemetria: new Map(), alertas: new Map() });

type Linha = Record<string, unknown>;

async function chamar<T>(url: string, init: RequestInit): Promise<T | null> {
  try {
    // O Apps Script responde com 302 para script.googleusercontent.com; fetch segue o redirect como GET.
    const r = await fetch(url, { ...init, redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.ok ? (j as T) : null;
  } catch {
    return null; // falha de banco não derruba a aplicação (degradação graciosa)
  }
}

/** Escrita: modo "inserir" ignora chaves existentes; "upsert" sobrescreve. Máx. 500 linhas por lote. */
async function gravar(aba: string, linhas: Record<string, unknown>[], modo: 'inserir' | 'upsert' = 'inserir') {
  if (!persistenciaAtiva || !linhas.length) return null;
  let total: { inseridas: number; ignoradas: number; atualizadas: number } | null = { inseridas: 0, ignoradas: 0, atualizadas: 0 };
  for (let i = 0; i < linhas.length; i += 500) {
    const r = await chamar<{ inseridas: number; ignoradas: number; atualizadas: number }>(URL_SHEETS!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight de CORS
      body: JSON.stringify({ token: TOKEN, aba, modo, linhas: linhas.slice(i, i + 500) }),
    });
    if (!r) return null;
    total = { inseridas: total!.inseridas + (r.inseridas ?? 0), ignoradas: total!.ignoradas + (r.ignoradas ?? 0), atualizadas: total!.atualizadas + (r.atualizadas ?? 0) };
  }
  return total;
}

/** Leitura: resultado do mais recente para o mais antigo. */
async function ler(aba: string, params: Record<string, string> = {}): Promise<Linha[] | null> {
  if (!persistenciaAtiva) return null;
  const q = new URLSearchParams({ token: TOKEN!, aba, ...params });
  const r = await chamar<{ linhas: Linha[] }>(`${URL_SHEETS}?${q}`, { method: 'GET' });
  return r ? r.linhas : null;
}

export async function salvarTelemetria(t: TelemetriaGateway): Promise<'nova' | 'duplicada'> {
  const chave = `${t.dispositivoId}|${t.ts}`;
  const dupMem = mem.telemetria.has(chave);
  mem.telemetria.set(chave, t);
  if (mem.telemetria.size > 5000) mem.telemetria.delete(mem.telemetria.keys().next().value!);
  mem.cacheTele = undefined;
  const r = await gravar('telemetria', [{ chave, dispositivo_id: t.dispositivoId, ts: t.ts, seq: t.seq ?? '', leituras: t.leituras, recebido_em: t.recebidoEm }]);
  if (r) return r.ignoradas > 0 ? 'duplicada' : 'nova';
  return dupMem ? 'duplicada' : 'nova';
}

/** Lê de uma vez a telemetria recente de todos os dispositivos (cache de 60 s). */
async function telemetriaRecenteTodas(desdeMs: number): Promise<TelemetriaGateway[]> {
  if (mem.cacheTele && Date.now() - mem.cacheTele.em < 60e3) return mem.cacheTele.dados;
  const linhas = await ler('telemetria', { desde: new Date(desdeMs).toISOString(), limite: '1000' });
  let dados: TelemetriaGateway[];
  if (linhas) {
    dados = linhas.flatMap((l) => {
      try {
        const leituras = (typeof l.leituras === 'object' && l.leituras !== null ? l.leituras : JSON.parse(String(l.leituras_json))) as TelemetriaGateway['leituras'];
        const ts = new Date(String(l.ts));
        if (Number.isNaN(ts.getTime())) return [];
        return [{ dispositivoId: String(l.dispositivo_id), ts: ts.toISOString(), seq: l.seq === '' || l.seq == null ? undefined : Number(l.seq), leituras, recebidoEm: String(l.recebido_em ?? '') }];
      } catch {
        return []; // linha corrompida na planilha: ignora
      }
    });
  } else {
    dados = [...mem.telemetria.values()].filter((t) => Date.parse(t.ts) >= desdeMs);
  }
  mem.cacheTele = { em: Date.now(), dados };
  return dados;
}

export async function telemetriaGateway(desdeMs: number): Promise<TelemetriaGateway[]> {
  return (await telemetriaRecenteTodas(desdeMs)).filter((t) => Date.parse(t.ts) >= desdeMs);
}

export async function telemetriaRecente(dispositivoId: string, desdeMs: number): Promise<TelemetriaGateway[]> {
  const todas = await telemetriaRecenteTodas(desdeMs);
  return todas.filter((t) => t.dispositivoId === dispositivoId && Date.parse(t.ts) >= desdeMs).sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function salvarAlertas(alertas: AlertaRegistro[]) {
  const novos = alertas.filter((a) => !mem.alertas.has(a.chave));
  for (const a of novos) mem.alertas.set(a.chave, a);
  if (novos.length) {
    await gravar(
      'alertas',
      novos.map((a) => ({ chave: a.chave, regra: a.regra, severidade: a.severidade, alvo: a.alvo, titulo: a.titulo, mensagem: a.mensagem, acao: a.acao, cenario: a.cenario, criado_em: a.criadoEm })),
    );
  }
  return novos.length;
}

export async function listarAlertas(limite = 50): Promise<AlertaRegistro[]> {
  const linhas = await ler('alertas', { limite: String(limite) });
  if (linhas) {
    return linhas.map((l) => ({ chave: String(l.chave), regra: String(l.regra), severidade: String(l.severidade), alvo: String(l.alvo), titulo: String(l.titulo), mensagem: String(l.mensagem), acao: String(l.acao), cenario: String(l.cenario), criadoEm: new Date(String(l.criado_em)).toISOString() }));
  }
  return [...mem.alertas.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, limite);
}

export async function salvarResumoDiario(resumo: Record<string, string | number | null>) {
  return gravar('resumo_diario', [{ chave: String(resumo.dia), ...resumo }], 'upsert');
}

export async function pingPersistencia() {
  if (!persistenciaAtiva) return { ok: false, motivo: 'SHEETS_WEBAPP_URL/SHEETS_TOKEN não configurados' };
  const ping = await chamar<Record<string, unknown>>(`${URL_SHEETS}?ping=1`, { method: 'GET' });
  if (!ping) return { ok: false, motivo: 'Web App não respondeu ao ping' };
  const leitura = await ler('alertas', { limite: '1' });
  return leitura ? { ok: true, ping, leituraAutenticada: true } : { ok: false, motivo: 'ping ok, mas a leitura autenticada falhou (token?)' };
}
