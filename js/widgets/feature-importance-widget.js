// ============================================================
// Feature Importance (L1 vs. L2) Widget
// Dataset sintetico de precios de casas con 10 features, de las
// cuales SOLO 3 fueron generadas con efecto real sobre el precio
// (area_m2, antiguedad, habitaciones); las otras 7 son ruido.
//
// Panel izquierdo: bar-chart horizontal con el coeficiente theta_j
// de cada feature = su "importancia" en un modelo lineal.
// Panel derecho: regularization path — la trayectoria de los 10
// coeficientes conforme lambda crece, con un marcador en el lambda
// actual.
//
// La idea central: con L1 (Lasso) las features de ruido llegan a
// EXACTAMENTE 0 y el modelo hace feature selection solo; con L2
// (Ridge) todas se encogen pero ninguna desaparece.
// ============================================================

function initFeatureImportanceWidget() {
  const canvas = document.getElementById('feature-importance-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FEATURES = [
    'area_m2', 'color_fachada', 'n_fotos', 'antiguedad', 'dia_publicacion',
    'id_vendedor', 'habitaciones', 'largo_anuncio', 'dist_parada_bus', 'n_ventanas'
  ];
  // Coeficientes "verdaderos" con los que se genero y: solo 3 son != 0.
  const TRUE_COEF = [3.0, 0, 0, -2.0, 0, 0, 1.5, 0, 0, 0];
  const P = FEATURES.length;

  // Un color por feature, compartido entre el bar-chart y el path,
  // para que el estudiante siga la misma feature entre ambos paneles.
  const COLORS = [
    '#58C4DD', '#9A72AC', '#E48BB0', '#FC6255', '#FF862F',
    '#C9B458', '#83C167', '#5CD0B3', '#B8B8D1', '#D9A066'
  ];

  // ---------- generacion de datos (PRNG con semilla fija: mismo dataset siempre) ----------
  function makeRng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function makeNormal(rng) {
    return function () {
      let u = 0, v = 0;
      while (u === 0) u = rng();
      while (v === 0) v = rng();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  }
  function buildSet(seed, standardize) {
    const rng = makeRng(seed), normal = makeNormal(rng), n = 80;
    const X = Array.from({ length: n }, () => Array.from({ length: P }, () => normal()));
    if (standardize) {
      for (let j = 0; j < P; j++) {
        const col = X.map(r => r[j]);
        const mu = col.reduce((a, b) => a + b, 0) / n;
        const sd = Math.sqrt(col.reduce((a, b) => a + (b - mu) ** 2, 0) / n);
        for (let i = 0; i < n; i++) X[i][j] = (X[i][j] - mu) / sd;
      }
    }
    const y = X.map(row => row.reduce((s, v, j) => s + v * TRUE_COEF[j], 0) + normal() * 1.0);
    const ymu = y.reduce((a, b) => a + b, 0) / n;
    return { X, y: y.map(v => v - ymu) };
  }
  const TRAIN = buildSet(20250717, true);
  const TEST = buildSet(777001, false);

  // ---------- ajuste ----------
  // Lasso por coordinate descent con soft-thresholding.
  // Objetivo: (1/2n)||y - Xb||^2 + lambda*||b||_1
  function fitLasso(X, y, lambda) {
    const n = X.length;
    const b = new Array(P).fill(0);
    const r = y.slice();
    for (let it = 0; it < 300; it++) {
      let maxDelta = 0;
      for (let j = 0; j < P; j++) {
        let rho = 0, zz = 0;
        for (let i = 0; i < n; i++) {
          const xij = X[i][j];
          rho += xij * (r[i] + xij * b[j]);
          zz += xij * xij;
        }
        rho /= n; zz /= n;
        const s = Math.sign(rho) * Math.max(Math.abs(rho) - lambda, 0);
        const nb = zz > 1e-12 ? s / zz : 0;
        const delta = nb - b[j];
        if (delta !== 0) {
          for (let i = 0; i < n; i++) r[i] -= X[i][j] * delta;
          b[j] = nb;
          maxDelta = Math.max(maxDelta, Math.abs(delta));
        }
      }
      if (maxDelta < 1e-9) break;
    }
    return b;
  }

  function solve(A, bv) {
    const n = A.length;
    const M = A.map((row, i) => [...row, bv[i]]);
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      [M[col], M[piv]] = [M[piv], M[col]];
      if (Math.abs(M[col][col]) < 1e-12) continue;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const f = M[r][col] / M[col][col];
        for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
      }
    }
    return M.map((row, i) => row[n] / (row[i] || 1e-12));
  }

  // Ridge (forma cerrada): ((1/n)X^T X + lambda*I) b = (1/n) X^T y
  function fitRidge(X, y, lambda) {
    const n = X.length;
    const A = Array.from({ length: P }, () => new Array(P).fill(0));
    const bv = new Array(P).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < P; j++) {
        bv[j] += X[i][j] * y[i] / n;
        for (let k = 0; k < P; k++) A[j][k] += X[i][j] * X[i][k] / n;
      }
    }
    for (let j = 0; j < P; j++) A[j][j] += lambda;
    return solve(A, bv);
  }

  function mse(X, y, b) {
    return X.reduce((s, row, i) => {
      const pred = row.reduce((a, v, j) => a + v * b[j], 0);
      return s + (pred - y[i]) ** 2;
    }, 0) / X.length;
  }

  const LAMBDAS = [0, 0.01, 0.02, 0.05, 0.1, 0.2, 0.35, 0.6, 1.0, 1.6, 2.5];

  // Precomputo el path completo de ambos metodos una sola vez.
  const PATHS = {
    l1: LAMBDAS.map(l => fitLasso(TRAIN.X, TRAIN.y, l)),
    l2: LAMBDAS.map(l => fitRidge(TRAIN.X, TRAIN.y, l))
  };

  let method = 'l1';
  let lambdaIdx = 0;

  const AXIS_MAX = 3.3;
  const ZERO_TOL = 1e-8;

  // ---------- layout ----------
  const SPLIT = 476;
  const A = { labelR: 122, x0: 132, x1: 466, y0: 32, rowH: 23 };
  const B = { x0: 546, x1: 868, y0: 36, y1: 258 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const coefs = PATHS[method][lambdaIdx];
    drawBars(coefs);
    drawPath();

    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(SPLIT, 10); ctx.lineTo(SPLIT, H - 10); ctx.stroke();

    updateInfo(coefs);
  }

  function drawBars(coefs) {
    const pw = A.x1 - A.x0;
    const tx = v => A.x0 + (v + AXIS_MAX) / (2 * AXIS_MAX) * pw;
    const zeroX = tx(0);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Importancia: coeficiente θⱼ de cada feature', 8, 20);

    // linea de cero
    ctx.strokeStyle = 'rgba(168,162,144,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(zeroX, A.y0 - 6);
    ctx.lineTo(zeroX, A.y0 + P * A.rowH + 2);
    ctx.stroke();

    coefs.forEach((v, i) => {
      const cy = A.y0 + i * A.rowH + A.rowH / 2;
      const isZero = Math.abs(v) < ZERO_TOL;

      // nombre de la feature
      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = isZero ? 'rgba(168,162,144,0.4)' : COLORS[i];
      ctx.fillText(FEATURES[i], A.labelR, cy + 3.5);

      if (isZero) {
        // feature eliminada: marca visible en vez de una barra invisible
        ctx.fillStyle = 'rgba(252,98,85,0.85)';
        ctx.font = '9px Fira Code, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('✕ eliminada (θ = 0)', zeroX + 6, cy + 3.5);
        return;
      }

      const bx = tx(v);
      ctx.fillStyle = COLORS[i];
      // ancho minimo: un coeficiente diminuto (pero != 0) debe seguir siendo visible,
      // para que no se confunda con una feature eliminada.
      const bw = Math.max(Math.abs(bx - zeroX), 2);
      ctx.fillRect(v >= 0 ? zeroX : zeroX - bw, cy - 6, bw, 12);

      ctx.fillStyle = '#ece6d0';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = v >= 0 ? 'left' : 'right';
      ctx.fillText(v.toFixed(2), v >= 0 ? bx + 5 : bx - 5, cy + 3.5);
    });

    // escala
    ctx.textAlign = 'center';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.65)';
    const yScale = A.y0 + P * A.rowH + 14;
    [-3, -2, -1, 0, 1, 2, 3].forEach(v => ctx.fillText(String(v), tx(v), yScale));
  }

  function drawPath() {
    const pw = B.x1 - B.x0, ph = B.y1 - B.y0;
    const tx = i => B.x0 + (i / (LAMBDAS.length - 1)) * pw;
    const ty = v => B.y0 + ph - (v + AXIS_MAX) / (2 * AXIS_MAX) * ph;

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Regularization path: θⱼ conforme λ crece', SPLIT + 12, 20);

    // ejes
    ctx.strokeStyle = 'rgba(168,162,144,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(B.x0, ty(0)); ctx.lineTo(B.x1, ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x0, B.y1); ctx.stroke();

    ctx.textAlign = 'right';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.65)';
    [-3, -2, -1, 0, 1, 2, 3].forEach(v => ctx.fillText(String(v), B.x0 - 5, ty(v) + 3));

    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8a290';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillText('λ  →', (B.x0 + B.x1) / 2, B.y1 + 20);

    // marcador del lambda actual
    const mx = tx(lambdaIdx);
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(255,255,0,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mx, B.y0 - 4); ctx.lineTo(mx, B.y1 + 4); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#FFFF00';
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('λ=' + LAMBDAS[lambdaIdx], mx, B.y0 - 8);

    // trayectorias
    const path = PATHS[method];
    for (let j = 0; j < P; j++) {
      ctx.beginPath();
      ctx.strokeStyle = COLORS[j];
      ctx.lineWidth = 1.8;
      path.forEach((coefs, k) => {
        const px = tx(k), py = ty(Math.max(-AXIS_MAX, Math.min(AXIS_MAX, coefs[j])));
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // punto en el lambda actual
      const cur = path[lambdaIdx][j];
      ctx.beginPath();
      ctx.arc(mx, ty(Math.max(-AXIS_MAX, Math.min(AXIS_MAX, cur))), 3, 0, Math.PI * 2);
      ctx.fillStyle = Math.abs(cur) < ZERO_TOL ? 'rgba(168,162,144,0.5)' : COLORS[j];
      ctx.fill();
    }
  }

  function updateInfo(coefs) {
    const el = document.getElementById('feature-importance-info');
    if (!el) return;
    const zeros = coefs.filter(v => Math.abs(v) < ZERO_TOL).length;
    const usadas = P - zeros;
    const testMSE = mse(TEST.X, TEST.y, coefs);

    // ¿el modelo se quedo exactamente con las 3 features reales?
    const seleccionOk = coefs.every((v, j) =>
      (TRUE_COEF[j] !== 0) === (Math.abs(v) >= ZERO_TOL));

    let diag, diagColor;
    if (zeros === 0) {
      diag = 'Ninguna feature eliminada';
      diagColor = 'var(--c-text-dim)';
    } else if (seleccionOk) {
      diag = '¡Justo las 3 features reales!';
      diagColor = 'var(--c-green)';
    } else if (usadas < 3) {
      diag = 'Se eliminaron features reales';
      diagColor = 'var(--c-red)';
    } else {
      diag = 'Aún sobreviven features de ruido';
      diagColor = 'var(--c-orange)';
    }

    el.innerHTML = `
      <div class="widget-label"><span>Features usadas (θⱼ ≠ 0)</span><span class="widget-value">${usadas} / ${P}</span></div>
      <div class="widget-label"><span>Features eliminadas (θⱼ = 0)</span><span class="widget-value" style="color:var(--c-red);">${zeros}</span></div>
      <div class="widget-label"><span>MSE en test</span><span class="widget-value">${testMSE.toFixed(3)}</span></div>
      <div class="widget-label" style="margin-top:0.3em;"><span>Selección</span><span class="widget-value" style="color:${diagColor};">${diag}</span></div>`;
  }

  // ---------- controles ----------
  const slider = document.getElementById('feature-importance-slider');
  const lambdaLabel = document.getElementById('feature-importance-lambda-value');

  function setState(idx, m) {
    lambdaIdx = Math.max(0, Math.min(LAMBDAS.length - 1, idx));
    if (m) method = m;
    if (slider) slider.value = lambdaIdx;
    if (lambdaLabel) lambdaLabel.textContent = LAMBDAS[lambdaIdx];
    document.querySelectorAll('.fi-method-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.method === method));
    draw();
  }

  if (slider) slider.addEventListener('input', function () { setState(parseInt(this.value, 10)); });
  document.querySelectorAll('.fi-method-btn').forEach(btn => {
    btn.addEventListener('click', () => setState(lambdaIdx, btn.dataset.method));
  });
  document.querySelectorAll('.fi-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => setState(parseInt(btn.dataset.idx, 10)));
  });

  setState(lambdaIdx, method);
}
