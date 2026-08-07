"""Genera img/Clase_LLM_escala_parametros.png (diapositiva "Lo que Escalo fue el Tamano").

Grafica de burbujas: x = fecha de publicacion, y = tamano en miles de millones de
parametros (escala LINEAL, a proposito) y el AREA de cada burbuja tambien es
proporcional al numero de parametros. La redundancia es deliberada: es lo que hace
que la escalada se vea de un golpe en vez de tener que leer numeros.

Se corre solo:  python3 scripts/gen_escala_parametros.py
Descarga el CSV la primera vez y lo cachea al lado del script.

Datos: Epoch AI, "Data on AI Models" (notable_ai_models.csv), licencia CC-BY 4.0.
Cada valor se toma del CSV por nombre exacto de modelo — no hay numeros escritos a
mano. La unica excepcion, declarada en el pie de la grafica, es Qwen2.5-1.5B (el
modelo del notebook 17), que no esta en el dataset y sale de su model card.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
import numpy as np
import datetime as dt
import os
import urllib.request

BG = "#1b1b2f"
FG = "#ece6d0"
DIM = "#8a86a0"
BLUE = "#58C4DD"
YELLOW = "#FFFF00"
GREEN = "#83C167"
RED = "#FC6255"
ORANGE = "#FF862F"
PURPLE = "#9A72AC"
TEAL = "#5CD0B3"
PINK = "#E48BB0"

CSV = "https://epoch.ai/data/notable_ai_models.csv"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "notable_ai_models.csv")
if not os.path.exists(CACHE):
    print(f"descargando {CSV} ...")
    urllib.request.urlretrieve(CSV, CACHE)
d = pd.read_csv(CACHE)
d["dt"] = pd.to_datetime(d["Publication date"], errors="coerce")


def get(nombre):
    r = d[d["Model"] == nombre]
    assert len(r) == 1, f"{nombre}: {len(r)} coincidencias en el CSV"
    r = r.iloc[0]
    return r["dt"], float(r["Parameters"]) / 1e9      # en miles de millones


# ---------------------------------------------------------------
# (nombre en el CSV, etiqueta, color, moe, dx_dias, dy, alineacion)
#   moe=True  -> sus autores lo documentan como mixture of experts
#   dx/dy     -> desplazamiento de la etiqueta; dy en unidades del eje (miles de M)
#   ha="in"   -> la etiqueta va DENTRO de la burbuja
# ---------------------------------------------------------------
MODELOS = [
    # Los seis primeros son puntos: sus etiquetas se apilan en la zona vacia
    # de la izquierda ("LM"), con guia hasta el punto. Es la unica forma de que
    # se lean, y de paso deja ver que todos ellos caben en el grosor del eje.
    ("GPT-1",                    "GPT-1",        DIM,    False, -137,  400, "left"),
    ("BERT-Large",               "BERT",         BLUE,   False, -269,  750, "left"),
    ("GPT-2 (1.5B)",             "GPT-2",        GREEN,  False, -395, 1098, "left"),
    ("Megatron-LM (8.3B)",       "Megatron",     DIM,    False, -610, 1442, "left"),
    ("T5-11B",                   "T5",           TEAL,   False, -646, 1789, "left"),
    ("Turing-NLG",               "Turing-NLG",   PURPLE, False, -759, 2133, "left"),
    ("GPT-3 175B (davinci)",     "GPT-3",        RED,    False, -134,  305, "right"),
    ("Switch",                   "Switch",       PINK,   True,     0,    0, "in"),
    ("Megatron-Turing NLG 530B", "Megatron-Turing", DIM, False, -170,  230, "right"),
    ("Chinchilla",               "Chinchilla",   TEAL,   False, -150,  230, "right"),
    ("BLOOM-176B",               "BLOOM",        GREEN,  False,  110,  -60, "left"),
    ("PaLM (540B)",              "PaLM",         PURPLE, False,   10,  330, "center"),
    ("PaLM 2",                   "PaLM 2",       BLUE,   False,   10,  290, "center"),
    ("Llama 2-70B",              "Llama 2",      ORANGE, False, -185,  330, "right"),
    ("GPT-4 (Jun 2023)",         "GPT-4",        YELLOW, False,    0,    0, "in"),
    ("Llama 3.1-405B",           "Llama 3.1",    ORANGE, False, -200, -310, "center"),
    ("DeepSeek-V3",              "DeepSeek-V3",  TEAL,   True,  -110,  380, "center"),
    ("Kimi K2",                  "Kimi K2",      PINK,   True,   130,  -80, "left"),
    ("Grok 3",                   "Grok 3",       RED,    False,    0,    0, "in"),
    ("Qwen 3.8 Max",             "Qwen 3.8\nMax", GREEN, False,   0,    0, "in"),
]

fig, ax = plt.subplots(figsize=(15.5, 7.6), dpi=150)
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

P_MAX = max(get(m[0])[1] for m in MODELOS)
R_MAX = 52.0          # radio en puntos de la burbuja mas grande
R_MIN = 3.2           # piso, para que los modelos chicos sigan siendo visibles


def radio(p):
    """Radio en puntos, con AREA proporcional al numero de parametros."""
    return max(R_MIN, R_MAX * np.sqrt(p / P_MAX))


# ---- linea divisoria LM / LLM, en GPT-3 ----
corte = dt.datetime(2020, 5, 28)
ax.axvline(corte, color=DIM, lw=1.4, ls="--", alpha=0.55, zorder=1)
ax.text(dt.datetime(2018, 11, 1), 3140, "LM", color=DIM, fontsize=21, ha="center", alpha=0.75)
ax.text(dt.datetime(2022, 6, 1), 3140, "LLM", color=DIM, fontsize=21, ha="center", alpha=0.75)

# ---- burbujas ----
for nombre, etq, col, moe, dx, dy, ha in MODELOS:
    x, p = get(nombre)
    r = radio(p)
    ax.scatter([x], [p], s=np.pi * r ** 2, c=col, alpha=0.72,
               edgecolors=(FG if moe else col), linewidths=(1.8 if moe else 0),
               linestyle=("--" if moe else "-"), zorder=4)

    txt = f"{etq}\n{p:,.0f} B" if p >= 20 else f"{etq}  {p:g} B"
    if ha == "in":
        ax.text(x, p, txt, color="#141426", fontsize=12.5, fontweight="bold",
                ha="center", va="center", zorder=6, linespacing=1.15)
    else:
        ax.annotate(txt, xy=(x, p), xytext=(x + dt.timedelta(days=dx), p + dy),
                    color=col, fontsize=12.5, ha=ha, va="center", zorder=6,
                    linespacing=1.2,
                    arrowprops=dict(arrowstyle="-", color=col, lw=0.9, alpha=0.5,
                                    shrinkA=2, shrinkB=r * 0.75))

# ---- el modelo del curso (fuente distinta, declarada) ----
qx, qp = dt.datetime(2024, 9, 19), 1.54
ax.scatter([qx], [qp], s=np.pi * R_MIN ** 2, marker="*", c=FG, zorder=6)
ax.annotate("Qwen2.5-1.5B — el que corres en Colab\n(1.5 B: a esta escala es un punto)",
            xy=(qx, qp), xytext=(qx + dt.timedelta(days=270), 215),
            color=FG, fontsize=12, ha="left", va="center", linespacing=1.25,
            arrowprops=dict(arrowstyle="-", color=FG, lw=0.9, alpha=0.5,
                            shrinkA=2, shrinkB=4))

ax.set_ylim(-140, 3320)
ax.set_xlim(dt.datetime(2017, 8, 1), dt.datetime(2027, 10, 1))
ax.set_yticks([0, 500, 1000, 1500, 2000, 2500, 3000])
ax.xaxis.set_major_locator(mdates.YearLocator(1))
ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
ax.set_ylabel("miles de millones de parámetros   (1000 = 1 billón)",
              color=FG, fontsize=15, labelpad=10)

for y in (500, 1000, 1500, 2000, 2500, 3000):
    ax.axhline(y, color=DIM, lw=0.6, ls=":", alpha=0.28, zorder=0)
ax.axhline(0, color=DIM, lw=0.8, alpha=0.5, zorder=0)

for s in ("top", "right"):
    ax.spines[s].set_visible(False)
for s in ("left", "bottom"):
    ax.spines[s].set_color(DIM)
    ax.spines[s].set_alpha(0.5)
ax.tick_params(colors=FG, labelsize=14.5)
ax.grid(False)

fig.text(0.075, 0.963,
         "el área de cada burbuja es proporcional al número de parámetros   ·   "
         "borde punteado = mixture of experts",
         color=DIM, fontsize=14, ha="left", va="top")
fig.text(0.075, 0.028,
         "Datos: Epoch AI, «Data on AI Models» (notable_ai_models.csv, ago. 2026), CC-BY 4.0 · "
         "epoch.ai/data/ai-models   ·   Qwen2.5-1.5B: model card de Hugging Face",
         color=DIM, fontsize=11.5, ha="left")

fig.subplots_adjust(left=0.075, right=0.985, top=0.925, bottom=0.10)
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "img", "Clase_LLM_escala_parametros.png")
fig.savefig(SALIDA, facecolor=BG)
print("ok ->", os.path.normpath(SALIDA))
print(f"modelos: {len(MODELOS)}   mayor: {P_MAX:,.0f} B   menor: "
      f"{min(get(m[0])[1] for m in MODELOS):g} B")
