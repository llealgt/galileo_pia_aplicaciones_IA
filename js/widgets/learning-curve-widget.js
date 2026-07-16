// ============================================================
// Learning Curve Widget (error vs. tamaño del training set)
// Responde la pregunta: "¿me ayudaría conseguir más datos?"
// 3 escenarios (alto sesgo / alta varianza / balance ideal),
// cada uno con curvas paramétricas de train-error y cv-error
// como función de m (número de ejemplos de entrenamiento).
// ============================================================

function initLearningCurveWidget() {
  const canvas = document.getElementById('learning-curve-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const SCENARIOS = {
    bias: {
      label: 'Alto Sesgo (Underfitting)',
      color: '#FF862F',
      train: m => 0.40 - 0.35 * Math.exp(-m / 8),
      cv: m => 0.40 + 0.55 * Math.exp(-m / 25),
      verdict: '❌ No — el modelo es demasiado simple para los datos. Train y CV error convergen a un mismo piso alto: conseguir más datos NO va a cerrar esta brecha. Conviene un modelo más complejo, más features, o menos regularización.',
      verdictColor: '#FF862F'
    },
    variance: {
      label: 'Alta Varianza (Overfitting)',
      color: '#FC6255',
      train: m => 0.05 + 0.03 * Math.exp(-m / 10),
      cv: m => 0.05 + 0.55 * Math.exp(-m / 80),
      verdict: '✅ Sí — el train error es bajo pero el CV error sigue alto y bajando lentamente: la brecha (varianza) todavía no se cierra. Más datos de entrenamiento probablemente sí mejoren la generalización.',
      verdictColor: '#83C167'
    },
    ideal: {
      label: 'Balance Ideal',
      color: '#83C167',
      train: m => 0.10 + 0.03 * Math.exp(-m / 20),
      cv: m => 0.10 + 0.25 * Math.exp(-m / 25),
      verdict: '⚖️ Rendimientos decrecientes — la brecha entre train y CV error ya es pequeña. Más datos ayudan cada vez menos; probablemente ya no sea la inversión más rentable.',
      verdictColor: '#58C4DD'
    }
  };

  let scenario = 'bias';
  const M_MAX = 200;
  let m = 100;

  const pad = { left: 55, right: 20, top: 25, bottom: 45 };
  const pw = W - pad.left - pad.right, ph = H - pad.top - pad.bottom;
  const yMax = 1.0;
  function tx(v) { return pad.left + (v / M_MAX) * pw; }
  function ty(v) { return pad.top + ph - (v / yMax) * ph; }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const s = SCENARIOS[scenario];

    // Grid + axes
    ctx.strokeStyle = 'rgba(168,162,144,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top + ph); ctx.lineTo(pad.left + pw, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + ph); ctx.stroke();
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      ctx.fillText(v.toFixed(2), pad.left - 22, ty(v) + 3);
      ctx.strokeStyle = 'rgba(168,162,144,0.15)';
      ctx.beginPath(); ctx.moveTo(pad.left, ty(v)); ctx.lineTo(pad.left + pw, ty(v)); ctx.stroke();
    });
    ctx.fillText('número de ejemplos de entrenamiento (m)', pad.left + pw / 2, pad.top + ph + 30);
    ctx.save(); ctx.translate(18, pad.top + ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('error', 0, 0); ctx.restore();

    // Curves
    function drawCurve(fn, color) {
      ctx.beginPath();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      for (let i = 0; i <= 100; i++) {
        const mv = 2 + (M_MAX - 2) * i / 100;
        const px = tx(mv), py = ty(Math.max(0, fn(mv)));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    drawCurve(s.train, '#58C4DD');
    drawCurve(s.cv, '#FC6255');

    // Current m marker
    ctx.strokeStyle = 'rgba(255,255,0,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(tx(m), pad.top); ctx.lineTo(tx(m), pad.top + ph); ctx.stroke();
    ctx.setLineDash([]);
    [[s.train, '#58C4DD'], [s.cv, '#FC6255']].forEach(([fn, color]) => {
      ctx.beginPath(); ctx.arc(tx(m), ty(Math.max(0, fn(m))), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill();
    });

    // Legend
    ctx.textAlign = 'left'; ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#58C4DD'; ctx.fillText('— train error', pad.left, pad.top - 8);
    ctx.fillStyle = '#FC6255'; ctx.fillText('— CV / test error', pad.left + 110, pad.top - 8);

    updatePanel(s);
  }

  function updatePanel(s) {
    const infoEl = document.getElementById('learning-curve-info');
    if (infoEl) {
      const trainVal = Math.max(0, s.train(m)), cvVal = Math.max(0, s.cv(m));
      const gap = cvVal - trainVal;
      infoEl.innerHTML = `
        <div class="widget-label"><span>Train error (m=${m})</span><span class="widget-value">${trainVal.toFixed(3)}</span></div>
        <div class="widget-label"><span>CV error (m=${m})</span><span class="widget-value">${cvVal.toFixed(3)}</span></div>
        <div class="widget-label"><span>Brecha (gap)</span><span class="widget-value">${gap.toFixed(3)}</span></div>`;
    }
    const verdictEl = document.getElementById('learning-curve-verdict');
    if (verdictEl) {
      verdictEl.innerHTML = `<strong style="color:${s.verdictColor};">¿Ayudaría conseguir más datos?</strong><br>${s.verdict}`;
    }
  }

  document.querySelectorAll('.learning-curve-scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      scenario = btn.dataset.scenario;
      document.querySelectorAll('.learning-curve-scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      draw();
    });
  });

  const slider = document.getElementById('learning-curve-m-slider');
  const mLabel = document.getElementById('learning-curve-m-value');
  if (slider) {
    slider.addEventListener('input', function () {
      m = parseInt(this.value, 10);
      if (mLabel) mLabel.textContent = m;
      draw();
    });
  }

  draw();
}
