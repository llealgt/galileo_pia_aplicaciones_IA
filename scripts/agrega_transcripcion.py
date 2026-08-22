# -*- coding: utf-8 -*-
'''Agrega el caso de uso "Analizar la Transcripcion de una Reunion" al bloque de la
unidad 12, al final del grupo 1 (justo antes de la diapositiva bisagra).

Va al final del grupo a proposito: es el primero que pide TRES operaciones en un solo
prompt —resumir, extraer decisiones y sacar next steps— asi que cierra el grupo
mostrando que las familias se combinan. Y la transcripcion esta escrita con dos
trampas deliberadas: un dato que se contradice (28 vs 31 usuarios) y un tema que se
discutio SIN cerrar, para que la instruccion de separar decidido/abierto tenga algo
que hacer.

Ajusta ademas los tres contadores que dependen del numero de casos: el SVG y el texto
de la portada, la bisagra ("en los siete casos anteriores") y el cierre del bloque.

Idempotente por el id sl-uso-transcripcion.
'''
import io, re, sys

RUTA = "../index.html"

TRANSCRIPCION = '''Analiza la transcripción y devuelve TRES secciones:
RESUMEN — máx. 4 líneas, para quien no asistió.
DECISIONES — sólo lo que quedó CERRADO, y quién lo cerró.
NEXT STEPS — tarea, responsable y fecha. Si no se dijo,
  pon "sin responsable" o "sin fecha". NO los inventes.
Al final, lista aparte lo que quedó ABIERTO.

TRANSCRIPCIÓN — junta de proyecto, 18 ago 2026
[00:04] ANA: el piloto con Comercial arrancó el lunes.
        De 40 usuarios entraron 31.
[02:10] LUIS: ¿31? Yo tengo 28 en el tablero.
[02:18] ANA: el tablero no cuenta Quetzaltenango.
[05:47] MARCOS: me preocupa la latencia: en hora pico
        pasamos de 4 s. Con el modelo chico bajamos a
        1.2, pero se cae la calidad en tickets largos.
[09:12] LUIS: propongo dejar el chico por defecto y
        escalar al grande si el ticket pasa de 500
        palabras.
[09:40] ANA: me parece. ¿Lo tienes para el viernes?
[09:44] MARCOS: para el viernes sí.
[14:02] LUIS: falta el presupuesto de infra, pero sin
        Patricia no avanzamos.
[15:20] ANA: lo dejamos para la próxima.'''

SALIDA = ('<strong style="color:var(--c-blue);">RESUMEN</strong> — arrancó el piloto con Comercial: '
          '31 de 40 usuarios. El tablero marcaba 28 porque no cuenta Quetzaltenango. Preocupa la '
          'latencia en hora pico.<br>'
          '<strong style="color:var(--c-green);">DECISIONES</strong> — modelo chico por defecto y '
          'escalar al grande sobre 500 palabras <em>(propuesto por Luis, aceptado por Ana)</em>.<br>'
          '<strong style="color:var(--c-orange);">NEXT STEPS</strong> — implementarlo · '
          '<strong>Marcos</strong> · viernes.<br>'
          '<strong style="color:var(--c-red);">ABIERTO</strong> — presupuesto de infraestructura, '
          'bloqueado sin Patricia.')

NUEVA = '''
  <section data-transition="fade" id="sl-uso-transcripcion">
    <h2>Analizar la Transcripción de una Reunión</h2>
    <div class="columns" style="font-size: 0.285em;">
      <div class="col-55">
        <pre data-copiable style="margin:0; font-size:0.92em; position:relative;"><code class="language-text">''' + TRANSCRIPCION + '''</code></pre>
      </div>
      <div class="col-40">
        <div style="padding:0.4em 0.55em; background: rgba(131,193,103,0.09); border-left: 3px solid var(--c-green);">
          <strong style="color: var(--c-green);">Salida</strong><br>
          <span style="color: var(--c-text-dim);">''' + SALIDA + '''</span>
        </div>
        <p style="margin-top:0.4em;"><strong>Es el primero que pide tres cosas a la vez:</strong></p>
        <ul style="margin:0.15em 0;">
          <li><strong>Resumir</strong> + <strong>extraer</strong> + <strong>estructurar</strong>, en un solo prompt</li>
          <li>Separar <strong>lo decidido de lo discutido</strong> es una instrucción, no magia</li>
          <li>“<strong>sin fecha</strong>” explícito evita que invente compromisos</li>
        </ul>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.3em; padding: 0.28em 0.5em; background: rgba(252,98,85,0.08); border-left: 3px solid var(--c-red);">
      <strong>El riesgo propio de las transcripciones:</strong> el modelo tiende a convertir en
      decisión <strong>todo lo que se discutió</strong>, y a repartir tareas que nadie aceptó.
      Aquí lo del presupuesto <strong>no se decidió</strong> — si sale en DECISIONES, el prompt falló.
    </p>
    <aside class="notes">
      Contenido propio. La salida es un EJEMPLO escrito a mano, no una medicion — misma regla que el
      resto del bloque. Para la demo en vivo, el boton copia el prompt y la salida real la produce
      Claude delante de la clase.

      LA TRANSCRIPCION TIENE DOS TRAMPAS PUESTAS A PROPOSITO, y conviene no adelantarlas:

      1. El dato se contradice: Ana dice 31 usuarios y Luis dice 28. No es un error de tipeo — la
         propia transcripcion lo resuelve dos lineas despues (el tablero no cuenta Quetzaltenango).
         Un buen resumen tiene que reconciliarlo, no elegir uno al azar ni promediarlos.
      2. Lo del presupuesto se DISCUTE y se aplaza. Es la prueba de fuego del prompt: si aparece en
         DECISIONES, el modelo convirtio conversacion en compromiso. Ese es el fallo mas caro de este
         caso de uso, porque las actas se leen despues como si fueran acuerdos.

      Buen ejercicio en clase: correrlo primero SIN la ultima linea ("lista aparte lo que quedo
      ABIERTO") y despues con ella, y comparar. Tambien vale quitar el "NO los inventes" y ver si
      aparece una fecha para el presupuesto.

      Es ademas el caso de uso con el retorno mas obvio para el capstone: cualquier organizacion
      tiene horas de reuniones grabadas y nadie las lee.
    </aside>
  </section>'''

# ─────────────────────────── insercion ───────────────────────────
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-uso-transcripcion' in doc:
    sys.exit("El caso de transcripciones ya esta insertado; nada que hacer.")

def sust(viejo, nuevo, que, texto=None):
    global doc
    t = doc if texto is None else texto
    if viejo not in t: sys.exit("no encontre para sustituir: " + que)
    r = t.replace(viejo, nuevo, 1)
    if texto is None: doc = r
    return r

# 1) va al final del grupo 1, justo antes de la bisagra
anc = doc.index('id="sl-uso-codigo"')
fin = doc.index('</section>', anc) + len('</section>')
doc = doc[:fin] + "\n" + NUEVA + doc[fin:]

# 2) la fila 1 del SVG de la portada pasa de 7 a 8 cajas
F1 = [("resumir", "#58C4DD"), ("clasificar", "#83C167"), ("extraer", "#FF862F"),
      ("reescribir", "#9A72AC"), ("responder", "#5CD0B3"), ("redactar", "#E48BB0"),
      ("código", "#FFFF00"), ("transcripción", "#5CD0B3")]
fila_nueva = "".join(
    '<rect x="%d" y="18" width="88" height="26" rx="6" fill="%s" fill-opacity="0.16" stroke="%s" '
    'stroke-width="1.2"/><text x="%d" y="35" text-anchor="middle" fill="#ece6d0" font-size="10" '
    'font-family="Lora,serif">%s</text>' % (1 + i * 95, c, c, 1 + i * 95 + 44, t)
    for i, (t, c) in enumerate(F1))
m = re.search(r'(<text x="380" y="11".*?</text>)(.*?)(<text x="380" y="64")', doc, re.S)
if not m: sys.exit("no encontre la fila 1 del SVG de la portada")
doc = doc[:m.start(2)] + fila_nueva + doc[m.end(2):]

# 3) los contadores que dependen del numero de casos
sust('las doce son la misma operación: texto entra, texto sale',
     'las trece son la misma operación: texto entra, texto sale', "pie del SVG")
sust('cae en <strong>doce usos</strong>', 'cae en <strong>trece usos</strong>',
     "párrafo de la portada")
sust('<strong style="color: var(--c-yellow);">Generar código</strong> <span style="color: '
     'var(--c-text-dim);">— descripción → función que corre</span></div>',
     '<strong style="color: var(--c-yellow);">Generar código</strong> <span style="color: '
     'var(--c-text-dim);">— descripción → función que corre</span></div>\n'
     '        <div style="margin:0.16em 0;"><strong style="color: var(--c-teal);">Analizar una '
     'reunión</strong> <span style="color: var(--c-text-dim);">— transcripción → acta '
     'accionable</span></div>', "lista del grupo 1")
sust('En los siete casos anteriores la salida la leía una persona.',
     'En los ocho casos anteriores la salida la leía una persona.', "bisagra")
sust('con doce instrucciones distintas', 'con trece instrucciones distintas',
     "cierre del bloque")

io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("caso de transcripciones insertado; contadores actualizados a trece")
