'use client';
import { useState } from 'react';
import { useEstado } from '@/components/EstadoProvider';
import { Cabecalho, Selo } from '@/components/ui';
import { CENARIOS } from '@/lib/simulador';

const exemplo = () =>
  JSON.stringify(
    {
      dispositivo_id: 'ivan-botelho-3',
      timestamp: new Date().toISOString(),
      seq: 1042,
      leituras: { abertura_pct: 18.5, nivel_reservatorio_m: 286.2, pressao_kpa: 129.4, carga_pct: 63.2, vibracao_mm_s: 2.1 },
    },
    null,
    2,
  );

export default function Simulador() {
  const { estado, cenario, setCenario, carregando } = useEstado();
  const [corpo, setCorpo] = useState(exemplo);
  const [resp, setResp] = useState<string>('');
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    try {
      const r = await fetch('/api/telemetria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo });
      setResp(`HTTP ${r.status}\n` + JSON.stringify(await r.json(), null, 2));
    } catch (e) {
      setResp('Erro de rede: ' + (e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho titulo="Simulador" sub="Cenários de demonstração e envio manual de telemetria (papel do gateway IoT)" e={estado} />
      <section>
        <h2 style={{ marginBottom: 12 }}>1. Escolha um cenário</h2>
        <div className="grid g3">
          {CENARIOS.map((c) => (
            <button key={c.id} className={`cenario-op ${cenario === c.id ? 'sel' : ''}`} onClick={() => setCenario(c.id)} aria-pressed={cenario === c.id}>
              <b>{c.nome}</b> {cenario === c.id && <Selo classe="s-real">{carregando ? 'carregando…' : 'ativo'}</Selo>}
              <p>{c.descricao}</p>
            </button>
          ))}
        </div>
        <p className="peq muted">O cenário vale apenas para este navegador. Abra o Painel, Barragens ou Alertas para ver as regras reagindo.</p>
      </section>

      <section className="grid g2 secao">
        <div className="card">
          <div className="card-h"><h2>2. Enviar telemetria (POST /api/telemetria)</h2></div>
          <p className="peq muted" style={{ marginTop: 0 }}>
            Simula um gateway (ESP32/Node-RED) publicando leituras da instrumentação de uma comporta. Teste também os casos de resiliência: repetir o mesmo timestamp (idempotência),
            enviar um valor fora de faixa (quarentena), JSON quebrado (payload corrompido) ou um <i>array</i> com várias leituras (retransmissão em lote).
          </p>
          <textarea value={corpo} onChange={(ev) => setCorpo(ev.target.value)} spellCheck={false} aria-label="Corpo JSON" />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn prim" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar'}</button>
            <button className="btn" onClick={() => setCorpo(exemplo())}>Novo timestamp</button>
            <button className="btn" onClick={() => setCorpo(corpo.replace(/"pressao_kpa": [\d.]+/, '"pressao_kpa": -999'))}>Corromper pressão</button>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><h2>Resposta do servidor</h2></div>
          <pre className="mono" style={{ background: 'var(--surface-2)', borderRadius: 8, padding: 12, minHeight: 220 }}>{resp || 'A resposta aparece aqui.'}</pre>
          <p className="peq muted">
            No cenário &quot;Dados reais&quot;, leituras aceitas nas últimas 6h substituem as simuladas da barragem correspondente (aba Barragens, selo &quot;Gateway&quot;).
            Com SHEETS_WEBAPP_URL e SHEETS_TOKEN configurados, as leituras ficam salvas na planilha (Google Sheets).
          </p>
        </div>
      </section>

      <section className="card secao">
        <h2>3. Node-RED (opcional)</h2>
        <p style={{ marginBottom: 0 }}>
          O repositório inclui <span className="mono">nodered/fluxo-sentinela.json</span>: um fluxo com nós <i>Inject</i> que gera leituras de comporta a cada minuto, aplica a regra de desvio de pressão
          localmente (edge) e envia para <span className="mono">/api/telemetria</span>, com fila de retransmissão quando a conexão cai. Importe pelo menu Import do Node-RED e ajuste a URL.
        </p>
      </section>
    </>
  );
}
