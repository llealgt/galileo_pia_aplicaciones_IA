// ============================================================
// ROC Curve Widget
// Usa el mismo dataset de 32 "pacientes" del widget de umbral
// de decisión. Barre todos los umbrales posibles y grafica
// True Positive Rate (recall) vs. False Positive Rate (1-specificity),
// sombrea el área bajo la curva (AUC) y sincroniza un marcador
// con el umbral actual.
// ============================================================

function initROCCurveWidget() {
  const canvas = document.getElementById('roc-curve-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Mismo dataset que confusion-threshold-widget.js (sin jitter, no se necesita aquí)
  const POINTS = [
    { score: 0.05, label: 0 }, { score: 0.08, label: 0 }, { score: 0.12, label: 0 }, { score: 0.15, label: 0 },
    { score: 0.18, label: 0 }, { score: 0.22, label: 0 }, { score: 0.25, label: 0 }, { score: 0.28, label: 0 },
    { score: 0.32, label: 0 }, { score: 0.35, label: 0 }, { score: 0.38, label: 0 }, { score: 0.42, label: 0 },
    { score: 0.46, label: 0 }, { score: 0.50, label: 0 }, { score: 0.55, label: 0 }, { score: 0.60, label: 0 },
    { score: 0.40, label: 1 }, { score: 0.45, label: 1 }, { score: 0.48, label: 1 }, { score: 0.52, label: 1 },
    { score: 0.55, label: 1 }, { score: 0.58, label: 1 }, { score: 0.62, label: 1 }, { score: 0.65, label: 1 },
    { score: 0.68, label: 1 }, { score: 0.72, label: 1 }, { score: 0.75, label: 1 }, { score: 0.80, label: 1 },
    { score: 0.85, label: 1 }, { score: 0.88, label: 1 }, { score: 0.92, label: 1 }, { score: 0.95, label: 1 }
  ];
  const totalPos = POINTS.filter(p => p.label === 1).length;
  const totalNeg = POINTS.filter(p => p.label === 0).length;

  function ratesAt(threshold) {
    let TP = 0, FP = 0;
    POINTS.forEach(p => {
      const predPos = p.score >= threshold;
      if (predPos && p.label === 1) TP++;
      if (predPos && p.label === 0) FP++;
    });
    return { tpr: TP / totalPos, fpr: FP / totalNeg };
  }

  // Umbrales candidatos: todos los scores únicos + extremos, de mayor a menor
  // (umbral alto -> esquina (0,0); umbral bajo -> esquina (1,1))
  const thresholds = [1.01, ...POINTS.map(p => p.score).sort((a, b) => b - a), -0.01];
  const rocPoints = thresholds.map(t => ({ t, ...ratesAt(t) }));

  // AUC por la regla del trapecio sobre los puntos ordenados por FPR ascendente
  const sorted = [...rocPoints].sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let auc = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dx = sorted[i].fpr - sorted[i - 1].fpr;
    const avgY = (sorted[i].tpr + sorted[i - 1].tpr) / 2;
    auc += dx * avgY;
  }

  let threshold = 0.5;

  const pad = { left: 50, right: 25, top: 20, bottom: 45 };
  const pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
  function tx(v) { return pad.left + v * pw; }
  function ty(v) { return pad.top + ph - v * ph; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Axes + grid
    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      ctx.fillText(v.toFixed(2), tx(v), pad.top + ph + 16);
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), pad.left - 8, ty(v) + 3);
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(168,162,144,0.1)';
      ctx.beginPath(); ctx.moveTo(tx(v), pad.top); ctx.lineTo(tx(v), pad.top + ph); ctx.stroke();
    });
    ctx.fillText('False Positive Rate (1 − specificity)', pad.left + pw / 2, pad.top + ph + 32);
    ctx.save(); ctx.translate(16, pad.top + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('True Positive Rate (recall)', 0, 0); ctx.restore();

    // AUC shaded area
    ctx.beginPath();
    ctx.moveTo(tx(0), ty(0));
    sorted.forEach(p => ctx.lineTo(tx(p.fpr), ty(p.tpr)));
    ctx.lineTo(tx(1), ty(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(88,196,221,0.12)';
    ctx.fill();

    // Diagonal (clasificador aleatorio)
    ctx.strokeStyle = 'rgba(168,162,144,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(tx(0), ty(0)); ctx.lineTo(tx(1), ty(1)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(236,230,208,0.5)'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('azar (AUC=0.5)', tx(0.55), ty(0.5) + 14);

    // ROC curve
    ctx.beginPath();
    ctx.strokeStyle = '#58C4DD'; ctx.lineWidth = 2.5;
    sorted.forEach((p, i) => {
      const px = tx(p.fpr), py = ty(p.tpr);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Punto ideal
    ctx.fillStyle = 'rgba(131,193,103,0.7)';
    ctx.beginPath(); ctx.arc(tx(0), ty(1), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#83C167'; ctx.font = '9px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('ideal', tx(0) + 8, ty(1) + 3);

    // Marcador del umbral actual
    const cur = ratesAt(threshold);
    ctx.beginPath();
    ctx.arc(tx(cur.fpr), ty(cur.tpr), 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFF00';
    ctx.fill();
    ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.5; ctx.stroke();

    // AUC label
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 12px Fira Code, monospace'; ctx.textAlign = 'left';
    ctx.fillText('AUC = ' + auc.toFixed(3), pad.left + 8, pad.top + 14);

    updatePanel(cur);
  }

  function updatePanel(cur) {
    const el = document.getElementById('roc-curve-info');
    if (!el) return;
    el.innerHTML = `
      <div class="widget-label"><span>Umbral</span><span class="widget-value">${threshold.toFixed(2)}</span></div>
      <div class="widget-label"><span>TPR (recall)</span><span class="widget-value">${(cur.tpr * 100).toFixed(1)}%</span></div>
      <div class="widget-label"><span>FPR (1−specificity)</span><span class="widget-value">${(cur.fpr * 100).toFixed(1)}%</span></div>
      <div class="widget-label" style="margin-top:0.3em; border-top:1px solid rgba(168,162,144,0.25); padding-top:0.3em;">
        <span><strong>AUC</strong></span><span class="widget-value" style="color:var(--c-blue);"><strong>${auc.toFixed(3)}</strong></span>
      </div>`;
  }

  const slider = document.getElementById('roc-curve-threshold-slider');
  const thLabel = document.getElementById('roc-curve-threshold-value');
  if (slider) {
    slider.addEventListener('input', function () {
      threshold = parseFloat(this.value);
      if (thLabel) thLabel.textContent = threshold.toFixed(2);
      draw();
    });
  }

  draw();
}
