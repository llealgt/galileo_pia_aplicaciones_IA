"""Genera js/widgets/tokens-data.js con tokenizaciones REALES.

Tokenizador de Qwen2.5-1.5B-Instruct, el modelo que los estudiantes corren
en los notebooks 17 y 28. Se eligen frases que muestran cosas distintas:
palabra comun, palabra rara, acentos, numeros, codigo y otro idioma.
"""
import io, json
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")

FRASES = [
    ("común",     "El gato duerme en el sofá de la sala"),
    ("rara",      "La paradoja de la hiperinflación desconcertó al economista"),
    ("números",   "El pedido 4471 costó 1250.75 quetzales el 3 de marzo de 2024"),
    ("código",    "def calcular_total(precio, iva=0.12): return precio * (1 + iva)"),
    ("inglés",    "The cat is sleeping on the sofa in the living room"),
    ("emoji",     "Nos vemos mañana 🎉 ¿confirmas? ¡Gracias!"),
]

datos = []
print(f"{'caso':<10} {'caracteres':>11} {'tokens':>8} {'car/token':>10}")
for nombre, t in FRASES:
    ids = tok.encode(t)
    piezas = [tok.decode([i]) for i in ids]
    datos.append({"n": nombre, "texto": t, "ids": ids, "piezas": piezas})
    print(f"{nombre:<10} {len(t):>11} {len(ids):>8} {len(t)/len(ids):>10.2f}")

print()
for d in datos[:3]:
    print(f"«{d['texto'][:52]}»")
    print("   " + " | ".join(repr(p)[1:-1] for p in d["piezas"][:18]))
    print()

L = ["// ============================================================",
     "// Datos del widget de tokens  (GENERADO, no editar a mano)",
     "// scripts/gen_tokens_data.py",
     "//",
     "// Tokenizaciones REALES con el tokenizador de Qwen2.5-1.5B-Instruct,",
     "// el modelo que los estudiantes corren en los notebooks 17 y 28.",
     "// Las piezas son tok.decode() de cada id, asi que los espacios que se",
     "// ven pegados al inicio de una pieza estan de verdad en el token.",
     "// ============================================================",
     "",
     "const TOK_CASOS = ["]
for d in datos:
    piezas = ", ".join(json.dumps(p, ensure_ascii=False) for p in d["piezas"])
    L.append(f'  {{ n: {json.dumps(d["n"], ensure_ascii=False)}, '
             f'texto: {json.dumps(d["texto"], ensure_ascii=False)},')
    L.append(f'    ids: {d["ids"]},')
    L.append(f'    piezas: [{piezas}] }},')
L.append("];")
out = "\n".join(L) + "\n"
io.open("tokens-data.js", "w", encoding="utf-8").write(out)
print("bytes:", len(out))
