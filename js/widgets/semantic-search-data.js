// ============================================================
// Datos del widget de busqueda semantica  (GENERADO, no editar a mano)
// scripts/gen_semantic_search_data.py
//
// 13 documentos de 4 temas y 5 consultas, codificados con
// paraphrase-multilingual-MiniLM-L12-v2 (384 dim).
//
// Las coordenadas son t-SNE (perplexity 5, semilla 0) sobre la matriz
// de distancias coseno. La proyeccion NO se eligio a ojo: se probaron
// PCA, MDS con 5 semillas y t-SNE con 3 perplejidades, y se midio en
// cada una cuanto coincide el vecino mas cercano DEL DIBUJO con el
// vecino mas cercano REAL. Resultados: PCA 40 % de aciertos en top-1,
// MDS 60-80 %, t-SNE p5 100 % (y 93 % de solape en top-3, 100 % de
// pureza por tema). Por eso el dibujo se puede leer sin mentir.
//
// Los puntajes que muestra el widget son los cosenos REALES en 384
// dimensiones, no la distancia del dibujo.
// ============================================================

const BUSQ_DOCS = [
  { t: "Sofreír la cebolla a fuego bajo hasta que quede transparente", tema: "cocina", x: 0.3813, y: 0.0308 },
  { t: "La masa necesita reposar una hora antes de estirarla", tema: "cocina", x: 0.4649, y: 0.2211 },
  { t: "Sazonar la carne con sal gruesa media hora antes", tema: "cocina", x: 0.5572, y: 0.1759 },
  { t: "El horno debe precalentarse a 180 grados", tema: "cocina", x: 0.4909, y: 0.0000 },
  { t: "El delantero marcó de cabeza en el minuto ochenta", tema: "fútbol", x: 0.7465, y: 0.6246 },
  { t: "El árbitro expulsó al defensa por doble amarilla", tema: "fútbol", x: 0.9751, y: 0.5729 },
  { t: "El equipo cambió a una defensa de tres centrales", tema: "fútbol", x: 0.8832, y: 0.6904 },
  { t: "Júpiter tiene al menos noventa lunas confirmadas", tema: "astronomía", x: 0.4965, y: 1.0000 },
  { t: "La luz de esa estrella tardó cuatro años en llegarnos", tema: "astronomía", x: 0.4501, y: 0.8362 },
  { t: "El telescopio capta longitudes de onda infrarrojas", tema: "astronomía", x: 0.3336, y: 0.8812 },
  { t: "Conviene apartar tres meses de gastos como fondo de emergencia", tema: "finanzas", x: 0.2657, y: 0.3617 },
  { t: "El interés compuesto favorece a quien empieza temprano", tema: "finanzas", x: 0.0138, y: 0.4422 },
  { t: "Diversificar reduce el riesgo de una sola inversión", tema: "finanzas", x: 0.0000, y: 0.3544 },
];

const BUSQ_CONSULTAS = [
  { t: "¿cómo preparo la salsa?", x: 0.6138, y: 0.0824,
    sim: [0.295, 0.281, 0.452, 0.348, 0.092, -0.049, 0.040, -0.066, -0.039, -0.049, -0.017, 0.067, -0.070] },
  { t: "resultado del partido de ayer", x: 0.7370, y: 0.5511,
    sim: [0.176, 0.145, 0.154, 0.016, 0.503, 0.236, 0.249, 0.010, 0.236, 0.046, 0.082, 0.136, 0.036] },
  { t: "cuántos satélites tiene el planeta más grande", x: 0.3897, y: 0.9756,
    sim: [-0.038, -0.004, -0.047, 0.027, 0.046, 0.034, -0.003, 0.598, 0.302, 0.402, -0.037, -0.041, 0.020] },
  { t: "quiero empezar a ahorrar", x: 0.1504, y: 0.3952,
    sim: [0.158, 0.254, 0.180, 0.155, -0.047, -0.115, 0.046, -0.055, 0.096, -0.020, 0.392, 0.374, 0.347] },
  { t: "¿por qué me sancionaron con tarjeta?", x: 1.0000, y: 0.4914,
    sim: [0.043, 0.071, 0.034, -0.048, 0.146, 0.338, 0.116, -0.021, 0.143, -0.053, 0.150, 0.084, 0.030] },
];

// primeros 8 de los 384 numeros del vector de la consulta 1, para la animacion
const BUSQ_MUESTRA_VECTOR = [-0.036, -0.048, 0.008, -0.008, -0.06, 0.008, -0.029, -0.06];
