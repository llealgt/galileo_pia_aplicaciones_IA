# -*- coding: utf-8 -*-
'''Inserta las diapositivas de DeepEval en la unidad 16, despues de "RAGAS en Codigo".

El material original del que sale la unidad (curso de RAG de DeepLearning.AI) usa RAGAS.
DeepEval es la alternativa que el curso tambien queria mostrar, y no es un clon: cambia
la filosofia — RAGAS produce una tabla de numeros, DeepEval produce pruebas que pasan o
fallan, con umbral, al estilo de pytest.

TODOS los numeros de estas diapositivas estan MEDIDOS con Qwen2.5-1.5B-Instruct como juez,
en CPU y sin llave de OpenAI (scripts/med_deepeval.py, agosto 2026). Incluido el fallo:
las tres metricas del retriever no sobreviven a un juez de 1.5B con el juez ingenuo.

Idempotente por el id sl-deepeval-vs.
'''
import io, sys

RUTA = "../index.html"

S = []

# ─────────────── 1. la comparación ───────────────
S.append('''
  <section data-transition="fade" id="sl-deepeval-vs">
    <h2>La Otra Opción: DeepEval</h2>
    <p style="font-size: 0.42em; margin-bottom: 0.2em;">
      Mide <strong>las mismas dos cosas</strong> —fidelidad y relevancia— pero no te devuelve
      una tabla: te devuelve <strong>pruebas que pasan o fallan</strong>.
    </p>
    <table style="font-size: 0.365em; width: 100%; max-width: 850px; margin: 0.2em auto;">
      <tr><th style="text-align:left;"></th><th>RAGAS</th><th>DeepEval</th></tr>
      <tr><td style="text-align:left;">La unidad de trabajo</td>
        <td>un <code>Dataset</code> de filas</td><td>un <code>LLMTestCase</code></td></tr>
      <tr><td style="text-align:left;">Lo que sale</td>
        <td>una tabla de puntajes</td>
        <td><strong style="color:var(--c-green);">pasa</strong> /
            <strong style="color:var(--c-red);">falla</strong> contra un <code>threshold</code></td></tr>
      <tr><td style="text-align:left;">Dónde encaja</td>
        <td>un reporte de evaluación</td>
        <td>tu <strong>suite de pruebas</strong>, junto a pytest</td></tr>
      <tr><td style="text-align:left;">Métrica a medida</td>
        <td>escribir una clase</td>
        <td><strong>G-Eval</strong>: la describes <em>en prosa</em></td></tr>
      <tr><td style="text-align:left;">Juez local</td>
        <td><code>LangchainLLMWrapper</code></td><td>heredar de <code>DeepEvalBaseLLM</code></td></tr>
      <tr><td style="text-align:left;">Sin llave de OpenAI</td>
        <td style="color:var(--c-green);">✔</td><td style="color:var(--c-green);">✔ medido</td></tr>
    </table>
    <blockquote class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.25em;">
      🎯 La diferencia que importa no es la lista de métricas — es <strong>dónde vive la
      evaluación</strong>. Con un umbral, tu RAG deja de tener “una nota” y pasa a tener una
      <strong>prueba de regresión</strong> que rompe el build cuando alguien empeora el prompt.
    </blockquote>
    <aside class="notes">
      Contenido propio, con las APIs de las dos librerias, medido en agosto de 2026 con
      deepeval 4.1.10 (script: scripts/med_deepeval.py). El notebook 31 es solo de DeepEval; el 22
      sigue siendo el de RAGAS, a proposito, para poder compararlos sin que se estorben las versiones
      (RAGAS fija toda la familia langchain en 0.3.x).

      El punto pedagogico de la diapositiva no es "cual es mejor". Es que RAGAS esta pensado para
      RESPONDER "que tan bueno es mi RAG" y DeepEval para responder "se rompio algo desde ayer". Son
      preguntas distintas y en un proyecto real se quieren las dos.

      Ojo al presentarlo: DeepEval usa gpt-4o por defecto. Para correrlo sin llave hay que pasarle un
      juez propio, que es justo lo que hace el notebook 31.
    </aside>
  </section>''')

# ─────────────── 2. el código ───────────────
S.append('''
  <section data-transition="fade" id="sl-deepeval-codigo">
    <h2>DeepEval en Código</h2>
    <pre style="font-size: 0.295em; max-width: 95%; margin: 0 auto; overflow-x:auto;"><code class="language-python">from deepeval import evaluate
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

# 1. Un CASO, no una fila de dataset. Cada metrica usa los campos que necesita.
caso = LLMTestCase(
    input             = "¿Ofrecen descuento para estudiantes?",
    actual_output     = "Sí, ofrecemos 10% con carné de estudiante vigente.",
    retrieval_context = ["Descuento adultos mayores: 10% con identificación.",
                         "Descuento nuevos clientes: 10% en la primera compra."],
    expected_output   = "No hay descuento para estudiantes.")

# 2. Una metrica INVENTADA por ti, descrita en una frase. Esto RAGAS no lo tiene.
tono = GEval(name="Tono de soporte",
             criteria="Evalúa si la respuesta es cortés y NO promete nada que no "
                      "aparezca en el contexto recuperado.",
             evaluation_params=[LLMTestCaseParams.INPUT,
                                LLMTestCaseParams.ACTUAL_OUTPUT,
                                LLMTestCaseParams.RETRIEVAL_CONTEXT])

# 3. El umbral convierte la nota en una PRUEBA: pasa o falla.
evaluate(test_cases=[caso], metrics=[
    FaithfulnessMetric(threshold=0.7),      # ¿cada afirmacion esta respaldada?
    AnswerRelevancyMetric(threshold=0.7),   # ¿contesta lo que se pregunto?
    tono])
# » Pass Rate: 33.3% | Passed: 1 | Failed: 2</code></pre>
    <p class="fragment fade-up" style="font-size: 0.38em; text-align:center; margin-top: 0.2em;">
      Por defecto el juez es <code>gpt-4o</code> y <strong>hay que pagar</strong>. Para usar el
      modelo local del curso se hereda de <code>DeepEvalBaseLLM</code> — cuatro métodos, y está
      hecho en el <strong>notebook 31</strong>.
    </p>
    <aside class="notes">
      API de deepeval 4.1.10, verificada corriendo (scripts/med_deepeval.py). El "Pass Rate" del
      comentario es ilustrativo del formato de salida, no de esta corrida concreta.

      Tres cosas que conviene senalar al proyectarlo:

      1. El threshold es una decision de PRODUCTO, no estadistica. "No acepto respuestas con
         fidelidad menor a 0.7" es una politica, y ponerla en el codigo la vuelve discutible y
         versionable, que es justo lo que se quiere.
      2. GEval es la pieza que no tiene equivalente en RAGAS: la metrica es la frase de `criteria`.
         El paper es Liu et al. 2023 (arXiv 2303.16634): el LLM genera los pasos de evaluacion a
         partir del criterio y luego puntua siguiendolos.
      3. En una suite real esto va con assert_test dentro de pytest, y entonces el CI no despliega
         un prompt que bajo la fidelidad. Eso esta al final del notebook 31.
    </aside>
  </section>''')

# ─────────────── 3. lo medido ───────────────
FILAS = [
    ("Faithfulness",        "inventa",  "0.00", "FALLO"),
    ("Faithfulness",        "correcta", "0.67", "FALLO"),
    ("AnswerRelevancy",     "inventa",  "1.00", "1.00"),
    ("AnswerRelevancy",     "correcta", "0.67", "0.00"),
    ("G-Eval (tono)",       "inventa",  "0.40", "0.80"),
    ("ContextualPrecision", "inventa",  "FALLO", "0.00"),
    ("ContextualRecall",    "inventa",  "FALLO", "0.00"),
    ("ContextualRelevancy", "inventa",  "1.00", "1.00"),
]
def celda(v):
    if v == "FALLO":
        return '<td style="color:var(--c-red);">FALLO</td>'
    return f'<td style="font-family:\'Fira Code\',monospace;">{v}</td>'
filas = "".join(
    f'      <tr><td style="text-align:left;">{m}</td>'
    f'<td style="color:var(--c-text-dim);">{c}</td>{celda(a)}{celda(b)}</tr>\n'
    for m, c, a, b in FILAS)

S.append(f'''
  <section data-transition="fade" id="sl-deepeval-medido">
    <h2>Lo que Pasa con un Juez Pequeño</h2>
    <p style="font-size: 0.4em; margin-bottom: 0.15em;">
      Las mismas métricas, con <code>Qwen2.5-1.5B</code> de juez. Entre las dos columnas cambia
      <strong>una sola cosa</strong>: si el esquema JSON va dentro del prompt del juez.
    </p>
    <div class="columns" style="align-items: flex-start;">
      <div class="col-45">
        <table style="font-size: 0.315em; width: 100%; margin: 0;">
          <tr><th style="text-align:left;">métrica</th><th>caso</th><th>ingenuo</th><th>+ esquema</th></tr>
{filas}        </table>
      </div>
      <div class="col-50">
        <p style="font-size: 0.38em; text-align:left; margin:0.1em 0;">
          Le pasas el esquema para ayudarlo… y el modelo <strong>te devuelve el esquema</strong>:</p>
        <pre style="font-size: 0.26em; margin:0.2em 0;"><code class="language-json">// sin esquema en el prompt — correcto
{{"verdicts": [{{"verdict": "no",
   "reason": "The retrieval context mentions
              an adult discount, not a student
              discount."}}]}}

// con el esquema en el prompt — lo copia
{{"$defs": {{"FaithfulnessVerdict": {{
   "properties": {{"verdict": {{"enum": ["yes"],
   "title": "Verdict", ...</code></pre>
        <p style="font-size: 0.37em; text-align:left; margin-top:0.25em; color: var(--c-text-dim);">
          Resuelve bien los dos primeros pasos —extraer verdades y afirmaciones— y se cae en
          <code>Verdicts</code>, el esquema más complejo de la cadena.
        </p>
      </div>
    </div>
    <blockquote class="fragment fade-up" style="font-size: 0.38em; margin-top: 0.2em;">
      🎯 El cuello de botella <strong>no es la librería, es el juez</strong>. Por eso RAGAS y
      DeepEval traen GPT-4o por defecto. Con un modelo chico aprendes el cableado y mides el
      límite — <strong>no obtienes una evaluación en la que confiar</strong>.
    </blockquote>
    <aside class="notes">
      TODO medido con scripts/med_deepeval.py (deepeval 4.1.10, Qwen2.5-1.5B-Instruct en CPU,
      temperatura 0, sin llave). Las salidas crudas del paso Verdicts son literales de esa corrida.

      ESTA DIAPOSITIVA CORRIGE DOS HIPOTESIS MIAS, y vale la pena contarlo asi en clase porque es
      metodo: primero supuse que endurecer el juez arreglaria las metricas del retriever —arregla
      dos y ROMPE Faithfulness, que sin esquema funcionaba—; despues supuse que el modelo se
      confundia por el tamano del prompt —no: resuelve bien Truths y Claims, y solo se cae en
      Verdicts—. La captura cruda es la que zanjo el asunto.

      Enlaza con la unidad 12: el bucle ReAct a mano le gano al tool calling nativo con el mismo
      modelo, por la misma razon de fondo. Emitir JSON que cumpla un esquema ajeno es una habilidad
      anadida despues del entrenamiento, y en modelos pequenos esta poco consolidada.

      El numero que mas conviene senalar es AnswerRelevancy = 1.00 para la respuesta que INVENTA el
      descuento. No es un fallo de la metrica: relevancia mide si contestas lo que se pregunto, no si
      es cierto. Por eso se reporta junto a fidelidad y nunca sola.
    </aside>
  </section>''')

# ─────────────── inserción ───────────────
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-deepeval-vs' in doc:
    sys.exit("Las diapositivas de DeepEval ya estan insertadas; nada que hacer.")

ancla = '<h2>RAGAS en Código</h2>'
if doc.count(ancla) != 1:
    sys.exit("el ancla «RAGAS en Codigo» no es unica")
i = doc.index(ancla)
fin = doc.index('</section>', i) + len('</section>')
doc = doc[:fin] + "\n" + "\n".join(s.rstrip() + "\n" for s in S) + doc[fin:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print(f"insertadas {len(S)} diapositivas de DeepEval tras «RAGAS en Código»")
