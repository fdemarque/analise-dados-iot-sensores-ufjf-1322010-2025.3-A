# -*- coding: utf-8 -*-
"""Conteúdo do Documento de Especificação de Software (ABNT NBR 14724).

Marcadores usados no HTML:
  {{fig:chave}} / {{qua:chave}} / {{tab:chave}}  -> número da ilustração/quadro/tabela
  [[pg:Título exato]]                              -> página (preenchida na 2ª passagem)
"""

AUTOR = 'Filipe da Silva Demarque'
TITULO = 'SENTINELA POMBA'
SUBTITULO = 'especificação de software de um sistema IoT de monitoramento hidrológico e apoio à previsão de cheias para Cataguases/MG'
LOCAL = 'Juiz de Fora'
ANO = '2026'
URL_APP = 'https://sentinela-pomba.vercel.app'
URL_REPO = 'https://github.com/fdemarque/analise-dados-iot-sensores-ufjf-1322010-2025.3-A'

# ------------------------------------------------------------------ elementos pré-textuais

CAPA = f'''
<section class="capa">
  <div class="topo">
    <p>UNIVERSIDADE FEDERAL DE JUIZ DE FORA</p>
    <p>INSTITUTO DE CIÊNCIAS EXATAS</p>
    <p>DEPARTAMENTO DE CIÊNCIA DA COMPUTAÇÃO</p>
  </div>
  <p class="autor">{AUTOR.upper()}</p>
  <div class="titulo">
    <p><b>{TITULO}:</b> {SUBTITULO}</p>
  </div>
  <div class="rodape-capa"><p>{LOCAL}</p><p>{ANO}</p></div>
</section>
'''

FOLHA_ROSTO = f'''
<section class="rosto">
  <p class="autor">{AUTOR.upper()}</p>
  <div class="titulo"><p><b>{TITULO}:</b> {SUBTITULO}</p></div>
  <div class="natureza">
    <p>Documento de Especificação de Software apresentado à disciplina Análise de Dados de Dispositivos IoT e de Sensores
    (1322010-2025.3-A), do Departamento de Ciência da Computação da Universidade Federal de Juiz de Fora, como requisito
    parcial de avaliação da Atividade Prática da Unidade 5 – Projeto Integrador de Software IoT: Engenharia de Requisitos,
    Arquitetura e Prototipagem.</p>
    <p>Tema 1 – Monitoramento Ambiental.</p>
  </div>
  <div class="rodape-capa"><p>{LOCAL}</p><p>{ANO}</p></div>
</section>
'''

RESUMO = '''
<section class="pre">
<h1 class="sem-numero">RESUMO</h1>
<p class="resumo">Este documento especifica a camada de software, as regras de negócio e a arquitetura de integração do
Sentinela Pomba, um sistema de Internet das Coisas (IoT) para monitoramento hidrológico e apoio à previsão de cheias no
município de Cataguases, Minas Gerais, atravessado pelo Rio Pomba e pelo Ribeirão Meia Pataca. O município
supera a cota de inundação na maioria dos anos e tem como maior cheia registrada a de dezembro de 2008, com 985 cm na
régua da estação fluviométrica local. Embora existam dados públicos de qualidade, eles estão dispersos em fontes
distintas e não são cruzados de forma contínua para a cidade. A solução proposta integra, em um fluxo
<i>end-to-end</i>, a telemetria real das estações fluviométricas da Agência Nacional de Águas e Saneamento Básico (ANA)
em Cataguases e a montante, o nível dos reservatórios de cinco barragens situadas rio acima, a instrumentação de
comportas (abertura, pressão na fundação, carga e vibração) e a previsão horária de precipitação por sub-bacia. Um
middleware valida e saneia as leituras, mantém gêmeos digitais dos ativos, converte vazão em cota pelas curvas-chave
oficiais do Serviço Geológico do Brasil (SGB) e projeta o nível do rio em até 72 horas, combinando a propagação
observada a montante, o escoamento estimado a partir da chuva prevista e eventuais descargas de comportas. Oito regras
formais do tipo SE … ENTÃO … geram alertas acionáveis, entre elas a verificação da pressão medida na fundação contra a
pressão hidrostática teórica. São tratados requisitos não funcionais de resiliência, como sensor offline, perda de
conexão, retransmissão idempotente e dados nulos ou corrompidos. O protótipo funcional foi publicado em plataforma
de nuvem, opera com dados reais e oferece cenários de demonstração para simular cheias, manobras de comportas,
anomalias estruturais e falhas de sensores.</p>
<p class="palavras"><b>Palavras-chave:</b> internet das coisas; monitoramento hidrológico; previsão de cheias; integração de dados de sensores; Rio Pomba.</p>
</section>
'''

FIGURAS = [
    ('bacia', 'Diagrama unifilar da bacia do Rio Pomba a montante de Cataguases', 'Elaborado pelo autor (2026), com base em ANA (2026) e SGB (2024).'),
    ('arquitetura', 'Arquitetura de integração end-to-end do Sentinela Pomba', 'Elaborado pelo autor (2026).'),
    ('pipeline', 'Processamento de uma leitura no middleware', 'Elaborado pelo autor (2026).'),
    ('painel_real', 'Painel de Cataguases com dados reais', 'Protótipo Sentinela Pomba (2026). Captura de 16 nov. 2026.'),
    ('grafico_real', 'Nível observado e projetado com as cotas de referência (dados reais)', 'Protótipo Sentinela Pomba (2026). Dados: ANA (2026); Open-Meteo (2026).'),
    ('chuva', 'Previsão horária de chuva por sub-bacia e coeficientes de escoamento', 'Protótipo Sentinela Pomba (2026). Dados: Open-Meteo (2026).'),
    ('painel_cheia', 'Painel no cenário de demonstração “Cheia de verão”', 'Protótipo Sentinela Pomba (2026). Cenário fictício.'),
    ('grafico_cheia', 'Projeção com cruzamento das cotas de alerta e de inundação (cenário fictício)', 'Protótipo Sentinela Pomba (2026). Cenário fictício.'),
    ('barragem', 'Monitoramento de comporta com anomalia de pressão, vibração e carga (cenário fictício)', 'Protótipo Sentinela Pomba (2026). Nível do reservatório: ANA (2026); instrumentação simulada.'),
    ('alertas', 'Tela de alertas e catálogo de regras com avaliação em tempo real', 'Protótipo Sentinela Pomba (2026). Cenário fictício de abertura brusca de comporta.'),
    ('simulador', 'Simulador de cenários e envio manual de telemetria', 'Protótipo Sentinela Pomba (2026).'),
    ('mobile', 'Painel em dispositivo móvel', 'Protótipo Sentinela Pomba (2026).'),
]
QUADROS = [
    ('estacoes', 'Estações e barramentos integrados ao sistema'),
    ('dicionario', 'Dicionário de dados dos sensores'),
    ('payload', 'Contrato do payload de telemetria do gateway'),
    ('camadas', 'Componentes e tecnologias por camada da arquitetura'),
    ('padroes', 'Padrões de integração adotados e justificativa'),
    ('api', 'Interfaces de programação (API) expostas pelo middleware'),
    ('regras', 'Regras de negócio automáticas'),
    ('telas', 'Telas do protótipo e requisitos atendidos'),
    ('riscos', 'Análise de riscos e tratamento de falhas'),
    ('rnf', 'Requisitos não funcionais'),
    ('cenarios', 'Cenários de demonstração do protótipo'),
    ('ferramentas', 'Correspondência com as ferramentas sugeridas para a Parte B'),
]
TABELAS = [
    ('cotas', 'Cotas de referência das estações do SAH-Pomba utilizadas'),
    ('cheias', 'Dez maiores cheias registradas na estação de Cataguases'),
    ('curva', 'Parâmetros da curva-chave da estação de Cataguases'),
]

SIGLAS = [
    ('ANA', 'Agência Nacional de Águas e Saneamento Básico'), ('API', 'Application Programming Interface'),
    ('CGH', 'Central Geradora Hidrelétrica'), ('CPRM', 'Companhia de Pesquisa de Recursos Minerais'),
    ('ETA', 'Estimated Time of Arrival (tempo estimado de chegada)'), ('HTTP', 'Hypertext Transfer Protocol'),
    ('IBGE', 'Instituto Brasileiro de Geografia e Estatística'), ('IoT', 'Internet of Things (Internet das Coisas)'),
    ('ISO', 'International Organization for Standardization'), ('JSON', 'JavaScript Object Notation'),
    ('JWT', 'JSON Web Token'), ('MQTT', 'Message Queuing Telemetry Transport'),
    ('NA', 'Nível d’água (de reservatório)'), ('NTP', 'Network Time Protocol'),
    ('PAE', 'Plano de Ação de Emergência'), ('PCH', 'Pequena Central Hidrelétrica'),
    ('QoS', 'Quality of Service'), ('REST', 'Representational State Transfer'),
    ('RHN', 'Rede Hidrometeorológica Nacional'), ('RMS', 'Root Mean Square (valor eficaz)'),
    ('RNF', 'Requisito Não Funcional'), ('SAH', 'Sistema de Alerta Hidrológico'),
    ('SGB', 'Serviço Geológico do Brasil'), ('TLS', 'Transport Layer Security'),
    ('UFJF', 'Universidade Federal de Juiz de Fora'), ('URL', 'Uniform Resource Locator'),
]

# Sumário: (nível, título exato do cabeçalho)
SUMARIO = [
    (1, '1 INTRODUÇÃO'),
    (2, '1.1 OBJETIVOS'), (2, '1.2 ACESSO AO PROTÓTIPO E AO CÓDIGO-FONTE'), (2, '1.3 ORGANIZAÇÃO DO DOCUMENTO'),
    (1, '2 DESCRIÇÃO DO PROBLEMA E USUÁRIOS'),
    (2, '2.1 CONTEXTO: CATAGUASES E A BACIA DO RIO POMBA'), (2, '2.2 PROBLEMA DO MUNDO REAL'),
    (2, '2.3 PÚBLICO-ALVO'), (2, '2.4 VALOR ENTREGUE PELO SOFTWARE'), (2, '2.5 ESCOPO E PREMISSAS'),
    (1, '3 DICIONÁRIO DE DADOS DO SENSOR'),
    (2, '3.1 FONTES DE DADOS'), (2, '3.2 DICIONÁRIO DE DADOS'), (2, '3.3 CONTRATO DO PAYLOAD DE TELEMETRIA'),
    (1, '4 ARQUITETURA DE INTEGRAÇÃO'),
    (2, '4.1 VISÃO GERAL DO FLUXO END-TO-END'), (2, '4.2 CAMADAS E COMPONENTES'), (2, '4.3 PADRÕES DE INTEGRAÇÃO'),
    (2, '4.4 GÊMEO DIGITAL E MODELO DE PROJEÇÃO'), (2, '4.5 INTERFACES DE PROGRAMAÇÃO'),
    (1, '5 REGRAS DE NEGÓCIO AUTOMÁTICAS'),
    (2, '5.1 ESPECIFICAÇÃO FORMAL'), (2, '5.2 ÍNDICE DE RISCO E INSIGHTS'),
    (1, '6 PROTOTIPAGEM DA INTERFACE'),
    (2, '6.1 PAINEL DE CATAGUASES'), (2, '6.2 BARRAGENS E COMPORTAS'), (2, '6.3 ALERTAS E REGRAS'),
    (2, '6.4 SIMULADOR E RESPONSIVIDADE'),
    (1, '7 ANÁLISE DE RISCOS E RESILIÊNCIA DO SOFTWARE'),
    (2, '7.1 TRATAMENTO DE FALHAS'), (2, '7.2 REQUISITOS NÃO FUNCIONAIS'), (2, '7.3 SEGURANÇA'),
    (1, '8 PROTÓTIPO FUNCIONAL'),
    (2, '8.1 IMPLEMENTAÇÃO E IMPLANTAÇÃO'), (2, '8.2 ROTEIRO DE DEMONSTRAÇÃO'), (2, '8.3 FERRAMENTAS UTILIZADAS'),
    (1, '9 CONSIDERAÇÕES FINAIS'),
    (0, 'REFERÊNCIAS'),
    (0, 'APÊNDICE A – EXEMPLOS DE REQUISIÇÕES À API'),
    (0, 'APÊNDICE B – FLUXO NODE-RED DO GATEWAY SIMULADO'),
]

# ------------------------------------------------------------------ diagramas (SVG, tons de cinza para impressão)

SVG_BACIA = '''
<svg viewBox="0 0 640 300" class="diag" xmlns="http://www.w3.org/2000/svg" font-family="Liberation Sans, Arial" font-size="10.5">
  <defs><marker id="sb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#333"/></marker></defs>
  <!-- rio principal -->
  <line x1="20" y1="150" x2="610" y2="150" stroke="#333" stroke-width="3" marker-end="url(#sb)"/>
  <text x="22" y="140" font-weight="bold">Rio Pomba (cabeceiras)</text>
  <text x="520" y="140" font-weight="bold">jusante</text>
  <!-- barragens -->
  <g>
    <rect x="58" y="143" width="10" height="14" fill="#666"/><text x="40" y="180">CGH Ituerê</text><text x="40" y="192" fill="#555">58713550 · ~24 h</text>
    <rect x="148" y="143" width="10" height="14" fill="#666"/>
    <text x="118" y="122">Guarani</text><text x="118" y="110" fill="#555">58730001 · ~18 h</text>
    <circle cx="140" cy="150" r="6" fill="#fff" stroke="#000" stroke-width="2"/>
    <text x="150" y="180">PCH Ivan Botelho I</text><text x="150" y="192" fill="#555">58730100 · ~14 h</text>
    <rect x="200" y="143" width="10" height="14" fill="#666"/><text x="196" y="210">PCH Ivan Botelho II · ~12 h</text>
    <rect x="236" y="143" width="10" height="14" fill="#666"/><text x="232" y="226">PCH Zé Tunin · ~11 h</text>
    <rect x="272" y="143" width="10" height="14" fill="#666"/><text x="268" y="242">PCH Ivan Botelho III · ~10 h</text>
  </g>
  <!-- Xopotó -->
  <line x1="402" y1="40" x2="384" y2="146" stroke="#333" stroke-width="2" marker-end="url(#sb)"/>
  <text x="410" y="36" font-weight="bold">Rio Xopotó</text>
  <circle cx="395" cy="80" r="6" fill="#fff" stroke="#000" stroke-width="2"/><text x="407" y="78">Barra do Xopotó</text><text x="407" y="90" fill="#555">58736000 · ~9 h</text>
  <!-- Astolfo Dutra -->
  <circle cx="320" cy="150" r="6" fill="#fff" stroke="#000" stroke-width="2"/>
  <text x="282" y="122">Astolfo Dutra</text><text x="282" y="110" fill="#555">58735000 · ~8 h</text>
  <!-- Meia Pataca -->
  <line x1="470" y1="250" x2="476" y2="156" stroke="#333" stroke-width="2" stroke-dasharray="5 3" marker-end="url(#sb)"/>
  <text x="482" y="236" font-weight="bold">Rib. Meia Pataca</text><text x="482" y="248" fill="#555">sem estação: estimado por chuva</text>
  <!-- Cataguases -->
  <rect x="440" y="140" width="80" height="20" fill="#000"/><text x="480" y="154" fill="#fff" text-anchor="middle" font-weight="bold">CATAGUASES</text>
  <text x="444" y="122">58770000 (alvo)</text>
  <rect x="560" y="143" width="10" height="14" fill="#666"/><text x="540" y="180">UHE Barra do Braúna</text><text x="540" y="192" fill="#555">jusante: não afeta</text>
  <!-- legenda -->
  <g transform="translate(20,262)">
    <circle cx="6" cy="6" r="5" fill="#fff" stroke="#000" stroke-width="2"/><text x="16" y="10">Estação fluviométrica ANA (nível, vazão, chuva)</text>
    <rect x="290" y="0" width="8" height="12" fill="#666"/><text x="304" y="10">Barramento com telemetria de nível</text>
    <text x="0" y="28" fill="#555">“~N h”: tempo de propagação estimado até Cataguases (parâmetro a calibrar)</text>
  </g>
</svg>
'''

def _caixa(x, titulo, itens, w=118):
    s = f'<rect x="{x}" y="30" width="{w}" height="196" rx="6" fill="#f2f2f2" stroke="#000"/>'
    s += f'<rect x="{x}" y="30" width="{w}" height="34" rx="6" fill="#d9d9d9" stroke="#000"/>'
    linhas = titulo.split('|')
    for i, l in enumerate(linhas):
        s += f'<text x="{x + w/2}" y="{45 + i*12 - (len(linhas)-1)*5}" text-anchor="middle" font-weight="bold">{l}</text>'
    for i, it in enumerate(itens):
        s += f'<text x="{x + 7}" y="{82 + i*15}">{it}</text>'
    return s

SVG_ARQ = ('''<svg viewBox="0 0 660 300" class="diag" xmlns="http://www.w3.org/2000/svg" font-family="Liberation Sans, Arial" font-size="9.6">
<defs><marker id="sa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#000"/></marker></defs>
<text x="330" y="16" text-anchor="middle" font-size="11" font-weight="bold">Sensor/Gateway → Protocolo/Broker → Middleware → Banco de Dados → Aplicação Web</text>'''
 + _caixa(6, '1. SENSORES /|GATEWAY', ['Réguas e radares ANA', 'Pluviômetros ANA', 'Nível de reservatórios', 'Encoder de comporta', 'Piezômetro', 'Célula de carga', 'Acelerômetro MEMS', 'Gateway ESP32 /', 'Node-RED (edge)', 'Previsão Open-Meteo'])
 + _caixa(138, '2. PROTOCOLO /|BROKER', ['HTTP/REST + TLS', '  (pull ANA a cada', '  15 min; XML)', 'HTTPS POST JSON', '  (push do gateway)', 'MQTT QoS 1 + TLS', '  (produção, broker', '  gerenciado)', 'Lotes store-and-', '  forward'])
 + _caixa(270, '3. MIDDLEWARE|(Next.js API)', ['Validação/saneamento', 'Idempotência (chave)', 'Gêmeos digitais', 'Curva-chave Q↔H', 'Propagação montante', 'Chuva → vazão', 'Projeção 72 h', 'Motor de regras R1–R8', 'Índice de risco', 'Webhooks (ações)'])
 + _caixa(402, '4. BANCO DE|DADOS', ['Google Sheets via', '  Apps Script (API)', 'Aba telemetria', 'Aba alertas', 'Aba resumo_diario', 'Cache em memória', '  (degradação', '  graciosa)', 'Produção: banco', '  de séries temporais'])
 + _caixa(534, '5. APLICAÇÃO|WEB', ['Painel de risco', 'Gráficos nível ×', '  projeção', 'Barragens/comportas', 'Alertas e regras', 'Simulador', 'Arquitetura', 'Responsivo (mobile)', 'Defesa Civil /', '  moradores'])
 + ''.join(f'<line x1="{x}" y1="128" x2="{x+12}" y2="128" stroke="#000" stroke-width="1.6" marker-end="url(#sa)"/>' for x in (125, 257, 389, 521))
 + '''<rect x="6" y="240" width="646" height="50" rx="6" fill="#fff" stroke="#000" stroke-dasharray="4 3"/>
<text x="16" y="257" font-weight="bold">Orquestração</text>
<text x="16" y="271">GitHub Actions (a cada 15 min) e Vercel Cron (diário) → GET /api/coleta · ações: webhook/SMS/push para Defesa Civil, operadores e moradores</text>
<text x="16" y="284">Fontes reais: ANA (telemetria) e Open-Meteo (previsão) · instrumentação de comportas: simulada no protótipo</text>
</svg>''')

SVG_PIPE = ('''<svg viewBox="0 0 660 120" class="diag" xmlns="http://www.w3.org/2000/svg" font-family="Liberation Sans, Arial" font-size="10">
<defs><marker id="sp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#000"/></marker></defs>'''
 + ''.join(
    f'<rect x="{6 + i*109}" y="20" width="96" height="62" rx="6" fill="{"#d9d9d9" if i in (0,5) else "#f2f2f2"}" stroke="#000"/>'
    + ''.join(f'<text x="{54 + i*109}" y="{40 + k*13}" text-anchor="middle"{" font-weight=\'bold\'" if k==0 else ""}>{t}</text>' for k, t in enumerate(txt))
    + (f'<line x1="{102 + i*109}" y1="51" x2="{114 + i*109}" y2="51" stroke="#000" stroke-width="1.5" marker-end="url(#sp)"/>' if i < 5 else '')
    for i, txt in enumerate([
        ['Ingestão', 'leitura bruta', '(XML/JSON)'],
        ['Saneamento', 'nulo, faixa,', 'salto (R8)'],
        ['Contexto', 'gêmeo digital', 'estado, status (R7)'],
        ['Modelo', 'curva-chave,', 'projeção 72 h'],
        ['Regras', 'R1–R6', 'severidade'],
        ['Ação', 'alerta, registro,', 'webhook, painel'],
    ]))
 + '<text x="330" y="108" text-anchor="middle" fill="#333">Leituras rejeitadas vão para quarentena; alertas são deduplicados por regra, alvo, cenário e janela de 1 hora.</text></svg>')
