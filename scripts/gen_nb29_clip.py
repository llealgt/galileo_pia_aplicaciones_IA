"""Genera 29_clip_multimodal.ipynb."""
import json, io

celdas = []
def md(t):   celdas.append({"cell_type": "markdown", "metadata": {}, "source": t.strip("\n").split("\n")})
def code(t): celdas.append({"cell_type": "code", "metadata": {}, "execution_count": None,
                            "outputs": [], "source": t.strip("\n").split("\n")})

# fix: los source deben llevar salto de linea al final de cada elemento
def _fix(c):
    s = c["source"]
    c["source"] = [l + "\n" for l in s[:-1]] + [s[-1]]
    return c

md(r"""
# CLIP: un solo espacio para imágenes y texto

CLIP (Radford et al., 2021 — *Learning Transferable Visual Models From Natural Language
Supervision*) entrenó **dos codificadores a la vez**, uno de imágenes y otro de texto, sobre 400
millones de pares imagen–descripción sacados de internet. El resultado es un **espacio compartido**:
la foto de un perro queda cerca del texto *"a photo of a dog"*.

Eso habilita cosas que antes necesitaban un modelo entrenado a propósito:

* buscar imágenes escribiendo texto (y al revés),
* **clasificar sin entrenar nada** — le das las clases candidatas en texto y elige,
* comparar cualquier cosa con cualquier cosa, siempre con la misma operación: un coseno.

Este notebook sigue el recorrido del
[notebook oficial de OpenAI](https://colab.research.google.com/github/openai/clip/blob/master/notebooks/Interacting_with_CLIP.ipynb)
y le agrega dos secciones que ese no tiene: **comparar textos entre sí** y una **búsqueda semántica**
sobre un corpus de texto.

> **Sin llaves ni pagos.** El modelo se baja de Hugging Face y las ocho imágenes vienen dentro de
> `scikit-image`. Corre en la CPU de Colab; con GPU va más rápido.

---
""")

md(r"""
## 0. Preparación

Colab ya trae casi todo. La celda instala solo lo que pudiera faltar y detecta si hay GPU.
""")

code(r"""
try:
    import transformers, skimage, torchvision  # noqa: F401
except ImportError:
    %pip install -q transformers scikit-image torchvision

import os
import numpy as np
import torch
import matplotlib.pyplot as plt
from PIL import Image

# Paleta Okabe-Ito (segura para daltonismo), la misma del resto del curso
OKABE = ["#0072B2", "#D55E00", "#009E73", "#CC79A7",
         "#E69F00", "#56B4E9", "#F0E442", "#000000"]

DISPOSITIVO = "cuda" if torch.cuda.is_available() else "cpu"
print("PyTorch     :", torch.__version__)
print("Dispositivo :", DISPOSITIVO)
""")

md(r"""
## 1. El modelo, por dentro

Usamos `openai/clip-vit-base-patch32`: la variante ViT-B/32, que es la que cabe holgadamente en la
máquina gratuita. Antes de usarlo, vale la pena mirar sus números — sobre todo **la longitud de
contexto**, que es un límite con el que te vas a topar.
""")

code(r"""
from transformers import CLIPModel, CLIPProcessor

MODELO = "openai/clip-vit-base-patch32"
modelo = CLIPModel.from_pretrained(MODELO).to(DISPOSITIVO).eval()
proc = CLIPProcessor.from_pretrained(MODELO)

n_par = sum(p.numel() for p in modelo.parameters())
print(f"Parámetros totales    : {n_par:,}")
print(f"  del lado de imagen  : {sum(p.numel() for p in modelo.vision_model.parameters()):,}")
print(f"  del lado de texto   : {sum(p.numel() for p in modelo.text_model.parameters()):,}")
print(f"Resolución de entrada : {modelo.config.vision_config.image_size} px")
print(f"Longitud de contexto  : {modelo.config.text_config.max_position_embeddings} tokens")
print(f"Vocabulario           : {modelo.config.text_config.vocab_size:,}")
print(f"Dimensión del espacio : {modelo.config.projection_dim}")
print(f"\nTemperatura aprendida : {modelo.logit_scale.exp().item():.1f}")
""")

md(r"""
Fíjate en dos cosas:

* **La longitud de contexto es 77 tokens.** No son 77 palabras: son *tokens*, así que en la práctica
  te caben unas 50 palabras. CLIP no sirve para comparar párrafos largos, y lo que pases de ahí se
  corta en silencio.
* **La temperatura aprendida.** CLIP no usa el coseno crudo: lo multiplica por ese número (~100) antes
  del softmax. Volveremos a él en la sección de clasificación, porque es lo que convierte diferencias
  pequeñas en decisiones.
""")

md(r"""
## 2. Qué le pasa a una imagen antes de entrar

El procesador hace siempre lo mismo: redimensiona el lado corto, recorta el centro a 224×224,
pasa a RGB y normaliza con la media y la desviación con las que se entrenó. **Ese recorte central
descarta información** — si tu objeto está en una esquina, puede desaparecer.
""")

code(r"""
img_demo = Image.open(os.path.join(__import__("skimage").data_dir, "astronaut.png")).convert("RGB")
tensor = proc(images=img_demo, return_tensors="pt")["pixel_values"]

print(f"Original    : {img_demo.size[0]}x{img_demo.size[1]} px")
print(f"Tras el proc: {tuple(tensor.shape)}   (lote, canales, alto, ancho)")
print(f"Rango de valores: [{tensor.min():.2f}, {tensor.max():.2f}]  — normalizado, ya no es 0-255")

# des-normalizar para poder verla
media = np.array(proc.image_processor.image_mean).reshape(3, 1, 1)
desv  = np.array(proc.image_processor.image_std).reshape(3, 1, 1)
vista = np.clip(tensor[0].numpy() * desv + media, 0, 1).transpose(1, 2, 0)

fig, ax = plt.subplots(1, 2, figsize=(8, 4))
ax[0].imshow(img_demo);  ax[0].set_title(f"original  {img_demo.size[0]}x{img_demo.size[1]}")
ax[1].imshow(vista);     ax[1].set_title("lo que ve el modelo  224x224")
for a in ax: a.axis("off")
plt.tight_layout(); plt.show()
""")

md(r"""
## 3. Qué le pasa a un texto antes de entrar

El texto se parte en tokens y se rellena hasta la longitud fija. Aquí se ve el relleno y el corte.
""")

code(r"""
frases = ["Hello World!", "a photo of a tabby cat sleeping on a sofa"]
ent = proc(text=frases, return_tensors="pt", padding="max_length", truncation=True)

for f, ids in zip(frases, ent["input_ids"]):
    piezas = proc.tokenizer.convert_ids_to_tokens(ids)
    reales = [p for p in piezas if p != "<|endoftext|>"] + ["<|endoftext|>"]
    print(f"\n«{f}»")
    print(f"   {len(reales)} tokens de los 77 que caben")
    print("   " + " | ".join(p.replace("</w>", "_") for p in reales))
""")

md(r"""
El `_` marca dónde termina cada palabra, y `<|endoftext|>` cierra. Todo lo demás es relleno hasta 77:
**el modelo siempre procesa 77 posiciones**, gaste lo que gaste tu frase.

---

## 4. Las ocho imágenes

Las mismas del notebook original, y vienen dentro de `scikit-image`, sin descargar nada.

> **Las descripciones van en inglés a propósito.** El codificador de texto de CLIP se entrenó con
> descripciones en inglés y **degrada con otros idiomas** — en la sección 8 lo medimos y verás cuánto.
> La traducción está al lado solo para leer.
""")

code(r"""
import skimage

DESCRIPCIONES = {
    "page":             ("a page of text about segmentation",        "una página de texto sobre segmentación"),
    "chelsea":          ("a facial photo of a tabby cat",            "la cara de un gato atigrado"),
    "astronaut":        ("a portrait of an astronaut with the American flag", "un astronauta con la bandera"),
    "rocket":           ("a rocket standing on a launchpad",         "un cohete en la plataforma"),
    "motorcycle_right": ("a red motorcycle standing in a garage",    "una moto roja en un garaje"),
    "camera":           ("a person looking at a camera on a tripod", "alguien mirando una cámara"),
    "horse":            ("a black-and-white silhouette of a horse",  "la silueta de un caballo"),
    "coffee":           ("a cup of coffee on a saucer",              "una taza de café"),
}

imagenes, textos, glosas = [], [], []
fig, axes = plt.subplots(2, 4, figsize=(14, 6))
for ax, (nombre, (en, es)) in zip(axes.ravel(), DESCRIPCIONES.items()):
    ruta = [os.path.join(skimage.data_dir, f) for f in os.listdir(skimage.data_dir)
            if os.path.splitext(f)[0] == nombre][0]
    im = Image.open(ruta).convert("RGB")
    imagenes.append(im); textos.append(en); glosas.append(es)
    ax.imshow(im); ax.set_title(f"{nombre}\n{es}", fontsize=9); ax.axis("off")
plt.tight_layout(); plt.show()
print(f"{len(imagenes)} imágenes y {len(textos)} descripciones")
""")

md(r"""
## 5. De imagen y de texto, al mismo espacio

Dos codificadores distintos, **una sola salida**: un vector de 512 dimensiones para cada cosa.
Se normalizan para que el producto punto sea directamente el coseno.
""")

code(r"""
def codificar_imagenes(ims):
    ent = proc(images=ims, return_tensors="pt").to(DISPOSITIVO)
    with torch.no_grad():
        v = modelo.get_image_features(**ent)
    return torch.nn.functional.normalize(v, dim=-1).cpu()

def codificar_textos(ts):
    ent = proc(text=ts, return_tensors="pt", padding=True, truncation=True).to(DISPOSITIVO)
    with torch.no_grad():
        v = modelo.get_text_features(**ent)
    return torch.nn.functional.normalize(v, dim=-1).cpu()

v_img = codificar_imagenes(imagenes)
v_txt = codificar_textos(textos)
print("imágenes:", tuple(v_img.shape), "  textos:", tuple(v_txt.shape))
print("¿misma dimensión? ->", v_img.shape[1] == v_txt.shape[1])

similitud = (v_txt @ v_img.T).numpy()
print(f"\ncoseno mínimo {similitud.min():.3f}   máximo {similitud.max():.3f}")
""")

md(r"""
## 6. La matriz imagen ↔ texto

La figura de siempre: cada fila es una descripción, cada columna una imagen, y la casilla es el
coseno. **La diagonal debería ganar.**
""")

code(r"""
n = len(textos)
fig, ax = plt.subplots(figsize=(13, 8))
im = ax.imshow(similitud, cmap="magma", vmin=similitud.min(), vmax=similitud.max())

ax.set_yticks(range(n)); ax.set_yticklabels(glosas, fontsize=10)
ax.set_xticks([])
for i, foto in enumerate(imagenes):
    ax.imshow(foto, extent=(i - 0.5, i + 0.5, -1.65, -0.65), origin="lower", aspect="auto")

diag_ok = 0
for y in range(n):
    mejor = int(np.argmax(similitud[y]))
    diag_ok += (mejor == y)
    for x in range(n):
        ax.text(x, y, f"{similitud[y, x]:.2f}", ha="center", va="center", fontsize=9,
                color="white" if similitud[y, x] < similitud.mean() else "black",
                fontweight="bold" if x == y else "normal")
    if mejor != y:
        ax.add_patch(plt.Rectangle((mejor - .5, y - .5), 1, 1, fill=False,
                                   edgecolor=OKABE[1], lw=2.5))
    ax.add_patch(plt.Rectangle((y - .5, y - .5), 1, 1, fill=False, edgecolor="white", lw=1.6))

for lado in ("left", "top", "right", "bottom"):
    ax.spines[lado].set_visible(False)
ax.set_xlim(-0.5, n - 0.5); ax.set_ylim(n - 0.5, -1.8)
ax.set_title(f"Coseno entre texto e imagen  —  la diagonal gana en {diag_ok} de {n} filas",
             fontsize=13, pad=14)
plt.colorbar(im, ax=ax, fraction=0.025, pad=0.02)
plt.tight_layout(); plt.show()

print(f"aciertos en la diagonal: {diag_ok}/{n}")
print(f"los recuadros naranjas marcan la fila donde ganó OTRA imagen")
""")

md(r"""
**Léelo con cuidado:** todos los números están en una franja estrecha — al correrlo salieron
entre **0.10 y 0.36**.
A ojo parecen todos iguales; lo que importa es **el orden dentro de cada fila**, no el valor absoluto.
Esa compresión es normal en CLIP y es la razón de que exista la temperatura aprendida.

---

## 7. Clasificación *zero-shot* con CIFAR-100

Aquí está lo que hace especial a CLIP: **clasificar 100 clases que nunca vio como clases**. Se
escriben las 100 candidatas en texto, se codifican y se elige la más cercana. Sin entrenar nada.
""")

code(r"""
from torchvision.datasets import CIFAR100

cifar = CIFAR100(os.path.expanduser("~/.cache"), download=True, train=False)
plantillas = [f"a photo of a {c}" for c in cifar.classes]
v_clases = codificar_textos(plantillas)
print(f"{len(cifar.classes)} clases codificadas · plantilla: «{plantillas[0]}»")

# la temperatura del modelo, igual que hace CLIP internamente
escala = modelo.logit_scale.exp().item()
probs = (escala * v_img @ v_clases.T).softmax(dim=-1)
top_p, top_i = probs.topk(5, dim=-1)
""")

code(r"""
fig, axes = plt.subplots(4, 4, figsize=(13, 13))
for i, foto in enumerate(imagenes):
    a_im, a_ba = axes[i // 2, (i % 2) * 2], axes[i // 2, (i % 2) * 2 + 1]
    a_im.imshow(foto); a_im.axis("off")
    y = np.arange(5)
    a_ba.barh(y, top_p[i].numpy(), color=[OKABE[0]] + [OKABE[5]] * 4)
    a_ba.invert_yaxis(); a_ba.set_yticks(y)
    a_ba.set_yticklabels([cifar.classes[j] for j in top_i[i].numpy()], fontsize=9)
    a_ba.set_xlim(0, 1); a_ba.set_xlabel("probabilidad", fontsize=8)
    a_ba.grid(axis="x", alpha=0.3); a_ba.set_axisbelow(True)
    for lado in ("top", "right"): a_ba.spines[lado].set_visible(False)
plt.tight_layout(); plt.show()

print("Ninguna de las ocho fotos es de CIFAR-100 y ninguna clase se entrenó aquí.")
print("Ojo con «page» y «horse»: no hay clase razonable para ellas y aun así el modelo")
print("reparte probabilidad entre las que más se le parecen. Nunca dice «no sé».")
""")

md(r"""
Ese último punto es el que más vale: **la lista de candidatas la pones tú, y el modelo siempre elige
una**. Si tu clase real no está en la lista, no te avisa — reparte la probabilidad entre las que hay.
En un sistema de verdad, eso se resuelve añadiendo una clase *"ninguna de las anteriores"* y midiendo
si funciona, no confiando en la probabilidad.

---

# 8. Comparar textos entre sí  *(sección nueva)*

Hasta aquí comparamos **texto contra imagen**. Pero los dos codificadores escupen vectores del mismo
tamaño en el mismo espacio, así que nada impide comparar **texto contra texto** con la misma
operación. Vamos a ver qué tan bien sale — y dónde falla.

El corpus son 14 frases de cuatro temas: animales, comida, espacio y oficina.
""")

code(r"""
CORPUS = [
    # animales
    "a tabby cat sleeping on a sofa",
    "a dog running along the beach",
    "a puppy playing with a red ball",
    "a horse galloping across a field",
    # comida
    "a steaming cup of coffee on a table",
    "a plate of freshly served pasta",
    "a slice of chocolate cake with cream",
    # espacio
    "a rocket lifting off from the launchpad",
    "an astronaut floating inside the station",
    "a telescope pointing at a distant galaxy",
    # oficina
    "an engineer writing code on a laptop",
    "a meeting room with a whiteboard full of diagrams",
    "a stack of printed reports on a desk",
    "a person reading a technical manual",
]
TEMA = (["animales"] * 4 + ["comida"] * 3 + ["espacio"] * 3 + ["oficina"] * 4)
COLOR_TEMA = {"animales": OKABE[0], "comida": OKABE[1], "espacio": OKABE[2], "oficina": OKABE[3]}

v_corpus = codificar_textos(CORPUS)
M = (v_corpus @ v_corpus.T).numpy()
print(f"{len(CORPUS)} textos · matriz {M.shape}")
print(f"coseno fuera de la diagonal: mínimo {M[~np.eye(len(M), dtype=bool)].min():.3f}   "
      f"máximo {M[~np.eye(len(M), dtype=bool)].max():.3f}")
""")

code(r"""
n = len(CORPUS)
fig, ax = plt.subplots(figsize=(12, 10))
Mv = M.copy(); np.fill_diagonal(Mv, np.nan)          # la diagonal es 1.000 y aplasta la escala
im = ax.imshow(Mv, cmap="viridis")

etiquetas = [t if len(t) <= 42 else t[:41] + "…" for t in CORPUS]
ax.set_xticks(range(n)); ax.set_xticklabels(etiquetas, rotation=45, ha="right", fontsize=8)
ax.set_yticks(range(n)); ax.set_yticklabels(etiquetas, fontsize=8)
for i, t in enumerate(TEMA):
    ax.get_yticklabels()[i].set_color(COLOR_TEMA[t])
    ax.get_xticklabels()[i].set_color(COLOR_TEMA[t])

for y in range(n):
    for x in range(n):
        if x == y: continue
        ax.text(x, y, f"{M[y, x]:.2f}", ha="center", va="center", fontsize=6.5,
                color="white" if M[y, x] < np.nanmean(Mv) else "black")

# marcar los bloques temáticos
ini = 0
for t in ["animales", "comida", "espacio", "oficina"]:
    k = TEMA.count(t)
    ax.add_patch(plt.Rectangle((ini - .5, ini - .5), k, k, fill=False,
                               edgecolor=COLOR_TEMA[t], lw=2.5))
    ini += k

ax.set_title("Coseno de cada texto contra todos los demás\n"
             "(la diagonal se deja en blanco: siempre vale 1.000)", fontsize=12, pad=12)
plt.colorbar(im, ax=ax, fraction=0.035, pad=0.02)
plt.tight_layout(); plt.show()
""")

code(r"""
# ¿de verdad agrupa por tema? se mide, no se supone
Sm = M.copy(); np.fill_diagonal(Sm, -9)
aciertos = sum(TEMA[int(np.argmax(Sm[i]))] == TEMA[i] for i in range(n))
dentro = np.mean([Sm[i][j] for i in range(n) for j in range(n) if i != j and TEMA[i] == TEMA[j]])
fuera  = np.mean([Sm[i][j] for i in range(n) for j in range(n) if i != j and TEMA[i] != TEMA[j]])

print(f"El vecino más cercano es del mismo tema en {aciertos} de {n} textos")
print(f"coseno medio DENTRO del tema : {dentro:+.3f}")
print(f"coseno medio FUERA del tema  : {fuera:+.3f}")
print(f"separación                    : {dentro - fuera:+.3f}")
print()
print("Guarda ese número de separación: en la sección 10 lo comparamos contra")
print("un modelo hecho a propósito para texto, y la diferencia es grande.")
""")

md(r"""
Los bloques de colores marcan los cuatro temas. Se nota que la diagonal de bloques está más
caliente que el resto — **pero mucho menos de lo que esperarías**. Los cosenos fuera de tema no
bajan a cero ni de lejos.

---

# 9. Búsqueda semántica sobre ese corpus  *(sección nueva)*

Con los vectores ya calculados, buscar es una línea: codificar la consulta y ordenar por coseno.

**Cambia `CONSULTA` y vuelve a correr la celda.** Devuelve los 4 textos más parecidos.
""")

code(r"""
# ────────────────────────────────────────────────────────────
CONSULTA = "something to eat"        # ← edita esto y vuelve a correr
K = 4
# ────────────────────────────────────────────────────────────

def buscar(consulta, k=4):
    v_q = codificar_textos([consulta])[0]
    puntajes = (v_corpus @ v_q).numpy()
    orden = np.argsort(-puntajes)[:k]
    return [(int(i), float(puntajes[i])) for i in orden]

resultados = buscar(CONSULTA, K)

tema_lider = TEMA[resultados[0][0]]
print(f"CONSULTA: «{CONSULTA}»\n")
for pos, (i, s) in enumerate(resultados, 1):
    marca = "  ← de otro tema" if TEMA[i] != tema_lider else ""
    print(f"  {pos}. {s:.3f}  [{TEMA[i]:<9}] {CORPUS[i]}{marca}")

intrusos = sum(TEMA[i] != tema_lider for i, _ in resultados)
peor = int(np.argsort((v_corpus @ codificar_textos([CONSULTA])[0]).numpy())[0])
print(f"\n  el más lejano: {CORPUS[peor]}")
if intrusos:
    print(f"  {intrusos} de los {K} resultados NO son del tema del primero — y eso, con un corpus")
    print(f"  de {len(CORPUS)} frases muy separadas entre sí. La sección 10 explica por qué.")
""")

code(r"""
v_q = codificar_textos([CONSULTA])[0]
puntajes = (v_corpus @ v_q).numpy()
orden = np.argsort(-puntajes)

fig, ax = plt.subplots(figsize=(10, 6))
colores = [COLOR_TEMA[TEMA[i]] for i in orden]
alfas   = [1.0 if r < K else 0.32 for r in range(len(orden))]
barras = ax.barh(range(len(orden)), puntajes[orden], color=colores)
for b, a in zip(barras, alfas):
    b.set_alpha(a)

ax.set_yticks(range(len(orden)))
ax.set_yticklabels([CORPUS[i] if len(CORPUS[i]) <= 46 else CORPUS[i][:45] + "…" for i in orden],
                   fontsize=9)
ax.invert_yaxis()
ax.axhline(K - 0.5, color="black", ls="--", lw=1.2)
ax.text(ax.get_xlim()[1], K - 0.5, f"  corte en k={K}", va="center", fontsize=9)
ax.set_xlabel("coseno con la consulta")
ax.set_title(f"«{CONSULTA}»  —  los {K} más cercanos, en color fuerte", fontsize=12)
ax.grid(axis="x", alpha=0.3); ax.set_axisbelow(True)
for lado in ("top", "right"): ax.spines[lado].set_visible(False)

import matplotlib.patches as mpatches
ax.legend(handles=[mpatches.Patch(color=c, label=t) for t, c in COLOR_TEMA.items()],
          loc="lower right", fontsize=9, frameon=False)
plt.tight_layout(); plt.show()
""")

md(r"""
Cosas que vale la pena probar cambiando `CONSULTA`:

| prueba esto | qué observar |
|---|---|
| `"something to eat"` | ninguna palabra aparece en los documentos: el acierto es semántico |
| `"space exploration"` | debería traer los tres de espacio |
| `"an animal"` | ¿los cuatro animales, o se cuela alguno? |
| `"documentación técnica"` | **en español**: mira cuánto se degrada el orden |
| `"the cat is not sleeping"` | la negación no cambia gran cosa — CLIP no la modela |

La celda marca con una flecha los resultados que **no** son del tema del primero. Con la consulta por
omisión ya se cuela uno: eso no es mala suerte, es el límite que mide la sección 10.

Ese último es importante: **CLIP no entiende negaciones**. `"a cat"` y `"not a cat"` quedan
pegadísimos, porque el entrenamiento nunca premió distinguirlos.

---

# 10. El límite: CLIP es un puente, no un buscador de texto

Todo lo anterior funciona, pero conviene saber **qué tan bien** comparado con un modelo hecho a
propósito para texto. Se mide, no se opina.
""")

code(r"""
CORPUS_ES = [
    "un gato atigrado durmiendo en el sofá",
    "un perro corriendo por la playa",
    "un cachorro jugando con una pelota roja",
    "un caballo galopando por el campo",
    "una taza de café humeante sobre la mesa",
    "un plato de pasta recién servido",
    "una rebanada de pastel de chocolate con crema",
    "un cohete despegando de la plataforma",
    "un astronauta flotando dentro de la estación",
    "un telescopio apuntando a una galaxia lejana",
    "una ingeniera escribiendo código en una laptop",
    "una sala de juntas con un pizarrón lleno de diagramas",
    "una pila de reportes impresos sobre un escritorio",
    "una persona leyendo un manual técnico",
]

def separacion(V, nombre):
    S = (V @ V.T) if isinstance(V, np.ndarray) else (V @ V.T).numpy()
    S = S.copy(); np.fill_diagonal(S, -9)
    n = len(S)
    ok = sum(TEMA[int(np.argmax(S[i]))] == TEMA[i] for i in range(n))
    d = np.mean([S[i][j] for i in range(n) for j in range(n) if i != j and TEMA[i] == TEMA[j]])
    f = np.mean([S[i][j] for i in range(n) for j in range(n) if i != j and TEMA[i] != TEMA[j]])
    print(f"  {nombre:<40} {ok}/{n} vecinos correctos   separación {d - f:+.3f}")
    return ok, d - f

print("¿Qué tan bien separa los cuatro temas?\n")
r_en = separacion(v_corpus, "CLIP · corpus en inglés")
r_es = separacion(codificar_textos(CORPUS_ES), "CLIP · el mismo corpus en español")

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    %pip install -q sentence-transformers
    from sentence_transformers import SentenceTransformer

st = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
r_st = separacion(st.encode(CORPUS_ES, normalize_embeddings=True),
                  "MiniLM multilingüe · español")
""")

code(r"""
fig, ax = plt.subplots(figsize=(9, 4))
etq = ["CLIP\ninglés", "CLIP\nespañol", "MiniLM\nespañol"]
val = [r_en[1], r_es[1], r_st[1]]
b = ax.bar(etq, val, color=[OKABE[0], OKABE[1], OKABE[2]], width=0.55)
for bar, v, (ok, _) in zip(b, val, [r_en, r_es, r_st]):
    ax.text(bar.get_x() + bar.get_width() / 2, v + 0.012, f"{v:+.3f}\n{ok}/14 vecinos",
            ha="center", fontsize=10)
ax.set_ylabel("separación entre temas\n(coseno dentro − coseno fuera)")
ax.set_title("Comparar textos: CLIP contra un modelo hecho para texto", fontsize=12)
ax.set_ylim(0, max(val) * 1.35)
ax.grid(axis="y", alpha=0.3); ax.set_axisbelow(True)
for lado in ("top", "right"): ax.spines[lado].set_visible(False)
plt.tight_layout(); plt.show()
""")

md(r"""
## Conceptos clave

* **Un espacio, dos puertas.** Imagen y texto salen como vectores de 512 dimensiones que se comparan
  con un coseno. Todo lo demás —búsqueda, clasificación, agrupamiento— sale de ahí.
* **Zero-shot es escribir las clases.** No entrenas nada; le das candidatas en texto. Pero el modelo
  **siempre elige una**: si tu clase no está en la lista, no te avisa.
* **La temperatura es parte del modelo.** Los cosenos de CLIP viven en una franja estrecha; ese
  factor aprendido (~100) es lo que los convierte en una decisión.
* **77 tokens.** Unas 50 palabras. Lo que pases se corta sin avisar.
* **CLIP compara textos, pero no es lo suyo.** Lo mediste: separa los temas mucho peor que un modelo
  de oraciones, y en español se cae más. Si tu problema es solo texto, usa un modelo de texto; CLIP
  es el puente cuando hay imágenes de por medio.
* **No modela negaciones.** `"a cat"` y `"not a cat"` quedan casi encima.

### Para seguir

* El paper: [arXiv 2103.00020](https://arxiv.org/abs/2103.00020)
* El notebook original de OpenAI:
  [Interacting_with_CLIP.ipynb](https://colab.research.google.com/github/openai/clip/blob/master/notebooks/Interacting_with_CLIP.ipynb)
* En el curso: la unidad de embeddings (la matriz de CLIP con la temperatura) y el notebook 15,
  donde CLIP se usa para clasificación zero-shot sobre hormigas y abejas.
""")

nb = {"cells": [_fix(c) for c in celdas],
      "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
                   "language_info": {"name": "python", "version": "3.11"}},
      "nbformat": 4, "nbformat_minor": 5}
io.open("29_clip_multimodal.ipynb", "w", encoding="utf-8").write(json.dumps(nb, ensure_ascii=False, indent=1))
print(f"celdas: {len(celdas)}  (md {sum(1 for c in celdas if c['cell_type']=='markdown')}, "
      f"code {sum(1 for c in celdas if c['cell_type']=='code')})")
