# -*- coding: utf-8 -*-
'''Vista de CAJA NEGRA de un LLM, al inicio de la unidad 12: prompt -> LLM -> respuesta.

Va ANTES de "Un LLM es un Autocompletado muy Sofisticado", que ya trae diagrama pero
del mecanismo INTERNO (texto -> que sigue -> un token). Primero la interfaz vista desde
fuera, despues el capo abierto.

El diagrama sigue la composicion de la referencia que dio el catedratico: VERTICAL, tres
tarjetas cuadradas con icono —terminal, red neuronal, burbuja de chat— unidas por flechas
hacia abajo y con la etiqueta debajo de cada una. Los iconos se dibujan aqui en SVG en vez
de copiar la imagen: la referencia es oscura sobre blanco y el deck es al reves, asi que
se redibuja con la paleta del tema (misma regla que con la figura de tamanos de modelos).

Idempotente: si la diapositiva ya existe, la reemplaza.
'''
import io, re, sys

RUTA = "../index.html"

# ── geometría de la columna vertical ──
CX, LADO = 105, 66
TILES = [6, 140, 274]                       # y de cada tarjeta
COLORES = ["#58C4DD", "#FFFF00", "#83C167"]
ETIQUETAS = ["Prompt", "LLM", "Respuesta"]

def tarjeta(y, color):
    return (f'<rect x="{CX - LADO//2}" y="{y}" width="{LADO}" height="{LADO}" rx="16" '
            f'fill="{color}" fill-opacity="0.14" stroke="{color}" stroke-width="1.8"/>')

def icono_terminal(cy, c):
    "un prompt de consola: el chevron y el guion bajo"
    return (f'<polyline points="{CX-15},{cy-11} {CX-5},{cy-1} {CX-15},{cy+9}" fill="none" '
            f'stroke="{c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<line x1="{CX-1}" y1="{cy+9}" x2="{CX+15}" y2="{cy+9}" stroke="{c}" '
            f'stroke-width="2.6" stroke-linecap="round"/>')

def icono_red(cy, c):
    "una red: dos capas de tres nodos, todas las aristas"
    izq, der = CX - 17, CX + 17
    ys = [cy - 15, cy, cy + 15]
    aristas = "".join(f'<line x1="{izq}" y1="{a}" x2="{der}" y2="{b}" stroke="{c}" '
                      f'stroke-width="1.1" stroke-opacity="0.75"/>' for a in ys for b in ys)
    nodos = "".join(f'<circle cx="{x}" cy="{y}" r="4.6" fill="{c}"/>'
                    for x in (izq, der) for y in ys)
    return aristas + nodos

def icono_respuesta(cy, c):
    "burbuja de chat con puntos suspensivos y un destello"
    b = (f'<rect x="{CX-21}" y="{cy-17}" width="42" height="29" rx="7" fill="none" '
         f'stroke="{c}" stroke-width="2.2"/>'
         f'<polygon points="{CX-11},{cy+11} {CX-1},{cy+11} {CX-11},{cy+21}" fill="{c}"/>')
    p = "".join(f'<circle cx="{CX + dx}" cy="{cy-3}" r="2.5" fill="{c}"/>' for dx in (-9, 0, 9))
    x, y = CX + 16, cy + 12
    d = (f'<path d="M{x},{y-6} L{x+1.7},{y-1.7} L{x+6},{y} L{x+1.7},{y+1.7} L{x},{y+6} '
         f'L{x-1.7},{y+1.7} L{x-6},{y} L{x-1.7},{y-1.7} Z" fill="{c}"/>')
    return b + p + d

def flecha(y0, y1):
    return (f'<line x1="{CX}" y1="{y0}" x2="{CX}" y2="{y1-8}" stroke="#ece6d0" '
            f'stroke-width="2.4" stroke-opacity="0.75"/>'
            f'<polygon points="{CX},{y1} {CX-6.5},{y1-10} {CX+6.5},{y1-10}" '
            f'fill="#ece6d0" fill-opacity="0.75"/>')

ICONOS = [icono_terminal, icono_red, icono_respuesta]
pz = ['<svg viewBox="0 0 210 392" style="width:100%; max-width:186px; max-height:372px;" role="img">']
for k, (y, c) in enumerate(zip(TILES, COLORES)):
    pz.append(tarjeta(y, c))
    pz.append(ICONOS[k](y + LADO // 2, c))
    pz.append(f'<text x="{CX}" y="{y + LADO + 20}" text-anchor="middle" fill="#ece6d0" '
              f'font-size="17" font-family="Lora,serif">{ETIQUETAS[k]}</text>')
    pz.append(f'<text x="{CX}" y="{y + LADO + 35}" text-anchor="middle" fill="#8a86a0" '
              f'font-size="11.5" font-family="Fira Code,monospace">texto</text>')
    if k < 2:
        pz.append(flecha(TILES[k] + LADO + 45, TILES[k + 1] - 4))
pz.append('</svg>')
SVG = "".join(pz)

SLIDE = f'''  <section data-transition="fade" id="sl-caja-negra">
    <h2>Un LLM es un Procesador de Prompts</h2>
    <div class="columns" style="align-items: center; margin-top:0.1em;">
      <div class="col-40" style="text-align:center;">
        {SVG}
      </div>
      <div class="col-55">
        <p style="font-size: 0.42em; text-align:left; margin:0 0 0.25em 0;">
          Entra <strong>una cadena de texto</strong>. Sale <strong>otra cadena de texto</strong>.
          Esa es toda la interfaz — no hay más.
        </p>
        <div class="roadmap" style="flex-direction: column; align-items: stretch; text-align:left; font-size: 0.39em;">
          <div class="step fragment fade-up" style="text-align:left;">No hay <strong>“modo resumen”</strong>
            ni <strong>“modo traducción”</strong>: hay un prompt. Por eso un solo modelo hace
            todos los usos que vienen enseguida.</div>
          <div class="step fragment fade-up" style="text-align:left;"><strong>No recuerda</strong> la
            llamada anterior. Lo que parece memoria es que <strong>tú le reenvías</strong> la
            conversación entera cada vez.</div>
          <div class="step fragment fade-up" style="text-align:left;">Y lo que parece <em>saber</em>
            está congelado en sus pesos desde que lo entrenaron.</div>
        </div>
        <p class="fragment fade-up" style="font-size: 0.39em; text-align:left; margin-top: 0.25em; padding: 0.3em 0.45em; background: rgba(255,255,0,0.07);">
          <strong style="color: var(--c-red);">No hay nada más en la caja</strong>: ni base de datos,
          ni internet, ni memoria. Todo lo que viene después —RAG, herramientas, agentes— son formas
          de <strong>elegir qué texto meter en ella</strong>.
        </p>
      </div>
    </div>
    <aside class="notes">
      Contenido propio; la composicion vertical con las tres tarjetas de icono sigue una referencia
      que dio el catedratico. Los iconos estan REDIBUJADOS en SVG con la paleta del tema, no copiados:
      el original es oscuro sobre blanco y el deck es al reves.

      Primera diapositiva de contenido de la unidad a proposito: la vista de CAJA NEGRA va antes de
      abrir el capo. La que sigue ("Un LLM es un Autocompletado muy Sofisticado") muestra el mecanismo
      interno; esta muestra la interfaz.

      Las tres vinetas son las tres sorpresas del principiante, y conviene dejarlas caer una por una:

      1. La interfaz es texto y nada mas. Eso es lo que hace que el bloque de casos de uso funcione:
         trece usos, un solo modelo, y lo unico que cambia es la instruccion.
      2. NO HAY MEMORIA. Es la que mas cuesta. La API es sin estado y la conversacion la mantiene el
         cliente reenviando la lista de mensajes. De ahi sale, sin trampa, que el costo crezca con la
         conversacion y que exista la ventana de contexto.
      3. El conocimiento esta en los pesos y tiene fecha de corte. Esa es, literalmente, la razon de
         ser de RAG.

      La ultima frase es la percha de todo el curso, y vale la pena volver a esta diapositiva al
      empezar la unidad 13.
    </aside>
  </section>'''

# ─────────────────────────── inserción / reemplazo ───────────────────────────
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-caja-negra' in doc:
    i = doc.index('<section data-transition="fade" id="sl-caja-negra">')
    fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:i] + SLIDE.strip() + doc[fin:]
    print("diapositiva de caja negra REEMPLAZADA por la version vertical")
else:
    marca = '<h2>Un LLM es un Autocompletado muy Sofisticado</h2>'
    if doc.count(marca) != 1:
        sys.exit("no encontre (o no es unica) la diapositiva del autocompletado")
    i = doc.rindex('<section', 0, doc.index(marca))
    doc = doc[:i] + SLIDE.strip() + "\n\n  " + doc[i:]
    print("diapositiva de caja negra insertada")
io.open(RUTA, 'w', encoding='utf-8').write(doc)
