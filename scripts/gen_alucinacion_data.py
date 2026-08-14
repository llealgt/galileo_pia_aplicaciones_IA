"""Por que no se puede detectar una alucinacion mirando la confianza.

Se usa la plantilla de chat y se mide la distribucion del PRIMER token de
la respuesta, que es donde el modelo tiene que comprometerse con un hecho.
"""
import io, json, torch
from transformers import AutoTokenizer, AutoModelForCausalLM

N = "Qwen/Qwen2.5-1.5B-Instruct"
tok = AutoTokenizer.from_pretrained(N)
mod = AutoModelForCausalLM.from_pretrained(N, torch_dtype=torch.float32).eval()

CASOS = [
    ("lo sabe", "¿Cuál es la capital de Francia? Responde solo el nombre.",
     "estuvo mil veces en el corpus"),
    ("no puede saberlo", "¿Cuántos días de vacaciones otorga al año la empresa "
     "Textiles del Valle S.A.? Responde solo el número.",
     "dato interno: jamás pudo estar en el corpus"),
    ("no existe", "¿Cómo se llama el elemento químico de número atómico 141? "
     "Responde solo el nombre.",
     "no existe tal elemento"),
]

datos = []
for nombre, preg, nota in CASOS:
    msgs = [{"role": "user", "content": preg}]
    txt = tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    ent = tok(txt, return_tensors="pt")
    with torch.no_grad():
        logits = mod(**ent).logits[0, -1]
    p = torch.softmax(logits, dim=-1)
    top = torch.topk(p, 10)
    H = float(-(p * torch.log2(p.clamp_min(1e-12))).sum())
    piezas = [tok.decode([i]) for i in top.indices]
    probs = [round(float(v), 4) for v in top.values]
    # y que contesta de verdad
    with torch.no_grad():
        gen = mod.generate(**ent, max_new_tokens=14, do_sample=False,
                           temperature=None, top_p=None, top_k=None,
                           pad_token_id=tok.eos_token_id)
    resp = tok.decode(gen[0][ent["input_ids"].shape[1]:], skip_special_tokens=True).strip()
    datos.append({"n": nombre, "preg": preg, "nota": nota, "resp": resp,
                  "piezas": piezas, "probs": probs, "entropia": round(H, 2),
                  "top1": probs[0]})
    print("=" * 74)
    print(f"[{nombre}]  {preg}")
    print(f"  responde: «{resp}»")
    print(f"  entropía del primer token = {H:.2f} bits   ·   top-1 = {probs[0]:.3f}")
    for pz, pr in zip(piezas, probs):
        print(f"    {pr:6.3f} {repr(pz)[1:-1]:<14} {'█' * max(1, int(pr * 50))}")
    print()

L = ["// ============================================================",
     "// Datos del widget \"por que alucinan\"  (GENERADO, no editar)",
     "// scripts/gen_alucinacion_data.py",
     "//",
     "// Distribucion REAL del PRIMER token de la respuesta con",
     "// Qwen2.5-1.5B-Instruct y su plantilla de chat. Ese es el token en",
     "// que el modelo tiene que comprometerse con el hecho.",
     "// La entropia se calcula sobre las 151k opciones del vocabulario.",
     "//",
     "// HALLAZGO, y es el contenido de la diapositiva: la confianza NO",
     "// distingue el caso que sabe del que no. Se midio primero con",
     "// continuaciones sueltas y salio al reves de lo esperado (mas",
     "// entropia en el caso conocido, porque ahi tocaba elegir un",
     "// articulo). Con la plantilla de chat el modelo se compromete, y",
     "// aun asi contesta con aplomo lo que no puede saber.",
     "// ============================================================",
     "",
     "const ALUC_CASOS = ["]
for d in datos:
    L.append(f'  {{ n: {json.dumps(d["n"], ensure_ascii=False)},')
    L.append(f'    preg: {json.dumps(d["preg"], ensure_ascii=False)},')
    L.append(f'    nota: {json.dumps(d["nota"], ensure_ascii=False)},')
    L.append(f'    resp: {json.dumps(d["resp"], ensure_ascii=False)},')
    L.append(f'    entropia: {d["entropia"]}, top1: {d["top1"]},')
    L.append(f'    piezas: {json.dumps(d["piezas"], ensure_ascii=False)},')
    L.append(f'    probs: {d["probs"]} }},')
L.append("];")
io.open("alucinacion-data.js", "w", encoding="utf-8").write("\n".join(L) + "\n")
print("guardado")
