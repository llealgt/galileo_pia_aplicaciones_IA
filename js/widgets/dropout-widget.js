// ============================================================
// Dropout Widget
// Visualiza una red feedforward pequeña (4-6-6-3) donde, en modo
// "Entrenamiento", cada neurona de las capas ocultas se apaga al
// azar con probabilidad p en cada paso — ilustra la idea de que
// cada paso de entrenamiento usa una sub-red distinta (un
// "ensemble" implícito de redes que comparten pesos). En modo
// "Inferencia" todas las neuronas están activas (sin dropout).
// ============================================================

function initDropoutWidget() {
  const canvas = document.getElementById('dropout-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const LAYERS = [4, 6, 6, 3];
  const DROPPABLE = [false, true, true, false]; // input y output nunca se apagan

  let p = 0.3; // probabilidad de apagar una neurona
  let mode = 'train'; // 'train' | 'infer'
  let step = 0;
  let masks = LAYERS.map(n => new Array(n).fill(true));

  function layout() {
    const marginX = 70, marginY = 30;
    const usableW = W - marginX * 2;
    const positions = [];
    LAYERS.forEach((n, li) => {
      const x = marginX + (usableW * li) / (LAYERS.length - 1);
      const usableH = H - marginY * 2;
      const col = [];
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? H / 2 : marginY + (usableH * i) / (n - 1);
        col.push({ x, y });
      }
      positions.push(col);
    });
    return positions;
  }
  const positions = layout();

  function resample() {
    masks = LAYERS.map((n, li) => {
      if (!DROPPABLE[li]) return new Array(n).fill(true);
      return Array.from({ length: n }, () => Math.random() > p);
    });
    step++;
  }
  resample();

  function activeMask(li) {
    return mode === 'infer' ? new Array(LAYERS[li]).fill(true) : masks[li];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const active = LAYERS.map((_, li) => activeMask(li));

    // Edges
    for (let li = 0; li < LAYERS.length - 1; li++) {
      const a = active[li], b = active[li + 1];
      positions[li].forEach((p1, i) => {
        positions[li + 1].forEach((p2, j) => {
          const on = a[i] && b[j];
          ctx.strokeStyle = on ? 'rgba(88,196,221,0.35)' : 'rgba(168,162,144,0.06)';
          ctx.lineWidth = on ? 1 : 1;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });
      });
    }

    // Nodes
    LAYERS.forEach((n, li) => {
      positions[li].forEach((pos, i) => {
        const on = active[li][i];
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 13, 0, Math.PI * 2);
        if (on) {
          ctx.fillStyle = DROPPABLE[li] ? '#58C4DD' : '#5CD0B3';
          ctx.fill();
        } else {
          ctx.fillStyle = '#1b1b2f';
          ctx.fill();
          ctx.strokeStyle = 'rgba(252,98,85,0.55)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          // X mark
          ctx.strokeStyle = 'rgba(252,98,85,0.7)';
          ctx.beginPath();
          ctx.moveTo(pos.x - 5, pos.y - 5); ctx.lineTo(pos.x + 5, pos.y + 5);
          ctx.moveTo(pos.x + 5, pos.y - 5); ctx.lineTo(pos.x - 5, pos.y + 5);
          ctx.stroke();
        }
      });
    });

    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace'; ctx.textAlign = 'center';
    const labels = ['input', 'hidden 1', 'hidden 2', 'output'];
    LAYERS.forEach((n, li) => {
      ctx.fillText(labels[li], positions[li][0].x, H - 8);
    });

    updateInfo(active);
  }

  function updateInfo(active) {
    const el = document.getElementById('dropout-info');
    if (!el) return;
    const totalHidden = LAYERS[1] + LAYERS[2];
    const activeHidden = active[1].filter(Boolean).length + active[2].filter(Boolean).length;
    const modeLabel = mode === 'train'
      ? `<span style="color:var(--c-red);">Entrenamiento</span> — cada paso apaga neuronas al azar`
      : `<span style="color:var(--c-green);">Inferencia</span> — todas las neuronas activas`;
    el.innerHTML = `
      <div class="widget-label"><span>Modo</span><span class="widget-value">${modeLabel}</span></div>
      <div class="widget-label"><span>Neuronas ocultas activas</span><span class="widget-value">${activeHidden} / ${totalHidden}</span></div>
      <div class="widget-label"><span>Paso de entrenamiento #</span><span class="widget-value">${step}</span></div>`;
  }

  const slider = document.getElementById('dropout-p-slider');
  const pLabel = document.getElementById('dropout-p-value');
  if (slider) {
    slider.addEventListener('input', function () {
      p = parseFloat(this.value);
      if (pLabel) pLabel.textContent = p.toFixed(2);
      if (mode === 'train') { resample(); draw(); }
    });
  }
  document.querySelectorAll('.dropout-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      p = parseFloat(btn.dataset.p);
      if (slider) slider.value = p;
      if (pLabel) pLabel.textContent = p.toFixed(2);
      if (mode === 'train') { resample(); draw(); }
    });
  });
  const stepBtn = document.getElementById('dropout-step-btn');
  if (stepBtn) {
    stepBtn.addEventListener('click', () => {
      if (mode === 'train') resample();
      draw();
    });
  }
  document.querySelectorAll('.dropout-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      document.querySelectorAll('.dropout-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  draw();
}
