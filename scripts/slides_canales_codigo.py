# -*- coding: utf-8 -*-
'''Dos diapositivas de codigo tras "Como Llega un Modelo a tu Codigo" (unidad 12).

La diapositiva de los cuatro canales explicaba el mapa pero no ensenaba ni una linea.
Estas dos hacen LA MISMA TAREA —resumir el ticket #A-4471, el ejemplo corriente del
bloque de casos de uso— por los cuatro caminos, para que se vea que lo que cambia es
el envoltorio y quien te cobra, no la conversacion.

  1. por API: Anthropic directo contra Amazon Bedrock (Converse)
  2. sin API: pesos locales con transformers contra un agregador compatible con OpenAI

Codigo verificado contra la documentacion oficial (septiembre 2026): la forma de
bedrock.converse() sale de docs.aws.amazon.com/bedrock (Inference using Converse API)
y la de messages.create() de platform.claude.com. NO se ejecutaron: las dos primeras
necesitan llave de pago.

Idempotente por el id sl-canales-api.
'''
import io, sys

RUTA = "../index.html"

ANTHROPIC = '''# pip install anthropic   ·   llave en ANTHROPIC_API_KEY
import anthropic
cliente = anthropic.Anthropic()

r = cliente.messages.create(
    model="claude-sonnet-5",
    max_tokens=300,
    system="Eres soporte. Responde en una frase.",
    messages=[{"role": "user", "content": TICKET}],
)

print(r.content[0].text)
print(r.usage.input_tokens, r.usage.output_tokens)'''

BEDROCK = '''# pip install boto3   ·   credenciales de AWS,
#                        NINGUNA llave de Anthropic
import boto3
bedrock = boto3.client("bedrock-runtime",
                       region_name="us-east-1")

r = bedrock.converse(
    modelId="anthropic.claude-sonnet-5",
    system=[{"text": "Eres soporte. Responde en una frase."}],
    messages=[{"role": "user",
               "content": [{"text": TICKET}]}],
    inferenceConfig={"maxTokens": 300},
)

print(r["output"]["message"]["content"][0]["text"])
print(r["usage"]["inputTokens"], r["usage"]["outputTokens"])'''

LOCAL = '''# pip install transformers torch
# sin llave y, tras la descarga, sin red
from transformers import AutoModelForCausalLM, AutoTokenizer

M = "Qwen/Qwen2.5-1.5B-Instruct"
tok = AutoTokenizer.from_pretrained(M)
llm = AutoModelForCausalLM.from_pretrained(M, device_map="auto")

msgs = [{"role": "system", "content": "Responde en una frase."},
        {"role": "user",   "content": TICKET}]
ent = tok.apply_chat_template(msgs, return_tensors="pt",
                              add_generation_prompt=True).to(llm.device)

out = llm.generate(ent, max_new_tokens=300, do_sample=False)
print(tok.decode(out[0][ent.shape[1]:], skip_special_tokens=True))'''

AGREGADOR = '''# pip install openai
# una llave, muchos modelos ABIERTOS alojados
import os
from openai import OpenAI

cliente = OpenAI(base_url="https://openrouter.ai/api/v1",
                 api_key=os.environ["OPENROUTER_API_KEY"])

r = cliente.chat.completions.create(
    model="qwen/qwen3-8b",
    messages=[{"role": "system", "content": "Responde en una frase."},
              {"role": "user",   "content": TICKET}],
)

print(r.choices[0].message.content)'''

def dos_columnas(idd, titulo, entrada, izq_t, izq_c, der_t, der_c, cierre, notas, fs="0.275em"):
    return f'''
  <section data-transition="fade" id="{idd}">
    <h2>{titulo}</h2>
    <p style="font-size: 0.41em; margin-bottom: 0.15em;">{entrada}</p>
    <div class="columns" style="font-size: {fs}; align-items: flex-start;">
      <div class="col-45">
        <p style="margin:0 0 0.15em 0; font-size:1.35em;"><strong style="color: {izq_c[1]};">{izq_t}</strong></p>
        <pre style="margin:0; font-size:1em;"><code class="language-python">{izq_c[0]}</code></pre>
      </div>
      <div class="col-50">
        <p style="margin:0 0 0.15em 0; font-size:1.35em;"><strong style="color: {der_c[1]};">{der_t}</strong></p>
        <pre style="margin:0; font-size:1em;"><code class="language-python">{der_c[0]}</code></pre>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.4em; margin-top: 0.25em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07); border-left: 3px solid var(--c-yellow);">
      {cierre}
    </p>
    <aside class="notes">{notas}</aside>
  </section>'''

S1 = dos_columnas(
  "sl-canales-api", "El Mismo Prompt, por API",
  'Las dos llaman a <strong>Claude Sonnet 5</strong> con el mismo ticket. Lo que cambia no es el '
  'modelo: es <strong>de quién es la cuenta</strong>.',
  "API de Anthropic", (ANTHROPIC, "var(--c-red)"),
  "Amazon Bedrock", (BEDROCK, "var(--c-orange)"),
  'Mismos campos, otra forma: el <code>system</code> es una cadena en una y una <strong>lista</strong> '
  'en la otra; el contenido es texto suelto contra una lista de <strong>bloques</strong>. '
  'Y lo importante para tu capstone: con Bedrock <strong>el dato no sale de tu cuenta de AWS</strong> '
  'y pagas en la misma factura.',
  'Codigo verificado contra la documentacion oficial (septiembre 2026): messages.create() de '
  'platform.claude.com y converse() de docs.aws.amazon.com/bedrock. NO ejecutado — las dos necesitan '
  'llave de pago, y el curso corre sin llaves.\n\n'
  '      OJO CON EL modelId DE BEDROCK: los identificadores de Bedrock llevan sufijos de version y a '
  'veces prefijo de region (us./eu.) para los perfiles de inferencia. El de la diapositiva es la forma '
  'moderna sin fecha; el exacto se copia de la consola de Bedrock o de la tabla de la documentacion de '
  'Anthropic, que trae una columna "AWS Bedrock ID".\n\n'
  '      converse() es la API que conviene ensenar y no invoke_model(): es la MISMA llamada para '
  'cualquier modelo de Bedrock —Claude, Llama, Nova, Mistral— asi que cambiar de proveedor es cambiar '
  'una cadena. invoke_model() te obliga a armar el JSON propio de cada familia.')

S2 = dos_columnas(
  "sl-canales-local", "El Mismo Prompt, sin API",
  'Los otros dos caminos: <strong>bajarte los pesos</strong> o <strong>alquilar un modelo abierto</strong> '
  'que alguien más aloja.',
  "Pesos locales · Hugging Face", (LOCAL, "var(--c-green)"),
  "Agregador compatible con OpenAI", (AGREGADOR, "var(--c-blue)"),
  'Fíjate en <code>base_url</code>: media industria habla el <strong>protocolo de OpenAI</strong>, así que '
  'cambiar de proveedor —OpenRouter, Together, Groq, Fireworks, o tu propio servidor con vLLM— es '
  'cambiar <strong>una URL y el nombre del modelo</strong>. Es el argumento más fuerte para no atarte '
  'a un SDK propietario.',
  'El de la izquierda es literalmente el de los notebooks 17 y siguientes del curso, asi que el '
  'estudiante ya lo corrio. El de la derecha no se ejecuto: necesita llave.\n\n'
  '      LO QUE HAY QUE HACER NOTAR: los cuatro fragmentos mandan la MISMA conversacion —un system y '
  'un user— y sacan texto. La conversacion es la misma en los cuatro canales; lo que cambia es el '
  'envoltorio, donde vive el dato y quien te cobra. Es exactamente lo que decia el diagrama de la '
  'diapositiva anterior, ahora en codigo.\n\n'
  '      El truco del base_url es el que mas se agradece en un proyecto real: se escribe el codigo una '
  'vez contra el cliente de OpenAI y se prueban cinco proveedores cambiando dos cadenas. Tambien '
  'funciona contra vLLM o Ollama corriendo en tu maquina, que es como se pasa de la demo local a '
  'produccion sin reescribir nada.',
  fs="0.262em")   # este bloque roza los 700 px: va un punto mas chico que el anterior

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-canales-api' in doc:
    sys.exit("Ya insertadas; nada que hacer.")
i = doc.index('id="sl-cat-canales"')
fin = doc.index('</section>', i) + len('</section>')
doc = doc[:fin] + "\n" + S1.strip() + "\n" + S2.strip() + "\n" + doc[fin:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("insertadas «El Mismo Prompt, por API» y «El Mismo Prompt, sin API»")
