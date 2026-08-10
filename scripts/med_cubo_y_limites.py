"""Mediciones de la unidad de embeddings: el cubo y los limites.

Produce los numeros de:
  - js/widgets/embedding-cube-widget.js  (coordenadas PCA y cosenos entre desplazamientos)
  - la diapositiva "Lo que el Embedding No Sabe Hacer"
  - la diapositiva "¿Que Significa Cada Dimension?" (la analogia rey-hombre+mujer)


Modelo: paraphrase-multilingual-MiniLM-L12-v2, el mismo que ya usa la unidad
(js/widgets/embeddings-data.js). Todo lo que termine en una diapositiva sale de aqui.
"""
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA

M = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")


def emb(xs):
    return M.encode(xs, normalize_embeddings=True)


def cos(a, b):
    return float(np.dot(a, b))


out = {}

# =====================================================================
# 1. Las seis palabras del cubo didactico, en el espacio REAL
# =====================================================================
PAL = ["hombre", "mujer", "rey", "reina", "león", "leona"]
E = emb(PAL)

print("=" * 66)
print("1. MATRIZ DE COSENOS (espacio real, 384 dimensiones)")
print("=" * 66)
print(f"{'':>8}" + "".join(f"{p:>9}" for p in PAL))
mat = []
for i, p in enumerate(PAL):
    fila = [round(cos(E[i], E[j]), 3) for j in range(len(PAL))]
    mat.append(fila)
    print(f"{p:>8}" + "".join(f"{v:>9.3f}" for v in fila))
out["cos_palabras"] = {"palabras": PAL, "matriz": mat}

# --- ¿son paralelos los desplazamientos masculino -> femenino? ---
print()
print("=" * 66)
print("2. ¿EL 'EJE DE SEXO' ES UNA SOLA DIRECCION?")
print("=" * 66)
pares = [("hombre", "mujer"), ("rey", "reina"), ("león", "leona")]
difs = {}
for a, b in pares:
    v = E[PAL.index(b)] - E[PAL.index(a)]
    difs[f"{a}->{b}"] = v / np.linalg.norm(v)
ks = list(difs)
parc = {}
for i in range(len(ks)):
    for j in range(i + 1, len(ks)):
        c = cos(difs[ks[i]], difs[ks[j]])
        parc[f"{ks[i]}  vs  {ks[j]}"] = round(c, 3)
        print(f"  cos({ks[i]:<14}, {ks[j]:<14}) = {c:+.3f}")
print("  (en el cubo didactico los tres valdrian exactamente +1.000)")
out["paralelismo"] = parc

# --- la analogia clasica ---
print()
print("=" * 66)
print("3. rey - hombre + mujer = ?")
print("=" * 66)
CAND = PAL + ["princesa", "monarca", "corona", "gato", "perro", "hombre lobo"]
EC = emb(CAND)
v = E[PAL.index("rey")] - E[PAL.index("hombre")] + E[PAL.index("mujer")]
v = v / np.linalg.norm(v)
rank = sorted(((cos(v, EC[i]), CAND[i]) for i in range(len(CAND))), reverse=True)
for c, p in rank[:6]:
    print(f"  {p:<14} {c:.3f}")
out["analogia"] = [[p, round(c, 3)] for c, p in rank[:6]]

# --- PCA a 3D de las seis palabras (para el widget) ---
p3 = PCA(n_components=3, random_state=0)
C3 = p3.fit_transform(E)
print()
print(f"varianza explicada por 3 componentes: {p3.explained_variance_ratio_.sum():.1%}")
print(f"  por componente: {[round(x,3) for x in p3.explained_variance_ratio_]}")
out["pca3d"] = {"palabras": PAL,
                "coords": [[round(float(x), 4) for x in fila] for fila in C3],
                "var": [round(float(x), 4) for x in p3.explained_variance_ratio_]}


# =====================================================================
# 4. LIMITACIONES
# =====================================================================
def experimento(titulo, consulta, docs, nota=""):
    q = emb([consulta])[0]
    D = emb(docs)
    r = sorted(((cos(q, D[i]), docs[i]) for i in range(len(docs))), reverse=True)
    print()
    print("=" * 66)
    print(titulo)
    print("=" * 66)
    print(f"  consulta: «{consulta}»")
    if nota:
        print(f"  {nota}")
    for c, t in r:
        print(f"    {c:.3f}  {t}")
    return {"consulta": consulta, "ranking": [[t, round(c, 3)] for c, t in r]}


out["nombres"] = experimento(
    "4a. NOMBRES PROPIOS",
    "vacaciones de Luis Gómez",
    ["Solicitud de vacaciones de Luis Gómez, aprobada",
     "Solicitud de vacaciones de Luis Pérez, aprobada",
     "Solicitud de vacaciones de Ana Gómez, aprobada",
     "Solicitud de vacaciones de Marta Rodríguez, aprobada"])

out["producto"] = experimento(
    "4b. PRODUCTOS ESPECIFICOS / VERSIONES",
    "manual del router XR-3000",
    ["Manual de instalación del router XR-3000",
     "Manual de instalación del router XR-2000",
     "Manual de instalación del router XR-3001",
     "Manual de instalación del switch SG-450"])

out["fechas"] = experimento(
    "4c. FECHAS Y RELACIONES ORDINALES",
    "reportes posteriores a 2022",
    ["Reporte trimestral del 15 de marzo de 2024",
     "Reporte trimestral del 15 de marzo de 2019",
     "Reporte trimestral del 20 de agosto de 2021",
     "Reporte trimestral del 8 de enero de 2026"],
    nota="lo correcto seria: 2026 y 2024 arriba; 2021 y 2019 fuera")

out["numeros"] = experimento(
    "4d. MAGNITUDES NUMERICAS",
    "servidores de menos de 1000 dólares al mes",
    ["El servidor cuesta 500 dólares al mes",
     "El servidor cuesta 5000 dólares al mes",
     "El servidor cuesta 50000 dólares al mes"],
    nota="lo correcto seria: solo el de 500")

# pares casi identicos: cuanto los distingue el modelo
print()
print("=" * 66)
print("4e. PARES QUE EL MODELO CASI NO DISTINGUE")
print("=" * 66)
PARES = [
    ("Reporte del 15 de marzo de 2024", "Reporte del 15 de marzo de 2019"),
    ("El servidor cuesta 500 dólares", "El servidor cuesta 50000 dólares"),
    ("Manual del router XR-3000", "Manual del router XR-2000"),
    ("Solicitud de Luis Gómez", "Solicitud de Luis Pérez"),
    ("Reunión del lunes", "Reunión del martes"),
]
par_out = []
for a, b in PARES:
    ea, eb = emb([a, b])
    c = cos(ea, eb)
    par_out.append([a, b, round(c, 3)])
    print(f"  {c:.3f}   «{a}»  vs  «{b}»")
print()
print("  referencia — dos frases de temas DISTINTOS:")
ea, eb = emb(["El gato duerme en el sofá", "La empresa reportó pérdidas trimestrales"])
ref = cos(ea, eb)
print(f"  {ref:.3f}   «El gato duerme en el sofá» vs «La empresa reportó pérdidas»")
out["pares"] = {"pares": par_out, "referencia": round(ref, 3)}

with open("med_emb.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("\nguardado -> med_emb.json")
