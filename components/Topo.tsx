'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEstado } from './EstadoProvider';

const LINKS = [
  { href: '/', rotulo: 'Painel' },
  { href: '/barragens', rotulo: 'Barragens' },
  { href: '/alertas', rotulo: 'Alertas e regras' },
  { href: '/simulador', rotulo: 'Simulador' },
  { href: '/arquitetura', rotulo: 'Arquitetura' },
];

export function Topo() {
  const p = usePathname();
  const { estado, cenario, setCenario } = useEstado();
  return (
    <>
      <header className="topo">
        <div className="wrap topo-in">
          <Link href="/" className="marca" style={{ textDecoration: 'none' }}>
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="var(--accent)" />
              <path d="M5 19c3.5-3 7-3 10.5 0s7 3 11.5 0" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M5 24c3.5-3 7-3 10.5 0s7 3 11.5 0" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M16 6v8M12.5 10.5 16 14l3.5-3.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sentinela Pomba<small>Cataguases/MG · monitoramento hidrológico</small></span>
          </Link>
          <nav className="nav" aria-label="Principal">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={p === l.href ? 'ativo' : ''}>{l.rotulo}</Link>
            ))}
          </nav>
        </div>
      </header>
      {cenario !== 'real' && (
        <div className="faixa-cenario">
          <div className="wrap">
            <span className="selo s-atencao">Cenário de demonstração</span>
            <span><b>{estado?.cenario.nome ?? cenario}</b>: os dados destacados são fictícios.</span>
            <button className="btn" style={{ padding: '3px 10px', marginLeft: 'auto' }} onClick={() => setCenario('real')}>Voltar aos dados reais</button>
          </div>
        </div>
      )}
    </>
  );
}
