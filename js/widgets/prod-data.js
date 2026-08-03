// ============================================================
// Datos reales de la unidad "Recuperacion en Produccion" (RAG_M3).
//
// rerank  : el MISMO corpus de Vancouver de la seccion 12, ahora con los
//           puntajes de un cross-encoder real (BAAI/bge-reranker-v2-m3).
//           Son logits, no probabilidades: la sigmoide satura y dejaria
//           casi todo en 0.0000. Resultado medido: los 4 documentos utiles
//           pasan de las posiciones 1,2,4,10 a ocupar 1,2,3,4 — el del
//           concierto sube del ULTIMO lugar al cuarto. AP@4: 0.688 -> 1.000.
//
// chunks  : un documento de 10 oraciones con dos temas (conciertos/hoteles
//           y clima/transporte) y la distancia coseno entre oraciones
//           consecutivas. La distancia maxima (0.958) cae exactamente en el
//           cambio de tema, entre la oracion 6 y la 7.
//
// colbert : matriz REAL de similitud token-a-token. Ojo: son embeddings de
//           token de paraphrase-multilingual-MiniLM-L12-v2, NO un ColBERT
//           entrenado para late interaction. El mecanismo de MaxSim que se
//           ilustra es identico y los numeros son medidos, pero un ColBERT
//           de verdad entrena esos vectores para esta tarea.
// ============================================================

const PROD_DEMO = {
 "rerank": {
  "consulta": "¿Por qué los hoteles en Vancouver están tan caros este fin de semana?",
  "docs": [
   "Taylor Swift presenta su Eras Tour en el BC Place de Vancouver del 6 al 8 de diciembre",
   "La ocupación hotelera en el centro de Vancouver llegó al 97% para el próximo fin de semana",
   "Los hoteles suben tarifas hasta 3 veces cuando hay eventos masivos en la ciudad",
   "Se esperan 60,000 visitantes en Vancouver por los conciertos de diciembre",
   "El BC Place tiene capacidad para 54,000 personas y está en el centro de la ciudad",
   "Las leyes de zonificación de 1970 limitaron la construcción de hoteles en el centro",
   "Guía de los mejores restaurantes de sushi en Vancouver",
   "El clima en Vancouver en diciembre suele ser lluvioso con 8 grados de promedio",
   "Cómo llegar del aeropuerto de Vancouver al centro en tren ligero",
   "Historia del equipo de hockey Vancouver Canucks desde 1970"
  ],
  "utiles": [
   0,
   1,
   2,
   3
  ],
  "bi": [
   0.2471,
   0.6342,
   0.6196,
   0.4043,
   0.3755,
   0.3192,
   0.3703,
   0.3678,
   0.4639,
   0.3274
  ],
  "cross": [
   -10.926,
   -2.738,
   -3.198,
   -10.456,
   -11.016,
   -11.008,
   -10.955,
   -11.022,
   -11.019,
   -11.004
  ]
 },
 "chunks": {
  "texto": "Taylor Swift presenta tres conciertos agotados en Vancouver este fin de semana como parte de su Eras Tour. Se esperan alrededor de 60,000 visitantes en la ciudad durante esos tres días. El BC Place, donde se realizan los shows, tiene capacidad para 54,000 personas. La demanda de hoteles se disparó apenas se anunciaron las fechas. Los hoteles del centro están completamente llenos y sus tarifas se duplicaron respecto al mes pasado. La ocupación hotelera del centro llegó al 97% para este fin de semana. Por otro lado, el clima en Vancouver en diciembre suele ser lluvioso. La temperatura promedio ronda los 8 grados centígrados durante todo el mes. Se recomienda llevar impermeable si se visita la ciudad en esta época del año. El transporte público conecta el aeropuerto con el centro en 26 minutos.",
  "oraciones": [
   "Taylor Swift presenta tres conciertos agotados en Vancouver este fin de semana como parte de su Eras Tour.",
   "Se esperan alrededor de 60,000 visitantes en la ciudad durante esos tres días.",
   "El BC Place, donde se realizan los shows, tiene capacidad para 54,000 personas.",
   "La demanda de hoteles se disparó apenas se anunciaron las fechas.",
   "Los hoteles del centro están completamente llenos y sus tarifas se duplicaron respecto al mes pasado.",
   "La ocupación hotelera del centro llegó al 97% para este fin de semana.",
   "Por otro lado, el clima en Vancouver en diciembre suele ser lluvioso.",
   "La temperatura promedio ronda los 8 grados centígrados durante todo el mes.",
   "Se recomienda llevar impermeable si se visita la ciudad en esta época del año.",
   "El transporte público conecta el aeropuerto con el centro en 26 minutos."
  ],
  "dist": [
   0.9087,
   0.4844,
   0.927,
   0.5845,
   0.4789,
   0.9583,
   0.6877,
   0.6907,
   0.858
  ]
 },
 "colbert": {
  "consulta": "buenos lugares para comer en Nueva York",
  "documento": "La comida de la ciudad de Nueva York incluye restaurantes de todo el mundo",
  "tok_q": [
   "buenos",
   "lugares",
   "para",
   "comer",
   "en",
   "Nueva",
   "York"
  ],
  "tok_d": [
   "La",
   "comida",
   "de",
   "la",
   "ciudad",
   "de",
   "Nueva",
   "York",
   "incluye",
   "restaurantes",
   "de",
   "todo",
   "el",
   "mundo"
  ],
  "sim": [
   [
    0.613,
    0.417,
    0.626,
    0.626,
    0.33,
    0.573,
    0.276,
    0.256,
    0.522,
    0.399,
    0.605,
    0.247,
    0.614,
    0.139
   ],
   [
    0.595,
    0.497,
    0.632,
    0.645,
    0.484,
    0.603,
    0.386,
    0.391,
    0.592,
    0.583,
    0.584,
    0.425,
    0.564,
    0.282
   ],
   [
    0.789,
    0.602,
    0.788,
    0.803,
    0.419,
    0.75,
    0.356,
    0.361,
    0.589,
    0.528,
    0.753,
    0.255,
    0.773,
    0.135
   ],
   [
    0.751,
    0.858,
    0.641,
    0.523,
    0.277,
    0.446,
    0.213,
    0.221,
    0.48,
    0.648,
    0.57,
    0.316,
    0.504,
    0.185
   ],
   [
    0.701,
    0.474,
    0.763,
    0.863,
    0.554,
    0.843,
    0.505,
    0.512,
    0.542,
    0.461,
    0.714,
    0.272,
    0.782,
    0.179
   ],
   [
    0.286,
    0.191,
    0.41,
    0.563,
    0.736,
    0.682,
    0.962,
    0.948,
    0.3,
    0.266,
    0.32,
    0.35,
    0.385,
    0.271
   ],
   [
    0.28,
    0.191,
    0.404,
    0.563,
    0.761,
    0.683,
    0.944,
    0.965,
    0.279,
    0.269,
    0.31,
    0.32,
    0.376,
    0.258
   ]
  ]
 }
};
