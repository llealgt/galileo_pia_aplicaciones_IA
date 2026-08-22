# -*- coding: utf-8 -*-
'''Inserta el catalogo de LLMs populares en la unidad 12, despues de "Lo que Escalo
fue el Tamano" (sl-escala) y antes de tokens y del bucle de generacion.

TODOS los numeros de parametros salen de `safetensors.total` de la API de Hugging
Face, consultada el 21 de agosto de 2026 — no de blogs comparativos, que en las
busquedas devolvieron nombres de modelos que no existen. Los modelos cerrados NO
publican su tamano y la tabla lo dice en vez de inventarlo, que es justo la leccion
de la diapositiva.

Reproducible con scripts/med_catalogo_llms.py.
Idempotente por el id sl-cat-canales.
'''
import io, sys

RUTA = "../index.html"

# (nombre, creador, parametros, extra, licencia/canal)
CERRADOS = [
    ("Claude Fable 5 · Opus 5 · Sonnet 5 · Haiku 4.5", "Anthropic", "no publicado",
     "API propia · Bedrock · Google Cloud · Microsoft Foundry"),
    ("GPT-5.6 Sol · Terra · Luna", "OpenAI", "no publicado",
     "API propia · Azure"),
    ("Gemini 3.7 Flash · 3.1 Pro", "Google", "no publicado",
     "Gemini API · Vertex AI"),
    ("Amazon Nova Micro · Lite · Pro · Premier", "Amazon", "no publicado",
     "solo Amazon Bedrock"),
    ("Grok", "xAI", "no publicado", "API propia"),
]

GRANDES = [
    ("Kimi K3",                  "Moonshot AI",  "2.78 T", "MoE, 896 expertos", "propia"),
    ("Qwen3.8-2.4T-A95B",        "Alibaba",      "2.45 T", "MoE, 95 B activos", "propia"),
    ("DeepSeek-V4-Pro",          "DeepSeek",     "1.60 T", "MoE, 384 expertos", "MIT"),
    ("Kimi K2.7-Code",           "Moonshot AI",  "1.03 T", "especializado en código", "propia"),
    ("GLM-5.2",                  "Z.ai",         "753 B",  "MoE, 256 expertos", "MIT"),
    ("Mistral Large 3",          "Mistral AI",   "675 B",  "—", "Apache 2.0"),
    ("Nemotron 3 Ultra",         "NVIDIA",       "561 B",  "MoE, 55 B activos", "propia"),
    ("Llama 4 Maverick",         "Meta",         "402 B",  "MoE, 17 B activos", "propia"),
    ("MiniMax-M2.7",             "MiniMax",      "229 B",  "MoE, 256 expertos", "propia"),
    ("Command A+ (05-2026)",     "Cohere",       "219 B",  "—", "Apache 2.0"),
    ("Mistral Medium 3.5",       "Mistral AI",   "128 B",  "—", "propia"),
    ("gpt-oss-120b",             "OpenAI",       "117 B",  "MoE, 4 expertos/token", "Apache 2.0"),
    ("Llama 4 Scout",            "Meta",         "109 B",  "MoE, 17 B activos", "propia"),
]

CHICOS = [
    ("Olmo 3.1 32B",             "Allen AI",     "32.2 B", "abierto de verdad: datos y receta", "Apache 2.0"),
    ("Nemotron 3 Nano 30B-A3B",  "NVIDIA",       "31.6 B", "MoE, 3 B activos", "propia"),
    ("Gemma 4 31B",              "Google",       "31.3 B", "—", "Apache 2.0"),
    ("Qwen3.8-27B",              "Alibaba",      "27.8 B", "denso", "Apache 2.0"),
    ("gpt-oss-20b",              "OpenAI",       "21.5 B", "MoE", "Apache 2.0"),
    ("Phi-4",                    "Microsoft",    "14.7 B", "entrenado con datos sintéticos", "MIT"),
    ("Gemma 4 12B",              "Google",       "12.0 B", "—", "Apache 2.0"),
    ("Granite 4.1 8B",           "IBM",          "8.79 B", "orientado a empresa", "Apache 2.0"),
    ("Falcon-H1R 7B",            "TII (Emiratos)", "7.59 B", "híbrido Mamba + atención", "propia"),
    ("Olmo 3 7B",                "Allen AI",     "7.30 B", "—", "Apache 2.0"),
    ("Qwen3-4B-Instruct",        "Alibaba",      "4.02 B", "—", "Apache 2.0"),
    ("SmolLM3-3B",               "Hugging Face", "3.08 B", "—", "Apache 2.0"),
    ("Qwen2.5-1.5B-Instruct",    "Alibaba",      "1.54 B", "★ el de nuestros notebooks", "Apache 2.0"),
    ("Gemma 3 270M",             "Google",       "268 M",  "cabe en un teléfono", "propia"),
]

def fila_cerrado(n, c, p, canal):
    return (f'      <tr><td style="text-align:left;"><strong>{n}</strong></td>'
            f'<td>{c}</td>'
            f'<td style="color:var(--c-red);">{p}</td>'
            f'<td style="text-align:left; font-size:0.92em;">{canal}</td></tr>\n')

def fila_abierto(n, c, p, extra, lic):
    col = 'var(--c-yellow, #FFFF00)' if '★' in extra else 'var(--c-green)'
    return (f'      <tr><td style="text-align:left;"><strong>{n}</strong></td>'
            f'<td>{c}</td>'
            f'<td style="color:{col}; font-family:\'Fira Code\',monospace;">{p}</td>'
            f'<td style="text-align:left; font-size:0.9em; color:var(--c-text-dim);">{extra}</td>'
            f'<td style="font-size:0.9em;">{lic}</td></tr>\n')

S = []

# ── 1. los cuatro canales ──────────────────────────────────────────
S.append('''
  <section data-transition="fade" id="sl-cat-canales">
    <h2>Cómo Llega un Modelo a tu Código</h2>
    <div style="text-align:center; margin:0.25em 0;">
      <svg viewBox="0 0 760 160" style="width:100%; max-width:760px; max-height:164px;" role="img">
<rect x="6" y="34" width="176" height="86" rx="9" fill="#FC6255" fill-opacity="0.12" stroke="#FC6255"/><text x="94" y="56" text-anchor="middle" fill="#FC6255" font-size="12.5" font-family="Fira Code,monospace">API del creador</text><text x="94" y="76" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">api.anthropic.com</text><text x="94" y="92" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">api.openai.com</text><text x="94" y="110" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">pagas por token</text><rect x="196" y="34" width="176" height="86" rx="9" fill="#FF862F" fill-opacity="0.12" stroke="#FF862F"/><text x="284" y="56" text-anchor="middle" fill="#FF862F" font-size="12.5" font-family="Fira Code,monospace">la nube que ya usas</text><text x="284" y="76" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">Bedrock · Vertex AI</text><text x="284" y="92" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">Azure · Foundry</text><text x="284" y="110" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">misma factura y permisos</text><rect x="386" y="34" width="176" height="86" rx="9" fill="#83C167" fill-opacity="0.12" stroke="#83C167"/><text x="474" y="56" text-anchor="middle" fill="#83C167" font-size="12.5" font-family="Fira Code,monospace">descargar los pesos</text><text x="474" y="76" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">Hugging Face</text><text x="474" y="92" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">tú pones la GPU</text><text x="474" y="110" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">gratis, si tienes dónde</text><rect x="576" y="34" width="178" height="86" rx="9" fill="#58C4DD" fill-opacity="0.12" stroke="#58C4DD"/><text x="665" y="56" text-anchor="middle" fill="#58C4DD" font-size="12.5" font-family="Fira Code,monospace">alquilar uno abierto</text><text x="665" y="76" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">OpenRouter · Together</text><text x="665" y="92" text-anchor="middle" fill="#ece6d0" font-size="10.5" font-family="Lora,serif">Groq · Fireworks</text><text x="665" y="110" text-anchor="middle" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">pesos abiertos, sin GPU</text><text x="380" y="18" text-anchor="middle" fill="#8a86a0" font-size="11" font-family="Lora,serif" font-style="italic">el mismo modelo puede llegarte por varios de estos caminos a la vez</text><text x="380" y="145" text-anchor="middle" fill="#FFFF00" font-size="11.5" font-family="Lora,serif">lo que decide el camino no es el modelo: es dónde vive tu dato y quién paga la GPU</text>
      </svg>
    </div>
    <p style="font-size: 0.42em;">
      Y una advertencia antes de la lista: <strong>de los modelos cerrados nadie publica el número de
      parámetros</strong>. Lo que circula en internet son estimaciones. Las tablas que siguen ponen
      <em>"no publicado"</em> donde no hay dato.
    </p>
    <aside class="notes">
      Diapositiva propia. Los cuatro canales son la taxonomia que importa para el capstone, y no es un
      detalle administrativo: si el dato del cliente no puede salir de su cuenta de AWS, el camino ya
      esta decidido antes de comparar calidades.

      Los enlaces de los cuatro canales se comprobaron con curl (200) el 21 de agosto de 2026.

      La advertencia del final es la parte importante para el metodo del curso: en las tablas que vienen,
      la columna de parametros dice "no publicado" para Claude, GPT, Gemini, Nova y Grok. Cualquier
      cifra que el estudiante encuentre para esos modelos es una estimacion de terceros. Es el mismo
      criterio que con las descargas de Hugging Face: se dice de donde sale el numero, o no se pone.
    </aside>
  </section>''')

# ── 2. los cerrados ────────────────────────────────────────────────
t = ''.join(fila_cerrado(*c) for c in CERRADOS)
S.append(f'''
  <section data-transition="fade" id="sl-cat-cerrados">
    <h2>Los Cerrados: sólo por API</h2>
    <p style="font-size: 0.42em; margin-bottom: 0.2em;">
      No te dan los pesos. A cambio, no administras nada: mandas texto y recibes texto.
    </p>
    <table style="font-size: 0.355em; width: 100%; max-width: 860px; margin: 0.2em auto;">
      <tr><th style="text-align:left;">Familia</th><th>Creador</th><th>Parámetros</th>
          <th style="text-align:left;">Cómo se consume</th></tr>
{t}    </table>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.3em; padding: 0.35em; background: rgba(255,255,0,0.07);">
      Fíjate en la última columna: <strong>Claude se consume por cuatro caminos distintos</strong> y
      Nova por uno solo. Eso no es un detalle comercial — decide si tu dato sale o no de tu nube.
    </p>
    <aside class="notes">
      Los nombres y los canales salen de la documentacion oficial de cada proveedor, consultada el 21 de
      agosto de 2026: platform.claude.com/docs (modelos y plataformas), developers.openai.com/api/docs/models,
      ai.google.dev/gemini-api/docs/models y docs.aws.amazon.com/nova.

      Advertir en clase: esta tabla es la que mas rapido envejece de todo el deck. Entre que se preparo y
      que se da la clase pueden haber salido dos versiones nuevas. El nombre exacto se consulta siempre
      en la pagina del proveedor; lo que NO cambia tan rapido son los canales y el hecho de que el
      tamano no se publica.

      Nova solo por Bedrock es un buen ejemplo de estrategia: Amazon no vende el modelo, vende la nube.
    </aside>
  </section>''')

# ── 3. abiertos grandes ────────────────────────────────────────────
t = ''.join(fila_abierto(*m) for m in GRANDES)
S.append(f'''
  <section data-transition="fade" id="sl-cat-grandes">
    <h2>Los Abiertos: te Dan los Pesos</h2>
    <p style="font-size: 0.4em; margin-bottom: 0.15em;">
      Estos sí publican el tamaño, porque publican el modelo entero. Se descargan de Hugging Face
      — y los grandes también se alquilan por API en agregadores, en Bedrock y en Vertex.
    </p>
    <table style="font-size: 0.315em; width: 100%; max-width: 880px; margin: 0.15em auto;">
      <tr><th style="text-align:left;">Modelo</th><th>Creador</th><th>Parámetros</th>
          <th style="text-align:left;">Nota</th><th>Licencia</th></tr>
{t}    </table>
    <p style="font-size: 0.375em; margin-top: 0.2em; color: var(--c-text-dim);">
      Contados de los metadatos de cada repositorio en Hugging Face, no de un blog.
      <strong>MoE</strong> = sólo una fracción de los parámetros se activa por token.
    </p>
    <aside class="notes">
      TODAS las cifras salen de `safetensors.total` de la API de Hugging Face, consultada el 21 de agosto
      de 2026 (script: scripts/med_catalogo_llms.py). Se hizo asi a proposito: las busquedas en blogs
      comparativos devolvieron nombres de modelos que no existen, y ese fue el motivo de bajar a la API.

      Tres cosas que vale la pena senalar al proyectarlo:

      1. MoE cambia la lectura de la tabla. Llama 4 Maverick tiene 402 B pero activa 17 B por token: en
         computo se parece a un modelo de 17 B, en memoria a uno de 402 B. Por eso la columna de
         parametros ya no dice por si sola lo que cuesta correrlo.
      2. La geografia: de los trece, seis son chinos (Moonshot, Alibaba, DeepSeek, Z.ai, MiniMax). Hace
         tres anos esta tabla habria sido casi toda estadounidense.
      3. Meta no publica un modelo nuevo desde abril de 2025 (Llama 4). Lo dice la propia API de Hugging
         Face al ordenar sus repos por fecha. Llama sigue siendo el nombre que todo el mundo conoce, y
         ya no es el que lidera — buen antidoto contra elegir por marca.
    </aside>
  </section>''')

# ── 4. los que caben en tu maquina ─────────────────────────────────
t = ''.join(fila_abierto(*m) for m in CHICOS)
S.append(f'''
  <section data-transition="fade" id="sl-cat-chicos">
    <h2>Los que Caben en tu Máquina</h2>
    <table style="font-size: 0.305em; width: 100%; max-width: 880px; margin: 0.15em auto;">
      <tr><th style="text-align:left;">Modelo</th><th>Creador</th><th>Parámetros</th>
          <th style="text-align:left;">Nota</th><th>Licencia</th></tr>
{t}    </table>
    <p style="font-size: 0.385em; margin-top: 0.25em;">
      La cuenta para saber si cabe: <strong>parámetros × 2 bytes</strong> en precisión normal.
      Un modelo de 27 B pide unos <strong>56 GB</strong> de VRAM… y cuantizado a 4 bits, unos
      <strong>14 GB</strong>. Ahí es donde entra una GPU de escritorio.
    </p>
    <p class="fragment fade-up" style="font-size: 0.385em; margin-top: 0.15em; padding: 0.3em; background: rgba(255,255,0,0.07);">
      El <strong>Qwen2.5-1.5B</strong> de nuestros notebooks está en esta tabla a propósito: con
      1.54 B corre en la GPU gratuita de Colab. Es <strong>1,800 veces más chico que Kimi K3</strong>
      — y resuelve las cinco tareas del notebook 17.
    </p>
    <aside class="notes">
      Mismas fuentes y mismo script que la tabla anterior. La cuenta de VRAM es aritmetica, no una
      medicion: 27.8e9 x 2 bytes = 55.6 GB en bf16, y a 4 bits (0.5 bytes) unos 13.9 GB. En la practica
      hay que sumarle la cache de atencion, que crece con el contexto — eso ya esta medido en la
      unidad 15 (recuperacion en produccion).

      El cierre con Qwen2.5-1.5B es el que amarra la unidad: el estudiante ya corrio ese modelo, y aqui
      ve exactamente donde queda en el panorama. 2.78e12 / 1.54e9 = 1,805.

      Gemma 3 270M esta en la lista para que se vea el otro extremo: hay modelos utiles de menos de mil
      millones de parametros. No sirven para conversar, si para clasificar o extraer campos, que es
      justo lo que pide media pipeline de produccion.
    </aside>
  </section>''')

# ── inserción ──────────────────────────────────────────────────────
html = io.open(RUTA, encoding='utf-8').read()
if 'sl-cat-canales' in html:
    sys.exit("El catalogo ya esta insertado; nada que hacer.")

ancla = 'id="sl-escala"'
i = html.index(ancla)
fin = html.index('</section>', i) + len('</section>')
bloque = "\n" + "\n".join(s.rstrip() + "\n" for s in S)
html = html[:fin] + bloque + html[fin:]
io.open(RUTA, 'w', encoding='utf-8').write(html)
print(f"insertadas {len(S)} diapositivas tras sl-escala | "
      f"modelos citados: {len(CERRADOS)} familias cerradas + {len(GRANDES)} + {len(CHICOS)} abiertos")
