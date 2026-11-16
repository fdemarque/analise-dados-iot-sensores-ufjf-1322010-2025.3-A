'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Estado } from '@/lib/estado';

type Ctx = { estado: Estado | null; carregando: boolean; erro: string | null; cenario: string; setCenario: (c: string) => void; recarregar: () => void };
const C = createContext<Ctx | null>(null);
const CHAVE = 'sentinela.cenario';

export function EstadoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [cenario, setCenarioSt] = useState<string | null>(null);

  useEffect(() => {
    let c = 'real';
    try { c = localStorage.getItem(CHAVE) ?? 'real'; } catch {}
    setCenarioSt(c);
  }, []);

  const carregar = useCallback(async (c: string) => {
    setCarregando(true);
    try {
      const r = await fetch(`/api/estado?cenario=${encodeURIComponent(c)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setEstado(await r.json());
      setErro(null);
    } catch (e) {
      setErro((e as Error).message); // mantém o último estado conhecido na tela
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (cenario === null) return;
    carregar(cenario);
    const t = setInterval(() => carregar(cenario), 5 * 60e3);
    return () => clearInterval(t);
  }, [cenario, carregar]);

  const setCenario = (c: string) => {
    try { localStorage.setItem(CHAVE, c); } catch {}
    setCenarioSt(c);
  };

  return <C.Provider value={{ estado, carregando, erro, cenario: cenario ?? 'real', setCenario, recarregar: () => cenario && carregar(cenario) }}>{children}</C.Provider>;
}

export function useEstado() {
  const v = useContext(C);
  if (!v) throw new Error('useEstado fora do provider');
  return v;
}
