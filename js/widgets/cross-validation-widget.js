// ============================================================
// Model Selection / Cross-Validation Widget
// Dataset fijo (33 puntos, split fijo train/cv/test ~60/20/20).
// Dos modos intercambiables:
//   - "degree": barre el grado del polinomio (lambda=0)
//   - "lambda": barre el factor de regularizacion (grado=9, fijo
//     a proposito para forzar una tendencia a overfitting)
// Muestra 3 curvas de error (train/cv/test) y permite "elegir por
// CV" (salta al minimo de la curva de CV) para contrastar contra
// el minimo real de la curva de test — el punto central de la
// clase: seleccionar con CV, no con test, y aun asi el test-set
// se reserva para la evaluacion final honesta.
// ============================================================

function initCrossValidationWidget() {
  const canvas = document.getElementById('cv-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const ALL = [{"x":0,"y":3.13,"set":"train"},{"x":0.31,"y":3.47,"set":"train"},{"x":0.63,"y":4.5,"set":"train"},
    {"x":0.94,"y":4.5,"set":"cv"},{"x":1.25,"y":4.86,"set":"test"},{"x":1.56,"y":4.92,"set":"train"},
    {"x":1.88,"y":4.71,"set":"train"},{"x":2.19,"y":4.06,"set":"train"},{"x":2.5,"y":3.74,"set":"cv"},
    {"x":2.81,"y":3.79,"set":"test"},{"x":3.13,"y":3.58,"set":"train"},{"x":3.44,"y":4.38,"set":"train"},
    {"x":3.75,"y":3.58,"set":"train"},{"x":4.06,"y":3.19,"set":"cv"},{"x":4.38,"y":2.43,"set":"test"},
    {"x":4.69,"y":2.08,"set":"train"},{"x":5,"y":1.75,"set":"train"},{"x":5.31,"y":3.04,"set":"train"},
    {"x":5.63,"y":3.09,"set":"cv"},{"x":5.94,"y":3.3,"set":"test"},{"x":6.25,"y":3,"set":"train"},
    {"x":6.56,"y":3.12,"set":"train"},{"x":6.88,"y":4.44,"set":"train"},{"x":7.19,"y":3.61,"set":"cv"},
    {"x":7.5,"y":5.18,"set":"test"},{"x":7.81,"y":5.87,"set":"train"},{"x":8.13,"y":5.91,"set":"train"},
    {"x":8.44,"y":5,"set":"train"},{"x":8.75,"y":5.45,"set":"cv"},{"x":9.06,"y":5.94,"set":"test"},
    {"x":9.38,"y":4.86,"set":"train"},{"x":9.69,"y":4.99,"set":"train"},{"x":10,"y":5.08,"set":"train"}];
  const train = ALL.filter(p => p.set === 'train');
  const cvSet = ALL.filter(p => p.set === 'cv');
  const test = ALL.filter(p => p.set === 'test');

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

  const LAMBDAS = [0, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100];
  const CV_DEGREE_FOR_LAMBDA = 9; // grado alto y fijo para forzar tendencia a overfitting

  const MODES = {
    degree: {
      label: 'grado del polinomio',
      values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      fit: v => fitPolyRidge(train, v, 0),
      fmt: v => String(v)
    },
    lambda: {
      label: 'factor de regularización (λ)',
      values: LAMBDAS,
      fit: v => fitPolyRidge(train, CV_DEGREE_FOR_LAMBDA, v),
      fmt: v => String(v)
    }
  };

  let mode = 'degree';
  let idx = 3; // degree=4 por defecto (el optimo real de CV en este dataset)

  // Precalcula las 3 curvas de error para el modo activo
  function computeCurve() {
    const m = MODES[mode];
    return m.values.map(v => {
      const c = m.fit(v);
      return { v, trainMSE: mse(c, train), cvMSE: mse(c, cvSet), testMSE: mse(c, test) };
    });
  }
  let curve = computeCurve();

  const leftW = W * 0.5, rightW = W - leftW;
  const padL = { left: 45, right: 15, top: 20, bottom: 35 };
  const padR = { left: 50, right: 15, top: 20, bottom: 35 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const m = MODES[mode];
    const v = m.values[idx];
    const coeffs = m.fit(v);

    drawFitPanel(coeffs, v);
    drawErrorPanel();

    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.beginPath(); ctx.moveTo(leftW, 8); ctx.lineTo(leftW, H - 8); ctx.stroke();

    updateInfo(coeffs, v);
  }

  function drawFitPanel(coeffs, v) {
    const pw = leftW - padL.left - padL.right, ph = H - padL.top - padL.bottom;
    const xMin = -0.5, xMax = 10.5, yMin = 0, yMax = 7;
    const tx = x => padL.left + (x - xMin) / (xMax - xMin) * pw;
    const ty = y => padL.top + ph - (y - yMin) / (yMax - yMin) * ph;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMax), ty(yMin)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(xMin), ty(yMin)); ctx.lineTo(tx(xMin), ty(yMax)); ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.5;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (xMax - xMin) * i / 200;
      const y = Math.max(yMin - 2, Math.min(yMax + 2, evalPoly(coeffs, x)));
      const px = tx(x), py = ty(y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    function dots(points, color) {
      points.forEach(p => {
        ctx.beginPath(); ctx.arc(tx(p.x), ty(p.y), 5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      });
    }
    dots(train, '#58C4DD'); dots(cvSet, '#5CD0B3'); dots(test, '#FC6255');

    ctx.textAlign = 'left'; ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('● train', padL.left, padL.top - 8);
    ctx.fillStyle = '#5CD0B3'; ctx.fillText('● cv', padL.left + 52, padL.top - 8);
    ctx.fillStyle = '#FC6255'; ctx.fillText('● test', padL.left + 88, padL.top - 8);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('— modelo', padL.left + 132, padL.top - 8);
  }

  function drawErrorPanel() {
    const m = MODES[mode];
    const ox = leftW + padR.left, pw = rightW - padR.left - padR.right, ph = H - padR.top - padR.bottom;
    const n = curve.length;
    const maxErr = Math.max(...curve.map(e => Math.max(e.trainMSE, e.cvMSE, e.testMSE))) * 1.08;
    const tx = i => ox + i / (n - 1) * pw;
    const ty = e => padR.top + ph - Math.min(e / maxErr, 1) * ph;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, padR.top + ph); ctx.lineTo(ox + pw, padR.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, padR.top); ctx.lineTo(ox, padR.top + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(m.label, ox + pw / 2, padR.top + ph + 28);

    function drawCurve(key, color) {
      ctx.beginPath();
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      curve.forEach((e, i) => {
        const px = tx(i), py = ty(e[key]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    drawCurve('trainMSE', '#58C4DD');
    drawCurve('cvMSE', '#5CD0B3');
    drawCurve('testMSE', '#FC6255');

    ctx.strokeStyle = 'rgba(255,255,0,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(tx(idx), padR.top); ctx.lineTo(tx(idx), padR.top + ph); ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'left'; ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('— train', ox, padR.top - 6);
    ctx.fillStyle = '#5CD0B3'; ctx.fillText('— cv', ox + 55, padR.top - 6);
    ctx.fillStyle = '#FC6255'; ctx.fillText('— test', ox + 90, padR.top - 6);
  }

  function bestIdxByCv() {
    let best = 0;
    for (let i = 1; i < curve.length; i++) if (curve[i].cvMSE < curve[best].cvMSE) best = i;
    return best;
  }
  function bestIdxByTest() {
    let best = 0;
    for (let i = 1; i < curve.length; i++) if (curve[i].testMSE < curve[best].testMSE) best = i;
    return best;
  }

  function updateInfo(coeffs, v) {
    const el = document.getElementById('cv-info');
    if (!el) return;
    const m = MODES[mode];
    const cur = curve[idx];
    el.innerHTML = `
      <div class="widget-label"><span>${m.label} =</span><span class="widget-value">${m.fmt(v)}</span></div>
      <div class="widget-label"><span>Train error</span><span class="widget-value" style="color:#58C4DD;">${cur.trainMSE.toFixed(3)}</span></div>
      <div class="widget-label"><span>CV error</span><span class="widget-value" style="color:#5CD0B3;">${cur.cvMSE.toFixed(3)}</span></div>
      <div class="widget-label"><span>Test error</span><span class="widget-value" style="color:#FC6255;">${cur.testMSE.toFixed(3)}</span></div>`;
  }

  function updateVerdict() {
    const el = document.getElementById('cv-verdict');
    if (!el) return;
    const m = MODES[mode];
    const bCv = bestIdxByCv(), bTest = bestIdxByTest();
    const cvChoice = m.fmt(m.values[bCv]);
    const testChoice = m.fmt(m.values[bTest]);
    const sameChoice = bCv === bTest;
    el.innerHTML = sameChoice
      ? `✅ El mínimo de <strong style="color:#5CD0B3;">CV error</strong> y el mínimo de <strong style="color:#FC6255;">test error</strong> coinciden en <strong>${cvChoice}</strong> — buena señal, pero fue el <em>CV-set</em> el que se usó para decidir, el test-set solo confirma.`
      : `⚠️ CV elige <strong style="color:#5CD0B3;">${cvChoice}</strong>, pero el mínimo real de test está en <strong style="color:#FC6255;">${testChoice}</strong>. Si hubieras usado el <em>test-set</em> para elegir habrías "hecho trampa" sin darte cuenta — el número que reportarías ya no sería una estimación honesta del rendimiento en datos nuevos.`;
  }

  function setMode(newMode) {
    mode = newMode;
    idx = newMode === 'degree' ? 3 : 5; // defaults razonables por modo
    curve = computeCurve();
    document.querySelectorAll('.cv-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    const slider = document.getElementById('cv-slider');
    if (slider) {
      slider.max = MODES[mode].values.length - 1;
      slider.value = idx;
    }
    draw();
    updateVerdict();
  }

  const slider = document.getElementById('cv-slider');
  if (slider) {
    slider.addEventListener('input', function () {
      idx = parseInt(this.value, 10);
      draw();
    });
  }
  document.querySelectorAll('.cv-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });
  const cvBtn = document.getElementById('cv-select-btn');
  if (cvBtn) {
    cvBtn.addEventListener('click', () => {
      idx = bestIdxByCv();
      if (slider) slider.value = idx;
      draw();
      updateVerdict();
    });
  }

  setMode('degree');
}
