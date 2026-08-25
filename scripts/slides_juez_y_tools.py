# -*- coding: utf-8 -*-
'''Dos diapositivas nuevas para el bloque de casos de uso de la unidad 12:

  1. "El LLM como Evaluador de otro LLM" — le pone nombre a la tecnica (LLM-as-a-judge)
     y sube el escalon de prompt suelto a libreria (RAGAS, DeepEval), con la advertencia
     ya MEDIDA en el notebook 31.
  2. "El Cerebro que Elige la Herramienta" — un prompt con cinco herramientas y cinco
     consultas, para que el modelo elija la mejor de cada una en vivo. Incluye una que
     no necesita ninguna.

Las dos van detras de su pareja del grupo 2 y son PROFUNDIZACIONES de familias que ya
existen (juzgar, herramientas), asi que los contadores de la portada no cambian.

Idempotente por el id sl-uso-evaluador.
'''
import io, sys

RUTA = "../index.html"

# ═════════════ 1 · el LLM como evaluador ═════════════
EVALUADOR = '''
  <section data-transition="fade" id="sl-uso-evaluador">
    <h2>El LLM como Evaluador de otro LLM</h2>
    <p style="font-size: 0.42em; margin-bottom: 0.2em;">
      Lo que acabas de ver tiene nombre —<strong>LLM-as-a-judge</strong>— y es hoy la forma
      estándar de evaluar texto libre. La razón es simple: <strong>no hay una única respuesta
      correcta</strong> que comparar con <code>==</code>, y nadie va a leer 500 respuestas a mano.
    </p>
    <table style="font-size: 0.35em; width: 100%; max-width: 860px; margin: 0.2em auto;">
      <tr><th style="text-align:left;">Escalón</th><th style="text-align:left;">Qué es</th>
          <th style="text-align:left;">Cuándo</th></tr>
      <tr><td style="text-align:left;"><strong style="color:var(--c-blue);">Un prompt suelto</strong></td>
        <td style="text-align:left;">el de la diapositiva anterior: tú escribes el criterio</td>
        <td style="text-align:left;">explorar, comparar dos versiones de tu prompt</td></tr>
      <tr><td style="text-align:left;"><strong style="color:var(--c-orange);">RAGAS</strong></td>
        <td style="text-align:left;">trae hechas <em>faithfulness</em> y <em>response relevancy</em>, y las corre sobre un dataset</td>
        <td style="text-align:left;">un reporte de qué tan bueno es tu RAG hoy</td></tr>
      <tr><td style="text-align:left;"><strong style="color:var(--c-green);">DeepEval</strong></td>
        <td style="text-align:left;">las mismas, más <strong>G-Eval</strong> (métrica escrita en prosa) y un <code>threshold</code></td>
        <td style="text-align:left;">que el CI <strong>falle</strong> si alguien empeora el prompt</td></tr>
    </table>
    <p class="fragment fade-up" style="font-size: 0.395em; margin-top: 0.25em; padding: 0.3em 0.5em; background: rgba(252,98,85,0.08); border-left: 3px solid var(--c-red);">
      <strong>Y el juez arrastra los mismos defectos que juzga.</strong> Medido en el notebook 31:
      <code>AnswerRelevancy</code> le dio <strong>1.00 a la respuesta que inventaba</strong> el
      descuento y 0.67 a la correcta — porque mide si contestas lo que se preguntó, no si es cierto.
      Un juez se <strong>calibra contra juicio humano</strong> antes de creerle.
    </p>
    <p style="font-size: 0.38em; text-align:center; margin-top: 0.2em; color: var(--c-text-dim);">
      Se ve a fondo en la <strong>unidad 16</strong> · notebook <strong>22</strong> (RAGAS) y
      <strong>31</strong> (DeepEval)
    </p>
    <aside class="notes">
      Contenido propio. Esta diapositiva le pone nombre a lo que la anterior enseño con un prompt, y
      abre la escalera hasta las librerias. El nombre en ingles —LLM-as-a-judge— conviene decirlo
      porque es como lo van a encontrar buscando.

      El numero del recuadro rojo esta MEDIDO (notebook 31, deepeval 4.1.10 con Qwen2.5-1.5B de juez,
      sin llave): relevancia 1.00 para la respuesta que alucina el descuento y 0.67 para la correcta.
      No es un fallo de la metrica — mide si contestas lo que se pregunto, no si es cierto. Por eso
      relevancia y fidelidad se reportan SIEMPRE juntas.

      Lo que hay que dejar claro para el capstone: LLM-as-a-judge no sustituye tener un conjunto de
      evaluacion con respuestas de referencia. Lo que hace es que ese conjunto se pueda correr en
      cada cambio sin que nadie lea nada. Y el juez tiene que ser un modelo capaz: en el notebook 31
      esta medido que con uno de 1.5B los numeros ni siquiera son estables.
    </aside>
  </section>'''

# ═════════════ 2 · el cerebro que elige la herramienta ═════════════
PROMPT_TOOLS = '''Eres el cerebro de un asistente de soporte. Tienes estas
herramientas y NINGUNA otra:

  buscar_pedido(numero)       estado y fecha de compra de un pedido
  consultar_garantia(dias)    qué cubre la garantía a X días
  crear_orden_taller(pedido)  agenda una reparación
  buscar_manual(modelo)       devuelve el manual de un modelo
  tipo_de_cambio(moneda)      convierte a quetzales

Para CADA consulta responde una sola línea con la llamada que
harías primero, en el formato  herramienta(argumento).
Si ninguna sirve, responde  ninguna.

CONSULTAS
1. ¿Dónde viene mi pedido #A-4471?
2. Compré la licuadora hace 5 meses y huele a quemado.
   ¿Eso lo cubre la garantía?
3. ¿Cómo limpio el filtro de la XR-3000?
4. Muchas gracias, muy amable.
5. El repuesto cuesta 89 dólares, ¿cuánto es en quetzales?'''

CEREBRO = f'''
  <section data-transition="fade" id="sl-uso-cerebro">
    <h2>El Cerebro que Elige la Herramienta</h2>
    <div class="columns" style="font-size: 0.30em;">
      <div class="col-55">
        <pre data-copiable style="margin:0; font-size:0.94em; position:relative;"><code class="language-text">{PROMPT_TOOLS}</code></pre>
      </div>
      <div class="col-40">
        <div style="padding:0.4em 0.55em; background: rgba(131,193,103,0.09); border-left: 3px solid var(--c-green);">
          <strong style="color: var(--c-green);">Salida</strong><br>
          <span style="color: var(--c-text-dim); font-family:'Fira Code',monospace; font-size:0.95em;">
          1. buscar_pedido("#A-4471")<br>
          2. consultar_garantia(150)<br>
          3. buscar_manual("XR-3000")<br>
          4. ninguna<br>
          5. tipo_de_cambio("USD")</span>
        </div>
        <p style="margin-top:0.4em;"><strong>Mira las cinco, no la primera:</strong></p>
        <ul style="margin:0.15em 0;">
          <li>La <strong>2</strong> exige convertir “5 meses” a <strong>días</strong>: elegir la herramienta incluye <strong>armar el argumento</strong></li>
          <li>La <strong>4</strong> no necesita ninguna. Sin esa salida, el modelo <strong>inventa una llamada</strong></li>
          <li>La <strong>3</strong> se parece a la 1 — y el único desempate está en la <strong>descripción</strong></li>
        </ul>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.25em; padding: 0.28em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      Esto es <strong>todo lo que hace un agente</strong> en su primer paso: mirar las herramientas,
      elegir una y escribir sus argumentos. Lo demás —ejecutar, leer el resultado y volver a
      decidir— es un bucle alrededor de esta misma decisión.
      <span style="color: var(--c-text-dim);">Unidad 19.</span>
    </p>
    <aside class="notes">
      Contenido propio. La salida es un EJEMPLO escrito a mano; la de verdad la produce Claude al
      pegar el prompt, que es la gracia. Las cinco consultas estan elegidas para que cada una rompa
      algo distinto y conviene correrlas y comentarlas una por una:

      1 · el caso facil, hay una herramienta obvia.
      2 · la trampa buena: "5 meses" no es un argumento; el modelo tiene que convertirlo a 150 dias.
          Elegir la herramienta y ARMAR EL ARGUMENTO son dos habilidades distintas y la segunda falla
          mas.
      3 · buscar_manual contra buscar_pedido: las dos "buscan algo de un producto". Lo unico que las
          separa es la descripcion. Si el modelo se equivoca aqui, la leccion no es "el modelo es
          malo" sino "tu descripcion no distingue".
      4 · "muchas gracias" no necesita herramienta. Sin la ruta de escape explicita, el modelo llama
          a algo igual — es el fallo medido en el notebook 28, donde el agente inventaba
          saludo[bonjour].
      5 · tipo_de_cambio existe pero es de otro dominio: sirve para ver que el modelo no se limita a
          las herramientas "del tema".

      Buen ejercicio en vivo: borrar la linea de "si ninguna sirve, responde ninguna" y volver a
      correr la 4.
    </aside>
  </section>'''

# ═════════════ inserción ═════════════
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-uso-evaluador' in doc:
    sys.exit("Ya insertadas; nada que hacer.")

def tras(idd, bloque, que):
    global doc
    i = doc.index(f'id="{idd}"')
    fin = doc.index('</section>', i) + len('</section>')
    doc = doc[:fin] + "\n" + bloque.strip() + "\n" + doc[fin:]
    print("  insertada tras", que)

tras('sl-uso-juzgar', EVALUADOR, "«Juzgar y Comparar»")
tras('sl-uso-herramientas', CEREBRO, "«Elegir Qué Herramienta Invocar»")
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("listo")
