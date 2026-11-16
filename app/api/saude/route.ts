// Health check: verifica a persistência (Google Sheets) e as fontes externas.
import { NextResponse } from 'next/server';
import { nomePersistencia, pingPersistencia } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const banco = await pingPersistencia();
  return NextResponse.json({ persistencia: nomePersistencia, banco, em: new Date().toISOString() });
}
