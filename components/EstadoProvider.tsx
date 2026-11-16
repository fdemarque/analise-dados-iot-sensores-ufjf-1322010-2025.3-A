'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Estado } from '@/lib/estado';

type Ctx = {
  estado: Estado | null;
  carregando: boolean;
  /** true quando o estado exibido veio do último acesso (salvo no navegador) e ainda está sendo atualizado */
  doCacheLocal: boolean;
  inicioCarga: number | null;
  /** início da espera atual pela ANA (inclui as novas tentativas) */
  inicioEspera: number | null;
  tentativa: number;
  erro: string | null;
  cenario: string;
  setCenario: (c: string) => void;
  recarregar: () => void;
};
const C = createContext<Ctx | null>(null);
const CHAVE = 'sentinela.cenario';
const SNAP = (c: string) => `sentinela.estado.${c}`;
export const MAX_TENTATIVAS = 4;
export const INTERVALO_MS = 15000;
/** Tempo máximo estimado de espera: 1ª consulta (8 s) + novas tentativas (15 s + 8 s cada) */
export const ESPERA_MAX_S = 8 + MAX_TENTATIVAS * (15 + 8);

function anaPendente(e: Estado) {
  return !e.fontes.ana.ok && e.fontes.ana.erros.some((x) => String(x).includes('não respondeu'));
}

export function EstadoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [doCacheLocal, setDoCacheLocal] = useState(false);
  const [inicioCarga, setInicioCarga] = useState<number | null>(null);
  const [inicioEspera, setInicioEspera] = useState<number | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [cenario, setCenarioSt] = useState<string | null>(null);
  const tentativas = useRef(0);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let c = 'real';
    try { c = localStorage.getItem(CHAVE) ?? 'real'; } catch {}
    setCenarioSt(c);
  }, []);

  const carregar = useCallback(async (c: string) => {
    setCarregando(true);
    setInicioCarga(Date.now());
    setInicioEspera((v) => v ?? Date.now());
    try {
      const r = await fetch(`/api/estado?cenario=${encodeURIComponent(c)}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const novo: Estado = await r.json();
      const pendente = anaPendente(novo);
      const vaiTentarDeNovo = pendente && tentativas.current < MAX_TENTATIVAS;
      // Enquanto a ANA não responde: mantém o dado anterior (se houver) ou segue na tela de carregamento
      setEstado((ant) => (pendente && (vaiTentarDeNovo || ant?.fontes.ana.ok) ? ant : novo));
      if (!pendente) {
        setDoCacheLocal(false);
        try { localStorage.setItem(SNAP(c), JSON.stringify(novo)); } catch {}
        tentativas.current = 0;
        setInicioEspera(null);
      } else if (vaiTentarDeNovo) {
        // A busca na ANA continua no servidor (e abastece o cache); nova tentativa em 15 s
        tentativas.current += 1;
        if (retry.current) clearTimeout(retry.current);
        retry.current = setTimeout(() => carregar(c), INTERVALO_MS);
      } else {
        setInicioEspera(null); // desistiu: exibe o que houver, com o aviso de ANA indisponível
      }
      setTentativa(tentativas.current);
      setErro(null);
    } catch (e) {
      setErro((e as Error).message); // mantém o último estado conhecido na tela
    } finally {
      setCarregando(false);
      setInicioCarga(null);
    }
  }, []);

  useEffect(() => {
    if (cenario === null) return;
    // Exibe imediatamente o último estado salvo neste navegador e atualiza em seguida
    try {
      const s = localStorage.getItem(SNAP(cenario));
      if (s) { setEstado(JSON.parse(s)); setDoCacheLocal(true); } else { setEstado(null); }
    } catch {}
    tentativas.current = 0;
    setTentativa(0);
    setInicioEspera(null);
    carregar(cenario);
    const t = setInterval(() => carregar(cenario), 5 * 60e3);
    return () => { clearInterval(t); if (retry.current) clearTimeout(retry.current); };
  }, [cenario, carregar]);

  const setCenario = (c: string) => {
    try { localStorage.setItem(CHAVE, c); } catch {}
    setCenarioSt(c);
  };

  return (
    <C.Provider value={{ estado, carregando, doCacheLocal, inicioCarga, inicioEspera, tentativa, erro, cenario: cenario ?? 'real', setCenario, recarregar: () => cenario && carregar(cenario) }}>
      {children}
    </C.Provider>
  );
}

export function useEstado() {
  const v = useContext(C);
  if (!v) throw new Error('useEstado fora do provider');
  return v;
}
