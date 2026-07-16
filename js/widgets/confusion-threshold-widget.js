// ============================================================
// Confusion Matrix / Decision Threshold Widget
// 30 "pacientes" simulados con un score de modelo en [0,1].
// Mueve el umbral y observa cómo cambian TP/FP/FN/TN y las
// métricas derivadas (accuracy, precision, recall, specificity, F1).
// ============================================================

function initConfusionThresholdWidget() {
  const canvas = document.getElementById('confusion-threshold-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Dataset fijo: score de un modelo de diagnóstico + etiqueta real (0=sano, 1=enfermo)
  const POINTS = [
    { score: 0.05, label: 0, jitter: 0.3 }, { score: 0.08, label: 0, jitter: -0.6 },
    { score: 0.12, label: 0, jitter: 0.1 }, { score: 0.15, label: 0, jitter: -0.2 },
    { score: 0.18, label: 0, jitter: 0.6 }, { score: 0.22, label: 0, jitter: -0.4 },
    { score: 0.25, label: 0, jitter: 0.2 }, { score: 0.28, label: 0, jitter: -0.7 },
    { score: 0.32, label: 0, jitter: 0.5 }, { score: 0.35, label: 0, jitter: -0.1 },
    { score: 0.38, label: 0, jitter: 0.7 }, { score: 0.42, label: 0, jitter: -0.5 },
    { score: 0.46, label: 0, jitter: 0.4 }, { score: 0.50, label: 0, jitter: -0.3 },
    { score: 0.55, label: 0, jitter: 0.0 }, { score: 0.60, label: 0, jitter: 0.6 },
    { score: 0.40, label: 1, jitter: -0.5 }, { score: 0.45, label: 1, jitter: 0.4 },
    { score: 0.48, label: 1, jitter: -0.2 }, { score: 0.52, label: 1, jitter: 0.6 },
    { score: 0.55, label: 1, jitter: -0.6 }, { score: 0.58, label: 1, jitter: 0.2 },
    { score: 0.62, label: 1, jitter: -0.1 }, { score: 0.65, label: 1, jitter: 0.5 },
    { score: 0.68, label: 1, jitter: -0.4 }, { score: 0.72, label: 1, jitter: 0.3 },
    { score: 0.75, label: 1, jitter: -0.7 }, { score: 0.80, label: 1, jitter: 0.1 },
    { score: 0.85, label: 1, jitter: -0.3 }, { score: 0.88, label: 1, jitter: 0.7 },
    { score: 0.92, label: 1, jitter: -0.2 }, { score: 0.95, label: 1, jitter: 0.4 }
  ];

  let threshold = 0.5;

  const pad = { left: 30, right: 30, top: 30, bottom: 45 };
  const plotW = W - pad.left - pad.right;
  const bandTopY = pad.top + 55;   // banda "Sano" (label 0)
  const bandBotY = H - pad.bottom - 55; // banda "Enfermo" (label 1)

  function tx(score) { return pad.left + score * plotW; }

  function computeMetrics() {
    let TP = 0, FP = 0, TN = 0, FN = 0;
    POINTS.forEach(p => {
      const predPos = p.score >= threshold;
      if (p.label === 1 && predPos) TP++;
      else if (p.label === 1 && !predPos) FN++;
      else if (p.label === 0 && predPos) FP++;
      else TN++;
    });
    const total = POINTS.length;
    const accuracy = (TP + TN) / total;
    const precision = (TP + FP) > 0 ? TP / (TP + FP) : 0;
    const recall = (TP + FN) > 0 ? TP / (TP + FN) : 0;
    const specificity = (TN + FP) > 0 ? TN / (TN + FP) : 0;
    const f1 = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;
    return { TP, FP, TN, FN, total, accuracy, precision, recall, specificity, f1 };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Band labels
    ctx.font = '12px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#83C167';
    ctx.fillText('Realidad: Sano (y=0)', pad.left, bandTopY - 22);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('Realidad: Enfermo (y=1)', pad.left, bandBotY - 22);

    // Axis line (score 0-1)
    ctx.strokeStyle = 'rgba(168,162,144,0.4)';
    ctx.lineWidth = 1;
    const axisY = H - pad.bottom + 10;
    ctx.beginPath(); ctx.moveTo(pad.left, axisY); ctx.lineTo(W - pad.right, axisY); ctx.stroke();
    ctx.fillStyle = '#a8a290';
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      ctx.fillText(v.toFixed(2), tx(v), axisY + 16);
      ctx.beginPath(); ctx.moveTo(tx(v), axisY - 4); ctx.lineTo(tx(v), axisY + 4); ctx.stroke();
    });
    ctx.fillText('score del modelo (probabilidad predicha)', (pad.left + W - pad.right) / 2, axisY + 32);

    // Points
    POINTS.forEach(p => {
      const predPos = p.score >= threshold;
      const bandY = p.label === 0 ? bandTopY : bandBotY;
      const cy = bandY + p.jitter * 18;
      const cx = tx(p.score);
      let correct = (p.label === 1 && predPos) || (p.label === 0 && !predPos);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? '#FC6255' : '#83C167';
      ctx.globalAlpha = correct ? 1 : 0.35;
      ctx.fill();
      if (!correct) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFF00';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // Threshold line
    const thX = tx(threshold);
    ctx.strokeStyle = '#58C4DD';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(thX, pad.top); ctx.lineTo(thX, H - pad.bottom); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#58C4DD';
    ctx.font = 'bold 11px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('umbral', thX, pad.top - 10);

    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(236,230,208,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('← predicho "sano"', pad.left, pad.top - 10);
    ctx.textAlign = 'right';
    ctx.fillText('predicho "enfermo" →', W - pad.right, pad.top - 10);

    updatePanel(computeMetrics());
  }

  function pct(v) { return (v * 100).toFixed(1) + '%'; }

  function updatePanel(m) {
    const matrixEl = document.getElementById('confusion-threshold-matrix');
    if (matrixEl) {
      matrixEl.innerHTML = `
        <table style="font-size:0.6em; margin:0 auto;">
          <tr><th></th><th style="color:var(--c-blue);">Predicho: Sano</th><th style="color:var(--c-red);">Predicho: Enfermo</th></tr>
          <tr><th style="color:var(--c-green);">Real: Sano</th>
            <td style="background:rgba(131,193,103,0.15);">TN = ${m.TN}</td>
            <td style="background:rgba(252,98,85,0.15);">FP = ${m.FP}</td></tr>
          <tr><th style="color:var(--c-red);">Real: Enfermo</th>
            <td style="background:rgba(252,98,85,0.15);">FN = ${m.FN}</td>
            <td style="background:rgba(131,193,103,0.15);">TP = ${m.TP}</td></tr>
        </table>`;
    }
    const metricsEl = document.getElementById('confusion-threshold-metrics');
    if (metricsEl) {
      metricsEl.innerHTML = `
        <div class="widget-label"><span>Accuracy</span><span class="widget-value">${pct(m.accuracy)}</span></div>
        <div class="widget-label"><span>Precision</span><span class="widget-value">${pct(m.precision)}</span></div>
        <div class="widget-label"><span>Recall (sensitividad)</span><span class="widget-value">${pct(m.recall)}</span></div>
        <div class="widget-label"><span>Specificity</span><span class="widget-value">${pct(m.specificity)}</span></div>
        <div class="widget-label"><span>F1-score</span><span class="widget-value">${pct(m.f1)}</span></div>`;
    }

    // Impacto de negocio: cada celda de la matriz de confusión tiene un costo/beneficio.
    // TP = tratamiento a tiempo (+), FP = examen de más (-), FN = paciente sin tratar (-), TN = sin costo.
    const REVENUE_TP = 150, COST_FP = 20, COST_FN = 300;
    const net = m.TP * REVENUE_TP - m.FP * COST_FP - m.FN * COST_FN;
    const businessEl = document.getElementById('confusion-threshold-business');
    if (businessEl) {
      businessEl.innerHTML = `
        <div class="widget-label"><span>+ TP (tratar a tiempo)</span><span class="widget-value" style="color:var(--c-green);">+$${(m.TP * REVENUE_TP)}</span></div>
        <div class="widget-label"><span>− FP (examen de más)</span><span class="widget-value" style="color:var(--c-orange);">−$${(m.FP * COST_FP)}</span></div>
        <div class="widget-label"><span>− FN (paciente sin tratar)</span><span class="widget-value" style="color:var(--c-red);">−$${(m.FN * COST_FN)}</span></div>
        <div class="widget-label" style="margin-top:0.3em; border-top:1px solid rgba(168,162,144,0.25); padding-top:0.3em;">
          <span><strong>Impacto neto</strong></span><span class="widget-value" style="color:${net >= 0 ? 'var(--c-green)' : 'var(--c-red)'};"><strong>${net >= 0 ? '+' : ''}$${net}</strong></span>
        </div>`;
    }
  }

  const slider = document.getElementById('confusion-threshold-slider');
  const thLabel = document.getElementById('confusion-threshold-value');
  if (slider) {
    slider.addEventListener('input', function () {
      threshold = parseFloat(this.value);
      if (thLabel) thLabel.textContent = threshold.toFixed(2);
      draw();
    });
  }

  document.querySelectorAll('.confusion-threshold-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      threshold = parseFloat(btn.dataset.threshold);
      if (slider) slider.value = threshold;
      if (thLabel) thLabel.textContent = threshold.toFixed(2);
      draw();
    });
  });

  draw();
}
