# -*- coding: utf-8 -*-
'''Unidad 12: sube el bloque de casos de uso, lo enriquece y lo hace demostrable en vivo.

Tres cosas a la vez:
  1. mueve las 6 diapositivas de casos de uso (hoy tras "La Ventana de Contexto") a
     justo despues del catalogo de modelos y antes de "Tokens";
  2. le agrega 8 casos de uso nuevos, repartidos en dos grupos — el LLM que transforma
     un texto, y el LLM como pieza interna de un sistema — mas una de transicion;
  3. deja los DOCE prompts pegables en Claude: sin huecos {…} y con data-copiable,
     que js/widgets/copiar-prompt.js convierte en un boton.

De paso arregla dos defectos previos: la portada del bloque anunciaba en su SVG cinco
familias distintas de las que enumeraba su lista (y "responder" no tenia diapositiva),
y "El Patron Detras de las Cinco" fijaba el numero en el titulo y en el cuerpo.

Las salidas siguen siendo EJEMPLOS ESCRITOS A MANO, igual que las cinco originales, y
las notas de cada diapositiva lo dicen. Con el boton, la salida de verdad la produce
Claude en clase.

Idempotente por el id sl-uso-responder.
'''
import io, re, sys

RUTA = "../index.html"

# ─────────────────────────── plantilla ───────────────────────────
def caso(idd, titulo, prompt, salida, control_titulo, control, riesgo, notas,
         color_salida="green"):
    lis = "".join(f"          <li>{c}</li>\n" for c in control)
    caja_riesgo = ""
    if riesgo:
        caja_riesgo = (
            '    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.3em; '
            'padding: 0.28em 0.5em; background: rgba(252,98,85,0.08); '
            'border-left: 3px solid var(--c-red);">\n'
            f'      {riesgo}\n    </p>\n')
    return f'''
  <section data-transition="fade" id="{idd}">
    <h2>{titulo}</h2>
    <div class="columns" style="font-size: 0.36em;">
      <div class="col-55">
        <pre data-copiable style="margin:0; font-size:0.94em; position:relative;"><code class="language-text">{prompt}</code></pre>
      </div>
      <div class="col-40">
        <div style="padding:0.4em 0.55em; background: rgba(131,193,103,0.09); border-left: 3px solid var(--c-{color_salida});">
          <strong style="color: var(--c-{color_salida});">Salida</strong><br>
          <span style="color: var(--c-text-dim);">{salida}</span>
        </div>
        <p style="margin-top:0.4em;"><strong>{control_titulo}</strong></p>
        <ul style="margin:0.15em 0;">
{lis}        </ul>
      </div>
    </div>
{caja_riesgo}    <aside class="notes">{notas}</aside>
  </section>'''

NOTA_SALIDAS = ("La salida es un EJEMPLO escrito a mano, no una medicion — misma regla que las "
                "cinco diapositivas originales del bloque. Para la demo en vivo, el boton copia "
                "el prompt y la salida real la produce Claude delante de la clase.")

NUEVAS = {}

# ═══════════════ GRUPO 1 — transformar un texto que le das ═══════════════

NUEVAS['responder'] = caso(
  "sl-uso-responder", "Responder Preguntas sobre un Documento",
  """Responde la pregunta usando ÚNICAMENTE la política de abajo.
Si la respuesta no está en el texto, contesta exactamente:
"No está en la política."

POLÍTICA DE GARANTÍA
Los electrodomésticos pequeños tienen 12 meses de garantía
desde la fecha de compra. Cubre defectos de fábrica. Incluye
cambio por unidad nueva durante los primeros 30 días; después
de ese plazo se repara en taller autorizado. No cubre daños
por uso inadecuado ni por caídas.

PREGUNTA
Compré una licuadora hace cinco meses y huele a quemado.
¿Me la cambian por una nueva?""",
  "No. El cambio por unidad nueva sólo aplica los primeros 30 días; a los cinco meses "
  "corresponde reparación en taller autorizado.",
  "Lo que controlas con la instrucción:",
  ["<strong>Fuente</strong>: “únicamente el texto de abajo”",
   "<strong>Salida de escape</strong>: qué decir si no está",
   "<strong>Cita</strong>: “indica la frase que lo respalda”",
   "<strong>Alcance</strong>: no opinar, no aconsejar de más"],
  "<strong>Sin la salida de escape</strong>, el modelo contesta con lo que sabe del mundo en vez "
  "de decir que no está en el documento. Esa línea es la diferencia entre un asistente útil y uno "
  "que inventa políticas de tu empresa.",
  "Contenido propio. Esta es la quinta familia que el SVG de la portada ya anunciaba "
  "(\"responder\") y que hasta ahora no tenia diapositiva. " + NOTA_SALIDAS +
  " ES LA DIAPOSITIVA QUE ABRE RAG: si la respuesta tiene que salir de un documento, alguien "
  "tiene que elegir QUE documento meter en el prompt — y eso es exactamente el retriever de la "
  "unidad 13. Conviene decirlo aqui en voz alta.")

NUEVAS['redactar'] = caso(
  "sl-uso-redactar", "Redactar desde Puntos Clave",
  """Redacta la respuesta al cliente a partir de estos puntos.
Tono cordial y directo, máximo 90 palabras. No agregues
ninguna información que no esté en los puntos.

PUNTOS
- pedido #A-4471, licuadora, comprada el 12 de marzo
- la garantía sí cubre el defecto
- pasaron más de 30 días: corresponde reparación, no cambio
- taller autorizado: 5a avenida 12-34, zona 10
- puede llevarla sin cita, de lunes a viernes""",
  "Estimado cliente: revisamos su pedido #A-4471. La falla que describe sí está cubierta por la "
  "garantía. Como han pasado más de 30 días desde la compra del 12 de marzo, corresponde "
  "reparación en taller autorizado…",
  "Lo que controlas con la instrucción:",
  ["<strong>Longitud</strong>: “máximo 90 palabras”",
   "<strong>Tono</strong>: cordial, formal, seco",
   "<strong>Estructura</strong>: correo, mensaje corto, viñetas",
   "<strong>Fidelidad</strong>: “nada que no esté en los puntos”"],
  "<strong>Es la operación más peligrosa de todas</strong>: aquí el modelo tiene que producir "
  "<strong>más</strong> texto del que recibe, y todo lo que agregue de más es invención. "
  "Resumir recorta; redactar rellena.",
  "Contenido propio. " + NOTA_SALIDAS + " El contraste con la diapositiva de Resumir es el punto: "
  "alli el peligro era agregar, aqui agregar es literalmente el encargo, y por eso la instruccion "
  "de fidelidad pasa de recomendable a obligatoria. Buen momento para pedirle a la clase que "
  "adivine que pasa si se quita esa ultima linea del prompt — y luego quitarla en vivo.")

NUEVAS['codigo'] = caso(
  "sl-uso-codigo", "Generar y Explicar Código",
  """Escribe una función de Python que reciba una lista de tickets
(cada uno un dict con "id", "fecha" en formato AAAA-MM-DD y
"texto") y devuelva cuántos tickets hay por mes.

Requisitos:
- sólo librería estándar, nada de pandas
- docstring corto y un ejemplo de uso
- explica en dos frases por qué elegiste esa estructura""",
  "<code>def tickets_por_mes(tickets):</code> … con <code>collections.Counter</code> y "
  "<code>t[\"fecha\"][:7]</code> como llave.",
  "Lo que controlas con la instrucción:",
  ["<strong>Dependencias</strong>: “sólo librería estándar”",
   "<strong>Versión y estilo</strong>: type hints, docstring",
   "<strong>Pruebas</strong>: “agrega tres casos borde”",
   "<strong>Explicación</strong>: cuánta, y para quién"],
  "<strong>El código que sale compila y parece correcto — y puede estar mal.</strong> "
  "Se lee antes de pegarlo, igual que el de un compañero. La confianza la da la prueba que corres, "
  "no lo bien redactado que se ve.",
  "Contenido propio. " + NOTA_SALIDAS + " Es el uso que los estudiantes ya hacen a diario y que "
  "conviene nombrar explicitamente en el curso en vez de dejarlo como habito informal. Engancha "
  "con la unidad 20, donde el Agent SDK usa exactamente esto con herramientas de archivo.")

# ═══════════════ transición ═══════════════

NUEVAS['transicion'] = '''
  <section data-transition="fade" id="sl-uso-transicion">
    <h2>El LLM También Decide, no sólo Redacta</h2>
    <div style="text-align:center; margin:0.3em 0;">
      <svg viewBox="0 0 760 128" style="width:100%; max-width:760px; max-height:130px;" role="img">
<text x="190" y="16" text-anchor="middle" fill="#8a86a0" font-size="11.5" font-family="Fira Code,monospace">lo que vimos hasta ahora</text><rect x="42" y="30" width="120" height="40" rx="7" fill="#58C4DD" fill-opacity="0.14" stroke="#58C4DD"/><text x="102" y="54" text-anchor="middle" fill="#58C4DD" font-size="11.5" font-family="Fira Code,monospace">el LLM</text><line x1="162" y1="50" x2="218" y2="50" stroke="#8a86a0" stroke-width="1.4"/><polygon points="218,50 210,46 210,54" fill="#8a86a0"/><rect x="220" y="30" width="120" height="40" rx="7" fill="#ece6d0" fill-opacity="0.07" stroke="#8a86a0"/><text x="280" y="48" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">lo lee</text><text x="280" y="62" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">una persona</text><text x="190" y="94" text-anchor="middle" fill="#8a86a0" font-size="10.5" font-family="Lora,serif" font-style="italic">si sale algo raro, el humano lo nota</text><line x1="380" y1="14" x2="380" y2="118" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/><text x="570" y="16" text-anchor="middle" fill="#FFFF00" font-size="11.5" font-family="Fira Code,monospace">lo que viene ahora</text><rect x="422" y="30" width="120" height="40" rx="7" fill="#58C4DD" fill-opacity="0.14" stroke="#58C4DD"/><text x="482" y="54" text-anchor="middle" fill="#58C4DD" font-size="11.5" font-family="Fira Code,monospace">el LLM</text><line x1="542" y1="50" x2="598" y2="50" stroke="#FFFF00" stroke-width="1.4"/><polygon points="598,50 590,46 590,54" fill="#FFFF00"/><rect x="600" y="30" width="130" height="40" rx="7" fill="#83C167" fill-opacity="0.14" stroke="#83C167"/><text x="665" y="48" text-anchor="middle" fill="#83C167" font-size="11" font-family="Fira Code,monospace">lo lee</text><text x="665" y="62" text-anchor="middle" fill="#83C167" font-size="11" font-family="Fira Code,monospace">TU CÓDIGO</text><text x="570" y="94" text-anchor="middle" fill="#FC6255" font-size="10.5" font-family="Lora,serif" font-style="italic">si sale algo raro, revienta una función</text><text x="380" y="120" text-anchor="middle" fill="#FFFF00" font-size="11.5" font-family="Lora,serif">mismo modelo, misma instrucción — pero ahora el formato no es cosmético</text>
      </svg>
    </div>
    <p style="font-size: 0.43em;">
      En los siete casos anteriores la salida la leía una persona. En los cinco que siguen,
      la salida <strong>entra a tu programa</strong>: es una etiqueta que elige una rama, un JSON que
      alimenta una consulta, el nombre de una función que se va a ejecutar.
    </p>
    <div class="roadmap" style="flex-direction: column; align-items: stretch; text-align:left; font-size: 0.42em; margin-top:0.25em;">
      <div class="step fragment fade-up" style="text-align:left;">El <strong>formato deja de ser
        cosmético</strong>: “responde sólo con la categoría” es un requisito, no un capricho.</div>
      <div class="step fragment fade-up" style="text-align:left;">Hay que <strong>validar la salida</strong>
        antes de usarla — el modelo puede devolver algo que no está en tu lista.</div>
      <div class="step fragment fade-up" style="text-align:left;">Y cada uno de los cinco
        <strong>se detalla más adelante en el curso</strong>. Aquí sólo se ven de lejos.</div>
    </div>
    <aside class="notes">
      Contenido propio. Diapositiva bisagra del bloque, y la que le da sentido a la segunda mitad.

      El cambio que hay que hacer explicito: cuando la salida la lee una persona, un formato raro es
      una molestia; cuando la lee tu codigo, es una excepcion en produccion. De ahi salen las tres
      reglas que se repiten en toda la segunda mitad — conjunto cerrado, validar contra ese conjunto,
      y una ruta de escape.

      Las cinco que siguen son ademas el mapa del resto del curso: enrutar (unidad 18), self-query
      (unidad 10), reescribir la consulta (unidad 14), herramientas (unidad 19) y juzgar (unidad 16).
      Vale la pena decir eso aqui: el estudiante entiende por que el curso sigue como sigue.
    </aside>
  </section>'''

# ═══════════════ GRUPO 2 — el LLM como pieza de un sistema ═══════════════

NUEVAS['router'] = caso(
  "sl-uso-router", "Router: a Dónde Mandar Esto",
  """Eres el enrutador de un sistema de soporte. Lee el mensaje y
responde SOLO con una de estas rutas, sin explicar nada:

  garantia_taller | cambio_inmediato | facturacion | humano

Reglas:
- defecto y más de 30 días desde la compra  -> garantia_taller
- defecto y 30 días o menos                 -> cambio_inmediato
- cobros, facturas o reembolsos             -> facturacion
- enojado, amenaza legal, o no encaja arriba -> humano

MENSAJE
Compré una licuadora el 12 de marzo, pedido #A-4471, y ya
huele a quemado. Todavía está en garantía.""",
  "<code style=\"color:var(--c-green);\">garantia_taller</code>",
  "Por qué es distinto de clasificar:",
  ["La etiqueta <strong>elige una rama de código</strong>",
   "Conviene el modelo <strong>más chico y barato</strong>",
   "Necesita una <strong>ruta de escape</strong> a humano",
   "Se mide por costo y latencia, no sólo por acierto"],
  "Es la misma operación que <em>clasificar</em>, con otra consecuencia: aquí la etiqueta no se le "
  "muestra a nadie, <strong>enciende un camino</strong>. Por eso lleva regla explícita y ruta a "
  "humano. <span style=\"color:var(--c-text-dim);\">Se detalla en la unidad 18.</span>",
  "Contenido propio. " + NOTA_SALIDAS + " El punto economico es el que sorprende: el router corre "
  "en TODAS las peticiones, asi que es donde mas se nota elegir un modelo barato. Es el ejemplo "
  "canonico de la unidad 18 (un modelo chico decide la rama y uno grande hace el trabajo).")

NUEVAS['selfquery'] = caso(
  "sl-uso-selfquery", "Extractor de Self-Query",
  """Separa la pregunta en DOS partes y responde sólo con JSON.

  "query":   lo que hay que buscar por SIGNIFICADO dentro del
             texto del ticket. Si no queda nada, usa "".
  "filtros": condiciones sobre estos campos, y sólo estos:
               fecha      AAAA-MM-DD
               categoria  garantia | envio | facturacion
               estado     abierto | cerrado
               prioridad  entero de 1 a 5
             Operadores: eq, ne, gt, gte, lt, lte, in

PREGUNTA
tickets de garantía abiertos de este año en los que el
cliente se queje de olor a quemado""",
  '<code>{"query": "olor a quemado", "filtros": [categoria eq garantia, estado eq abierto, '
  'fecha gte 2026-01-01]}</code>',
  "Lo que hace que funcione:",
  ["El <strong>esquema va en el prompt</strong>: campos, tipos y valores permitidos",
   "El LLM <strong>nunca ve los datos</strong>, sólo el esquema",
   "<code>query</code> vacío es una respuesta <strong>válida</strong>",
   "La salida se <strong>valida</strong> antes de ejecutarla"],
  "Aquí se ve por qué el formato importa: ese JSON <strong>se convierte en una consulta</strong>. "
  "Si el modelo inventa un valor que no existe —<code>categoria: \"quemado\"</code>— la búsqueda "
  "devuelve cero y nadie sabe por qué. <span style=\"color:var(--c-text-dim);\">Unidad 10.</span>",
  "Contenido propio, con el mismo caso del ticket para no cambiar de dominio a mitad del bloque. "
  + NOTA_SALIDAS + " La unidad 10 ya trae un widget con cinco prompts de self-query listos para "
  "pegar en Claude, con casos que rompen suposiciones distintas; este es el aperitivo. "
  "El detalle de 'este ano' -> fecha gte 2026-01-01 es bueno para senalar que el extractor tambien "
  "resuelve referencias temporales relativas, y que por eso conviene pasarle la fecha de hoy.")

NUEVAS['reescribir'] = caso(
  "sl-uso-reescribir", "Reescribir la Consulta del Usuario",
  """Reescribe la consulta para buscarla en la base de documentación.
Responde sólo con JSON:

  "corregida": la consulta con la ortografía arreglada
  "expandida": la misma intención, con los términos que usaría
               la documentación oficial
  "variantes": 3 formas alternas de preguntar lo mismo

CONSULTA
la licuadora ase ruido raro y guele a quemado, la puedo
canbiar?""",
  '<code>corregida</code>: “la licuadora hace ruido raro y huele a quemado, ¿la puedo cambiar?” · '
  '<code>expandida</code>: “falla por sobrecalentamiento, cambio o reparación bajo garantía”',
  "Para qué sirve cada campo:",
  ["<strong>Corregida</strong> — el usuario no escribe como la documentación",
   "<strong>Expandida</strong> — acerca su vocabulario al del corpus",
   "<strong>Variantes</strong> — se busca con las tres y se fusionan",
   "Todo esto pasa <strong>antes</strong> de tocar el índice"],
  "Y hay que <strong>medirlo, no suponerlo</strong>: expandir de más trae ruido y puede empeorar la "
  "búsqueda. <span style=\"color:var(--c-text-dim);\">Se retoma, ya con números, en la unidad 14.</span>",
  "Contenido propio. " + NOTA_SALIDAS + " Conecta con dos cosas que el curso ya midio: el "
  "contraejemplo de busqueda semantica de la unidad 10 (donde la consulta original apinaba seis "
  "cosenos en 0.082 y el top-k salia casi arbitrario) y la expansion de consulta de la unidad 14. "
  "Insistir en la ultima frase: en aquella medicion expandir mejoro el ranking pero NO arreglo el "
  "fallo con top-2. No es una bala de plata.")

NUEVAS['herramientas'] = caso(
  "sl-uso-herramientas", "Elegir Qué Herramienta Invocar",
  """Tienes estas herramientas:

  buscar_pedido(numero)       datos y fecha de compra
  consultar_garantia(dias)    qué cubre la garantía a X días
  crear_orden_taller(pedido)  agenda una reparación

Lee el mensaje y responde SOLO con la llamada que hay que
hacer PRIMERO, en el formato  herramienta(argumento).
Si no hace falta ninguna, responde  ninguna.

MENSAJE
Buenas, mi pedido #A-4471 huele a quemado. ¿Qué procede?""",
  '<code style="color:var(--c-green);">buscar_pedido("#A-4471")</code>',
  "Lo que hay que entender aquí:",
  ["El modelo <strong>no ejecuta nada</strong>: emite un nombre y un argumento",
   "<strong>Tu código</strong> lo ejecuta — y decide si lo permite",
   "El resultado vuelve al modelo, que decide el siguiente paso",
   "Ese ida y vuelta, repetido, <strong>es un agente</strong>"],
  "Puede pedir una herramienta que <strong>no existe</strong>. Por eso el nombre se compara siempre "
  "contra una lista blanca antes de ejecutar nada. "
  "<span style=\"color:var(--c-text-dim);\">Unidad 19, donde está medido.</span>",
  "Contenido propio. " + NOTA_SALIDAS + " Es la semilla de la unidad 19 y conviene no adelantarla "
  "mas de la cuenta: aqui solo se ve UN paso, no el bucle. Lo que si hay que dejar claro es que el "
  "modelo no ejecuta — es el malentendido mas comun del tema.\n\n"
  "El fallo de herramienta inventada esta MEDIDO en el notebook 28: el agente pidio "
  "saludo[bonjour], que no existia en el registro, y solo la lista blanca evito que tumbara el "
  "proceso.")

NUEVAS['juzgar'] = caso(
  "sl-uso-juzgar", "Juzgar y Comparar",
  """Eres el evaluador. Compara las dos respuestas al mismo ticket
y responde SÓLO con JSON:

  {"gana": "A" | "B" | "empate",
   "motivo": "una frase",
   "fiel_a_la_politica": {"A": true|false, "B": true|false}}

POLÍTICA: cambio por unidad nueva sólo los primeros 30 días;
después, reparación en taller autorizado.
TICKET: licuadora comprada hace 5 meses, huele a quemado.

RESPUESTA A
Con gusto le enviamos una licuadora nueva hoy mismo.

RESPUESTA B
Su equipo sigue en garantía. Como pasaron más de 30 días,
corresponde reparación en taller autorizado.""",
  '<code>{"gana": "B", "motivo": "A ofrece un cambio que la política no permite", '
  '"fiel_a_la_politica": {"A": false, "B": true}}</code>',
  "Por qué se usa tanto:",
  ["Evalúa <strong>a escala</strong> lo que un humano no alcanza a leer",
   "Sirve para <strong>comparar dos versiones</strong> de tu prompt",
   "Da un criterio explícito, no un “se ve mejor”",
   "Es lo que automatiza <strong>RAGAS</strong> en la unidad 16"],
  "Pero <strong>el juez arrastra los mismos sesgos</strong>: tiende a premiar respuestas largas y "
  "las que se parecen a su propio estilo. Hay que calibrarlo contra juicio humano antes de "
  "confiar en él — y ese contraste está medido en la unidad 16.",
  "Contenido propio. " + NOTA_SALIDAS + " Cierra el grupo 2 y es el que mas se usa sin pensarlo: "
  "casi todo el mundo termina pidiendole a un LLM que evalue salidas de otro LLM.\n\n"
  "El sesgo de longitud no es folclore, esta documentado en la literatura de LLM-as-judge, y en la "
  "unidad 16 el curso lo toca al comparar faithfulness y answer_relevancy calculadas a mano contra "
  "las de RAGAS: coinciden en el sentido pero no en el valor, porque cada implementacion mide algo "
  "ligeramente distinto.")

# ═══════════════ localizar la seccion 12 y sus sub-slides ═══════════════
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-uso-responder' in doc:
    sys.exit("El bloque ya esta reorganizado; nada que hacer.")

ini = doc.index('<div class="slides">')
prof, secs = 0, []
for m in re.finditer(r'<section[^>]*>|</section>', doc[ini:]):
    if m.group(0).startswith('</'):
        prof -= 1
        if prof == 0: secs[-1] = (secs[-1][0], ini + m.end())
    else:
        if prof == 0: secs.append((ini + m.start(), None))
        prof += 1
A, B = secs[12]
sec = doc[A:B]

subs, prof, st = [], 0, None
for m in re.finditer(r'<section[^>]*>|</section>', sec):
    if m.group(0).startswith('</'):
        prof -= 1
        if prof == 1: subs.append((st, m.end()))
    else:
        if prof == 1: st = m.start()
        prof += 1

def por_titulo(t):
    for k, (x, y) in enumerate(subs):
        m = re.search(r'<h2>(.*?)</h2>', sec[x:y], re.S)
        if m and m.group(1).strip() == t: return k
    sys.exit("no encontre la diapositiva: " + t)

K0 = por_titulo("Para Qué se Usa un LLM en la Práctica")
K1 = por_titulo("El Patrón Detrás de las Cinco")
assert K1 == K0 + 5, "el bloque no es contiguo: %d..%d" % (K0, K1)
viejas = [sec[subs[k][0]:subs[k][1]] for k in range(K0, K1 + 1)]
portada, resumir, clasificar, extraer, corregir, patron = viejas

def sust(texto, viejo, nuevo, que):
    if viejo not in texto: sys.exit("no encontre para sustituir: " + que)
    return texto.replace(viejo, nuevo, 1)

PRE_VIEJO = '<pre style="margin:0; font-size:0.94em;">'
PRE_NUEVO = '<pre data-copiable style="margin:0; font-size:0.94em; position:relative;">'

# ─────────── portada: SVG de dos filas + lista que SI coincide con el ───────────
svg_viejo = re.search(r'<svg viewBox="0 0 760 62".*?</svg>', portada, re.S).group(0)
F1 = [("resumir", "#58C4DD"), ("clasificar", "#83C167"), ("extraer", "#FF862F"),
      ("reescribir", "#9A72AC"), ("responder", "#5CD0B3"), ("redactar", "#E48BB0"),
      ("código", "#FFFF00")]
F2 = [("enrutar", "#83C167"), ("self-query", "#FF862F"), ("reformular", "#58C4DD"),
      ("herramientas", "#9A72AC"), ("juzgar", "#E48BB0")]
pz = ['<svg viewBox="0 0 760 118" style="width:100%; max-width:760px; max-height:120px;" role="img">',
      '<text x="380" y="11" text-anchor="middle" fill="#8a86a0" font-size="10.5" '
      'font-family="Fira Code,monospace">te dan un texto y lo transforma</text>']
for i, (t, c) in enumerate(F1):
    x = 2 + i * 109
    pz.append('<rect x="%d" y="18" width="102" height="26" rx="6" fill="%s" fill-opacity="0.16" '
              'stroke="%s" stroke-width="1.2"/><text x="%d" y="35" text-anchor="middle" '
              'fill="#ece6d0" font-size="11" font-family="Lora,serif">%s</text>' % (x, c, c, x + 51, t))
pz.append('<text x="380" y="64" text-anchor="middle" fill="#FFFF00" font-size="10.5" '
          'font-family="Fira Code,monospace">decide dentro de un sistema — su salida la lee tu código</text>')
for i, (t, c) in enumerate(F2):
    x = 44 + i * 137
    pz.append('<rect x="%d" y="71" width="128" height="26" rx="6" fill="%s" fill-opacity="0.16" '
              'stroke="%s" stroke-width="1.2"/><text x="%d" y="88" text-anchor="middle" '
              'fill="#ece6d0" font-size="11" font-family="Lora,serif">%s</text>' % (x, c, c, x + 64, t))
pz.append('<text x="380" y="112" text-anchor="middle" fill="#FFFF00" font-size="11.5" '
          'font-family="Lora,serif" font-style="italic">las doce son la misma operación: '
          'texto entra, texto sale</text></svg>')
portada = sust(portada, svg_viejo, "".join(pz), "SVG de la portada")

portada = sust(portada,
  "      Casi todo lo que se le pide a un LLM en producción cae en cinco familias.\n"
  "      Ninguna requiere entrenar nada: solo <strong>escribir bien la instrucción</strong>.",
  "      Casi todo lo que se le pide a un LLM en producción cae en <strong>doce usos</strong>\n"
  "      repartidos en dos grupos. Ninguno requiere entrenar nada: sólo\n"
  "      <strong>escribir bien la instrucción</strong>.", "párrafo de las cinco familias")

taxo_vieja = re.search(r'<div class="taxonomy".*?</div>\s*</div>\s*<p class="fragment',
                       portada, re.S).group(0)
G1 = [("Resumir", "blue", "texto largo → texto corto"),
      ("Clasificar", "green", "texto → una etiqueta de un conjunto cerrado"),
      ("Extraer", "orange", "texto libre → JSON"),
      ("Corregir y reescribir", "purple", "mismo contenido, otro registro"),
      ("Responder", "teal", "pregunta + documento → respuesta"),
      ("Redactar", "pink", "puntos clave → texto completo"),
      ("Generar código", "yellow", "descripción → función que corre")]
G2 = [("Enrutar", "green", "a qué rama del sistema va esto", "18"),
      ("Self-query", "orange", "pregunta → consulta + filtros", "10"),
      ("Reformular", "blue", "arreglar la consulta antes de buscar", "14"),
      ("Elegir herramienta", "purple", "qué función invocar y con qué", "19"),
      ("Juzgar", "pink", "comparar dos salidas y dar veredicto", "16")]
c1 = "".join('        <div style="margin:0.16em 0;"><strong style="color: var(--c-%s);">%s</strong>'
             ' <span style="color: var(--c-text-dim);">— %s</span></div>\n' % (c, n, d)
             for n, c, d in G1)
c2 = "".join('        <div style="margin:0.16em 0;"><strong style="color: var(--c-%s);">%s</strong>'
             ' <span style="color: var(--c-text-dim);">— %s</span>'
             ' <span style="color: var(--c-yellow); font-size:0.85em;">u.%s</span></div>\n'
             % (c, n, d, u) for n, c, d, u in G2)
taxo_nueva = ('<div class="columns" style="font-size: 0.35em; align-items: flex-start; '
              'margin-top:0.25em;">\n'
              '      <div class="col" style="text-align:left;">\n'
              '        <p style="margin:0 0 0.1em 0;"><strong>1 · te dan un texto</strong></p>\n'
              + c1 +
              '      </div>\n      <div class="col" style="text-align:left;">\n'
              '        <p style="margin:0 0 0.1em 0;"><strong>2 · es una pieza del sistema</strong></p>\n'
              + c2 +
              '      </div>\n    </div>\n    <p class="fragment')
portada = sust(portada, taxo_vieja, taxo_nueva, "lista de familias")

portada = sust(portada,
  "      Fíjate en algo: <strong>las cinco son transformaciones de texto en texto</strong>.\n"
  "      Ahí está la razón de que un solo modelo las haga todas.",
  "      Fíjate en algo: <strong>todas son transformaciones de texto en texto</strong>. Por eso\n"
  "      un solo modelo las hace todas, y la diferencia entre un uso y otro es "
  "<strong>la instrucción</strong>.", "cierre de la portada")
portada = sust(portada, '<aside class="notes">Contenido propio. Estas cinco familias',
  '<aside class="notes">Contenido propio. MANTENIMIENTO: hasta agosto de 2026 esta diapositiva se '
  'contradecia — el SVG anunciaba cinco familias (incluida "responder", que no tenia diapositiva) y '
  'la lista de abajo enumeraba otras cinco. Ahora el SVG, la lista y las diapositivas que siguen '
  'dicen lo mismo: si se agrega un uso, hay que tocar los tres. Estas familias',
  "notas de la portada")

# ─────────── los cuatro casos que ya existian ───────────
resumir = sust(resumir, PRE_VIEJO, PRE_NUEVO, "pre de Resumir")

clasificar = sust(clasificar, "TICKET: {texto del ticket}\nCATEGORÍA:",
  "TICKET:\n"
  "Buenas tardes, compré una licuadora el 12\n"
  "de marzo con el pedido #A-4471 y hace un\n"
  "ruido muy fuerte y huele a quemado.\n"
  "Todavía está en garantía.\n\n"
  "CATEGORÍA:", "hueco del ticket en Clasificar")
clasificar = sust(clasificar, PRE_VIEJO, PRE_NUEVO, "pre de Clasificar")
clasificar = sust(clasificar,
  'conecta directo con el slide "La Idea Central: es un Clasificador" de esta misma unidad',
  'conecta directo con el slide "La Idea Central: es un Clasificador", que ahora viene DESPUES en '
  'esta misma unidad porque el bloque de casos de uso se subio antes de la maquinaria: conviene '
  'anunciarlo aqui y retomarlo alli', "referencia adelantada de Clasificar")

extraer = sust(extraer, PRE_VIEJO, PRE_NUEVO, "pre de Extraer")
extraer = sust(extraer,
  'sin ellas el modelo rellena huecos con datos plausibles, que es la alucinacion mas peligrosa aqui',
  'sin ellas el modelo rellena huecos con datos plausibles. Ese invento tiene nombre —alucinacion— y '
  'se estudia mas adelante en esta misma unidad; aqui basta con senalar que es el fallo mas peligroso',
  "referencia adelantada de Extraer")

PROMPT_CORREGIR = (
 '    <pre data-copiable style="margin:0.25em auto; font-size:0.3em; max-width:88%; '
 'position:relative;"><code class="language-text">'
 'Reescribe el mensaje del cliente en TRES versiones, sin cambiar el significado:\n'
 '  1. corregido  — sólo ortografía y puntuación, mismo tono\n'
 '  2. formal     — para un correo de la empresa\n'
 '  3. cercano    — para un chat de soporte\n\n'
 'MENSAJE\n'
 'aser el pedido fue muy dificil, la pagina nunca cargo y ademas nadie contesto el telefono'
 '</code></pre>\n')
corregir = sust(corregir, '    <div class="columns" style="font-size: 0.36em;">',
                PROMPT_CORREGIR + '    <div class="columns" style="font-size: 0.34em;">',
                "columnas de Corregir")
corregir = sust(corregir, 'max-height:116px;', 'max-height:88px;', "alto del SVG de Corregir")

# ─────────── el patron, sin numero fijo en el titulo ───────────
patron = sust(patron, '<h2>El Patrón Detrás de las Cinco</h2>',
              '<h2>El Patrón Detrás de Todas</h2>', "título del patrón")
patron = sust(patron, '● Antes, cada una de las cinco tareas exigía',
              '● Antes, cada una de estas tareas exigía', "cuerpo del patrón (1)")
patron = sust(patron, '● Hoy es <strong>el mismo modelo</strong> con cinco instrucciones distintas.',
              '● Hoy es <strong>el mismo modelo</strong> con doce instrucciones distintas.',
              "cuerpo del patrón (2)")
patron = sust(patron, 'Este slide es la bisagra hacia el bloque de prompting',
              'Se retitulo en agosto de 2026 ("de las Cinco" -> "de Todas") para no tener que '
              'tocarlo cada vez que se agrega un caso de uso. Este slide es la bisagra hacia el '
              'bloque de prompting, que ahora vive mas adelante en la unidad', "notas del patrón")

# ─────────── ensamblar y mover ───────────
BLOQUE = "\n".join([portada, resumir, clasificar, extraer, corregir,
                    NUEVAS['responder'], NUEVAS['redactar'], NUEVAS['codigo'],
                    NUEVAS['transicion'],
                    NUEVAS['router'], NUEVAS['selfquery'], NUEVAS['reescribir'],
                    NUEVAS['herramientas'], NUEVAS['juzgar'], patron])

sec_sin = sec[:subs[K0][0]] + sec[subs[K1][1]:]
anc = sec_sin.index('id="sl-cat-chicos"')
fin = sec_sin.index('</section>', anc) + len('</section>')
sec_nueva = sec_sin[:fin] + "\n" + BLOQUE + "\n" + sec_sin[fin:]

# costura: zero-shot perdio su antecedente inmediato al irse el patron arriba
sec_nueva = sust(sec_nueva,
  "          <strong>Cero ejemplos.</strong> Solo la instrucción y la entrada.",
  "          Volvemos al patrón del principio de la unidad —<strong>instrucción + entrada</strong>—\n"
  "          para mirar ahora la instrucción de cerca. <strong>Cero ejemplos:</strong>\n"
  "          sólo la instrucción y la entrada.",
  "costura de zero-shot")

doc = doc[:A] + sec_nueva + doc[B:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("bloque movido y ampliado: %d existentes + %d nuevas = %d diapositivas"
      % (len(viejas), len(NUEVAS), len(viejas) + len(NUEVAS)))
