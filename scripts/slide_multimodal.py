# -*- coding: utf-8 -*-
'''Diapositiva "Un Solo Espacio para Texto e Imagen", antes de "Multimodales: CLIP".

Replica la figura de referencia que dio el catedratico (entradas de texto e imagen ->
modelo multimodal -> un espacio donde los conceptos se agrupan sin importar la
modalidad), redibujada en SVG con la paleta del tema: el original es oscuro sobre
blanco y el deck es al reves. Los colores atan cada entrada con su punto, que es lo
que hace legible la figura.

Y se le anade lo que la figura idealizada NO dice y el curso ya midio en el notebook
29: existe una brecha de modalidad. Las imagenes se agrupan con imagenes. La figura
es la intuicion correcta del objetivo; los numeros matizan como leerla.

Idempotente por el id sl-multimodal-espacio.
'''
import io, sys

RUTA = "../index.html"

AZUL, ROSA, AMAR, MORA, TEAL = "#58C4DD", "#E48BB0", "#FFFF00", "#9A72AC", "#5CD0B3"
GRIS, FG = "#8a86a0", "#ece6d0"

def icono_texto(x, y, c):
    "una hoja con lineas: 'texto que contiene…'"
    s = (f'<rect x="{x}" y="{y}" width="15" height="19" rx="2.5" fill="none" '
         f'stroke="{c}" stroke-width="1.3"/>')
    for i in range(3):
        s += (f'<line x1="{x+3.5}" y1="{y+5+i*4.5}" x2="{x+11.5}" y2="{y+5+i*4.5}" '
              f'stroke="{c}" stroke-width="1.1"/>')
    return s

def icono_imagen(x, y, c):
    "un marco con montana y sol"
    return (f'<rect x="{x}" y="{y}" width="19" height="19" rx="2.5" fill="none" '
            f'stroke="{c}" stroke-width="1.3"/>'
            f'<circle cx="{x+5.5}" cy="{y+6}" r="2" fill="{c}"/>'
            f'<path d="M{x+2.5},{y+16} L{x+7.5},{y+9.5} L{x+11},{y+13.5} L{x+13.5},{y+11} '
            f'L{x+16.5},{y+16} Z" fill="{c}"/>')

def tarjeta(x, y, w, icono, c, etiqueta, sub):
    s = (f'<rect x="{x}" y="{y}" width="{w}" height="30" rx="6" fill="{c}" fill-opacity="0.10" '
         f'stroke="{c}" stroke-width="1.1"/>')
    s += icono(x + 9, y + 5.5, c)
    s += (f'<text x="{x+36}" y="{y+14}" fill="{c}" font-size="10" '
          f'font-family="Fira Code,monospace">{etiqueta}</text>'
          f'<text x="{x+36}" y="{y+25}" fill="{FG}" font-size="9.5" '
          f'font-family="Lora,serif">{sub}</text>')
    return s

def punto(cx, cy, c, r=5):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{c}"/>'

P = ['<svg viewBox="0 0 760 258" style="width:100%; max-width:760px; max-height:262px;" role="img">']

# ───── entradas ─────
P.append(f'<rect x="6" y="16" width="196" height="78" rx="9" fill="{AZUL}" fill-opacity="0.05" '
         f'stroke="{GRIS}" stroke-width="0.9" stroke-dasharray="4 3"/>')
P.append(tarjeta(16, 26, 176, icono_texto, ROSA, 'texto', '«un cachorro»'))
P.append(tarjeta(16, 60, 176, icono_texto, AZUL, 'texto', '«un perro»'))
P.append(f'<rect x="6" y="104" width="196" height="114" rx="9" fill="{TEAL}" fill-opacity="0.05" '
         f'stroke="{GRIS}" stroke-width="0.9" stroke-dasharray="4 3"/>')
P.append(tarjeta(16, 114, 176, icono_imagen, AMAR, 'imagen', 'foto de un perro'))
P.append(tarjeta(16, 148, 176, icono_texto, MORA, 'texto', '«un árbol»'))
P.append(tarjeta(16, 182, 176, icono_imagen, TEAL, 'imagen', 'foto de un árbol'))

# ───── el modelo ─────
P.append(f'<rect x="216" y="96" width="120" height="56" rx="9" fill="{AMAR}" fill-opacity="0.13" '
         f'stroke="{AMAR}" stroke-width="1.6"/>'
         f'<text x="276" y="118" text-anchor="middle" fill="{AMAR}" font-size="11.5" '
         f'font-family="Fira Code,monospace">modelo</text>'
         f'<text x="276" y="134" text-anchor="middle" fill="{FG}" font-size="11" '
         f'font-family="Lora,serif">multimodal</text>')
P.append(f'<line x1="202" y1="124" x2="212" y2="124" stroke="{GRIS}" stroke-width="1.4"/>')
P.append(f'<line x1="336" y1="124" x2="370" y2="124" stroke="{FG}" stroke-width="2"/>'
         f'<polygon points="379,124 367,117.5 367,130.5" fill="{FG}"/>')

# ───── el espacio ─────
OX, OY = 520, 196
P.append(f'<line x1="{OX}" y1="{OY}" x2="{OX}" y2="46" stroke="{FG}" stroke-width="1.6" '
         f'stroke-opacity="0.65"/><polygon points="{OX},40 {OX-4.5},52 {OX+4.5},52" '
         f'fill="{FG}" fill-opacity="0.65"/>')
P.append(f'<line x1="{OX}" y1="{OY}" x2="746" y2="228" stroke="{FG}" stroke-width="1.6" '
         f'stroke-opacity="0.65"/><polygon points="752,231 740,222 738,232" fill="{FG}" fill-opacity="0.65"/>')
P.append(f'<line x1="{OX}" y1="{OY}" x2="400" y2="240" stroke="{FG}" stroke-width="1.6" '
         f'stroke-opacity="0.65"/><polygon points="394,243 406,234 408,244" fill="{FG}" fill-opacity="0.65"/>')
P.append(f'<path d="M{OX},{OY} L746,228 L640,250 L400,240 Z" fill="none" stroke="{GRIS}" '
         f'stroke-width="0.8" stroke-dasharray="3 4" stroke-opacity="0.5"/>')

# nubes
P.append(f'<ellipse cx="452" cy="96" rx="52" ry="40" fill="none" stroke="{GRIS}" '
         f'stroke-width="1.2" stroke-dasharray="5 4"/>'
         f'<text x="452" y="46" text-anchor="middle" fill="{FG}" font-size="12" '
         f'font-family="Lora,serif">Árboles</text>')
P.append(punto(438, 88, TEAL) + punto(462, 106, MORA))
P.append(f'<ellipse cx="646" cy="106" rx="58" ry="44" fill="none" stroke="{GRIS}" '
         f'stroke-width="1.2" stroke-dasharray="5 4"/>'
         f'<text x="646" y="52" text-anchor="middle" fill="{FG}" font-size="12" '
         f'font-family="Lora,serif">Perros</text>')
P.append(punto(628, 92, ROSA) + punto(660, 100, AZUL) + punto(642, 122, AMAR))
P.append(f'<text x="674" y="92" text-anchor="middle" fill="{GRIS}" font-size="9.5" font-family="Lora,serif">perro</text>'
         f'<text x="624" y="82" text-anchor="middle" fill="{GRIS}" font-size="9.5" font-family="Lora,serif">cachorro</text>')
for cx, cy in ((556, 60), (520, 128), (582, 168), (694, 168), (474, 158), (612, 62), (720, 130)):
    P.append(f'<circle cx="{cx}" cy="{cy}" r="4" fill="{GRIS}" fill-opacity="0.35"/>')
P.append(f'<text x="560" y="248" text-anchor="middle" fill="{AMAR}" font-size="11" '
         f'font-family="Lora,serif" font-style="italic">la foto del perro cae con los TEXTOS '
         f'sobre perros, no con la otra foto</text>')
P.append('</svg>')
SVG = "".join(P)

SLIDE = f'''
  <section data-transition="fade" id="sl-multimodal-espacio">
    <h2>Un Solo Espacio para Texto e Imagen</h2>
    <div style="text-align:center; margin:0.15em 0;">
      {SVG}
    </div>
    <p style="font-size: 0.4em; margin-top: 0.1em;">
      Un modelo multimodal codifica <strong>texto e imágenes con el mismo espacio de salida</strong>.
      Por eso puedes buscar fotos escribiendo, o agrupar por concepto sin importar de qué modalidad
      venga cada cosa.
    </p>
    <p class="fragment fade-up" style="font-size: 0.385em; margin-top: 0.2em; padding: 0.3em 0.5em; background: rgba(252,98,85,0.08); border-left: 3px solid var(--c-red);">
      <strong>Y esa figura es el objetivo, no exactamente el resultado.</strong> Lo mediste en el
      notebook 29: una imagen se parece más a <strong>otra imagen (+0.46)</strong> que a
      <strong>su propia descripción (+0.32)</strong>, y los centros de las dos nubes están a
      <strong>0.88</strong>. Se llama <strong>brecha de modalidad</strong> — sirve para
      <em>ordenar dentro de una fila</em>, no como distancia absoluta.
    </p>
    <aside class="notes">
      Diagrama propio, redibujado en SVG a partir de una figura de referencia que dio el catedratico.
      Se redibuja y no se pega la imagen porque el original es oscuro sobre blanco y el deck es al
      reves — misma regla que con la figura de tamanos de modelos y con las tarjetas del anexo de
      Anthropic.

      COMO LEERLO EN CLASE: los colores atan cada entrada con su punto. Lo que hay que hacer notar es
      el punto AMARILLO, que es una FOTO de un perro y cae junto a los dos TEXTOS sobre perros, no
      junto a la otra foto. Ese es todo el mensaje del diagrama: el espacio se organiza por
      concepto, no por modalidad.

      Y ENSEGUIDA EL MATIZ, que es lo que separa este curso de la figura de marketing: eso es el
      OBJETIVO del entrenamiento contrastivo, no lo que sale exactamente. En el notebook 29 esta
      medido que el vecino mas cercano de cada punto es de su propia modalidad en los 16 casos, que
      imagen-imagen da +0.46 contra +0.32 de imagen con su propia descripcion, y que los centros de
      las dos nubes estan a 0.88 sobre vectores unitarios. Es la brecha de modalidad (Liang et al.
      2022): las dos modalidades viven en conos separados del mismo espacio.

      Consecuencia practica que hay que decir en voz alta: si mezclas imagenes y textos en el mismo
      indice vectorial y buscas por cercania cruda, te salen casi solo resultados de la modalidad de
      la consulta. Lo que funciona es comparar DENTRO de una fila — de estas ocho imagenes, cual va
      con este texto —, y ahi la diagonal acerto 8 de 8.
    </aside>
  </section>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-multimodal-espacio' in doc:
    sys.exit("Ya insertada; nada que hacer.")
i = doc.index('id="sl-clip"')
a = doc.rindex('<section', 0, i)
doc = doc[:a] + SLIDE.strip() + "\n\n  " + doc[a:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("«Un Solo Espacio para Texto e Imagen» insertada antes de «Multimodales: CLIP»")
