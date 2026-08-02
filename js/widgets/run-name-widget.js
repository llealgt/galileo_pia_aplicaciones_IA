// ============================================================
// Run Name Widget — la "configuration string"
// Compone el nombre de una corrida a partir de sus hiperparametros
// (timestamp + valores) y muestra como queda el arbol de logs.
// El boton "sin convencion" muestra el caos alternativo: nombres
// que no dicen nada y que en dos semanas no significan nada.
// ============================================================

function initRunNameWidget() {
  const canvas = document.getElementById('run-name-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const estado = { arq: 'resnet50', lr: '1e-3', bs: '128', aug: '1', convencion: true };

  const SIN_CONVENCION = [
    'run1', 'run2', 'prueba', 'prueba2', 'final',
    'final_v2', 'final_REAL', 'final_bueno', 'asdf', 'test_lunes',
  ];

  // Timestamps fijos para que la demo sea estable en clase
  const SELLOS = ['20260802-084512', '20260802-091347', '20260802-095033',
    '20260802-102915', '20260802-110408', '20260802-113722',
    '20260802-121155', '20260802-124840', '20260802-132017', '20260802-135504'];

  const OTRAS = [
    { arq: 'mlp', lr: '1e-3', bs: '128', aug: '0' },
    { arq: 'cnn', lr: '1e-3', bs: '128', aug: '0' },
    { arq: 'cnn', lr: '1e-4', bs: '32', aug: '1' },
    { arq: 'resnet50', lr: '1e-2', bs: '128', aug: '1' },
    { arq: 'resnet50', lr: '1e-3', bs: '32', aug: '0' },
  ];

  function nombreDe(cfg, sello) {
    return sello + '_' + cfg.arq + '_lr' + cfg.lr + '_bs' + cfg.bs + '_aug' + cfg.aug;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const actual = nombreDe(estado, SELLOS[6]);

    // ---------- nombre compuesto, desglosado por partes ----------
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Nombre de la corrida', 14, 18);

    if (estado.convencion) {
      const partes = [
        { txt: SELLOS[6], color: '#5CD0B3', et: 'cuándo' },
        { txt: '_' + estado.arq, color: '#58C4DD', et: 'arquitectura' },
        { txt: '_lr' + estado.lr, color: '#FFFF00', et: 'learning rate' },
        { txt: '_bs' + estado.bs, color: '#FF862F', et: 'batch size' },
        { txt: '_aug' + estado.aug, color: '#E48BB0', et: 'augmentation' },
      ];
      ctx.font = 'bold 15px Fira Code, monospace';
      let x = 14;
      partes.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillText(p.txt, x, 42);
        x += ctx.measureText(p.txt).width;
      });

      // Leyenda de colores en una sola linea. Antes las etiquetas iban debajo de
      // cada parte, pero los segmentos cortos (lr, bs, aug) quedaban tan juntos
      // que los textos se encimaban.
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'left';
      let lx = 14;
      partes.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(lx, 52, 8, 8);
        ctx.fillStyle = 'rgba(168,162,144,0.85)';
        ctx.fillText(p.et, lx + 12, 60);
        lx += 12 + ctx.measureText(p.et).width + 16;
      });
    } else {
      ctx.font = 'bold 15px Fira Code, monospace';
      ctx.fillStyle = '#FC6255';
      ctx.fillText(SIN_CONVENCION[6], 14, 42);
      ctx.font = '8.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(252,98,85,0.85)';
      ctx.fillText('¿qué modelo era? ¿qué learning rate? ¿de cuándo es?', 14, 58);
    }

    // ---------- arbol de logs ----------
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.textAlign = 'left';
    ctx.fillText('logs/', 14, 84);

    const filas = [];
    for (let i = 0; i < 5; i++) {
      filas.push(estado.convencion ? nombreDe(OTRAS[i], SELLOS[i]) : SIN_CONVENCION[i]);
    }
    filas.push(null);   // la corrida actual
    for (let i = 7; i < 10; i++) {
      const cfg = OTRAS[(i - 7) % OTRAS.length];
      filas.push(estado.convencion ? nombreDe(cfg, SELLOS[i]) : SIN_CONVENCION[i]);
    }

    ctx.font = '10.5px Fira Code, monospace';
    filas.forEach((f, i) => {
      const y = 104 + i * 17;
      const esActual = f === null;
      const texto = esActual ? (estado.convencion ? actual : SIN_CONVENCION[6]) : f;
      const ultima = i === filas.length - 1;
      ctx.fillStyle = esActual ? '#FFFF00' : 'rgba(168,162,144,0.55)';
      ctx.fillText((ultima ? '└── ' : '├── ') + texto + '/', 26, y);
    });

    // La nota va DEBAJO del arbol: los nombres son largos y cualquier anotacion
    // en la misma linea se encima con ellos.
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(255,255,0,0.8)';
    ctx.fillText('en amarillo: la corrida que acabas de lanzar', 26, 104 + filas.length * 17 + 8);

    // ---------- panel derecho: que te permite ----------
    const DX = 470;
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText(estado.convencion ? 'Qué te permite' : 'Qué pierdes', DX, 84);

    const puntos = estado.convencion
      ? [['✓', 'Ordenar por fecha con solo listar el directorio', '#83C167'],
         ['✓', 'Filtrar con grep: todas las de lr1e-3, todas las de resnet50', '#83C167'],
         ['✓', 'Leer la configuración sin abrir nada', '#83C167'],
         ['✓', 'Filtrar por regex en TensorBoard y W&B', '#83C167'],
         ['✓', 'Reproducir la corrida: el nombre es la receta', '#83C167']]
      : [['✗', 'No sabes cuál es más reciente', '#FC6255'],
         ['✗', 'No puedes filtrar por hiperparámetro', '#FC6255'],
         ['✗', 'Hay que abrir cada carpeta para saber qué es', '#FC6255'],
         ['✗', 'En dos semanas ninguno significa nada', '#FC6255'],
         ['✗', 'Aparecen los "final_REAL_v3"', '#FC6255']];

    ctx.font = '10.5px Fira Code, monospace';
    puntos.forEach((p, i) => {
      const y = 106 + i * 21;
      ctx.fillStyle = p[2];
      ctx.fillText(p[0], DX, y);
      ctx.fillStyle = '#ece6d0';
      // envolver si hace falta
      const maxW = W - DX - 30;
      let texto = p[1];
      while (ctx.measureText(texto).width > maxW && texto.length > 4) {
        texto = texto.slice(0, -2);
      }
      if (texto !== p[1]) texto = texto.slice(0, -1) + '…';
      ctx.fillText(texto, DX + 16, y);
    });
  }

  document.querySelectorAll('.run-name-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const campo = btn.dataset.campo, valor = btn.dataset.valor;
      estado[campo] = valor;
      document.querySelectorAll('.run-name-btn[data-campo="' + campo + '"]')
        .forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });
  document.querySelectorAll('.run-name-conv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.convencion = btn.dataset.conv === 'true';
      document.querySelectorAll('.run-name-conv-btn').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  // marcar los botones iniciales
  ['arq', 'lr', 'bs', 'aug'].forEach(campo => {
    const b = document.querySelector('.run-name-btn[data-campo="' + campo + '"][data-valor="' + estado[campo] + '"]');
    if (b) b.classList.add('active');
  });
  const bc = document.querySelector('.run-name-conv-btn[data-conv="true"]');
  if (bc) bc.classList.add('active');

  draw();
}
