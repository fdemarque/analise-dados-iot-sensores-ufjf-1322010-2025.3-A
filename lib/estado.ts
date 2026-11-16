// Orquestra o fluxo end-to-end: ingestão → validação → gêmeos digitais → modelo → regras → insights.
import { BARRAGENS, CATAGUASES, CHEIAS_HISTORICAS, ESTACOES_MONTANTE, LIMIARES as L, SUB_BACIAS, type EstacaoFluvial } from './config';
import { buscarAna, buscarPrevisao, type Leitura, type PrevisaoBacia } from './fontes';
import { coefEscoamento, contribuicaoChuva, contribuicaoMontante, projetar, somaChuva, taxaCmH, validarSerie, validas, vazaoDaCota, type Contribuicao, type LeituraValidada, type ProjecaoPonto } from './modelo';
import { PESO, REGRAS, type Alerta, type Severidade } from './regras';
import { aplicarCenarioPrevisao, aplicarCenarioSerie, CENARIOS, serieComporta, type CenarioId, type LeituraComporta } from './simulador';
import { telemetriaGateway } from './store';

function comLimite<T>(p: Promise<T>, ms: number, padrao: T): Promise<T> {
  return Promise.race([p.catch(() => padrao), new Promise<T>((res) => setTimeout(() => res(padrao), ms))]);
}

export type EstadoEstacao = {
  id: string; nome: string; rio: string; codigoAna: string; papel: string; lagHoras: number;
  cotas?: EstacaoFluvial['cotas']; cotaMaximaHistorica?: EstacaoFluvial['cotaMaximaHistorica'];
  serie: { ts: string; nivelCm: number | null; vazao: number | null; qualidade: string }[];
  atual: { ts: string; nivelCm: number; vazao: number | null } | null;
  taxa1h: number | null; taxa3h: number | null;
  status: 'online' | 'offline' | 'sem_dados';
  minutosDesdeUltima: number | null;
  rejeitadas: number;
  fonte: 'ANA (real)' | 'Cenário simulado';
  erro?: string;
};

export type EstadoBarragem = {
  id: string; nome: string; codigoAna: string; lagHoras: number; naMaxM: number; cotaSensorM: number;
  nivelReal: { m: number; ts: string } | null;
  serie: LeituraComporta[];
  atual: LeituraComporta;
  desvioPressaoPct: number;
  pctNaMax: number;
  saude: number;
  fonteInstrumentacao: 'simulado' | 'gateway';
};

export type EstadoChuva = { id: string; nome: string; temEstacao: boolean; passado72h: number; prox3h: number; prox24h: number; prox72h: number; coef: number; horas: { ts: string; mm: number }[] };

export type Estado = Awaited<ReturnType<typeof montarEstado>>;

const r1 = (v: number) => Math.round(v * 10) / 10;

function estadoEstacao(e: EstacaoFluvial, bruta: Leitura[], erro: string | undefined, cenario: CenarioId, agora: number): EstadoEstacao & { _valida: ReturnType<typeof validas> } {
  const serie = aplicarCenarioSerie(e, bruta, cenario, agora).filter((l) => Date.parse(l.ts) >= agora - 72 * 3600e3 && Date.parse(l.ts) <= agora + 600e3);
  const val = validarSerie(serie);
  const ok = validas(val);
  const ult = ok[ok.length - 1];
  const minutos = ult ? Math.round((agora - Date.parse(ult.ts)) / 60000) : null;
  return {
    id: e.id, nome: e.nome, rio: e.rio, codigoAna: e.codigoAna, papel: e.papel, lagHoras: e.lagHoras, cotas: e.cotas, cotaMaximaHistorica: e.cotaMaximaHistorica,
    serie: val.map((l: LeituraValidada) => ({ ts: l.ts, nivelCm: l.nivelCm, vazao: l.vazao, qualidade: l.qualidade })),
    atual: ult ? { ts: ult.ts, nivelCm: ult.nivelCm, vazao: ult.vazao ?? (e.curvaChave ? r1(vazaoDaCota(ult.nivelCm, e.curvaChave)) : null) } : null,
    taxa1h: ok.length ? taxaCmH(ok, 1) : null,
    taxa3h: ok.length ? taxaCmH(ok, 3) : null,
    status: !ult ? 'sem_dados' : minutos! > L.offlineMin ? 'offline' : 'online',
    minutosDesdeUltima: minutos,
    rejeitadas: val.filter((l) => l.qualidade !== 'ok').length,
    fonte: cenario === 'real' || (cenario === 'falhas' && e.id !== 'cataguases' && e.id !== 'astolfo-dutra') || cenario === 'comporta' || cenario === 'estrutural' ? 'ANA (real)' : 'Cenário simulado',
    erro,
    _valida: ok,
  };
}

export async function montarEstado(cenarioParam?: string, limiteAnaMs = 8000) {
  const cenario: CenarioId = (CENARIOS.find((c) => c.id === cenarioParam)?.id ?? 'real') as CenarioId;
  const agora = Date.now();

  // 1) Ingestão paralela das fontes reais (falha de uma fonte não derruba as demais)
  // Telemetria de gateway (planilha) em paralelo com as fontes externas, com limite de espera
  const gatewayP = cenario === 'real' ? comLimite(telemetriaGateway(agora - 6 * 3600e3), 5000, []) : Promise.resolve([]);
  const [anaAlvo, anaMontante, anaBarragens, meteo, gateway] = await Promise.all([
    buscarAna(CATAGUASES.codigoAna, 3, limiteAnaMs),
    Promise.all(ESTACOES_MONTANTE.map((e) => buscarAna(e.codigoAna, 3, limiteAnaMs))),
    Promise.all(BARRAGENS.map((b) => buscarAna(b.codigoAna, 3, limiteAnaMs))),
    buscarPrevisao(),
    gatewayP,
  ]);

  // 2) Gêmeos digitais das estações fluviométricas
  const alvo = estadoEstacao(CATAGUASES, anaAlvo.leituras, anaAlvo.erro, cenario, agora);
  const montante = ESTACOES_MONTANTE.map((e, i) => estadoEstacao(e, anaMontante[i].leituras, anaMontante[i].erro, cenario, agora));

  // 3) Previsão do tempo por sub-bacia
  const prev: PrevisaoBacia[] = aplicarCenarioPrevisao(meteo.bacias, cenario, agora);
  const chuva: EstadoChuva[] = SUB_BACIAS.map((sb) => {
    const b = prev.find((p) => p.id === sb.id) ?? { id: sb.id, nome: sb.nome, horas: [] };
    const p72 = somaChuva(b, -72, 0, agora);
    return {
      id: sb.id, nome: sb.nome, temEstacao: sb.temEstacao,
      passado72h: r1(p72), prox3h: r1(somaChuva(b, 0, 3, agora)), prox24h: r1(somaChuva(b, 0, 24, agora)), prox72h: r1(somaChuva(b, 0, 72, agora)),
      coef: Math.round(coefEscoamento(p72) * 100) / 100,
      horas: b.horas.filter((h) => Date.parse(h.ts) >= agora - 3600e3 && Date.parse(h.ts) < agora + 72 * 3600e3),
    };
  });
  const media = (k: keyof Pick<EstadoChuva, 'passado72h' | 'prox24h' | 'prox72h' | 'prox3h'>) => {
    const tot = SUB_BACIAS.reduce((s, sb) => s + sb.areaKm2, 0);
    return r1(chuva.reduce((s, c) => s + c[k] * (SUB_BACIAS.find((x) => x.id === c.id)!.areaKm2 / tot), 0));
  };
  const chuvaBacia = { passado72h: media('passado72h'), prox24h: media('prox24h'), prox72h: media('prox72h') };

  // 4) Barragens: nível real (ANA) + instrumentação simulada ou recebida via gateway
  const barragens: EstadoBarragem[] = await Promise.all(
    BARRAGENS.map(async (b, i) => {
      const lts = anaBarragens[i].leituras.filter((l) => l.nivelCm !== null && l.nivelCm > 1000);
      const ultReal = lts[lts.length - 1];
      const nivelReal = ultReal ? { m: ultReal.nivelCm! / 100, ts: ultReal.ts } : null;
      let serie = serieComporta(b, nivelReal?.m ?? null, cenario, agora);
      let fonte: 'simulado' | 'gateway' = 'simulado';
      const gw = gateway.filter((t) => t.dispositivoId === b.id).sort((x, y) => x.ts.localeCompare(y.ts));
      if (gw.length) {
        fonte = 'gateway';
        const conv = gw.map((t) => {
          const lv = t.leituras as Record<string, number>;
          const nivel = lv.nivel_reservatorio_m ?? serie[serie.length - 1].nivelReservatorioM;
          const teorica = (1000 * 9.81 * Math.max(0, nivel - b.cotaSensorM)) / 1000;
          return {
            ts: t.ts, aberturaPct: lv.abertura_pct ?? 0, nivelReservatorioM: nivel,
            pressaoMedidaKpa: lv.pressao_kpa ?? teorica, pressaoTeoricaKpa: r1(teorica),
            cargaPctNominal: lv.carga_pct ?? 0, vibracaoMmS: lv.vibracao_mm_s ?? 0,
            vazaoDescarregadaM3s: r1(((lv.abertura_pct ?? 0) / 100) * b.vazaoComportaMax),
          };
        });
        serie = [...serie.filter((s) => s.ts < conv[0].ts), ...conv];
      }
      const atual = serie[serie.length - 1];
      const desvio = atual.pressaoTeoricaKpa > 0 ? ((atual.pressaoMedidaKpa - atual.pressaoTeoricaKpa) / atual.pressaoTeoricaKpa) * 100 : 0;
      const pctNa = ((atual.nivelReservatorioM - b.cotaSensorM) / (b.naMaxM - b.cotaSensorM)) * 100;
      const saude = Math.max(0, Math.round(100 - Math.max(0, Math.abs(desvio) - 3) * 2.5 - Math.max(0, atual.vibracaoMmS - 2.8) * 6 - Math.max(0, atual.cargaPctNominal - 90) * 1.5));
      return {
        id: b.id, nome: b.nome, codigoAna: b.codigoAna, lagHoras: b.lagHoras, naMaxM: b.naMaxM, cotaSensorM: b.cotaSensorM,
        nivelReal, serie, atual, desvioPressaoPct: r1(desvio), pctNaMax: r1(pctNa), saude, fonteInstrumentacao: fonte,
      };
    }),
  );

  // 5) Projeção hidrológica para Cataguases
  const contribuicoes: Contribuicao[] = [];
  const md = montante.find((m) => m.id === 'astolfo-dutra')!;
  const mx = montante.find((m) => m.id === 'barra-do-xopoto')!;
  const mg = montante.find((m) => m.id === 'guarani')!;
  const serieQ = (m: typeof md) => m._valida.filter((l) => l.vazao !== null).map((l) => ({ ts: l.ts, vazao: l.vazao! }));
  if (md.status === 'online') contribuicoes.push(contribuicaoMontante('Propagação Astolfo Dutra (Pomba)', serieQ(md), md.lagHoras, agora));
  else if (mg.status === 'online') contribuicoes.push(contribuicaoMontante('Propagação Guarani (redundância p/ Astolfo Dutra offline)', serieQ(mg), mg.lagHoras, agora));
  if (mx.status === 'online') contribuicoes.push(contribuicaoMontante('Propagação Barra do Xopotó', serieQ(mx), mx.lagHoras, agora));
  contribuicoes.push(...contribuicaoChuva(prev, agora).map((c) => ({ ...c, fonte: 'Chuva prevista – ' + c.fonte })));
  for (const b of barragens) {
    const base = b.serie[0];
    const extra = b.atual.vazaoDescarregadaM3s - base.vazaoDescarregadaM3s;
    if (Math.abs(extra) > 20) {
      const lag = BARRAGENS.find((x) => x.id === b.id)!.lagHoras;
      contribuicoes.push({ fonte: `Descarga ${b.nome}`, deltaQ: (h) => (h >= lag ? extra * 0.85 : 0) });
    }
  }
  const offline = [alvo, ...montante].filter((e) => e.status !== 'online').length;
  const projecao: ProjecaoPonto[] = alvo.atual
    ? projetar({ nivelAtualCm: alvo.atual.nivelCm, agora: Date.parse(alvo.atual.ts), contribuicoes, incertezaBase: 0.05 * offline })
    : [];
  const pico = projecao.reduce<ProjecaoPonto | null>((m, p) => (!m || p.nivelCm > m.nivelCm ? p : m), null);
  const cotas = CATAGUASES.cotas!;
  const cruza = (lim: number) => projecao.find((p) => p.nivelCm >= lim && (alvo.atual?.nivelCm ?? 0) < lim)?.ts ?? null;
  const cruzamentos = { atencao: cruza(cotas.atencao), alerta: cruza(cotas.alerta), inundacao: cruza(cotas.inundacao) };
  const em = (h: number) => projecao.find((p) => p.horas === h)?.nivelCm ?? null;

  // 6) Motor de regras
  const alertas: Alerta[] = [];
  const regraStatus: Record<string, { disparada: boolean; avaliacao: string }> = {};
  const add = (a: Alerta) => alertas.push(a);
  const R = (id: string) => REGRAS.find((r) => r.id === id)!;

  // R1
  {
    const n = alvo.atual?.nivelCm;
    let sev: Severidade | null = null;
    if (n !== undefined && alvo.status === 'online') sev = n >= cotas.inundacao ? 'emergencia' : n >= cotas.alerta ? 'alerta' : n >= cotas.atencao ? 'atencao' : null;
    regraStatus.R1 = { disparada: !!sev, avaliacao: n === undefined ? 'Sem leitura válida' : `nível = ${r1(n)} cm (atenção ${cotas.atencao} / alerta ${cotas.alerta} / inundação ${cotas.inundacao})` };
    if (sev) add({ regra: 'R1', severidade: sev, alvo: 'Cataguases', titulo: sev === 'emergencia' ? 'Rio Pomba acima da cota de inundação' : sev === 'alerta' ? 'Rio Pomba na cota de alerta' : 'Rio Pomba na cota de atenção', mensagem: `Nível observado de ${r1(n!)} cm às ${hora(alvo.atual!.ts)}.`, acao: R('R1').acao });
  }
  // R2
  {
    const p12 = em(12);
    const disp = p12 !== null && p12 >= cotas.alerta && chuvaBacia.prox24h >= L.chuvaPrevista24hMm;
    regraStatus.R2 = { disparada: disp, avaliacao: `projeção 12h = ${p12 === null ? '—' : r1(p12) + ' cm'}; chuva prevista 24h (média da bacia) = ${chuvaBacia.prox24h} mm` };
    if (disp) add({ regra: 'R2', severidade: p12! >= cotas.inundacao ? 'emergencia' : 'alerta', alvo: 'Cataguases', titulo: 'Previsão de cheia nas próximas 12h', mensagem: `Projeção de ${r1(p12!)} cm em 12h${cruzamentos.alerta ? `; cota de alerta prevista para ${hora(cruzamentos.alerta)}` : ''}${cruzamentos.inundacao ? `; inundação prevista para ${hora(cruzamentos.inundacao)}` : ''}. Chuva de ${chuvaBacia.prox24h} mm prevista em 24h.`, acao: R('R2').acao });
  }
  // R3
  {
    const rapidas = montante.filter((m) => m.status === 'online' && (m.taxa1h ?? 0) >= L.subidaRapidaCmH);
    regraStatus.R3 = { disparada: rapidas.length > 0, avaliacao: montante.map((m) => `${m.nome}: ${m.taxa1h === null ? '—' : r1(m.taxa1h) + ' cm/h'}`).join('; ') };
    for (const m of rapidas) add({ regra: 'R3', severidade: 'alerta', alvo: m.nome, titulo: `Onda de cheia em ${m.nome}`, mensagem: `Subida de ${r1(m.taxa1h!)} cm/h. Chegada estimada em Cataguases em ~${m.lagHoras}h (${hora(new Date(agora + m.lagHoras * 3600e3).toISOString())}).`, acao: R('R3').acao });
  }
  // R4
  {
    const hits = barragens.filter((b) => {
      const ref = b.serie.find((s) => Date.parse(s.ts) >= Date.parse(b.atual.ts) - 30 * 60e3) ?? b.serie[0];
      return b.atual.aberturaPct - ref.aberturaPct >= L.aberturaDeltaPp && b.pctNaMax >= L.reservatorioPctMax;
    });
    regraStatus.R4 = { disparada: hits.length > 0, avaliacao: barragens.map((b) => `${b.nome}: abertura ${b.atual.aberturaPct}%, reservatório ${b.pctNaMax}% NA`).join('; ') };
    for (const b of hits) add({ regra: 'R4', severidade: 'alerta', alvo: b.nome, titulo: `Descarga brusca na ${b.nome}`, mensagem: `Comporta em ${b.atual.aberturaPct}% (vazão ≈ ${b.atual.vazaoDescarregadaM3s} m³/s) com reservatório a ${b.pctNaMax}% do NA máximo. Chegada em Cataguases em ~${b.lagHoras}h.`, acao: R('R4').acao });
  }
  // R5
  {
    const avalia = barragens.map((b) => {
      const ult3 = b.serie.slice(-3);
      const desv = ult3.every((s) => Math.abs((s.pressaoMedidaKpa - s.pressaoTeoricaKpa) / s.pressaoTeoricaKpa) * 100 >= L.desvioPressaoPct);
      const mec = b.atual.vibracaoMmS >= L.vibracaoMmS || b.atual.cargaPctNominal >= L.cargaPctNominal;
      return { b, desv, mec };
    });
    regraStatus.R5 = { disparada: avalia.some((a) => a.desv), avaliacao: barragens.map((b) => `${b.nome}: desvio ${b.desvioPressaoPct}%, vibração ${b.atual.vibracaoMmS} mm/s`).join('; ') };
    for (const { b, desv, mec } of avalia) {
      if (!desv) continue;
      add({ regra: 'R5', severidade: mec ? 'emergencia' : 'atencao', alvo: b.nome, titulo: mec ? `Risco estrutural na ${b.nome}` : `Pressão anômala na ${b.nome}`, mensagem: `Pressão medida ${b.atual.pressaoMedidaKpa} kPa × teórica ${b.atual.pressaoTeoricaKpa} kPa (${b.desvioPressaoPct > 0 ? '+' : ''}${b.desvioPressaoPct}%). Vibração ${b.atual.vibracaoMmS} mm/s, carga ${b.atual.cargaPctNominal}%.`, acao: R('R5').acao });
    }
  }
  // R6
  {
    const mp = chuva.find((c) => c.id === 'meia-pataca')!;
    const disp = mp.prox3h >= L.chuva3hEnxurradaMm && mp.passado72h >= L.chuva72hSaturacaoMm;
    regraStatus.R6 = { disparada: disp, avaliacao: `chuva prevista 3h = ${mp.prox3h} mm; acumulada 72h = ${mp.passado72h} mm` };
    if (disp) add({ regra: 'R6', severidade: 'alerta', alvo: 'Ribeirão Meia Pataca', titulo: 'Risco de enxurrada no Meia Pataca', mensagem: `${mp.prox3h} mm previstos nas próximas 3h sobre solo saturado (${mp.passado72h} mm em 72h).`, acao: R('R6').acao });
  }
  // R7
  {
    const off = [alvo, ...montante].filter((e) => e.status !== 'online');
    regraStatus.R7 = { disparada: off.length > 0, avaliacao: [alvo, ...montante].map((e) => `${e.nome}: ${e.minutosDesdeUltima === null ? 'sem dados' : e.minutosDesdeUltima + ' min'}`).join('; ') };
    for (const e of off) add({ regra: 'R7', severidade: e.id === 'cataguases' ? 'alerta' : 'atencao', alvo: e.nome, titulo: `Estação ${e.nome} sem transmitir`, mensagem: e.minutosDesdeUltima === null ? `Nenhuma leitura válida nas últimas 72h${e.erro ? ` (${e.erro})` : ''}.` : `Última leitura válida há ${Math.round(e.minutosDesdeUltima / 60 * 10) / 10}h. A projeção usa redundância e incerteza ampliada.`, acao: R('R7').acao });
  }
  // R8
  {
    const rej = [alvo, ...montante].filter((e) => e.rejeitadas > 0);
    const recentes = [alvo, ...montante].flatMap((e) => e.serie.filter((s) => s.qualidade !== 'ok' && Date.parse(s.ts) >= agora - 6 * 3600e3).map((s) => ({ e, s })));
    regraStatus.R8 = { disparada: recentes.length > 0, avaliacao: rej.length ? rej.map((e) => `${e.nome}: ${e.rejeitadas} leitura(s) descartada(s) em 72h`).join('; ') : 'Nenhuma leitura descartada em 72h' };
    if (recentes.length) add({ regra: 'R8', severidade: 'info', alvo: [...new Set(recentes.map((r) => r.e.nome))].join(', '), titulo: 'Leituras descartadas pelo saneamento', mensagem: recentes.map((r) => `${r.e.nome} ${hora(r.s.ts)}: ${r.s.qualidade === 'nulo' ? 'valor nulo' : r.s.qualidade === 'salto' ? `salto impossível (${r.s.nivelCm} cm)` : `fora de faixa (${r.s.nivelCm} cm)`}`).join('; ') + '.', acao: R('R8').acao });
  }

  alertas.sort((a, b) => PESO[b.severidade] - PESO[a.severidade]);

  // 7) Índice de risco (0–100) e insights
  const nAtual = alvo.atual?.nivelCm ?? 0;
  const picoN = pico?.nivelCm ?? nAtual;
  const fNivel = Math.min(1, Math.max(nAtual, picoN * 0.9) / cotas.inundacao);
  const fChuva = Math.min(1, chuvaBacia.prox24h / 80);
  const fSat = Math.min(1, chuvaBacia.passado72h / 100);
  const fBarr = Math.max(0, ...barragens.map((b) => (100 - b.saude) / 100));
  let indice = Math.round(100 * Math.min(1, 0.55 * fNivel ** 2 + 0.2 * fChuva + 0.1 * fSat + 0.15 * fBarr));
  const sevMax = alertas.reduce<Severidade>((m, a) => (PESO[a.severidade] > PESO[m] ? a.severidade : m), 'info');
  indice = Math.max(indice, [0, 30, 60, 85][PESO[sevMax]]);
  const nivelRisco = indice >= 85 ? 'EMERGÊNCIA' : indice >= 60 ? 'ALERTA' : indice >= 30 ? 'ATENÇÃO' : 'NORMAL';

  const insights: string[] = [];
  if (alvo.atual) {
    const falta = cotas.atencao - nAtual;
    insights.push(`O Rio Pomba está em ${r1(nAtual)} cm em Cataguases${alvo.taxa3h !== null ? `, ${tendencia(alvo.taxa3h)} (${alvo.taxa3h > 0 ? '+' : ''}${r1(alvo.taxa3h)} cm/h nas últimas 3h)` : ''}. ${falta > 0 ? `Faltam ${r1(falta)} cm para a cota de atenção.` : `Está ${r1(-falta)} cm acima da cota de atenção.`}`);
  }
  if (pico && alvo.atual) {
    const hist = CHEIAS_HISTORICAS.find((c) => picoN >= c.cm - 15);
    insights.push(`O pico projetado é de ${r1(picoN)} cm em ~${pico.horas}h (${hora(pico.ts)}), com faixa de ${r1(pico.minCm)} a ${r1(pico.maxCm)} cm.${hist ? ` Seria comparável à cheia de ${new Date(hist.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} (${hist.cm} cm).` : ''}`);
  }
  insights.push(`Chuva média na bacia: ${chuvaBacia.passado72h} mm nas últimas 72h (solo ${chuvaBacia.passado72h >= 60 ? 'saturado' : chuvaBacia.passado72h >= 30 ? 'úmido' : 'seco'}) e ${chuvaBacia.prox72h} mm previstos para 72h.`);
  const maiorFonte = contribuicoes.map((c) => ({ f: c.fonte, v: c.deltaQ(12) })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v))[0];
  if (maiorFonte && Math.abs(maiorFonte.v) > 5) insights.push(`Nas próximas 12h, o principal fator de variação é "${maiorFonte.f}" (${maiorFonte.v > 0 ? '+' : ''}${Math.round(maiorFonte.v)} m³/s).`);
  const pior = [...barragens].sort((a, b) => a.saude - b.saude)[0];
  insights.push(pior.saude < 80 ? `A ${pior.nome} tem índice de saúde de ${pior.saude}/100. Veja a aba Barragens.` : `As ${barragens.length} barragens a montante estão operando normalmente (saúde mínima de ${pior.saude}/100).`);

  return {
    geradoEm: new Date(agora).toISOString(),
    cenario: CENARIOS.find((c) => c.id === cenario)!,
    fontes: {
      ana: { ok: anaAlvo.ok && anaMontante.every((a) => a.ok), erros: [anaAlvo, ...anaMontante].filter((a) => !a.ok).map((a) => a.erro) },
      meteo: { ok: meteo.ok, erro: meteo.erro },
    },
    alvo: semInterno(alvo),
    montante: montante.map(semInterno),
    barragens,
    chuva,
    chuvaBacia,
    projecao,
    pico,
    cruzamentos,
    contribuicoes: contribuicoes.map((c) => ({ fonte: c.fonte, q6: Math.round(c.deltaQ(6)), q12: Math.round(c.deltaQ(12)), q24: Math.round(c.deltaQ(24)), q48: Math.round(c.deltaQ(48)) })),
    risco: { indice, nivel: nivelRisco },
    alertas: alertas.map((a) => ({ ...a, mensagem: br(a.mensagem) })),
    regras: REGRAS.map((r) => ({ ...r, ...regraStatus[r.id], avaliacao: br(regraStatus[r.id].avaliacao) })),
    insights: insights.map(br),
  };
}

function semInterno<T extends { _valida: unknown }>(e: T): Omit<T, '_valida'> {
  const { _valida, ...rest } = e;
  void _valida;
  return rest;
}

/** Formata decimais no padrão brasileiro (vírgula). */
const br = (s: string) => s.replace(/(\d)\.(\d)/g, '$1,$2');

function tendencia(t: number) {
  if (t >= 10) return 'subindo rápido';
  if (t >= 2) return 'subindo';
  if (t <= -2) return 'descendo';
  return 'estável';
}

export function hora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
