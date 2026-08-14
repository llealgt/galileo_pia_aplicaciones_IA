"""Genera js/widgets/semantic-search-data.js con datos MEDIDOS."""
import numpy as np, io, re
from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE

src = io.open("med_busqueda.py", encoding="utf-8").read()
exec(src[src.index("DOCS = ["):src.index("textos = [d[0]")])

M = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
enc = lambda xs: M.encode(xs, normalize_embeddings=True)
textos = [d[0] for d in DOCS]; temas = [d[1] for d in DOCS]
ED, EQ = enc(textos), enc(CONSULTAS)
E = np.vstack([ED, EQ]); nd = len(ED)
SIM = EQ @ ED.T

D = 1 - (E @ E.T); np.fill_diagonal(D, 0); D = np.clip(D, 0, None)
C = TSNE(n_components=2, perplexity=5, random_state=0, init="random",
         metric="precomputed").fit_transform(D)
lo, hi = C.min(0), C.max(0)
C = (C - lo) / (hi - lo)
CD, CQ = C[:nd], C[nd:]

# los primeros 8 valores del vector de la primera consulta, para la animacion
muestra = [round(float(v), 3) for v in EQ[0][:8]]

L = []
L.append("// ============================================================")
L.append("// Datos del widget de busqueda semantica  (GENERADO, no editar a mano)")
L.append("// scripts/gen_semantic_search_data.py")
L.append("//")
L.append("// 13 documentos de 4 temas y 5 consultas, codificados con")
L.append("// paraphrase-multilingual-MiniLM-L12-v2 (384 dim).")
L.append("//")
L.append("// Las coordenadas son t-SNE (perplexity 5, semilla 0) sobre la matriz")
L.append("// de distancias coseno. La proyeccion NO se eligio a ojo: se probaron")
L.append("// PCA, MDS con 5 semillas y t-SNE con 3 perplejidades, y se midio en")
L.append("// cada una cuanto coincide el vecino mas cercano DEL DIBUJO con el")
L.append("// vecino mas cercano REAL. Resultados: PCA 40 % de aciertos en top-1,")
L.append("// MDS 60-80 %, t-SNE p5 100 % (y 93 % de solape en top-3, 100 % de")
L.append("// pureza por tema). Por eso el dibujo se puede leer sin mentir.")
L.append("//")
L.append("// Los puntajes que muestra el widget son los cosenos REALES en 384")
L.append("// dimensiones, no la distancia del dibujo.")
L.append("// ============================================================")
L.append("")
L.append("const BUSQ_DOCS = [")
for i in range(nd):
    L.append(f"  {{ t: {textos[i]!r}, tema: {temas[i]!r}, "
             f"x: {CD[i][0]:.4f}, y: {CD[i][1]:.4f} }},".replace("'", '"'))
L.append("];")
L.append("")
L.append("const BUSQ_CONSULTAS = [")
for i in range(len(CONSULTAS)):
    sims = ", ".join(f"{v:.3f}" for v in SIM[i])
    L.append(f"  {{ t: {CONSULTAS[i]!r}, x: {CQ[i][0]:.4f}, y: {CQ[i][1]:.4f},".replace("'", '"'))
    L.append(f"    sim: [{sims}] }},")
L.append("];")
L.append("")
L.append("// primeros 8 de los 384 numeros del vector de la consulta 1, para la animacion")
L.append(f"const BUSQ_MUESTRA_VECTOR = {muestra};")
out = "\n".join(L) + "\n"
io.open("semantic-search-data.js", "w", encoding="utf-8").write(out)
print(out[:600])
print("...")
print(f"docs={nd} consultas={len(CONSULTAS)}")
