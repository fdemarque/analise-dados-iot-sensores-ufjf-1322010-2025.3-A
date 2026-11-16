# -*- coding: utf-8 -*-
"""Elementos textuais e pós-textuais do documento."""
from conteudo import URL_APP, URL_REPO, SVG_BACIA, SVG_ARQ, SVG_PIPE


def fig(chave, corpo, largura='100%'):
    return f'''<figure class="ilus" data-k="fig:{chave}">
<h6 class="legenda">Figura {{{{fig:{chave}}}}} – {{{{figt:{chave}}}}}</h6>
<div class="ilus-corpo" style="width:{largura}">{corpo}</div>
<p class="fonte">Fonte: {{{{figf:{chave}}}}}</p></figure>'''


def img(chave, arq, largura='100%'):
    return fig(chave, f'<img src="img/{arq}" alt="">', largura)


def quadro(chave, cab, linhas, fonte='Elaborado pelo autor (2026).', larguras=None):
    col = ''.join(f'<col style="width:{w}">' for w in larguras) if larguras else ''
    th = ''.join(f'<th>{c}</th>' for c in cab)
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in l) + '</tr>' for l in linhas)
    return f'''<div class="quadro">
<h6 class="legenda">Quadro {{{{qua:{chave}}}}} – {{{{quat:{chave}}}}}</h6>
<table class="q"><colgroup>{col}</colgroup><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>
<p class="fonte">Fonte: {fonte}</p></div>'''


def tabela(chave, cab, linhas, fonte, larguras=None):
    col = ''.join(f'<col style="width:{w}">' for w in larguras) if larguras else ''
    th = ''.join(f'<th>{c}</th>' for c in cab)
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in l) + '</tr>' for l in linhas)
    return f'''<div class="quadro">
<h6 class="legenda">Tabela {{{{tab:{chave}}}}} – {{{{tabt:{chave}}}}}</h6>
<table class="t"><colgroup>{col}</colgroup><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>
<p class="fonte">Fonte: {fonte}</p></div>'''


def regra(rid, nome, formal, acao):
    return f'''<div class="regra"><p class="regra-t"><b>{rid} – {nome}</b></p><pre>{formal}</pre><p class="regra-a"><b>Ação de software:</b> {acao}</p></div>'''


CORPO = f'''
<section class="secao">
<h1>1 INTRODUÇÃO</h1>
<p>A Internet das Coisas (IoT) só gera valor quando os dados produzidos por sensores chegam a um sistema de
software capaz de recebê-los, interpretá-los, validá-los, armazená-los e transformá-los em informação acionável. A
integração de dados de sensores é o elo final dessa cadeia, entre o mundo físico e a inteligência acionável
(INTEGRAÇÃO…, 2025; GUBBI <i>et al.</i>, 2013). Este documento aplica esses conceitos a um problema concreto e recorrente
da Zona da Mata mineira: as cheias do Rio Pomba em Cataguases.</p>
<p>O município de Cataguases, com 66.261 habitantes (IBGE, 2023), é atravessado pelo Rio Pomba e pelo Ribeirão Meia
Pataca. Segundo o Serviço Geológico do Brasil (SGB, 2024), desde o início do monitoramento fluviométrico da bacia, na
década de 1930, a cota de inundação é superada na maioria dos anos. Já existem dados públicos de qualidade: estações
telemétricas da Agência Nacional de Águas e Saneamento Básico (ANA), barragens com telemetria de nível e previsão
meteorológica aberta. Falta um sistema que cruze essas fontes de forma contínua para a cidade e as converta em alertas
compreensíveis e antecipados.</p>
<p>O <b>Sentinela Pomba</b> foi concebido para preencher essa lacuna. Conforme o escopo da atividade, o foco não é a
montagem de hardware, e sim a engenharia de requisitos, o fluxo de dados do sensor até a aplicação e a prototipagem da
experiência do usuário e das automações.</p>

<h2>1.1 OBJETIVOS</h2>
<p>O objetivo geral é especificar e prototipar a camada de software, as regras de negócio e a arquitetura de
integração de um sistema IoT de monitoramento hidrológico e apoio à previsão de cheias para Cataguases/MG. Os objetivos
específicos são:</p>
<ol class="alinea">
<li>integrar, em tempo quase real, a telemetria fluviométrica e pluviométrica da ANA em Cataguases e nas estações a montante;</li>
<li>incorporar o nível dos reservatórios das barragens a montante e especificar a instrumentação de suas comportas;</li>
<li>cruzar esses dados com a previsão horária de precipitação para o dia atual e os seguintes, por sub-bacia;</li>
<li>projetar o nível do rio em Cataguases para até 72 horas e estimar o horário de cruzamento das cotas oficiais;</li>
<li>formalizar regras de negócio automáticas e tratar falhas de sensores, de conexão e de qualidade dos dados;</li>
<li>disponibilizar um protótipo funcional público, com dados reais e cenários de demonstração.</li>
</ol>

<h2>1.2 ACESSO AO PROTÓTIPO E AO CÓDIGO-FONTE</h2>
<p>O protótipo funcional (MVP) está publicado em <a href="{URL_APP}">{URL_APP}</a>. O código-fonte, incluindo
este documento, está no repositório público <a href="{URL_REPO}">{URL_REPO}</a>. O protótipo usa dados reais
da ANA e do Open-Meteo. Somente a instrumentação das comportas é simulada, e todas as telas sinalizam essa condição. O
sistema tem finalidade acadêmica e não substitui os alertas oficiais do SGB e da Defesa Civil.</p>

<h2>1.3 ORGANIZAÇÃO DO DOCUMENTO</h2>
<p>As seções 2 a 7 correspondem, nessa ordem, aos seis itens obrigatórios da Parte A da atividade: descrição do
problema e usuários; dicionário de dados do sensor; desenho da arquitetura de integração; regras de negócio
automáticas; prototipagem da interface; e análise de riscos e resiliência. A seção 8 descreve o protótipo funcional
(Parte B), e a seção 9 apresenta as considerações finais. Os apêndices trazem exemplos de uso da API e o fluxo Node-RED do
gateway simulado.</p>
</section>

<section class="secao">
<h1>2 DESCRIÇÃO DO PROBLEMA E USUÁRIOS</h1>
<h2>2.1 CONTEXTO: CATAGUASES E A BACIA DO RIO POMBA</h2>
<p>O Rio Pomba nasce na Serra da Mantiqueira, no município de Barbacena, e atravessa a Zona da Mata mineira até
desaguar no Rio Paraíba do Sul, já no estado do Rio de Janeiro. O SGB opera na bacia o Sistema de Alerta Hidrológico
(SAH-Pomba), que define cotas de referência para os municípios monitorados (Tabela {{{{tab:cotas}}}}). Pelas definições do
SGB (2024), a <i>cota de atenção</i> indica possibilidade moderada de inundação, a <i>cota de alerta</i> indica
possibilidade elevada e a <i>cota de inundação</i> é aquela em que o primeiro dano é observado no município.</p>
''' + tabela('cotas', ['Estação', 'Município', 'Atenção (cm)', 'Alerta (cm)', 'Inundação (cm)', 'Máxima registrada (cm)'], [
    ['Guarani', 'Guarani/MG', '300', '400', '500', '625 (14/02/2022)'],
    ['Barra do Xopotó', 'Astolfo Dutra/MG', '300', '500', '700', '700 (02/01/2012)'],
    ['Astolfo Dutra', 'Astolfo Dutra/MG', '300', '400', '600', '552 (17/12/2008)'],
    ['Cataguases', 'Cataguases/MG', '350', '450', '550', '985 (18/12/2008)'],
], 'Adaptado de SGB (2024, Tabelas 2 e 4).', ['22%', '20%', '13%', '13%', '14%', '18%']) + f'''
<p>A Tabela {{{{tab:cheias}}}} lista as dez maiores cheias registradas em Cataguases desde 1991. Todas superam com folga a cota
de inundação, e seis delas ocorreram entre 2020 e 2023, o que mostra a atualidade do problema. A cheia de
dezembro de 2008 foi causada pelo grande volume de chuva acumulado nas cabeceiras ao longo de cerca de uma semana (SGB,
2024). Esse é exatamente o tipo de evento que o cruzamento entre a chuva prevista a montante e a propagação da onda de
cheia permite antecipar.</p>
''' + tabela('cheias', ['Ordem', 'Data', 'Cota máxima (cm)', 'Excedente sobre a cota de inundação (cm)'], [
    ['1', '18/12/2008', '985', '435'], ['2', '03/01/2012', '910', '360'], ['3', '25/01/2020', '860', '310'],
    ['4', '14/02/2020', '822', '272'], ['5', '07/01/2023', '783', '233'], ['6', '09/01/2022', '748', '198'],
    ['7', '05/03/2020', '740', '190'], ['8', '19/01/1991', '738', '188'], ['9', '01/01/2009', '715', '165'],
    ['10', '16/01/2004', '679', '129'],
], 'Adaptado de SGB (2024, Tabela 5).', ['12%', '28%', '25%', '35%']) + f'''
<p>A Figura {{{{fig:bacia}}}} esquematiza os elementos da bacia integrados ao sistema. Rio acima de Cataguases ficam as
estações fluviométricas de Guarani e Astolfo Dutra, no Rio Pomba, e de Barra do Xopotó, no afluente Rio Xopotó. Há também
cinco barramentos com telemetria de nível: a CGH Ituerê e as PCHs Ivan Botelho I, II e III e Zé Tunin. O Ribeirão Meia Pataca,
que atravessa a área urbana e agrava as cheias, não possui estação, e por isso sua contribuição é estimada pela chuva. A UHE
Barra do Braúna fica a jusante da cidade e não contribui para as cheias em Cataguases.</p>
''' + fig('bacia', SVG_BACIA) + f'''
<h2>2.2 PROBLEMA DO MUNDO REAL</h2>
<p>O problema não é a falta de dados, e sim a falta de integração e de contexto. A telemetria da ANA é publicada estação
por estação, em formato XML e com atraso típico de 1 a 3 horas. O nível dos reservatórios das barragens aparece em
outras estações, com outra periodicidade. A previsão do tempo é consultada à parte e não é traduzida em impacto
hidrológico. Para o gestor municipal, perguntas como “o rio vai passar da cota de alerta?”, “quando?” e “o que está
fazendo o rio subir?” exigem consultar várias fontes e fazer contas de cabeça, justamente quando o tempo é crítico.
Uma leitura isolada, como 216 cm, não tem valor sem contexto (INTEGRAÇÃO…, 2025): é preciso relacioná-la às cotas da
estação, à tendência, ao que vem de montante e à chuva prevista.</p>
<p>Há ainda um segundo risco, de natureza estrutural e operacional. Barragens a montante podem realizar manobras de
comporta, ou apresentar anomalias de fundação, que alteram a vazão a jusante. A Política Nacional de Segurança de
Barragens (BRASIL, 2010) exige que empreendedores mantenham um Plano de Ação de Emergência (PAE). Um sistema que
monitore continuamente a coerência entre a pressão medida na fundação e a pressão hidrostática esperada amplia a
capacidade de detecção precoce.</p>

<h2>2.3 PÚBLICO-ALVO</h2>
<ol class="alinea">
<li><b>Defesa Civil municipal e sala de situação:</b> precisam de antecedência e de horário estimado para mobilizar
equipes, abrir abrigos e organizar evacuações; são os usuários primários do painel e dos alertas;</li>
<li><b>operadores e responsáveis técnicos das barragens a montante:</b> precisam acompanhar a saúde das comportas e o
efeito de suas manobras a jusante;</li>
<li><b>moradores das áreas ribeirinhas do Rio Pomba e do Ribeirão Meia Pataca:</b> precisam de avisos simples,
georreferenciados e com o tempo estimado de chegada da água;</li>
<li><b>gestores públicos e pesquisadores:</b> usam o histórico consolidado (resumo diário e ocorrências) para planejamento e
calibração de modelos.</li>
</ol>

<h2>2.4 VALOR ENTREGUE PELO SOFTWARE</h2>
<p>O valor do sistema está em transformar telemetria bruta em decisão:</p>
<ol class="alinea">
<li><b>visão unificada:</b> um único painel com o estado atual do rio, das estações a montante, das barragens e da chuva;</li>
<li><b>antecedência:</b> uma projeção de até 72 horas com faixa de incerteza e horário estimado de cruzamento das cotas
de atenção, alerta e inundação;</li>
<li><b>explicabilidade:</b> a decomposição da projeção por fonte (propagação, chuva por sub-bacia e descargas), que mostra o
que está fazendo o rio subir;</li>
<li><b>automação:</b> regras formais que disparam ações de software, como registro, notificação e webhook, sem depender
de análise manual;</li>
<li><b>confiabilidade:</b> tratamento explícito de falhas, de modo que o sistema nunca exiba uma situação “normal” sem
dado que a sustente.</li>
</ol>

<h2>2.5 ESCOPO E PREMISSAS</h2>
<p>O protótipo cobre o trecho do Rio Pomba a montante de Cataguases. São premissas: (a) as cotas de referência e as
curvas-chave oficiais do SGB (2024) são válidas para o período; (b) os tempos de propagação, as áreas das sub-bacias,
o nível máximo operacional dos reservatórios e a cota dos piezômetros são estimativas a calibrar com eventos
históricos; (c) a instrumentação das comportas não é pública e, por isso, é simulada, embora siga o mesmo contrato de
dados que um gateway real usaria; (d) cada cidade da bacia pode ter sua própria instância, bastando parametrizar as
estações, as cotas e as sub-bacias.</p>
</section>

<section class="secao">
<h1>3 DICIONÁRIO DE DADOS DO SENSOR</h1>
<h2>3.1 FONTES DE DADOS</h2>
<p>O Quadro {{{{qua:estacoes}}}} relaciona os pontos de monitoramento reais integrados ao sistema. Em consulta realizada
em 15 nov. 2026 às 20h (horário de Brasília), a estação de Cataguases registrava 216 cm e vazão de 189,42 m³/s, abaixo da
cota de atenção.</p>
''' + quadro('estacoes', ['Código ANA', 'Nome', 'Corpo hídrico', 'Tipo', 'Dados', 'Papel no sistema'], [
    ['58770000', 'Cataguases', 'Rio Pomba', 'Fluviométrica (RHN)', 'nível, vazão, chuva (15 min)', 'Alvo da projeção'],
    ['58735000', 'Astolfo Dutra', 'Rio Pomba', 'Fluviométrica (RHN)', 'nível, vazão, chuva (15 min)', 'Propagação (~8 h)'],
    ['58736000', 'Barra do Xopotó', 'Rio Xopotó', 'Fluviométrica', 'nível, vazão, chuva (15 min)', 'Propagação (~9 h)'],
    ['58730001', 'Guarani', 'Rio Pomba', 'Fluviométrica (RHN)', 'nível, vazão, chuva (15 min)', 'Propagação (~18 h) e redundância'],
    ['58713550', 'CGH Ituerê', 'Rio Pomba', 'Barramento (setor elétrico)', 'nível do reservatório (diário)', 'Gêmeo digital de barragem'],
    ['58730100', 'PCH Ivan Botelho I', 'Rio Pomba', 'Barramento', 'nível do reservatório (diário)', 'Gêmeo digital de barragem'],
    ['58730900', 'PCH Ivan Botelho II', 'Rio Pomba', 'Barramento', 'nível do reservatório (diário)', 'Gêmeo digital de barragem'],
    ['58731500', 'PCH Zé Tunin', 'Rio Pomba', 'Barramento', 'nível do reservatório (diário)', 'Gêmeo digital de barragem'],
    ['58731800', 'PCH Ivan Botelho III', 'Rio Pomba', 'Barramento', 'nível do reservatório (diário)', 'Gêmeo digital de barragem'],
], 'Elaborado pelo autor (2026), com dados de ANA (2026) e SGB (2024).', ['12%', '18%', '12%', '20%', '20%', '18%']) + f'''
<p>A previsão de precipitação vem da API do Open-Meteo (2026), com resolução horária, 72 horas de histórico e 96 horas
de previsão, para cinco pontos representativos das sub-bacias: cabeceiras do Pomba, médio Pomba (Guarani), Rio Xopotó,
bacia intermediária entre Astolfo Dutra e Cataguases e Ribeirão Meia Pataca.</p>

<h2>3.2 DICIONÁRIO DE DADOS</h2>
<p>O Quadro {{{{qua:dicionario}}}} detalha cada grandeza lida ou derivada, com unidade, frequência de leitura, tipo de
dado e faixa válida. As faixas válidas alimentam a regra de saneamento R8 (seção 5).</p>
''' + quadro('dicionario', ['Grandeza (campo)', 'Sensor / origem', 'Unidade', 'Frequência', 'Tipo', 'Faixa válida', 'Situação'], [
    ['Nível do rio (<code>nivel_cm</code>)', 'Régua/radar ANA', 'cm', '15 min', 'float', '0 a 1500', 'Real'],
    ['Vazão (<code>vazao</code>)', 'Curva-chave ANA', 'm³/s', '15 min', 'float', '≥ 0', 'Real'],
    ['Chuva observada (<code>chuva_mm</code>)', 'Pluviômetro de báscula', 'mm', '15 min', 'float', '≥ 0', 'Real'],
    ['Nível do reservatório (<code>nivel_reservatorio_m</code>)', 'Sensor de nível do barramento', 'm (cota)', '1 dia (ANA); 15 min (gateway)', 'float', '0 a 2000', 'Real ou simulado'],
    ['Chuva prevista (<code>mm</code>)', 'Open-Meteo', 'mm/h', '1 h (atualização 30 min)', 'float', '≥ 0', 'Real'],
    ['Abertura da comporta (<code>abertura_pct</code>)', 'Encoder / transdutor de posição', '%', '15 min; 1 min em manobra', 'float', '0 a 100', 'Simulado'],
    ['Pressão na fundação (<code>pressao_kpa</code>)', 'Piezômetro de corda vibrante', 'kPa', '15 min', 'float', '0 a 2000', 'Simulado'],
    ['Carga no mecanismo (<code>carga_pct</code>)', 'Célula de carga (<i>strain gauge</i>)', '% nominal', '15 min', 'float', '0 a 300', 'Simulado'],
    ['Vibração estrutural (<code>vibracao_mm_s</code>)', 'Acelerômetro MEMS (RMS)', 'mm/s', '15 min', 'float', '0 a 100', 'Simulado'],
    ['Timestamp (<code>timestamp</code>)', 'Relógio do gateway (NTP)', 'ISO 8601 UTC', 'por leitura', 'string', '≤ agora + 5 min', 'Real ou simulado'],
    ['Sequência (<code>seq</code>)', 'Contador do gateway', '—', 'por leitura', 'int', '≥ 0', 'Simulado'],
    ['Sensor online (<code>status</code>)', 'Derivado (idade da última leitura)', '—', 'por avaliação', 'enum', 'online, offline, sem_dados', 'Derivado'],
    ['Qualidade (<code>qualidade</code>)', 'Derivado (saneamento R8)', '—', 'por leitura', 'enum', 'ok, nulo, fora_faixa, salto', 'Derivado'],
    ['Pressão teórica (<code>pressao_teorica_kpa</code>)', 'Derivado: ρ·g·h', 'kPa', 'por leitura', 'float', '≥ 0', 'Derivado'],
], 'Elaborado pelo autor (2026).', ['24%', '17%', '9%', '13%', '10%', '13%', '14%']) + f'''

<h2>3.3 CONTRATO DO PAYLOAD DE TELEMETRIA</h2>
<p>Os dispositivos de campo (gateway das comportas) enviam leituras em JSON, como objeto único ou em lote (vetor),
segundo o contrato do Quadro {{{{qua:payload}}}}. O par <code>dispositivo_id</code> + <code>timestamp</code> forma a chave
natural de idempotência.</p>
''' + quadro('payload', ['Campo', 'Tipo', 'Obrigatório', 'Descrição'], [
    ['<code>dispositivo_id</code>', 'string', 'sim', 'Identificador do gêmeo digital (ex.: <code>ze-tunin</code>, <code>ivan-botelho-3</code>)'],
    ['<code>timestamp</code>', 'string ISO 8601', 'sim', 'Instante da medição no dispositivo (não o da chegada); rejeitado se estiver no futuro'],
    ['<code>seq</code>', 'int', 'não', 'Número sequencial para detectar lacunas e reordenação'],
    ['<code>leituras</code>', 'objeto', 'sim', 'Grandezas do Quadro {{qua:dicionario}}; campos fora de faixa ficam em quarentena (nulos)'],
], 'Elaborado pelo autor (2026).', ['22%', '16%', '12%', '50%']) + f'''
<p>Exemplo de payload:</p>
<pre class="codigo">{{"dispositivo_id": "ivan-botelho-3", "timestamp": "2026-11-16T12:00:00Z", "seq": 1042,
 "leituras": {{"abertura_pct": 18.5, "nivel_reservatorio_m": 286.2, "pressao_kpa": 129.4,
              "carga_pct": 63.2, "vibracao_mm_s": 2.1}}}}</pre>
</section>

<section class="secao">
<h1>4 ARQUITETURA DE INTEGRAÇÃO</h1>
<h2>4.1 VISÃO GERAL DO FLUXO END-TO-END</h2>
<p>A Figura {{{{fig:arquitetura}}}} apresenta o diagrama de blocos do fluxo <i>end-to-end</i> exigido pela atividade:
Sensor/Gateway, Protocolo/Broker, Middleware, Banco de Dados e Aplicação Web. A arquitetura segue a organização em
camadas descrita no material da disciplina (INTEGRAÇÃO…, 2025): sensores e dispositivos, comunicação e recepção,
integração e processamento, armazenamento, aplicação e, por fim, usuários e sistemas de atuação.</p>
''' + fig('arquitetura', SVG_ARQ) + f'''
<p>Cada nova leitura passa pelas etapas da Figura {{{{fig:pipeline}}}}. O dado deixa de ser um registro passivo e passa a
ser gatilho para operações do sistema: atualização do gêmeo digital, avaliação das regras, registro e notificação.</p>
''' + fig('pipeline', SVG_PIPE) + f'''
<h2>4.2 CAMADAS E COMPONENTES</h2>
''' + quadro('camadas', ['Camada', 'Responsabilidade', 'Protótipo', 'Evolução para produção'], [
    ['1. Sensor / Gateway', 'Medir as grandezas físicas e enviar telemetria com timestamp de origem', 'Estações ANA (reais); instrumentação de comportas simulada; gateway Node-RED (Apêndice B)', 'Gateway ESP32/industrial com buffer em flash, NTP e certificado X.509 por dispositivo'],
    ['2. Protocolo / Broker', 'Transportar as mensagens com segurança e confiabilidade', 'HTTPS (REST) para a ANA (pull) e para a ingestão (push JSON)', 'MQTT 5 sobre TLS, QoS 1, broker gerenciado; tópicos <code>pomba/&lt;barragem&gt;/comporta</code>'],
    ['3. Middleware', 'Validar, contextualizar, modelar, avaliar regras e acionar', 'Next.js (rotas de API serverless, região São Paulo)', 'Microsserviços de ingestão, regras e notificação desacoplados por fila'],
    ['4. Banco de dados', 'Persistir telemetria, alertas e consolidados', 'Google Sheets via API Apps Script, com fallback em memória', 'Banco de séries temporais (ex.: PostgreSQL/TimescaleDB) com retenção'],
    ['5. Aplicação', 'Visualizar, alertar e permitir simulação', 'Aplicação web responsiva (React)', 'App móvel com push georreferenciado e integração com SMS da Defesa Civil'],
], 'Elaborado pelo autor (2026).', ['17%', '24%', '29%', '30%']) + f'''

<h2>4.3 PADRÕES DE INTEGRAÇÃO</h2>
<p>A escolha do padrão depende da latência e da vazão exigidas (INTEGRAÇÃO…, 2025). O Quadro {{{{qua:padroes}}}} resume as
decisões. A telemetria da ANA é consumida por <i>pull</i> RESTful agendado, já que a fonte é um serviço web
tradicional. A ingestão de dispositivos próprios usa <i>push</i> HTTP no protótipo e MQTT com QoS 1 em produção. Como
o QoS 1 garante entrega “pelo menos uma vez” e pode gerar duplicatas, o middleware trata todas as escritas de forma
idempotente (OASIS, 2019).</p>
''' + quadro('padroes', ['Fluxo', 'Padrão', 'Justificativa'], [
    ['ANA → middleware', 'RESTful (HTTP GET agendado, a cada 15 min)', 'Fonte externa expõe apenas serviço web; o atraso de publicação (1 a 3 h) dispensa tempo real estrito'],
    ['Open-Meteo → middleware', 'RESTful com cache (30 min)', 'Previsão atualizada em intervalos regulares; o cache reduz chamadas e latência'],
    ['Gateway → middleware', 'HTTP POST (protótipo); Pub/Sub MQTT QoS 1 (produção)', 'Pub/Sub desacopla os dispositivos e economiza energia; QoS 1 evita perdas e a idempotência neutraliza duplicatas'],
    ['Middleware → atores externos', 'Webhooks (HTTP POST)', 'Integração imediata com Defesa Civil, operadores de usina e serviços de SMS/push'],
    ['Middleware → banco', 'RESTful (API Apps Script)', 'Banco de prototipagem acessível e auditável; contrato com upsert idempotente'],
], 'Elaborado pelo autor (2026), com base em INTEGRAÇÃO… (2025).', ['24%', '30%', '46%']) + f'''

<h2>4.4 GÊMEO DIGITAL E MODELO DE PROJEÇÃO</h2>
<p>Cada estação e cada barragem é representada por um gêmeo digital (<i>device shadow</i>), um objeto que
armazena os metadados estáticos (código, rio, coordenadas, tempo de propagação), o estado atual (última leitura válida,
taxa de variação em 1 e 3 horas, status online/offline) e os metadados operacionais (cotas de referência, curva-chave,
nível máximo operacional, cota do piezômetro). Quando uma leitura chega, o software não cria um registro do zero:
atualiza o gêmeo correspondente e dispara as regras associadas (INTEGRAÇÃO…, 2025).</p>
<p>A conversão entre nível (H) e vazão (Q) usa a curva-chave oficial da estação, Q = a·(H − h₀)ⁿ, com H em metros e
os parâmetros da Tabela {{{{tab:curva}}}}. Para a leitura de 216 cm, a equação do primeiro trecho resulta em
aproximadamente 186 m³/s, valor coerente com os 189,42 m³/s publicados pela ANA para o mesmo instante.</p>
''' + tabela('curva', ['Trecho', 'a', 'h₀ (m)', 'n', 'Limite inferior (cm)', 'Limite superior (cm)'], [
    ['1', '70,9616', '0,27', '1,51', '50', '237'], ['2', '80,8601', '0,09', '1,20', '237', '395'], ['3', '66,7042', '0,00', '1,32', '395', '900'],
], 'SGB (2024, Tabela 6).', ['14%', '16%', '14%', '14%', '21%', '21%']) + f'''
<p>A projeção do nível em Cataguases para o horizonte h (de 0 a 72 horas) soma à vazão atual três contribuições,
inspiradas na modelagem linear empírica do SAH-Pomba, que usa as vazões a montante como entrada (SGB, 2024), e no método
racional com hidrograma unitário triangular (TUCCI, 2009):</p>
<pre class="codigo">Q(t+h) = Q_atual + ΔQ_propagação(h) + ΔQ_chuva(h) + ΔQ_descargas(h)
H(t+h) = curva-chave⁻¹( Q(t+h) )

ΔQ_propagação(h): variação de vazão observada a montante, defasada pelo tempo de viagem
                  (Astolfo Dutra ≈ 8 h; Barra do Xopotó ≈ 9 h; Guarani ≈ 18 h)
ΔQ_chuva(h):      Σ sub-bacias  C · P · A, distribuído por hidrograma triangular (tp, tb)
                  C = 0,05 + 0,35 · (P_72h / 150)^1,5   (umidade antecedente do solo)
ΔQ_descargas(h):  vazão adicional de comportas, defasada até Cataguases</pre>
<p>A incerteza da projeção cresce com o horizonte e com o número de sensores offline. O resultado é apresentado como
faixa (mínimo e máximo), e não como valor pontual. O modelo é deliberadamente simples e explicável. Seus parâmetros
estimados (tempos de propagação, áreas, tp e tb) devem ser calibrados com os eventos da Tabela {{{{tab:cheias}}}} antes de uso
operacional.</p>

<h2>4.5 INTERFACES DE PROGRAMAÇÃO</h2>
<p>O middleware expõe as rotas do Quadro {{{{qua:api}}}}. Exemplos de requisição e resposta estão no Apêndice A.</p>
''' + quadro('api', ['Método e rota', 'Finalidade', 'Observações'], [
    ['<code>GET /api/estado?cenario=…</code>', 'Estado completo: gêmeos digitais, projeção, contribuições, alertas, regras e insights', 'Cenários: real, cheia, comporta, estrutural, falhas'],
    ['<code>POST /api/telemetria</code>', 'Ingestão de telemetria do gateway (objeto ou lote de até 500 leituras)', 'Validação de contrato, quarentena por campo e idempotência; HTTP 202, 400 ou 422'],
    ['<code>GET /api/telemetria</code>', 'Documentação do contrato do payload', 'Autodescritivo'],
    ['<code>GET /api/coleta</code>', 'Job agendado: coleta, regras, persistência de alertas e resumo diário', 'GitHub Actions (15 min) e Vercel Cron (diário)'],
    ['<code>GET /api/alertas</code>', 'Histórico de ocorrências', 'Lido do banco; fallback em memória'],
    ['<code>GET /api/saude</code>', 'Verificação de saúde da persistência', 'Ping e leitura autenticada no banco'],
], 'Elaborado pelo autor (2026).', ['30%', '40%', '30%']) + f'''
</section>

<section class="secao">
<h1>5 REGRAS DE NEGÓCIO AUTOMÁTICAS</h1>
<p>A regra de negócio é a “inteligência” do software: traduz o fenômeno físico em decisão computacional
(INTEGRAÇÃO…, 2025). Foram especificadas oito regras formais no formato SE &lt;condição&gt; [E/OU &lt;condição&gt;]
ENTÃO &lt;ação_de_software&gt;, acima do mínimo de três exigido. Todas foram implementadas e são avaliadas a cada
atualização dos dados. Os limiares são parametrizáveis.</p>
<h2>5.1 ESPECIFICAÇÃO FORMAL</h2>
''' + regra('R1', 'Cota observada em Cataguases',
'SE   nivel_cataguases ≥ 550 cm ENTÃO estado ← EMERGÊNCIA\nSENÃO SE nivel_cataguases ≥ 450 cm ENTÃO estado ← ALERTA\nSENÃO SE nivel_cataguases ≥ 350 cm ENTÃO estado ← ATENÇÃO',
'atualizar o estado da cidade no gêmeo digital, registrar a ocorrência (regra, alvo, timestamp) e, a partir de ALERTA, notificar a Defesa Civil por webhook/SMS.') \
+ regra('R2', 'Previsão de cruzamento de cota',
'SE   nivel_projetado(t + 12 h) ≥ 450 cm\n  E  chuva_prevista_24h(média da bacia) ≥ 30 mm\nENTÃO emitir ALERTA ANTECIPADO (EMERGÊNCIA se projeção ≥ 550 cm)',
'publicar boletim com o horário estimado de cruzamento das cotas, enviar push aos moradores das áreas de risco e acionar o plano de contingência.') \
+ regra('R3', 'Onda de cheia a montante',
'SE   taxa_subida(estação_montante, 1 h) ≥ 20 cm/h\nENTÃO emitir aviso de onda de cheia com ETA = tempo_propagação(estação)',
'notificar a sala de situação com a estação de origem e o horário previsto de chegada em Cataguases.') \
+ regra('R4', 'Descarga brusca de barragem',
'SE   Δabertura_comporta(30 min) ≥ 30 p.p.\n  E  nivel_reservatorio ≥ 95% do NA máximo operacional\nENTÃO emitir ALERTA de descarga com vazão adicional e ETA até Cataguases',
'abrir chamado (webhook) para o operador da usina, notificar a Defesa Civil e somar a descarga à projeção hidrológica.') \
+ regra('R5', 'Integridade estrutural: pressão medida × pressão hidrostática',
'SE   |pressão_medida − ρ·g·h| / (ρ·g·h) ≥ 15% em 3 leituras consecutivas\n  E  (vibração ≥ 7,1 mm/s OU carga ≥ 110% da nominal)\nENTÃO EMERGÊNCIA estrutural\nSENÃO SE apenas o desvio de pressão persistir\nENTÃO ATENÇÃO (inspecionar: infiltração/subpressão ou sensor descalibrado)',
'acionar o PAE da barragem (BRASIL, 2010) e a equipe de inspeção, registrar o histórico para auditoria e reduzir o índice de saúde do ativo.') \
+ regra('R6', 'Enxurrada no Ribeirão Meia Pataca',
'SE   chuva_prevista_3h(Meia Pataca) ≥ 25 mm\n  E  chuva_acumulada_72h ≥ 60 mm\nENTÃO ALERTA de enxurrada urbana (afluente sem estação: estimativa por chuva)',
'enviar push georreferenciado aos bairros ribeirinhos do Meia Pataca.') \
+ regra('R7', 'Sensor offline',
'SE   agora − timestamp(última_leitura_válida) > 240 min\nENTÃO status_sensor ← OFFLINE',
'marcar o gêmeo digital como OFFLINE, ampliar a incerteza da projeção, usar a estação redundante (Guarani no lugar de Astolfo Dutra) e notificar a manutenção. O sistema nunca exibe “normal” sem dado que o sustente.') \
+ regra('R8', 'Dado nulo ou corrompido',
'SE   leitura = nula\n  OU leitura ∉ [0; 1500] cm\n  OU |Δleitura| > 100 cm em 15 min\nENTÃO descartar a leitura (quarentena)',
'excluir a leitura dos cálculos, manter o último valor válido, registrar a ocorrência e contabilizar no indicador de qualidade de dados.') \
+ quadro('regras', ['Regra', 'Categoria', 'Entradas cruzadas', 'Severidade máxima'], [
    ['R1', 'Hidrologia', 'nível observado × cotas oficiais', 'Emergência'],
    ['R2', 'Previsão', 'projeção (montante + chuva + descargas) × chuva prevista', 'Emergência'],
    ['R3', 'Propagação', 'taxa de subida a montante × tempo de propagação', 'Alerta'],
    ['R4', 'Barragens', 'abertura de comporta × nível do reservatório', 'Alerta'],
    ['R5', 'Barragens', 'pressão medida × ρ·g·h × vibração × carga', 'Emergência'],
    ['R6', 'Previsão', 'chuva prevista em 3 h × umidade antecedente', 'Alerta'],
    ['R7', 'Resiliência', 'idade da última leitura válida', 'Alerta'],
    ['R8', 'Resiliência', 'nulidade, faixa física e salto temporal', 'Informativo'],
], 'Elaborado pelo autor (2026).', ['10%', '18%', '52%', '20%']) + f'''
<h2>5.2 ÍNDICE DE RISCO E INSIGHTS</h2>
<p>Além das regras, o sistema calcula um índice de risco de 0 a 100 que combina o nível atual e o projetado em relação
à cota de inundação (peso 0,55, com efeito quadrático), a chuva prevista em 24 horas (0,20), a umidade antecedente (0,10) e
a pior saúde de barragem (0,15). O índice nunca fica abaixo do patamar correspondente à severidade máxima das regras
disparadas: 30 para Atenção, 60 para Alerta e 85 para Emergência. Ele é classificado em NORMAL, ATENÇÃO, ALERTA ou
EMERGÊNCIA e vem acompanhado de insights em linguagem natural, como a comparação do pico projetado com cheias
históricas e a identificação do principal fator de variação nas próximas 12 horas.</p>
</section>

<section class="secao">
<h1>6 PROTOTIPAGEM DA INTERFACE</h1>
<p>A interface foi prototipada diretamente como aplicação web funcional, acessível em <a href="{URL_APP}">{URL_APP}</a>.
As capturas a seguir foram obtidas do protótipo publicado. O Quadro {{{{qua:telas}}}} relaciona as telas aos requisitos.</p>
''' + quadro('telas', ['Tela (rota)', 'Conteúdo', 'Usuário principal'], [
    ['Painel (<code>/</code>)', 'Índice de risco, insights, nível atual, pico projetado, chuva, gráfico observado × projetado, estações a montante, chuva por sub-bacia e decomposição da projeção', 'Defesa Civil, gestores'],
    ['Barragens (<code>/barragens</code>)', 'Nível real dos reservatórios, abertura de comporta, pressão medida × teórica, vibração, carga e índice de saúde', 'Operadores de barragens'],
    ['Alertas e regras (<code>/alertas</code>)', 'Alertas ativos com ação de software, catálogo formal das regras com avaliação em tempo real e histórico', 'Sala de situação'],
    ['Simulador (<code>/simulador</code>)', 'Seleção de cenários e envio manual de telemetria (papel do gateway)', 'Avaliação e testes'],
    ['Arquitetura (<code>/arquitetura</code>)', 'Problema, diagrama, dicionário de dados, modelo, riscos e fontes', 'Equipe técnica'],
], 'Elaborado pelo autor (2026).', ['24%', '52%', '24%']) + '''
<h2>6.1 PAINEL DE CATAGUASES</h2>
<p>O painel (Figura {{fig:painel_real}}) prioriza a pergunta “há risco?”, com um medidor de índice de risco e uma
lista de insights. Logo abaixo ficam os indicadores-chave e o gráfico do nível observado e projetado (Figura
{{fig:grafico_real}}), com as cotas oficiais tracejadas e a faixa de incerteza. A Figura {{fig:chuva}} mostra a
previsão de chuva por sub-bacia e o coeficiente de escoamento resultante da umidade antecedente.</p>
''' + img('painel_real', '01-painel-real.png') + img('grafico_real', '02-grafico-real.png') + img('chuva', '03-chuva.png', '92%') + '''
<p>No cenário de demonstração “Cheia de verão” (Figuras {{fig:painel_cheia}} e {{fig:grafico_cheia}}), o rio já está
acima da cota de alerta e subindo, com solo saturado e chuva adicional prevista. O sistema projeta um pico na faixa das
maiores cheias históricas, informa o horário estimado de cruzamento da cota de inundação e dispara as regras R1, R2 e R6. Uma
faixa amarela no topo da tela deixa claro que os dados exibidos são fictícios.</p>
''' + img('painel_cheia', '04-painel-cheia.png') + img('grafico_cheia', '05-grafico-cheia.png') + '''
<h2>6.2 BARRAGENS E COMPORTAS</h2>
<p>A Figura {{fig:barragem}} mostra o cartão de uma barragem no cenário de anomalia estrutural. O gráfico compara a
pressão medida pelo piezômetro (linha cheia) com a pressão hidrostática teórica (linha tracejada) e a abertura da
comporta (área). O descolamento persistente das curvas, somado à vibração e à carga elevadas, reduz o índice de saúde
e dispara a regra R5. Selos indicam a origem de cada dado: nível real (ANA), instrumentação simulada ou recebida via
gateway.</p>
''' + img('barragem', '06-barragem-estrutural.png', '78%') + '''
<h2>6.3 ALERTAS E REGRAS</h2>
<p>A tela de alertas (Figura {{fig:alertas}}) mostra cada alerta com severidade, regra de origem, alvo, mensagem
e ação de software. O catálogo exibe a especificação formal de cada regra, se foi disparada e os valores que levaram à
avaliação, o que torna o motor de regras auditável.</p>
''' + img('alertas', '07-alertas-comporta.png') + '''
<h2>6.4 SIMULADOR E RESPONSIVIDADE</h2>
<p>O simulador (Figura {{fig:simulador}}) permite alternar entre os cenários do Quadro {{qua:cenarios}} e enviar
telemetria manualmente, inclusive para testar casos de resiliência: timestamp repetido, valor fora de faixa, JSON
malformado e lote retransmitido. A interface é responsiva e pode ser usada em campo por meio de dispositivos móveis (Figura
{{fig:mobile}}).</p>
''' + img('simulador', '09-simulador.png') + img('mobile', '11-mobile.png', '34%') + '''
</section>

<section class="secao">
<h1>7 ANÁLISE DE RISCOS E RESILIÊNCIA DO SOFTWARE</h1>
<p>A pergunta mais importante não é “o dado chega?”, mas “o dado chega do jeito certo, no tempo certo e com a confiança
necessária?” (INTEGRAÇÃO…, 2025). O Quadro {{qua:riscos}} detalha o tratamento das falhas exigidas pela atividade e de
outras identificadas durante o desenvolvimento. Todos os tratamentos marcados como implementados podem ser verificados
no protótipo.</p>
<h2>7.1 TRATAMENTO DE FALHAS</h2>
''' + quadro('riscos', ['Falha', 'Detecção', 'Tratamento', 'Status'], [
    ['Sensor offline', 'Idade da última leitura válida > 240 min (R7)', 'Gêmeo digital em OFFLINE; projeção com estação redundante (Guarani) e incerteza ampliada; nunca exibe “normal” sem dado; notificação de manutenção', 'Implementado'],
    ['Perda de conexão com a internet (gateway)', 'Falha ou timeout no envio', '<i>Store-and-forward</i>: buffer circular local (FIFO, até 500 leituras), retransmissão em lote com timestamps originais e vazão controlada; relógio sincronizado por NTP', 'Implementado no fluxo Node-RED; servidor aceita lotes'],
    ['Retransmissão e duplicatas', 'Chave natural repetida', 'Escrita idempotente por <code>dispositivo_id|timestamp</code> (telemetria), <code>regra|alvo|cenário|janela</code> (alertas) e <code>dia</code> (resumo); resposta “duplicada_ignorada”', 'Implementado'],
    ['Dados nulos ou corrompidos', 'Nulidade, faixa física, salto > 100 cm/15 min, JSON malformado', 'Quarentena (R8); leitura excluída dos cálculos; JSON inválido → HTTP 400; campo fora de faixa → nulo com aviso; linhas corrompidas no banco são ignoradas na leitura', 'Implementado'],
    ['Indisponibilidade de fonte externa (ANA, Open-Meteo)', 'HTTP 5xx ou timeout', 'Nova tentativa com <i>backoff</i>; último dado bom em cache; chamadas paralelas independentes; indicação da fonte afetada na interface', 'Implementado (observado em produção: ANA retornou HTTP 500)'],
    ['Indisponibilidade do banco', 'Erro ou timeout na API do banco', 'Degradação graciosa: regras continuam em memória; escritas não bloqueiam o fluxo', 'Implementado'],
    ['Atraso de publicação', 'Defasagem típica de 1 a 3 h na ANA', 'Projeção ancorada no timestamp da última leitura, e não no relógio do servidor; limiar de offline compatível', 'Implementado'],
    ['Falso positivo/negativo', '—', 'Regras compostas (R2 exige projeção E chuva; R5 exige 3 leituras consecutivas); cotas oficiais; limiares parametrizáveis', 'Implementado'],
    ['Leituras fora de ordem', 'Timestamp anterior ao último recebido', 'Séries ordenadas por timestamp de origem antes do processamento', 'Implementado'],
], 'Elaborado pelo autor (2026).', ['17%', '20%', '45%', '18%']) + '''
<h2>7.2 REQUISITOS NÃO FUNCIONAIS</h2>
''' + quadro('rnf', ['ID', 'Requisito', 'Métrica / critério de aceitação'], [
    ['RNF01', 'Disponibilidade', 'Painel acessível mesmo com uma fonte externa indisponível; degradação graciosa sem erro fatal'],
    ['RNF02', 'Latência de ingestão', 'Coleta a cada 15 min; leitura disponível no painel em até 5 min após publicada pela fonte'],
    ['RNF03', 'Integridade', 'Zero duplicatas por chave natural; zero leituras inválidas usadas em cálculos'],
    ['RNF04', 'Rastreabilidade', 'Todo alerta registrado com regra, alvo, cenário, mensagem, ação e timestamp'],
    ['RNF05', 'Explicabilidade', 'Toda projeção acompanhada da decomposição por fonte e da faixa de incerteza'],
    ['RNF06', 'Usabilidade', 'Interface responsiva; estado de risco compreensível em menos de 5 segundos; dados simulados sempre sinalizados'],
    ['RNF07', 'Segurança', 'Tráfego exclusivamente HTTPS; segredos apenas em variáveis de ambiente do servidor'],
    ['RNF08', 'Escalabilidade', 'Nova cidade adicionada por configuração (estações, cotas, sub-bacias), sem alteração de código'],
], 'Elaborado pelo autor (2026).', ['10%', '22%', '68%']) + '''
<h2>7.3 SEGURANÇA</h2>
<p>O protótipo adota segurança em camadas compatível com seu propósito: todo o tráfego usa TLS (HTTPS), e as
credenciais do banco ficam apenas em variáveis de ambiente criptografadas do servidor, nunca no código-fonte ou no
navegador. Por se tratar de demonstração pública, o endpoint de ingestão aceita envios sem credencial e, em
contrapartida, valida rigorosamente contrato, faixas e identificadores de dispositivo. Para produção, conforme o
material da disciplina (INTEGRAÇÃO…, 2025), especifica-se: identidade individual por dispositivo com certificado X.509 e
autenticação mútua, ou tokens JWT de curta validade e escopo restrito ao próprio tópico; rotação periódica de
credenciais; MQTT sobre TLS (MQTTS); limitação de taxa por dispositivo; e registro de auditoria. Credenciais estáticas
compartilhadas por toda a frota devem ser evitadas, pois um único dispositivo comprometido exporia todos os demais.</p>
</section>

<section class="secao">
<h1>8 PROTÓTIPO FUNCIONAL</h1>
<h2>8.1 IMPLEMENTAÇÃO E IMPLANTAÇÃO</h2>
<p>O protótipo foi implementado em TypeScript com o framework Next.js (VERCEL, 2026), reunindo em um único projeto as
rotas de API (middleware) e a aplicação web. A publicação usa a plataforma Vercel, com funções serverless na região de
São Paulo para reduzir a latência até as APIs brasileiras. O código-fonte está versionado no GitHub, e cada alteração na
ramificação principal gera uma nova publicação automaticamente. A persistência usa uma planilha Google Sheets exposta por
uma API em Apps Script, com escritas idempotentes. A coleta é disparada a cada 15 minutos por um fluxo agendado no
GitHub Actions e consolidada diariamente pelo Vercel Cron.</p>
<p>A organização do código reflete a arquitetura: <code>lib/fontes.ts</code> (ingestão), <code>lib/modelo.ts</code>
(saneamento, curva-chave e projeção), <code>lib/regras.ts</code> (catálogo formal), <code>lib/estado.ts</code>
(orquestração e motor de regras), <code>lib/simulador.ts</code> (sensores simulados e cenários) e
<code>lib/store.ts</code> (persistência).</p>
<h2>8.2 ROTEIRO DE DEMONSTRAÇÃO</h2>
''' + quadro('cenarios', ['Cenário', 'O que é simulado', 'Comportamento esperado'], [
    ['Dados reais', 'Somente a instrumentação das comportas, em regime normal', 'Estado real do rio e projeção com a chuva prevista real'],
    ['Cheia de verão', 'Subida em todas as estações, solo saturado e chuva adicional', 'R1, R2 e R6 disparadas; projeção cruza a cota de inundação; índice EMERGÊNCIA'],
    ['Abertura brusca de comporta', 'Comporta da PCH Ivan Botelho III de 15% para 90% em 20 min, com reservatório a 99%', 'R4 disparada; descarga somada à projeção com ETA ≈ 10 h'],
    ['Anomalia estrutural', 'Pressão 28% acima de ρ·g·h, vibração e carga elevadas na PCH Zé Tunin', 'R5 em EMERGÊNCIA; saúde do ativo reduzida a 0/100'],
    ['Falhas de sensores', 'Astolfo Dutra sem transmitir há 6 h; leituras nula e com salto impossível em Cataguases', 'R7 e R8 disparadas; redundância por Guarani; leituras em quarentena'],
], 'Elaborado pelo autor (2026).', ['20%', '42%', '38%']) + '''
<p>Os cenários valem apenas para o navegador de quem os seleciona e não afetam outros usuários. O envio manual de
telemetria pelo simulador demonstra o papel do gateway e a integração com o banco de dados.</p>
<h2>8.3 FERRAMENTAS UTILIZADAS</h2>
<p>A atividade sugere Figma/Draw.io, Node-RED, Grafana e Python (FastAPI/Flask) como ferramentas possíveis. O Quadro
{{qua:ferramentas}} mostra como cada papel previsto foi atendido. A opção por uma aplicação web funcional publicada
reúne em um único artefato o protótipo de telas, a API de telemetria, o motor de regras e os painéis de séries
temporais, operando com dados reais.</p>
''' + quadro('ferramentas', ['Ferramenta sugerida', 'Papel previsto na atividade', 'Como foi atendido'], [
    ['Figma / Draw.io', 'Prototipagem de telas e diagrama de arquitetura', 'Telas implementadas e publicadas (seção 6); diagramas das Figuras 1 a 3 e da página <code>/arquitetura</code>'],
    ['Node-RED', 'Simulação de sensores (nós <i>Inject</i>), regras SE…ENTÃO e envio de webhooks', 'Fluxo do gateway com <i>Inject</i>, regra de borda e <i>store-and-forward</i> (Apêndice B), além do simulador web'],
    ['Grafana', 'Painéis analíticos de séries temporais', 'Gráficos de nível observado × projetado, chuva por sub-bacia e pressão × abertura (Recharts)'],
    ['Python (FastAPI/Flask)', 'API de recepção de telemetria e execução das regras', 'API equivalente em TypeScript/Next.js: <code>POST /api/telemetria</code> e motor de regras R1–R8'],
], 'Elaborado pelo autor (2026).', ['20%', '35%', '45%']) + '''
</section>

<section class="secao">
<h1>9 CONSIDERAÇÕES FINAIS</h1>
<p>Este trabalho especificou e prototipou o Sentinela Pomba, um sistema IoT que integra telemetria fluviométrica real,
o nível de reservatórios de barragens, a instrumentação de comportas e a previsão do tempo para apoiar a antecipação de
cheias em Cataguases. A solução percorre todo o ciclo descrito na disciplina: capturar o evento, contextualizá-lo
em gêmeos digitais, avaliar regras, executar ações e registrar o histórico (INTEGRAÇÃO…, 2025).</p>
<p>Entre os resultados, destacam-se o uso de dados reais e de parâmetros oficiais (cotas de referência e
curvas-chave do SGB), a projeção explicável com horário estimado de cruzamento de cotas, a regra de integridade
estrutural que confronta a pressão medida com a pressão hidrostática teórica e o tratamento explícito de falhas. Uma
dessas falhas, a indisponibilidade temporária da API da ANA, ocorreu de fato durante os testes e foi absorvida pelos
mecanismos de resiliência especificados.</p>
<p>As principais limitações são a natureza simulada da instrumentação de comportas, cujos dados não são públicos, e os
parâmetros estimados do modelo de projeção. Como trabalhos futuros, propõem-se: (a) calibrar o modelo com as séries
históricas das cheias de 2008 a 2023 e medir o erro de previsão por horizonte; (b) integrar pluviômetros do CEMADEN e o
radar meteorológico; (c) migrar a ingestão de dispositivos para MQTT com identidade X.509 por dispositivo; (d) migrar a
persistência para um banco de séries temporais; e (e) integrar os alertas aos canais oficiais da Defesa Civil.</p>
</section>
'''

REFERENCIAS = [
    'AGÊNCIA NACIONAL DE ÁGUAS E SANEAMENTO BÁSICO (Brasil). <b>Telemetria hidrometeorológica</b>: serviço de dados hidrometeorológicos (ServiceANA). Brasília, DF: ANA, 2026. Disponível em: http://telemetriaws1.ana.gov.br/ServiceANA.asmx. Acesso em: 16 nov. 2026.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 6023</b>: informação e documentação: referências: elaboração. Rio de Janeiro: ABNT, 2018.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 6024</b>: informação e documentação: numeração progressiva das seções de um documento: apresentação. Rio de Janeiro: ABNT, 2012.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 6027</b>: informação e documentação: sumário: apresentação. Rio de Janeiro: ABNT, 2012.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 6028</b>: informação e documentação: resumo, resenha e recensão: apresentação. Rio de Janeiro: ABNT, 2021.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 10520</b>: informação e documentação: citações em documentos: apresentação. Rio de Janeiro: ABNT, 2023.',
    'ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <b>NBR 14724</b>: informação e documentação: trabalhos acadêmicos: apresentação. Rio de Janeiro: ABNT, 2011.',
    'BRASIL. Lei nº 12.334, de 20 de setembro de 2010. Estabelece a Política Nacional de Segurança de Barragens destinadas à acumulação de água para quaisquer usos, à disposição final ou temporária de rejeitos e à acumulação de resíduos industriais, cria o Sistema Nacional de Informações sobre Segurança de Barragens e altera a redação do art. 35 da Lei nº 9.433, de 8 de janeiro de 1997, e do art. 4º da Lei nº 9.984, de 17 de julho de 2000. <b>Diário Oficial da União</b>: seção 1, Brasília, DF, 21 set. 2010.',
    f'DEMARQUE, Filipe da Silva. <b>Sentinela Pomba</b>: protótipo de monitoramento hidrológico e apoio à previsão de cheias para Cataguases/MG. Juiz de Fora, 2026. Aplicação web. Disponível em: {URL_APP}. Acesso em: 16 nov. 2026.',
    f'DEMARQUE, Filipe da Silva. <b>analise-dados-iot-sensores-ufjf-1322010-2025.3-A</b>: repositório do projeto Sentinela Pomba. [<i>S. l.</i>]: GitHub, 2026. Disponível em: {URL_REPO}. Acesso em: 16 nov. 2026.',
    'GUBBI, Jayavardhana <i>et al</i>. Internet of Things (IoT): a vision, architectural elements, and future directions. <b>Future Generation Computer Systems</b>, Amsterdam, v. 29, n. 7, p. 1645-1660, 2013.',
    'INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. <b>Censo demográfico 2022</b>: população e domicílios: primeiros resultados. Rio de Janeiro: IBGE, 2023.',
    'INTEGRAÇÃO de dados de sensores em projetos de softwares. <i>In</i>: UNIVERSIDADE FEDERAL DE JUIZ DE FORA. <b>Análise de dados de dispositivos IoT e de sensores</b>: unidade 5. Juiz de Fora: UFJF, 2025. Material didático da disciplina.',
    'KLEPPMANN, Martin. <b>Designing data-intensive applications</b>: the big ideas behind reliable, scalable, and maintainable systems. Sebastopol: O’Reilly Media, 2017.',
    'OASIS. <b>MQTT version 5.0</b>. [<i>S. l.</i>]: OASIS, 2019. OASIS Standard.',
    'OPEN-METEO. <b>Weather forecast API</b>. [<i>S. l.</i>], 2026. Disponível em: https://open-meteo.com/en/docs. Acesso em: 16 nov. 2026.',
    'RICHARDSON, Chris. <b>Microservices patterns</b>: with examples in Java. Shelter Island: Manning, 2018.',
    'SERVIÇO GEOLÓGICO DO BRASIL. <b>Sistema de Alerta Hidrológico da Bacia do Rio Pomba</b>: relatório anual 2024. [<i>S. l.</i>]: SGB-CPRM, 2024. Disponível em: https://rigeo.sgb.gov.br/bitstream/doc/24903/1/relatorio_anual_2024_sah_pomba.pdf. Acesso em: 16 nov. 2026.',
    'TUCCI, Carlos Eduardo Morelli (org.). <b>Hidrologia</b>: ciência e aplicação. 4. ed. Porto Alegre: Editora da UFRGS: ABRH, 2009.',
    'VERCEL. <b>Next.js documentation</b>. [<i>S. l.</i>], 2026. Disponível em: https://nextjs.org/docs. Acesso em: 16 nov. 2026.',
]

APENDICES = f'''
<section class="secao">
<h1 class="sem-numero">APÊNDICE A – EXEMPLOS DE REQUISIÇÕES À API</h1>
<p class="ap">Envio de uma leitura de telemetria do gateway:</p>
<pre class="codigo">curl -X POST {URL_APP}/api/telemetria \\
  -H 'Content-Type: application/json' \\
  -d '{{"dispositivo_id":"ze-tunin","timestamp":"2026-11-16T12:00:00Z","seq":7,
       "leituras":{{"abertura_pct":18,"nivel_reservatorio_m":304.2,"pressao_kpa":119,
                   "carga_pct":62,"vibracao_mm_s":2.1}}}}'</pre>
<p class="ap">Resposta da primeira requisição (HTTP 202):</p>
<pre class="codigo">{{"recebidas":1,"aceitas":1,"resultados":[{{"status":"aceita","dispositivo_id":"ze-tunin",
  "timestamp":"2026-11-16T12:00:00.000Z","quarentena":[]}}]}}</pre>
<p class="ap">Resposta ao reenvio da mesma leitura (retransmissão idempotente):</p>
<pre class="codigo">{{"recebidas":1,"aceitas":0,"resultados":[{{"status":"duplicada_ignorada","dispositivo_id":"ze-tunin",
  "timestamp":"2026-11-16T12:00:00.000Z","quarentena":[]}}]}}</pre>
<p class="ap">Retransmissão em lote após perda de conexão (<i>store-and-forward</i>): o corpo é um vetor de leituras com
os timestamps originais. Campos fora da faixa física são postos em quarentena:</p>
<pre class="codigo">[{{"dispositivo_id":"ze-tunin","timestamp":"2026-11-16T12:15:00Z","seq":8,"leituras":{{"pressao_kpa":-999}}}},
 {{"dispositivo_id":"ze-tunin","timestamp":"2026-11-16T12:30:00Z","seq":9,"leituras":{{"pressao_kpa":120.1}}}}]</pre>
<p class="ap">Consulta do estado completo em um cenário de demonstração e verificação de saúde:</p>
<pre class="codigo">curl "{URL_APP}/api/estado?cenario=cheia"
curl "{URL_APP}/api/saude"</pre>
</section>

<section class="secao">
<h1 class="sem-numero">APÊNDICE B – FLUXO NODE-RED DO GATEWAY SIMULADO</h1>
<p class="ap">O arquivo <code>nodered/fluxo-sentinela.json</code> do repositório implementa um gateway de borda
simulado, que pode ser importado no Node-RED (menu <i>Import</i>). O fluxo é composto pelos nós:</p>
<ol class="alinea">
<li><b>Inject “a cada 1 min”:</b> dispara a geração de uma leitura;</li>
<li><b>Function “gerar leitura da comporta”:</b> simula nível do reservatório, abertura, pressão (a partir de ρ·g·h com
ruído), carga e vibração; um segundo <i>Inject</i> liga e desliga uma anomalia de pressão e vibração;</li>
<li><b>Function “regra edge + fila”:</b> aplica na borda a regra SE desvio de pressão ≥ 15% ENTÃO prioridade alta e
anexa ao envio as leituras pendentes da fila local (<i>store-and-forward</i>);</li>
<li><b>HTTP Request “POST /api/telemetria”:</b> envia o lote ao middleware;</li>
<li><b>Function “confirmar / reenfileirar”:</b> em resposta 2xx, esvazia a fila; em falha, mantém até 500 leituras
(buffer circular FIFO) para retransmissão;</li>
<li><b>Debug:</b> exibe a resposta do servidor.</li>
</ol>
</section>
'''
