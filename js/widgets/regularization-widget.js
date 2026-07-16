// ============================================================
// Regularization (Ridge / L2) Widget
// Ajusta un polinomio de grado fijo (8, propenso a overfitting)
// usando ridge regression con factor de regularización lambda
// controlable. Muestra en vivo: (izq) el ajuste sobre los datos
// train/test, y (der) un bar-chart con la magnitud |theta_j| de
// cada parametro — visualiza directamente la idea central del
// pptx: "la regularizacion reduce la magnitud de cada parametro".
// ============================================================

function initRegularizationWidget() {
  const canvas = document.getElementById('regularization-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Mismo dataset fijo (train/test) que el widget de bias-variance,
  // para que el estudiante reconozca el mismo ejemplo.
  const ALL = [
    { x: 0.0, y: 4.30 }, { x: 0.5, y: 4.56 }, { x: 1.0, y: 6.22, test: true },
    { x: 1.5, y: 5.95 }, { x: 2.0, y: 6.54 }, { x: 2.5, y: 5.21, test: true },
    { x: 3.0, y: 5.14 }, { x: 3.5, y: 3.68 }, { x: 4.0, y: 3.63, test: true },
    { x: 4.5, y: 1.87 }, { x: 5.0, y: 2.15 }, { x: 5.5, y: 1.27, test: true },
    { x: 6.0, y: 2.50 }, { x: 6.5, y: 2.79 }, { x: 7.0, y: 4.54, test: true },
    { x: 7.5, y: 4.79 }, { x: 8.0, y: 6.15 }, { x: 8.5, y: 5.64, test: true },
    { x: 9.0, y: 6.43 }, { x: 9.5, y: 5.28 }
  ];
  const train = ALL.filter(p => !p.test);
  const test = ALL.filter(p => p.test);
  const DEGREE = 8;

  const xMean = ALL.reduce((s, p) => s + p.x, 0) / ALL.length;
  const xScale = 5;
  function norm(x) { return (x - xMean) / xScale; }

  function solve(A, b) {
    const n = A.length;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      [M[col], M[piv]] = [M[piv], M[col]];
      if (Math.abs(M[col][col]) < 1e-12) continue;
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const factor = M[r][col] / M[col][col];
        for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
      }
    }
    return M.map((row, i) => row[n] / (row[i] || 1e-12));
  }

  // Ridge: (X^T X + lambda * D) beta = X^T y, D = diag(0,1,1,...,1)
  // theta_0 (intercepto) nunca se penaliza — igual que en el pptx.
  function fitPolyRidge(points, degree, lambda) {
    const n = degree + 1;
    const A = Array.from({ length: n }, () => new Array(n).fill(0));
    const b = new Array(n).fill(0);
    points.forEach(p => {
      const xn = norm(p.x);
      const powers = [];
      let acc = 1;
      for (let k = 0; k <= degree; k++) { powers.push(acc); acc *= xn; }
      for (let i = 0; i < n; i++) {
        b[i] += powers[i] * p.y;
        for (let j = 0; j < n; j++) A[i][j] += powers[i] * powers[j];
      }
    });
    for (let j = 1; j < n; j++) A[j][j] += lambda;
    return solve(A, b);
  }

  function evalPoly(coeffs, x) {
    const xn = norm(x);
    let acc = 0, xp = 1;
    for (let k = 0; k < coeffs.length; k++) { acc += coeffs[k] * xp; xp *= xn; }
    return acc;
  }

  function mse(coeffs, points) {
    const errs = points.map(p => (evalPoly(coeffs, p.x) - p.y) ** 2);
    return errs.reduce((a, b) => a + b, 0) / errs.length;
  }

  // Escala log-like de lambda: cubre "sin regularizacion" hasta
  // "tanta regularizacion que colapsa a una recta" (slide 20 del pptx).
  const LAMBDAS = [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100];
  let lambdaIdx = 3; // 0.01 — punto de partida razonable

  const MAX_BAR = 28; // techo fijo del bar-chart (theta_j max observado en lambda=0 es ~27)

  const leftW = W * 0.55, rightW = W - leftW;
  const padL = { left: 45, right: 15, top: 20, bottom: 35 };
  const padR = { left: 15, right: 15, top: 24, bottom: 35 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const lambda = LAMBDAS[lambdaIdx];
    const coeffs = fitPolyRidge(train, DEGREE, lambda);

    drawFitPanel(coeffs, lambda);
    drawBarPanel(coeffs);

    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.beginPath(); ctx.moveTo(leftW, 8); ctx.lineTo(leftW, H - 8); ctx.stroke();

    updateInfo(coeffs, lambda);
  }

  function drawFitPanel(coeffs, lambda) {
    const pw = leftW - padL.left - padL.right, ph = H - padL.top - padL.bottom;
    const xMin = -0.5, xMax = 10, yMin = -1, yMax = 8;
    const tx = v => padL.left + (v - xMin) / (xMax - xMin) * pw;
    const ty = v => padL.top + ph - (v - yMin) / (yMax - yMin) * ph;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMax), ty(yMin)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMin), ty(yMax)); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x', tx((xMin + xMax) / 2), ty(yMin) + 20);

    ctx.beginPath();
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * i / 200;
      const y = Math.max(yMin - 2, Math.min(yMax + 2, evalPoly(coeffs, x)));
      const px = tx(x), py = ty(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    train.forEach(p => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#58C4DD'; ctx.fill();
    });
    test.forEach(p => {
      ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FC6255'; ctx.fill();
    });

    ctx.textAlign = 'left'; ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('● train', padL.left, padL.top);
    ctx.fillStyle = '#FC6255'; ctx.fillText('● test', padL.left + 55, padL.top);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('— modelo (grado ' + DEGREE + ', λ=' + lambda + ')', padL.left + 105, padL.top);
  }

  function drawBarPanel(coeffs) {
    const ox = leftW + padR.left, pw = rightW - padR.left - padR.right, ph = H - padR.top - padR.bottom;
    const params = coeffs.slice(1); // excluye theta_0
    const n = params.length;
    const barW = pw / n * 0.6, gap = pw / n;

    const zeroY = padR.top + ph / 2;
    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, zeroY); ctx.lineTo(ox + pw, zeroY); ctx.stroke();

    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('magnitud de cada parámetro θⱼ (j=1..' + n + ')', ox + pw / 2, padR.top + ph + 28);

    params.forEach((v, i) => {
      const barH = Math.min(Math.abs(v) / MAX_BAR, 1) * (ph / 2 - 4);
      const cx = ox + gap * i + gap / 2;
      const y0 = zeroY;
      const y1 = v >= 0 ? zeroY - barH : zeroY + barH;
      ctx.fillStyle = v >= 0 ? '#58C4DD' : '#FF862F';
      ctx.fillRect(cx - barW / 2, Math.min(y0, y1), barW, Math.abs(y1 - y0));
    });

    ctx.textAlign = 'center'; ctx.font = '9px Fira Code, monospace'; ctx.fillStyle = '#a8a290';
    params.forEach((v, i) => {
      const cx = ox + gap * i + gap / 2;
      ctx.fillText('θ' + (i + 1), cx, zeroY + ph / 2 + 12);
    });
  }

  function updateInfo(coeffs, lambda) {
    const el = document.getElementById('regularization-info');
    if (!el) return;
    const trainMSE = mse(coeffs, train), testMSE = mse(coeffs, test);
    const maxAbs = Math.max(...coeffs.slice(1).map(Math.abs));
    let zone, zoneColor;
    if (lambdaIdx <= 1) { zone = 'Overfitting (λ muy chico o nulo)'; zoneColor = 'var(--c-red)'; }
    else if (lambdaIdx >= 9) { zone = 'Underfitting (λ muy grande)'; zoneColor = 'var(--c-orange)'; }
    else { zone = 'Zona razonable'; zoneColor = 'var(--c-green)'; }
    el.innerHTML = `
      <div class="widget-label"><span>Train MSE</span><span class="widget-value">${trainMSE.toFixed(3)}</span></div>
      <div class="widget-label"><span>Test MSE</span><span class="widget-value">${testMSE.toFixed(3)}</span></div>
      <div class="widget-label"><span>max |θⱼ|</span><span class="widget-value">${maxAbs.toFixed(2)}</span></div>
      <div class="widget-label" style="margin-top:0.3em;"><span>Diagnóstico</span><span class="widget-value" style="color:${zoneColor};">${zone}</span></div>`;
  }

  const slider = document.getElementById('regularization-slider');
  const lambdaLabel = document.getElementById('regularization-lambda-value');
  function setIdx(idx) {
    lambdaIdx = Math.max(0, Math.min(LAMBDAS.length - 1, idx));
    if (slider) slider.value = lambdaIdx;
    if (lambdaLabel) lambdaLabel.textContent = LAMBDAS[lambdaIdx];
    draw();
  }
  if (slider) {
    slider.addEventListener('input', function () { setIdx(parseInt(this.value, 10)); });
  }
  document.querySelectorAll('.regularization-preset').forEach(btn => {
    btn.addEventListener('click', () => setIdx(parseInt(btn.dataset.idx, 10)));
  });

  setIdx(lambdaIdx);
}
