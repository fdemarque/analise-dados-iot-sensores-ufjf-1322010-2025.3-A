// Persistência: Google Sheets (Apps Script Web App) quando configurado; caso contrário, memória do processo.
// Escritas são idempotentes pela coluna "chave" (suporta retransmissão de dados).
// Contrato do Web App: veja docs/apps-script.gs.

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

type Linha = Record<string, string | number | null>;

/** Chamada ao Web App. Falha de banco não derruba a aplicação (degradação graciosa). */
async function sheets<T = unknown>(corpo: Record<string, unknown>): Promise<T | null> {
  if (!persistenciaAtiva) return null;
  try {
    const r = await fetch(URL_SHEETS!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight; o Apps Script lê postData.contents
      body: JSON.stringify({ token: TOKEN, ...corpo }),
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.ok ? (j as T) : null;
  } catch {
    return null;
  }
}

export async function salvarTelemetria(t: TelemetriaGateway): Promise<'nova' | 'duplicada'> {
  const chave = `${t.dispositivoId}|${t.ts}`;
  const dupMem = mem.telemetria.has(chave);
  mem.telemetria.set(chave, t);
  if (mem.telemetria.size > 5000) mem.telemetria.delete(mem.telemetria.keys().next().value!);
  mem.cacheTele = undefined;
  const r = await sheets<{ inseridas: number; ignoradas: number }>({
    acao: 'upsert',
    aba: 'telemetria',
    modo: 'ignorar',
    linhas: [{ chave, dispositivo_id: t.dispositivoId, ts: t.ts, seq: t.seq ?? '', leituras_json: JSON.stringify(t.leituras), recebido_em: t.recebidoEm }],
  });
  if (r) return r.ignoradas > 0 ? 'duplicada' : 'nova';
  return dupMem ? 'duplicada' : 'nova';
}

/** Lê de uma vez a telemetria recente de todos os dispositivos (cache de 60 s). */
async function telemetriaRecenteTodas(desdeMs: number): Promise<TelemetriaGateway[]> {
  if (mem.cacheTele && Date.now() - mem.cacheTele.em < 60e3) return mem.cacheTele.dados;
  const r = await sheets<{ linhas: Linha[] }>({ acao: 'listar', aba: 'telemetria', desde: { campo: 'ts', valor: new Date(desdeMs).toISOString() }, limite: 1000 });
  let dados: TelemetriaGateway[];
  if (r) {
    dados = r.linhas.flatMap((l) => {
      try {
        return [{ dispositivoId: String(l.dispositivo_id), ts: new Date(String(l.ts)).toISOString(), seq: l.seq === '' || l.seq === null ? undefined : Number(l.seq), leituras: JSON.parse(String(l.leituras_json)), recebidoEm: String(l.recebido_em) }];
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

export async function telemetriaRecente(dispositivoId: string, desdeMs: number): Promise<TelemetriaGateway[]> {
  const todas = await telemetriaRecenteTodas(desdeMs);
  return todas.filter((t) => t.dispositivoId === dispositivoId && Date.parse(t.ts) >= desdeMs).sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function salvarAlertas(alertas: AlertaRegistro[]) {
  const novos = alertas.filter((a) => !mem.alertas.has(a.chave));
  for (const a of novos) mem.alertas.set(a.chave, a);
  if (novos.length) {
    await sheets({
      acao: 'upsert',
      aba: 'alertas',
      modo: 'ignorar',
      linhas: novos.map((a) => ({ chave: a.chave, regra: a.regra, severidade: a.severidade, alvo: a.alvo, titulo: a.titulo, mensagem: a.mensagem, acao: a.acao, cenario: a.cenario, criado_em: a.criadoEm })),
    });
  }
  return novos.length;
}

export async function listarAlertas(limite = 50): Promise<AlertaRegistro[]> {
  const r = await sheets<{ linhas: Linha[] }>({ acao: 'listar', aba: 'alertas', ordem: { campo: 'criado_em', direcao: 'desc' }, limite });
  if (r) {
    return r.linhas.map((l) => ({ chave: String(l.chave), regra: String(l.regra), severidade: String(l.severidade), alvo: String(l.alvo), titulo: String(l.titulo), mensagem: String(l.mensagem), acao: String(l.acao), cenario: String(l.cenario), criadoEm: new Date(String(l.criado_em)).toISOString() }));
  }
  return [...mem.alertas.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, limite);
}

export async function salvarResumoDiario(resumo: Record<string, string | number | null>) {
  return sheets({ acao: 'upsert', aba: 'resumo_diario', modo: 'substituir', linhas: [{ chave: String(resumo.dia), ...resumo }] });
}

export async function pingPersistencia() {
  if (!persistenciaAtiva) return { ok: false, motivo: 'SHEETS_WEBAPP_URL/SHEETS_TOKEN não configurados' };
  const r = await sheets<{ abas: string[] }>({ acao: 'ping' });
  return r ? { ok: true, abas: r.abas } : { ok: false, motivo: 'Web App não respondeu ou token inválido' };
}
