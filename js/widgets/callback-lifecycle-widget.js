// ============================================================
// Callback Lifecycle Widget
// Anima el bucle de entrenamiento (epocas x batches) y muestra,
// en cada paso, que hook se esta llamando y que callbacks tipicos
// se enganchan ahi. La idea central: el framework recorre SIEMPRE
// la misma secuencia, y un callback solo es codigo tuyo colgado de
// uno de esos puntos.
// ============================================================

function initCallbackLifecycleWidget() {
  const canvas = document.getElementById('callback-lifecycle-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const EPOCAS = 3;
  const BATCHES = 4;

  // La secuencia completa de eventos, tal como la ejecuta el framework
  const PASOS = [];
  PASOS.push({ hook: 'on_train_begin', nivel: 0, epoca: -1, batch: -1 });
  for (let e = 0; e < EPOCAS; e++) {
    PASOS.push({ hook: 'on_epoch_begin', nivel: 1, epoca: e, batch: -1 });
    for (let b = 0; b < BATCHES; b++) {
      PASOS.push({ hook: 'on_batch_begin', nivel: 2, epoca: e, batch: b });
      PASOS.push({ hook: 'on_batch_end', nivel: 2, epoca: e, batch: b });
    }
    PASOS.push({ hook: 'validacion', nivel: 1, epoca: e, batch: -1 });
    PASOS.push({ hook: 'on_epoch_end', nivel: 1, epoca: e, batch: -1 });
  }
  PASOS.push({ hook: 'on_train_end', nivel: 0, epoca: -1, batch: -1 });

  const INFO = {
    on_train_begin: {
      color: '#9A72AC', veces: 'Una vez, al inicio',
      uso: 'Abrir la conexión a la base de datos, registrar la configuración del experimento, inicializar contadores.',
    },
    on_epoch_begin: {
      color: '#58C4DD', veces: 'Una vez por época',
      uso: 'Arrancar el cronómetro de la época, ajustar el learning rate según un schedule.',
    },
    on_batch_begin: {
      color: 'rgba(168,162,144,0.75)', veces: 'Cientos de veces por época',
      uso: 'Casi nunca se usa. Todo lo que pongas aquí se ejecuta en cada batch.',
    },
    on_batch_end: {
      color: 'rgba(168,162,144,0.9)', veces: 'Cientos de veces por época',
      uso: 'Solo cosas MUY baratas: barra de progreso, detectar un loss NaN. Nunca escribir a disco aquí.',
    },
    validacion: {
      color: '#5CD0B3', veces: 'Una vez por época',
      uso: 'No es un hook: es el framework calculando val_loss / val_accuracy. Por eso esas métricas ya están listas en on_epoch_end.',
    },
    on_epoch_end: {
      color: '#83C167', veces: 'Una vez por época',
      uso: 'AQUÍ VA CASI TODO: EarlyStopping, ModelCheckpoint, ReduceLROnPlateau y el registro de métricas.',
    },
    on_train_end: {
      color: '#FF862F', veces: 'Una vez, al final',
      uso: 'Restaurar los mejores pesos, escribir el resumen de la corrida, cerrar la conexión.',
    },
  };

  let paso = 0;
  let timer = null;

  const IZQ = { x0: 16, x1: 336 };
  const DER = { x0: 356 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const actual = PASOS[paso];

    // ---------- panel izquierdo: la secuencia ----------
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Secuencia que ejecuta el framework', IZQ.x0, 18);

    // Ventana deslizante de la secuencia alrededor del paso actual
    const VISIBLES = 11;
    let inicio = Math.max(0, Math.min(paso - Math.floor(VISIBLES / 2), PASOS.length - VISIBLES));
    if (inicio < 0) inicio = 0;
    const filaH = 20;

    for (let k = 0; k < VISIBLES && inicio + k < PASOS.length; k++) {
      const idx = inicio + k;
      const p = PASOS[idx];
      const y = 34 + k * filaH;
      const esActual = idx === paso;
      const info = INFO[p.hook];

      if (esActual) {
        ctx.fillStyle = 'rgba(255,255,0,0.12)';
        ctx.fillRect(IZQ.x0 - 4, y - 12, IZQ.x1 - IZQ.x0 + 8, filaH - 2);
      }

      const sangria = p.nivel * 16;
      ctx.font = (esActual ? 'bold ' : '') + '10.5px Fira Code, monospace';
      ctx.fillStyle = esActual ? '#FFFF00' : (idx < paso ? 'rgba(168,162,144,0.45)' : info.color);
      let texto = p.hook;
      if (p.hook === 'on_epoch_begin' || p.hook === 'on_epoch_end') texto += '(' + p.epoca + ')';
      else if (p.batch >= 0) texto += '(' + p.batch + ')';
      else if (p.hook === 'validacion') texto = '[validacion]';
      ctx.fillText(texto, IZQ.x0 + sangria, y);
    }

    // ---------- panel derecho: detalle del hook actual ----------
    const info = INFO[actual.hook];
    ctx.textAlign = 'left';

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText('Hook actual', DER.x0, 18);

    ctx.fillStyle = info.color;
    ctx.font = 'bold 15px Fira Code, monospace';
    ctx.fillText(actual.hook, DER.x0, 44);

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText(info.veces, DER.x0, 62);

    // texto envuelto
    ctx.fillStyle = '#ece6d0';
    ctx.font = '11px Lora, serif';
    const maxAncho = W - DER.x0 - 16;
    const palabras = info.uso.split(' ');
    let linea = '', y = 88;
    palabras.forEach(pal => {
      const prueba = linea + pal + ' ';
      if (ctx.measureText(prueba).width > maxAncho && linea) {
        ctx.fillText(linea, DER.x0, y);
        linea = pal + ' ';
        y += 16;
      } else {
        linea = prueba;
      }
    });
    if (linea) ctx.fillText(linea, DER.x0, y);

    // estado del bucle
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.font = '10px Fira Code, monospace';
    const estado = 'epoca ' + (actual.epoca >= 0 ? actual.epoca + ' / ' + (EPOCAS - 1) : '—') +
      '    batch ' + (actual.batch >= 0 ? actual.batch + ' / ' + (BATCHES - 1) : '—');
    ctx.fillText(estado, DER.x0, H - 34);

    // barra de avance
    ctx.fillStyle = 'rgba(168,162,144,0.2)';
    ctx.fillRect(DER.x0, H - 22, maxAncho, 6);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(DER.x0, H - 22, maxAncho * ((paso + 1) / PASOS.length), 6);
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillText('paso ' + (paso + 1) + ' de ' + PASOS.length, DER.x0, H - 6);
  }

  function detener() { if (timer) { clearInterval(timer); timer = null; } }

  function siguiente() {
    if (paso < PASOS.length - 1) { paso++; draw(); } else { detener(); }
  }

  function animar() {
    detener();
    paso = 0;
    draw();
    timer = setInterval(siguiente, 420);
  }

  const btnSig = document.getElementById('lifecycle-next');
  if (btnSig) btnSig.addEventListener('click', () => { detener(); siguiente(); });
  const btnAnim = document.getElementById('lifecycle-animate');
  if (btnAnim) btnAnim.addEventListener('click', animar);
  const btnReset = document.getElementById('lifecycle-reset');
  if (btnReset) btnReset.addEventListener('click', () => { detener(); paso = 0; draw(); });

  draw();
}
