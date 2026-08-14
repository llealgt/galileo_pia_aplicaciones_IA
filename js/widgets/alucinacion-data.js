// ============================================================
// Datos del widget "por que alucinan"  (GENERADO, no editar)
// scripts/gen_alucinacion_data.py
//
// Distribucion REAL del PRIMER token de la respuesta con
// Qwen2.5-1.5B-Instruct y su plantilla de chat. Ese es el token en
// que el modelo tiene que comprometerse con el hecho.
// La entropia se calcula sobre las 151k opciones del vocabulario.
//
// HALLAZGO, y es el contenido de la diapositiva: la confianza NO
// distingue el caso que sabe del que no. Se midio primero con
// continuaciones sueltas y salio al reves de lo esperado (mas
// entropia en el caso conocido, porque ahi tocaba elegir un
// articulo). Con la plantilla de chat el modelo se compromete, y
// aun asi contesta con aplomo lo que no puede saber.
// ============================================================

const ALUC_CASOS = [
  { n: "lo sabe",
    preg: "¿Cuál es la capital de Francia? Responde solo el nombre.",
    nota: "estuvo mil veces en el corpus",
    resp: "París",
    entropia: 0.7, top1: 0.8981,
    piezas: ["Par", "Paris", "Ber", "Mad", "La", "Fr", "par", "B", "L", "Br"],
    probs: [0.8981, 0.0543, 0.0222, 0.0144, 0.0015, 0.0015, 0.0011, 0.0007, 0.0007, 0.0006] },
  { n: "no puede saberlo",
    preg: "¿Cuántos días de vacaciones otorga al año la empresa Textiles del Valle S.A.? Responde solo el número.",
    nota: "dato interno: jamás pudo estar en el corpus",
    resp: "15",
    entropia: 3.56, top1: 0.2428,
    piezas: ["1", "3", "5", "2", "4", "8", "6", "No", "7", "9"],
    probs: [0.2428, 0.1545, 0.143, 0.1142, 0.0715, 0.0541, 0.0432, 0.0427, 0.041, 0.0187] },
  { n: "no existe",
    preg: "¿Cómo se llama el elemento químico de número atómico 141? Responde solo el nombre.",
    nota: "no existe tal elemento",
    resp: "Argon-141",
    entropia: 4.69, top1: 0.1922,
    piezas: ["Arg", "Ind", "Pol", "Ant", "Sil", "Van", "Tell", "L", "B", "Ar"],
    probs: [0.1922, 0.123, 0.0914, 0.0907, 0.0881, 0.0554, 0.0415, 0.0273, 0.024, 0.0238] },
];
