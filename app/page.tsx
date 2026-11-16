'use client';
import Link from 'next/link';
import { useEstado } from '@/components/EstadoProvider';
import { GraficoChuva, GraficoNivel, fmtHora } from '@/components/Graficos';
import { AlertaItem, Cabecalho, Carregando, CLASSE_NIVEL, f1, Gauge, Selo, StatusSensor } from '@/components/ui';

export default function Painel() {
  const { estado: e, erro } = useEstado();
  if (!e) return (<><Cabecalho titulo="Painel de Cataguases" sub="Rio Pomba, afluentes, barragens a montante e previsão do tempo" />{erro ? <p>Falha ao carregar: {erro}</p> : <Carregando />}</>);
  const c = e.alvo.cotas!;
  const n = e.alvo.atual?.nivelCm ?? null;
  const posRegua = n === null ? 0 : Math.min(100, (n / c.inundacao) * 100);
  return (
    <>
      <Cabecalho titulo="Painel de Cataguases" sub="Rio Pomba, afluentes, barragens a montante e previsão do tempo" e={e} />
      {erro && <p className="card peq" style={{ borderColor: 'var(--alerta)' }}>Não foi possível atualizar ({erro}). Mostrando o último estado conhecido.</p>}

      <section className={`card risco n-${e.risco.nivel}`}>
        <Gauge valor={e.risco.indice} nivel={e.risco.nivel} />
        <div>
          <div className="card-h" style={{ marginBottom: 0 }}>
            <h2>Índice de risco de cheia: <Selo classe={CLASSE_NIVEL[e.risco.nivel]}>{e.risco.nivel}</Selo></h2>
            <span className="peq muted">{e.alertas.filter((a) => a.severidade !== 'info').length} alerta(s) ativo(s)</span>
          </div>
          <ul className="insights">{e.insights.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>

      <section className="grid g4 secao">
        <div className="card">
          <div className="kpi-rot">Nível em Cataguases</div>
          <div className="kpi-val">{f1(n, 0)}<small>cm</small></div>
          <div className="regua" aria-hidden="true"><i style={{ left: `${posRegua}%` }} /></div>
          <div className="kpi-sub">{e.alvo.atual ? `Leitura das ${fmtHora(e.alvo.atual.ts)}` : 'sem leitura'} · <StatusSensor s={e.alvo.status} /></div>
        </div>
        <div className="card">
          <div className="kpi-rot">Pico projetado (72h)</div>
          <div className="kpi-val">{f1(e.pico?.nivelCm, 0)}<small>cm</small></div>
          <div className="kpi-sub">{e.pico ? `em ~${e.pico.horas}h (${fmtHora(e.pico.ts)})` : '—'}</div>
          <div className="kpi-sub">
            {e.cruzamentos.inundacao ? <>Inundação prevista: <b>{fmtHora(e.cruzamentos.inundacao)}</b></> : e.cruzamentos.alerta ? <>Cota de alerta prevista: <b>{fmtHora(e.cruzamentos.alerta)}</b></> : e.cruzamentos.atencao ? <>Cota de atenção prevista: <b>{fmtHora(e.cruzamentos.atencao)}</b></> : 'Sem previsão de cruzar as cotas'}
          </div>
        </div>
        <div className="card">
          <div className="kpi-rot">Chuva prevista na bacia</div>
          <div className="kpi-val">{f1(e.chuvaBacia.prox24h)}<small>mm / 24h</small></div>
          <div className="kpi-sub">{f1(e.chuvaBacia.prox72h)} mm em 72h (média ponderada por área)</div>
        </div>
        <div className="card">
          <div className="kpi-rot">Chuva antecedente</div>
          <div className="kpi-val">{f1(e.chuvaBacia.passado72h)}<small>mm / 72h</small></div>
          <div className="kpi-sub">Solo {e.chuvaBacia.passado72h >= 60 ? 'saturado' : e.chuvaBacia.passado72h >= 30 ? 'úmido' : 'seco'}. Quanto mais úmido, mais a chuva vira escoamento.</div>
        </div>
      </section>

      <section className="card secao">
        <div className="card-h">
          <h2>Rio Pomba em Cataguases: observado e projetado</h2>
          <div className="legenda">
            <span><i style={{ background: 'var(--chart-obs)' }} />Observado (ANA 58770000)</span>
            <span><i style={{ background: 'var(--chart-proj)' }} />Projeção</span>
            <span><i style={{ background: 'var(--chart-band)', height: 10 }} />Incerteza</span>
          </div>
        </div>
        <GraficoNivel e={e} />
        <p className="peq muted" style={{ margin: '8px 0 0' }}>
          Cotas de referência oficiais do SGB/CPRM (SAH-Pomba). Maior cheia registrada: {c ? '985 cm em 18/12/2008' : ''}. A projeção converte a vazão em cota pela curva-chave oficial da estação.
        </p>
      </section>

      <section className="grid g2 secao">
        <div className="card">
          <div className="card-h"><h2>Alertas ativos</h2><Link href="/alertas" className="peq">Ver regras →</Link></div>
          {e.alertas.length === 0 ? <p className="muted">Nenhuma regra disparada. Situação normal.</p> : e.alertas.slice(0, 4).map((a, i) => <AlertaItem key={i} a={a} />)}
        </div>
        <div className="card">
          <div className="card-h"><h2>Estações a montante</h2><p>propagação até Cataguases</p></div>
          <div className="tabela-wrap">
            <table>
              <thead><tr><th>Estação</th><th className="n">Nível</th><th className="n">cm/h</th><th className="n">Chega em</th><th>Status</th></tr></thead>
              <tbody>
                {e.montante.map((m) => (
                  <tr key={m.id}>
                    <td><b>{m.nome}</b><div className="peq muted">{m.rio} · {m.codigoAna}</div></td>
                    <td className="n">{f1(m.atual?.nivelCm, 0)} cm<div className="peq muted">alerta {m.cotas?.alerta}</div></td>
                    <td className="n">{m.taxa1h === null ? '—' : (m.taxa1h > 0 ? '+' : '') + f1(m.taxa1h)}</td>
                    <td className="n">~{m.lagHoras}h</td>
                    <td><StatusSensor s={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>Previsão de chuva por sub-bacia (próximas 72h)</h2><p>Open-Meteo, mm/h</p></div>
        <GraficoChuva e={e} />
        <div className="tabela-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead><tr><th>Sub-bacia</th><th className="n">Últimas 72h</th><th className="n">Próx. 3h</th><th className="n">Próx. 24h</th><th className="n">Próx. 72h</th><th className="n">Coef. escoamento</th><th>Monitoramento</th></tr></thead>
            <tbody>
              {e.chuva.map((b) => (
                <tr key={b.id}>
                  <td>{b.nome}</td>
                  <td className="n">{f1(b.passado72h)} mm</td><td className="n">{f1(b.prox3h)} mm</td><td className="n">{f1(b.prox24h)} mm</td><td className="n">{f1(b.prox72h)} mm</td><td className="n">{f1(b.coef, 2)}</td>
                  <td>{b.temEstacao ? <Selo classe="s-real">Estação fluvial</Selo> : <Selo classe="s-sim">Estimado por chuva</Selo>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>O que move a projeção</h2><p>variação de vazão (m³/s) em Cataguases atribuída a cada fonte</p></div>
        <div className="tabela-wrap">
          <table>
            <thead><tr><th>Fonte</th><th className="n">+6h</th><th className="n">+12h</th><th className="n">+24h</th><th className="n">+48h</th></tr></thead>
            <tbody>
              {e.contribuicoes.map((c) => (
                <tr key={c.fonte}><td>{c.fonte}</td>{[c.q6, c.q12, c.q24, c.q48].map((v, i) => <td key={i} className="n" style={{ color: v > 0 ? 'var(--alerta)' : v < 0 ? 'var(--ok)' : undefined }}>{v > 0 ? '+' : ''}{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
