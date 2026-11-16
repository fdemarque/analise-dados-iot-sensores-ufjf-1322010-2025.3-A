import type { Metadata } from 'next';
import './globals.css';
import { EstadoProvider } from '@/components/EstadoProvider';
import { Topo } from '@/components/Topo';

export const metadata: Metadata = {
  title: 'Sentinela Pomba',
  description: 'Protótipo IoT de monitoramento do Rio Pomba e previsão de cheias para Cataguases/MG. UFJF, Análise de Dados de Dispositivos IoT e de Sensores.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <EstadoProvider>
          <Topo />
          <main className="wrap">{children}</main>
          <footer className="wrap rodape">
            Protótipo acadêmico da disciplina 1322010-2025.3-A, Análise de Dados de Dispositivos IoT e de Sensores (DCC/UFJF).
            Dados reais: telemetria ANA (estações RHN e Setor Elétrico) e previsão Open-Meteo. Cotas de referência e curvas-chave: SGB/CPRM (SAH-Pomba).
            A instrumentação de comportas é simulada. <b>Este sistema não substitui os alertas oficiais do SGB e da Defesa Civil.</b>
          </footer>
        </EstadoProvider>
      </body>
    </html>
  );
}
