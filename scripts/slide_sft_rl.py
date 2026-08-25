# -*- coding: utf-8 -*-
'''Agrega "Dos Formas de Afinar: SFT y RL" tras "La Otra Opcion: Fine-Tuning" (unidad 16).

Verificado antes de escribirla: el bloque de fine-tuning nombraba el SUPERVISADO
("se hace con fine-tuning supervisado") y el de refuerzo NO aparecia en pantalla en
todo el deck — RLHF solo salia en notas del catedratico de la unidad 12. Este es el
hueco que se cierra.

Idempotente por el id sl-sft-rl.
'''
import io, sys

RUTA = "../index.html"

def caja(x, y, w, t, c, sub=None, h=30):
    s = (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="6" fill="{c}" fill-opacity="0.14" '
         f'stroke="{c}" stroke-width="1.2"/>'
         f'<text x="{x+w//2}" y="{y+(19 if not sub else 14)}" text-anchor="middle" fill="#ece6d0" '
         f'font-size="10.5" font-family="Lora,serif">{t}</text>')
    if sub:
        s += (f'<text x="{x+w//2}" y="{y+26}" text-anchor="middle" fill="#8a86a0" font-size="8.5" '
              f'font-family="Fira Code,monospace">{sub}</text>')
    return s

def flecha(x0, x1, y, c="#8a86a0"):
    return (f'<line x1="{x0}" y1="{y}" x2="{x1-7}" y2="{y}" stroke="{c}" stroke-width="1.4"/>'
            f'<polygon points="{x1},{y} {x1-8},{y-4.5} {x1-8},{y+4.5}" fill="{c}"/>')

SVG = (
 '<svg viewBox="0 0 760 172" style="width:100%; max-width:760px; max-height:174px;" role="img">'
 # ── SFT ──
 '<text x="8" y="15" fill="#58C4DD" font-size="11.5" font-family="Fira Code,monospace">'
 'SFT · aprende a IMITAR</text>'
 + caja(8, 24, 150, "pares entrada → salida", "#58C4DD", "escritos por humanos", 34)
 + flecha(158, 190, 41)
 + caja(190, 24, 128, "copia la salida", "#58C4DD", "misma pérdida de siempre", 34)
 + flecha(318, 350, 41)
 + caja(350, 24, 132, "habla como tus ejemplos", "#83C167", h=34)
 + '<text x="500" y="38" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">'
   'necesitas SABER ESCRIBIR</text>'
   '<text x="500" y="51" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">'
   'la respuesta correcta</text>'
 '<line x1="8" y1="72" x2="752" y2="72" stroke="#8a86a0" stroke-width="1" stroke-dasharray="4 4"/>'
 # ── RL ──
 '<text x="8" y="92" fill="#9A72AC" font-size="11.5" font-family="Fira Code,monospace">'
 'RL · aprende a MAXIMIZAR una señal</text>'
 + caja(8, 100, 150, "el modelo propone varias", "#9A72AC", "no hay respuesta dada", 34)
 + flecha(158, 190, 117)
 + caja(190, 100, 128, "algo las ordena", "#FFFF00", "humano o juez", 34)
 + flecha(318, 350, 117)
 + caja(350, 100, 132, "sube lo preferido", "#83C167", "PPO · DPO", 34)
 + '<path d="M416,134 L416,152 L83,152 L83,136" fill="none" stroke="#FC6255" stroke-width="1.4"/>'
   '<polygon points="83,130 78,141 88,141" fill="#FC6255"/>'
   '<text x="250" y="145" text-anchor="middle" fill="#FC6255" font-size="9" '
   'font-family="Fira Code,monospace">y otra vuelta</text>'
   '<text x="500" y="114" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">'
   'basta con saber JUZGAR</text>'
   '<text x="500" y="127" fill="#8a86a0" font-size="10" font-family="Lora,serif" font-style="italic">'
   'cuál de dos es mejor</text>'
 '<text x="376" y="168" text-anchor="middle" fill="#FFFF00" font-size="11" '
 'font-family="Lora,serif" font-style="italic">el ChatGPT que conoces es pre-entrenamiento '
 '+ SFT + RL, en ese orden</text>'
 '</svg>')

SLIDE = f'''
  <section data-transition="fade" id="sl-sft-rl">
    <h2>Dos Formas de Afinar: SFT y RL</h2>
    <div style="text-align:center; margin:0.2em 0;">
      {SVG}
    </div>
    <div class="columns" style="font-size: 0.36em; margin-top:0.1em;">
      <div class="col">
        <p style="margin:0; padding:0.3em 0.5em; background: rgba(88,196,221,0.08); border-left: 3px solid var(--c-blue); text-align:left;">
          <strong style="color: var(--c-blue);">Supervised fine-tuning (SFT)</strong> — le das pares
          <em>entrada → respuesta correcta</em> y ajustas los pesos para que la copie. Es el bucle de
          la unidad 11, con texto en vez de imágenes.
        </p>
      </div>
      <div class="col">
        <p style="margin:0; padding:0.3em 0.5em; background: rgba(154,114,172,0.08); border-left: 3px solid var(--c-purple); text-align:left;">
          <strong style="color: var(--c-purple);">Fine-tuning por refuerzo (RLFT)</strong> — no le das
          la respuesta: le das una <strong>señal de preferencia</strong>. <strong>RLHF</strong> la saca
          de humanos que ordenan salidas; <strong>DPO</strong> se salta el modelo de recompensa y
          optimiza directo sobre los pares; <strong>RLAIF</strong> usa otro LLM de juez.
        </p>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.405em; margin-top: 0.3em; padding: 0.3em 0.5em; background: rgba(255,255,0,0.07);">
      🎯 La pregunta que decide cuál usar: <strong>¿sabes escribir la respuesta correcta, o sólo
      reconocerla?</strong> Si sabes escribirla, SFT. Si sólo sabes decir cuál de dos es mejor —tono,
      utilidad, seguridad— <strong>esa es exactamente la señal que consume RL</strong>.
    </p>
    <aside class="notes">
      Contenido propio. VERIFICADO antes de escribirla: el deck nombraba el fine-tuning supervisado
      pero el de refuerzo no aparecia en pantalla en ninguna parte — RLHF solo salia en notas del
      catedratico de la unidad 12. Este slide cierra ese hueco.

      La distincion que hay que dejar clara, y que resume el recuadro amarillo: SFT necesita que
      alguien ESCRIBA la respuesta correcta; RL solo necesita que alguien la JUZGUE. Por eso RL es lo
      que se usa para alinear tono, utilidad y seguridad, donde escribir "la respuesta perfecta" no
      tiene sentido pero comparar dos si.

      Las tres variantes, para quien pregunte: RLHF (Ouyang et al. 2022) entrena un modelo de
      recompensa con comparaciones humanas y luego optimiza con PPO; DPO se salta el modelo de
      recompensa y optimiza directamente sobre los pares preferidos, que es mas barato y mas estable;
      RLAIF sustituye al humano por otro LLM — y ahi conviene enlazar con el LLM-as-a-judge del bloque
      de casos de uso, porque es literalmente la misma tecnica usada para entrenar en vez de evaluar.
      Tambien existe RL con recompensa VERIFICABLE (tests que pasan, resultado correcto), que es lo
      que mueve a los modelos de razonamiento de la unidad 16.

      Y para el capstone, el orden no cambia: primero prompting, luego RAG, y afinar casi nunca es el
      primer paso. Este slide explica QUE es, no recomienda hacerlo.
    </aside>
  </section>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'sl-sft-rl' in doc:
    sys.exit("Ya insertada; nada que hacer.")
m = '<h2>La Otra Opción: Fine-Tuning</h2>'
if doc.count(m) != 1: sys.exit("no encontre la diapositiva de fine-tuning")
i = doc.index(m); fin = doc.index('</section>', i) + len('</section>')
doc = doc[:fin] + "\n" + SLIDE.strip() + "\n" + doc[fin:]

# y que la diapositiva anterior no de a entender que SFT es la unica forma
v = 'Se hace con <strong>fine-tuning supervisado</strong>: el mismo bucle de siempre.'
if v in doc:
    doc = doc.replace(v, 'La forma más directa es el <strong>fine-tuning supervisado</strong>: '
                         'el mismo bucle de siempre. <span style="color: var(--c-text-dim);">'
                         '(hay otra, y va en la diapositiva siguiente).</span>', 1)
    print("  matizada la frase de «se hace con fine-tuning supervisado»")
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("«Dos Formas de Afinar: SFT y RL» insertada")
