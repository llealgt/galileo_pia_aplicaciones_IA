// ============================================================
// Datos reales de la unidad "RAG en Produccion" (RAG_M5).
//
// quant : se cuantizo DE VERDAD un corpus de 42 documentos codificados con
//   paraphrase-multilingual-MiniLM-L12-v2 y se midio el recall@10 contra el
//   ranking exacto en float32. Resultados medidos:
//     int8            100.0%  con 4x menos memoria   <- practicamente gratis
//     int4             94.2%  con 8x menos
//     int2             81.7%  con 16x menos
//     binaria (1 bit)  78.3%  con 32x menos
//   El truncado tipo Matryoshka sale PEOR de lo que sugiere el modulo:
//     256 dims 82.5%, 128 dims 71.7%, 64 dims 65.8%.
//   Y tiene explicacion: este modelo NO se entreno con perdida Matryoshka,
//   asi que sus dimensiones no estan ordenadas por informacion. Truncar
//   solo funciona en modelos entrenados para eso.
//
// cache : cosenos reales entre consultas nuevas y consultas ya cacheadas.
//   `esperada` = -1 significa que NINGUNA cacheada responde la nueva, y el
//   cache deberia fallar. Los dos aciertos legitimos estan en 0.831 y
//   0.888, pero hay dos FALSOS POSITIVOS en 0.678 y 0.672: con un umbral
//   de 0.65 el sistema contestaria el costo del envio a quien pregunta por
//   el costo de la devolucion.
// ============================================================

const PROD5 = {"quant":{"n_docs":42,"dims":384,"filas":[{"nombre":"float32 (original)","bits":32,"dims":384,"bytes":1536,"recall":1.0,"error":0.0},{"nombre":"int8","bits":8,"dims":384,"bytes":384,"recall":1.0,"error":0.0003},{"nombre":"int4","bits":4,"dims":384,"bytes":192,"recall":0.9417,"error":0.00508},{"nombre":"int2","bits":2,"dims":384,"bytes":96,"recall":0.8167,"error":0.02602},{"nombre":"binaria (1 bit)","bits":1,"dims":384,"bytes":48,"recall":0.7833,"error":0.9594},{"nombre":"primeras 256 dim","bits":32,"dims":256,"bytes":1024,"recall":0.825,"error":0.0},{"nombre":"primeras 128 dim","bits":32,"dims":128,"bytes":512,"recall":0.7167,"error":0.0},{"nombre":"primeras 64 dim","bits":32,"dims":64,"bytes":256,"recall":0.6583,"error":0.0}],"ejemplo":[0.0147,-0.0788,0.0115,-0.0095,0.0177,-0.0229,-0.0531,-0.0026]},"cache":{"cacheadas":["¿cuánto tardan en llegar los pedidos?","¿cómo devuelvo algo que compré?","olvidé mi contraseña","¿puedo pagar en cuotas?","¿hay descuento para adultos mayores?","¿cuánto cuesta el envío?","¿cuándo me devuelven el dinero?","¿a qué hora abre la tienda?","¿las camisas encogen al lavarlas?","¿aceptan tarjeta de débito?","quiero cancelar mi suscripción","¿los cupones se pueden juntar?"],"nuevas":[{"texto":"¿cómo restablezco mi contraseña?","esperada":2,"sim":[0.0639,0.2905,0.831,0.0173,0.0256,-0.0008,0.2956,-0.0366,0.0556,0.117,0.2248,0.0019]},{"texto":"¿en cuántos días llega mi pedido?","esperada":0,"sim":[0.8882,0.2557,0.1168,0.3576,0.1689,0.4296,0.3512,0.5282,0.0238,0.1861,0.3582,0.2034]},{"texto":"¿puedo devolver un artículo usado?","esperada":-1,"sim":[0.1655,0.2898,0.1963,0.2189,0.1138,0.1364,0.3338,0.0665,0.0367,0.0826,0.1402,0.1965]},{"texto":"¿hay descuento para estudiantes?","esperada":-1,"sim":[0.167,0.1081,0.043,0.3377,0.4542,0.3243,0.1785,0.1864,0.1233,0.2728,0.2286,0.0897]},{"texto":"¿cuánto cuesta la devolución?","esperada":-1,"sim":[0.3895,0.4913,0.2047,0.4877,0.2839,0.6778,0.643,0.1568,0.0366,0.2726,0.2168,0.0369]},{"texto":"¿dónde queda la tienda?","esperada":-1,"sim":[0.2737,0.2781,0.1093,0.128,0.1664,0.2567,0.1488,0.6717,0.1397,0.0409,0.1628,0.0936]}]}};
