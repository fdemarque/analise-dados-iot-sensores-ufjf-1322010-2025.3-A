'use client';
import { useEffect, useState } from 'react';
import type { Estado } from '@/lib/estado';
import { ESPERA_MAX_S, MAX_TENTATIVAS, useEstado } from './EstadoProvider';
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
  return <TelaCarregando />;
}

/** Tela de carregamento com feedback sobre as fontes consultadas. */
export function TelaCarregando() {
  const { inicioEspera, tentativa } = useEstado();
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const seg = inicioEspera ? Math.max(0, Math.floor((agora - inicioEspera) / 1000)) : 0;
  const restante = Math.max(0, ESPERA_MAX_S - seg);
  const pct = Math.min(96, Math.round((seg / ESPERA_MAX_S) * 100));
  const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`);
  const etapas = [
    { t: 'Estações do Rio Pomba', d: 'Cataguases, Astolfo Dutra, Barra do Xopotó e Guarani: nível, vazão e chuva' },
    { t: 'Reservatórios das barragens a montante', d: 'CGH Ituerê e PCHs Ivan Botelho I, II, III e Zé Tunin' },
    { t: 'Previsão do tempo', d: 'Chuva hora a hora em 5 sub-bacias (Open-Meteo)' },
    { t: 'Projeção e regras', d: 'Nível previsto para 72 h e avaliação dos alertas' },
  ];
  return (
    <section className="carga" role="status" aria-live="polite">
      <div className="carga-icone" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <path className="onda o1" d="M4 34c7-6 14-6 21 0s14 6 21 0 11-5 14-3" />
          <path className="onda o2" d="M4 44c7-6 14-6 21 0s14 6 21 0 11-5 14-3" />
          <path className="seta" d="M32 6v16M25 15l7 7 7-7" />
        </svg>
      </div>
      <h1>Trazendo os dados da ANA</h1>
      <p className="carga-sub">
        A <b>ANA (Agência Nacional de Águas e Saneamento Básico)</b> é o órgão federal que opera a rede de estações que medem o nível,
        a vazão e a chuva dos rios brasileiros. As estações do Rio Pomba publicam uma leitura a cada 15 minutos, e é a partir delas que o
        sistema calcula o risco de cheia em Cataguases.
      </p>
      <ol className="carga-etapas">
        {etapas.map((e) => (
          <li key={e.t}><span className="spin" aria-hidden="true" /><div><b>{e.t}</b><span>{e.d}</span></div></li>
        ))}
      </ol>
      <div className="carga-prog" role="progressbar" aria-valuemin={0} aria-valuemax={ESPERA_MAX_S} aria-valuenow={seg} aria-label="Tempo de espera">
        <i style={{ width: `${pct}%` }} />
      </div>
      <p className="carga-tempo num">
        Aguardando há <b>{fmt(seg)}</b> · tempo estimado restante: <b>até {fmt(restante)}</b>
        {tentativa > 0 && <> · tentativa {tentativa + 1} de {MAX_TENTATIVAS + 1}</>}
      </p>
      {tentativa > 0 && (
        <p className="carga-nota">
          O servidor da ANA está demorando para responder ou está fora do ar no momento. O sistema continua tentando; se a ANA não responder
          dentro do tempo estimado, o painel abre com a previsão do tempo e os últimos dados disponíveis, sinalizando a indisponibilidade.
        </p>
      )}
    </section>
  );
}

/** Aviso discreto enquanto os dados exibidos (salvos do último acesso) são atualizados. */
export function AvisoAtualizando() {
  const { carregando, doCacheLocal, estado } = useEstado();
  const anaPendente = estado && !estado.fontes.ana.ok;
  if (!estado || !(carregando || doCacheLocal || anaPendente)) return null;
  return (
    <div className="aviso-atual" role="status" aria-live="polite">
      <span className="spin" aria-hidden="true" />
      <span>
        <b>Trazendo os dados da ANA…</b>{' '}
        {doCacheLocal ? 'Mostrando o último estado salvo neste navegador até a atualização terminar.' : anaPendente ? 'A ANA não está respondendo no momento; as leituras do rio podem estar ausentes ou defasadas. Nova tentativa automática a cada 5 minutos.' : 'Atualizando as leituras.'}
      </span>
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
    <>
    <AvisoAtualizando />
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
    </>
  );
}
