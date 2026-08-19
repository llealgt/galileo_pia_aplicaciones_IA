import numpy as np, torch
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM

E = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
enc = lambda xs: E.encode(xs, normalize_embeddings=True)

PREG = "¿Cuál es la capital de Guatemala?"
CORPUS = [
 "La capital de El Salvador es San Salvador.",
 "La capital de Guatemala es susceptible a temblores.",
 "La capital de Honduras es Tegucigalpa.",
 "Costa Rica abolió su ejército en 1948.",
 "La temporada de lluvias en la región va de mayo a octubre.",
]
q = enc([PREG])[0]; V = enc(CORPUS); s = V @ q
orden = np.argsort(-s)
print(f"consulta: «{PREG}»   (ningun documento dice la respuesta)\n")
for r, i in enumerate(orden, 1):
    print(f"  {r}. {s[i]:.3f}  {CORPUS[i]}")
top2 = [CORPUS[i] for i in orden[:2]]
print(f"\ntop-2 -> {top2}\n")

N = "Qwen/Qwen2.5-1.5B-Instruct"
tok = AutoTokenizer.from_pretrained(N)
llm = AutoModelForCausalLM.from_pretrained(N, torch_dtype=torch.float32).eval()
def gen(p, n=60):
    m = tok.apply_chat_template([{"role": "user", "content": p}], tokenize=False,
                                add_generation_prompt=True)
    e2 = tok(m, return_tensors="pt")
    with torch.no_grad():
        o = llm.generate(**e2, max_new_tokens=n, do_sample=False, temperature=None,
                         top_p=None, top_k=None, pad_token_id=tok.eos_token_id)
    return tok.decode(o[0][e2["input_ids"].shape[1]:], skip_special_tokens=True).strip()

ctx = "\n".join(f"[{i+1}] {t}" for i, t in enumerate(top2))
prompt = (f"Responde SOLO con la informacion del contexto. Si no alcanza, di que no la tienes.\n\n"
          f"--- CONTEXTO ---\n{ctx}\n--- FIN ---\n\nPREGUNTA: {PREG}")
print("=" * 78); print("LO QUE CONTESTA EL LLM CON ESE CONTEXTO"); print("=" * 78)
print(gen(prompt))
print()
print("=" * 78); print("Y SIN NINGUN CONTEXTO, PARA COMPARAR"); print("=" * 78)
print(gen(PREG, 30))
