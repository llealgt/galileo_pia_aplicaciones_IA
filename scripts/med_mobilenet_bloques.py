"""Estructura real de MobileNetV2 y parametros entrenables por estrategia."""
import torch, torch.nn as nn
from torchvision.models import mobilenet_v2, MobileNet_V2_Weights

m = mobilenet_v2(weights=MobileNet_V2_Weights.DEFAULT)
tot = sum(p.numel() for p in m.parameters())
print(f"MobileNetV2 · {tot:,} parametros en total")
print(f"  features : {sum(p.numel() for p in m.features.parameters()):,}")
print(f"  clasificador (1000 clases): {sum(p.numel() for p in m.classifier.parameters()):,}")
print(f"  bloques en features: {len(m.features)}")
print()
print("parametros por bloque:")
acum = 0
grupos = []
for i, b in enumerate(m.features):
    n = sum(p.numel() for p in b.parameters())
    acum += n
    grupos.append((i, n, acum))
    print(f"  features[{i:>2}]  {n:>9,}   acumulado {acum:>9,}  ({acum/tot:5.1%})")

print()
print("=" * 74)
print("PARAMETROS ENTRENABLES SEGUN LA ESTRATEGIA  (cabeza binaria de 1281)")
print("=" * 74)
cab = 1280 * 1 + 1        # la cabeza binaria de los notebooks 13/14
print(f"  desde cero (todo entrenable)        {tot - sum(p.numel() for p in m.classifier.parameters()) + cab:>12,}")
print(f"  feature extraction (solo la cabeza) {cab:>12,}")
for k in (1, 2, 3, 4, 6):
    desc = sum(n for i, n, _ in grupos if i >= len(m.features) - k)
    print(f"  fine-tuning: ultimos {k} bloques      {desc + cab:>12,}   ({(desc+cab)/tot:5.1%} del modelo)")
