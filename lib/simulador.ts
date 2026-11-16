// Simulador de sensores e cenários de demonstração.
// Gera telemetria determinística (mesma hora → mesmo valor) para a instrumentação
// de comportas e permite sobrepor cenários fictícios aos dados reais.
import { BARRAGENS, type Barragem, type EstacaoFluvial } from './config';
import type { Leitura, PrevisaoBacia } from './fontes';
import { vazaoDaCota } from './modelo';

export type CenarioId = 'real' | 'cheia' | 'comporta' | 'estrutural' | 'falhas';

export const CENARIOS: { id: CenarioId; nome: string; descricao: string }[] = [
  { id: 'real', nome: 'Dados reais', descricao: 'Telemetria real da ANA e previsão real do Open-Meteo. Somente a instrumentação das comportas é simulada, em regime normal.' },
  { id: 'cheia', nome: 'Cheia de verão (fictício)', descricao: 'Chuva forte persistente nas cabeceiras: rio subindo em todas as estações, solo saturado e mais ~30 mm somados à previsão real das próximas 24h. Inspirado nos eventos de jan/2020 e jan/2022.' },
  { id: 'comporta', nome: 'Abertura brusca de comporta (fictício)', descricao: 'Reservatório da PCH Ivan Botelho III a 99% do nível máximo e comporta passando de 15% para 90% de abertura em 20 minutos.' },
  { id: 'estrutural', nome: 'Anomalia estrutural (fictício)', descricao: 'Piezômetro da PCH Zé Tunin medindo 28% acima da pressão hidrostática teórica, com vibração e carga elevadas.' },
  { id: 'falhas', nome: 'Falhas de sensores (fictício)', descricao: 'Estação de Astolfo Dutra sem transmitir há 6h e leituras corrompidas (nula e salto impossível) em Cataguases.' },
];

/** Ruído pseudoaleatório determinístico em [-1, 1]. */
export function ruido(seed: string, t: number) {
  let h = 2166136261;
  const s = seed + ':' + Math.floor(t / 900e3);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

export type LeituraComporta = {
  ts: string;
  aberturaPct: number; // %
  nivelReservatorioM: number; // m (cota)
  pressaoMedidaKpa: number; // piezômetro
  pressaoTeoricaKpa: number; // ρ·g·h
  cargaPctNominal: number; // célula de carga no mecanismo
  vibracaoMmS: number; // RMS
  vazaoDescarregadaM3s: number;
};

const RHO = 1000, G = 9.81;

export function pressaoTeoricaKpa(b: Barragem, nivelM: number) {
  return (RHO * G * Math.max(0, nivelM - b.cotaSensorM)) / 1000;
}

/** Série de 6h (15 em 15 min) da instrumentação da comporta. */
export function serieComporta(b: Barragem, nivelRealM: number | null, cenario: CenarioId, agora: number): LeituraComporta[] {
  const out: LeituraComporta[] = [];
  const passo = 15 * 60e3;
  const fim = Math.floor(agora / passo) * passo;
  for (let t = fim - 6 * 3600e3; t <= fim; t += passo) {
    const minAtras = (fim - t) / 60e3;
    let nivel = (nivelRealM ?? b.nivelTipicoM) + 0.03 * ruido(b.id + 'n', t);
    let abertura = 15 + 3 * ruido(b.id + 'a', t);
    let fatorPressao = 1 + 0.02 * ruido(b.id + 'p', t);
    let carga = 55 + abertura * 0.4 + 3 * ruido(b.id + 'c', t);
    let vib = 2.0 + 0.6 * ruido(b.id + 'v', t);

    if (cenario === 'comporta' && b.id === 'ivan-botelho-3') {
      nivel = b.naMaxM - 0.04 + 0.01 * ruido(b.id, t);
      if (minAtras <= 20) abertura = 90 + ruido(b.id + 'x', t);
      carga = 55 + abertura * 0.45;
      vib = minAtras <= 20 ? 4.2 + 0.4 * ruido(b.id + 'vv', t) : vib;
    }
    if (cenario === 'cheia') {
      nivel = b.naMaxM - 0.15 + 0.05 * ruido(b.id, t);
      abertura = 45 + 5 * ruido(b.id + 'ch', t) + (360 - minAtras) / 30;
      carga = 55 + abertura * 0.4;
    }
    if (cenario === 'estrutural' && b.id === 'ze-tunin') {
      const progresso = Math.min(1, (360 - minAtras) / 180);
      fatorPressao = 1 + 0.28 * progresso + 0.01 * ruido(b.id + 'pp', t);
      vib = 3 + 6.2 * progresso + 0.3 * ruido(b.id + 'vv', t);
      carga = 70 + 45 * progresso;
    }
    const teorica = pressaoTeoricaKpa(b, nivel);
    out.push({
      ts: new Date(t).toISOString(),
      aberturaPct: round(abertura, 1),
      nivelReservatorioM: round(nivel, 2),
      pressaoTeoricaKpa: round(teorica, 1),
      pressaoMedidaKpa: round(teorica * fatorPressao, 1),
      cargaPctNominal: round(carga, 1),
      vibracaoMmS: round(Math.max(0.2, vib), 2),
      vazaoDescarregadaM3s: round((abertura / 100) * b.vazaoComportaMax, 1),
    });
  }
  return out;
}

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

/** Gera série fictícia de cheia para uma estação (subida em forma de S nas últimas 48h). */
function serieCheia(e: EstacaoFluvial, base: number, pico: number, agora: number, vazaoBase: number | null): Leitura[] {
  const out: Leitura[] = [];
  const passo = 15 * 60e3;
  const fim = Math.floor(agora / passo) * passo;
  for (let t = fim - 72 * 3600e3; t <= fim; t += passo) {
    const x = (t - (fim - 72 * 3600e3)) / (72 * 3600e3); // 0..1
    const s = 1 / (1 + Math.exp(-10 * (x - 0.78)));
    const nivel = base + (pico - base) * s + 2 * ruido(e.id, t);
    const vazao = e.curvaChave ? vazaoDaCota(nivel, e.curvaChave) : vazaoBase !== null ? vazaoBase * (nivel / base) ** 1.5 : null;
    out.push({ ts: new Date(t).toISOString(), nivelCm: round(nivel, 1), vazao: vazao === null ? null : round(vazao, 2), chuvaMm: x > 0.5 ? round(2 + 2 * Math.abs(ruido(e.id + 'c', t)), 1) : 0 });
  }
  return out;
}

export function aplicarCenarioSerie(e: EstacaoFluvial, serie: Leitura[], cenario: CenarioId, agora: number): Leitura[] {
  if (cenario === 'cheia') {
    const ult = [...serie].reverse().find((l) => l.nivelCm !== null);
    const base = ult?.nivelCm ?? 150;
    const picos: Record<string, number> = { cataguases: 485, 'astolfo-dutra': 455, 'barra-do-xopoto': 480, guarani: 430 };
    return serieCheia(e, base, Math.max(base + 50, picos[e.id] ?? base * 2), agora, ult?.vazao ?? null);
  }
  if (cenario === 'falhas') {
    if (e.id === 'astolfo-dutra') return serie.filter((l) => Date.parse(l.ts) < agora - 6 * 3600e3);
    if (e.id === 'cataguases' && serie.length > 6) {
      const s = serie.map((l) => ({ ...l }));
      s[s.length - 2] = { ...s[s.length - 2], nivelCm: null };
      s[s.length - 1] = { ...s[s.length - 1], nivelCm: (s[s.length - 3].nivelCm ?? 200) + 640 };
      return s;
    }
  }
  return serie;
}

export function aplicarCenarioPrevisao(prev: PrevisaoBacia[], cenario: CenarioId, agora: number): PrevisaoBacia[] {
  if (cenario !== 'cheia') return prev;
  return prev.map((b) => ({
    ...b,
    horas: b.horas.map((h) => {
      const dt = (Date.parse(h.ts) - agora) / 3600e3;
      let extra = 0;
      if (dt >= -72 && dt < 0) extra = 0.9; // ~65 mm a mais nas últimas 72h → solo saturado
      if (dt >= 0 && dt < 24) extra = b.id === 'meia-pataca' ? (dt < 3 ? 10 : 1) : 1.2; // ~30 mm/24h além da previsão real
      return { ...h, mm: round(h.mm + extra, 1) };
    }),
  }));
}

export { BARRAGENS };
