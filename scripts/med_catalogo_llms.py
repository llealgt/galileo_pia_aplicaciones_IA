# -*- coding: utf-8 -*-
'''Cuenta de parametros de los modelos del catalogo de la unidad 12.

Los numeros salen de `safetensors.total` de la API de Hugging Face, que es lo que
el propio repositorio del modelo declara. NO se copian de blogs comparativos: al
preparar la diapositiva, las busquedas devolvieron nombres de modelos inexistentes
("Ornith-1.5-397B", "dots3-note Preview"), y de ahi la regla de bajar a la API.

Ojo con dos trampas que costaron una pasada extra:
  - los repos con sufijo `-assistant` NO son los pesos del modelo (son modelos
    auxiliares para decodificacion especulativa): google/gemma-4-31B-it-assistant
    reporta 469 M, mientras que google/gemma-4-31B-it reporta 31.3 B.
  - los repos `-NVFP4` / `-FP8` estan cuantizados y su total sale mas bajo que el
    real: usar la variante BF16 para contar.

Uso:  python3 med_catalogo_llms.py
'''
import json, urllib.request, urllib.parse

MODELOS = [
    # grandes
    "moonshotai/Kimi-K3", "Qwen/Qwen3.8-2.4T-A95B", "deepseek-ai/DeepSeek-V4-Pro",
    "moonshotai/Kimi-K2.7-Code", "zai-org/GLM-5.2",
    "mistralai/Mistral-Large-3-675B-Instruct-2512",
    "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16",
    "meta-llama/Llama-4-Maverick-17B-128E-Instruct", "MiniMaxAI/MiniMax-M2.7",
    "CohereLabs/command-a-plus-05-2026-bf16", "mistralai/Mistral-Medium-3.5-128B",
    "openai/gpt-oss-120b", "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    # los que caben en una maquina
    "allenai/Olmo-3.1-32B-Instruct", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",
    "google/gemma-4-31B-it", "Qwen/Qwen3.8-27B", "openai/gpt-oss-20b",
    "microsoft/phi-4", "google/gemma-4-12B-it", "ibm-granite/granite-4.1-8b",
    "tiiuae/Falcon-H1R-7B", "allenai/Olmo-3-7B-Instruct",
    "Qwen/Qwen3-4B-Instruct-2507", "HuggingFaceTB/SmolLM3-3B",
    "Qwen/Qwen2.5-1.5B-Instruct", "google/gemma-3-270m-it",
]

def api(path):
    req = urllib.request.Request("https://huggingface.co/api/" + path,
                                 headers={"User-Agent": "curso-galileo/1.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)

def humano(n):
    if n is None: return "—"
    for u, d in (("T", 1e12), ("B", 1e9), ("M", 1e6)):
        if n >= d:
            v = n / d
            return f"{v:.2f} {u}" if v < 10 else f"{v:.3g} {u}"
    return str(n)

if __name__ == "__main__":
    print(f"{'modelo':<48} {'parametros':>18} {'humano':>9} {'licencia':>12}  MoE")
    print("-" * 104)
    for mid in MODELOS:
        try:
            m = api("models/" + urllib.parse.quote(mid))
        except Exception as e:
            print(f"{mid:<48} ERROR {e}"); continue
        total = (m.get("safetensors") or {}).get("total")
        lic = next((t.split(":", 1)[1] for t in m.get("tags", []) if t.startswith("license:")), "?")
        cfg = m.get("config", {}) or {}
        txt = cfg.get("text_config") or cfg
        moe = " ".join(f"{k}={txt[k]}" for k in
                       ("num_experts", "n_routed_experts", "num_local_experts", "num_experts_per_tok")
                       if k in txt)
        print(f"{mid:<48} {(f'{total:,}' if total else '—'):>18} {humano(total):>9} {lic:>12}  {moe}")
