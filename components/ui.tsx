'use client';
import type { Estado } from '@/lib/estado';
import { fmtHora } from './Graficos';

export const ROTULO_SEV: Record<string, string> = { info: 'Informativo', atencao: 'Atenção', alerta: 'Alerta', emergencia: 'Emergência' };
export const CLASSE_NIVEL: Record<string, string> = { NORMAL: 's-normal', 'ATENÇÃO': 's-atencao', ALERTA: 's-alerta', 'EMERGÊNCIA': 's-emergencia' };

export const f1 = (v: number | null | undefined, d = 1) => (v === null || v === undefined ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: 0 }));

export function Selo({ classe, children }: { classe: string; children: React.ReactNode }) {
  return <span className={`selo ${classe}`}>{children}</span>;
}

export function StatusSensor({ s }: { s: string }) {
  const r: Record<string, string> = { online: 'Online', offline: 'Offline', sem_dados: 'Sem dados' };
  return <Selo classe={`s-${s}`}>{r[s] ?? s}</Selo>;
}

export function AlertaItem({ a, quando }: { a: Estado['alertas'][number]; quando?: string }) {
  return (
    <article className={`alerta-item sv-${a.severidade}`}>
      <header>
        <Selo classe={`s-${a.severidade}`}>{ROTULO_SEV[a.severidade]}</Selo>
        <b>{a.titulo}</b>
        <span className="muted peq">· {a.regra} · {a.alvo}{quando ? ` · ${fmtHora(quando)}` : ''}</span>
      </header>
      <p>{a.mensagem}</p>
      <p className="acao">Ação do software: {a.acao}</p>
    </article>
  );
}

export function Carregando() {
  return (
    <div className="grid g3" aria-busy="true">
      <div className="esqueleto span2" /><div className="esqueleto" />
      <div className="esqueleto" /><div className="esqueleto" /><div className="esqueleto" />
    </div>
  );
}

export function Gauge({ valor, nivel }: { valor: number; nivel: string }) {
  const r = 54, c = 2 * Math.PI * r, arco = 0.75;
  const cor = nivel === 'EMERGÊNCIA' ? 'var(--emergencia)' : nivel === 'ALERTA' ? 'var(--alerta)' : nivel === 'ATENÇÃO' ? 'var(--atencao)' : 'var(--ok)';
  return (
    <div className="gauge" role="img" aria-label={`Índice de risco ${valor} de 100, ${nivel}`}>
      <svg viewBox="0 0 132 132" width="132" height="132">
        <g transform="rotate(135 66 66)">
          <circle cx="66" cy="66" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" strokeDasharray={`${c * arco} ${c}`} strokeLinecap="round" />
          <circle cx="66" cy="66" r={r} fill="none" stroke={cor} strokeWidth="12" strokeDasharray={`${c * arco * (valor / 100)} ${c}`} strokeLinecap="round" />
        </g>
      </svg>
      <div className="gauge-num"><div><b className="num">{valor}</b><span>{nivel}</span></div></div>
    </div>
  );
}

export function Cabecalho({ titulo, sub, e }: { titulo: string; sub: string; e?: Estado | null }) {
  return (
    <div className="pagina-titulo">
      <div>
        <h1>{titulo}</h1>
        <p>{sub}</p>
      </div>
      {e && (
        <div className="peq muted" style={{ textAlign: 'right' }}>
          Atualizado em {fmtHora(e.geradoEm)}
          <br />
          ANA: <b style={{ color: e.fontes.ana.ok ? 'var(--ok)' : 'var(--emergencia)' }}>{e.fontes.ana.ok ? 'conectada' : 'falha parcial'}</b> · Previsão:{' '}
          <b style={{ color: e.fontes.meteo.ok ? 'var(--ok)' : 'var(--emergencia)' }}>{e.fontes.meteo.ok ? 'conectada' : 'indisponível'}</b>
        </div>
      )}
    </div>
  );
}
