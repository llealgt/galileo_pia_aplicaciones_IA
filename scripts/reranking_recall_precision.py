# -*- coding: utf-8 -*-
'''Explicita en el bloque de reranking (unidad 15) el mecanismo recall -> precision:
la etapa 1 compra RECALL ensanchando el set de candidatos y la etapa 2 compra
PRECISION reordenando ese mismo set y recortandolo.

Pedido del catedratico. El deck YA decia "la primera etapa se optimiza para recall y
la segunda para precision" (en 15.39, El Limite del Reranking), pero no decia COMO se
compra cada una — que es el ancho del set de resultados. El embudo 1M -> 20-50 -> 3-5
ya estaba dibujado en 15.37 sin etiquetar por objetivo, asi que ahi va el mecanismo.

Para no decir lo mismo dos veces en diapositivas consecutivas, el fragment de 15.39 se
queda solo con la consecuencia accionable (si falta recall, se arregla la etapa 1),
que es su verdadero remate.

Idempotente: si ya esta aplicado, no hace nada.
'''
import io, sys

RUTA = "../index.html"

ANCLA = '<div class="flow-node" style="border-color: var(--c-green);">los 3–5<br>mejores</div>\n    </div>'

BLOQUE = ANCLA + '''
    <div class="columns" style="font-size: 0.4em; margin-top: 0.3em;">
      <div class="col">
        <p style="margin:0.1em 0; padding: 0.35em 0.55em; background: rgba(88,196,221,0.08); border-left: 3px solid var(--c-blue);">
          <strong style="color: var(--c-blue);">Etapa 1 → optimiza recall</strong><br>
          Devuelve un set <strong>amplio</strong>. Prefiere colar ruido antes que dejar algo
          relevante fuera: lo que no entra aquí <strong>deja de existir</strong> para el resto
          del pipeline.
        </p>
      </div>
      <div class="col">
        <p style="margin:0.1em 0; padding: 0.35em 0.55em; background: rgba(255,134,47,0.08); border-left: 3px solid var(--c-orange);">
          <strong style="color: var(--c-orange);">Etapa 2 → optimiza precisión</strong><br>
          Trabaja <strong>solo sobre lo que trajo la etapa 1</strong>: lo reordena y
          <strong>recorta el set</strong> a los 3–5 de arriba. No busca nada nuevo.
        </p>
      </div>
    </div>
    <p class="fragment fade-up" style="font-size: 0.39em; margin-top: 0.25em; color: var(--c-text-dim);">
      Es el mismo <code>k</code> de «Todo Depende de k»: <strong>ensanchar</strong> el set sube el
      recall y diluye la precisión; <strong>recortarlo</strong> hace lo contrario. Cada etapa se
      queda con el lado que le toca. <span style="color: var(--c-yellow);">Ojo:</span> recortar por sí solo ya
      sube la precisión —arriba suele haber mejores—, pero lo que la sube de verdad es que el
      cross-encoder haya reordenado <em>antes</em> del corte.'''

VIEJO_39 = '''      De ahí la regla práctica: la primera etapa se optimiza para <strong>recall</strong>
      (traer todo lo relevante, aunque venga con ruido) y la segunda para
      <strong>precisión</strong> (poner arriba lo bueno). Son dos objetivos distintos
      para dos etapas distintas.'''

NUEVO_39 = '''      De ahí la regla práctica: cuando falta <strong>recall</strong>, el arreglo está en la
      <strong>etapa 1</strong> — mejor chunking, búsqueda híbrida, otros embeddings o, lo más
      barato, <strong>traer más candidatos</strong>. Subir el reranker no rescata lo que
      nunca llegó.'''

NOTA_VIEJA = '''<aside class="notes">Fuente: RAG_M3 ("Purpose of Reranking", "Overview", "Cross-Encoder re-rankers"). La idea general —filtro barato y luego juez caro— aparece en muchos sistemas: es el mismo patron de una entrevista de trabajo con filtro de CV y luego entrevista tecnica.</aside>'''
NOTA_NUEVA = '''<aside class="notes">Fuente: RAG_M3 ("Purpose of Reranking", "Overview", "Cross-Encoder re-rankers"). La idea general —filtro barato y luego juez caro— aparece en muchos sistemas: es el mismo patron de una entrevista de trabajo con filtro de CV y luego entrevista tecnica.

      EL MECANISMO, que es lo que suele faltar: las dos etapas no solo usan modelos distintos, persiguen METRICAS distintas, y la palanca de ambas es el TAMANO DEL SET. La etapa 1 compra recall ensanchandolo (por eso 20-50 candidatos y no 5); la etapa 2 compra precision reordenando ese set y recortandolo a 3-5. Conecta directo con "Todo Depende de k" de la unidad anterior: subir k sube recall y diluye precision.

      MATIZ QUE CONVIENE DECIR EN VOZ ALTA: recortar el set ya sube la precision@k por si solo (arriba suele haber mejores), pero lo que la sube de verdad es que el reordenamiento haya subido lo relevante ANTES del corte. No tenemos medido cuanto aporta cada mitad por separado, asi que no se da un numero; lo que si esta medido es el efecto del reordenamiento completo (AP@4 0.688 -> 1.000, dos diapositivas mas adelante). Si se recorta sin reordenar, se estan tirando documentos al azar respecto de la relevancia. El numero medido que lo demuestra esta dos diapositivas mas adelante (AP@4 de 0.688 a 1.000).

      Y el reverso, que es "El Limite del Reranking": ensanchar la etapa 1 cuesta latencia del cross-encoder (crece lineal con los candidatos), asi que el set amplio no es gratis — es la decision de diseno del bloque.</aside>'''

doc = io.open(RUTA, encoding='utf-8').read()
if 'Etapa 1 → optimiza recall' in doc:
    sys.exit("ya estaba aplicado, no se toca nada")
for s in (ANCLA, VIEJO_39, NOTA_VIEJA):
    if doc.count(s) != 1:
        sys.exit("no encontre (o hay mas de uno): %r" % s[:60])
doc = doc.replace(ANCLA, BLOQUE).replace(VIEJO_39, NUEVO_39).replace(NOTA_VIEJA, NOTA_NUEVA)
io.open(RUTA, 'w', encoding='utf-8').write(doc)
print("15.37 etiquetada con el mecanismo; 15.39 ajustada para no repetirlo")
