import { NextResponse } from 'next/server';
import { montarEstado } from '@/lib/estado';
import { salvarAlertas } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cenario = new URL(req.url).searchParams.get('cenario') ?? 'real';
  const estado = await montarEstado(cenario);
  // Registra alertas (deduplicados por regra + alvo + cenário + janela de 1h)
  const janela = new Date(Math.floor(Date.now() / 3600e3) * 3600e3).toISOString();
  await salvarAlertas(
    estado.alertas.map((a) => ({ ...a, chave: `${a.regra}|${a.alvo}|${estado.cenario.id}|${janela}`, cenario: estado.cenario.id, criadoEm: estado.geradoEm })),
  );
  return NextResponse.json(estado, { headers: { 'Cache-Control': 'no-store' } });
}
