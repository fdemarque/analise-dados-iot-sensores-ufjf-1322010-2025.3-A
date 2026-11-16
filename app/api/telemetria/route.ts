// Endpoint de ingestão para gateways (Node-RED, ESP32, LoRa gateway…).
// Contrato: POST JSON { dispositivo_id, timestamp (ISO 8601), seq?, leituras: { abertura_pct, nivel_reservatorio_m, pressao_kpa, carga_pct, vibracao_mm_s } }
// Aceita também um array (lote) para retransmissão após perda de conexão (store-and-forward).
import { NextResponse } from 'next/server';
import { BARRAGENS } from '@/lib/config';
import { salvarTelemetria } from '@/lib/store';

export const dynamic = 'force-dynamic';

const FAIXAS: Record<string, [number, number]> = {
  abertura_pct: [0, 100],
  nivel_reservatorio_m: [0, 2000],
  pressao_kpa: [0, 2000],
  carga_pct: [0, 300],
  vibracao_mm_s: [0, 100],
};

type Entrada = { dispositivo_id?: unknown; timestamp?: unknown; seq?: unknown; leituras?: unknown };

function validar(e: Entrada) {
  const erros: string[] = [];
  const id = typeof e.dispositivo_id === 'string' ? e.dispositivo_id : '';
  if (!BARRAGENS.some((b) => b.id === id)) erros.push(`dispositivo_id desconhecido: "${id}". Válidos: ${BARRAGENS.map((b) => b.id).join(', ')}`);
  const ts = typeof e.timestamp === 'string' ? Date.parse(e.timestamp) : NaN;
  if (!Number.isFinite(ts)) erros.push('timestamp ausente ou inválido (ISO 8601)');
  else if (ts > Date.now() + 5 * 60e3) erros.push('timestamp no futuro');
  const leituras: Record<string, number | null> = {};
  const quarentena: string[] = [];
  if (typeof e.leituras !== 'object' || e.leituras === null) erros.push('leituras ausente');
  else
    for (const [k, v] of Object.entries(e.leituras as Record<string, unknown>)) {
      if (!(k in FAIXAS)) continue;
      const n = typeof v === 'number' ? v : NaN;
      if (!Number.isFinite(n) || n < FAIXAS[k][0] || n > FAIXAS[k][1]) {
        quarentena.push(`${k}=${JSON.stringify(v)}`);
        leituras[k] = null;
      } else leituras[k] = n;
    }
  return { ok: erros.length === 0, erros, quarentena, id, ts, leituras, seq: typeof e.seq === 'number' ? e.seq : undefined };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: 'JSON malformado (payload corrompido)' }, { status: 400 });
  }
  const itens = (Array.isArray(body) ? body : [body]) as Entrada[];
  if (itens.length > 500) return NextResponse.json({ erro: 'lote máximo: 500 leituras' }, { status: 413 });
  const resultados = [];
  for (const it of itens) {
    const v = validar(it);
    if (!v.ok) {
      resultados.push({ status: 'rejeitada', erros: v.erros });
      continue;
    }
    const st = await salvarTelemetria({ dispositivoId: v.id, ts: new Date(v.ts).toISOString(), seq: v.seq, leituras: Object.fromEntries(Object.entries(v.leituras).filter(([, x]) => x !== null)), recebidoEm: new Date().toISOString() });
    resultados.push({ status: st === 'duplicada' ? 'duplicada_ignorada' : 'aceita', dispositivo_id: v.id, timestamp: new Date(v.ts).toISOString(), quarentena: v.quarentena });
  }
  const aceitas = resultados.filter((r) => r.status === 'aceita').length;
  return NextResponse.json({ recebidas: itens.length, aceitas, resultados }, { status: aceitas || resultados.some((r) => r.status === 'duplicada_ignorada') ? 202 : 422 });
}

export async function GET() {
  return NextResponse.json({
    contrato: {
      metodo: 'POST',
      corpo: { dispositivo_id: BARRAGENS.map((b) => b.id).join(' | '), timestamp: 'ISO 8601', seq: 'número sequencial (opcional)', leituras: { abertura_pct: '0–100', nivel_reservatorio_m: 'cota (m)', pressao_kpa: 'kPa', carga_pct: '% nominal', vibracao_mm_s: 'mm/s RMS' } },
      lote: 'Envie um array para retransmitir leituras acumuladas offline. Duplicatas (dispositivo_id + timestamp) são ignoradas (idempotência).',
    },
  });
}
