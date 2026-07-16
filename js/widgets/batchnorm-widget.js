// ============================================================
// Batch Normalization Widget
// Simula las activaciones "crudas" de una capa como muestras de
// una normal N(mu, sigma) que el usuario controla (para imitar
// "internal covariate shift"). Cada click en "Nuevo mini-batch"
// dibuja n=30 muestras nuevas y muestra el histograma antes y
// después de normalizar+escalar (gamma, beta). En modo
// "Entrenamiento" se usan las estadísticas del batch actual (que
// varían de click en click — la fuente del efecto regularizador
// secundario); en modo "Inferencia" se usa un promedio móvil fijo
// acumulado durante el entrenamiento (sin ruido, determinista).
// ============================================================

function initBatchNormWidget() {
  const canvas = document.getElementById('batchnorm-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let muTrue = 2, sigmaTrue = 1.5;
  let gamma = 1, beta = 0;
  let mode = 'train'; // 'train' | 'infer'
  const N = 40;
  const MOMENTUM = 0.9;
  let runningMean = muTrue, runningVar = sigmaTrue * sigmaTrue;
  let batch = [];

  function gaussian(mu, sigma) {
    // Box-Muller
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mu + sigma * z;
  }

  function sampleBatch() {
    batch = Array.from({ length: N }, () => gaussian(muTrue, sigmaTrue));
    const mean = batch.reduce((a, b) => a + b, 0) / N;
    const variance = batch.reduce((a, b) => a + (b - mean) ** 2, 0) / N;
    runningMean = MOMENTUM * runningMean + (1 - MOMENTUM) * mean;
    runningVar = MOMENTUM * runningVar + (1 - MOMENTUM) * variance;
    return { mean, variance };
  }
  let batchStats = sampleBatch();

  function currentStats() {
    return mode === 'train' ? batchStats : { mean: runningMean, variance: runningVar };
  }

  function normalize(x, stats) {
    const xhat = (x - stats.mean) / Math.sqrt(stats.variance + 1e-8);
    return gamma * xhat + beta;
  }

  const leftW = W * 0.5, rightW = W - leftW;
  const padL = { left: 35, right: 15, top: 30, bottom: 35 };
  const padR = { left: 35, right: 15, top: 30, bottom: 35 };

  function histogram(values, xMin, xMax, nBins) {
    const bins = new Array(nBins).fill(0);
    values.forEach(v => {
      const idx = Math.min(nBins - 1, Math.max(0, Math.floor((v - xMin) / (xMax - xMin) * nBins)));
      bins[idx]++;
    });
    return bins;
  }

  function drawHistPanel(ox, pw, ph, top, values, xMin, xMax, color, title, meanVal) {
    const nBins = 16;
    const bins = histogram(values, xMin, xMax, nBins);
    const maxCount = Math.max(...bins, 1);
    const binW = pw / nBins;

    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, top + ph); ctx.lineTo(ox + pw, top + ph); ctx.stroke();

    bins.forEach((c, i) => {
      const h = (c / maxCount) * (ph - 4);
      ctx.fillStyle = color;
      ctx.fillRect(ox + i * binW + 1, top + ph - h, binW - 2, h);
    });

    // linea vertical en la media
    const mx = ox + ((meanVal - xMin) / (xMax - xMin)) * pw;
    if (mx > ox && mx < ox + pw) {
      ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(mx, top); ctx.lineTo(mx, top + ph); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#ece6d0'; ctx.font = '11px Fira Code, monospace'; ctx.textAlign = 'center';
    ctx.fillText(title, ox + pw / 2, top - 12);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const stats = currentStats();
    const normalized = batch.map(x => normalize(x, stats));

    const rawMin = muTrue - 3 * sigmaTrue - 1, rawMax = muTrue + 3 * sigmaTrue + 1;
    drawHistPanel(padL.left, leftW - padL.left - padL.right, H - padL.top - padL.bottom, padL.top,
      batch, rawMin, rawMax, '#FC6255', 'Antes de BatchNorm', stats.mean);

    const normMin = beta - 3 * Math.abs(gamma) - 3, normMax = beta + 3 * Math.abs(gamma) + 3;
    drawHistPanel(leftW + padR.left, rightW - padR.left - padR.right, H - padR.top - padR.bottom, padR.top,
      normalized, normMin, normMax, '#58C4DD', 'Después (γ·x̂+β)', beta);

    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.beginPath(); ctx.moveTo(leftW, 8); ctx.lineTo(leftW, H - 8); ctx.stroke();

    updateInfo(stats);
  }

  function updateInfo(stats) {
    const el = document.getElementById('batchnorm-info');
    if (!el) return;
    const modeLabel = mode === 'train'
      ? `<span style="color:var(--c-red);">Entrenamiento</span> (usa μ,σ del batch actual)`
      : `<span style="color:var(--c-green);">Inferencia</span> (usa promedio móvil fijo)`;
    el.innerHTML = `
      <div class="widget-label"><span>Modo</span><span class="widget-value">${modeLabel}</span></div>
      <div class="widget-label"><span>μ usada</span><span class="widget-value">${stats.mean.toFixed(2)}</span></div>
      <div class="widget-label"><span>σ² usada</span><span class="widget-value">${stats.variance.toFixed(2)}</span></div>
      <div class="widget-label" style="margin-top:0.2em;"><span>Running μ / σ²</span><span class="widget-value">${runningMean.toFixed(2)} / ${runningVar.toFixed(2)}</span></div>`;
  }

  function bind(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', handler);
  }
  bind('batchnorm-mu-slider', function () {
    muTrue = parseFloat(this.value);
    document.getElementById('batchnorm-mu-value').textContent = muTrue.toFixed(1);
    draw();
  });
  bind('batchnorm-sigma-slider', function () {
    sigmaTrue = parseFloat(this.value);
    document.getElementById('batchnorm-sigma-value').textContent = sigmaTrue.toFixed(1);
    draw();
  });
  bind('batchnorm-gamma-slider', function () {
    gamma = parseFloat(this.value);
    document.getElementById('batchnorm-gamma-value').textContent = gamma.toFixed(1);
    draw();
  });
  bind('batchnorm-beta-slider', function () {
    beta = parseFloat(this.value);
    document.getElementById('batchnorm-beta-value').textContent = beta.toFixed(1);
    draw();
  });

  const newBatchBtn = document.getElementById('batchnorm-newbatch-btn');
  if (newBatchBtn) {
    newBatchBtn.addEventListener('click', () => {
      batchStats = sampleBatch();
      draw();
    });
  }
  document.querySelectorAll('.batchnorm-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      document.querySelectorAll('.batchnorm-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  draw();
}
