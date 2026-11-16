'use client';
import { useEstado } from '@/components/EstadoProvider';
import { GraficoPressao, fmtHora } from '@/components/Graficos';
import { Cabecalho, Carregando, f1, Selo } from '@/components/ui';

export default function Barragens() {
  const { estado: e } = useEstado();
  return (
    <>
      <Cabecalho titulo="Barragens a montante" sub="Nível do reservatório (real, ANA/Setor Elétrico) e instrumentação de comportas (simulada)" e={e} />
      {!e ? <Carregando /> : (
        <>
          <p className="card peq" style={{ marginTop: 0 }}>
            <b>Como ler:</b> a pressão teórica na fundação é calculada pela hidrostática <span className="mono">p = ρ·g·h</span>, onde <span className="mono">h</span> é a altura entre o nível do reservatório e a cota do piezômetro.
            Se a pressão medida se afastar da teórica, pode haver infiltração (subpressão) ou sensor descalibrado. Junto com vibração e carga altas no mecanismo, o sistema trata como risco estrutural (regra R5).
            O NA máximo e a cota do sensor são parâmetros estimados para o protótipo.
          </p>
          <div className="grid g2 secao">
            {e.barragens.map((b) => {
              const sev = b.saude < 50 ? 's-emergencia' : b.saude < 80 ? 's-atencao' : 's-normal';
              return (
                <section key={b.id} className="card">
                  <div className="card-h">
                    <div>
                      <h2>{b.nome}</h2>
                      <p>ANA {b.codigoAna} · chegada em Cataguases ~{b.lagHoras}h</p>
                    </div>
                    <Selo classe={sev}>Saúde {b.saude}/100</Selo>
                  </div>
                  <div className="grid g3" style={{ gap: 10 }}>
                    <div><div className="kpi-rot">Reservatório</div><div className="num" style={{ fontWeight: 700, fontSize: '1.15rem' }}>{f1(b.atual.nivelReservatorioM, 2)} m</div><div className="peq muted">{f1(b.pctNaMax)}% do NA máx.</div></div>
                    <div><div className="kpi-rot">Comporta</div><div className="num" style={{ fontWeight: 700, fontSize: '1.15rem' }}>{f1(b.atual.aberturaPct)}%</div><div className="peq muted">≈ {f1(b.atual.vazaoDescarregadaM3s, 0)} m³/s</div></div>
                    <div><div className="kpi-rot">Pressão</div><div className="num" style={{ fontWeight: 700, fontSize: '1.15rem', color: Math.abs(b.desvioPressaoPct) >= 15 ? 'var(--emergencia)' : undefined }}>{b.desvioPressaoPct > 0 ? '+' : ''}{f1(b.desvioPressaoPct)}%</div><div className="peq muted">{f1(b.atual.pressaoMedidaKpa)} / {f1(b.atual.pressaoTeoricaKpa)} kPa</div></div>
                    <div><div className="kpi-rot">Vibração</div><div className="num" style={{ fontWeight: 700, color: b.atual.vibracaoMmS >= 7.1 ? 'var(--emergencia)' : undefined }}>{f1(b.atual.vibracaoMmS, 2)} mm/s</div></div>
                    <div><div className="kpi-rot">Carga</div><div className="num" style={{ fontWeight: 700, color: b.atual.cargaPctNominal >= 110 ? 'var(--emergencia)' : undefined }}>{f1(b.atual.cargaPctNominal)}%</div></div>
                    <div><div className="kpi-rot">Fontes</div><div className="peq">{b.nivelReal ? <Selo classe="s-real">Nível real</Selo> : <Selo classe="s-sim">Nível típico</Selo>}<br /><Selo classe="s-sim">{b.fonteInstrumentacao === 'gateway' ? 'Gateway' : 'Simulado'}</Selo></div></div>
                  </div>
                  <div style={{ marginTop: 12 }}><GraficoPressao serie={b.serie} /></div>
                  <p className="peq muted" style={{ margin: '6px 0 0' }}>
                    Linha cheia: pressão medida. Tracejada: teórica (ρ·g·h). Área: abertura da comporta (eixo à direita).
                    {b.nivelReal && <> Último nível ANA: {f1(b.nivelReal.m, 2)} m em {fmtHora(b.nivelReal.ts)}.</>}
                  </p>
                </section>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
