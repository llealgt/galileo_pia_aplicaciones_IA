# -*- coding: utf-8 -*-
'''Dos mejoras visuales al bloque de muestreo de la unidad 12.

El diagnostico: el deck REPITE el hallazgo de la adaptatividad de top-p en tres
sitios —la tabla de la unidad 12, la de "Top-k y Top-p, Lado a Lado" de la 16, y la
cabecera del widget— y en ninguno se ve LA FORMA de la distribucion, que es de lo que
va todo. El numero esta; el dibujo no.

  1. "Los Dos Cortes, sobre Distribuciones Reales" — nueva, tras la tabla de
     parametros. Dos distribuciones MEDIDAS (gpt2-spanish, las mismas del widget)
     con los cortes de top-k=5 y top-p=0.85 dibujados encima.
  2. A "Temperatura: la Intuicion" se le anade la forma: las mismas cifras reales
     que ya tenia en tabla, ahora tambien como barras que se afilan y se aplanan.

Numeros: LLM4.sampling de js/widgets/llm4-data.js, no inventados.

Idempotente por el id sl-dos-cortes.
'''
import io, sys

RUTA = "../index.html"
AZUL, VERDE, AMAR, ROJO, GRIS, FG = "#58C4DD", "#83C167", "#FFFF00", "#FC6255", "#8a86a0", "#ece6d0"

# ── distribuciones REALES (gpt2-spanish), top-8 de cada una ──
PICUDA = ("El presidente vive en la Casa",
          [(" Blanca",.8312),(" de",.0646),(" del",.0213),(" Azul",.0087),
           (" Ford",.0062),(" Grande",.0049),(" Comun",.0018),(",",.0013)], 2, "2")
PLANA  = ("Y entonces, de repente,",
          [(" se",.1324),(" el",.0504),(" la",.0401),(" un",.0258),
           (" una",.0240),(" vio",.0223),(" sintió",.0200),(" oyó",.0174)], 9, "40")

def panel(x0, titulo, datos, n_topp, etq_topp, color):
    """un panel de 8 barras con los dos cortes dibujados encima"""
    W, GAP, BASE, ALTO = 30, 7, 196, 96
    mx = max(p for _, p in datos)
    s = (f'<text x="{x0}" y="16" fill="{color}" font-size="11" '
         f'font-family="Fira Code,monospace">«{titulo}»</text>')
    # el corchete de top-p va primero, por debajo de las barras
    ancho_p = min(n_topp, 8) * (W + GAP) - GAP
    s += (f'<path d="M{x0-3},74 L{x0-3},66 L{x0+ancho_p+3},66 L{x0+ancho_p+3},74" fill="none" '
          f'stroke="{VERDE}" stroke-width="1.6"/>')
    if n_topp > 8:
        s += (f'<line x1="{x0+ancho_p+3}" y1="66" x2="{x0+ancho_p+34}" y2="66" stroke="{VERDE}" '
              f'stroke-width="1.6" stroke-dasharray="4 3"/>'
              f'<polygon points="{x0+ancho_p+42},66 {x0+ancho_p+32},61 {x0+ancho_p+32},71" fill="{VERDE}"/>')
    # anclado al inicio: centrado sobre un corchete estrecho se salia del lienzo
    s += (f'<text x="{x0}" y="60" fill="{VERDE}" font-size="10.5" '
          f'font-family="Fira Code,monospace">top-p 0.85 → {etq_topp} tokens</text>')
    for i, (tok, p) in enumerate(datos):
        x = x0 + i * (W + GAP)
        h = max(2.0, (p / mx) * ALTO)
        dentro = i < n_topp
        c = VERDE if dentro else GRIS
        s += (f'<rect x="{x}" y="{BASE-h:.0f}" width="{W}" height="{h:.0f}" rx="2" fill="{c}" '
              f'fill-opacity="{0.55 if dentro else 0.20}" stroke="{c}" stroke-width="1"/>')
        s += (f'<text x="{x+W/2:.0f}" y="{BASE+11}" text-anchor="middle" fill="{FG}" font-size="8" '
              f'font-family="Fira Code,monospace" transform="rotate(-35 {x+W/2:.0f} {BASE+11})">'
              f'{tok.strip()}</text>')
        if i == 0:
            s += (f'<text x="{x+W/2:.0f}" y="{BASE-h-5:.0f}" text-anchor="middle" fill="{FG}" '
                  f'font-size="9.5" font-family="Fira Code,monospace">{p*100:.0f}%</text>')
    # el corte de top-k, siempre tras la quinta barra
    xk = x0 + 5 * (W + GAP) - GAP / 2
    s += (f'<line x1="{xk:.0f}" y1="82" x2="{xk:.0f}" y2="{BASE+2}" stroke="{AZUL}" '
          f'stroke-width="1.6" stroke-dasharray="5 4"/>'
          f'<text x="{xk:.0f}" y="{BASE+30}" text-anchor="middle" fill="{AZUL}" font-size="10.5" '
          f'font-family="Fira Code,monospace">top-k 5 → 5 tokens</text>')
    return s

SVG_CORTES = ('<svg viewBox="0 0 760 240" style="width:100%; max-width:760px; max-height:242px;" role="img">'
  + panel(20, PICUDA[0], PICUDA[1], PICUDA[2], PICUDA[3], AMAR)
  + '<line x1="384" y1="10" x2="384" y2="226" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/>'
  + panel(402, PLANA[0], PLANA[1], PLANA[2], PLANA[3], ROJO)
  + f'<text x="180" y="236" text-anchor="middle" fill="{FG}" font-size="10.5" '
    f'font-family="Lora,serif" font-style="italic">el modelo está seguro: top-k cuela 3 tokens basura</text>'
  + f'<text x="566" y="236" text-anchor="middle" fill="{FG}" font-size="10.5" '
    f'font-family="Lora,serif" font-style="italic">el modelo duda: top-k corta 35 opciones legítimas</text>'
  + '</svg>')

SLIDE = f'''
  <section data-transition="fade" id="sl-dos-cortes">
    <h2>Los Dos Cortes, sobre Distribuciones Reales</h2>
    <div style="text-align:center; margin:0.15em 0;">
      {SVG_CORTES}
    </div>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.15em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      <strong>Mismos ajustes, dos comportamientos opuestos.</strong> <code>top-k</code> deja pasar
      <strong>siempre cinco</strong>, mire la distribución que mire. <code>top-p</code>
      <strong>mira la forma</strong>: se cierra a 2 cuando el modelo está seguro y se abre a 40
      cuando duda. Por eso es el valor por omisión en casi todas las APIs.
    </p>
    <p style="font-size: 0.36em; text-align:center; margin-top: 0.15em; color: var(--c-text-dim);">
      Distribuciones reales de siguiente token medidas con <code>gpt2-spanish</code> — las mismas del
      widget de la unidad 16, donde puedes mover los controles.
    </p>
    <aside class="notes">
      Contenido propio. Las dos distribuciones son REALES y salen de LLM4.sampling
      (js/widgets/llm4-data.js), medidas con DeepESP/gpt2-spanish. Son las mismas que mueve el widget
      de la unidad 16, asi que los numeros de las dos diapositivas cuadran.

      POR QUE ESTA DIAPOSITIVA: el deck repetia este hallazgo en tres sitios —la tabla de parametros
      de esta unidad, la de "Top-k y Top-p, Lado a Lado" de la 16 y la cabecera del widget— y en
      ninguno se veia LA FORMA, que es de lo que va todo el asunto. El numero estaba; el dibujo no.

      Como leerlo en clase, de izquierda a derecha:
      - Izquierda, "la Casa ___": el 83% se lo lleva "Blanca". Las otras siete barras son casi
        invisibles y eso ES el mensaje. top-p se cierra en 2; top-k=5 cuela "Azul", "Ford" y "Grande",
        que son exactamente la basura que no quieres.
      - Derecha, "Y entonces, de repente, ___": el token mas probable saca 13%. Aqui hay muchas
        continuaciones legitimas. top-p se abre a 40; top-k=5 corta 35 opciones que estaban bien.

      La conclusion que hay que decir en voz alta: top-k no mira la distribucion, solo cuenta. top-p
      mide masa de probabilidad, que es lo que de verdad importa. Y por eso se pueden combinar —
      top-k como techo duro, top-p ajustando dentro—, que es lo que hace la mayoria de las APIs.
    </aside>
  </section>'''

# ── 2 · la forma de la temperatura ──
TEMPS = [("T = 0.5", [32,30,29,11], "afila"), ("T = 1", [28,27,27,17], "la del modelo"),
         ("T = 1.5", [27,26,26,20], "aplana")]
p = ['<svg viewBox="0 0 760 132" style="width:100%; max-width:760px; max-height:134px;" role="img">']
for j, (et, vals, nota) in enumerate(TEMPS):
    x0 = 40 + j * 248
    col = [AZUL, FG, ROJO][j]
    p.append(f'<text x="{x0+92}" y="14" text-anchor="middle" fill="{col}" font-size="11.5" '
             f'font-family="Fira Code,monospace">{et}</text>'
             f'<text x="{x0+92}" y="28" text-anchor="middle" fill="{GRIS}" font-size="10" '
             f'font-family="Lora,serif" font-style="italic">{nota}</text>')
    for i, v in enumerate(vals):
        h = v * 2.4
        x = x0 + i * 46
        p.append(f'<rect x="{x}" y="{112-h:.0f}" width="34" height="{h:.0f}" rx="2" fill="{col}" '
                 f'fill-opacity="0.45" stroke="{col}" stroke-width="1"/>'
                 f'<text x="{x+17}" y="{108-h:.0f}" text-anchor="middle" fill="{FG}" font-size="9" '
                 f'font-family="Fira Code,monospace">{v}%</text>'
                 f'<text x="{x+17}" y="124" text-anchor="middle" fill="{GRIS}" font-size="8.5" '
                 f'font-family="Fira Code,monospace">{["muy","alto","en","a"][i]}</text>')
p.append('</svg>')
SVG_TEMP = "".join(p)

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-dos-cortes' in doc:
    sys.exit("Ya insertadas; nada que hacer.")

# la nueva va tras la tabla de parametros
m = '<h2>Parámetros de Muestreo</h2>'
if doc.count(m) != 1: sys.exit("no encontre «Parámetros de Muestreo»")
i = doc.index(m); fin = doc.index('</section>', i) + len('</section>')
doc = doc[:fin] + "\n" + SLIDE.strip() + "\n" + doc[fin:]

# y la forma se le anade a la de temperatura, encima de sus columnas
anc = ('<h2>Temperatura: la Intuición</h2>\n'
       '    <div class="columns" style="align-items: flex-start;">')
if anc not in doc: sys.exit("no encontre la diapositiva de temperatura")
doc = doc.replace(anc,
    '<h2>Temperatura: la Intuición</h2>\n'
    f'    <div style="text-align:center; margin:0.1em 0;">\n      {SVG_TEMP}\n    </div>\n'
    '    <div class="columns" style="align-items: flex-start; font-size: 0.92em;">', 1)
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("insertada «Los Dos Cortes» y añadida la forma a «Temperatura: la Intuición»")
