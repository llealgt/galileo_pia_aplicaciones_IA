// ============================================================
// Datos del widget de tokens  (GENERADO, no editar a mano)
// scripts/gen_tokens_data.py
//
// Tokenizaciones REALES con el tokenizador de Qwen2.5-1.5B-Instruct,
// el modelo que los estudiantes corren en los notebooks 17 y 28.
// Las piezas son tok.decode() de cada id, asi que los espacios que se
// ven pegados al inicio de una pieza estan de verdad en el token.
// ============================================================

const TOK_CASOS = [
  { n: "común", texto: "El gato duerme en el sofá de la sala",
    ids: [6582, 342, 4330, 3845, 261, 2660, 662, 655, 85806, 1953, 409, 1187, 57933],
    piezas: ["El", " g", "ato", " du", "er", "me", " en", " el", " sof", "á", " de", " la", " sala"] },
  { n: "rara", texto: "La paradoja de la hiperinflación desconcertó al economista",
    ids: [8747, 1346, 2123, 5580, 409, 1187, 305, 12858, 258, 1489, 5721, 86630, 12246, 1794, 452, 11467, 9087],
    piezas: ["La", " par", "ado", "ja", " de", " la", " h", "iper", "in", "fl", "ación", " descon", "cert", "ó", " al", " econom", "ista"] },
  { n: "números", texto: "El pedido 4471 costó 1250.75 quetzales el 3 de marzo de 2024",
    ids: [6582, 51794, 220, 19, 19, 22, 16, 2783, 1794, 220, 16, 17, 20, 15, 13, 22, 20, 922, 42189, 3831, 655, 220, 18, 409, 85528, 409, 220, 17, 15, 17, 19],
    piezas: ["El", " pedido", " ", "4", "4", "7", "1", " cost", "ó", " ", "1", "2", "5", "0", ".", "7", "5", " qu", "etz", "ales", " el", " ", "3", " de", " marzo", " de", " ", "2", "0", "2", "4"] },
  { n: "código", texto: "def calcular_total(precio, iva=0.12): return precio * (1 + iva)",
    ids: [750, 96527, 10784, 1295, 35658, 11, 220, 9924, 28, 15, 13, 16, 17, 1648, 470, 36520, 353, 320, 16, 488, 220, 9924, 8],
    piezas: ["def", " calcular", "_total", "(p", "recio", ",", " ", "iva", "=", "0", ".", "1", "2", "):", " return", " precio", " *", " (", "1", " +", " ", "iva", ")"] },
  { n: "inglés", texto: "The cat is sleeping on the sofa in the living room",
    ids: [785, 8251, 374, 21127, 389, 279, 31069, 304, 279, 5382, 3054],
    piezas: ["The", " cat", " is", " sleeping", " on", " the", " sofa", " in", " the", " living", " room"] },
  { n: "emoji", texto: "Nos vemos mañana 🎉 ¿confirmas? ¡Gracias!",
    ids: [85092, 348, 14946, 95516, 11162, 236, 231, 28286, 13800, 300, 30, 48813, 6464, 42442, 0],
    piezas: ["Nos", " v", "emos", " mañana", " �", "�", "�", " ¿", "confirm", "as", "?", " ¡", "Gr", "acias", "!"] },
];
