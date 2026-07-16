// ============================================================
// Bias-Variance / Model Complexity Widget
// Ajusta un polinomio de grado d a un dataset fijo (train/test)
// y muestra en vivo: (izq) el ajuste sobre los datos, y
// (der) las curvas de error de train y test contra la
// complejidad del modelo (grado del polinomio) — el clásico
// "U-shape" de overfitting/underfitting.
// ============================================================

function initBiasVarianceWidget() {
  const canvas = document.getElementById('bias-variance-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Dataset fijo: y = f(x) + ruido, dividido en train/test
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

  const xMean = ALL.reduce((s, p) => s + p.x, 0) / ALL.length;
  const xScale = 5;
  function norm(x) { return (x - xMean) / xScale; }

  // Resuelve (X^T X) beta = X^T y por eliminación gaussiana
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

  function fitPoly(points, degree) {
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

  const MAX_DEGREE = 10;
  // Precalcula train/test MSE para cada grado (para dibujar la curva U completa)
  const errorCurve = [];
  for (let d = 1; d <= MAX_DEGREE; d++) {
    const c = fitPoly(train, d);
    errorCurve.push({ degree: d, trainMSE: mse(c, train), testMSE: mse(c, test) });
  }

  let degree = 3;

  // Layout: panel izquierdo (datos + ajuste), panel derecho (curva de error)
  const leftW = W * 0.55, rightW = W - leftW;
  const padL = { left: 45, right: 15, top: 20, bottom: 35 };
  const padR = { left: 50, right: 15, top: 20, bottom: 35 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    drawFitPanel();
    drawErrorPanel();

    // Divider
    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.beginPath(); ctx.moveTo(leftW, 8); ctx.lineTo(leftW, H - 8); ctx.stroke();

    updatePanel();
  }

  function drawFitPanel() {
    const pw = leftW - padL.left - padL.right, ph = H - padL.top - padL.bottom;
    const xMin = -0.5, xMax = 10, yMin = -1, yMax = 8;
    const tx = v => padL.left + (v - xMin) / (xMax - xMin) * pw;
    const ty = v => padL.top + ph - (v - yMin) / (yMax - yMin) * ph;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMax), ty(yMin)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMin), ty(yMax)); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('x', tx((xMin + xMax) / 2), ty(yMin) + 20);

    const coeffs = fitPoly(train, degree);

    // Fitted curve
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

    // Points
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
    ctx.fillStyle = '#FFFF00'; ctx.fillText('— modelo (grado ' + degree + ')', padL.left + 105, padL.top);
  }

  function drawErrorPanel() {
    const ox = leftW + padR.left, pw = rightW - padR.left - padR.right, ph = H - padR.top - padR.bottom;
    const maxErr = Math.max(...errorCurve.map(e => Math.max(e.trainMSE, e.testMSE))) * 1.1;
    const tx = d => ox + (d - 1) / (MAX_DEGREE - 1) * pw;
    const ty = e => padR.top + ph - (e / maxErr) * ph;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, padR.top + ph); ctx.lineTo(ox + pw, padR.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, padR.top); ctx.lineTo(ox, padR.top + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('grado del polinomio (complejidad)', ox + pw / 2, padR.top + ph + 28);
    ctx.save(); ctx.translate(ox - 32, padR.top + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('error (MSE)', 0, 0); ctx.restore();

    function drawCurve(key, color) {
      ctx.beginPath();
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      errorCurve.forEach((e, i) => {
        const px = tx(e.degree), py = ty(e[key]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    drawCurve('trainMSE', '#58C4DD');
    drawCurve('testMSE', '#FC6255');

    // Marker for current degree
    const cur = errorCurve[degree - 1];
    ctx.strokeStyle = 'rgba(255,255,0,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(tx(degree), padR.top); ctx.lineTo(tx(degree), padR.top + ph); ctx.stroke();
    ctx.setLineDash([]);
    [['trainMSE', '#58C4DD'], ['testMSE', '#FC6255']].forEach(([k, c]) => {
      ctx.beginPath(); ctx.arc(tx(degree), ty(cur[k]), 4, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
    });

    ctx.textAlign = 'left'; ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('— train error', ox, padR.top - 6);
    ctx.fillStyle = '#FC6255'; ctx.fillText('— test error', ox + 80, padR.top - 6);

    // Zone labels
    ctx.fillStyle = 'rgba(236,230,208,0.45)'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText('underfitting', ox + pw * 0.15, padR.top + ph + 12);
    ctx.fillText('overfitting', ox + pw * 0.85, padR.top + ph + 12);
  }

  function updatePanel() {
    const el = document.getElementById('bias-variance-info');
    if (!el) return;
    const cur = errorCurve[degree - 1];
    let zone, zoneColor;
    if (degree <= 2) { zone = 'Underfitting (alto sesgo)'; zoneColor = 'var(--c-orange)'; }
    else if (degree >= 7) { zone = 'Overfitting (alta varianza)'; zoneColor = 'var(--c-red)'; }
    else { zone = 'Zona razonable'; zoneColor = 'var(--c-green)'; }
    el.innerHTML = `
      <div class="widget-label"><span>Train MSE</span><span class="widget-value">${cur.trainMSE.toFixed(3)}</span></div>
      <div class="widget-label"><span>Test MSE</span><span class="widget-value">${cur.testMSE.toFixed(3)}</span></div>
      <div class="widget-label" style="margin-top:0.3em;"><span>Diagnóstico</span><span class="widget-value" style="color:${zoneColor};">${zone}</span></div>`;
  }

  const slider = document.getElementById('bias-variance-slider');
  const degLabel = document.getElementById('bias-variance-degree-value');
  if (slider) {
    slider.addEventListener('input', function () {
      degree = parseInt(this.value, 10);
      if (degLabel) degLabel.textContent = degree;
      draw();
    });
  }

  draw();
}
