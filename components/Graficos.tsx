'use client';
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Estado } from '@/lib/estado';

const tz = 'America/Sao_Paulo';
export const fmtHora = (t: number | string) => new Date(t).toLocaleString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtEixo = (t: number) => new Date(t).toLocaleString('pt-BR', { timeZone: tz, day: '2-digit', hour: '2-digit' }).replace(', ', ' ') + 'h';

const tip = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }, labelStyle: { color: 'var(--muted)' } };
const eixo = { stroke: 'var(--muted)', fontSize: 11, tickLine: false };

export function GraficoNivel({ e, altura = 320 }: { e: Estado; altura?: number }) {
  const obs = e.alvo.serie.filter((s) => s.qualidade === 'ok' && s.nivelCm !== null).map((s) => ({ t: Date.parse(s.ts), obs: s.nivelCm }));
  const proj = e.projecao.map((p) => ({ t: Date.parse(p.ts), proj: Math.round(p.nivelCm), faixa: [Math.round(p.minCm), Math.round(p.maxCm)] as [number, number] }));
  const dados = [...obs, ...proj].sort((a, b) => a.t - b.t);
  const c = e.alvo.cotas!;
  const maxY = Math.max(c.inundacao + 80, ...dados.map((d) => ('faixa' in d && d.faixa ? d.faixa[1] : (d as { obs?: number }).obs ?? 0)));
  const agora = e.alvo.atual ? Date.parse(e.alvo.atual.ts) : Date.now();
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtEixo} {...eixo} minTickGap={40} />
        <YAxis domain={[0, Math.ceil(maxY / 100) * 100]} {...eixo} unit=" cm" width={64} />
        <Tooltip {...tip} labelFormatter={(t) => fmtHora(t as number)} formatter={(v, n) => [Array.isArray(v) ? `${v[0]}–${v[1]} cm` : `${v} cm`, n === 'obs' ? 'Observado (ANA)' : n === 'proj' ? 'Projeção' : 'Faixa de incerteza']} />
        <Area dataKey="faixa" stroke="none" fill="var(--chart-band)" isAnimationActive={false} connectNulls />
        <ReferenceLine y={c.atencao} stroke="var(--atencao)" strokeDasharray="4 4" label={{ value: `Atenção ${c.atencao}`, position: 'insideTopLeft', fill: 'var(--atencao)', fontSize: 11 }} />
        <ReferenceLine y={c.alerta} stroke="var(--alerta)" strokeDasharray="4 4" label={{ value: `Alerta ${c.alerta}`, position: 'insideTopLeft', fill: 'var(--alerta)', fontSize: 11 }} />
        <ReferenceLine y={c.inundacao} stroke="var(--emergencia)" strokeDasharray="4 4" label={{ value: `Inundação ${c.inundacao}`, position: 'insideTopLeft', fill: 'var(--emergencia)', fontSize: 11 }} />
        <ReferenceLine x={agora} stroke="var(--muted)" label={{ value: 'agora', position: 'insideTopRight', fill: 'var(--muted)', fontSize: 11 }} />
        <Line dataKey="obs" stroke="var(--chart-obs)" strokeWidth={2.2} dot={false} isAnimationActive={false} connectNulls />
        <Line dataKey="proj" stroke="var(--chart-proj)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function GraficoChuva({ e, altura = 220 }: { e: Estado; altura?: number }) {
  const mapa = new Map<number, Record<string, number>>();
  for (const b of e.chuva) {
    if (b.id === 'meia-pataca') continue;
    for (const h of b.horas) {
      const t = Date.parse(h.ts);
      const r = mapa.get(t) ?? { t };
      r[b.id] = h.mm;
      mapa.set(t, r);
    }
  }
  const dados = [...mapa.values()].sort((a, b) => a.t - b.t);
  const cores: Record<string, string> = { cabeceiras: '#2a78c4', guarani: '#2aa198', xopoto: '#c48a2a', intermediaria: '#9a5bd1' };
  const nomes: Record<string, string> = { cabeceiras: 'Cabeceiras', guarani: 'Médio Pomba', xopoto: 'Xopotó', intermediaria: 'Intermediária' };
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmtEixo} {...eixo} minTickGap={40} />
        <YAxis {...eixo} unit=" mm" width={56} />
        <Tooltip {...tip} labelFormatter={(t) => fmtHora(t as number)} formatter={(v, n) => [`${v} mm/h`, nomes[n as string] ?? n]} />
        <Legend formatter={(v) => nomes[v] ?? v} wrapperStyle={{ fontSize: 12 }} />
        {Object.keys(cores).map((k) => (
          <Bar key={k} dataKey={k} stackId="a" fill={cores[k]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniSerie({ dados, cor = 'var(--chart-obs)', altura = 60, unidade = '' }: { dados: { t: number; v: number | null }[]; cor?: string; altura?: number; unidade?: string }) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        <XAxis dataKey="t" hide type="number" domain={['dataMin', 'dataMax']} />
        <Tooltip {...tip} labelFormatter={(t) => fmtHora(t as number)} formatter={(v) => [`${v}${unidade}`, '']} />
        <Line dataKey="v" stroke={cor} strokeWidth={1.8} dot={false} isAnimationActive={false} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GraficoPressao({ serie, altura = 180 }: { serie: Estado['barragens'][number]['serie']; altura?: number }) {
  const dados = serie.map((s) => ({ t: Date.parse(s.ts), medida: s.pressaoMedidaKpa, teorica: s.pressaoTeoricaKpa, abertura: s.aberturaPct }));
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })} {...eixo} minTickGap={30} />
        <YAxis yAxisId="p" {...eixo} unit=" kPa" width={66} domain={[(min: number) => Math.floor(min * 0.85), (max: number) => Math.ceil(max * 1.1)]} allowDecimals={false} />
        <YAxis yAxisId="a" orientation="right" {...eixo} unit="%" width={40} domain={[0, 100]} />
        <Tooltip {...tip} labelFormatter={(t) => fmtHora(t as number)} formatter={(v, n) => [n === 'abertura' ? `${v}%` : `${v} kPa`, n === 'medida' ? 'Pressão medida' : n === 'teorica' ? 'Teórica ρ·g·h' : 'Abertura da comporta']} />
        <Area yAxisId="a" dataKey="abertura" stroke="none" fill="var(--accent-soft)" isAnimationActive={false} />
        <Line yAxisId="p" dataKey="teorica" stroke="var(--muted)" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        <Line yAxisId="p" dataKey="medida" stroke="var(--chart-proj)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
