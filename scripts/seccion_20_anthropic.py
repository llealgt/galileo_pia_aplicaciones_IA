# -*- coding: utf-8 -*-
'''Inserta la SECCION 20 — Anexo Opcional: Agentes con Anthropic.

Es un anexo OPCIONAL: todo el curso corre con modelos locales y sin llaves, y esta
seccion es el camino comercial. Va como seccion top-level (no como sub-slides de la
19) precisamente para que se pueda saltar con una sola flecha derecha.

Todo el contenido tecnico esta verificado contra la documentacion oficial en agosto
de 2026 (los enlaces estan en la ultima diapositiva). Nada de esto se ejecuto en el
curso porque requiere una llave de pago: por eso NO hay widget con trazas, que
serian inventadas, y por eso la ultima diapositiva lo dice explicitamente.

Idempotente por el marcador SECCION 20.
'''
import io, re, sys

RUTA = "../index.html"
MARCA = "<!-- ============================================================\n     SECCION 20 — Anexo Opcional: Agentes con Anthropic"

S = []
def slide(html): S.append(html.rstrip() + "\n")

# ─────────────────────────── 0. portada ───────────────────────────
slide('''
  <section data-transition="fade" id="sl-20-portada">
    <p style="font-size: 0.5em; color: var(--c-text-dim); letter-spacing: 0.18em; margin-bottom: 0.1em;">ANEXO OPCIONAL</p>
    <h1 style="font-size: 1.35em;">Agentes con Anthropic</h1>
    <h3 style="color: var(--c-blue); margin-top: 0.1em;">SDK · MCP · Agent SDK</h3>
    <p style="font-size: 0.44em; color: var(--c-text-dim); margin-top: 0.7em; max-width: 78%; margin-left:auto; margin-right:auto;">
      Todo el curso corre con <strong>modelos locales y sin llaves</strong>. Este anexo es el otro
      camino: el comercial. <strong>Cuesta dinero</strong> y por eso es opcional — pero es el que te
      vas a encontrar en un trabajo.
    </p>
    <aside class="notes">
      Anexo opcional, se puede saltar entero con una flecha derecha desde la portada de la 19.

      Por que existe: el curso entero esta construido sobre modelos locales para que nadie tenga que
      pagar. Eso es deliberado y no cambia. Pero el estudiante que salga a trabajar va a encontrarse
      con el SDK comercial, con MCP en todas partes y con el Agent SDK, y merece saber como se ven.

      IMPORTANTE al darlo: nada de este codigo se ejecuto en el curso, porque necesita una llave de
      pago. Todo esta verificado contra la documentacion oficial (agosto 2026) pero NO esta medido por
      nosotros, y eso rompe la regla que seguimos en el resto del deck. Decirlo en voz alta: es la
      diferencia entre "lo medimos" y "lo leimos en la documentacion".
    </aside>
  </section>''')

# ─────────────────────── 1. escalera de abstraccion ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-escalera">
    <h2>Cuatro Alturas, un Mismo Bucle</h2>
    <p style="font-size: 0.42em; margin-bottom: 0.25em;">
      Lo que cambia de un escalón al siguiente no es lo que hace el agente:
      es <strong>quién escribe el bucle</strong> y <strong>dónde corre</strong>.
    </p>
    <div style="text-align:center; margin:0.2em 0;">
      <svg viewBox="0 0 760 168" style="width:100%; max-width:760px; max-height:172px;" role="img">
<rect x="8" y="96" width="172" height="52" rx="8" fill="#58C4DD" fill-opacity="0.14" stroke="#58C4DD"/><text x="94" y="116" text-anchor="middle" fill="#58C4DD" font-size="12.5" font-family="Fira Code,monospace">Messages API</text><text x="94" y="134" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">tú escribes el bucle</text><rect x="196" y="74" width="172" height="52" rx="8" fill="#83C167" fill-opacity="0.14" stroke="#83C167"/><text x="282" y="94" text-anchor="middle" fill="#83C167" font-size="12.5" font-family="Fira Code,monospace">Tool Runner</text><text x="282" y="112" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">el SDK lo escribe</text><rect x="384" y="52" width="172" height="52" rx="8" fill="#FF862F" fill-opacity="0.14" stroke="#FF862F"/><text x="470" y="72" text-anchor="middle" fill="#FF862F" font-size="12.5" font-family="Fira Code,monospace">Agent SDK</text><text x="470" y="90" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">Claude Code como librería</text><rect x="572" y="30" width="180" height="52" rx="8" fill="#9A72AC" fill-opacity="0.14" stroke="#9A72AC"/><text x="662" y="50" text-anchor="middle" fill="#9A72AC" font-size="12.5" font-family="Fira Code,monospace">Managed Agents</text><text x="662" y="68" text-anchor="middle" fill="#ece6d0" font-size="11" font-family="Lora,serif">Anthropic lo corre</text><line x1="8" y1="158" x2="752" y2="158" stroke="#FFFF00" stroke-width="1.6" stroke-dasharray="5 4"/><text x="380" y="20" text-anchor="middle" fill="#8a86a0" font-size="11" font-family="Lora,serif" font-style="italic">más control  ←—————————————————————————→  menos código</text><text x="380" y="152" text-anchor="middle" fill="#FFFF00" font-size="11.5" font-family="Lora,serif">MCP cruza los cuatro: es de dónde salen las herramientas</text>
      </svg>
    </div>
    <p style="font-size: 0.42em; margin-top: 0.15em;">
      El bucle es el mismo que escribiste a mano en la unidad 19. Lo que sube en la escalera es
      <strong>cuánto código ajeno aceptas</strong> a cambio de escribir menos del tuyo.
    </p>
    <aside class="notes">
      La tabla de la documentacion del Agent SDK compara exactamente estas cuatro opciones. La escalera
      es una lectura propia de esa tabla.

      El punto pedagogico: el estudiante ya escribio el escalon de mas abajo en el notebook 28, con un
      modelo local. Todo lo demas de este anexo son formas de no escribirlo. Eso es justo el mismo
      argumento de la unidad 18 con LangChain, y conviene decirlo asi: primero a mano, despues el
      framework, para que el framework se entienda en vez de creerse.

      MCP va debajo de los cuatro y no dentro de uno: es el protocolo del que salen las herramientas,
      sin importar quien corra el bucle.
    </aside>
  </section>''')

# ─────────────────────── 2. la primera llamada ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-primera">
    <h2>La Primera Llamada</h2>
    <pre style="font-size: 0.38em; max-width: 88%; margin: 0.3em auto;"><code class="language-python">pip install anthropic

import anthropic
client = anthropic.Anthropic()          # lee ANTHROPIC_API_KEY del entorno

respuesta = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Resume esto en una línea: ..."}],
)
print(respuesta.content[0].text)</code></pre>
    <p style="font-size: 0.42em; margin-top: 0.3em;">
      <code>messages</code> es una <strong>lista que tú mantienes</strong>. La API no recuerda nada
      entre llamadas: la "conversación" es que le vuelvas a mandar todo.
    </p>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.2em; padding: 0.35em; background: rgba(255,255,0,0.07);">
      Es exactamente el <code>historial</code> del notebook 16, con otro nombre. Y es también
      la razón de que el costo crezca con la conversación: <strong>cada turno reenvía los anteriores</strong>.
    </p>
    <aside class="notes">
      Verificado contra la documentacion oficial de la Messages API (agosto 2026). La llave se lee de
      la variable de entorno ANTHROPIC_API_KEY: nunca escrita en una celda, igual que en el notebook 16.

      El detalle que sorprende a quien viene de un chat: la API es SIN ESTADO. Todo lo que parece
      memoria es la lista de mensajes que el cliente reenvia. Enlazar con la diapositiva de memoria
      conversacional de la unidad 18 y con el costo cuadratico de la conversacion.
    </aside>
  </section>''')

# ─────────────────────── 3. definir una herramienta ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-herramienta">
    <h2>Una Herramienta es un Esquema</h2>
    <div class="columns" style="align-items: flex-start;">
      <div class="col-55">
        <pre style="font-size: 0.335em; margin: 0;"><code class="language-python">tools = [{
    "name": "get_weather",
    "description": "Get the current weather "
                   "for a given location.",
    "input_schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City and state, "
                               "e.g. San Francisco, CA"
            }
        },
        "required": ["location"],
    },
}]</code></pre>
      </div>
      <div class="col-40">
        <p style="font-size: 0.4em; text-align:left; margin:0.1em 0;">
          El modelo <strong>no ve tu función</strong>. Ve tres cosas: el nombre, la descripción y el
          esquema JSON de los argumentos.</p>
        <p style="font-size: 0.4em; text-align:left; margin:0.35em 0;">
          Por eso <strong>la descripción es la interfaz</strong>. Una descripción vaga es un bug, no
          un detalle de estilo.</p>
        <p style="font-size: 0.4em; text-align:left; margin:0.35em 0;">
          Es la misma definición de la unidad 19 —<em>una función más una descripción</em>— solo que
          aquí el formato lo fija la API.</p>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; text-align:center; margin-top: 0.25em;">
      Con <code>strict: true</code> la API <strong>garantiza</strong> que los argumentos cumplan el
      esquema. Sin él, valida tú.
    </p>
    <aside class="notes">
      Esquema copiado literalmente del ejemplo get_weather de la documentacion de tool use, para que
      el estudiante lo reconozca cuando lo lea alli.

      El punto que hay que insistir: la descripcion es texto que entra en el prompt y es lo unico que
      el modelo tiene para decidir. En la unidad 19 el estudiante ya midio que cambiar la descripcion
      no arreglaba el enrutamiento con un modelo de 1.5B; con un modelo grande si importa mucho.

      strict: true es reciente y resuelve una clase entera de bugs — argumentos que no cumplen el
      esquema — pero no resuelve el otro: que llame la herramienta equivocada.
    </aside>
  </section>''')

# ─────────────────────── 4. el viaje de ida y vuelta ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-roundtrip">
    <h2>El Viaje de Ida y Vuelta</h2>
    <div style="text-align:center; margin:0.25em 0;">
      <svg viewBox="0 0 760 150" style="width:100%; max-width:760px; max-height:154px;" role="img">
<rect x="6" y="52" width="120" height="44" rx="7" fill="#ece6d0" fill-opacity="0.07" stroke="#8a86a0"/><text x="66" y="70" text-anchor="middle" fill="#ece6d0" font-size="11.5" font-family="Lora,serif">tu pregunta</text><text x="66" y="86" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Fira Code,monospace">+ tools=[...]</text><line x1="126" y1="74" x2="176" y2="74" stroke="#8a86a0" stroke-width="1.4"/><polygon points="176,74 168,70 168,78" fill="#8a86a0"/><rect x="178" y="46" width="132" height="56" rx="7" fill="#58C4DD" fill-opacity="0.14" stroke="#58C4DD"/><text x="244" y="64" text-anchor="middle" fill="#58C4DD" font-size="11.5" font-family="Fira Code,monospace">Claude</text><text x="244" y="80" text-anchor="middle" fill="#ece6d0" font-size="10" font-family="Fira Code,monospace">stop_reason:</text><text x="244" y="93" text-anchor="middle" fill="#FFFF00" font-size="10.5" font-family="Fira Code,monospace">"tool_use"</text><line x1="310" y1="74" x2="360" y2="74" stroke="#FFFF00" stroke-width="1.4"/><polygon points="360,74 352,70 352,78" fill="#FFFF00"/><text x="335" y="64" text-anchor="middle" fill="#FFFF00" font-size="9.5" font-family="Fira Code,monospace">tool_use</text><rect x="362" y="46" width="132" height="56" rx="7" fill="#83C167" fill-opacity="0.14" stroke="#83C167"/><text x="428" y="68" text-anchor="middle" fill="#83C167" font-size="11.5" font-family="Fira Code,monospace">TU CÓDIGO</text><text x="428" y="86" text-anchor="middle" fill="#ece6d0" font-size="10" font-family="Lora,serif">ejecuta la función</text><path d="M 428 102 L 428 128 L 244 128 L 244 104" fill="none" stroke="#83C167" stroke-width="1.4"/><polygon points="244,104 240,112 248,112" fill="#83C167"/><text x="336" y="142" text-anchor="middle" fill="#83C167" font-size="9.5" font-family="Fira Code,monospace">tool_result</text><line x1="310" y1="30" x2="600" y2="30" stroke="#8a86a0" stroke-width="1" stroke-dasharray="3 3"/><rect x="602" y="46" width="152" height="56" rx="7" fill="#ece6d0" fill-opacity="0.07" stroke="#8a86a0"/><text x="678" y="68" text-anchor="middle" fill="#ece6d0" font-size="11.5" font-family="Lora,serif">la respuesta final</text><text x="678" y="86" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Fira Code,monospace">stop_reason: "end_turn"</text><line x1="494" y1="60" x2="598" y2="60" stroke="#8a86a0" stroke-width="1.2" stroke-dasharray="4 3"/><text x="546" y="52" text-anchor="middle" fill="#8a86a0" font-size="9" font-family="Lora,serif">(vuelta 2)</text>
      </svg>
    </div>
    <p style="font-size: 0.43em;">
      <strong>El modelo nunca ejecuta nada.</strong> Pide, y espera. Quien corre la función —y quien
      decide si dejarla correr— es tu proceso.
    </p>
    <blockquote class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.2em;">
      🎯 El campo que gobierna todo es <code>stop_reason</code>. Si vale <code>"tool_use"</code>,
      hay trabajo para ti; si vale <code>"end_turn"</code>, el agente terminó.
      <strong>Ese if es el bucle entero.</strong>
    </blockquote>
    <aside class="notes">
      Diagrama propio a partir del ejemplo de round trip de la documentacion de tool use.

      Este es EL concepto del anexo y conviene detenerse: mucha gente cree que "el modelo ejecuta
      herramientas". No. El modelo emite un bloque tool_use, que es texto estructurado, y se detiene.
      La ejecucion es tuya, el riesgo es tuyo y el permiso es tuyo.

      Es lo mismo que el estudiante vio en la unidad 19 con el regex sobre "Accion: nombre[arg]". La
      unica diferencia es que aqui el formato lo garantiza la API en vez de un prompt de sistema.
    </aside>
  </section>''')

# ─────────────────────── 5. el bucle agentico ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-bucle">
    <h2>El Bucle Agéntico, en Código</h2>
    <p style="font-size: 0.4em; margin-bottom: 0.15em;">
      Las <strong>mismas tres reglas</strong> de la unidad 19, ahora sobre bloques tipados
      en vez de una expresión regular.
    </p>
    <pre style="font-size: 0.315em; max-width: 94%; margin: 0.2em auto;"><code class="language-python">mensajes = [{"role": "user", "content": pregunta}]

for paso in range(MAX_PASOS):                                    # 3) tope de pasos
    r = client.messages.create(model="claude-sonnet-5", max_tokens=1024,
                               tools=ESQUEMAS, messages=mensajes)
    mensajes.append({"role": "assistant", "content": r.content})

    if r.stop_reason != "tool_use":                              # no pidió nada: terminó
        return next(b.text for b in r.content if b.type == "text")

    resultados = []
    for b in [b for b in r.content if b.type == "tool_use"]:
        if b.name not in REGISTRO:                               # 1) lista blanca
            salida, malo = f"ERROR: '{b.name}' no existe", True
        else:
            try:
                salida, malo = REGISTRO[b.name](**b.input), False
            except Exception as e:
                salida, malo = f"ERROR: {e}", True               # 2) el error VUELVE
        resultados.append({"type": "tool_result", "tool_use_id": b.id,
                           "content": str(salida), "is_error": malo})
    mensajes.append({"role": "user", "content": resultados})     # y vuelve arriba</code></pre>
    <aside class="notes">
      Codigo propio, escrito siguiendo la documentacion de handle-tool-calls. NO se ejecuto: necesita
      llave de pago. Es la traduccion directa del agente del notebook 28.

      Proyectarlo AL LADO del de la unidad 19 si se puede: la estructura es identica y los tres
      comentarios numerados son las tres mismas reglas. Lo que desaparecio es el re.search; lo que
      aparecio es el bucle interno sobre varios bloques tool_use, porque la API puede pedir varias
      herramientas en el mismo turno (paralelismo) y el ReAct a mano no.

      is_error=True es la version de la API de la regla 2: el error viaja como resultado de
      herramienta, no como excepcion, y el modelo lo lee y se corrige.

      El "for paso in range" con return dentro: si se agota el rango, el agente se quedo sin pasos y
      hay que decidir que hacer. En produccion eso se registra, no se ignora.
    </aside>
  </section>''')

# ─────────────────────── 6. tool runner ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-runner">
    <h2>Lo Mismo, sin Escribir el Bucle</h2>
    <pre style="font-size: 0.33em; max-width: 90%; margin: 0.2em auto;"><code class="language-python">from anthropic import Anthropic, beta_tool

@beta_tool
def get_weather(location: str, unit: str = "fahrenheit") -> str:
    """Get the current weather in a given location.

    Args:
        location: The city and state, e.g. San Francisco, CA
        unit: Temperature unit, either 'celsius' or 'fahrenheit'
    """
    return json.dumps({"temperature": "20°C", "condition": "Sunny"})

runner = client.beta.messages.tool_runner(
    model="claude-sonnet-5", max_tokens=1024, tools=[get_weather],
    messages=[{"role": "user", "content": "¿Qué tiempo hace en París?"}],
)
final = runner.until_done()</code></pre>
    <p style="font-size: 0.4em; margin-top: 0.25em;">
      El decorador <strong>deriva el esquema JSON</strong> de las anotaciones de tipo y del docstring.
      Las veinte líneas de la diapositiva anterior se vuelven una.
    </p>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.15em; padding: 0.35em; background: rgba(252,98,85,0.09);">
      Lo que pierdes es <strong>el punto donde intervenir</strong>: aprobación humana, bitácora,
      ejecución condicional. La propia documentación te manda al bucle manual cuando necesitas eso.
    </p>
    <aside class="notes">
      Ejemplo copiado de la documentacion del tool runner (esta en beta). El docstring con la seccion
      Args no es decorativo: de ahi sale la descripcion de cada parametro en el esquema.

      Este es el mismo trato que se discutio en la unidad 18 con LangChain: menos codigo a cambio de
      menos visibilidad. Y la respuesta es la misma: usalo cuando el bucle no sea lo interesante del
      problema; escribelo a mano cuando si lo sea, o cuando tengas que meter una aprobacion humana en
      medio, que en un sistema real es casi siempre.
    </aside>
  </section>''')

# ─────────────────────── 7. nativo contra react ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-vs">
    <h2>Qué Cambia Respecto al ReAct a Mano</h2>
    <table style="font-size: 0.375em; width: 100%; max-width: 830px; margin: 0.25em auto;">
      <tr><th style="text-align:left;"></th><th>ReAct a mano (unidad 19)</th><th>tool use nativo</th></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">quién detecta la acción</td>
        <td><code>re.search</code> sobre el texto</td><td><code>stop_reason == "tool_use"</code></td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">formato</td>
        <td>convención de tu prompt</td><td>bloques tipados de la API</td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">varias herramientas por turno</td>
        <td style="color:var(--c-red);">✘</td><td style="color:var(--c-green);">✔ en paralelo</td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">herramienta inventada</td>
        <td>pasa — filtra tú</td><td>menos, pero <strong>filtra igual</strong></td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">modelo pequeño</td>
        <td style="color:var(--c-green);">gana (medido)</td><td style="color:var(--c-red);">pierde (medido)</td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">costo</td>
        <td>tu GPU</td><td>por token — y <code>tools</code> paga aparte</td></tr>
    </table>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.25em;">
      Ese último renglón no es retórico: solo <strong>activar</strong> herramientas añade unos
      <strong>286 tokens</strong> de prompt de sistema con Opus 5, más el esquema de cada herramienta,
      <strong>en cada llamada del bucle</strong>.
    </p>
    <aside class="notes">
      La fila del modelo pequeno es lo medido en el notebook 28 y ya se vio en la unidad 19; el resto
      sale de la documentacion.

      Los 286 tokens son el dato publicado para Opus 5 con tool_choice auto (406 si se fuerza la
      llamada). Es un numero de la documentacion, no medido por nosotros — decirlo asi.

      La leccion de costo, que es la que se olvida: un agente de 6 pasos paga el bloque de
      herramientas SEIS veces, mas toda la conversacion acumulada cada vez. El costo de un agente no
      es lineal en los pasos, y ese es el argumento real de la ultima diapositiva de la unidad 19
      ("cuando un agente NO es la respuesta").
    </aside>
  </section>''')

# ─────────────────────── 8. MCP: el problema M×N ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-mcp-mxn">
    <h2>MCP: de M×N a M+N</h2>
    <div style="text-align:center; margin:0.25em 0;">
      <svg viewBox="0 0 760 156" style="width:100%; max-width:760px; max-height:158px;" role="img">
<text x="176" y="16" text-anchor="middle" fill="#FC6255" font-size="12" font-family="Fira Code,monospace">sin MCP: cada par, una integración</text><circle cx="66" cy="46" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><circle cx="66" cy="86" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><circle cx="66" cy="126" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><circle cx="286" cy="46" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><circle cx="286" cy="86" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><circle cx="286" cy="126" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><g stroke="#FC6255" stroke-width="0.9" stroke-opacity="0.55"><line x1="78" y1="46" x2="274" y2="46"/><line x1="78" y1="46" x2="274" y2="86"/><line x1="78" y1="46" x2="274" y2="126"/><line x1="78" y1="86" x2="274" y2="46"/><line x1="78" y1="86" x2="274" y2="86"/><line x1="78" y1="86" x2="274" y2="126"/><line x1="78" y1="126" x2="274" y2="46"/><line x1="78" y1="126" x2="274" y2="86"/><line x1="78" y1="126" x2="274" y2="126"/></g><text x="176" y="150" text-anchor="middle" fill="#FC6255" font-size="13" font-family="Fira Code,monospace">M × N = 9</text><line x1="380" y1="24" x2="380" y2="140" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/><text x="584" y="16" text-anchor="middle" fill="#83C167" font-size="12" font-family="Fira Code,monospace">con MCP: cada uno habla el protocolo</text><circle cx="464" cy="46" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><circle cx="464" cy="86" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><circle cx="464" cy="126" r="12" fill="#58C4DD" fill-opacity="0.3" stroke="#58C4DD"/><rect x="546" y="62" width="76" height="48" rx="8" fill="#FFFF00" fill-opacity="0.13" stroke="#FFFF00"/><text x="584" y="84" text-anchor="middle" fill="#FFFF00" font-size="12" font-family="Fira Code,monospace">MCP</text><text x="584" y="99" text-anchor="middle" fill="#8a86a0" font-size="9" font-family="Fira Code,monospace">JSON-RPC 2.0</text><circle cx="706" cy="46" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><circle cx="706" cy="86" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><circle cx="706" cy="126" r="12" fill="#FF862F" fill-opacity="0.3" stroke="#FF862F"/><g stroke="#83C167" stroke-width="1.1"><line x1="476" y1="46" x2="546" y2="72"/><line x1="476" y1="86" x2="546" y2="86"/><line x1="476" y1="126" x2="546" y2="100"/><line x1="622" y1="72" x2="694" y2="46"/><line x1="622" y1="86" x2="694" y2="86"/><line x1="622" y1="100" x2="694" y2="126"/></g><text x="584" y="150" text-anchor="middle" fill="#83C167" font-size="13" font-family="Fira Code,monospace">M + N = 6</text>
      </svg>
    </div>
    <p style="font-size: 0.42em;">
      MCP es un <strong>protocolo abierto</strong>, no un producto de Anthropic: lo publicaron ellos
      y hoy lo hablan también los clientes de otros proveedores. La documentación oficial lo llama
      <em>"un puerto USB-C para aplicaciones de IA"</em>.
    </p>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.15em;">
      Lo que compras con eso: el servidor que escribes <strong>una vez</strong> sirve a tu agente, a
      Claude Code, al escritorio y al cliente del vecino.
    </p>
    <aside class="notes">
      La cita del USB-C es literal de modelcontextprotocol.io. El diagrama es propio.

      El numero 9 contra 6 es solo el ejemplo de 3x3; el argumento se ve mejor con numeros grandes:
      con 10 aplicaciones y 20 servicios son 200 integraciones contra 30.

      Dato para la clase: MCP salio de Anthropic pero es abierto y lo adoptaron OpenAI, Google y
      Microsoft, y editores como VS Code y Cursor. Por eso esta en el anexo de Anthropic pero NO es
      exclusivo de Anthropic, y conviene decirlo para que nadie se lleve la idea contraria.
    </aside>
  </section>''')

# ─────────────────────── 9. las tres primitivas ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-mcp-prim">
    <h2>Lo que Expone un Servidor MCP</h2>
    <div class="roadmap" style="flex-direction: column; align-items: stretch; text-align:left; font-size: 0.46em; margin-top: 0.2em;">
      <div class="step fragment fade-up" style="text-align:left;"><strong style="color: var(--c-blue);">tools</strong>
        — funciones que el modelo puede invocar. <em>Las controla el modelo</em>: él decide cuándo.</div>
      <div class="step fragment fade-up" style="text-align:left;"><strong style="color: var(--c-green);">resources</strong>
        — datos que se pueden leer, identificados por URI. <em>Los controla la aplicación</em>:
        tú decides qué entra en el contexto.</div>
      <div class="step fragment fade-up" style="text-align:left;"><strong style="color: var(--c-orange);">prompts</strong>
        — plantillas reutilizables que publica el servidor. <em>Las elige el usuario</em>.</div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.3em;">
      Dos transportes: <code>stdio</code> para un servidor local en tu máquina, y
      <strong>Streamable HTTP</strong> para uno remoto. Debajo, <code>JSON-RPC 2.0</code> en los dos casos.
    </p>
    <blockquote class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.2em;">
      🎯 Quién controla cada primitiva no es trivia: es el <strong>modelo de permisos</strong>.
      Las herramientas las dispara el modelo — y por eso son las que hay que vigilar.
    </blockquote>
    <aside class="notes">
      Las tres primitivas y el reparto de control (model-controlled / application-controlled /
      user-controlled) son de la especificacion de MCP.

      El transporte importa en la practica: un servidor stdio corre como subproceso en la maquina del
      usuario y no se puede conectar desde la API remota; uno HTTP si. Eso condiciona el diseno y es la
      limitacion de la diapositiva siguiente.

      La ultima frase enlaza con las tres reglas de la unidad 19: la lista blanca sigue siendo tuya
      aunque las herramientas vengan de un servidor ajeno. Un servidor MCP de terceros es codigo de
      terceros con acceso a tus datos.
    </aside>
  </section>''')

# ─────────────────────── 10. MCP desde la API ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-mcp-api">
    <h2>Conectar un Servidor MCP</h2>
    <pre style="font-size: 0.33em; max-width: 90%; margin: 0.2em auto;"><code class="language-python">respuesta = client.beta.messages.create(
    model="claude-sonnet-5",
    max_tokens=1000,
    messages=[{"role": "user", "content": "¿Qué herramientas tienes?"}],
    mcp_servers=[{
        "type": "url",
        "url": "https://example-server.modelcontextprotocol.io/sse",
        "name": "example-mcp",
        "authorization_token": "YOUR_TOKEN",
    }],
    tools=[{"type": "mcp_toolset", "mcp_server_name": "example-mcp"}],
    betas=["mcp-client-2025-11-20"],
)</code></pre>
    <p style="font-size: 0.4em; margin-top: 0.25em;">
      Sin escribir un cliente MCP: la API se conecta al servidor por ti. En el <code>mcp_toolset</code>
      se declara qué herramientas quedan habilitadas — <strong>lista blanca o lista negra</strong>,
      igual que la regla 1 de la unidad 19, pero declarativa.
    </p>
    <p class="fragment fade-up" style="font-size: 0.39em; margin-top: 0.15em; padding: 0.35em; background: rgba(252,98,85,0.09);">
      Tres límites que hay que saber: está en <strong>beta</strong>, solo soporta
      <strong>tools</strong> (ni resources ni prompts), y el servidor tiene que ser
      <strong>público por HTTPS</strong> — un servidor local por <code>stdio</code> no se conecta así.
    </p>
    <aside class="notes">
      Codigo de la documentacion del MCP connector, version del beta header mcp-client-2025-11-20 (la
      anterior, 2025-04-04, esta deprecada y ponia la configuracion de herramientas dentro del servidor).

      El patron de lista blanca se hace con default_config.enabled=false y luego habilitando tool por
      tool en configs. El de lista negra, al reves. Para un asistente de solo lectura, deshabilitar
      explicitamente las herramientas destructivas es lo recomendado por la propia documentacion.

      Si hace falta stdio, resources o prompts, el camino es un cliente MCP propio con los helpers de
      anthropic[mcp], o directamente el Agent SDK, que trae cliente MCP completo.
    </aside>
  </section>''')

# ─────────────────────── 11. Agent SDK ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-agentsdk">
    <h2>Agent SDK: Claude Code como Librería</h2>
    <p style="font-size: 0.42em; margin-bottom: 0.2em;">
      Las mismas herramientas, el mismo bucle y la misma gestión de contexto que mueven a Claude Code,
      pero programables. <strong>Se llamaba <em>Claude Code SDK</em></strong> y se renombró en
      septiembre de 2025, porque servía para mucho más que código.
    </p>
    <div class="columns" style="align-items: flex-start; margin-top: 0.1em;">
      <div class="col-45">
        <pre style="font-size: 0.32em; margin: 0;"><code class="language-bash">pip install claude-agent-sdk
# Python 3.10+

npm install @anthropic-ai/claude-agent-sdk</code></pre>
      </div>
      <div class="col-50">
        <pre style="font-size: 0.32em; margin: 0;"><code class="language-python">import anyio
from claude_agent_sdk import query

async def main():
    async for message in query(
            prompt="What is 2 + 2?"):
        print(message)

anyio.run(main)</code></pre>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.3em;">
      Nota de migración: el paquete viejo era <code>@anthropic-ai/claude-code</code>. Si encuentras un
      tutorial con ese nombre, está desactualizado — <strong>y en este tema eso pasa cada pocos meses</strong>.
    </p>
    <aside class="notes">
      Verificado contra la documentacion del Agent SDK y el repositorio anthropics/claude-agent-sdk-python
      (agosto 2026). El paquete de Python trae el binario de Claude Code incluido, asi que no hace falta
      instalarlo aparte.

      El renombre importa para la clase porque TODO lo que el estudiante encuentre buscando "Claude
      Code SDK" apunta a la documentacion vieja. Mismo problema que ya se dijo con LangChain en la
      unidad 18: en este tema la vida util de un tutorial se mide en meses.
    </aside>
  </section>''')

# ─────────────────────── 12. lo que trae puesto ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-capacidades">
    <h2>Lo que Trae Puesto</h2>
    <table style="font-size: 0.365em; width: 100%; max-width: 830px; margin: 0.2em auto;">
      <tr><th style="text-align:left;">Capacidad</th><th style="text-align:left;">Qué te ahorra</th></tr>
      <tr><td style="text-align:left;"><strong>Herramientas incluidas</strong></td>
        <td style="text-align:left;"><code>Read</code>, <code>Write</code>, <code>Edit</code>, <code>Bash</code>, <code>Glob</code>, <code>Grep</code>, <code>WebSearch</code>, <code>WebFetch</code></td></tr>
      <tr><td style="text-align:left;"><strong>Permisos</strong></td>
        <td style="text-align:left;"><code>allowed_tools</code>, <code>disallowed_tools</code>, <code>permission_mode</code> — la lista blanca como característica</td></tr>
      <tr><td style="text-align:left;"><strong>Hooks</strong></td>
        <td style="text-align:left;">correr código tuyo <em>antes</em> de que una herramienta se ejecute, y bloquearla</td></tr>
      <tr><td style="text-align:left;"><strong>Subagentes</strong></td>
        <td style="text-align:left;">delegar una subtarea a un contexto limpio; solo vuelve el resultado</td></tr>
      <tr><td style="text-align:left;"><strong>Compactación</strong></td>
        <td style="text-align:left;">resume la historia vieja sola cuando la ventana se llena</td></tr>
      <tr><td style="text-align:left;"><strong>Sesiones</strong></td>
        <td style="text-align:left;">retomar o bifurcar una conversación por su <code>session_id</code></td></tr>
      <tr><td style="text-align:left;"><strong>MCP</strong></td>
        <td style="text-align:left;">cliente completo: stdio y remoto, no solo <em>tools</em></td></tr>
    </table>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.2em;">
      Y dos topes que <strong>no son opcionales</strong> en producción:
      <code>max_turns</code> y <code>max_budget_usd</code>. La regla 3 de la unidad 19, con precio.
    </p>
    <aside class="notes">
      Tabla armada de la documentacion del Agent SDK (paginas overview y agent-loop).

      Los dos topes son el punto que hay que subrayar: un agente sin limite de turnos sobre un prompt
      abierto ("mejora este codigo") puede correr mucho tiempo y gastar mucho dinero. max_budget_usd
      cubre tambien lo que gastan los subagentes.

      El modo de permisos por defecto exige aprobacion para lo que no este en allowed_tools;
      bypassPermissions solo tiene sentido en CI o contenedores aislados, y la documentacion lo dice
      con todas las letras. Buen momento para conectar con la discusion de seguridad de la unidad 12.
    </aside>
  </section>''')

# ─────────────────────── 13. herramientas propias ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-tool-decorator">
    <h2>Tus Propias Herramientas</h2>
    <pre style="font-size: 0.32em; max-width: 94%; margin: 0.2em auto;"><code class="language-python">from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions, ClaudeSDKClient

@tool("greet", "Greet a user", {"name": str})
async def greet_user(args):
    return {"content": [{"type": "text", "text": f"Hello, {args['name']}!"}]}

server = create_sdk_mcp_server(name="my-tools", version="1.0.0", tools=[greet_user])

options = ClaudeAgentOptions(
    mcp_servers={"tools": server},
    allowed_tools=["mcp__tools__greet"],     # nombre = mcp__servidor__herramienta
)

async with ClaudeSDKClient(options=options) as client:
    await client.query("Greet Alice")
    async for msg in client.receive_response():
        print(msg)</code></pre>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.25em; padding: 0.35em; background: rgba(255,255,0,0.07);">
      Fíjate: tu función <strong>es un servidor MCP</strong>, aunque corra dentro de tu propio proceso.
      MCP aquí no es "otro programa": es <strong>el vocabulario</strong> con el que se declaran las
      herramientas.
    </p>
    <aside class="notes">
      Ejemplo del repositorio oficial del SDK de Python. El detalle del nombre —mcp__tools__greet—
      confunde la primera vez: el prefijo mcp__ y el nombre del servidor forman parte del identificador
      que va en allowed_tools.

      La idea que vale la pena que se lleven: create_sdk_mcp_server crea un servidor EN PROCESO, sin
      subproceso ni red. Es el mismo protocolo usado como formato de declaracion. Por eso una
      herramienta escrita asi se puede mover despues a un servidor MCP de verdad sin reescribirla.
    </aside>
  </section>''')

# ─────────────────────── 14. cual de los cuatro ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-elegir">
    <h2>Cuál de los Cuatro</h2>
    <table style="font-size: 0.375em; width: 100%; max-width: 840px; margin: 0.25em auto;">
      <tr><th style="text-align:left;">Si lo que quieres es…</th><th style="text-align:left;">Usa</th></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">control total del bucle, o meter una aprobación humana en medio</td>
        <td style="text-align:left; color:var(--c-blue);"><strong>Messages API</strong> a mano</td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">llamar unas cuantas funciones tuyas sin escribir el bucle</td>
        <td style="text-align:left; color:var(--c-green);"><strong>Tool Runner</strong></td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">un agente que lea, escriba y corra comandos en tu proyecto</td>
        <td style="text-align:left; color:var(--c-orange);"><strong>Agent SDK</strong></td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">tareas largas sin administrar tu propio sandbox ni sesiones</td>
        <td style="text-align:left; color:var(--c-purple);"><strong>Managed Agents</strong></td></tr>
      <tr class="fragment fade-up"><td style="text-align:left;">explorar o hacer algo puntual desde la terminal</td>
        <td style="text-align:left; color:var(--c-text-dim);">el <strong>CLI</strong>, sin escribir código</td></tr>
    </table>
    <p class="fragment fade-up" style="font-size: 0.41em; margin-top: 0.3em;">
      Y para tu capstone, la pregunta anterior a todas: <strong>¿de verdad necesitas un agente?</strong>
      Si los pasos son siempre los mismos, una cadena fija es más barata, más rápida y se puede probar.
    </p>
    <aside class="notes">
      Las cuatro primeras filas son la tabla de comparacion de la documentacion del Agent SDK, traducida.

      La ultima frase repite a proposito la diapositiva "Cuando un Agente NO es la Respuesta" de la
      unidad 19. Este anexo muestra herramientas muy comodas y el riesgo pedagogico es que el
      estudiante quiera meter un agente en el capstone porque es lo mas nuevo que vio. Cerrar
      recordando el criterio: agente solo si el flujo NO se conoce de antemano.
    </aside>
  </section>''')

# ─────────────────────── 15. conceptos clave ───────────────────────
slide('''
  <section data-transition="fade" id="sl-20-clave">
    <h2>Conceptos Clave</h2>
    <div class="roadmap" style="flex-direction: column; align-items: stretch; text-align:left; font-size: 0.44em;">
      <div class="step fragment fade-up" style="text-align:left;">El modelo <strong>pide</strong>;
        tu código <strong>ejecuta</strong>. <code>stop_reason == "tool_use"</code> es todo el bucle.</div>
      <div class="step fragment fade-up" style="text-align:left;">Las <strong>tres reglas</strong> no
        cambian con la API: lista blanca, el error vuelve como resultado, tope de pasos.</div>
      <div class="step fragment fade-up" style="text-align:left;"><strong>MCP</strong> es un protocolo
        abierto: escribes el servidor una vez y lo usan todos los clientes.</div>
      <div class="step fragment fade-up" style="text-align:left;">El <strong>Agent SDK</strong> es Claude
        Code como librería — y el <em>Claude Code SDK</em> de los tutoriales viejos.</div>
      <div class="step fragment fade-up" style="text-align:left;">Aquí <strong>cada paso cuesta</strong>,
        y el bloque de herramientas se paga en cada vuelta.</div>
    </div>
    <div class="resource-grid" style="max-width: 820px; margin: 0.35em auto 0 auto; font-size: 0.7em;">
      <a class="resource-card" href="https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview" target="_blank" rel="noopener">
        <div class="resource-icon">🔧</div><h4>Tool use</h4>
        <p>El ciclo <code>tool_use</code> → <code>tool_result</code>, con el ejemplo completo.</p>
        <span class="resource-tag">platform.claude.com</span></a>
      <a class="resource-card" href="https://modelcontextprotocol.io" target="_blank" rel="noopener">
        <div class="resource-icon">🔌</div><h4>MCP</h4>
        <p>La especificación, los SDKs y cómo escribir un servidor.</p>
        <span class="resource-tag">modelcontextprotocol.io</span></a>
      <a class="resource-card" href="https://code.claude.com/docs/en/agent-sdk/overview" target="_blank" rel="noopener">
        <div class="resource-icon">🤖</div><h4>Agent SDK</h4>
        <p>Bucle, permisos, hooks, subagentes y sesiones.</p>
        <span class="resource-tag">code.claude.com</span></a>
    </div>
    <aside class="notes">
      Cierre del anexo. Los tres enlaces se comprobaron en agosto de 2026.

      REPETIR AQUI lo de la portada: este anexo esta verificado contra la documentacion oficial pero NO
      esta medido por nosotros, a diferencia del resto del deck. No hay notebook porque necesitaria una
      llave de pago y el curso se compromete a que todo corra gratis en Colab. El estudiante que quiera
      probarlo tiene los tres enlaces y el codigo de las diapositivas, que es suficiente para empezar.

      Si el proximo trimestre hay presupuesto para llaves, el candidato natural es un notebook 31 que
      haga el bucle agentico de la diapositiva 5 con dos herramientas, y compare su traza con la del
      notebook 28 hecha con el modelo local. Ahi si habria medicion propia.
    </aside>
  </section>''')

# ─────────────────────────── ensamblado ───────────────────────────
seccion = ('\n' + MARCA + '\n     ============================================================ -->\n'
           '<section>\n' + "\n".join(S) + '\n</section>\n')

html = io.open(RUTA, encoding='utf-8').read()
if MARCA in html:
    sys.exit("La seccion 20 ya esta insertada; nada que hacer.")

# 1) insertar la seccion justo antes del cierre de .slides
cierre = '\n</div>'
idx = html.rindex('</section>') + len('</section>')
html = html[:idx] + '\n' + seccion + html[idx:]

# 2) entrada en el indice, dentro del grupo "Orquestacion y Agentes"
ancla = '<a class="toc-item" onclick="Reveal.slide(19, 0)"><span class="toc-num">19</span>Agentes y RAG Agéntico</a>'
nueva = (ancla + '\n          <a class="toc-item" onclick="Reveal.slide(20, 0)">'
         '<span class="toc-num">20</span>Anexo opcional: Agentes con Anthropic</a>')
assert ancla in html, "no se encontro el ancla del indice"
html = html.replace(ancla, nueva, 1)
html = html.replace('Orquestación y Agentes <span class="toc-range">18 – 19</span>',
                    'Orquestación y Agentes <span class="toc-range">18 – 20</span>', 1)

io.open(RUTA, 'w', encoding='utf-8').write(html)
print(f"seccion 20 insertada: {len(S)} diapositivas, {len(seccion):,} bytes")
