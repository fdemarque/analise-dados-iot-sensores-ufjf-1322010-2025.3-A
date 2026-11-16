// Camada de ingestão: busca dados REAIS em APIs públicas (ANA e Open-Meteo).
import { SUB_BACIAS } from './config';

export type Leitura = { ts: string; nivelCm: number | null; vazao: number | null; chuvaMm: number | null };

const ANA_URL = 'https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos';

function fmt(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function num(v: string | undefined): number | null {
  if (v === undefined || v.trim() === '') return null;
  const n = Number(v.trim());
  return Number.isFinite(n) ? n : null;
}

/** Converte "2026-11-15 20:00:00" (horário de Brasília) em ISO UTC. */
function tsAna(s: string): string {
  return new Date(s.trim().replace(' ', 'T') + '-03:00').toISOString();
}

export function parseAnaXml(xml: string): Leitura[] {
  const blocos = xml.match(/<DadosHidrometereologicos[\s\S]*?<\/DadosHidrometereologicos>/g) ?? [];
  const out: Leitura[] = [];
  for (const b of blocos) {
    const campo = (tag: string) => {
      const m = b.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1] : undefined;
    };
    const dh = campo('DataHora');
    if (!dh) continue;
    out.push({ ts: tsAna(dh), nivelCm: num(campo('Nivel')), vazao: num(campo('Vazao')), chuvaMm: num(campo('Chuva')) });
  }
  return out.sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function buscarAna(codigo: string, dias = 3): Promise<{ ok: boolean; leituras: Leitura[]; erro?: string }> {
  const fim = new Date(Date.now() + 24 * 3600e3);
  const ini = new Date(Date.now() - dias * 24 * 3600e3);
  const url = `${ANA_URL}?codEstacao=${codigo}&dataInicio=${fmt(ini)}&dataFim=${fmt(fim)}`;
  try {
    const r = await fetch(url, { next: { revalidate: 600 }, signal: AbortSignal.timeout(45000) });
    if (!r.ok) return { ok: false, leituras: [], erro: `HTTP ${r.status}` };
    return { ok: true, leituras: parseAnaXml(await r.text()) };
  } catch (e) {
    return { ok: false, leituras: [], erro: (e as Error).message };
  }
}

export type PrevisaoBacia = {
  id: string;
  nome: string;
  horas: { ts: string; mm: number }[]; // passado 72h + próximas 96h
};

export async function buscarPrevisao(): Promise<{ ok: boolean; bacias: PrevisaoBacia[]; erro?: string }> {
  const lat = SUB_BACIAS.map((b) => b.lat).join(',');
  const lon = SUB_BACIAS.map((b) => b.lon).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation&past_days=3&forecast_days=4&timezone=UTC`;
  try {
    const r = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return { ok: false, bacias: [], erro: `HTTP ${r.status}` };
    const j = await r.json();
    const arr = Array.isArray(j) ? j : [j];
    const bacias = SUB_BACIAS.map((b, i) => {
      const h = arr[i]?.hourly ?? { time: [], precipitation: [] };
      return {
        id: b.id,
        nome: b.nome,
        horas: (h.time as string[]).map((t, k) => ({ ts: new Date(t + 'Z').toISOString(), mm: Number(h.precipitation[k] ?? 0) || 0 })),
      };
    });
    return { ok: true, bacias };
  } catch (e) {
    return { ok: false, bacias: [], erro: (e as Error).message };
  }
}
