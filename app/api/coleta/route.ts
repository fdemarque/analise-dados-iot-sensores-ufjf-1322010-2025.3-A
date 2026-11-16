// Job agendado: coleta as fontes, avalia as regras e persiste o consolidado diário.
// Disparado pelo Vercel Cron (diário) e pelo GitHub Actions (a cada 15 min).
import { NextResponse } from 'next/server';
import { montarEstado } from '@/lib/estado';
import { salvarAlertas, salvarResumoDiario, nomePersistencia } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const e = await montarEstado('real');
  const janela = new Date(Math.floor(Date.now() / 3600e3) * 3600e3).toISOString();
  const novos = await salvarAlertas(e.alertas.map((a) => ({ ...a, chave: `${a.regra}|${a.alvo}|real|${janela}`, cenario: 'real', criadoEm: e.geradoEm })));
  const niveis = e.alvo.serie.filter((s) => s.qualidade === 'ok' && s.nivelCm !== null && Date.parse(s.ts) >= Date.now() - 24 * 3600e3).map((s) => s.nivelCm!);
  const dia = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  await salvarResumoDiario({
    dia,
    nivel_min_cm: niveis.length ? Math.min(...niveis) : null,
    nivel_max_cm: niveis.length ? Math.max(...niveis) : null,
    nivel_medio_cm: niveis.length ? Math.round((niveis.reduce((s, n) => s + n, 0) / niveis.length) * 10) / 10 : null,
    pico_projetado_cm: e.pico ? Math.round(e.pico.nivelCm) : null,
    chuva_72h_mm: e.chuvaBacia.passado72h,
    chuva_prevista_24h_mm: e.chuvaBacia.prox24h,
    indice_risco: e.risco.indice,
    atualizado_em: e.geradoEm,
  });
  return NextResponse.json({ ok: true, persistencia: nomePersistencia, alertasNovos: novos, risco: e.risco, pico: e.pico, fontes: e.fontes });
}
