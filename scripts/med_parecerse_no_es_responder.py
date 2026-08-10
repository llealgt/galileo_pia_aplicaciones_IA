"""Produce los numeros de "Parecerse No Es Contener la Respuesta"
y de "Por Eso se Reescribe la Consulta".

Contraejemplo: parecerse a la pregunta NO es contener la respuesta.

La consulta necesita dos saltos:
  gerente de ventas -> categoria B -> 25 dias
Ningun documento se parece a la pregunta completa, y el que MAS se parece
(el del procedimiento de solicitud) no sirve para responder.

Modelo: paraphrase-multilingual-MiniLM-L12-v2, el mismo de la unidad.
"""
import json
import numpy as np
from sentence_transformers import SentenceTransformer

M = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
enc = lambda xs: M.encode(xs, normalize_embeddings=True)

DOCS = [
    ("A", "El puesto de gerente de ventas pertenece a la categoría contractual B.", True),
    ("B", "Los empleados de categoría contractual B acumulan 25 días de vacaciones al año.", True),
    ("C", "Política de vacaciones: las solicitudes de vacaciones se envían con 15 días de anticipación.", False),
    ("D", "El gerente de ventas reporta directamente a la dirección comercial.", False),
    ("E", "Las vacaciones del personal de planta se programan en el calendario anual.", False),
    ("F", "Los empleados de categoría contractual A acumulan 18 días de vacaciones al año.", False),
]
IDS = [d[0] for d in DOCS]
TXT = [d[1] for d in DOCS]
ORO = {d[0] for d in DOCS if d[2]}
E = enc(TXT)

PREG = "¿cuántos días de vacaciones le tocan a un gerente de ventas?"


def rank(q, etiqueta):
    v = enc([q])[0]
    r = sorted(((float(np.dot(v, E[i])), IDS[i], TXT[i]) for i in range(len(TXT))), reverse=True)
    print(f"\n  consulta: «{q}»   [{etiqueta}]")
    for pos, (c, i, t) in enumerate(r, 1):
        marca = "★" if i in ORO else " "
        print(f"    {pos}. {marca} {c:.3f}  [{i}] {t[:66]}")
    return [(i, round(c, 3)) for c, i, t in r]


print("=" * 74)
print("1. LA CONSULTA TAL CUAL")
print("=" * 74)
base = rank(PREG, "sin reescribir")
pos_oro = {i: n for n, (i, _) in enumerate(base, 1)}
print(f"\n  los dos documentos necesarios (A y B) quedan en las posiciones "
      f"{pos_oro['A']} y {pos_oro['B']}")
print(f"  con top-2 recuperas: {[i for i, _ in base[:2]]}  -> "
      f"{'ALCANZA' if set(i for i,_ in base[:2]) >= ORO else 'NO ALCANZA para responder'}")

print()
print("=" * 74)
print("2. REESCRITURA: DOS SUB-CONSULTAS")
print("=" * 74)
subs = ["categoría contractual del puesto de gerente de ventas",
        "días de vacaciones al año de la categoría contractual B"]
unidos = []
for s in subs:
    r = rank(s, "sub-consulta")
    unidos.append(r[0][0])
print(f"\n  uniendo el top-1 de cada sub-consulta: {unidos}  -> "
      f"{'ALCANZA' if set(unidos) >= ORO else 'NO alcanza'}")

print()
print("=" * 74)
print("3. EXPANSION: MISMA PREGUNTA + VOCABULARIO DEL DOMINIO")
print("=" * 74)
exp = PREG + " categoría contractual, días acumulados al año"
r3 = rank(exp, "expandida")
print(f"\n  con top-2 recuperas: {[i for i, _ in r3[:2]]}  -> "
      f"{'ALCANZA' if set(i for i,_ in r3[:2]) >= ORO else 'NO alcanza'}")
print(f"  con top-3 recuperas: {[i for i, _ in r3[:3]]}  -> "
      f"{'ALCANZA' if set(i for i,_ in r3[:3]) >= ORO else 'NO alcanza'}")

json.dump({"docs": DOCS, "pregunta": PREG, "base": base,
           "subs": subs, "expandida": r3},
          open("med_rewrite.json", "w"), ensure_ascii=False, indent=1)
print("\nguardado -> med_rewrite.json")
