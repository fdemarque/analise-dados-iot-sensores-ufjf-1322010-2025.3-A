import { CHEIAS_HISTORICAS } from '@/lib/config';

const DICIONARIO = [
  ['Nível do rio (cota)', 'Estações ANA 58770000, 58735000, 58736000, 58730001', 'cm', '15 min', 'float', 'Real'],
  ['Vazão', 'Estações ANA (curva-chave)', 'm³/s', '15 min', 'float', 'Real'],
  ['Chuva observada', 'Pluviômetros das estações ANA', 'mm', '15 min', 'float', 'Real'],
  ['Nível do reservatório', 'Barramentos ANA (Setor Elétrico): Ituerê, Ivan Botelho I/II/III, Zé Tunin', 'm (cota)', 'diário (00h)', 'float', 'Real'],
  ['Chuva prevista horária', 'Open-Meteo, 5 sub-bacias', 'mm/h', '1 h (atualização 30 min)', 'float', 'Real'],
  ['Abertura da comporta', 'Encoder/transdutor de posição', '%', '15 min (1 min em manobra)', 'float', 'Simulado'],
  ['Pressão na fundação', 'Piezômetro de corda vibrante', 'kPa', '15 min', 'float', 'Simulado'],
  ['Carga no mecanismo', 'Célula de carga (strain gauge)', '% nominal', '15 min', 'float', 'Simulado'],
  ['Vibração estrutural', 'Acelerômetro MEMS (RMS)', 'mm/s', '15 min', 'float', 'Simulado'],
  ['Sensor online', 'Heartbeat/última leitura', '—', 'derivado', 'boolean', 'Derivado'],
  ['Qualidade da leitura', 'Saneamento (R8)', 'ok | nulo | fora_faixa | salto', 'por leitura', 'enum', 'Derivado'],
];

const RISCOS = [
  ['Sensor offline', 'R7: depois de 240 min sem leitura válida o gêmeo digital fica OFFLINE (nunca aparece "normal" sem dado). A projeção troca Astolfo Dutra por Guarani (redundância) e amplia a faixa de incerteza.'],
  ['Perda de conexão do gateway', 'O gateway guarda as leituras em fila local (store-and-forward) e retransmite em lote (array) no POST /api/telemetria quando a conexão volta. O timestamp vem do sensor, não da chegada.'],
  ['Retransmissão e duplicatas', 'Ingestão idempotente pela chave natural (dispositivo_id + timestamp): o Web App da planilha ignora chaves que já existem, com LockService contra escritas concorrentes. Alertas também são deduplicados (regra + alvo + janela de 1h).'],
  ['Dados nulos ou corrompidos', 'R8: valores nulos, fora da faixa física [0, 1500] cm ou com salto acima de 100 cm em 15 min vão para quarentena e saem dos cálculos. JSON inválido retorna HTTP 400 e campos fora de faixa ficam nulos.'],
  ['Fonte externa indisponível (ANA / Open-Meteo)', 'As chamadas rodam em paralelo com timeout. A falha de uma fonte não derruba as outras, cada resposta fica em cache (10 e 30 min) e o painel mostra o último estado conhecido com o selo da fonte.'],
  ['Banco indisponível', 'Degradação graciosa: o sistema continua avaliando as regras em memória e os erros de escrita não interrompem o fluxo.'],
  ['Falso positivo e falso negativo', 'As regras combinam várias evidências (R2 exige projeção E chuva; R5 exige desvio persistente em 3 leituras). Os limiares ficam em lib/config.ts e as cotas são as oficiais do SGB.'],
  ['Atraso da telemetria ANA', 'A ANA publica com atraso típico de 1 a 3h. Por isso o limiar de offline é maior e a projeção parte do timestamp da última leitura, não do relógio do servidor.'],
];

function Diagrama() {
  const caixas = [
    { x: 10, t: 'Sensores / Gateway', s: ['Réguas e radares ANA', 'Pluviômetros', 'Instrum. comportas', 'ESP32 / Node-RED'] },
    { x: 205, t: 'Protocolo / Broker', s: ['HTTP/REST (ANA, POST)', 'MQTT (produção)', 'TLS + token', 'JSON'] },
    { x: 400, t: 'Middleware', s: ['Validação (R8)', 'Curva-chave Q↔H', 'Modelo de projeção', 'Motor de regras R1–R8'] },
    { x: 595, t: 'Banco de dados', s: ['Google Sheets (Apps Script)', 'telemetria', 'alertas', 'resumo_diario'] },
    { x: 790, t: 'Aplicação Web', s: ['Painel / Barragens', 'Alertas / Regras', 'Simulador', 'Webhook Defesa Civil'] },
  ];
  return (
    <svg className="diagrama" viewBox="0 0 975 250" role="img" aria-label="Fluxo end-to-end: sensores, protocolo, middleware, banco de dados e aplicação web">
      <defs>
        <marker id="seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--muted)" /></marker>
      </defs>
      {caixas.map((c, i) => (
        <g key={c.t}>
          <rect x={c.x} y={20} width={175} height={170} rx={12} fill="var(--surface-2)" stroke="var(--border)" />
          <rect x={c.x} y={20} width={175} height={38} rx={12} fill="var(--accent-soft)" />
          <text x={c.x + 87.5} y={44} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--accent)">{c.t}</text>
          {c.s.map((s, k) => <text key={s} x={c.x + 14} y={84 + k * 26} fontSize="12.5" fill="var(--text)">• {s}</text>)}
          {i < caixas.length - 1 && <line x1={c.x + 177} y1={105} x2={c.x + 203} y2={105} stroke="var(--muted)" strokeWidth="2" markerEnd="url(#seta)" />}
        </g>
      ))}
      <text x={487} y={222} textAnchor="middle" fontSize="12" fill="var(--muted)">Coleta agendada: GitHub Actions (15 min) + Vercel Cron (consolidado diário) → GET /api/coleta</text>
      <text x={487} y={242} textAnchor="middle" fontSize="12" fill="var(--muted)">Previsão do tempo (Open-Meteo) entra no middleware e é cruzada por sub-bacia</text>
    </svg>
  );
}

export default function Arquitetura() {
  return (
    <>
      <div className="pagina-titulo">
        <div>
          <h1>Arquitetura e especificação</h1>
          <p>Fluxo end-to-end, dicionário de dados, resiliência e fontes</p>
        </div>
      </div>

      <section className="card">
        <div className="card-h"><h2>Problema e usuários</h2></div>
        <p style={{ marginTop: 0 }}>
          Cataguases (66.261 hab., IBGE 2022) é cortada pelo Rio Pomba e pelo Ribeirão Meia Pataca e passa da cota de inundação na maioria dos anos.
          Os dados existem (estações ANA, barragens com telemetria e previsão do tempo), mas estão espalhados e não são cruzados em tempo real para a cidade.
          O Sentinela Pomba junta essas fontes num gêmeo digital da bacia a montante, projeta o nível com até 72h de antecedência e transforma isso em alertas acionáveis.
        </p>
        <div className="grid g3">
          <div><b>Defesa Civil municipal</b><p className="peq muted" style={{ margin: 0 }}>Antecedência para evacuação e alocação de equipes.</p></div>
          <div><b>Operadores de barragens</b><p className="peq muted" style={{ margin: 0 }}>Saúde das comportas e efeito de manobras a jusante.</p></div>
          <div><b>Moradores de áreas ribeirinhas</b><p className="peq muted" style={{ margin: 0 }}>Avisos simples com horário estimado de chegada da água.</p></div>
        </div>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>Arquitetura de integração</h2><p>Sensor/Gateway → Protocolo/Broker → Middleware → Banco → Aplicação</p></div>
        <div className="tabela-wrap"><div style={{ minWidth: 720 }}><Diagrama /></div></div>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>Dicionário de dados dos sensores</h2></div>
        <div className="tabela-wrap">
          <table>
            <thead><tr><th>Grandeza</th><th>Origem</th><th>Unidade</th><th>Frequência</th><th>Tipo</th><th>Neste protótipo</th></tr></thead>
            <tbody>{DICIONARIO.map((d) => <tr key={d[0]}>{d.map((c, i) => <td key={i}>{i === 5 ? <span className={`selo ${c === 'Real' ? 's-real' : 's-sim'}`}>{c}</span> : c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>Modelo de projeção</h2></div>
        <pre className="mono" style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>{`Q(t+h) = Q_atual
       + ΔQ_propagação(h)    variação de vazão observada a montante, defasada pelo tempo de viagem
                             (Astolfo Dutra ~8h, Barra do Xopotó ~9h, Guarani ~18h)
       + ΔQ_chuva(h)         método racional + hidrograma triangular por sub-bacia
                             C = 0,05 + 0,35·(chuva_72h/150)^1,5   (umidade antecedente)
       + ΔQ_descargas(h)     vazão extra de comportas, defasada até Cataguases
H(t+h) = curva-chave⁻¹(Q)    Q = a·(H − h0)^n   (SGB, Tabela 6: 3 trechos para Cataguases)`}</pre>
        <p className="peq muted">
          Os tempos de propagação e as áreas das sub-bacias são estimativas para calibrar com os eventos históricos.
          O SGB usa um modelo linear empírico semelhante (vazões a montante como entrada) no SAH-Pomba.
        </p>
      </section>

      <section className="card secao">
        <div className="card-h"><h2>Riscos e resiliência (requisitos não funcionais)</h2></div>
        <div className="tabela-wrap">
          <table>
            <thead><tr><th>Falha</th><th>Tratamento</th></tr></thead>
            <tbody>{RISCOS.map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="grid g2 secao">
        <div className="card">
          <div className="card-h"><h2>Maiores cheias em Cataguases</h2><p>SGB/CPRM</p></div>
          <table>
            <thead><tr><th>#</th><th>Data</th><th className="n">Cota</th></tr></thead>
            <tbody>{CHEIAS_HISTORICAS.map((c, i) => <tr key={c.data}><td>{i + 1}</td><td>{new Date(c.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td><td className="n">{c.cm} cm</td></tr>)}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-h"><h2>Fontes</h2></div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>ANA: telemetria hidrometeorológica (telemetriaws1.ana.gov.br)</li>
            <li>SGB/CPRM: Relatório Anual do SAH-Pomba 2024 (cotas de referência, curvas-chave, cheias históricas)</li>
            <li>Open-Meteo: previsão horária de precipitação</li>
            <li>IBGE: Censo 2022 (população)</li>
          </ul>
          <p className="peq muted">Protótipo acadêmico. Não substitui os alertas oficiais do SGB e da Defesa Civil.</p>
        </div>
      </section>
    </>
  );
}
