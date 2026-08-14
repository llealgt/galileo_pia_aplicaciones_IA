"""Genera js/widgets/clip-data.js: la matriz contrastiva de CLIP, MEDIDA.

Tres imagenes locales (sin descargas) contra seis descripciones en espanol.
CLIP pone imagenes y textos en el MISMO espacio, asi que la similitud
imagen-texto se calcula igual que texto-texto: un coseno.
"""
import io, os, base64, numpy as np, torch, matplotlib
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from sklearn.datasets import load_sample_images

M = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").eval()
P = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

img = load_sample_images().images
china, flower = Image.fromarray(img[0]), Image.fromarray(img[1])
gh = Image.open(os.path.join(os.path.dirname(matplotlib.__file__),
                             "mpl-data", "sample_data", "grace_hopper.jpg")).convert("RGB")

IMGS = [("pagoda", china), ("flor", flower), ("retrato", gh)]
TEXTOS = [
    "un templo antiguo junto a un lago",
    "una flor amarilla en primer plano",
    "el retrato de una mujer con uniforme",
    "un plato de pasta recien servido",
    "un gato durmiendo en un sofá",
    "una grafica de barras en una pantalla",
]

with torch.no_grad():
    ent = P(text=TEXTOS, images=[i[1] for i in IMGS], return_tensors="pt",
            padding=True, truncation=True)
    vi = M.get_image_features(pixel_values=ent["pixel_values"])
    vt = M.get_text_features(input_ids=ent["input_ids"],
                             attention_mask=ent["attention_mask"])
vi = torch.nn.functional.normalize(vi, dim=1)
vt = torch.nn.functional.normalize(vt, dim=1)
S = (vi @ vt.T).numpy()

# CLIP no usa el coseno crudo: lo multiplica por una temperatura APRENDIDA
# y luego aplica softmax por fila. Ese factor es lo que convierte una
# diferencia de 0.26 contra 0.18 en una decision.
escala = float(M.logit_scale.exp())
PROB = torch.softmax(torch.tensor(S) * escala, dim=1).numpy()
print(f"temperatura aprendida (logit_scale.exp()) = {escala:.1f}")
print("softmax por fila con esa temperatura:")
for i, (n, _) in enumerate(IMGS):
    print(f"  {n:>10}" + "".join(f"{PROB[i][j]:>9.3f}" for j in range(len(TEXTOS))))
print()

print(f"{'':>10}" + "".join(f"{t[:13]:>15}" for t in TEXTOS))
for i, (n, _) in enumerate(IMGS):
    print(f"{n:>10}" + "".join(f"{S[i][j]:>15.3f}" for j in range(len(TEXTOS))))
print()
for i, (n, _) in enumerate(IMGS):
    j = int(np.argmax(S[i]))
    print(f"  {n:<9} -> «{TEXTOS[j]}»   ({S[i][j]:.3f})   "
          f"{'OK' if j == i else 'FALLA'}")

def b64(im, w=150):
    im = im.convert("RGB")
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "JPEG", quality=62, optimize=True)
    return base64.b64encode(b.getvalue()).decode()

L = ["// ============================================================",
     "// Datos del widget de CLIP  (GENERADO, no editar a mano)",
     "// scripts/gen_clip_data.py",
     "//",
     "// openai/clip-vit-base-patch32 sobre tres imagenes locales y seis",
     "// descripciones en espanol. La matriz son cosenos REALES entre el",
     "// vector de la imagen y el del texto: CLIP los pone en el MISMO",
     "// espacio, asi que se comparan igual que dos textos.",
     "//",
     "// Imagenes: china.jpg y flower.jpg de scikit-learn (CC-BY 2.0,",
     "// danielbuechele y vultilion) y grace_hopper.jpg de matplotlib.",
     "// ============================================================",
     ""]
for (n, im) in IMGS:
    L.append(f'const CLIP_IMG_{n.upper()} = "data:image/jpeg;base64,{b64(im)}";')
L.append("")
L.append("const CLIP_IMGS = [" + ", ".join(f'{{ n: "{n}", src: CLIP_IMG_{n.upper()} }}'
                                           for n, _ in IMGS) + "];")
L.append("const CLIP_TEXTOS = [" + ", ".join(f'"{t}"' for t in TEXTOS) + "];")
L.append("const CLIP_SIM = [")
for i in range(len(IMGS)):
    L.append("  [" + ", ".join(f"{S[i][j]:.3f}" for j in range(len(TEXTOS))) + "],")
L.append("];")
L.append("")
L.append("// softmax por fila tras multiplicar por la temperatura aprendida")
L.append(f"const CLIP_ESCALA = {escala:.1f};")
L.append("const CLIP_PROB = [")
for i in range(len(IMGS)):
    L.append("  [" + ", ".join(f"{PROB[i][j]:.4f}" for j in range(len(TEXTOS))) + "],")
L.append("];")
out = "\n".join(L) + "\n"
io.open("clip-data.js", "w", encoding="utf-8").write(out)
print("\nbytes:", len(out))
