"""El punto de ELMo, medido: la MISMA palabra cambia de vector segun el contexto.

Se usa un modelo bidireccional que ya esta en cache (mDeBERTa-v3-base) y se
compara con lo que haria un embedding estatico tipo Word2Vec: el mismo
vector siempre, o sea coseno 1.000 pase lo que pase.
"""
import numpy as np, torch
from transformers import AutoTokenizer, AutoModel

NOMBRE = "MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7"
tok = AutoTokenizer.from_pretrained(NOMBRE)
mod = AutoModel.from_pretrained(NOMBRE).eval()

CASOS = [
    ("banco", [
        "Me senté en el banco del parque a leer",
        "El banco me negó el préstamo por mi historial",
        "El banco de arena bloqueaba la entrada al puerto",
    ]),
    ("planta", [
        "Regué la planta antes de salir de casa",
        "La planta de ensamblaje produce mil piezas por hora",
        "Me duele la planta del pie después de correr",
    ]),
]

def vector_palabra(frase, palabra):
    ent = tok(frase, return_tensors="pt")
    with torch.no_grad():
        h = mod(**ent).last_hidden_state[0]
    ids = ent["input_ids"][0]
    piezas = tok.convert_ids_to_tokens(ids)
    idx = [i for i, p in enumerate(piezas)
           if palabra in p.replace("▁", "").lower()]
    assert idx, (frase, piezas)
    v = h[idx].mean(0)
    return (v / v.norm()).numpy(), [piezas[i] for i in idx]

salida = {}
for palabra, frases in CASOS:
    print("=" * 70)
    print(f"«{palabra}» en {len(frases)} contextos")
    print("=" * 70)
    vs = []
    for f in frases:
        v, pz = vector_palabra(f, palabra)
        vs.append(v)
        print(f"  {f}")
        print(f"      piezas del tokenizador: {pz}")
    print()
    print("  cosenos entre los vectores contextuales de la MISMA palabra:")
    M = []
    for i in range(len(vs)):
        fila = [round(float(np.dot(vs[i], vs[j])), 3) for j in range(len(vs))]
        M.append(fila)
        print("     " + "  ".join(f"{v:6.3f}" for v in fila))
    salida[palabra] = {"frases": frases, "cos": M}
    print()
    print("  con un embedding ESTATICO los tres valdrian 1.000 (es el mismo vector)")
    print()

import json
json.dump(salida, open("contexto.json", "w"), ensure_ascii=False, indent=1)
print("guardado -> contexto.json")
