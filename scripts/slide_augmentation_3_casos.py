# -*- coding: utf-8 -*-
'''Agrega "Sin Aumentar, x10 y x20" tras "Data Augmentation
en la Practica" (unidad 6, sub-slide 34).

Captura REAL de Weights & Biases que aporto el catedratico: seis metricas de
validacion de un detector de objetos (MobileNet + transfer learning) entrenado tres
veces, cambiando SOLO cuanto aumento hay. No se redibuja: son datos medidos y no
tenemos las series crudas, asi que redibujarlas seria inventar puntos. Se enmarca en
blanco porque W&B exporta sobre fondo claro.

Los numeros de la diapositiva y de las notas estan MEDIDOS sobre los pixeles de la
imagen (color de cada curva + calibracion con los gridlines del eje), no leidos a
ojo: leerlos a ojo daba 0.49 vs 0.50 en AR_large cuando la diferencia real es
0.494 vs 0.562. Script de medicion: ver el historial de esta misma carpeta.

Idempotente por el id sl-aug-3-casos: si ya existe, la reemplaza.
'''
import io, sys

RUTA = "../index.html"
# Ojo: Reveal da margen vertical a todo <img>; de ahi el margin:0 y el marco que la abraza.
MARCO = ("background:#ffffff; border-radius:8px; padding:0.25em; box-sizing:border-box; "
         "box-shadow:0 2px 10px rgba(0,0,0,0.35);")
CHIP = ("display:inline-block; padding:0.12em 0.5em; border-radius:4px; "
        "font-size:0.92em; white-space:nowrap;")

def chip(color, texto, sub):
    return (f'<span style="{CHIP} border-left:5px solid {color};">'
            f'<strong style="color:{color};">{texto}</strong> '
            f'<span style="color:var(--c-text-dim);">{sub}</span></span>')

CLAVE = "  ".join([
    chip("#96C55E", "verde", "sin aumento"),
    chip("#B46F53", "café", "×10 por imagen real"),
    chip("#CC3778", "corinto", "×20 por imagen real"),
])

SLIDE = f'''
  <section data-transition="fade" id="sl-aug-3-casos">
    <h2>Sin Aumentar, ×10 y ×20</h2>
    <p style="font-size: 0.4em; text-align:center; margin: 0 0 0.25em 0;">
      El mismo modelo y los mismos hiperparámetros; lo único que cambia es
      <strong>cuántas copias aumentadas se generan por cada imagen real</strong>.
    </p>
    <p style="font-size: 0.42em; text-align:center; margin: 0 0 0.3em 0;">{CLAVE}</p>
    <div style="text-align:center;">
      <img src="img/Clase_Augmentation_wb_3_casos.png"
           alt="Seis métricas de validación en W&amp;B para tres entrenamientos: sin aumento, con ×10 y con ×20"
           style="width:auto; height:auto; max-width:100%; max-height:450px; margin:0; {MARCO}">
    </div>
    <p class="fragment fade-up" style="font-size: 0.37em; margin-top: 0.3em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      <strong style="color: var(--c-red);">Sin aumento</strong> el <code>val/loss</code> toca su mejor
      valor (1.22) hacia el paso 8 y de ahí <strong>sube</strong> hasta 2.08: overfitting de libro.
      Con aumento se queda <strong style="color: var(--c-green);">plano</strong> (1.05–1.14) y el
      <code>AR</code> mejora en los tres tamaños de objeto. <strong>×10 y ×20 quedan casi empatados</strong>
      — el salto grande es de <em>0 a ×10</em>.
    </p>
    <aside class="notes">
      Captura real de Weights &amp; Biases aportada por el catedratico (deteccion de objetos, MobileNet
      con transfer learning). No se redibujo: son datos medidos y no tenemos las series crudas. Lo que
      cambia entre los tres runs es SOLO el factor de aumento.

      OJO CON LOS NOMBRES DE LOS RUNS: los tres dicen "augOFF" y no distinguen los casos. Eso es la
      bandera de aumento EN LINEA del pipeline, que esta apagada en los tres porque las copias
      aumentadas se generaron antes como imagenes en disco. Quien es quien lo dice el catedratico, no
      la leyenda — conviene aclararlo en clase antes de que alguien lo lea al reves.

      NUMEROS MEDIDOS sobre la imagen (color de curva + calibracion con los gridlines), no a ojo:
      - val/loss: verde 1.22 (paso ~8) -> 2.08 al final. Cafe 1.14, corinto 1.05, planos todo el rato.
      - val/class_predictions_loss: verde 1.56 contra 0.64 (x10) y 0.57 (x20). El dano se concentra
        en la CLASIFICACION.
      - val/box_predictions_loss: 0.518 contra 0.497 y 0.474. La localizacion casi no sufre — la caja
        se aprende con menos variedad que la clase, y eso explica por que la curva verde de box solo
        se aplana mientras la de class se dispara.
      - AR comparado al PASO 60 (ver el matiz de abajo): small 0.289 -> 0.316 / 0.319;
        medium 0.447 -> 0.482 / 0.490; large 0.494 -> 0.550 / 0.562.

      TRES MATICES HONESTOS:
      1. Los runs NO duran lo mismo: verde 60 epocas, cafe 100, corinto ~70 (su nombre dice ep100, asi
         que o seguia corriendo o se detuvo). Comparar el ultimo punto de cada uno no es justo; por eso
         las cifras de AR de arriba estan tomadas al paso 60, que es el presupuesto comun. La
         conclusion no cambia.
      2. x10 vs x20 se separan un poco en box_loss y AR_large a favor de x20, pero con longitudes
         distintas y un solo run por caso NO alcanza para declarar un ganador. Lo que si aguanta el
         dato es el salto de 0 a x10.
      3. Un solo experimento, un solo dataset: ilustra el mecanismo, no mide "cuanto aumento conviene"
         en general. Eso depende del dataset y del modelo.

      GANCHO: enlaza con overfitting (inicio de la unidad) y con EarlyStopping de la unidad de
      callbacks — la curva verde es exactamente el caso donde EarlyStopping habria cortado en el paso
      ~10, y aun asi el modelo aumentado llega mas lejos.
    </aside>
  </section>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-aug-3-casos' in doc:
    i = doc.index('<section data-transition="fade" id="sl-aug-3-casos">')
    fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:i] + SLIDE.strip() + doc[fin:]
    print("(ya existia: reemplazada)")
else:
    m = '<h2>Data Augmentation en la Práctica</h2>'
    if doc.count(m) != 1: sys.exit("no encontre «Data Augmentation en la Práctica»")
    i = doc.index(m); fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:fin] + "\n" + SLIDE.strip() + "\n" + doc[fin:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("«Sin Aumentar, ×10 y ×20» lista (sección 6, sub 35)")
