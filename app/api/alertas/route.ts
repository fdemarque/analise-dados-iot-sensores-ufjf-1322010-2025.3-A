import { NextResponse } from 'next/server';
import { listarAlertas, nomePersistencia } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ persistencia: nomePersistencia, alertas: await listarAlertas(100) });
}
