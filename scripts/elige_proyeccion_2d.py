"""Elige la proyeccion 2D midiendo, no a ojo.

Criterio: que el vecino mas cercano EN EL DIBUJO coincida con el vecino mas
cercano REAL (coseno en 384 dim), para las 5 consultas y para los 13
documentos. Se prueban PCA, MDS metrico y t-SNE con varias semillas.
"""
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.decomposition import PCA
from sklearn.manifold import MDS, TSNE

DOCS = [
    ("Sofreír la cebolla a fuego bajo hasta que quede transparente",  "cocina"),
    ("La masa necesita reposar una hora antes de estirarla",          "cocina"),
    ("Sazonar la carne con sal gruesa media hora antes",              "cocina"),
    ("El horno debe precalentarse a 180 grados",                      "cocina"),

    ("El delantero marcó de cabeza en el minuto ochenta",             "fútbol"),
    ("El árbitro expulsó al defensa por doble amarilla",              "fútbol"),
    ("El equipo cambió a una defensa de tres centrales",              "fútbol"),

    ("Júpiter tiene al menos noventa lunas confirmadas",              "astronomía"),
    ("La luz de esa estrella tardó cuatro años en llegarnos",         "astronomía"),
    ("El telescopio capta longitudes de onda infrarrojas",            "astronomía"),

    ("Conviene apartar tres meses de gastos como fondo de emergencia", "finanzas"),
    ("El interés compuesto favorece a quien empieza temprano",         "finanzas"),
    ("Diversificar reduce el riesgo de una sola inversión",           "finanzas"),
]

CONSULTAS = [
    "¿cómo preparo la salsa?",
    "resultado del partido de ayer",
    "cuántos satélites tiene el planeta más grande",
    "quiero empezar a ahorrar",
    "¿por qué me sancionaron con tarjeta?",
]

M = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
enc = lambda xs: M.encode(xs, normalize_embeddings=True)
textos = [d[0] for d in DOCS]; temas = [d[1] for d in DOCS]
ED, EQ = enc(textos), enc(CONSULTAS)
E = np.vstack([ED, EQ]); nd = len(ED)
SIM = EQ @ ED.T

def evaluar(C):
    """% de aciertos: top-1 y top-3 visuales contra los reales."""
    CD, CQ = C[:nd], C[nd:]
    ok1 = ok3 = 0
    for i in range(len(CQ)):
        d = np.linalg.norm(CD - CQ[i], axis=1)
        vis = np.argsort(d); real = np.argsort(-SIM[i])
        if vis[0] == real[0]: ok1 += 1
        ok3 += len(set(vis[:3]) & set(real[:3])) / 3
    # ademas: los documentos del mismo tema deben quedar juntos
    puro = 0
    for j in range(nd):
        d = np.linalg.norm(CD - CD[j], axis=1); d[j] = 1e9
        puro += temas[np.argmin(d)] == temas[j]
    return ok1 / len(CQ), ok3 / len(CQ), puro / nd

cands = {}
cands["PCA"] = PCA(n_components=2, random_state=0).fit_transform(E)
D = 1 - (E @ E.T)
np.fill_diagonal(D, 0); D = np.clip(D, 0, None)
for seed in (0, 1, 2, 3, 4):
    cands[f"MDS s{seed}"] = MDS(n_components=2, dissimilarity="precomputed",
                                random_state=seed, normalized_stress="auto",
                                n_init=8, max_iter=800).fit_transform(D)
for perp in (3, 5, 8):
    for seed in (0, 1, 2):
        cands[f"tSNE p{perp} s{seed}"] = TSNE(n_components=2, perplexity=perp,
                                              random_state=seed, init="random",
                                              metric="precomputed").fit_transform(D)

print(f"{'proyeccion':<16} {'top1':>6} {'top3':>6} {'temas':>7}  score")
mejor = None
for k, C in sorted(cands.items()):
    a, b, c = evaluar(C)
    sc = a + b + c
    print(f"{k:<16} {a:>6.0%} {b:>6.0%} {c:>7.0%}  {sc:.3f}")
    if mejor is None or sc > mejor[1]: mejor = (k, sc, C)
print(f"\nMEJOR: {mejor[0]}  (score {mejor[1]:.3f})")
np.save("coords.npy", mejor[2])
open("mejor.txt", "w").write(mejor[0])
