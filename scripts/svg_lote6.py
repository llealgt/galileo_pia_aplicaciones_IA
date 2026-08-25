# -*- coding: utf-8 -*-
'''Lote 6 de SVGs: cinco diapositivas de las unidades 12, 18 y 19 donde el concepto es
espacial o temporal y se explicaba sin eje.

Sale de un inventario de las 300 diapositivas de las secciones 12-20. Ojo con el
metodo: el primer conteo dio "50 diapositivas sin nada visual" y era FALSO — el
clasificador solo miraba <svg>/<canvas>/<img>/<table>/<pre> y se perdia .comparison,
los chips de color, KaTeX y las columnas. Con un clasificador decente quedan 2
diapositivas realmente desnudas y 96 de 300 con visual fuerte. Lo que se arregla aqui
no es "lo que no tiene nada", es lo que tiene el visual EQUIVOCADO para su concepto:

  18-4 paralelismo   los tiempos estaban medidos (5.3 s vs 1.8 s) y NO habia eje de tiempo
  18-3 routing       una fila lineal fingiendo una bifurcacion con un margin-left
  19-1 quien decide  la diapositiva dice "un programa que puedes dibujar" y no lo dibuja
  19-10 RAG agentico dos listas de vinetas para explicar recto-contra-bucle
  12-3  decadas      78 anios de historia en filas de texto, sin escala

Idempotente por titulo de <h2>.
'''
import io, re, sys

RUTA = "../index.html"

# ══════════════ 1 · paralelismo: el eje de tiempo que faltaba ══════════════
X0, ESC = 96, 104        # x del origen y px por segundo
def barra(x, y, seg, color, etq):
    w = seg * ESC
    return (f'<rect x="{x}" y="{y}" width="{w:.0f}" height="20" rx="4" fill="{color}" '
            f'fill-opacity="0.30" stroke="{color}" stroke-width="1.2"/>'
            f'<text x="{x + w/2:.0f}" y="{y+14}" text-anchor="middle" fill="#ece6d0" '
            f'font-size="9.5" font-family="Fira Code,monospace">{etq}</text>')

C = ["#58C4DD", "#83C167", "#FF862F"]
T = [1.8, 1.7, 1.8]                      # las tres llamadas
piezas = ['<svg viewBox="0 0 760 158" style="width:100%; max-width:760px; max-height:160px;" role="img">']
# fila secuencial
piezas.append('<text x="88" y="26" text-anchor="end" fill="#FF862F" font-size="11" '
              'font-family="Fira Code,monospace">en fila</text>'
              '<text x="88" y="39" text-anchor="end" fill="#8a86a0" font-size="9" '
              'font-family="Lora,serif">1 GPU</text>')
x = X0
for i, (t, c) in enumerate(zip(T, C)):
    piezas.append(barra(x, 16, t, c, ["producto", "sentimiento", "dinero"][i]))
    x += t * ESC
piezas.append(f'<line x1="{x:.0f}" y1="10" x2="{x:.0f}" y2="120" stroke="#FC6255" '
              f'stroke-width="1.2" stroke-dasharray="3 3"/>'
              f'<text x="{x+6:.0f}" y="26" fill="#FC6255" font-size="12" '
              f'font-family="Fira Code,monospace">5.3 s</text>')
# fila paralela
piezas.append('<text x="88" y="70" text-anchor="end" fill="#83C167" font-size="11" '
              'font-family="Fira Code,monospace">a la vez</text>'
              '<text x="88" y="83" text-anchor="end" fill="#8a86a0" font-size="9" '
              'font-family="Lora,serif">contra una API</text>')
for i, (t, c) in enumerate(zip(T, C)):
    piezas.append(barra(X0, 58 + i * 23, t, c, ["producto", "sentimiento", "dinero"][i]))
xf = X0 + max(T) * ESC
piezas.append(f'<line x1="{xf:.0f}" y1="52" x2="{xf:.0f}" y2="128" stroke="#83C167" '
              f'stroke-width="1.2" stroke-dasharray="3 3"/>'
              f'<text x="{xf+6:.0f}" y="70" fill="#83C167" font-size="12" '
              f'font-family="Fira Code,monospace">1.8 s</text>')
# eje
piezas.append('<line x1="96" y1="132" x2="716" y2="132" stroke="#8a86a0" stroke-width="1"/>')
for sg in range(7):
    xx = X0 + sg * ESC
    if xx > 720: break
    piezas.append(f'<line x1="{xx}" y1="132" x2="{xx}" y2="137" stroke="#8a86a0" stroke-width="1"/>'
                  f'<text x="{xx}" y="149" text-anchor="middle" fill="#8a86a0" font-size="9" '
                  f'font-family="Fira Code,monospace">{sg}s</text>')
piezas.append('</svg>')
SVG_PAR = "".join(piezas)

# ══════════════ 2 · routing: una bifurcación de verdad ══════════════
SVG_ROUTER = (
 '<svg viewBox="0 0 760 152" style="width:100%; max-width:760px; max-height:154px;" role="img">'
 '<rect x="8" y="58" width="104" height="36" rx="7" fill="#FFFF00" fill-opacity="0.12" '
 'stroke="#FFFF00" stroke-width="1.3"/>'
 '<text x="60" y="81" text-anchor="middle" fill="#ece6d0" font-size="12" '
 'font-family="Lora,serif">Mensaje</text>'
 '<line x1="112" y1="76" x2="156" y2="76" stroke="#8a86a0" stroke-width="1.5"/>'
 '<polygon points="164,76 154,71 154,81" fill="#8a86a0"/>'
 '<polygon points="230,50 296,76 230,102 164,76" fill="#9A72AC" fill-opacity="0.16" '
 'stroke="#9A72AC" stroke-width="1.5"/>'
 '<text x="230" y="73" text-anchor="middle" fill="#9A72AC" font-size="12" '
 'font-family="Fira Code,monospace">Router</text>'
 '<text x="230" y="87" text-anchor="middle" fill="#8a86a0" font-size="9" '
 'font-family="Lora,serif">1 palabra</text>'
 # rama corta
 '<path d="M296,70 C340,70 340,32 384,32" fill="none" stroke="#83C167" stroke-width="1.6"/>'
 '<polygon points="392,32 382,27 382,37" fill="#83C167"/>'
 '<text x="340" y="22" text-anchor="middle" fill="#83C167" font-size="9.5" '
 'font-family="Fira Code,monospace">saludo</text>'
 '<rect x="394" y="14" width="200" height="36" rx="7" fill="#83C167" fill-opacity="0.12" '
 'stroke="#83C167" stroke-width="1.3"/>'
 '<text x="494" y="30" text-anchor="middle" fill="#ece6d0" font-size="11.5" '
 'font-family="Lora,serif">responder y listo</text>'
 '<text x="494" y="43" text-anchor="middle" fill="#83C167" font-size="10" '
 'font-family="Fira Code,monospace">1 llamada</text>'
 # rama larga
 '<path d="M296,82 C340,82 340,120 384,120" fill="none" stroke="#58C4DD" stroke-width="1.6"/>'
 '<polygon points="392,120 382,115 382,125" fill="#58C4DD"/>'
 '<text x="340" y="138" text-anchor="middle" fill="#58C4DD" font-size="9.5" '
 'font-family="Fira Code,monospace">ticket real</text>'
 '<rect x="394" y="102" width="200" height="36" rx="7" fill="#58C4DD" fill-opacity="0.12" '
 'stroke="#58C4DD" stroke-width="1.3"/>'
 '<text x="494" y="118" text-anchor="middle" fill="#ece6d0" font-size="11.5" '
 'font-family="Lora,serif">clasificar → priorizar → redactar</text>'
 '<text x="494" y="131" text-anchor="middle" fill="#58C4DD" font-size="10" '
 'font-family="Fira Code,monospace">3 llamadas</text>'
 '<text x="672" y="76" text-anchor="middle" fill="#FFFF00" font-size="11" '
 'font-family="Lora,serif" font-style="italic">el router</text>'
 '<text x="672" y="90" text-anchor="middle" fill="#FFFF00" font-size="11" '
 'font-family="Lora,serif" font-style="italic">decide la rama</text>'
 '</svg>')

# ══════════════ 3 · quién decide: camino dibujado vs bucle opaco ══════════════
SVG_QUIEN = (
 '<svg viewBox="0 0 760 148" style="width:100%; max-width:760px; max-height:150px;" role="img">'
 '<text x="186" y="16" text-anchor="middle" fill="#58C4DD" font-size="12" '
 'font-family="Fira Code,monospace">cadena / router</text>'
 '<rect x="10" y="26" width="352" height="86" rx="9" fill="none" stroke="#58C4DD" '
 'stroke-width="1.2" stroke-dasharray="5 4"/>')
for i, et in enumerate(["paso 1", "paso 2", "paso 3"]):
    x = 30 + i * 108
    SVG_QUIEN += (f'<rect x="{x}" y="54" width="80" height="30" rx="6" fill="#58C4DD" '
                  f'fill-opacity="0.16" stroke="#58C4DD" stroke-width="1.2"/>'
                  f'<text x="{x+40}" y="73" text-anchor="middle" fill="#ece6d0" font-size="10.5" '
                  f'font-family="Lora,serif">{et}</text>')
    if i < 2:
        SVG_QUIEN += (f'<line x1="{x+80}" y1="69" x2="{x+100}" y2="69" stroke="#8a86a0" '
                      f'stroke-width="1.4"/><polygon points="{x+106},69 {x+98},65 {x+98},73" '
                      f'fill="#8a86a0"/>')
SVG_QUIEN += (
 '<text x="186" y="105" text-anchor="middle" fill="#83C167" font-size="10.5" '
 'font-family="Fira Code,monospace">3 llamadas, siempre</text>'
 '<text x="186" y="132" text-anchor="middle" fill="#ece6d0" font-size="11.5" '
 'font-family="Lora,serif">lo puedes <tspan font-weight="bold">dibujar</tspan> antes de correrlo</text>'
 '<line x1="380" y1="20" x2="380" y2="140" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/>'
 '<text x="570" y="16" text-anchor="middle" fill="#9A72AC" font-size="12" '
 'font-family="Fira Code,monospace">agente</text>'
 '<rect x="398" y="26" width="352" height="86" rx="9" fill="none" stroke="#9A72AC" '
 'stroke-width="1.2" stroke-dasharray="5 4"/>'
 '<rect x="418" y="54" width="104" height="30" rx="6" fill="#9A72AC" fill-opacity="0.16" '
 'stroke="#9A72AC" stroke-width="1.2"/>'
 '<text x="470" y="73" text-anchor="middle" fill="#ece6d0" font-size="10.5" '
 'font-family="Lora,serif">meta + herramientas</text>'
 '<path d="M522,62 C570,40 620,40 660,56" fill="none" stroke="#FFFF00" stroke-width="1.6"/>'
 '<polygon points="666,60 655,52 658,63" fill="#FFFF00"/>'
 '<path d="M660,82 C620,98 570,98 522,76" fill="none" stroke="#FFFF00" stroke-width="1.6"/>'
 '<polygon points="516,73 527,80 524,69" fill="#FFFF00"/>'
 '<text x="592" y="76" text-anchor="middle" fill="#FFFF00" font-size="13" '
 'font-family="Fira Code,monospace">? pasos</text>'
 '<text x="570" y="105" text-anchor="middle" fill="#FC6255" font-size="10.5" '
 'font-family="Fira Code,monospace">no sabes cuántas llamadas</text>'
 '<text x="570" y="132" text-anchor="middle" fill="#ece6d0" font-size="11.5" '
 'font-family="Lora,serif">sólo lo puedes <tspan font-weight="bold">observar</tspan> después</text>'
 '</svg>')

# ══════════════ 4 · RAG agéntico: recto contra bucle ══════════════
def caja(x, y, w, t, c, sub=None, h=30):
    s = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{c}" fill-opacity="0.14" '
         f'stroke="{c}" stroke-width="1.2"/>'
         f'<text x="{x+w/2:.0f}" y="{y+(19 if not sub else 14)}" text-anchor="middle" '
         f'fill="#ece6d0" font-size="10.5" font-family="Lora,serif">{t}</text>')
    if sub:
        s += (f'<text x="{x+w/2:.0f}" y="{y+26}" text-anchor="middle" fill="#8a86a0" '
              f'font-size="9" font-family="Fira Code,monospace">{sub}</text>')
    return s
def flecha_h(x0, x1, y, c="#8a86a0"):
    return (f'<line x1="{x0}" y1="{y}" x2="{x1-7}" y2="{y}" stroke="{c}" stroke-width="1.4"/>'
            f'<polygon points="{x1},{y} {x1-8},{y-4.5} {x1-8},{y+4.5}" fill="{c}"/>')

SVG_RAGAG = (
 '<svg viewBox="0 0 760 168" style="width:100%; max-width:760px; max-height:170px;" role="img">'
 '<text x="8" y="16" fill="#FF862F" font-size="11.5" font-family="Fira Code,monospace">'
 'RAG tradicional</text>'
 + caja(8, 26, 96, "pregunta", "#ece6d0") + flecha_h(104, 132, 41)
 + caja(132, 26, 110, "recuperar", "#FF862F") + flecha_h(242, 270, 41)
 + caja(270, 26, 110, "responder", "#83C167")
 + '<text x="400" y="45" fill="#8a86a0" font-size="10.5" font-family="Lora,serif" '
   'font-style="italic">una pasada, pase lo que pase</text>'
 '<line x1="8" y1="74" x2="752" y2="74" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/>'
 '<text x="8" y="94" fill="#83C167" font-size="11.5" font-family="Fira Code,monospace">'
 'RAG agéntico</text>'
 + caja(8, 104, 96, "pregunta", "#ece6d0") + flecha_h(104, 132, 119)
 + caja(132, 104, 110, "recuperar", "#FF862F") + flecha_h(242, 270, 119)
 + '<polygon points="332,100 400,119 332,138 264,119" fill="#FFFF00" fill-opacity="0.15" '
   'stroke="#FFFF00" stroke-width="1.4"/>'
   '<text x="332" y="116" text-anchor="middle" fill="#FFFF00" font-size="10.5" '
   'font-family="Fira Code,monospace">¿alcanza?</text>'
   + flecha_h(400, 434, 119, "#83C167")
 + caja(434, 104, 110, "responder", "#83C167")
 + '<text x="416" y="112" text-anchor="middle" fill="#83C167" font-size="9" '
   'font-family="Fira Code,monospace">sí</text>'
 # el bucle
 '<path d="M332,142 L332,161 L187,161 L187,134" fill="none" stroke="#FC6255" stroke-width="1.6"/>'
 '<polygon points="187,128 182,139 192,139" fill="#FC6255"/>'
 '<text x="262" y="151" text-anchor="middle" fill="#FC6255" font-size="9.5" '
 'font-family="Fira Code,monospace">no · reformula y vuelve a buscar</text>'
 '<text x="576" y="152" text-anchor="middle" fill="#FFFF00" font-size="10.5" '
 'font-family="Lora,serif" font-style="italic">ese bucle es toda la diferencia</text>'
 '</svg>')

# ══════════════ 5 · décadas: la escala que faltaba ══════════════
HITOS = [(1948, "Shannon", "#83C167"), (1993, "IBM Model 5", "#58C4DD"),
         (2003, "Bengio NNLM", "#58C4DD"), (2013, "word2vec", "#58C4DD"),
         (2017, "Transformer", "#FF862F"), (2020, "GPT-3", "#FFFF00"),
         (2022, "ChatGPT", "#FFFF00"), (2026, "hoy", "#E48BB0")]
A0, A1, XA, XB = 1948, 2026, 40, 726
def px(a): return XA + (a - A0) * (XB - XA) / (A1 - A0)
p = ['<svg viewBox="0 0 760 96" style="width:100%; max-width:760px; max-height:98px;" role="img">',
     f'<line x1="{XA}" y1="58" x2="{XB}" y2="58" stroke="#8a86a0" stroke-width="1.5"/>']
for a, et, c in HITOS:
    x = px(a)
    alto = a >= 2017
    p.append(f'<circle cx="{x:.0f}" cy="58" r="{5 if alto else 3.6}" fill="{c}"/>'
             f'<line x1="{x:.0f}" y1="58" x2="{x:.0f}" y2="{40 if alto else 46}" '
             f'stroke="{c}" stroke-width="1"/>'
             f'<text x="{x:.0f}" y="{34 if alto else 40}" text-anchor="middle" fill="{c}" '
             f'font-size="{10 if alto else 9}" font-family="Fira Code,monospace">{a}</text>'
             f'<text x="{x:.0f}" y="72" text-anchor="middle" fill="#ece6d0" font-size="8.5" '
             f'font-family="Lora,serif">{et}</text>')
p.append(f'<rect x="{px(2017):.0f}" y="50" width="{XB-px(2017):.0f}" height="16" rx="3" '
         f'fill="#FFFF00" fill-opacity="0.08"/>'
         f'<text x="{(px(1948)+px(2017))/2:.0f}" y="90" text-anchor="middle" fill="#8a86a0" '
         f'font-size="10" font-family="Lora,serif" font-style="italic">69 años de la misma idea</text>'
         f'<text x="{(px(2017)+XB)/2:.0f}" y="90" text-anchor="middle" fill="#FFFF00" '
         f'font-size="10" font-family="Lora,serif" font-style="italic">9 años de escala</text></svg>')
SVG_DEC = "".join(p)

# ═══════════════════════ inserción ═══════════════════════
doc = io.open(RUTA, encoding='utf-8').read()
if 'id="sl-svg-lote6"' in doc:
    sys.exit("El lote 6 ya esta insertado; nada que hacer.")

def envolver(svg, extra=""):
    return f'    <div style="text-align:center; margin:0.25em 0;{extra}">\n      {svg}\n    </div>\n'

def tras_h2(titulo, svg, extra=""):
    """mete el SVG justo despues del <h2> de esa diapositiva"""
    global doc
    m = f'<h2>{titulo}</h2>'
    if doc.count(m) != 1:
        sys.exit(f"«{titulo}»: {doc.count(m)} coincidencias, esperaba 1")
    i = doc.index(m) + len(m)
    doc = doc[:i] + "\n" + envolver(svg, extra) + doc[i:]

def reemplazar(viejo, nuevo, que):
    global doc
    if viejo not in doc: sys.exit("no encontre: " + que)
    doc = doc.replace(viejo, nuevo, 1)

# 1 · paralelismo (va debajo del parrafo de entrada, antes de la comparacion)
reemplazar('    <div class="comparison" style="font-size: 0.38em; margin-top: 0.35em;">\n'
           '      <div class="side">\n'
           '        <strong style="color: var(--c-orange);">Un modelo, una máquina</strong>',
           envolver(SVG_PAR) +
           '    <div class="comparison" style="font-size: 0.355em; margin-top: 0.2em;">\n'
           '      <div class="side">\n'
           '        <strong style="color: var(--c-orange);">Un modelo, una máquina</strong>',
           "comparación de paralelismo")

# 2 · routing (sustituye la fila lineal que fingia una bifurcacion)
i = doc.index('id="sl-18-routing"')
a = doc.index('<div class="flow-row"', i); b = doc.index('</div>', doc.index('3 llamadas', a)) + 6
b = doc.index('</div>', b) + 6
reemplazar(doc[a:b], SVG_ROUTER, "flow-row del router")

# 3 · quién decide
tras_h2('¿Quién Decide los Pasos?', SVG_QUIEN)

# 4 · RAG agéntico
reemplazar('    <div class="comparison" style="font-size: 0.37em; margin-top: 0.3em;">\n'
           '      <div class="side">\n'
           '        <strong style="color: var(--c-orange);">RAG tradicional</strong>',
           envolver(SVG_RAGAG) +
           '    <div class="comparison" style="font-size: 0.34em; margin-top: 0.2em;">\n'
           '      <div class="side">\n'
           '        <strong style="color: var(--c-orange);">RAG tradicional</strong>',
           "comparación de RAG agéntico")

# 5 · décadas
tras_h2('Esto No es Nuevo: Lleva Décadas', SVG_DEC)

doc = doc.replace('<section data-transition="fade" id="sl-decadas">',
                  '<section data-transition="fade" id="sl-decadas" data-lote="sl-svg-lote6">', 1)
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("lote 6 insertado: 5 diagramas (paralelismo, routing, quién decide, RAG agéntico, décadas)")
