// ============================================================
// Grid "Atascado" Widget
// Usa los valores REALES del grid search del notebook 09 (SVM sobre
// breast cancer, los mismos del heatmap de la slide de Grid Search).
// Mas de la mitad de la grilla es zona muerta (gamma grande, o C muy
// chico): F1 ~ 0.
//
// La idea: grid search recorre la grilla EN ORDEN, asi que si la zona
// muerta cae al principio del recorrido se gastan muchas evaluaciones
// seguidas sin obtener senal. Random search no puede quedarse
// atascado asi, porque muestrea disperso.
// ============================================================

function initGridStuckWidget() {
  const canvas = document.getElementById('grid-stuck-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const CS = ['0.01', '0.1', '1', '10', '100', '1000'];
  const GS = ['1e-4', '1e-3', '1e-2', '0.1', '1', '10'];
  // F1 en CV medido en el notebook 09
  const F1 = [
    [0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    [0.00, 0.38, 0.92, 0.91, 0.00, 0.00],
    [0.45, 0.93, 0.95, 0.94, 0.02, 0.00],
    [0.93, 0.95, 0.97, 0.95, 0.06, 0.00],
    [0.96, 0.96, 0.96, 0.94, 0.06, 0.00],
    [0.96, 0.96, 0.96, 0.94, 0.06, 0.00],
  ];
  const UMBRAL = 0.5;
  const N = 36;

  // orden row-major: C en el bucle externo, gamma en el interno
  const ORDEN_GRID = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) ORDEN_GRID.push([i, j]);

  // Semillas elegidas para que la secuencia de clics refleje la distribucion
  // REAL de la racha inicial muerta (rachas 0,1,0,2,1,4 — promedio 1.13 sobre
  // 400 semillas). Con semillas que dieran 0 siempre, la demo se veria amanada:
  // random reduce la probabilidad de atascarse, no la elimina.
  const SEMILLAS = [26, 13, 39, 65, 52, 156];
  let semillaIdx = 0;

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ordenAleatorio(seed) {
    const arr = ORDEN_GRID.slice();
    const rng = makeRng(seed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  let modo = null;         // 'grid' | 'random'
  let orden = [];
  let hechas = 0;
  let timer = null;

  const G = { x0: 62, y0: 54, cw: 46, ch: 34 };   // grilla
  const T = { x0: 440, y0: 92, cw: 11, ch: 26 };  // linea de tiempo

  function esMalo(v) { return v < UMBRAL; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ---------- titulo ----------
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Espacio de hyper-parametros (F1 real del notebook 09)', 8, 18);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('zona muerta = 19 de 36 celdas (53%)', 8, 33);

    // ---------- grilla ----------
    ctx.font = '8.5px Fira Code, monospace';
    ctx.textAlign = 'center';
    GS.forEach((g, j) => {
      ctx.fillStyle = 'rgba(168,162,144,0.7)';
      ctx.fillText(g, G.x0 + j * G.cw + G.cw / 2, G.y0 - 6);
    });
    ctx.textAlign = 'right';
    CS.forEach((c, i) => {
      ctx.fillStyle = 'rgba(168,162,144,0.7)';
      ctx.fillText(c, G.x0 - 6, G.y0 + i * G.ch + G.ch / 2 + 3);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('gamma', G.x0 + 3 * G.cw, G.y0 + 6 * G.ch + 16);
    ctx.save();
    ctx.translate(22, G.y0 + 3 * G.ch);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('C', 0, 0);
    ctx.restore();

    // indice de evaluacion de cada celda segun el orden actual
    const idxDe = {};
    orden.forEach((p, k) => { idxDe[p[0] + ',' + p[1]] = k; });

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const x = G.x0 + j * G.cw, y = G.y0 + i * G.ch;
        const k = modo ? idxDe[i + ',' + j] : -1;
        const evaluada = modo && k < hechas;
        const v = F1[i][j];

        if (!evaluada) {
          ctx.fillStyle = 'rgba(168,162,144,0.09)';
          ctx.fillRect(x + 1, y + 1, G.cw - 2, G.ch - 2);
        } else {
          ctx.fillStyle = esMalo(v) ? 'rgba(252,98,85,0.85)' : 'rgba(131,193,103,0.85)';
          ctx.fillRect(x + 1, y + 1, G.cw - 2, G.ch - 2);
          ctx.fillStyle = '#1b1b2f';
          ctx.font = 'bold 9px Fira Code, monospace';
          ctx.fillText(v.toFixed(2), x + G.cw / 2, y + G.ch / 2 + 3);
        }
        // marco de la celda que se acaba de evaluar
        if (modo && k === hechas - 1) {
          ctx.strokeStyle = '#FFFF00';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x + 1, y + 1, G.cw - 2, G.ch - 2);
        }
      }
    }

    // ---------- linea de tiempo de evaluaciones ----------
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Orden en que se evalua', T.x0, 62);
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText(modo === 'grid' ? 'grid: fila por fila, siempre igual'
      : modo === 'random' ? 'random: disperso por todo el espacio'
        : 'elige una estrategia abajo', T.x0, 78);

    for (let k = 0; k < N; k++) {
      const x = T.x0 + k * T.cw, y = T.y0;
      if (!modo || k >= hechas) {
        ctx.fillStyle = 'rgba(168,162,144,0.12)';
      } else {
        const [i, j] = orden[k];
        ctx.fillStyle = esMalo(F1[i][j]) ? 'rgba(252,98,85,0.9)' : 'rgba(131,193,103,0.9)';
      }
      ctx.fillRect(x + 1, y, T.cw - 2, T.ch);
    }
    ctx.font = '8px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.textAlign = 'center';
    [1, 9, 18, 27, 36].forEach(n => {
      ctx.fillText(String(n), T.x0 + (n - 1) * T.cw + T.cw / 2, T.y0 + T.ch + 12);
    });

    // ---------- racha inicial marcada ----------
    if (modo) {
      let inicial = 0;
      for (let k = 0; k < Math.min(hechas, N); k++) {
        const [i, j] = orden[k];
        if (esMalo(F1[i][j])) inicial++; else break;
      }
      if (inicial > 0) {
        ctx.strokeStyle = '#FC6255';
        ctx.lineWidth = 2;
        ctx.strokeRect(T.x0 + 1, T.y0 - 3, inicial * T.cw - 2, T.ch + 6);
        ctx.fillStyle = '#FC6255';
        ctx.font = 'bold 9px Fira Code, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(inicial + ' evaluaciones seguidas sin señal', T.x0, T.y0 + T.ch + 30);
      }
    }

    // ---------- mejor hasta ahora ----------
    if (modo && hechas > 0) {
      let mejor = 0;
      for (let k = 0; k < hechas; k++) {
        const [i, j] = orden[k];
        mejor = Math.max(mejor, F1[i][j]);
      }
      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = '#a8a290';
      ctx.fillText('Mejor F1 hasta ahora', T.x0, T.y0 + T.ch + 58);
      ctx.font = 'bold 22px Fira Code, monospace';
      ctx.fillStyle = mejor >= UMBRAL ? '#83C167' : '#FC6255';
      ctx.fillText(mejor.toFixed(2), T.x0, T.y0 + T.ch + 84);

      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.85)';
      ctx.fillText('evaluaciones: ' + hechas + ' / ' + N, T.x0 + 90, T.y0 + T.ch + 84);
    }

    // ---------- leyenda ----------
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'left';
    const yl = H - 10;
    ctx.fillStyle = 'rgba(252,98,85,0.9)'; ctx.fillRect(8, yl - 8, 9, 9);
    ctx.fillStyle = '#a8a290'; ctx.fillText('F1 < 0.5 (inservible)', 21, yl);
    ctx.fillStyle = 'rgba(131,193,103,0.9)'; ctx.fillRect(160, yl - 8, 9, 9);
    ctx.fillStyle = '#a8a290'; ctx.fillText('F1 >= 0.5 (útil)', 173, yl);

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('grid-stuck-info');
    if (!el) return;
    if (!modo) {
      el.innerHTML = '<div class="widget-label"><span>Elige una estrategia para recorrer la grilla</span>' +
        '<span class="widget-value">—</span></div>';
      return;
    }
    let inicial = 0;
    for (let k = 0; k < N; k++) {
      const [i, j] = orden[k];
      if (esMalo(F1[i][j])) inicial++; else break;
    }
    let primera = null;
    for (let k = 0; k < N; k++) {
      const [i, j] = orden[k];
      if (!esMalo(F1[i][j])) { primera = k + 1; break; }
    }
    const pct = (100 * inicial / N).toFixed(0);
    el.innerHTML =
      '<div class="widget-label"><span>Evaluaciones muertas al inicio</span>' +
      '<span class="widget-value" style="color:' + (inicial >= 5 ? 'var(--c-red)' : 'var(--c-green)') + ';">' +
      inicial + '  (' + pct + '% del presupuesto)</span></div>' +
      '<div class="widget-label"><span>Primer resultado útil</span>' +
      '<span class="widget-value">evaluación #' + primera + '</span></div>';
  }

  function detener() { if (timer) { clearInterval(timer); timer = null; } }

  function ejecutar(m) {
    detener();
    modo = m;
    if (m === 'grid') {
      orden = ORDEN_GRID.slice();
    } else {
      orden = ordenAleatorio(SEMILLAS[semillaIdx % SEMILLAS.length]);
      semillaIdx++;    // cada clic prueba otro orden aleatorio
    }
    hechas = 0;
    document.querySelectorAll('.grid-stuck-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.modo === m));
    timer = setInterval(() => {
      hechas++;
      if (hechas >= N) { hechas = N; detener(); }
      draw();
    }, 110);
    draw();
  }

  document.querySelectorAll('.grid-stuck-btn').forEach(btn => {
    btn.addEventListener('click', () => ejecutar(btn.dataset.modo));
  });
  const reset = document.getElementById('grid-stuck-reset');
  if (reset) reset.addEventListener('click', () => {
    detener(); modo = null; orden = []; hechas = 0;
    document.querySelectorAll('.grid-stuck-btn').forEach(b => b.classList.remove('active'));
    draw();
  });

  draw();
}
