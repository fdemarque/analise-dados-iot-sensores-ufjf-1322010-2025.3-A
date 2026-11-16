// Configuração do domínio: Bacia do Rio Pomba a montante de Cataguases/MG.
// Fontes oficiais:
//  - Telemetria ANA (telemetriaws1.ana.gov.br) — estações da Rede Hidrometeorológica Nacional (RHN) e do Setor Elétrico.
//  - SGB/CPRM — Relatório Anual SAH-Pomba 2024: cotas de referência, curvas-chave e cheias históricas.

export type Cotas = { atencao: number; alerta: number; inundacao: number }; // cm
export type TrechoCurva = { a: number; h0: number; n: number; min: number; max: number }; // H em metros, limites em cm

export type EstacaoFluvial = {
  id: string;
  codigoAna: string;
  nome: string;
  rio: string;
  municipio: string;
  lat: number;
  lon: number;
  papel: 'alvo' | 'montante' | 'afluente' | 'jusante';
  /** tempo de propagação estimado até Cataguases (h) — a calibrar com eventos históricos */
  lagHoras: number;
  cotas?: Cotas;
  curvaChave?: TrechoCurva[];
  cotaMaximaHistorica?: { cm: number; data: string };
};

export const CATAGUASES: EstacaoFluvial = {
  id: 'cataguases',
  codigoAna: '58770000',
  nome: 'Cataguases',
  rio: 'Rio Pomba',
  municipio: 'Cataguases/MG',
  lat: -21.3894,
  lon: -42.6964,
  papel: 'alvo',
  lagHoras: 0,
  cotas: { atencao: 350, alerta: 450, inundacao: 550 },
  curvaChave: [
    { a: 70.9616, h0: 0.27, n: 1.51, min: 50, max: 237 },
    { a: 80.8601, h0: 0.09, n: 1.2, min: 237, max: 395 },
    { a: 66.7042, h0: 0, n: 1.32, min: 395, max: 900 },
  ],
  cotaMaximaHistorica: { cm: 985, data: '2008-12-18' },
};

export const ESTACOES_MONTANTE: EstacaoFluvial[] = [
  {
    id: 'astolfo-dutra',
    codigoAna: '58735000',
    nome: 'Astolfo Dutra',
    rio: 'Rio Pomba',
    municipio: 'Astolfo Dutra/MG',
    lat: -21.3094,
    lon: -42.8619,
    papel: 'montante',
    lagHoras: 8,
    cotas: { atencao: 300, alerta: 400, inundacao: 600 },
    curvaChave: [
      { a: 29.0752, h0: -0.14, n: 1.477, min: 30, max: 183 },
      { a: 32.1378, h0: 0.12, n: 1.68, min: 183, max: 334 },
      { a: 35.2385, h0: 0.11, n: 1.597, min: 334, max: 600 },
    ],
    cotaMaximaHistorica: { cm: 552, data: '2008-12-17' },
  },
  {
    id: 'barra-do-xopoto',
    codigoAna: '58736000',
    nome: 'Barra do Xopotó',
    rio: 'Rio Xopotó (afluente)',
    municipio: 'Astolfo Dutra/MG',
    lat: -21.2931,
    lon: -42.82,
    papel: 'afluente',
    lagHoras: 9,
    cotas: { atencao: 300, alerta: 500, inundacao: 700 },
    curvaChave: [
      { a: 12.1489, h0: 0.59, n: 1.508, min: 60, max: 205 },
      { a: 9.518, h0: 0.5, n: 1.86, min: 205, max: 800 },
    ],
    cotaMaximaHistorica: { cm: 700, data: '2012-01-02' },
  },
  {
    id: 'guarani',
    codigoAna: '58730001',
    nome: 'Guarani',
    rio: 'Rio Pomba',
    municipio: 'Guarani/MG',
    lat: -21.3556,
    lon: -43.0503,
    papel: 'montante',
    lagHoras: 18,
    cotas: { atencao: 300, alerta: 400, inundacao: 500 },
    cotaMaximaHistorica: { cm: 625, data: '2022-02-14' },
  },
];

export const TODAS_ESTACOES = [CATAGUASES, ...ESTACOES_MONTANTE];

// Barramentos a montante com telemetria de nível do reservatório (ANA – Setor Elétrico).
// O nível do reservatório é REAL; a instrumentação de comporta (abertura, piezômetro,
// célula de carga e vibração) é SIMULADA neste protótipo.
export type Barragem = {
  id: string;
  codigoAna: string;
  nome: string;
  lat: number;
  lon: number;
  lagHoras: number; // propagação de uma descarga até Cataguases
  /** cota do piezômetro na fundação (m) — usada para pressão teórica ρ·g·h */
  cotaSensorM: number;
  /** nível máximo operacional normal (m) — parâmetro de projeto (estimado) */
  naMaxM: number;
  vazaoComportaMax: number; // m³/s com 100% de abertura (estimada)
  /** nível típico (m) usado se a telemetria estiver indisponível */
  nivelTipicoM: number;
};

export const BARRAGENS: Barragem[] = [
  { id: 'itueré', codigoAna: '58713550', nome: 'CGH Ituerê', lat: -21.2994, lon: -43.2086, lagHoras: 24, cotaSensorM: 124.0, naMaxM: 134.3, vazaoComportaMax: 180, nivelTipicoM: 133.8 },
  { id: 'ivan-botelho-1', codigoAna: '58730100', nome: 'PCH Ivan Botelho I', lat: -21.3744, lon: -42.9942, lagHoras: 14, cotaSensorM: 378.0, naMaxM: 391.0, vazaoComportaMax: 420, nivelTipicoM: 389.8 },
  { id: 'ivan-botelho-2', codigoAna: '58730900', nome: 'PCH Ivan Botelho II', lat: -21.3453, lon: -42.9706, lagHoras: 12, cotaSensorM: 322.0, naMaxM: 335.5, vazaoComportaMax: 420, nivelTipicoM: 332.8 },
  { id: 'ze-tunin', codigoAna: '58731500', nome: 'PCH Zé Tunin', lat: -21.315, lon: -42.945, lagHoras: 11, cotaSensorM: 292.0, naMaxM: 304.7, vazaoComportaMax: 400, nivelTipicoM: 304.2 },
  { id: 'ivan-botelho-3', codigoAna: '58731800', nome: 'PCH Ivan Botelho III', lat: -21.3036, lon: -42.9139, lagHoras: 10, cotaSensorM: 273.0, naMaxM: 286.8, vazaoComportaMax: 400, nivelTipicoM: 284.2 },
];

// Sub-bacias para cruzamento com a previsão do tempo (Open-Meteo).
export type SubBacia = { id: string; nome: string; lat: number; lon: number; areaKm2: number; tempoPicoH: number; tempoBaseH: number; temEstacao: boolean };

export const SUB_BACIAS: SubBacia[] = [
  { id: 'cabeceiras', nome: 'Cabeceiras do Pomba (Mercês/Rio Pomba)', lat: -21.25, lon: -43.25, areaKm2: 1500, tempoPicoH: 30, tempoBaseH: 96, temEstacao: true },
  { id: 'guarani', nome: 'Médio Pomba (Guarani)', lat: -21.36, lon: -43.05, areaKm2: 1300, tempoPicoH: 22, tempoBaseH: 72, temEstacao: true },
  { id: 'xopoto', nome: 'Rio Xopotó (Visconde do Rio Branco)', lat: -21.1, lon: -42.85, areaKm2: 1400, tempoPicoH: 16, tempoBaseH: 60, temEstacao: true },
  { id: 'intermediaria', nome: 'Bacia intermediária (Astolfo Dutra → Cataguases)', lat: -21.34, lon: -42.78, areaKm2: 900, tempoPicoH: 8, tempoBaseH: 36, temEstacao: false },
  { id: 'meia-pataca', nome: 'Ribeirão Meia Pataca (urbano, sem estação)', lat: -21.42, lon: -42.68, areaKm2: 180, tempoPicoH: 2, tempoBaseH: 8, temEstacao: false },
];

export const CIDADE = { nome: 'Cataguases', uf: 'MG', populacao: 66261, lat: -21.3894, lon: -42.6964 };

export const CHEIAS_HISTORICAS = [
  { cm: 985, data: '2008-12-18' },
  { cm: 910, data: '2012-01-03' },
  { cm: 860, data: '2020-01-25' },
  { cm: 822, data: '2020-02-14' },
  { cm: 783, data: '2023-01-07' },
  { cm: 748, data: '2022-01-09' },
  { cm: 740, data: '2020-03-05' },
  { cm: 738, data: '1991-01-19' },
  { cm: 715, data: '2009-01-01' },
  { cm: 679, data: '2004-01-16' },
];

// Parâmetros das regras de negócio (editáveis)
export const LIMIARES = {
  subidaRapidaCmH: 20, // R3
  chuvaPrevista24hMm: 30, // R2
  aberturaDeltaPp: 30, // R4 – pontos percentuais em ≤ 30 min
  reservatorioPctMax: 95, // R4
  desvioPressaoPct: 15, // R5
  vibracaoMmS: 7.1, // R5 (ISO 10816 – zona C)
  cargaPctNominal: 110, // R5
  chuva3hEnxurradaMm: 25, // R6
  chuva72hSaturacaoMm: 60, // R6
  offlineMin: 240, // R7 (a telemetria da ANA publica com atraso típico de 1–3h)
  saltoMaxCm15min: 100, // R8
  nivelMinCm: 0,
  nivelMaxCm: 1500,
};
