# -*- coding: utf-8 -*-
'''Agrega tres variantes de question answering al bloque de casos de uso (unidad 12),
justo despues de "Responder Preguntas sobre un Documento".

Las tres comparten UN MISMO corpus de cuatro extractos, a proposito: en clase se pega
una vez y despues solo cambia la pregunta. Cada una rompe una cosa distinta:

  A · la respuesta exige combinar TRES extractos (salto multiple) y citar de donde sale
  B · la respuesta NO esta en el corpus, y hay que decirlo en vez de estimarla
  C · la respuesta esta, pero hay que SUMAR para llegar a ella

Los prompts son autocontenidos y copiables (data-copiable), como el resto del bloque.
Las salidas son ejemplos escritos a mano, igual que en las demas — la de verdad la
produce Claude en vivo.

Idempotente por el id sl-uso-qa-corpus.
'''
import io, sys

RUTA = "../index.html"

CORPUS = '''MANUAL DE ATENCIÓN — extractos

[D1] GARANTÍA. Los electrodomésticos pequeños tienen 12 meses
de garantía desde la compra. Cubre defectos de fábrica. No
cubre daños por uso inadecuado ni por caídas.

[D2] CAMBIOS Y REPARACIONES. El cambio por unidad nueva aplica
sólo los primeros 30 días. Pasado ese plazo, la reparación se
hace en taller autorizado.

[D3] TALLERES. Guatemala: 5a avenida 12-34, zona 10.
Quetzaltenango: 4a calle 7-21, zona 3. Lunes a viernes, sin cita.

[D4] ENVÍOS. Dentro del país tardan de 2 a 4 días hábiles.
Gratis en compras mayores a Q500.'''

def qa(idd, titulo, cabecera, pregunta, salida, lista_titulo, lista, riesgo, notas):
    lis = "".join(f"          <li>{x}</li>\n" for x in lista)
    return f'''
  <section data-transition="fade" id="{idd}">
    <h2>{titulo}</h2>
    <div class="columns" style="font-size: 0.285em;">
      <div class="col-55">
        <pre data-copiable style="margin:0; font-size:0.94em; position:relative;"><code class="language-text">{cabecera}

{CORPUS}

PREGUNTA
{pregunta}</code></pre>
      </div>
      <div class="col-40">
        <div style="padding:0.4em 0.55em; background: rgba(131,193,103,0.09); border-left: 3px solid var(--c-green);">
          <strong style="color: var(--c-green);">Salida</strong><br>
          <span style="color: var(--c-text-dim);">{salida}</span>
        </div>
        <p style="margin-top:0.4em;"><strong>{lista_titulo}</strong></p>
        <ul style="margin:0.15em 0;">
{lis}        </ul>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.3em; padding: 0.28em 0.5em; background: rgba(252,98,85,0.08); border-left: 3px solid var(--c-red);">
      {riesgo}
    </p>
    <aside class="notes">{notas}</aside>
  </section>'''

NOTA_COMUN = ("Contenido propio. La salida es un EJEMPLO escrito a mano, no una medicion. "
              "EL CORPUS ES EL MISMO EN LAS TRES DIAPOSITIVAS: en clase se pega una vez y "
              "despues basta con cambiar la pregunta en el mismo chat, que es ademas como se "
              "comporta un RAG de verdad — el corpus se queda, la consulta cambia.\n\n")

S = []

S.append(qa(
  "sl-uso-qa-corpus", "Preguntar a un Corpus, no a un Documento",
  '''Responde usando ÚNICAMENTE los extractos de abajo. Indica
entre corchetes de qué documento sale cada parte. Si algo no
está en los extractos, dilo.''',
  '''Compré una licuadora hace cinco meses y huele a quemado.
Vivo en Quetzaltenango. ¿Qué procede y a dónde voy?''',
  'Sigue en garantía: son 12 meses <strong>[D1]</strong>. Como pasaron más de 30 días, '
  'corresponde reparación en taller, no cambio <strong>[D2]</strong>. En Quetzaltenango: '
  '4a calle 7-21, zona 3, de lunes a viernes sin cita <strong>[D3]</strong>.',
  "Lo que hace difícil esta pregunta:",
  ["La respuesta <strong>no está en un extracto</strong>: está repartida en tres",
   "Hay que <strong>encadenar</strong>: 5 meses &lt; 12 → sigue en garantía; &gt; 30 días → taller",
   "Pedir la <strong>cita</strong> te deja verificarla de un vistazo",
   "D4 es ruido: está en el corpus y no sirve aquí"],
  "<strong>El fallo típico:</strong> el modelo se queda con el <strong>primer extracto que suena</strong> "
  "y contesta “sí, está en garantía” — cierto y a medias. La pregunta se resuelve sólo si "
  "<strong>combina los tres</strong>, y eso es lo que hay que mirar al correrlo en vivo.",
  NOTA_COMUN +
  "Este es el caso que justifica RAG entero: cuando la respuesta esta repartida, el trabajo no es "
  "generar sino ELEGIR QUE METER en el prompt. Aqui le damos los cuatro extractos a mano; en un "
  "sistema real los elige el retriever, y si deja fuera D3 la respuesta sale incompleta sin que "
  "nadie se entere.\n\n"
  "Al correrlo en vivo conviene preguntarle a la clase ANTES que espera, y luego contar cuantos de "
  "los tres saltos dio. Con un modelo bueno los da los tres; el fallo interesante es el parcial.\n\n"
  "D4 (envios) esta puesto como distractor deliberado. Enlaza con la unidad 15: mas contexto no es "
  "mejor contexto."))

S.append(qa(
  "sl-uso-qa-nosabe", "Cuando la Respuesta No Está",
  '''Responde usando ÚNICAMENTE los extractos de abajo.
Si la respuesta no está en ellos, contesta exactamente:
"No está en el manual." No estimes ni supongas.''',
  '''¿Cuánto cuesta la reparación si ya se venció la garantía?''',
  '<strong style="color:var(--c-green);">No está en el manual.</strong>',
  "Por qué esta diapositiva importa:",
  ["El corpus habla de garantía, talleres y plazos… <strong>pero no de precios</strong>",
   "La <strong>salida de escape</strong> es la instrucción más importante del prompt",
   "Sin ella el modelo <strong>estima</strong> un precio que suena razonable",
   "Y suena razonable <strong>justo porque</strong> el resto del manual es real"],
  "<strong>Quítale la segunda línea al prompt y córrelo otra vez.</strong> Ese experimento de "
  "diez segundos es la mejor demostración de por qué “no sé” hay que <strong>pedirlo "
  "explícitamente</strong>: ningún modelo lo ofrece de suyo.",
  NOTA_COMUN +
  "ES LA DIAPOSITIVA PARA HACER EL EXPERIMENTO EN VIVO: correr el prompt tal cual (contesta que no "
  "esta), borrar la linea de la salida de escape y volver a correrlo. Casi siempre aparece un precio "
  "inventado, con formato de precio local y todo.\n\n"
  "Conecta con dos cosas ya medidas en el curso: el retriever devuelve k documentos AUNQUE ninguno "
  "responda (unidad 10, el caso de la capital de Guatemala), y la fidelidad de la unidad 16 es la "
  "metrica que caza exactamente este fallo. Aqui se ve el origen del problema; alli, como se mide."))

S.append(qa(
  "sl-uso-qa-cuenta", "Cuando Hay que Sacar la Cuenta",
  '''Responde usando ÚNICAMENTE los extractos de abajo.
Muestra la operación que hiciste antes de dar el resultado.''',
  '''Voy a comprar una licuadora de Q450 y un sartén de Q120.
¿Me cobran el envío? ¿En cuánto tiempo llega?''',
  'Q450 + Q120 = <strong>Q570</strong>. Como Q570 &gt; Q500, el envío es <strong>gratis</strong> '
  '<strong>[D4]</strong>. Llega en 2 a 4 días hábiles <strong>[D4]</strong>.',
  "Lo que se ve aquí:",
  ["El dato está en el corpus, pero <strong>la respuesta no</strong>: hay que calcularla",
   "“Muestra la operación” lo obliga a <strong>escribir la suma</strong> antes del resultado",
   "Y así el error, si lo hay, <strong>queda a la vista</strong>",
   "Es el mismo truco de <em>pedirle que piense antes</em> de la unidad 16"],
  "<strong>Aquí es donde un LLM se resbala</strong>, y ya lo mediste en esta unidad con el 1+1: "
  "aritmética sencilla, fallo silencioso. La solución de verdad no es un prompt mejor — es "
  "<strong>darle una calculadora</strong>, que es exactamente el caso de uso de herramientas "
  "que viene más adelante.",
  NOTA_COMUN +
  "Los numeros estan elegidos para que la suma quede JUSTO por encima del umbral (570 contra 500): "
  "si el modelo se equivoca al sumar, la respuesta cambia de sentido, no solo de cifra. Con 450+120 "
  "es dificil que falle; vale la pena repetirlo en vivo con cifras mas feas (Q437.50 + Q68.90) para "
  "que se vea el limite.\n\n"
  "Cierra el trio de QA y engancha con dos sitios del curso: 'pedirle que piense antes' de la unidad "
  "16, y 'elegir que herramienta invocar' del grupo 2 de este mismo bloque, donde la calculadora es "
  "la primera herramienta del ejemplo."))

# ─────────────────────────── inserción ───────────────────────────
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-uso-qa-corpus' in doc:
    sys.exit("Las variantes de QA ya estan insertadas; nada que hacer.")

anc = doc.index('id="sl-uso-responder"')
fin = doc.index('</section>', anc) + len('</section>')
doc = doc[:fin] + "\n" + "\n".join(s.rstrip() + "\n" for s in S) + doc[fin:]

# el contador de la bisagra: el grupo 1 pasa de ocho diapositivas a once
v = 'En los ocho casos anteriores la salida la leía una persona.'
if v not in doc: sys.exit("no encontre el contador de la bisagra")
doc = doc.replace(v, 'En los once casos anteriores la salida la leía una persona.', 1)

# y la entrada de la portada, que ahora cubre mas terreno
v2 = ('<strong style="color: var(--c-teal);">Responder</strong> '
      '<span style="color: var(--c-text-dim);">— pregunta + documento → respuesta</span>')
if v2 not in doc: sys.exit("no encontre la entrada «Responder» de la portada")
doc = doc.replace(v2, '<strong style="color: var(--c-teal);">Responder</strong> '
                  '<span style="color: var(--c-text-dim);">— pregunta + corpus → respuesta, '
                  'con citas o admitiendo que no está</span>', 1)

io.open(RUTA, 'w', encoding='utf-8').write(doc)
print(f"insertadas {len(S)} variantes de QA tras «Responder Preguntas sobre un Documento»")
