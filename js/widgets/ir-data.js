// ============================================================
// Corpus de la unidad de Recuperacion de Informacion (RAG_M2).
//
// 12 documentos en espanol sobre pizza (el mismo ejemplo del modulo 2
// original). Los cosenos son REALES, calculados con
// paraphrase-multilingual-MiniLM-L12-v2. BM25 y TF-IDF NO se guardan
// aqui: los widgets los calculan en vivo para que los sliders de k1 y b
// funcionen de verdad (la implementacion JS esta verificada contra una
// referencia en Python).
//
// El corpus esta armado para que keyword y semantica discrepen:
//   - "harina de fuerza": BM25 4.379 y CERO para todo lo demas; la
//     semantica apenas 0.263, casi empatada con el ruido -> gana keyword.
//   - "pizza en casa sin horno": BM25 sube una guia de VINOS al puesto 3
//     (por la palabra "casa") y hunde al 8 la comparativa de "hornos"
//     electricos, porque "hornos" != "horno" sin stemming. La semantica
//     la pone en el puesto 2 -> gana semantica.
// Esa discrepancia real es la que motiva hybrid search.
//
// `relevantes_q0` es un juicio de relevancia explicito (ground truth)
// para la primera consulta, usado por el widget de metricas.
// ============================================================

const IR_DEMO = {
 "docs": [
  "Usa harina de fuerza para la masa de pizza estilo Nueva York",
  "Las pizzerías de Nueva York abren hasta tarde para entregas a domicilio",
  "En Pizza México de Nueva York sirven la pizza con jalapeño",
  "Cómo hacer pizza en casa sin horno de piedra, usando una sartén de hierro bien caliente",
  "El horno de leña alcanza 450 grados y cocina la pizza en 90 segundos",
  "Receta de masa madre con fermentación lenta de 48 horas en frío",
  "La mozzarella fresca suelta agua y empapa la base si no la escurres antes",
  "Trucos para cocinar pan plano en casa sin equipo profesional ni herramientas caras",
  "Comparativa de hornos eléctricos domésticos para hacer pizza los fines de semana",
  "El clima húmedo de Nueva York en invierno afecta la fermentación de la masa",
  "Historia de la pizza napolitana desde 1889 y su denominación de origen",
  "Guía de vinos tintos para acompañar una cena italiana en casa"
 ],
 "avgdl": 8.25,
 "relevantes_q0": [
  3,
  7,
  8
 ],
 "consultas": [
  {
   "texto": "Cómo hago pizza en casa sin horno",
   "sim": [
    0.6339,
    0.4186,
    0.5537,
    0.8864,
    0.705,
    0.3584,
    0.3729,
    0.6559,
    0.7806,
    0.1782,
    0.4741,
    0.3115
   ]
  },
  {
   "texto": "harina de fuerza",
   "sim": [
    0.2632,
    -0.0683,
    0.0889,
    0.0673,
    0.0888,
    0.0992,
    0.2008,
    0.1712,
    0.0656,
    0.0888,
    0.115,
    0.163
   ]
  },
  {
   "texto": "pizza con jalapeño",
   "sim": [
    0.7714,
    0.3658,
    0.8153,
    0.7064,
    0.6402,
    0.2931,
    0.4622,
    0.309,
    0.6329,
    0.0889,
    0.7282,
    0.4353
   ]
  }
 ]
};
