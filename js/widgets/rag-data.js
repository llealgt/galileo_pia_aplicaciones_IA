// ============================================================
// Base de conocimiento del ejemplo de RAG (hoteles en Vancouver,
// tomado del modulo 1 del curso de RAG). Las similitudes son
// cosenos REALES calculados con paraphrase-multilingual-MiniLM-L12-v2,
// el mismo modelo de la unidad de embeddings.
//
// `utiles` marca que documentos hacen falta de verdad para responder;
// sirve para medir si el retriever los trajo o no. Nota: en la primera
// consulta el documento clave (el concierto) queda ULTIMO — el
// retriever no es perfecto, y eso es justamente parte de la leccion.
// ============================================================

const RAG_DEMO = {
 "docs": [
  {
   "texto": "Taylor Swift presenta su Eras Tour en el BC Place de Vancouver del 6 al 8 de diciembre",
   "tipo": "noticia"
  },
  {
   "texto": "La ocupación hotelera en el centro de Vancouver llegó al 97% para el próximo fin de semana",
   "tipo": "reporte"
  },
  {
   "texto": "Los hoteles suben tarifas hasta 3 veces cuando hay eventos masivos en la ciudad",
   "tipo": "análisis"
  },
  {
   "texto": "Se esperan 60,000 visitantes en Vancouver por los conciertos de diciembre",
   "tipo": "noticia"
  },
  {
   "texto": "El BC Place tiene capacidad para 54,000 personas y está en el centro de la ciudad",
   "tipo": "referencia"
  },
  {
   "texto": "Las leyes de zonificación de 1970 limitaron la construcción de hoteles en el centro",
   "tipo": "historia"
  },
  {
   "texto": "Guía de los mejores restaurantes de sushi en Vancouver",
   "tipo": "guía"
  },
  {
   "texto": "El clima en Vancouver en diciembre suele ser lluvioso con 8 grados de promedio",
   "tipo": "clima"
  },
  {
   "texto": "Cómo llegar del aeropuerto de Vancouver al centro en tren ligero",
   "tipo": "transporte"
  },
  {
   "texto": "Historia del equipo de hockey Vancouver Canucks desde 1970",
   "tipo": "historia"
  }
 ],
 "consultas": [
  {
   "texto": "¿Por qué los hoteles en Vancouver están tan caros este fin de semana?",
   "utiles": [
    0,
    1,
    2,
    3
   ],
   "sim": [
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
   ]
  },
  {
   "texto": "¿Cuándo toca Taylor Swift en Vancouver?",
   "utiles": [
    0
   ],
   "sim": [
    0.7363,
    0.2645,
    0.0199,
    0.3273,
    0.1578,
    -0.0582,
    0.1815,
    0.3478,
    0.3359,
    0.2921
   ]
  },
  {
   "texto": "¿Por qué Vancouver no tiene más hoteles en el centro?",
   "utiles": [
    5
   ],
   "sim": [
    0.2145,
    0.6277,
    0.4449,
    0.3893,
    0.5068,
    0.5373,
    0.4139,
    0.3918,
    0.5492,
    0.4421
   ]
  }
 ]
};
