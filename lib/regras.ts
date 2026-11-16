// Catálogo formal das regras de negócio (SE <condição> [E/OU <condição>] ENTÃO <ação>).
import { CATAGUASES, LIMIARES as L } from './config';

const C = CATAGUASES.cotas!;

export type Severidade = 'info' | 'atencao' | 'alerta' | 'emergencia';

export type Regra = { id: string; nome: string; categoria: string; formal: string; acao: string };

export const REGRAS: Regra[] = [
  {
    id: 'R1',
    nome: 'Cota observada em Cataguases',
    categoria: 'Hidrologia',
    formal: `SE nivel_cataguases ≥ ${C.inundacao} cm ENTÃO estado = EMERGÊNCIA\nSENÃO SE nivel_cataguases ≥ ${C.alerta} cm ENTÃO estado = ALERTA\nSENÃO SE nivel_cataguases ≥ ${C.atencao} cm ENTÃO estado = ATENÇÃO`,
    acao: 'Atualizar o estado da cidade, registrar a ocorrência e notificar a Defesa Civil (webhook/SMS) a partir de ALERTA.',
  },
  {
    id: 'R2',
    nome: 'Previsão de cruzamento de cota',
    categoria: 'Previsão',
    formal: `SE nivel_projetado(12h) ≥ ${C.alerta} cm E chuva_prevista_24h_bacia ≥ ${L.chuvaPrevista24hMm} mm\nENTÃO emitir ALERTA ANTECIPADO com horário estimado de cruzamento`,
    acao: 'Publicar boletim antecipado com horário estimado, enviar push aos moradores das áreas de risco e acionar o plano de contingência.',
  },
  {
    id: 'R3',
    nome: 'Onda de cheia a montante',
    categoria: 'Propagação',
    formal: `SE taxa_subida(estação_montante, 1h) ≥ ${L.subidaRapidaCmH} cm/h\nENTÃO emitir aviso de onda de cheia com ETA = tempo_de_propagação(estação)`,
    acao: 'Notificar a sala de situação com a estação de origem e a previsão de chegada em Cataguases.',
  },
  {
    id: 'R4',
    nome: 'Descarga brusca de barragem',
    categoria: 'Barragens',
    formal: `SE Δabertura_comporta(30 min) ≥ ${L.aberturaDeltaPp} p.p. E nivel_reservatorio ≥ ${L.reservatorioPctMax}% do NA máx.\nENTÃO emitir ALERTA de descarga com vazão adicional e ETA até Cataguases`,
    acao: 'Abrir chamado (webhook) para o operador da usina, notificar a Defesa Civil e somar a descarga à projeção hidrológica.',
  },
  {
    id: 'R5',
    nome: 'Integridade estrutural (pressão × hidrostática)',
    categoria: 'Barragens',
    formal: `SE |pressão_medida − ρ·g·h| / ρ·g·h ≥ ${L.desvioPressaoPct}% em 3 leituras consecutivas\n   E (vibração ≥ ${L.vibracaoMmS} mm/s OU carga ≥ ${L.cargaPctNominal}% nominal)\nENTÃO EMERGÊNCIA estrutural\nSENÃO SE só o desvio de pressão ENTÃO ATENÇÃO (inspeção: infiltração ou sensor descalibrado)`,
    acao: 'Acionar o Plano de Ação de Emergência (PAE) da barragem e a equipe de inspeção, e manter histórico para auditoria.',
  },
  {
    id: 'R6',
    nome: 'Enxurrada no Ribeirão Meia Pataca',
    categoria: 'Previsão',
    formal: `SE chuva_prevista_3h(Meia Pataca) ≥ ${L.chuva3hEnxurradaMm} mm E chuva_72h_acumulada ≥ ${L.chuva72hSaturacaoMm} mm\nENTÃO ALERTA de enxurrada urbana (afluente sem estação – estimativa por chuva)`,
    acao: 'Enviar push georreferenciado aos bairros ribeirinhos do Meia Pataca.',
  },
  {
    id: 'R7',
    nome: 'Sensor offline',
    categoria: 'Resiliência',
    formal: `SE agora − timestamp_ultima_leitura_valida > ${L.offlineMin} min\nENTÃO status_sensor = OFFLINE, ampliar a incerteza da projeção e notificar a manutenção`,
    acao: 'Marcar o gêmeo digital como OFFLINE, nunca exibir "normal" sem dado e usar o último valor conhecido com selo de defasagem.',
  },
  {
    id: 'R8',
    nome: 'Dado nulo ou corrompido',
    categoria: 'Resiliência',
    formal: `SE leitura = nula OU leitura ∉ [${L.nivelMinCm}, ${L.nivelMaxCm}] cm OU |Δleitura| > ${L.saltoMaxCm15min} cm/15 min\nENTÃO descartar a leitura, registrar em quarentena e manter o último valor válido`,
    acao: 'Excluir a leitura dos cálculos e contabilizar no indicador de qualidade de dados.',
  },
];

export type Alerta = {
  regra: string;
  severidade: Severidade;
  alvo: string;
  titulo: string;
  mensagem: string;
  acao: string;
};

export const PESO: Record<Severidade, number> = { info: 0, atencao: 1, alerta: 2, emergencia: 3 };
