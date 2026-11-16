# -*- coding: utf-8 -*-
"""Gera o Documento de Especificação de Software em PDF (ABNT NBR 14724).

Uso: python3 build.py   (requer Node + Playwright/Chromium, pypdf e reportlab)
Saída: ../Especificacao_Sentinela_Pomba_Filipe_Demarque.pdf
"""
import io
import json
import os
import re
import subprocess
import sys

from pypdf import PdfReader, PdfWriter
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from conteudo import (AUTOR, CAPA, FIGURAS, FOLHA_ROSTO, QUADROS, RESUMO, SIGLAS,  # noqa: E402
                      SUMARIO, TABELAS, TITULO, SUBTITULO)
from corpo import APENDICES, CORPO, REFERENCIAS  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, '..', 'Especificacao_Sentinela_Pomba_Filipe_Demarque.pdf')

ABSTRACT = '''
<section class="pre">
<h1 class="sem-numero">ABSTRACT</h1>
<p class="resumo">This document specifies the software layer, business rules and integration architecture of
Sentinela Pomba, an Internet of Things (IoT) system for hydrological monitoring and flood forecasting support in the
municipality of Cataguases, Minas Gerais, Brazil, which is crossed by the Pomba River and the Meia Pataca stream. The
municipality exceeds the flood stage in most years, and its largest recorded flood reached 985 cm in December 2008.
Although high-quality public data exist, they are spread across different sources and are not continuously combined
for the city. The proposed solution integrates, in an end-to-end flow, real telemetry from the gauging stations of the
Brazilian National Water and Sanitation Agency (ANA) in Cataguases and upstream, the reservoir levels of five upstream
dams, spillway gate instrumentation (opening, foundation pressure, load and vibration) and hourly precipitation forecasts
per sub-basin. A middleware validates and cleans readings, maintains digital twins of the assets, converts discharge into
stage using the official rating curves of the Geological Survey of Brazil (SGB), and projects the river stage up to 72
hours ahead by combining observed upstream propagation, runoff estimated from forecast rainfall and gate discharges. Eight
formal IF … THEN … rules generate actionable alerts, including a check of measured foundation pressure against
theoretical hydrostatic pressure. Non-functional resilience requirements are addressed, such as offline sensors,
connectivity loss, idempotent retransmission and null or corrupted data. The functional prototype was deployed on a cloud
platform, runs on real data and offers demonstration scenarios for floods, gate operations, structural anomalies and
sensor failures.</p>
<p class="palavras"><b>Keywords:</b> internet of things; hydrological monitoring; flood forecasting; sensor data integration; Pomba River.</p>
</section>
'''

CSS = '''
@page { size: A4; margin: 30mm 20mm 20mm 30mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: 'Liberation Serif', 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; text-align: justify; hyphens: manual; }
a { color: #000; text-decoration: none; }
p { margin: 0; text-indent: 1.25cm; orphans: 2; widows: 2; }
section.secao, section.pre { break-before: page; }
h1, h2, h3 { font-size: 12pt; margin: 0; line-height: 1.5; text-align: left; break-after: avoid; }
h1 { font-weight: bold; text-transform: uppercase; margin-bottom: 18pt; }
h1.sem-numero { text-align: center; }
h2 { font-weight: normal; text-transform: uppercase; margin: 18pt 0 18pt; }
h2 + p, h1 + p { break-before: avoid; }
code { font-family: 'Liberation Mono', monospace; font-size: 10pt; }
pre { font-family: 'Liberation Mono', monospace; font-size: 9pt; line-height: 1.2; margin: 6pt 0 12pt; white-space: pre-wrap; text-align: left; break-inside: avoid; }
pre.codigo { border: 0.5pt solid #000; padding: 6pt 8pt; }
ol.alinea { margin: 0; padding-left: 1.25cm; list-style: none; counter-reset: al; }
ol.alinea > li { counter-increment: al; position: relative; padding-left: 0.7cm; }
ol.alinea > li::before { content: counter(al, lower-alpha) ")"; position: absolute; left: 0; }

/* Capa e folha de rosto */
.capa, .rosto { height: 247mm; display: flex; flex-direction: column; text-align: center; break-after: page; }
.capa p, .rosto p { text-indent: 0; }
.capa .topo p { font-weight: bold; }
.capa .autor { margin-top: 30mm; font-weight: bold; }
.capa .titulo { margin-top: auto; margin-bottom: auto; }
.rosto .autor { font-weight: bold; }
.rosto .titulo { margin-top: 55mm; }
.titulo p { text-transform: none; }
.titulo b { text-transform: uppercase; }
.rosto .natureza { margin: 18mm 0 0 80mm; text-align: justify; font-size: 10pt; line-height: 1.0; }
.rosto .natureza p { margin-bottom: 8pt; }
.rodape-capa { margin-top: auto; }
.rodape-capa p { font-weight: bold; }
.rosto .rodape-capa p { font-weight: normal; }

/* Resumo */
p.resumo { text-indent: 0; line-height: 1.5; }
p.palavras { text-indent: 0; margin-top: 18pt; }

/* Listas e sumário */
.lista { margin: 0; padding: 0; list-style: none; }
.lista li { display: flex; align-items: baseline; text-indent: 0; text-align: left; }
.lista li .rot { flex: 0 1 auto; }
.lista li .pont { flex: 1 1 auto; border-bottom: 1pt dotted #000; margin: 0 4pt; min-width: 12pt; transform: translateY(-3pt); }
.lista li .pg { flex: 0 0 auto; }
.lista li.n1 { font-weight: bold; text-transform: uppercase; }
.lista li.n2 { text-transform: uppercase; }
.lista li.n0 { font-weight: bold; text-transform: uppercase; }
.lista.ilus li .rot { padding-left: 0; }
.siglas td { padding: 0 12pt 0 0; vertical-align: top; text-align: left; }
.siglas td:first-child { width: 22mm; }
.siglas { border-collapse: collapse; }

/* Ilustrações, quadros e tabelas */
figure.ilus, .quadro { margin: 12pt 0 12pt; break-inside: avoid; text-align: center; }
h6.legenda { font-size: 10pt; font-weight: normal; line-height: 1.0; margin: 0 0 4pt; text-align: center; }
.ilus-corpo { margin: 0 auto; }
.ilus-corpo img { width: 100%; display: block; border: 0.5pt solid #888; }
.ilus-corpo svg.diag { width: 100%; height: auto; display: block; }
p.fonte { font-size: 10pt; line-height: 1.0; text-indent: 0; text-align: left; margin-top: 4pt; }
figure.ilus p.fonte { width: auto; text-align: center; }
table.q, table.t { width: 100%; border-collapse: collapse; font-size: 10pt; line-height: 1.15; text-align: left; table-layout: fixed; }
table.q th, table.q td { border: 0.6pt solid #000; padding: 2pt 4pt; vertical-align: top; overflow-wrap: anywhere; hyphens: auto; }
table.q td code { overflow-wrap: anywhere; word-break: break-all; }
table.q th { font-weight: bold; text-align: center; }
table.t th { border-top: 0.8pt solid #000; border-bottom: 0.6pt solid #000; padding: 2pt 4pt; font-weight: bold; text-align: center; }
table.t td { padding: 1.5pt 4pt; text-align: center; }
table.t tbody tr:last-child td { border-bottom: 0.8pt solid #000; }
table.q code, table.t code { font-size: 9pt; }
tr { break-inside: avoid; }

/* Regras */
.regra { margin: 6pt 0 12pt; break-inside: avoid; }
.regra p { text-indent: 0; }
.regra pre { border-left: 2pt solid #000; padding: 4pt 8pt; margin: 4pt 0 4pt; }
.regra-a { font-size: 12pt; }

/* Referências (NBR 6023: alinhadas à esquerda, espaço simples, separadas por uma linha em branco) */
.refs p { text-indent: 0; text-align: left; line-height: 1.0; margin-bottom: 12pt; }
p.ap { text-indent: 0; }
'''


def numerar(html):
    for pref, itens in (('fig', FIGURAS), ('qua', QUADROS), ('tab', TABELAS)):
        for i, it in enumerate(itens, 1):
            k = it[0]
            html = html.replace('{{%s:%s}}' % (pref, k), str(i))
            html = html.replace('{{%st:%s}}' % (pref, k), it[1])
            if pref == 'fig':
                html = html.replace('{{figf:%s}}' % k, it[2])
    resto = re.findall(r'\{\{[a-z]+:[a-z_]+\}\}', html)
    if resto:
        raise SystemExit(f'Marcadores não resolvidos: {sorted(set(resto))}')
    return html


def linha(rot, pg_chave, classe=''):
    return f'<li class="{classe}"><span class="rot">{rot}</span><span class="pont"></span><span class="pg">[[pg:{pg_chave}]]</span></li>'


def pre_textuais():
    lf = ''.join(linha(f'Figura {i} – {t}', f'Figura {i} – {t}') for i, (_, t, _f) in enumerate(FIGURAS, 1))
    lq = ''.join(linha(f'Quadro {i} – {t}', f'Quadro {i} – {t}') for i, (_, t) in enumerate(QUADROS, 1))
    lt = ''.join(linha(f'Tabela {i} – {t}', f'Tabela {i} – {t}') for i, (_, t) in enumerate(TABELAS, 1))
    siglas = ''.join(f'<tr><td>{s}</td><td>{d}</td></tr>' for s, d in SIGLAS)
    sumario = ''.join(linha(t, t, f'n{n}') for n, t in SUMARIO)
    return (CAPA + FOLHA_ROSTO + RESUMO + ABSTRACT
            + f'<section class="pre"><h1 class="sem-numero">LISTA DE FIGURAS</h1><ul class="lista ilus">{lf}</ul></section>'
            + f'<section class="pre"><h1 class="sem-numero">LISTA DE QUADROS</h1><ul class="lista ilus">{lq}</ul></section>'
            + f'<section class="pre"><h1 class="sem-numero">LISTA DE TABELAS</h1><ul class="lista ilus">{lt}</ul></section>'
            + f'<section class="pre"><h1 class="sem-numero">LISTA DE ABREVIATURAS E SIGLAS</h1><table class="siglas">{siglas}</table></section>'
            + f'<section class="pre"><h1 class="sem-numero">SUMÁRIO</h1><ul class="lista">{sumario}</ul></section>')


def montar(paginas=None):
    refs = ''.join(f'<p>{r}</p>' for r in REFERENCIAS)
    corpo = (pre_textuais() + CORPO
             + f'<section class="secao refs"><h1 class="sem-numero">REFERÊNCIAS</h1>{refs}</section>'
             + APENDICES)
    html = numerar(corpo)

    def sub(m):
        chave = m.group(1)
        if paginas is None:
            return '00'
        if chave not in paginas:
            raise SystemExit(f'Página não encontrada para: {chave}')
        return str(paginas[chave])
    html = re.sub(r'\[\[pg:(.*?)\]\]', sub, html)
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{TITULO}: {SUBTITULO}</title>
<style>{CSS}</style></head><body>{html}</body></html>'''


def render(html, destino):
    caminho = os.path.join(AQUI, '_documento.html')
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(html)
    subprocess.run(['node', os.path.join(AQUI, 'render.js'), caminho, destino], check=True)


def mapa_paginas(pdf):
    r = PdfReader(pdf)
    out = {}

    def walk(o):
        for x in o:
            if isinstance(x, list):
                walk(x)
            else:
                titulo = re.sub(r'\s+', ' ', x.title).strip()
                meio = len(titulo) // 2
                if len(titulo) % 2 == 0 and titulo[:meio] == titulo[meio:]:
                    titulo = titulo[:meio]  # o Chromium às vezes repete o texto do título no marcador
                out.setdefault(titulo, r.get_destination_page_number(x))
    walk(r.outline)
    return out, len(r.pages)


def main():
    tmp = os.path.join(AQUI, '_passo1.pdf')
    render(montar(None), tmp)
    mapa, _ = mapa_paginas(tmp)
    # Paginação ABNT: capa não conta; folha de rosto = 1  →  número = índice (base 0)
    chaves = [t for _, t in SUMARIO] + [f'Figura {i} – {t}' for i, (_, t, _f) in enumerate(FIGURAS, 1)] \
        + [f'Quadro {i} – {t}' for i, (_, t) in enumerate(QUADROS, 1)] + [f'Tabela {i} – {t}' for i, (_, t) in enumerate(TABELAS, 1)]
    paginas = {}
    for c in chaves:
        if c not in mapa:
            raise SystemExit(f'Título ausente no PDF: {c}\nDisponíveis: {json.dumps(list(mapa)[:80], ensure_ascii=False)}')
        paginas[c] = mapa[c]
    tmp2 = os.path.join(AQUI, '_passo2.pdf')
    render(montar(paginas), tmp2)
    mapa2, total = mapa_paginas(tmp2)
    divergentes = [c for c in chaves if mapa2.get(c) != paginas[c]]
    if divergentes:
        raise SystemExit(f'Paginação mudou entre as passagens: {divergentes}')
    inicio = mapa2['1 INTRODUÇÃO']

    # Carimbo dos números de página (canto superior direito, 2 cm das bordas), do início do texto em diante
    pdfmetrics.registerFont(TTFont('LibSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
    leitor = PdfReader(tmp2)
    escritor = PdfWriter()
    for i, pagina in enumerate(leitor.pages):
        if i >= inicio:
            buf = io.BytesIO()
            w = float(pagina.mediabox.width)
            h = float(pagina.mediabox.height)
            c = canvas.Canvas(buf, pagesize=(w, h))
            c.setFont('LibSerif', 10)
            c.drawRightString(w - 20 * mm, h - 20 * mm - 7, str(i))
            c.save()
            buf.seek(0)
            pagina.merge_page(PdfReader(buf).pages[0])
        escritor.add_page(pagina)
    escritor.add_metadata({
        '/Title': f'{TITULO}: {SUBTITULO}',
        '/Author': AUTOR,
        '/Subject': 'Documento de Especificação de Software – Análise de Dados de Dispositivos IoT e de Sensores (UFJF)',
        '/Keywords': 'internet das coisas; monitoramento hidrológico; previsão de cheias; Rio Pomba; Cataguases',
        '/Creator': AUTOR,
        '/Producer': AUTOR,
    })
    # Marcadores (bookmarks) do sumário
    for t in [t for _, t in SUMARIO]:
        escritor.add_outline_item(t, mapa2[t])
    with open(SAIDA, 'wb') as f:
        escritor.write(f)
    for arq in (tmp, tmp2, os.path.join(AQUI, '_documento.html')):
        os.remove(arq)
    print(f'OK: {os.path.normpath(SAIDA)} ({total} páginas; texto a partir da página {inicio})')


if __name__ == '__main__':
    main()
