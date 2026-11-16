// Middleware analítico: validação, curva-chave e projeção de nível em Cataguases.
import { CATAGUASES, LIMIARES, SUB_BACIAS, type TrechoCurva } from './config';
import type { Leitura, PrevisaoBacia } from './fontes';

export type Qualidade = 'ok' | 'nulo' | 'fora_faixa' | 'salto';
export type LeituraValidada = Leitura & { qualidade: Qualidade };

/** R8 – Saneamento de dados: nulos, fora de faixa física e saltos impossíveis. */
export function validarSerie(serie: Leitura[]): LeituraValidada[] {
  const out: LeituraValidada[] = [];
  let ultimoOk: Leitura | null = null;
  for (const l of serie) {
    let q: Qualidade = 'ok';
    if (l.nivelCm === null) q = 'nulo';
    else if (l.nivelCm < LIMIARES.nivelMinCm || l.nivelCm > LIMIARES.nivelMaxCm) q = 'fora_faixa';
    else if (ultimoOk && ultimoOk.nivelCm !== null) {
      const dtMin = (Date.parse(l.ts) - Date.parse(ultimoOk.ts)) / 60000;
      const limite = LIMIARES.saltoMaxCm15min * Math.max(1, dtMin / 15);
      if (Math.abs(l.nivelCm - ultimoOk.nivelCm) > limite) q = 'salto';
    }
    out.push({ ...l, qualidade: q });
    if (q === 'ok') ultimoOk = l;
  }
  return out;
}

export function validas(s: LeituraValidada[]) {
  return s.filter((l) => l.qualidade === 'ok' && l.nivelCm !== null) as (LeituraValidada & { nivelCm: number })[];
}

function trecho(curva: TrechoCurva[], hCm: number) {
  return curva.find((t) => hCm >= t.min && hCm <= t.max) ?? (hCm < curva[0].min ? curva[0] : curva[curva.length - 1]);
}

/** Curva-chave Q = a·(H − h0)^n (SGB, Tabela 6). H em cm na entrada. */
export function vazaoDaCota(hCm: number, curva = CATAGUASES.curvaChave!): number {
  const t = trecho(curva, hCm);
  const h = hCm / 100 - t.h0;
  return h <= 0 ? 0 : t.a * Math.pow(h, t.n);
}

/** Inversa da curva-chave (busca binária, monotônica). */
export function cotaDaVazao(q: number, curva = CATAGUASES.curvaChave!): number {
  let lo = 0, hi = 1500;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (vazaoDaCota(mid, curva) < q) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Taxa de variação (cm/h) na última janela de `horas`. */
export function taxaCmH(s: { ts: string; nivelCm: number }[], horas = 1): number | null {
  if (s.length < 2) return null;
  const ult = s[s.length - 1];
  const alvo = Date.parse(ult.ts) - horas * 3600e3;
  const ref = [...s].reverse().find((l) => Date.parse(l.ts) <= alvo) ?? s[0];
  const dt = (Date.parse(ult.ts) - Date.parse(ref.ts)) / 3600e3;
  return dt > 0 ? (ult.nivelCm - ref.nivelCm) / dt : null;
}

export function somaChuva(b: PrevisaoBacia, deHoras: number, ateHoras: number, agora = Date.now()) {
  return b.horas
    .filter((h) => {
      const dt = (Date.parse(h.ts) - agora) / 3600e3;
      return dt >= deHoras && dt < ateHoras;
    })
    .reduce((s, h) => s + h.mm, 0);
}

export type Contribuicao = { fonte: string; deltaQ: (horaFutura: number) => number };

export type ProjecaoPonto = { ts: string; horas: number; nivelCm: number; minCm: number; maxCm: number };

/**
 * Projeção de nível (modelo conceitual simplificado, calibrável):
 *  Q(t+h) = Q_atual + ΔQ_propagação_montante(h) + ΔQ_chuva_prevista(h) + ΔQ_descargas(h)
 *  - Propagação: variação de vazão observada a montante, defasada pelo tempo de viagem.
 *  - Chuva prevista: método racional + hidrograma unitário triangular por sub-bacia,
 *    com coeficiente de escoamento função da saturação do solo (chuva antecedente 72h).
 *  - Descargas de barragens: vazão extra de comporta, defasada pelo tempo de viagem.
 * A incerteza cresce com o horizonte e quando há sensores offline.
 */
export function projetar(params: {
  nivelAtualCm: number;
  agora: number;
  contribuicoes: Contribuicao[];
  incertezaBase: number; // 0..1
  horizonteH?: number;
}): ProjecaoPonto[] {
  const { nivelAtualCm, agora, contribuicoes, incertezaBase } = params;
  const H = params.horizonteH ?? 72;
  const q0 = vazaoDaCota(nivelAtualCm);
  const pts: ProjecaoPonto[] = [];
  for (let h = 0; h <= H; h += 1) {
    const dq = contribuicoes.reduce((s, c) => s + c.deltaQ(h), 0);
    const q = Math.max(1, q0 + dq);
    const nivel = cotaDaVazao(q);
    const inc = (0.04 + incertezaBase) * (h / 12) * Math.max(60, Math.abs(nivel - nivelAtualCm));
    pts.push({ ts: new Date(agora + h * 3600e3).toISOString(), horas: h, nivelCm: nivel, minCm: Math.max(0, nivel - inc), maxCm: nivel + inc });
  }
  return pts;
}

/** Hidrograma triangular: ΔQ no instante h para chuva P (mm) caída na hora k. */
function triangular(h: number, k: number, tp: number, tb: number, qp: number) {
  const t = h - k;
  if (t <= 0 || t >= tb) return 0;
  return t <= tp ? qp * (t / tp) : qp * ((tb - t) / (tb - tp));
}

export function coefEscoamento(chuva72hMm: number) {
  // Coeficiente de escoamento cresce de forma não linear com a umidade antecedente do solo.
  const sat = Math.min(1, chuva72hMm / 150);
  return 0.05 + 0.35 * Math.pow(sat, 1.5);
}

export function contribuicaoChuva(prev: PrevisaoBacia[], agora: number): Contribuicao[] {
  return SUB_BACIAS.filter((sb) => sb.id !== 'meia-pataca').map((sb) => {
    const b = prev.find((p) => p.id === sb.id);
    if (!b) return { fonte: sb.nome, deltaQ: () => 0 };
    const c = coefEscoamento(somaChuva(b, -72, 0, agora));
    const futuras = b.horas
      .map((x) => ({ k: (Date.parse(x.ts) - agora) / 3600e3, mm: x.mm }))
      .filter((x) => x.k >= 0 && x.mm > 0);
    return {
      fonte: sb.nome,
      deltaQ: (h: number) =>
        futuras.reduce((s, f) => {
          const vol = c * (f.mm / 1000) * sb.areaKm2 * 1e6; // m³
          const qp = (2 * vol) / (sb.tempoBaseH * 3600); // pico do triângulo
          return s + triangular(h, f.k, sb.tempoPicoH, sb.tempoBaseH, qp);
        }, 0),
    };
  });
}

/** Propagação: variação observada a montante chega defasada em Cataguases. */
export function contribuicaoMontante(nome: string, serieVazao: { ts: string; vazao: number }[], lagH: number, agora: number): Contribuicao {
  if (serieVazao.length < 2) return { fonte: nome, deltaQ: () => 0 };
  const em = (t: number) => {
    let melhor = serieVazao[0];
    for (const p of serieVazao) if (Date.parse(p.ts) <= t) melhor = p;
    return melhor.vazao;
  };
  const ref = em(agora - lagH * 3600e3);
  const ultima = serieVazao[serieVazao.length - 1].vazao;
  return {
    fonte: nome,
    // Para h > lag não há observação: assume persistência da última vazão medida a montante.
    deltaQ: (h: number) => (h <= lagH ? em(agora + (h - lagH) * 3600e3) : ultima) - ref,
  };
}
