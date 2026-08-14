"""Genera js/widgets/cut-head-data.js: miniaturas + numeros MEDIDOS."""
import io, base64, numpy as np, torch, torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights
from sklearn.datasets import load_sample_images
from PIL import Image

W = ResNet50_Weights.DEFAULT
red = resnet50(weights=W).eval()
prep = W.transforms()
CLASES = W.meta["categories"]

img = load_sample_images().images
china, flower = Image.fromarray(img[0]), Image.fromarray(img[1])

def recorta(im, f=0.55):
    w, h = im.size; cw, ch = int(w*f), int(h*f)
    return im.crop(((w-cw)//2, (h-ch)//2, (w+cw)//2, (h+ch)//2))

MUESTRAS = [
    ("china",     china,                                        "base"),
    ("volteada",  china.transpose(Image.FLIP_LEFT_RIGHT),        "flip"),
    ("recortada", recorta(china),                                "crop"),
    ("flor",      flower,                                        "base"),
    ("flor volt.", flower.transpose(Image.FLIP_LEFT_RIGHT),      "flip"),
]
lote = torch.stack([prep(m[1]) for m in MUESTRAS])
with torch.no_grad():
    logits = red(lote)
prob = logits.softmax(1)
cabeza = []
for i in range(len(MUESTRAS)):
    p, c = prob[i].topk(3)
    cabeza.append([[CLASES[c[k]], round(float(p[k]), 3)] for k in range(3)])

extractor = nn.Sequential(*list(red.children())[:-1])
with torch.no_grad():
    v = extractor(lote).flatten(1)
v = nn.functional.normalize(v, dim=1)
S = (v @ v.T).numpy()
muestra_vec = [round(float(x), 3) for x in v[0][:10]]

def b64(im, w=132):
    im = im.convert("RGB")
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=62, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()

L = []
L.append("// ============================================================")
L.append("// Datos del widget \"cortar la cabeza\"  (GENERADO, no editar a mano)")
L.append("// scripts/gen_cut_head_data.py")
L.append("//")
L.append("// ResNet-50 con los pesos por defecto de torchvision, sobre las dos")
L.append("// imagenes que trae sklearn (load_sample_images) y variantes suyas.")
L.append("// Se midio lo mismo por los dos caminos:")
L.append("//   con la cabeza  -> las 3 clases mas probables de las 1000 de ImageNet")
L.append("//   sin la cabeza  -> el vector de 2048 dim y los cosenos entre imagenes")
L.append("//")
L.append("// Imagenes: china.jpg y flower.jpg de scikit-learn, CC-BY 2.0,")
L.append("// de danielbuechele y vultilion en Flickr. Las variantes (volteada,")
L.append("// recortada) se derivan en el canvas para no duplicar bytes.")
L.append("// ============================================================")
L.append("")
L.append(f'const CORTE_IMG_CHINA = "data:image/jpeg;base64,{b64(china)}";')
L.append(f'const CORTE_IMG_FLOR  = "data:image/jpeg;base64,{b64(flower)}";')
L.append("")
L.append("const CORTE_MUESTRAS = [")
for i, (n, _, modo) in enumerate(MUESTRAS):
    src = "CHINA" if i < 3 else "FLOR"
    top = ", ".join(f'["{c}", {p}]' for c, p in cabeza[i])
    L.append(f'  {{ n: "{n}", src: "{src}", modo: "{modo}", cabeza: [{top}] }},')
L.append("];")
L.append("")
L.append("// cosenos entre los vectores de 2048 dim (medidos)")
L.append("const CORTE_COS = [")
for i in range(len(MUESTRAS)):
    L.append("  [" + ", ".join(f"{S[i][j]:.3f}" for j in range(len(MUESTRAS))) + "],")
L.append("];")
L.append("")
L.append(f"const CORTE_VECTOR = {muestra_vec};   // primeros 10 de los 2048 de 'china'")
out = "\n".join(L) + "\n"
io.open("cut-head-data.js", "w", encoding="utf-8").write(out)
print("bytes:", len(out))
