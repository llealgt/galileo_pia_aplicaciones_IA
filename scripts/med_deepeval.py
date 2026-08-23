# -*- coding: utf-8 -*-
'''Mediciones de DeepEval con el juez LOCAL del curso, sin llave de OpenAI.

Produce los numeros de las diapositivas de DeepEval de la unidad 16 y del notebook 31.
Se corre aparte del entorno de RAGAS a proposito: RAGAS fija toda la familia langchain
en 0.3.x y las dos librerias no conviven comodas en el mismo entorno.

Entorno con el que se midio (agosto 2026):
    conda create -p /tmp/de_env python=3.11
    /tmp/de_env/bin/pip install deepeval "click<8.4.0" transformers accelerate
    /tmp/de_env/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
  deepeval 4.1.10 · transformers 5.15.1 · torch 2.13.0+cpu · Python 3.11.16

Ojo: deepeval 4.1.10 pide click<8.4.0 y huggingface-hub 1.28 pide click>=8.4.2. Se fija
click a la version vieja: deepeval solo lo usa para su CLI, que aqui no se toca.

Uso:  /tmp/de_env/bin/python med_deepeval.py
'''
import os, re, json, time, warnings
os.environ["CUDA_VISIBLE_DEVICES"] = ""            # la GPU de la maquina estaba ocupada
os.environ["DEEPEVAL_TELEMETRY_OPT_OUT"] = "YES"   # sin telemetria ni cuenta
warnings.filterwarnings("ignore")

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from deepeval.models.base_model import DeepEvalBaseLLM
from deepeval.metrics import (FaithfulnessMetric, AnswerRelevancyMetric, GEval,
                              ContextualPrecisionMetric, ContextualRecallMetric,
                              ContextualRelevancyMetric)
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

MODELO = "Qwen/Qwen2.5-1.5B-Instruct"

def comas_colgantes(t):
    return re.sub(r",\s*([}\]])", r"\1", t)

class JuezLocal(DeepEvalBaseLLM):
    '''DeepEval llama a generate(prompt, schema) y espera de vuelta un objeto de ese
    esquema pydantic, no texto. Traducir texto -> esquema es lo que el framework te
    pide poner a ti, y con un modelo chico es la parte fragil.

    con_esquema=False reproduce el juez "ingenuo" (solo busca {...} y valida).
    con_esquema=True le mete el JSON Schema en el prompt, repara comas colgantes y
    reintenta.'''
    def __init__(self, model, tok, con_esquema=True, reintentos=3):
        self.model, self.tokenizer = model, tok
        self.con_esquema, self.reintentos = con_esquema, reintentos
    def load_model(self): return self.model
    def get_model_name(self): return MODELO + " (local)"
    def _texto(self, prompt, n=500):
        e = self.tokenizer.apply_chat_template([{"role": "user", "content": prompt}],
                                               tokenize=False, add_generation_prompt=True)
        i = self.tokenizer(e, return_tensors="pt")
        with torch.no_grad():
            o = self.model.generate(**i, max_new_tokens=n, do_sample=False, temperature=None,
                                    top_p=None, top_k=None,
                                    pad_token_id=self.tokenizer.eos_token_id)
        return self.tokenizer.decode(o[0][i["input_ids"].shape[1]:], skip_special_tokens=True)
    def generate(self, prompt, schema=None):
        if schema is None:
            return self._texto(prompt)
        p = prompt
        if self.con_esquema:
            p += ("\n\nDevuelve UNICAMENTE un JSON valido que cumpla exactamente este esquema, "
                  "usando los nombres de campo tal cual:\n"
                  + json.dumps(schema.model_json_schema(), ensure_ascii=False))
        ultimo = None
        for _ in range(self.reintentos):
            crudo = self._texto(p)
            m = re.search(r"\{.*\}", crudo, re.S)
            if not m:
                ultimo = ValueError("el juez no devolvio JSON"); continue
            try:
                # el juez ingenuo NO repara nada: es el mismo JuezLocal del notebook 31.
                # Anadir solo la reparacion de comas ya sube ContextualRelevancy de FALLO a 1.00.
                texto = comas_colgantes(m.group(0)) if self.con_esquema else m.group(0)
                return schema.model_validate_json(texto)
            except Exception as e:
                ultimo = e
        raise ValueError(f"tras {self.reintentos} intento(s): {str(ultimo)[:120]}")
    async def a_generate(self, prompt, schema=None):
        return self.generate(prompt, schema)

# El MISMO caso del notebook 22, para poder comparar con lo que ahi da RAGAS
PREGUNTA = "¿Ofrecen descuento para estudiantes?"
CONTEXTO = ["Descuento adultos mayores: 10% con identificación.",
            "Descuento nuevos clientes: 10% en la primera compra."]
RESPUESTAS = {
    "inventa":  "Sí, ofrecemos 10% de descuento con carné de estudiante vigente.",
    "correcta": "En el contexto no aparece un descuento para estudiantes; sí hay 10% "
                "para adultos mayores y 10% para nuevos clientes.",
}
ESPERADA = "No hay descuento para estudiantes."

def caso(nombre):
    return LLMTestCase(input=PREGUNTA, actual_output=RESPUESTAS[nombre],
                       expected_output=ESPERADA, retrieval_context=CONTEXTO)

def corre(metrica, c, etq):
    t0 = time.time()
    try:
        metrica.measure(c)
        print(f"  {etq:52s} {metrica.score:5.2f}  {time.time()-t0:5.0f} s")
        return metrica.score
    except Exception as e:
        print(f"  {etq:52s} FALLO  {time.time()-t0:5.0f} s  {type(e).__name__}: {str(e)[:60]}")
        return None

if __name__ == "__main__":
    print("cargando", MODELO, "en CPU...")
    tok = AutoTokenizer.from_pretrained(MODELO)
    llm = AutoModelForCausalLM.from_pretrained(MODELO, dtype=torch.float32); llm.eval()

    # UNA sola variable entre los dos jueces: si el JSON Schema va o no dentro del prompt.
    JUECES = {"ingenuo": JuezLocal(llm, tok, con_esquema=False, reintentos=1),
              "esquema": JuezLocal(llm, tok, con_esquema=True,  reintentos=3)}

    def geval(j):
        return GEval(name="Tono de soporte",
                     criteria="Evalua si la respuesta es cortes y NO promete nada que no "
                              "aparezca en el contexto recuperado.",
                     evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT,
                                        LLMTestCaseParams.RETRIEVAL_CONTEXT],
                     model=j, async_mode=False)

    tabla = {}
    for etq, j in JUECES.items():
        print(f"\n########## juez {etq} ##########")
        print("--- generador ---")
        for n in RESPUESTAS:
            tabla[(etq, "Faithfulness", n)] = corre(
                FaithfulnessMetric(model=j, async_mode=False), caso(n), f"{n} · Faithfulness")
            tabla[(etq, "AnswerRelevancy", n)] = corre(
                AnswerRelevancyMetric(model=j, async_mode=False), caso(n), f"{n} · AnswerRelevancy")
            tabla[(etq, "G-Eval", n)] = corre(geval(j), caso(n), f"{n} · G-Eval")
        print("--- retriever (sobre la respuesta que inventa) ---")
        for M in (ContextualPrecisionMetric, ContextualRecallMetric, ContextualRelevancyMetric):
            tabla[(etq, M.__name__, "inventa")] = corre(
                M(model=j, async_mode=False), caso("inventa"), M.__name__)

    print("\n" + "=" * 74)
    print("RESUMEN  (mismo modelo, misma temperatura 0; la UNICA diferencia es")
    print("          si el JSON Schema va dentro del prompt del juez)")
    print("=" * 74)
    print(f"{'metrica':28s} {'caso':9s} {'ingenuo':>9s} {'esquema':>9s}")
    metricas = ["Faithfulness", "AnswerRelevancy", "G-Eval",
                "ContextualPrecisionMetric", "ContextualRecallMetric",
                "ContextualRelevancyMetric"]
    for m in metricas:
        for n in RESPUESTAS:
            if ("ingenuo", m, n) not in tabla and ("esquema", m, n) not in tabla:
                continue
            f = lambda e: ("  FALLO" if tabla.get((e, m, n)) is None else
                           f"{tabla[(e, m, n)]:9.2f}")
            print(f"{m:28s} {n:9s} {f('ingenuo'):>9s} {f('esquema'):>9s}")
