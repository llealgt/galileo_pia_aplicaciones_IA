# -*- coding: utf-8 -*-
'''Agrega al inicio de la unidad 12 la vista de CAJA NEGRA de un LLM: texto entra,
texto sale. Va ANTES de "Un LLM es un Autocompletado muy Sofisticado", que ya trae
un diagrama pero del mecanismo INTERNO (texto -> que sigue -> un token).

El orden importa: primero que es visto desde fuera —una funcion de texto a texto—
y despues que hace por dentro. Y sirve de percha para el resto del curso: RAG,
herramientas y agentes son todos formas de elegir QUE TEXTO meter en esa caja.

Idempotente por el id sl-caja-negra.
'''
import io, sys

RUTA = "../index.html"

def lineas(x, y0, textos, color="#ece6d0", size=10.5, paso=15):
    return "".join(
        f'<text x="{x}" y="{y0 + i * paso}" fill="{color}" font-size="{size}" '
        f'font-family="Fira Code,monospace">{t}</text>'
        for i, t in enumerate(textos))

SVG = (
 '<svg viewBox="0 0 760 214" style="width:100%; max-width:760px; max-height:216px;" role="img">'
 # ── prompt ──
 '<text x="124" y="22" text-anchor="middle" fill="#58C4DD" font-size="12.5" '
 'font-family="Fira Code,monospace">PROMPT</text>'
 '<text x="124" y="36" text-anchor="middle" fill="#8a86a0" font-size="10" '
 'font-family="Lora,serif" font-style="italic">lo que tú escribes · texto</text>'
 '<rect x="8" y="46" width="232" height="112" rx="8" fill="#58C4DD" fill-opacity="0.12" '
 'stroke="#58C4DD" stroke-width="1.4"/>'
 + lineas(22, 70, ["Resume esto en una frase:",
                   "«El pedido #A-4471 llegó",
                   "con la caja abierta y",
                   "falta el cable de",
                   "corriente.»"])
 # ── flecha 1 ──
 + '<line x1="244" y1="102" x2="286" y2="102" stroke="#FFFF00" stroke-width="1.8"/>'
   '<polygon points="294,102 284,96.5 284,107.5" fill="#FFFF00"/>'
 # ── la caja ──
 '<rect x="298" y="60" width="164" height="84" rx="9" fill="#FFFF00" fill-opacity="0.14" '
 'stroke="#FFFF00" stroke-width="1.8"/>'
 '<text x="380" y="96" text-anchor="middle" fill="#FFFF00" font-size="21" '
 'font-family="Lora,serif" font-weight="bold">LLM</text>'
 '<text x="380" y="118" text-anchor="middle" fill="#ece6d0" font-size="10.5" '
 'font-family="Lora,serif">una función de</text>'
 '<text x="380" y="132" text-anchor="middle" fill="#ece6d0" font-size="10.5" '
 'font-family="Lora,serif">texto a texto</text>'
 # ── flecha 2 ──
 '<line x1="466" y1="102" x2="508" y2="102" stroke="#83C167" stroke-width="1.8"/>'
 '<polygon points="516,102 506,96.5 506,107.5" fill="#83C167"/>'
 # ── respuesta ──
 '<text x="636" y="22" text-anchor="middle" fill="#83C167" font-size="12.5" '
 'font-family="Fira Code,monospace">RESPUESTA</text>'
 '<text x="636" y="36" text-anchor="middle" fill="#8a86a0" font-size="10" '
 'font-family="Lora,serif" font-style="italic">lo que devuelve · texto</text>'
 '<rect x="520" y="46" width="232" height="112" rx="8" fill="#83C167" fill-opacity="0.12" '
 'stroke="#83C167" stroke-width="1.4"/>'
 + lineas(534, 84, ["El pedido #A-4471 llegó",
                    "abierto y sin el cable",
                    "de corriente."])
 # ── lo que NO hay ──
 + '<text x="380" y="180" text-anchor="middle" fill="#FC6255" font-size="11" '
   'font-family="Fira Code,monospace">no hay nada más en la caja</text>'
   '<text x="380" y="200" text-anchor="middle" fill="#FFFF00" font-size="11.5" '
   'font-family="Lora,serif" font-style="italic">ni base de datos, ni internet, '
   'ni memoria de la llamada anterior</text>'
 '</svg>')

SLIDE = f'''
  <section data-transition="fade" id="sl-caja-negra">
    <h2>Un LLM es un Procesador de Prompts</h2>
    <div style="text-align:center; margin:0.25em 0;">
      {SVG}
    </div>
    <div class="roadmap" style="flex-direction: column; align-items: stretch; text-align:left; font-size: 0.42em; margin-top:0.15em;">
      <div class="step fragment fade-up" style="text-align:left;">Todo lo que le mandas es
        <strong>una cadena de texto</strong>. Todo lo que devuelve es
        <strong>otra cadena de texto</strong>. No hay más interfaz.</div>
      <div class="step fragment fade-up" style="text-align:left;"><strong>No recuerda</strong> la
        llamada anterior. Lo que parece memoria es que <strong>tú le reenvías</strong> la
        conversación entera cada vez.</div>
      <div class="step fragment fade-up" style="text-align:left;">Y lo que parece <em>saber</em>
        está congelado en sus pesos desde que lo entrenaron.</div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.41em; text-align:center; margin-top: 0.3em; padding: 0.3em; background: rgba(255,255,0,0.07);">
      Todo lo que viene después en el curso —RAG, herramientas, agentes— son formas de
      <strong>elegir qué texto meter en esa caja</strong>.
    </p>
    <aside class="notes">
      Contenido propio. Es la primera diapositiva de contenido de la unidad a proposito: la vista de
      CAJA NEGRA va antes de abrir el capo. La que sigue ("Un LLM es un Autocompletado muy
      Sofisticado") muestra el mecanismo interno; esta muestra la interfaz.

      Las tres vinetas son las tres sorpresas del principiante, y conviene dejarlas caer una por una:

      1. La interfaz es texto y nada mas. No hay "modo resumen" ni "modo traduccion": hay un prompt.
         Eso es lo que hace que el bloque de casos de uso funcione — trece usos, un solo modelo.
      2. NO HAY MEMORIA. Es la que mas cuesta. La API es sin estado y la conversacion la mantiene el
         cliente reenviando la lista de mensajes. De ahi sale, sin trampa, que el costo crezca con la
         conversacion y que exista la ventana de contexto.
      3. El conocimiento esta en los pesos y tiene fecha de corte. Esa es, literalmente, la razon de
         ser de RAG.

      La ultima frase es la percha de todo el curso: RAG elige que texto meter, las herramientas
      meten el resultado de una funcion, y un agente decide solo que meter en la siguiente vuelta.
      Vale la pena volver a esta diapositiva al empezar la unidad 13.
    </aside>
  </section>'''

# ─────────────────────────── inserción ───────────────────────────
doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-caja-negra' in doc:
    sys.exit("La diapositiva de caja negra ya existe; nada que hacer.")

marca = '<h2>Un LLM es un Autocompletado muy Sofisticado</h2>'
if doc.count(marca) != 1:
    sys.exit("no encontre (o no es unica) la diapositiva del autocompletado")
i = doc.rindex('<section', 0, doc.index(marca))
doc = doc[:i] + SLIDE.strip() + "\n\n  " + doc[i:]
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("diapositiva de caja negra insertada al inicio de la unidad 12")
