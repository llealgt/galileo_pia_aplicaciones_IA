"""Genera img/Clase_LLM_escala_parametros.png (diapositiva "Lo que Escalo fue el Tamano").

Se corre solo:  python3 scripts/gen_escala_parametros.py
Descarga el CSV la primera vez y lo cachea al lado del script.

Datos: Epoch AI, "Data on AI Models" (notable_ai_models.csv), licencia CC-BY 4.0.
Se filtra Domain == Language con Parameters y fecha conocidos.
Nada se inventa: cada punto viene del CSV. La unica excepcion declarada es
Qwen2.5-1.5B-Instruct (el modelo del notebook 17), que no esta en el dataset y
se toma de su model card en Hugging Face.
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

CSV = "https://epoch.ai/data/notable_ai_models.csv"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "notable_ai_models.csv")
if not os.path.exists(CACHE):
    print(f"descargando {CSV} ...")
    urllib.request.urlretrieve(CSV, CACHE)
d = pd.read_csv(CACHE)
d["dt"] = pd.to_datetime(d["Publication date"], errors="coerce")
L = d[d["Domain"].astype(str).str.contains("Language", na=False)
      & d["Parameters"].notna() & d["dt"].notna()].copy()
L = L[L["dt"] >= "1990-01-01"]
print(f"puntos: {len(L)}  rango {L['dt'].min().date()} .. {L['dt'].max().date()}")
print(f"params {L['Parameters'].min():.0f} .. {L['Parameters'].max():.3g}")


def get(nombre):
    r = L[L["Model"] == nombre]
    assert len(r) == 1, (nombre, len(r))
    r = r.iloc[0]
    return r["dt"], float(r["Parameters"])


# (modelo en el CSV, etiqueta, color, dx_dias, dy_decadas, alineacion)
HITOS = [
    ("LSTM with forget gates", "LSTM\n276 parámetros",      GREEN,   170,  0.75, "left"),
    ("IBM-5",                  "IBM Model 5",               DIM,     190, -1.05, "left"),
    ("NPLM (AP News)",         "Bengio, red neuronal\n12 M", BLUE,   100,  0.85, "left"),
    ("SB-LM",                  "Google, n-gramas\n300 mil millones", ORANGE, 120, 0.55, "left"),
    ("Word2Vec (large)",       "word2vec",                  PURPLE,  -60, -1.35, "center"),
    ("Transformer",            "Transformer",               YELLOW, -430, -1.35, "center"),
    ("BERT-Large",             "BERT",                      BLUE,     80, -2.05, "center"),
    ("GPT-2 (1.5B)",           "GPT-2",                     GREEN,   -30,  0.75, "center"),
    ("GPT-3 175B (davinci)",   "GPT-3\n175 mil millones",   RED,    -560,  0.55, "center"),
    ("PaLM (540B)",            "PaLM",                      DIM,     130, -1.1, "center"),
    ("GPT-4 (Jun 2023)",       "GPT-4  ~1.8 billones",      YELLOW, -130,  0.42, "right"),
    ("Grok 3",                 "Grok 3  ~3 billones",       RED,     -100,  0.80, "center"),
]

fig, ax = plt.subplots(figsize=(15.5, 7.4), dpi=150)
fig.patch.set_facecolor(BG)
ax.set_facecolor(BG)

# ---- la nube completa ----
ax.scatter(L["dt"], L["Parameters"], s=34, c=BLUE, alpha=0.22,
           edgecolors="none", zorder=2)

# ---- banda de la escalada ----
ax.axvspan(dt.datetime(2018, 1, 1), dt.datetime(2026, 10, 1),
           color=YELLOW, alpha=0.045, zorder=0)
ax.text(dt.datetime(2018, 4, 1), 10 ** 2.15, "la escalada:  2018 → hoy",
        color=YELLOW, alpha=0.85, fontsize=15.5, ha="left", style="italic")

# ---- lineas de referencia ----
for y, etq in [(1e6, "1 millón"), (1e9, "mil millones"), (1e12, "1 billón")]:
    ax.axhline(y, color=DIM, lw=0.7, ls=":", alpha=0.45, zorder=1)
    ax.text(dt.datetime(2027, 2, 1), y, etq, color=DIM, fontsize=13, alpha=0.95, va="center")

# ---- hitos ----
for nombre, etq, col, dx, dy, ha in HITOS:
    x, y = get(nombre)
    ax.scatter([x], [y], s=115, c=col, edgecolors=BG, linewidths=1.6, zorder=5)
    xt = x + dt.timedelta(days=dx)
    yt = y * (10 ** dy)
    ax.annotate(etq, xy=(x, y), xytext=(xt, yt), color=col, fontsize=14.5,
                ha=ha, va="center", zorder=6, linespacing=1.25,
                arrowprops=dict(arrowstyle="-", color=col, lw=1.0, alpha=0.55,
                                shrinkA=2, shrinkB=6))

# ---- el modelo del curso (fuente distinta, declarada) ----
qx, qy = dt.datetime(2024, 9, 19), 1.54e9
ax.scatter([qx], [qy], s=150, marker="*", c=FG, edgecolors=BG, linewidths=1.2, zorder=6)
ax.annotate("Qwen2.5-1.5B\nel que corres en Colab", xy=(qx, qy),
            xytext=(qx + dt.timedelta(days=100), qy * 10 ** -1.55),
            color=FG, fontsize=13.5, ha="center", va="center", linespacing=1.25,
            arrowprops=dict(arrowstyle="-", color=FG, lw=1.0, alpha=0.5,
                            shrinkA=2, shrinkB=6))

ax.set_yscale("log")
ax.set_ylim(10 ** 1.9, 10 ** 13.6)
ax.set_xlim(dt.datetime(1992, 1, 1), dt.datetime(2029, 6, 1))
ax.xaxis.set_major_locator(mdates.YearLocator(4))
ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y"))
ax.set_ylabel("parámetros  (escala logarítmica)", color=FG, fontsize=16, labelpad=12)

for s in ("top", "right"):
    ax.spines[s].set_visible(False)
for s in ("left", "bottom"):
    ax.spines[s].set_color(DIM)
    ax.spines[s].set_alpha(0.5)
ax.tick_params(colors=FG, labelsize=15)
ax.grid(False)

fig.text(0.085, 0.965,
         "cada punto es un modelo de lenguaje publicado \u2014 los 395 del dataset de Epoch AI con tama\u00f1o y fecha conocidos",
         color=DIM, fontsize=15, ha="left", va="top")
fig.text(0.085, 0.028,
         "Datos: Epoch AI, «Data on AI Models» (notable_ai_models.csv, ago. 2026), CC-BY 4.0 · "
         "epoch.ai/data/ai-models   ·   Qwen2.5-1.5B: model card de Hugging Face",
         color=DIM, fontsize=12, ha="left")

fig.subplots_adjust(left=0.085, right=0.985, top=0.915, bottom=0.105)
SALIDA = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "img", "Clase_LLM_escala_parametros.png")
fig.savefig(SALIDA, facecolor=BG)
print("ok ->", os.path.normpath(SALIDA))
