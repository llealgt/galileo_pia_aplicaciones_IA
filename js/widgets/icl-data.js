// ============================================================
// Aprendizaje en contexto (0-shot / 1-shot / few-shot), MEDIDO.
//
// Se midio sobre DeepESP/gpt2-spanish, el mismo modelo del widget de
// generacion token por token.
//
// formato : una transformacion cuyo formato solo se puede deducir de los
//   ejemplos ("Juan Pérez" => "PÉREZ, J."). Se mide la log-probabilidad
//   media que el modelo da a la salida correcta segun cuantos ejemplos
//   lleve el prompt. Resultado medido: de -4.262 sin ejemplos a -2.460
//   con cuatro, o sea que la salida correcta se vuelve 6.1 VECES mas
//   probable. Y se ve en los tokens que propone: sin ejemplos quiere
//   emitir un salto de linea; con ejemplos emite la inicial de un
//   apellido en mayuscula.
//
// sentimiento : clasificacion semantica, para mostrar el limite. Con un
//   modelo de este tamano el few-shot NO ayuda: los aciertos bajan de
//   4/4 a 2/4 y la probabilidad de la etiqueta correcta de 0.623 a 0.536,
//   con sesgo hacia la ultima etiqueta vista ("negativo"). El aprendizaje
//   en contexto para SEMANTICA es una capacidad que aparece con escala;
//   para FORMATO funciona incluso en modelos pequenos.
// ============================================================

const ICL = {
 "modelo": "DeepESP/gpt2-spanish",
 "formato": {
  "ejemplos": [
   [
    "Juan Pérez",
    "PÉREZ, J."
   ],
   [
    "Ana López",
    "LÓPEZ, A."
   ],
   [
    "Luis Mora",
    "MORA, L."
   ],
   [
    "Rosa Díaz",
    "DÍAZ, R."
   ]
  ],
  "prueba": [
   [
    "Carlos Ruiz",
    "RUIZ, C."
   ],
   [
    "María Solís",
    "SOLÍS, M."
   ],
   [
    "Pedro Vela",
    "VELA, P."
   ]
  ],
  "filas": [
   {
    "k": 0,
    "prompt": "Carlos Ruiz =>",
    "logprob": -4.2616,
    "top": [
     [
      "\n",
      0.2643
     ],
     [
      ".",
      0.2574
     ],
     [
      " (",
      0.0695
     ],
     [
      ",",
      0.0414
     ],
     [
      ";",
      0.0311
     ],
     [
      " <<",
      0.0247
     ]
    ]
   },
   {
    "k": 1,
    "prompt": "Juan Pérez => PÉREZ, J.\nCarlos Ruiz =>",
    "logprob": -2.6833,
    "top": [
     [
      " P",
      0.3061
     ],
     [
      "\n",
      0.0424
     ],
     [
      ",",
      0.0321
     ],
     [
      ".",
      0.0311
     ],
     [
      " A",
      0.0296
     ],
     [
      " L",
      0.0198
     ]
    ]
   },
   {
    "k": 2,
    "prompt": "Juan Pérez => PÉREZ, J.\nAna López => LÓPEZ, A.\nCarlos Ruiz =>",
    "logprob": -2.47,
    "top": [
     [
      " L",
      0.2212
     ],
     [
      " P",
      0.1334
     ],
     [
      " A",
      0.0327
     ],
     [
      " T",
      0.0221
     ],
     [
      " C",
      0.0195
     ],
     [
      " M",
      0.0183
     ]
    ]
   },
   {
    "k": 3,
    "prompt": "Juan Pérez => PÉREZ, J.\nAna López => LÓPEZ, A.\nLuis Mora => MORA, L.\nCarlos Ruiz =>",
    "logprob": -2.5203,
    "top": [
     [
      " L",
      0.2256
     ],
     [
      " P",
      0.1297
     ],
     [
      "\n",
      0.0241
     ],
     [
      " RO",
      0.0231
     ],
     [
      " A",
      0.0228
     ],
     [
      " T",
      0.0202
     ]
    ]
   },
   {
    "k": 4,
    "prompt": "Juan Pérez => PÉREZ, J.\nAna López => LÓPEZ, A.\nLuis Mora => MORA, L.\nRosa Díaz => DÍAZ, R.\nCarlos Ruiz =>",
    "logprob": -2.4596,
    "top": [
     [
      " L",
      0.2379
     ],
     [
      " P",
      0.0929
     ],
     [
      " D",
      0.0502
     ],
     [
      " RO",
      0.0257
     ],
     [
      " T",
      0.0243
     ],
     [
      " M",
      0.0241
     ]
    ]
   }
  ]
 },
 "sentimiento": {
  "filas": [
   {
    "k": 0,
    "p": 0.6229,
    "aciertos": 4,
    "n": 4
   },
   {
    "k": 1,
    "p": 0.5812,
    "aciertos": 3,
    "n": 4
   },
   {
    "k": 2,
    "p": 0.5588,
    "aciertos": 2,
    "n": 4
   },
   {
    "k": 4,
    "p": 0.549,
    "aciertos": 2,
    "n": 4
   },
   {
    "k": 6,
    "p": 0.5358,
    "aciertos": 2,
    "n": 4
   }
  ],
  "ultima_etiqueta": "negativo"
 }
};
