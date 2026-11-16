import { after, NextResponse } from 'next/server';
import { montarEstado } from '@/lib/estado';
import { salvarAlertas } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const cenario = new URL(req.url).searchParams.get('cenario') ?? 'real';
  const estado = await montarEstado(cenario);
  // Registra alertas (deduplicados por regra + alvo + cenário + janela de 1h)
  const janela = new Date(Math.floor(Date.now() / 3600e3) * 3600e3).toISOString();
  // Gravação em segundo plano: não atrasa a resposta ao navegador
  after(() =>
    salvarAlertas(
      // R7 causado por lentidão da própria ANA não é falha de sensor: não registra
      estado.alertas.filter((a) => estado.fontes.ana.ok || a.regra !== 'R7').map((a) => ({ ...a, chave: `${a.regra}|${a.alvo}|${estado.cenario.id}|${janela}`, cenario: estado.cenario.id, criadoEm: estado.geradoEm })),
    ).then(() => undefined),
  );
  return NextResponse.json(estado, { headers: { 'Cache-Control': 'no-store' } });
}
