# -*- coding: utf-8 -*-
'''Agrega "Learning Rate Mas Chico, Entrenamiento Mas Estable" tras
"ModelCheckpoint y ReduceLROnPlateau" (unidad 8, callbacks).

Dos capturas REALES de W&B que dio el catedratico: la curva de learning rate de un
entrenamiento y seis metricas de validacion del mismo. Aqui NO se redibuja (a
diferencia de las figuras de referencia esquematicas): son datos medidos y no
tenemos las series crudas, asi que redibujarlas seria inventar puntos. Se enmarcan
en fondo claro porque W&B las exporta sobre blanco.

Lectura honesta que va en pantalla y en notas: la curva es un decaimiento
PROGRAMADO tipo coseno, no ReduceLROnPlateau; el efecto que ilustra es el mismo.

Idempotente por el id sl-lr-decay-real: si ya existe, la reemplaza.
'''
import io, sys

RUTA = "../index.html"
# Ojo: Reveal da margen vertical a todo <img>; por eso las dos imagenes llevan margin:0.
MARCO = ("background:#ffffff; border-radius:8px; padding:0.35em; box-sizing:border-box; "
         "box-shadow:0 2px 10px rgba(0,0,0,0.35);")

SLIDE = f'''
  <section data-transition="fade" id="sl-lr-decay-real">
    <h2>Menos Learning Rate, Más Estabilidad</h2>
    <div class="columns" style="align-items: center; margin-top: 0.05em;">
      <div class="col-40" style="text-align:center;">
        <img src="img/Clase_Callbacks_wb_lr_decay.png" alt="Curva del learning rate: baja de 0.001 a cerca de 0.0001 en 80 pasos"
             style="width:auto; height:auto; max-width:100%; max-height:140px; margin:0; {MARCO}">
        <p style="font-size: 0.31em; color: var(--c-text-dim); margin: 0.12em 0 0 0;">
          el <strong>learning rate</strong>: de 0.001 a ~0.0001 en 80 pasos</p>
      </div>
      <div class="col-55">
        <p style="font-size: 0.38em; text-align:left; margin: 0;">
          El mismo entrenamiento, seis métricas de validación. Mientras el lr sigue
          <strong style="color: var(--c-red);">alto</strong>, las curvas <strong>rebotan</strong>: caídas
          bruscas alrededor de los pasos 30–35, <strong>en las seis a la vez</strong>. Desde el paso ~50,
          con el lr ya por debajo de la mitad, las oscilaciones <strong style="color: var(--c-green);">se
          apagan</strong> y las curvas suben parejo.
        </p>
      </div>
    </div>
    <div style="text-align:center; margin-top: 0.18em;">
      <img src="img/Clase_Callbacks_wb_val_metricas.png" alt="Seis métricas de validación en W&amp;B: ruidosas al inicio, estables al final"
           style="width:auto; height:auto; max-width:100%; max-height:262px; margin:0; {MARCO}">
    </div>
    <p class="fragment fade-up" style="font-size: 0.37em; margin-top: 0.2em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      Es la intuición de <code>ReduceLROnPlateau</code> vista en datos reales: con pasos grandes el
      optimizador <strong>rebota alrededor del mínimo</strong>; con pasos chicos <strong>se asienta</strong>.
      <span style="color: var(--c-text-dim);">Ojo: aquí el lr baja con un calendario suave (tipo coseno),
      no por meseta — el efecto que ilustra es el mismo.</span>
    </p>
    <aside class="notes">
      Capturas reales de Weights &amp; Biases que aporto el catedratico: el learning rate de un
      entrenamiento y seis metricas de validacion del mismo run (AR50, AP_small, AP_medium, AP_large,
      AP_det1, AP_class_1 — metricas de deteccion de objetos estilo COCO). No se redibujaron: son datos
      medidos y no tenemos las series crudas.

      COMO LEERLAS: la linea tenue es el valor crudo y la oscura el suavizado de W&amp;B. Lo que hay que
      senalar es la AMPLITUD de las oscilaciones, no el nivel: antes del paso ~40 las seis curvas tienen
      caidas bruscas y, sobre todo, caen JUNTAS alrededor de los pasos 30-35. Que las seis caigan a la
      vez apunta a un evento de optimizacion (un paso demasiado grande que saca al modelo de la zona
      buena), no a un problema de una metrica en particular. Desde el ~50, con el lr por debajo de
      0.0005, esas caidas desaparecen.

      DOS MATICES HONESTOS:
      1. Esta curva es un decaimiento PROGRAMADO (suave, tipo coseno), no ReduceLROnPlateau, que baja a
         saltos cuando la metrica se estanca. El mecanismo que ilustra —pasos mas chicos, entrenamiento
         mas estable— es el mismo, y por eso sirve aqui.
      2. Parte del aplanamiento tambien es convergencia: al final del entrenamiento el modelo cambia
         menos de todos modos. Pero la desaparicion de las caidas simultaneas sigue la bajada del lr, que
         es el efecto de libro.

      Enlaza con la diapositiva anterior: por eso ReduceLROnPlateau lleva patience MENOR que
      EarlyStopping — hay que darle tiempo al lr chico para que haga exactamente esto.
    </aside>
  </section>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-lr-decay-real' in doc:
    i = doc.index('<section data-transition="fade" id="sl-lr-decay-real">')
    fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:i] + SLIDE.strip() + doc[fin:]
    print("(ya existia: reemplazada)")
else:
    m = '<h2>ModelCheckpoint y ReduceLROnPlateau</h2>'
    if doc.count(m) != 1: sys.exit("no encontre la diapositiva de ReduceLROnPlateau")
    i = doc.index(m); fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:fin] + "\n" + SLIDE.strip() + "\n" + doc[fin:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("«Menos Learning Rate, Más Estabilidad» lista (sección 8, sub 9)")
