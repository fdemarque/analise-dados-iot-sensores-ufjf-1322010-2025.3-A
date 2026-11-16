'use client';
import { useEffect, useState } from 'react';
import { useEstado } from '@/components/EstadoProvider';
import { AlertaItem, Cabecalho, Carregando, ROTULO_SEV, Selo } from '@/components/ui';
import { fmtHora } from '@/components/Graficos';

type Hist = { persistencia: string; alertas: { regra: string; severidade: string; alvo: string; titulo: string; mensagem: string; acao: string; cenario: string; criadoEm: string }[] };

export default function Alertas() {
  const { estado: e } = useEstado();
  const [hist, setHist] = useState<Hist | null>(null);
  useEffect(() => {
    fetch('/api/alertas', { cache: 'no-store' }).then((r) => r.json()).then(setHist).catch(() => setHist(null));
  }, [e?.geradoEm]);
  return (
    <>
      <Cabecalho titulo="Alertas e regras de negócio" sub="Motor de regras SE … ENTÃO …, avaliado a cada atualização dos dados" e={e} />
      {!e ? <Carregando /> : (
        <>
          <section className="card">
            <div className="card-h"><h2>Alertas ativos agora</h2><p>{e.cenario.nome}</p></div>
            {e.alertas.length === 0 ? <p className="muted">Nenhuma regra disparada.</p> : e.alertas.map((a, i) => <AlertaItem key={i} a={a} />)}
          </section>

          <section className="secao">
            <h2>Catálogo de regras e avaliação atual</h2>
            <div className="grid g2">
              {e.regras.map((r) => (
                <article key={r.id} className="card regra">
                  <div className="card-h" style={{ marginBottom: 4 }}>
                    <h3>{r.id} · {r.nome}</h3>
                    {r.disparada ? <Selo classe="s-alerta">Disparada</Selo> : <Selo classe="s-normal">Não disparada</Selo>}
                  </div>
                  <span className="peq muted">{r.categoria}</span>
                  <pre className="mono">{r.formal}</pre>
                  <p className="peq" style={{ margin: '8px 0 0' }}><b>Ação:</b> {r.acao}</p>
                  <p className="peq muted" style={{ margin: '6px 0 0' }}><b>Avaliação:</b> {r.avaliacao}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card secao">
            <div className="card-h"><h2>Histórico de ocorrências</h2><p>persistência: {hist?.persistencia === 'google-sheets' ? 'Google Sheets' : 'memória do servidor (protótipo)'}</p></div>
            {!hist ? <p className="muted">Carregando…</p> : hist.alertas.length === 0 ? <p className="muted">Sem ocorrências registradas.</p> : (
              <div className="tabela-wrap">
                <table>
                  <thead><tr><th>Quando</th><th>Regra</th><th>Severidade</th><th>Alvo</th><th>Ocorrência</th><th>Cenário</th></tr></thead>
                  <tbody>
                    {hist.alertas.map((a, i) => (
                      <tr key={i}><td className="num">{fmtHora(a.criadoEm)}</td><td>{a.regra}</td><td><Selo classe={`s-${a.severidade}`}>{ROTULO_SEV[a.severidade]}</Selo></td><td>{a.alvo}</td><td>{a.titulo}</td><td>{a.cenario}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
