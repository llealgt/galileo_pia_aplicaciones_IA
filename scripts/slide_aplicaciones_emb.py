# -*- coding: utf-8 -*-
'''Agrega "Para Que Sirve un Embedding" en la unidad 10, justo antes de que la unidad
gire hacia busqueda semantica ("Busqueda Lexica vs. Semantica").

Hueco detectado: la unidad explicaba que son los embeddings, sus tipos y como
calcularlos, y acto seguido se metia en busqueda semantica sin decir nunca que la
busqueda es UNA de sus aplicaciones. Falta sobre todo la que pidio el catedratico:
el embedding como EXTRACTOR DE FEATURES, un vector que es la entrada de otro modelo.

El diagrama es el mismo esqueleto del transfer learning de la unidad 11 —backbone
congelado, cabeza entrenable— y decirlo asi es el gancho: ya lo vieron con imagenes.

Los numeros del cierre estan medidos en la tarea 30 (KMeans sobre los vectores de 384
dimensiones de 45 sinopsis: pureza 0.422 contra 0.200 al azar).

Idempotente por el id sl-emb-aplicaciones.
'''
import io, sys

RUTA = "../index.html"
AZUL, VERDE, AMAR, MORA, GRIS, FG = "#58C4DD", "#83C167", "#FFFF00", "#9A72AC", "#8a86a0", "#ece6d0"

def caja(x, y, w, h, t, c, sub=None, guiones=False):
    s = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{c}" fill-opacity="0.13" '
         f'stroke="{c}" stroke-width="1.4"'
         + (' stroke-dasharray="5 4"' if guiones else '') + '/>')
    s += (f'<text x="{x+w//2}" y="{y+(h//2+4 if not sub else h//2-2)}" text-anchor="middle" '
          f'fill="{FG}" font-size="11" font-family="Lora,serif">{t}</text>')
    if sub:
        s += (f'<text x="{x+w//2}" y="{y+h//2+13}" text-anchor="middle" fill="{c}" font-size="9.5" '
              f'font-family="Fira Code,monospace">{sub}</text>')
    return s

def flecha(x0, x1, y, c=GRIS):
    return (f'<line x1="{x0}" y1="{y}" x2="{x1-8}" y2="{y}" stroke="{c}" stroke-width="1.6"/>'
            f'<polygon points="{x1},{y} {x1-9},{y-5} {x1-9},{y+5}" fill="{c}"/>')

SVG = ('<svg viewBox="0 0 760 128" style="width:100%; max-width:760px; max-height:130px;" role="img">'
 + caja(6, 40, 104, 44, "tu texto", GRIS, "o imagen")
 + flecha(110, 146, 62)
 + caja(146, 32, 156, 60, "modelo de embeddings", AZUL, "CONGELADO")
 + '<text x="224" y="22" text-anchor="middle" fill="' + AZUL + '" font-size="9.5" '
   'font-family="Lora,serif" font-style="italic">no lo entrenas tú</text>'
 + flecha(302, 338, 62)
 + caja(338, 40, 112, 44, "vector", AMAR, "384 números")
 + flecha(450, 486, 62)
 + caja(486, 32, 158, 60, "modelo pequeño", VERDE, "entrenable", guiones=True)
 + '<text x="565" y="22" text-anchor="middle" fill="' + VERDE + '" font-size="9.5" '
   'font-family="Lora,serif" font-style="italic">esto sí lo entrenas</text>'
 + flecha(644, 680, 62)
 + f'<text x="690" y="58" text-anchor="middle" fill="{FG}" font-size="10.5" '
   f'font-family="Lora,serif">etiqueta</text>'
   f'<text x="690" y="72" text-anchor="middle" fill="{FG}" font-size="10.5" '
   f'font-family="Lora,serif">o grupo</text>'
 + f'<text x="380" y="118" text-anchor="middle" fill="{AMAR}" font-size="11" '
   f'font-family="Lora,serif" font-style="italic">lo caro ya está hecho: encima cabe una '
   f'regresión logística</text>'
 + '</svg>')

USOS = [
  ("Extractor de <em>features</em>", VERDE,
   "el vector es la <strong>entrada de otro modelo</strong>: clasificar, agrupar, detectar anomalías"),
  ("Búsqueda semántica", AZUL,
   "encontrar por significado — <strong>es lo que veremos a fondo</strong>, y lo que sostiene RAG"),
  ("Agrupamiento", MORA,
   "descubrir los temas de un corpus <strong>sin etiquetas</strong>"),
  ("Recomendación y duplicados", "#FF862F",
   "“parecido a esto”, y detectar lo que ya tienes escrito de otra forma"),
  ("Clasificación <em>zero-shot</em>", "#E48BB0",
   "comparar contra la descripción de cada clase, sin entrenar nada"),
]
lis = "".join(
  f'      <div style="margin:0.14em 0;"><strong style="color: {c};">{n}</strong> '
  f'<span style="color: var(--c-text-dim);">— {d}</span></div>\n' for n, c, d in USOS)

SLIDE = f'''
  <section data-transition="fade" id="sl-emb-aplicaciones">
    <h2>Para Qué Sirve un Embedding</h2>
    <div style="text-align:center; margin:0.15em 0;">
      {SVG}
    </div>
    <div style="font-size: 0.375em; text-align:left; max-width: 94%; margin: 0.15em auto;">
{lis}    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.25em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      El primero es <strong>el mismo esqueleto del transfer learning</strong> de la unidad 11:
      backbone congelado, cabeza entrenable. Allí eran hormigas y abejas sobre ImageNet; aquí es
      texto sobre un modelo de oraciones. <strong>Cambia el dato, no el mecanismo</strong> — y por eso
      con 45 sinopsis y un KMeans encima ya sale una pureza de <strong>0.422</strong> contra
      <strong>0.200</strong> al azar, sin entrenar ni una capa.
    </p>
    <aside class="notes">
      Contenido propio. HUECO QUE CIERRA: la unidad explicaba que son los embeddings, sus tipos y como
      calcularlos, y acto seguido se metia en busqueda semantica sin decir nunca que la busqueda es
      UNA de las aplicaciones. Esta diapositiva pone el mapa antes del giro.

      El uso que mas conviene subrayar es el primero, el de extractor de features, porque es el que
      convierte los embeddings en una herramienta de ML clasico y no solo de busqueda: codificas una
      vez, guardas los vectores, y encima entrenas lo que quieras —una regresion logistica, un KMeans,
      un detector de anomalias— con muy pocos datos etiquetados, porque lo caro del problema ya lo
      resolvio el modelo grande.

      El gancho con la unidad 11 es literal y conviene decirlo asi: es feature extraction, la misma
      idea con la que congelaron MobileNetV2 y le pusieron una cabeza nueva. Alli el "vector" eran las
      activaciones antes del clasificador; aqui es el embedding. Mismo esqueleto.

      El 0.422 esta medido en la tarea 30, con KMeans sobre los vectores completos de 384 dimensiones
      de 45 sinopsis y cinco generos: pureza 0.422 contra 0.200 que daria el azar. Sirve para que el
      numero no suene a folleto — es flojo, y esa es justo la conversacion interesante: un modelo de
      proposito general sin ajustar ya duplica al azar.

      La clasificacion zero-shot enlaza con la diapositiva de CLIP, donde se hace exactamente eso con
      imagenes contra "una foto de un {{clase}}".
    </aside>
  </section>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-emb-aplicaciones' in doc:
    sys.exit("Ya insertada; nada que hacer.")
m = '<h2>Búsqueda Léxica vs. Semántica</h2>'
if doc.count(m) != 1: sys.exit("no encontre «Búsqueda Léxica vs. Semántica»")
i = doc.rindex('<section', 0, doc.index(m))
doc = doc[:i] + SLIDE.strip() + "\n\n  " + doc[i:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("«Para Qué Sirve un Embedding» insertada antes del bloque de búsqueda")
