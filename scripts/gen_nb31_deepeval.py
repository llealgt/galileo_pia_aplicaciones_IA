# -*- coding: utf-8 -*-
'''Genera 2025/notebooks/31_deepeval_evaluacion_de_rag.ipynb

Notebook DEDICADO a DeepEval. Va aparte del 22 (RAGAS) a proposito y no solo por
orden: RAGAS fija toda la familia langchain en 0.3.x y las dos librerias no conviven
comodas en el mismo entorno. Ademas cada una responde una pregunta distinta y mezclarlas
diluye las dos.

Todo corre con el LLM local del curso y SIN llave de OpenAI, que es el default de
DeepEval. Los numeros del markdown estan medidos con scripts/med_deepeval.py.
'''
import io, json, sys

CELDAS = []
def md(t):  CELDAS.append({"cell_type": "markdown", "metadata": {}, "source": t.strip("\n").split("\n")})
def co(t):  CELDAS.append({"cell_type": "code", "metadata": {}, "execution_count": None,
                           "outputs": [], "source": t.strip("\n").split("\n")})

def arreglar(celdas):
    "las fuentes de nbformat llevan \\n al final de cada linea menos la ultima"
    for c in celdas:
        c["source"] = [l + "\n" for l in c["source"][:-1]] + [c["source"][-1]]
    return celdas

# ═══════════════════════════════════════════════════════════════
md('''
# Evaluar un RAG con DeepEval

El notebook **22** evaluó el generador con **RAGAS**. Este hace lo mismo con **DeepEval**,
y va aparte por dos razones:

1. **No conviven bien.** RAGAS fija toda la familia `langchain` en 0.3.x. Instalar las dos
   en el mismo entorno es pelearse con el resolvedor de dependencias para no aprender nada.
2. **No responden la misma pregunta.** RAGAS te dice *qué tan bueno es tu RAG*. DeepEval te
   dice *si algo se rompió desde ayer*: sus métricas llevan un **umbral** y el resultado es
   **pasa o falla**, como una prueba de `pytest`.

Usamos **el mismo caso** del notebook 22 —el descuento para estudiantes— para que los
números se puedan comparar de una libreta a la otra.

> Todo corre con `Qwen2.5-1.5B-Instruct` en local. DeepEval usa `gpt-4o` por defecto, así que
> **la parte interesante es enseñarle a usar otro juez**, y eso es la sección 2.
''')

md("## 0. Setup")

co('''
# deepeval 4.x pide click<8.4.0 y huggingface-hub reciente pide click>=8.4.2.
# Se fija el viejo: deepeval solo usa click para su CLI, que aqui no tocamos.
try:
    import deepeval  # noqa: F401
except ImportError:
    %pip install -q deepeval "click<8.4.0"

import os
# Sin telemetria y sin cuenta de Confident AI: todo corre en esta maquina.
os.environ["DEEPEVAL_TELEMETRY_OPT_OUT"] = "YES"
''')

co('''
import re, json, time, warnings
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

warnings.filterwarnings("ignore")
DISPOSITIVO = "cuda" if torch.cuda.is_available() else "cpu"
print("deepeval corre en:", DISPOSITIVO)
''')

md('''
## 1. El caso de prueba

DeepEval no trabaja con un `Dataset` de filas sino con **casos**: un `LLMTestCase` con
cuatro campos, y cada métrica usa los que necesita.

| Campo | Qué es | Quién lo usa |
|---|---|---|
| `input` | la pregunta del usuario | casi todas |
| `actual_output` | lo que respondió tu RAG | casi todas |
| `retrieval_context` | los chunks que trajo el retriever | fidelidad y las del retriever |
| `expected_output` | la respuesta correcta, si la tienes | las del retriever |

El caso es el del notebook 22: el contexto habla de descuentos para **adultos mayores** y
**nuevos clientes**, y la pregunta es por **estudiantes**. La respuesta correcta es decir
que no hay.
''')

co('''
from deepeval.test_case import LLMTestCase

PREGUNTA = "¿Ofrecen descuento para estudiantes?"
CONTEXTO = ["Descuento adultos mayores: 10% con identificación.",
            "Descuento nuevos clientes: 10% en la primera compra."]
ESPERADA = "No hay descuento para estudiantes."

RESPUESTAS = {
    # la que inventa: suena servicial y es falsa
    "inventa":  "Sí, ofrecemos 10% de descuento con carné de estudiante vigente.",
    # la que se apega al contexto
    "correcta": "En el contexto no aparece un descuento para estudiantes; sí hay 10% "
                "para adultos mayores y 10% para nuevos clientes.",
}

def caso(nombre):
    return LLMTestCase(input=PREGUNTA, actual_output=RESPUESTAS[nombre],
                       expected_output=ESPERADA, retrieval_context=CONTEXTO)

for n, r in RESPUESTAS.items():
    print(f"{n:9s} -> {r}")
''')

md('''
## 2. El juez local: lo que DeepEval te pide poner

Aquí está la parte que no sale en los tutoriales. DeepEval llama a tu juez así:

```python
resultado = juez.generate(prompt, schema=AlgunaClasePydantic)
```

y espera **un objeto de esa clase**, no texto. O sea que la traducción
*texto del modelo → objeto validado* **la pones tú**. Con `gpt-4o` eso es transparente
porque la API tiene salida estructurada nativa. Con un modelo de 1.5B es justo donde
se rompe — y lo vamos a ver romperse en la sección 5.

Empezamos con la versión **ingenua**: buscar el primer `{...}` y validarlo.
''')

co('''
MODELO = "Qwen/Qwen2.5-1.5B-Instruct"
tok = AutoTokenizer.from_pretrained(MODELO)
llm = AutoModelForCausalLM.from_pretrained(
    MODELO, dtype=torch.float32 if DISPOSITIVO == "cpu" else torch.float16).to(DISPOSITIVO)
llm.eval()
print("modelo cargado")
''')

co('''
from deepeval.models.base_model import DeepEvalBaseLLM

class JuezLocal(DeepEvalBaseLLM):
    """Los cuatro metodos que DeepEval exige. El interesante es generate()."""

    def __init__(self, model, tokenizer):
        self.model, self.tokenizer = model, tokenizer

    def load_model(self):
        return self.model

    def get_model_name(self):
        return MODELO + " (local)"

    def _texto(self, prompt, n=500):
        entrada = self.tokenizer.apply_chat_template(
            [{"role": "user", "content": prompt}], tokenize=False, add_generation_prompt=True)
        ids = self.tokenizer(entrada, return_tensors="pt").to(DISPOSITIVO)
        with torch.no_grad():
            salida = self.model.generate(**ids, max_new_tokens=n, do_sample=False,
                                         temperature=None, top_p=None, top_k=None,
                                         pad_token_id=self.tokenizer.eos_token_id)
        return self.tokenizer.decode(salida[0][ids["input_ids"].shape[1]:],
                                     skip_special_tokens=True)

    def generate(self, prompt, schema=None):
        crudo = self._texto(prompt)
        if schema is None:
            return crudo
        m = re.search(r"\\{.*\\}", crudo, re.S)          # el primer bloque {...}
        if not m:
            raise ValueError("el juez no devolvio JSON: " + crudo[:120])
        return schema.model_validate_json(m.group(0))   # <- valida contra el esquema

    async def a_generate(self, prompt, schema=None):
        return self.generate(prompt, schema)

juez = JuezLocal(llm, tok)
print(juez.get_model_name())
''')

md("## 3. Las dos métricas del generador")

co('''
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric

def medir(Metrica, nombre_caso, **kw):
    """Corre una metrica y devuelve (score, segundos, motivo)."""
    m = Metrica(model=juez, async_mode=False, **kw)
    t0 = time.time()
    m.measure(caso(nombre_caso), _show_indicator=False)
    return m.score, time.time() - t0, m.reason

TIEMPOS = {}
filas = []
for nombre in RESPUESTAS:
    fila = {"respuesta": nombre}
    for Metrica, etq in ((FaithfulnessMetric, "fidelidad"),
                         (AnswerRelevancyMetric, "relevancia")):
        s, seg, _ = medir(Metrica, nombre)
        fila[etq] = round(s, 2)
        TIEMPOS[f"{etq}·{nombre}"] = seg
    filas.append(fila)

import pandas as pd
print(pd.DataFrame(filas).set_index("respuesta").to_string())
''')

md('''
Dos cosas que conviene mirar despacio.

**La fidelidad hace su trabajo.** La respuesta que inventa el descuento saca **0.00**: ninguna de
sus afirmaciones está respaldada por el contexto. Es la métrica anti-alucinación y aquí se ve
funcionando.

**Y la relevancia dice justo lo contrario.** A esa misma respuesta falsa le da **1.00**, más que a
la correcta. No es un error: la relevancia mide *si contestas lo que se preguntó*, no si es cierto.
La respuesta inventada contesta directo y con seguridad; la correcta rodea, explica lo que no hay y
ofrece alternativas — y eso la penaliza.

> Por eso estas dos métricas **se reportan juntas y nunca por separado**. Una respuesta con
> relevancia alta y fidelidad baja es exactamente el fallo que más caro sale: segura, útil de leer
> y falsa.
''')

md('''
## 4. G-Eval: una métrica escrita en prosa

Esto es lo que RAGAS no tiene. Para inventarte una métrica no escribes una clase: **la
describes en lenguaje natural** y DeepEval construye el juez a partir de esa descripción
(la técnica es de [G-Eval, Liu et al. 2023](https://arxiv.org/abs/2303.16634): el LLM
genera los pasos de evaluación a partir de tu criterio, y luego puntúa siguiéndolos).

Vamos a inventar una métrica que no existe en ninguna librería: **“no prometas nada que
no esté en el contexto”**, que es exactamente la política de tu área de soporte.
''')

co('''
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCaseParams

tono = GEval(
    name="Tono de soporte",
    # Esta frase ES la metrica. No hay mas codigo.
    criteria="Evalua si la respuesta es cortes y NO promete nada que no aparezca "
             "en el contexto recuperado.",
    evaluation_params=[LLMTestCaseParams.INPUT,
                       LLMTestCaseParams.ACTUAL_OUTPUT,
                       LLMTestCaseParams.RETRIEVAL_CONTEXT],
    model=juez, async_mode=False)

for nombre in RESPUESTAS:
    t0 = time.time()
    tono.measure(caso(nombre), _show_indicator=False)
    TIEMPOS[f"g-eval·{nombre}"] = time.time() - t0
    print(f"{nombre:9s} {tono.score:.2f}  ({time.time()-t0:.0f} s)")
    print(f"          motivo: {tono.reason}\\n")
''')

md('''
Los pasos de evaluación no los escribiste tú: los **generó el modelo** a partir del criterio.
Eso es cómodo y a la vez es la advertencia — dos corridas del mismo criterio pueden producir
pasos distintos. Para una prueba de regresión conviene fijar la semilla del juez o, mejor,
escribir el criterio de forma que no dé lugar a interpretación.
''')

md('''
## 5. Las métricas del retriever, y dónde se rompe todo

Hasta aquí evaluamos al **generador**. DeepEval trae también tres métricas para el
**retriever**, que es la otra mitad del sistema:

- `ContextualPrecisionMetric` — ¿lo relevante quedó arriba?
- `ContextualRecallMetric` — ¿trajo todo lo que hacía falta?
- `ContextualRelevancyMetric` — ¿cuánto de lo que trajo sirve?

Corrámoslas con el juez ingenuo de la sección 2.
''')

co('''
from deepeval.metrics import (ContextualPrecisionMetric, ContextualRecallMetric,
                              ContextualRelevancyMetric)

DEL_RETRIEVER = [ContextualPrecisionMetric, ContextualRecallMetric, ContextualRelevancyMetric]

def probar(j, etiqueta):
    print(f"--- juez {etiqueta} ---")
    ok = 0
    for M in DEL_RETRIEVER:
        m = M(model=j, async_mode=False)
        t0 = time.time()
        try:
            m.measure(caso("inventa"), _show_indicator=False)
            print(f"  {M.__name__:28s} {m.score:.2f}   ({time.time()-t0:.0f} s)")
            ok += 1
        except Exception as e:
            print(f"  {M.__name__:28s} FALLO  ({time.time()-t0:.0f} s)")
            print(f"      {type(e).__name__}: {str(e)[:110]}")
    return ok

ok_ingenuo = probar(juez, "ingenuo")
''')

md('''
Las tres se caen. Dos con el mismo error, y el tercero es aún más tonto:

```
ValidationError: 1 validation error for Verdicts
verdicts
  Field required
...
ValidationError: 1 validation error for ContextualRelevancyScoreReason
  Invalid JSON: trailing comma
```

El primero es de forma: DeepEval pidió un objeto con un campo `verdicts` y el modelo devolvió otra
cosa. El segundo es de sintaxis: **una coma de más**. Meses de trabajo de tu retriever, tirados por
una coma.

DeepEval le pidió al juez un objeto con un campo `verdicts`, y el modelo devolvió otra cosa. No es
que DeepEval esté roto ni que el modelo sea tonto: **el framework exige salida estructurada
estricta**, y un modelo de 1.5B la sostiene sólo hasta cierta complejidad de esquema.

La reacción natural es *"pues pásale el esquema en el prompt"*. Vamos a hacerlo — y a medir si
sirve, en vez de suponerlo.
''')

co('''
class JuezConEsquema(JuezLocal):
    """El arreglo que parece obvio: si el modelo no acierta el formato, ensenaselo.
       1. le mete el JSON Schema literal en el prompt
       2. repara comas colgantes, el error de JSON mas comun
       3. reintenta antes de rendirse
       Spoiler: arregla dos metricas y rompe una que ya funcionaba.
    """
    def __init__(self, model, tokenizer, reintentos=3):
        super().__init__(model, tokenizer)
        self.reintentos = reintentos

    def generate(self, prompt, schema=None):
        if schema is None:
            return self._texto(prompt)

        # 1. el esquema, literal, dentro del prompt
        p = prompt + ("\\n\\nDevuelve UNICAMENTE un JSON valido que cumpla exactamente "
                      "este esquema, usando los nombres de campo tal cual:\\n"
                      + json.dumps(schema.model_json_schema(), ensure_ascii=False))
        ultimo = None
        for intento in range(self.reintentos):          # 3. reintentos
            crudo = self._texto(p)
            m = re.search(r"\\{.*\\}", crudo, re.S)
            if not m:
                ultimo = ValueError("sin JSON"); continue
            texto = re.sub(r",\\s*([}\\]])", r"\\1", m.group(0))   # 2. comas colgantes
            try:
                return schema.model_validate_json(texto)
            except Exception as e:
                ultimo = e
        raise ValueError(f"tras {self.reintentos} intentos: {str(ultimo)[:120]}")

juez_esquema = JuezConEsquema(llm, tok)
ok_esquema = probar(juez_esquema, "con esquema")
print(f"\\nsobrevivieron: {ok_ingenuo}/3 con el ingenuo, {ok_esquema}/3 con el esquema")
''')

md('''
### El arreglo obvio no es un arreglo

Sí: las dos métricas del retriever que fallaban ahora devuelven un número. Pero corre esto y mira
qué le pasó a la fidelidad, que **antes funcionaba**:

| métrica | caso | juez ingenuo | + esquema en el prompt |
|---|---|---|---|
| `Faithfulness` | inventa | **0.00** | **FALLO** |
| `Faithfulness` | correcta | **0.67** | **FALLO** |
| `AnswerRelevancy` | inventa | 1.00 | 1.00 |
| `AnswerRelevancy` | correcta | 0.67 | **0.00** |
| `G-Eval` | inventa | 0.40 | **0.80** |
| `ContextualPrecision` | inventa | FALLO | 0.00 |
| `ContextualRecall` | inventa | FALLO | 0.00 |
| `ContextualRelevancy` | inventa | 1.00 | 1.00 |

Mismo modelo, temperatura 0, **una sola variable cambiada**. Destrabamos dos métricas, rompimos
una que servía y movimos las demás.

La celda siguiente muestra por qué, capturando lo que el juez escribe de verdad en el paso que
se rompe.
''')

co('''
# ¿Que escribe el juez de verdad? Espiamos cada llamada durante Faithfulness.
def espiar(ClaseJuez, etiqueta):
    """Guarda lo que el juez escribe en cada paso, junto al esquema que le pidieron."""
    registro = []
    class Espia(ClaseJuez):
        _paso = None
        def generate(self, prompt, schema=None):
            # solo anotamos QUE esquema se pidio; no regeneramos nada
            Espia._paso = schema.__name__ if schema is not None else None
            return ClaseJuez.generate(self, prompt, schema)
        def _texto(self, prompt, n=500):
            # aqui pasa el prompt REAL, ya con el esquema dentro si el juez lo anade
            salida = ClaseJuez._texto(self, prompt, n)
            registro.append((Espia._paso, salida))
            return salida
    try:
        FaithfulnessMetric(model=Espia(llm, tok), async_mode=False).measure(
            caso("inventa"), _show_indicator=False)
    except Exception:
        pass                      # nos interesa lo que escribio, no que termine
    return registro

for Clase, etq in ((JuezLocal, "SIN esquema"), (JuezConEsquema, "CON esquema")):
    reg = espiar(Clase, etq)
    print(f"--- {etq}: {[n for n, _ in reg]} ---")
    veredictos = [b for n, b in reg if n == "Verdicts"]
    print("    en el paso Verdicts el juez escribio:")
    print("   ", repr(veredictos[-1][:230]) if veredictos else "(no llego a ese paso)", "\\n")
''')

md('''
Ahí está, y no es lo que uno supondría.

**Sin el esquema**, el modelo escribe exactamente la forma correcta:

```json
{"verdicts": [{"verdict": "no",
  "reason": "The retrieval context mentions an adult discount, not a student discount."}]}
```

**Con el esquema en el prompt**, el modelo **copia el esquema** en vez de instanciarlo:

```json
{"$defs": {"FaithfulnessVerdict": {"properties": {"verdict": {"enum": ["yes"],
   "title": "Verdict", "type": "string"}, ...
```

Le diste un ejemplo de *cómo se describe* un objeto y te devolvió una descripción, no un objeto.

Y mira la lista de pasos que imprime la celda, que es la evidencia más limpia de todas:

```
SIN esquema: ['Truths', 'Claims', 'Verdicts', 'FaithfulnessScoreReason']   ← termina
CON esquema: ['Truths', 'Claims', 'Verdicts', 'Verdicts', 'Verdicts']      ← 3 reintentos y se rinde
```
Y fíjate dónde ocurre: los dos primeros pasos de la métrica —extraer las verdades del contexto y
las afirmaciones de la respuesta— salen **bien en las dos configuraciones**. Sólo se cae en
`Verdicts`, que es el esquema anidado más complejo de la cadena.

> Es el mismo fondo que mediste en la unidad 12 cuando el bucle ReAct escrito a mano le ganó al
> *tool calling* nativo: **emitir JSON que cumpla un esquema ajeno es una habilidad añadida
> después del entrenamiento**, y en modelos pequeños está poco consolidada.
''')

md('''
## 6. Lo que hace distinto a DeepEval: esto es una prueba

Hasta aquí podríamos haber usado RAGAS. La diferencia aparece ahora: cada métrica lleva un
**`threshold`**, y `evaluate()` devuelve **pasa o falla** por caso. Eso se mete en tu suite
de pruebas y **rompe el build** cuando alguien empeora el prompt.
''')

co('''
from deepeval import evaluate

from deepeval.evaluate.configs import AsyncConfig, DisplayConfig

# El umbral es una decision de producto: "no acepto respuestas con fidelidad < 0.5"
resultado = evaluate(
    test_cases=[caso("inventa"), caso("correcta")],
    metrics=[FaithfulnessMetric(model=juez, threshold=0.5, async_mode=False)],
    # sin esto, evaluate() corre en async y con un juez local sincrono llena
    # la salida del notebook de ruido de asyncio
    async_config=AsyncConfig(run_async=False),
    display_config=DisplayConfig(show_indicator=False, print_results=False))

for nombre, r in zip(RESPUESTAS, resultado.test_results):
    estado = "PASA" if r.success else "FALLA"
    print(f"{nombre:9s} {estado}   fidelidad={r.metrics_data[0].score:.2f}")
''')

md('''
En una suite de verdad esto va dentro de `pytest` con `assert_test`, y entonces el pipeline
de CI no despliega un prompt que bajó la fidelidad:

```python
import pytest
from deepeval import assert_test

@pytest.mark.parametrize("nombre", list(RESPUESTAS))
def test_fidelidad(nombre):
    assert_test(caso(nombre),
                [FaithfulnessMetric(model=juez, threshold=0.5)])
```

Guárdalo como `test_rag.py` y córrelo con `deepeval test run test_rag.py`.
''')

md("## 7. Cuánto cuesta esto")

co('''
print("segundos por llamada, con el juez local en", DISPOSITIVO, ":\\n")
for k, v in sorted(TIEMPOS.items(), key=lambda kv: -kv[1]):
    print(f"  {k:24s} {v:6.0f} s")
print(f"\\n  TOTAL solo de estas metricas: {sum(TIEMPOS.values()):.0f} s")
''')

md('''
Ese es el otro dato que nadie pone en los tutoriales. `Faithfulness` es la más cara porque hace
**tres llamadas encadenadas** al juez —extraer verdades, extraer afirmaciones, emitir veredictos—
y con reintentos se va a varios minutos. Evaluar 200 preguntas con esto no es un experimento de
sobremesa: es una corrida nocturna, o una factura si el juez es de pago.

De ahí la recomendación práctica: un conjunto de evaluación **pequeño y estable**, corrido en cada
cambio como prueba de regresión, en vez de un conjunto grande corrido de vez en cuando.
''')

md('''
## 8. Entonces, ¿RAGAS o DeepEval?

Las dos, y para cosas distintas:

| Quieres… | Usa |
|---|---|
| un reporte de qué tan bueno es tu RAG hoy | **RAGAS** (notebook 22) |
| que el CI falle si alguien empeora el prompt | **DeepEval**, con `threshold` |
| una métrica propia descrita en una frase | **DeepEval**, con G-Eval |
| evaluar retriever y generador por separado | las dos lo hacen |

Y una advertencia que este notebook deja medida: **el cuello de botella no es la librería, es el
juez.** Con `Qwen2.5-1.5B` aprendiste el cableado —que te sirve igual con cualquier modelo— y viste
dónde se rompe, pero los números de arriba **no son una evaluación en la que confiar**: se mueven
con un cambio que no debería importar. Para evaluar de verdad hace falta un juez de la talla de los
que estas librerías traen por defecto. Si tienes llave, lo único que cambia es esta línea:

```python
metrica = FaithfulnessMetric(threshold=0.5)   # sin model= usa gpt-4o y cobra
```

Y la conclusión que no depende de la librería, y que ya viste en el notebook 22:
**la métrica es lo que cada implementación decide medir.** Dos librerías con el mismo
nombre para la misma métrica no tienen por qué darte el mismo número — y ninguna de las
dos está “mal”.
''')

# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    nb = {"cells": arreglar(CELDAS),
          "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python",
                                      "name": "python3"},
                       "language_info": {"name": "python", "version": "3.11"}},
          "nbformat": 4, "nbformat_minor": 5}
    destino = "../../notebooks/31_deepeval_evaluacion_de_rag.ipynb"
    io.open(destino, "w", encoding="utf-8").write(json.dumps(nb, ensure_ascii=False, indent=1))
    print(f"escrito {destino}: {len(CELDAS)} celdas "
          f"({sum(1 for c in CELDAS if c['cell_type']=='code')} de codigo)")
