"""Genera 30_tarea_embeddings_busqueda_selfquery.ipynb (y su version resuelta)."""
import json, io, sys

RESUELTO = "--resuelto" in sys.argv
celdas = []
def md(t):   celdas.append({"cell_type": "markdown", "metadata": {}, "source": t.strip("\n").split("\n")})
def code(t): celdas.append({"cell_type": "code", "metadata": {}, "execution_count": None,
                            "outputs": [], "source": t.strip("\n").split("\n")})
def tarea(sin, con): code(con if RESUELTO else sin)
def _fix(c):
    s = c["source"]; c["source"] = [l + "\n" for l in s[:-1]] + [s[-1]]; return c

md(r"""
# Tarea: Embeddings, Búsqueda Semántica y Self-Query

**Universidad Galileo — IA para Aplicaciones del Mundo Real**
**Unidad 10 · Embeddings y Búsqueda Semántica**

## Qué vas a construir

Un buscador sobre un catálogo de películas que entiende lo que le pides **aunque no uses sus
palabras**, y que además sabe separar la parte semántica de la parte que es un filtro.

Al terminar vas a tener medido, con tus propios números:

1. qué le pasa al coseno con textos parecidos, **opuestos** y sin relación,
2. si los grupos semánticos aparecen solos al proyectar a 2D,
3. cómo se busca por vecinos más cercanos,
4. por qué el orden entre filtrar y buscar **cambia el resultado**,
5. y cómo un LLM parte una pregunta en `query` + `filtros`.

## Lo que ya está hecho (no lo toques)

- El catálogo de películas con su metadata
- La carga del modelo de embeddings y del LLM
- Todas las gráficas
- El reporte final

## Lo que tienes que implementar

Seis bloques marcados con `# TU CODIGO AQUI`. Cada uno va seguido de una celda de verificación
con `assert`: si pasa, puedes seguir.

## Cómo se entrega

*Entorno de ejecución → Reiniciar y ejecutar todo*, y que corra de principio a fin sin errores.
Las **tres preguntas escritas** cuentan igual que el código: se responden en la celda de texto que
está debajo de cada una, con los números que tú mediste.

> **El catálogo está en inglés a propósito.** El modelo `all-MiniLM-L6-v2` es un modelo de inglés y
> queremos medir el comportamiento del embedding, no pelear con el idioma. Tu código, tus comentarios
> y tus respuestas van en español.

---
""")

md(r"""
## 0. Preparación (dado)
""")

code(r"""
try:
    import sentence_transformers, sklearn  # noqa: F401
except ImportError:
    %pip install -q sentence-transformers scikit-learn

import json, re, textwrap
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sentence_transformers import SentenceTransformer

OKABE = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9", "#F0E442"]
np.random.seed(0)

modelo = SentenceTransformer("all-MiniLM-L6-v2")
print("modelo cargado ·", modelo.get_sentence_embedding_dimension(), "dimensiones")
""")

code(r"""
# ---- el catálogo (dado) ----
CATALOGO = [
 # --- science fiction ---
 ("Echoes of Tomorrow","science fiction",2019,7.8,124,"English","A physicist discovers that every choice she makes splits reality into a new timeline."),
 ("The Last Signal","science fiction",2021,8.1,138,"English","Astronauts receive a transmission from a probe that was lost forty years earlier."),
 ("Silicon Dawn","science fiction",2016,6.9,111,"English","An engineer realizes the assistant she built has started rewriting its own goals."),
 ("Orbital Decay","science fiction",2023,7.2,129,"English","A repair crew is stranded when their station begins falling out of orbit."),
 ("Paper Suns","science fiction",1998,7.5,142,"Japanese","In a city under an artificial sky, a technician questions who controls the weather."),
 ("Vanishing Point Nine","science fiction",2012,6.4,98,"English","A pilot keeps waking up on the same doomed flight with slightly different crew."),
 ("The Copenhagen Protocol","science fiction",2020,8.4,151,"English","Two scientists must decide whether to publish a discovery that could end scarcity."),
 ("Grain of the Void","science fiction",2005,7.0,117,"French","A cartographer maps a region of space where distance stops behaving normally."),
 ("Third Body Problem","science fiction",2024,8.7,161,"English","First contact arrives as a mathematical proof nobody on Earth can finish."),
 # --- horror ---
 ("The Quiet Floor","horror",2018,6.8,96,"English","A night nurse notices that one hospital wing is never listed on any schedule."),
 ("Hollow Season","horror",2022,7.4,104,"English","A family returns to a lake house where the water level never changes."),
 ("Salt and Ash","horror",2015,6.1,88,"Spanish","A fishing village burns its records every decade and no one remembers why."),
 ("Static Hour","horror",2009,5.7,92,"English","A radio host starts receiving calls from listeners who died years earlier."),
 ("The Lending Library","horror",2023,7.9,109,"Korean","Every book returned to this library comes back with an extra chapter."),
 ("Beneath the Orchard","horror",2001,6.5,101,"English","Two brothers dig up their family's land and find the harvest was never plants."),
 ("Nine Nights of Rain","horror",2020,7.1,113,"Japanese","A storm traps a film crew in a shrine that appears on no map."),
 ("The Long Hallway","horror",2013,6.3,94,"English","A hotel corridor gets longer every night and the guests stop leaving."),
 ("Cellar Door","horror",2024,7.6,99,"Spanish","A locked basement in a new house answers when someone knocks twice."),
 # --- comedy ---
 ("Tax Season","comedy",2017,7.3,95,"English","An auditor and a con artist accidentally swap client folders and lives."),
 ("The Understudy","comedy",2021,6.6,102,"English","A stagehand is forced on stage and turns out to be a much better lead."),
 ("Wedding by Committee","comedy",2013,6.2,108,"Spanish","Four siblings plan their mother's third wedding with four incompatible visions."),
 ("Return Policy","comedy",2019,7.7,91,"English","A store clerk tries to return a decision he made fifteen years ago."),
 ("Two Left Feet","comedy",2004,6.0,97,"English","A dance instructor who cannot dance must win a competition to save the studio."),
 ("The Group Project","comedy",2023,7.5,88,"English","Five strangers must finish an assignment none of them signed up for."),
 ("Neighbors Downstairs","comedy",2011,6.7,99,"French","A composer and a drummer wage a polite war through a very thin ceiling."),
 ("Overqualified","comedy",2022,7.1,94,"English","A retired surgeon takes a job at a coffee shop and cannot stop diagnosing customers."),
 ("The Reunion Committee","comedy",2008,6.4,105,"English","Old classmates discover none of them remembers high school the same way."),
 # --- documentary ---
 ("The Long Count","documentary",2018,8.2,118,"English","Statisticians spend a decade recounting a census nobody believed the first time."),
 ("Cold Storage","documentary",2020,7.9,96,"English","Inside the seed vaults built to outlive the institutions that funded them."),
 ("Paper Trails","documentary",2016,8.0,124,"English","How a single misfiled form changed immigration policy for a generation."),
 ("The Repair Shop Wars","documentary",2022,7.4,88,"English","Volunteers fight manufacturers for the right to fix what they already own."),
 ("Salt Roads","documentary",2014,8.5,132,"Spanish","Following the trade routes that shaped three continents, told through cooks."),
 ("Signal to Noise","documentary",2021,7.6,105,"English","Why most published findings in one field could not be reproduced."),
 ("The Quiet Grid","documentary",2023,8.3,110,"English","Engineers keep a national power grid stable with tools older than they are."),
 ("Two Degrees","documentary",2019,8.1,101,"French","Glaciologists drill ice cores that record every summer for eight hundred years."),
 ("The Last Mile","documentary",2024,7.7,93,"Korean","How packages actually reach a door, told by the people who carry them."),
 # --- drama ---
 ("Winter Term","drama",2015,8.1,127,"English","A teacher and a student both fail the same exam, for very different reasons."),
 ("The Inheritance Clause","drama",2019,7.8,141,"English","Three siblings discover their father left the estate to a stranger."),
 ("Low Tide","drama",2007,7.2,116,"English","A fishing family decides whether to sell the boat that defines them."),
 ("Letters Not Sent","drama",2021,8.4,134,"French","A widow finds forty years of letters her husband wrote but never mailed."),
 ("The Night Shift","drama",2018,7.5,109,"Spanish","Two hospital cleaners hold a friendship together across opposite schedules."),
 ("The Quietest Room","drama",2022,8.0,118,"Korean","A sound engineer loses her hearing and rebuilds her work from vibration."),
 ("The Understory","drama",2024,8.6,152,"English","A forest ranger and a logger discover they are protecting the same thing."),
 ("Second Language","drama",2020,7.9,113,"English","An interpreter starts changing what people say to keep a peace talk alive."),
 ("The Waiting List","drama",2017,8.2,138,"English","Two families are matched by an organ registry and must decide what to say."),
]
COLUMNAS = ["titulo","genero","anio","calificacion","duracion_min","idioma","sinopsis"]
df = pd.DataFrame(CATALOGO, columns=COLUMNAS)
GENEROS = sorted(df["genero"].unique())
COLOR_GENERO = {g: OKABE[i] for i, g in enumerate(GENEROS)}

print(f"{len(df)} películas · {len(GENEROS)} géneros")
print(df["genero"].value_counts().to_string())
df.head(3)
""")

md(r"""
---

# Ejercicio 1 · Codificar y medir el parecido

Todo lo demás depende de estas dos funciones. `codificar` convierte una lista de textos en una
matriz de vectores **normalizados** (norma 1), y `coseno` mide el parecido entre dos vectores.

> Si los vectores están normalizados, el coseno es simplemente el producto punto. Aprovéchalo.
""")

tarea(r"""
def codificar(textos):
    '''Devuelve un array (n, 384) con los vectores NORMALIZADOS de cada texto.'''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa codificar()")


def coseno(a, b):
    '''Coseno entre dos vectores 1-D ya normalizados.'''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa coseno()")
""", r"""
def codificar(textos):
    '''Devuelve un array (n, 384) con los vectores NORMALIZADOS de cada texto.'''
    return modelo.encode(list(textos), normalize_embeddings=True)


def coseno(a, b):
    '''Coseno entre dos vectores 1-D ya normalizados.'''
    return float(np.dot(a, b))
""")

code(r"""
# ---- verificación ----
_v = codificar(["a cat on a sofa", "a dog on a rug"])
assert _v.shape == (2, 384), f"esperaba (2, 384), obtuve {_v.shape}"
assert np.allclose(np.linalg.norm(_v, axis=1), 1.0, atol=1e-4), "los vectores no están normalizados"
assert abs(coseno(_v[0], _v[0]) - 1.0) < 1e-5, "el coseno de un vector consigo mismo debe ser 1"
assert -1.01 < coseno(_v[0], _v[1]) < 1.01, "el coseno debe caer en [-1, 1]"
print("✔ ejercicio 1 correcto")
""")

md(r"""
---

# Ejercicio 2 · Parecidos, opuestos y sin relación

Aquí viene la parte interesante. La intuición dice:

| familia | coseno esperado |
|---|---|
| casi sinónimos | cerca de **+1** |
| opuestos | cerca de **−1** |
| sin relación | cerca de **0** |

**Mídelo y comprueba si es cierto.** Completa la función que calcula el coseno de cada par y la media
por familia. No cambies los pares.
""")

code(r"""
PARES = {
 "casi sinónimos": [
   ("The movie was excellent", "The film was outstanding"),
   ("A large dog runs fast", "A big dog runs quickly"),
   ("She bought a car", "She purchased an automobile"),
   ("The plot is confusing", "The storyline is very confusing")],
 "opuestos": [
   ("The movie was excellent", "The movie was terrible"),
   ("The room is very hot", "The room is very cold"),
   ("He always tells the truth", "He always tells lies"),
   ("The product is cheap", "The product is expensive"),
   ("I love this restaurant", "I hate this restaurant")],
 "negación": [
   ("The cat is sleeping", "The cat is not sleeping"),
   ("This solution works", "This solution does not work")],
 "sin relación": [
   ("The movie was excellent", "Photosynthesis converts light into sugar"),
   ("A large dog runs fast", "The mortgage rate rose last quarter"),
   ("She bought a car", "Volcanic ash reached the stratosphere")],
}
""")

tarea(r"""
def medir_familias(pares):
    '''Para cada familia devuelve (lista_de_cosenos, media).

    Devuelve un dict: {nombre_familia: (cosenos, media)}
    '''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa medir_familias()")


resultados = medir_familias(PARES)
for familia, (cs, m) in resultados.items():
    print(f"{familia:<16} media {m:+.3f}   rango [{min(cs):+.3f}, {max(cs):+.3f}]")
""", r"""
def medir_familias(pares):
    '''Para cada familia devuelve (lista_de_cosenos, media).

    Devuelve un dict: {nombre_familia: (cosenos, media)}
    '''
    salida = {}
    for familia, lista in pares.items():
        cs = []
        for a, b in lista:
            va, vb = codificar([a, b])
            cs.append(coseno(va, vb))
        salida[familia] = (cs, float(np.mean(cs)))
    return salida


resultados = medir_familias(PARES)
for familia, (cs, m) in resultados.items():
    print(f"{familia:<16} media {m:+.3f}   rango [{min(cs):+.3f}, {max(cs):+.3f}]")
""")

code(r"""
# ---- verificación ----
assert set(resultados) == set(PARES), "faltan familias en el resultado"
for f, (cs, m) in resultados.items():
    assert len(cs) == len(PARES[f]), f"faltan cosenos en «{f}»"
    assert abs(m - np.mean(cs)) < 1e-9, f"la media de «{f}» no cuadra con sus cosenos"
assert resultados["sin relación"][1] < resultados["casi sinónimos"][1], \
    "lo no relacionado debería dar menos que lo sinónimo"
print("✔ ejercicio 2 correcto")
""")

code(r"""
# ---- gráfica (dada) ----
fig, ax = plt.subplots(figsize=(9, 4.5))
for i, (familia, (cs, m)) in enumerate(resultados.items()):
    ax.scatter(cs, [i] * len(cs), s=90, color=OKABE[i], zorder=3, alpha=0.85)
    ax.scatter([m], [i], marker="|", s=600, color="black", zorder=4)
ax.axvline(0, color="gray", lw=1, ls="--")
ax.set_yticks(range(len(resultados))); ax.set_yticklabels(list(resultados))
ax.set_xlim(-1.05, 1.05); ax.set_xlabel("coseno")
ax.set_title("Cada punto es un par; la barra negra es la media de la familia")
ax.grid(axis="x", alpha=0.3); ax.set_axisbelow(True)
for lado in ("top", "right"): ax.spines[lado].set_visible(False)
plt.tight_layout(); plt.show()
""")

md(r"""
### Pregunta escrita 1

Mira la gráfica y tus números, y responde **con las cifras que mediste**:

1. ¿Se cumplió la tabla de arriba? ¿Cuál de las tres expectativas falló?
2. ¿Qué coseno dio el par `"The cat is sleeping"` vs `"The cat is not sleeping"`? ¿Te parece razonable
   que dos frases que afirman lo contrario queden ahí?
3. Un retriever de RAG devuelve los documentos con mayor coseno. Con lo que acabas de medir,
   **¿qué problema concreto tendría** un sistema que busca *"¿la política permite home office?"* en un
   manual que dice *"la política **no** permite home office"*?
""")
md(r"""
*(escribe aquí tu respuesta)*




""")

md(r"""
---

# Ejercicio 3 · Reducción de dimensiones y clustering

Los vectores tienen 384 dimensiones. Para ver si hay **grupos semánticos** hay que proyectarlos a 2D.

Vas a hacer tres cosas:

1. codificar las sinopsis del catálogo,
2. proyectarlas a 2D con **PCA** y con **t-SNE**,
3. agrupar con **KMeans** (sin decirle el género) y medir cuánto coincide con el género real.

> Para medir la coincidencia usa **pureza**: para cada cluster, la fracción que representa su género
> más común; luego el promedio ponderado por tamaño. 1.0 = clusters perfectos.
""")

tarea(r"""
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans

# 1) los vectores de las 45 sinopsis
V = None            # TU CODIGO AQUI  (usa codificar sobre df["sinopsis"])

# 2) proyecciones a 2D  (t-SNE: usa perplexity=8, random_state=0, init="pca")
C_pca  = None       # TU CODIGO AQUI
C_tsne = None       # TU CODIGO AQUI

# 3) clustering sobre los vectores COMPLETOS (384 dim), no sobre la proyección
km = None           # TU CODIGO AQUI  (KMeans con tantos clusters como géneros, random_state=0, n_init=10)
etiquetas = None    # TU CODIGO AQUI  (el cluster asignado a cada película)

raise NotImplementedError("Completa el ejercicio 3")


def pureza(etiquetas, verdad):
    '''Promedio ponderado de la fracción del género dominante en cada cluster.'''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa pureza()")
""", r"""
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.cluster import KMeans

# 1) los vectores de las 45 sinopsis
V = codificar(df["sinopsis"].tolist())

# 2) proyecciones a 2D  (t-SNE: usa perplexity=8, random_state=0, init="pca")
C_pca  = PCA(n_components=2, random_state=0).fit_transform(V)
C_tsne = TSNE(n_components=2, perplexity=8, random_state=0, init="pca").fit_transform(V)

# 3) clustering sobre los vectores COMPLETOS (384 dim), no sobre la proyección
km = KMeans(n_clusters=len(GENEROS), random_state=0, n_init=10).fit(V)
etiquetas = km.labels_


def pureza(etiquetas, verdad):
    '''Promedio ponderado de la fracción del género dominante en cada cluster.'''
    etiquetas = np.asarray(etiquetas); verdad = np.asarray(verdad)
    total = 0.0
    for c in np.unique(etiquetas):
        miembros = verdad[etiquetas == c]
        _, cuentas = np.unique(miembros, return_counts=True)
        total += cuentas.max()
    return float(total / len(verdad))
""")

code(r"""
# ---- verificación ----
for _n, _o in [("V", V), ("C_pca", C_pca), ("C_tsne", C_tsne), ("etiquetas", etiquetas)]:
    assert _o is not None, f"«{_n}» sigue en None: completa el ejercicio 3"
assert V.shape == (len(df), 384), f"V debería ser ({len(df)}, 384), es {V.shape}"
assert C_pca.shape == (len(df), 2) and C_tsne.shape == (len(df), 2), "las proyecciones deben ser 2D"
assert len(np.unique(etiquetas)) == len(GENEROS), "deberían salir tantos clusters como géneros"
assert abs(pureza([0, 0, 1, 1], ["a", "a", "b", "b"]) - 1.0) < 1e-9, "pureza perfecta debería dar 1.0"
assert abs(pureza([0, 0, 0, 0], ["a", "a", "b", "b"]) - 0.5) < 1e-9, "un solo cluster mitad y mitad = 0.5"

p = pureza(etiquetas, df["genero"].values)
print(f"✔ ejercicio 3 correcto · pureza de los clusters: {p:.3f}")
print(f"  (al azar sería aproximadamente {1/len(GENEROS):.3f})")
""")

code(r"""
# ---- gráfica (dada) ----
fig, axes = plt.subplots(1, 3, figsize=(17, 5.5))
for ax, C, titulo in [(axes[0], C_pca, "PCA · coloreado por género REAL"),
                      (axes[1], C_tsne, "t-SNE · coloreado por género REAL")]:
    for g in GENEROS:
        idx = df.index[df["genero"] == g]
        ax.scatter(C[idx, 0], C[idx, 1], s=90, color=COLOR_GENERO[g], label=g,
                   edgecolors="white", linewidths=0.8)
    ax.set_title(titulo, fontsize=11); ax.set_xticks([]); ax.set_yticks([])
axes[0].legend(frameon=False, fontsize=8.5)

for c in range(len(GENEROS)):
    idx = np.where(etiquetas == c)[0]
    axes[2].scatter(C_tsne[idx, 0], C_tsne[idx, 1], s=90, color=OKABE[c],
                    label=f"cluster {c}", edgecolors="white", linewidths=0.8)
axes[2].set_title(f"t-SNE · coloreado por CLUSTER (pureza {p:.2f})", fontsize=11)
axes[2].set_xticks([]); axes[2].set_yticks([]); axes[2].legend(frameon=False, fontsize=8.5)
for ax in axes:
    for lado in ("top", "right", "left", "bottom"): ax.spines[lado].set_visible(False)
plt.tight_layout(); plt.show()
""")

md(r"""
---

# Ejercicio 4 · Búsqueda semántica por vecinos más cercanos

Con los vectores ya calculados, buscar es ordenar por coseno. Implementa `buscar_knn`.
""")

tarea(r"""
def buscar_knn(consulta, k=5, subconjunto=None):
    '''Devuelve una lista de (indice, puntaje) con los k más parecidos a la consulta.

    subconjunto: si se pasa una lista de índices, busca SOLO entre esos.
    '''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa buscar_knn()")
""", r"""
def buscar_knn(consulta, k=5, subconjunto=None):
    '''Devuelve una lista de (indice, puntaje) con los k más parecidos a la consulta.

    subconjunto: si se pasa una lista de índices, busca SOLO entre esos.
    '''
    vq = codificar([consulta])[0]
    idx = np.arange(len(V)) if subconjunto is None else np.asarray(sorted(subconjunto))
    if len(idx) == 0:
        return []
    puntajes = V[idx] @ vq
    orden = np.argsort(-puntajes)[:k]
    return [(int(idx[o]), float(puntajes[o])) for o in orden]
""")

code(r"""
# ---- verificación ----
r = buscar_knn("a story about space and astronauts", k=3)
assert len(r) == 3 and all(isinstance(i, int) for i, _ in r), "devuelve (indice, puntaje)"
assert r[0][1] >= r[1][1] >= r[2][1], "los resultados deben venir ordenados de mayor a menor"
assert df.loc[r[0][0], "genero"] == "science fiction", \
    f"el primero debería ser de ciencia ficción, salió «{df.loc[r[0][0], 'genero']}»"
assert buscar_knn("anything", k=3, subconjunto=[0, 1])[0][0] in (0, 1), "no respetó el subconjunto"
assert buscar_knn("anything", k=3, subconjunto=[]) == [], "con subconjunto vacío devuelve []"
print("✔ ejercicio 4 correcto")
for i, s in buscar_knn("a story about space and astronauts", k=4):
    print(f"   {s:.3f}  [{df.loc[i,'genero']:<16}] {df.loc[i,'titulo']}")
""")

md(r"""
---

# Ejercicio 5 · Filtros de metadata: el orden importa

Una consulta como *"películas de terror **posteriores a 2018**"* tiene dos partes: una semántica
(*terror*) y una que es un **filtro** (`anio > 2018`).

Hay dos formas de combinarlas, y **no dan lo mismo**:

* **post-filtrado** — buscas los k mejores y *después* descartas los que no cumplen,
* **pre-filtrado** — te quedas primero con los que cumplen y buscas *solo ahí*.

Implementa las tres funciones y comprueba la diferencia.
""")

tarea(r"""
OPERADORES = {
    "eq":  lambda v, o: v == o,
    "ne":  lambda v, o: v != o,
    "gt":  lambda v, o: v >  o,
    "gte": lambda v, o: v >= o,
    "lt":  lambda v, o: v <  o,
    "lte": lambda v, o: v <= o,
}

def aplicar_filtros(filtros):
    '''Devuelve la lista de índices del catálogo que cumplen TODOS los filtros.

    filtros: [{"campo": "anio", "op": "gt", "valor": 2018}, ...]
    Si la lista está vacía, devuelve todos los índices.
    '''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa aplicar_filtros()")


def buscar_postfiltro(consulta, filtros, k=5):
    '''Busca los k mejores en TODO el catálogo y luego descarta los que no cumplen.'''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa buscar_postfiltro()")


def buscar_prefiltro(consulta, filtros, k=5):
    '''Filtra primero y busca los k mejores solo dentro de lo que quedó.'''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa buscar_prefiltro()")
""", r"""
OPERADORES = {
    "eq":  lambda v, o: v == o,
    "ne":  lambda v, o: v != o,
    "gt":  lambda v, o: v >  o,
    "gte": lambda v, o: v >= o,
    "lt":  lambda v, o: v <  o,
    "lte": lambda v, o: v <= o,
}

def aplicar_filtros(filtros):
    '''Devuelve la lista de índices del catálogo que cumplen TODOS los filtros.

    filtros: [{"campo": "anio", "op": "gt", "valor": 2018}, ...]
    Si la lista está vacía, devuelve todos los índices.
    '''
    ok = []
    for i in df.index:
        cumple = True
        for f in filtros:
            valor = df.loc[i, f["campo"]]
            if not OPERADORES[f["op"]](valor, f["valor"]):
                cumple = False
                break
        if cumple:
            ok.append(int(i))
    return ok


def buscar_postfiltro(consulta, filtros, k=5):
    '''Busca los k mejores en TODO el catálogo y luego descarta los que no cumplen.'''
    validos = set(aplicar_filtros(filtros))
    return [(i, s) for i, s in buscar_knn(consulta, k=k) if i in validos]


def buscar_prefiltro(consulta, filtros, k=5):
    '''Filtra primero y busca los k mejores solo dentro de lo que quedó.'''
    return buscar_knn(consulta, k=k, subconjunto=aplicar_filtros(filtros))
""")

code(r"""
# ---- verificación ----
assert len(aplicar_filtros([])) == len(df), "sin filtros deben pasar todas"
f_terror = [{"campo": "genero", "op": "eq", "valor": "horror"}]
assert len(aplicar_filtros(f_terror)) == (df["genero"] == "horror").sum(), "filtro de género mal"
f_dos = f_terror + [{"campo": "anio", "op": "gt", "valor": 2018}]
esperado = ((df["genero"] == "horror") & (df["anio"] > 2018)).sum()
assert len(aplicar_filtros(f_dos)) == esperado, "los filtros deben combinarse con AND"

post = buscar_postfiltro("a scary story in an old building", f_dos, k=5)
pre  = buscar_prefiltro ("a scary story in an old building", f_dos, k=5)
assert all(df.loc[i, "genero"] == "horror" and df.loc[i, "anio"] > 2018 for i, _ in post + pre), \
    "algún resultado no cumple los filtros"
assert len(pre) >= len(post), "el pre-filtrado nunca debería devolver menos que el post-filtrado"
print("✔ ejercicio 5 correcto")
print(f"   post-filtrado devolvió {len(post)} de {5} pedidos")
print(f"   pre-filtrado  devolvió {len(pre)} de {5} pedidos")
print(f"   (documentos que pasan el filtro: {len(aplicar_filtros(f_dos))})")
""")

md(r"""
### Pregunta escrita 2

1. ¿Cuántos resultados devolvió cada estrategia? ¿Por qué el post-filtrado devolvió menos?
2. Inventa un filtro **más selectivo** (por ejemplo `idioma == "Korean"`), córrelo con las dos
   estrategias y pega aquí los números. ¿Cuántos resultados devuelve el post-filtrado?
3. Si tu aplicación **siempre** necesita 5 resultados para armar el prompt del LLM, ¿cuál de las dos
   estrategias puedes usar? ¿Qué le pasa a la otra cuando el filtro es muy selectivo?
""")
md(r"""
*(escribe aquí tu respuesta)*




""")

md(r"""
---

# Ejercicio 6 · Self-query: que el LLM arme el filtro

Hasta aquí **tú** escribiste los filtros a mano. Un *self-query retriever* se los pide a un LLM:
recibe la pregunta en lenguaje natural y devuelve `query` (para la búsqueda semántica) y `filtros`
(para la metadata).

El modelo y la función `generar` ya están dados. Lo tuyo es **el prompt** y **el parseo**.
""")

code(r"""
# ---- el LLM (dado) ----
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

NOMBRE_LLM = "Qwen/Qwen2.5-1.5B-Instruct"
tok_llm = AutoTokenizer.from_pretrained(NOMBRE_LLM)
llm = AutoModelForCausalLM.from_pretrained(
    NOMBRE_LLM, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto" if torch.cuda.is_available() else None)
llm.eval()

def generar(prompt, max_new_tokens=220):
    msgs = [{"role": "user", "content": prompt}]
    texto = tok_llm.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    ent = tok_llm(texto, return_tensors="pt").to(llm.device)
    with torch.no_grad():
        out = llm.generate(**ent, max_new_tokens=max_new_tokens, do_sample=False,
                           temperature=None, top_p=None, top_k=None,
                           pad_token_id=tok_llm.eos_token_id)
    return tok_llm.decode(out[0][ent["input_ids"].shape[1]:], skip_special_tokens=True).strip()

ESQUEMA = '''titulo        texto
anio          entero
genero        uno de: science fiction, horror, comedy, documentary, drama
calificacion  decimal de 0 a 10
duracion_min  entero
idioma        uno de: English, Spanish, Japanese, French, Korean'''
print("LLM listo ·", NOMBRE_LLM)
""")

tarea(r"""
def prompt_self_query(pregunta):
    '''Construye el prompt que le pide al LLM separar query y filtros.

    Tiene que: describir la tarea, incluir ESQUEMA, listar los operadores permitidos
    ({', '.join(OPERADORES)}), pedir SOLO JSON con las llaves "query" y "filtros",
    y terminar con la pregunta del usuario.
    '''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa prompt_self_query()")


def parsear_self_query(salida):
    '''Extrae el JSON de la respuesta del LLM y lo devuelve como dict.

    Tiene que ser tolerante: el modelo suele envolver el JSON en ```json ... ```
    o agregar texto antes y después. Si algo falla, devuelve
    {"query": "", "filtros": []} en vez de lanzar excepción.
    '''
    # TU CODIGO AQUI
    raise NotImplementedError("Implementa parsear_self_query()")
""", r"""
def prompt_self_query(pregunta):
    '''Construye el prompt que le pide al LLM separar query y filtros.'''
    ops = ", ".join(OPERADORES)
    return (
        "Eres el componente self-query de un buscador de películas.\n"
        "Separa la pregunta del usuario en DOS partes:\n"
        "1. \"query\": solo lo que describe el CONTENIDO de la película. Si no queda nada, usa \"\".\n"
        "2. \"filtros\": condiciones sobre estos campos y nada más:\n\n"
        f"{ESQUEMA}\n\n"
        f"Operadores permitidos: {ops}\n\n"
        "Responde SOLO con JSON, sin explicación:\n"
        '{\"query\": \"...\", \"filtros\": [{\"campo\": \"...\", \"op\": \"...\", \"valor\": ...}]}\n\n'
        "Si algo no cabe en ningún campo, déjalo dentro de \"query\".\n\n"
        f"Pregunta: {pregunta}"
    )


def parsear_self_query(salida):
    '''Extrae el JSON de la respuesta del LLM y lo devuelve como dict.'''
    vacio = {"query": "", "filtros": []}
    if not isinstance(salida, str):
        return vacio
    texto = re.sub(r"```(?:json)?", "", salida).strip()
    ini, fin = texto.find("{"), texto.rfind("}")
    if ini == -1 or fin == -1 or fin <= ini:
        return vacio
    try:
        d = json.loads(texto[ini:fin + 1])
    except Exception:
        return vacio
    if not isinstance(d, dict):
        return vacio
    filtros = d.get("filtros") or []
    limpios = [f for f in filtros
               if isinstance(f, dict) and f.get("campo") in COLUMNAS and f.get("op") in OPERADORES]
    return {"query": str(d.get("query", "")), "filtros": limpios}
""")

code(r"""
# ---- verificación (no llama al LLM: prueba tus funciones con casos fijos) ----
p = prompt_self_query("horror movies after 2018")
assert isinstance(p, str) and len(p) > 120, "el prompt parece demasiado corto"
assert "duracion_min" in p, "el prompt debe incluir el ESQUEMA"
assert "gte" in p, "el prompt debe listar los operadores permitidos"
assert "horror movies after 2018" in p, "el prompt debe terminar con la pregunta"

casos = [
  ('{"query": "space", "filtros": [{"campo": "anio", "op": "gt", "valor": 2018}]}', "space", 1),
  ('```json\n{"query": "", "filtros": []}\n```', "", 0),
  ('Claro, aquí tienes:\n{"query": "scary", "filtros": []}\nEspero que sirva.', "scary", 0),
  ('esto no es json', "", 0),
  ('{"query": "x", "filtros": [{"campo": "inventado", "op": "eq", "valor": 1}]}', "x", 0),
]
for bruto, q_esp, n_esp in casos:
    d = parsear_self_query(bruto)
    assert d["query"] == q_esp, f"query mal en: {bruto[:40]}… (esperaba «{q_esp}», dio «{d['query']}»)"
    assert len(d["filtros"]) == n_esp, f"filtros mal en: {bruto[:40]}… (esperaba {n_esp})"
print("✔ ejercicio 6 correcto")
""")

code(r"""
# ---- el sistema completo (dado): self-query + pre-filtrado + kNN ----
def buscar_self_query(pregunta, k=4, verbose=True):
    bruto = generar(prompt_self_query(pregunta))
    plan = parsear_self_query(bruto)
    if verbose:
        print(f"pregunta : {pregunta}")
        print(f"query    : «{plan['query']}»")
        print(f"filtros  : {plan['filtros']}")
    candidatos = aplicar_filtros(plan["filtros"])
    if verbose:
        print(f"pasan el filtro: {len(candidatos)} de {len(df)}")
    if plan["query"].strip() == "":
        elegidos = [(i, float("nan")) for i in candidatos[:k]]
    else:
        elegidos = buscar_knn(plan["query"], k=k, subconjunto=candidatos)
    for i, s in elegidos:
        r = df.loc[i]
        p = "  —  " if np.isnan(s) else f"  {s:.3f}  "
        print(f"   {p}{r['titulo']}  ({r['anio']}, {r['genero']}, {r['calificacion']}, {r['idioma']})")
    return plan, elegidos

PREGUNTAS = [
    "horror movies released after 2018",
    "documentaries in Spanish",
    "a funny movie about work, shorter than 100 minutes",
    "highly rated science fiction about first contact",
]
for q in PREGUNTAS:
    buscar_self_query(q); print("-" * 78)
""")

md(r"""
### Pregunta escrita 3

1. De las cuatro preguntas, ¿en cuáles el LLM extrajo bien los filtros y en cuáles se equivocó?
   Pega los `filtros` que devolvió en el caso que peor salió.
2. En `"documentaries in Spanish"` el `query` debería quedar prácticamente **vacío**. ¿Qué hace tu
   sistema cuando eso pasa, y por qué tiene sentido?
3. Corre dos veces la misma pregunta. ¿Sale igual? Con lo que sabes del muestreo, **¿qué tendrías que
   validar siempre** antes de mandarle los filtros a la base de datos?
""")
md(r"""
*(escribe aquí tu respuesta)*




""")

md(r"""
---

## Reporte final (dado)
""")

code(r"""
print("=" * 74)
print("RESUMEN DE LA TAREA")
print("=" * 74)
print(f"catálogo               : {len(df)} películas, {len(GENEROS)} géneros")
print(f"dimensión del embedding: {V.shape[1]}")
print()
print("coseno medio por familia de pares:")
for f, (cs, m) in resultados.items():
    print(f"   {f:<16} {m:+.3f}")
print()
print(f"pureza de los clusters  : {pureza(etiquetas, df['genero'].values):.3f}  "
      f"(al azar {1/len(GENEROS):.3f})")
print()
ej = [{"campo": "genero", "op": "eq", "valor": "horror"},
      {"campo": "anio", "op": "gt", "valor": 2018}]
print(f"filtro de ejemplo       : terror posterior a 2018 → {len(aplicar_filtros(ej))} películas")
print(f"   post-filtrado k=5    : {len(buscar_postfiltro('a scary story', ej, k=5))} resultados")
print(f"   pre-filtrado  k=5    : {len(buscar_prefiltro('a scary story', ej, k=5))} resultados")
print("=" * 74)
""")

md(r"""
## Cómo se califica

| | |
|---|---|
| Los 6 bloques de código, con sus verificaciones en verde | 60 % |
| Las 3 preguntas escritas, **respondidas con tus números** | 30 % |
| Que el notebook corra de principio a fin sin errores | 10 % |

Una respuesta escrita que no cite ninguna cifra medida por ti no cuenta.
""")

nb = {"cells": [_fix(c) for c in celdas],
      "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                   "language_info": {"name": "python", "version": "3.11"}},
      "nbformat": 4, "nbformat_minor": 5}
nombre = "_resuelto30.ipynb" if RESUELTO else "30_tarea_embeddings_busqueda_selfquery.ipynb"
io.open(nombre, "w", encoding="utf-8").write(json.dumps(nb, ensure_ascii=False, indent=1))
print(f"{nombre}: {len(celdas)} celdas "
      f"(md {sum(1 for c in celdas if c['cell_type']=='markdown')}, "
      f"code {sum(1 for c in celdas if c['cell_type']=='code')})")
