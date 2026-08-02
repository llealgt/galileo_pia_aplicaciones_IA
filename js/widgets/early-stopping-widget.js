// ============================================================
// Early Stopping Widget
// Curvas REALES de train/val loss de un MLP sobre Fashion-MNIST
// (30 epocas, las mismas del notebook 10 del curso). Al mover el
// slider de `patience` se ve donde habria parado EarlyStopping,
// cuantas epocas se ahorran, y — lo importante — la diferencia
// entre el modelo de la ULTIMA epoca y el de la MEJOR, que es lo
// que decide restore_best_weights.
// ============================================================

function initEarlyStoppingWidget() {
  const canvas = document.getElementById('early-stopping-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const TRAIN = [0.526, 0.3759, 0.336, 0.3092, 0.2941, 0.2758, 0.2615, 0.2495, 0.2415, 0.2327,
    0.222, 0.2143, 0.2107, 0.1985, 0.1936, 0.1892, 0.1791, 0.1759, 0.1713, 0.1628,
    0.1557, 0.1517, 0.1466, 0.1422, 0.1386, 0.1337, 0.1264, 0.1238, 0.1187, 0.1178];
  const VAL = [0.4168, 0.3847, 0.3598, 0.3241, 0.3263, 0.3112, 0.2996, 0.2938, 0.3078, 0.3,
    0.3047, 0.3043, 0.312, 0.3016, 0.3031, 0.3027, 0.3098, 0.3179, 0.3124, 0.3242,
    0.3311, 0.3294, 0.3424, 0.3208, 0.3599, 0.3387, 0.3567, 0.3538, 0.3692, 0.381];
  const N = VAL.length;

  const C_TRAIN = '#58C4DD';
  const C_VAL = '#FF862F';
  const C_STOP = '#FC6255';
  const C_BEST = '#83C167';

  let patience = 3;
  let restaurar = true;

  // Simula EarlyStopping: devuelve en que epoca habria parado y cual fue la mejor.
  function simular(p) {
    let mejor = Infinity, mejorEpoca = 0, espera = 0;
    for (let i = 0; i < N; i++) {
      if (VAL[i] < mejor) {
        mejor = VAL[i];
        mejorEpoca = i;
        espera = 0;
      } else {
        espera++;
        if (espera >= p) {
          return { paro: i, mejorEpoca, mejor, detenido: true };
        }
      }
    }
    return { paro: N - 1, mejorEpoca, mejor, detenido: false };
  }

  const PAD = { left: 52, right: 16, top: 34, bottom: 40 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const r = simular(patience);
    const pw = W - PAD.left - PAD.right, ph = H - PAD.top - PAD.bottom;
    const yMin = 0.10, yMax = 0.55;
    const tx = i => PAD.left + (i / (N - 1)) * pw;
    const ty = v => PAD.top + ph - ((v - yMin) / (yMax - yMin)) * ph;

    // zona descartada por la parada
    if (r.detenido) {
      ctx.fillStyle = 'rgba(252,98,85,0.10)';
      ctx.fillRect(tx(r.paro), PAD.top, tx(N - 1) - tx(r.paro), ph);
    }

    // ejes
    ctx.strokeStyle = 'rgba(168,162,144,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, PAD.top + ph);
    ctx.lineTo(PAD.left + pw, PAD.top + ph); ctx.stroke();

    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'right';
    [0.15, 0.25, 0.35, 0.45, 0.55].forEach(v => ctx.fillText(v.toFixed(2), PAD.left - 6, ty(v) + 3));
    ctx.textAlign = 'center';
    [0, 5, 10, 15, 20, 25, 29].forEach(i => ctx.fillText(String(i), tx(i), PAD.top + ph + 15));
    ctx.fillText('epoca', PAD.left + pw / 2, PAD.top + ph + 32);

    // curvas
    function curva(datos, color, hasta) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      for (let i = 0; i <= hasta; i++) {
        const px = tx(i), py = ty(datos[i]);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // tramo que SI se entrena
    curva(TRAIN, C_TRAIN, r.paro);
    curva(VAL, C_VAL, r.paro);

    // tramo descartado, en tenue
    if (r.detenido) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.strokeStyle = C_TRAIN; ctx.lineWidth = 2;
      for (let i = r.paro; i < N; i++) {
        const px = tx(i), py = ty(TRAIN[i]);
        if (i === r.paro) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.beginPath(); ctx.strokeStyle = C_VAL; ctx.lineWidth = 2;
      for (let i = r.paro; i < N; i++) {
        const px = tx(i), py = ty(VAL[i]);
        if (i === r.paro) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // marcador de la mejor epoca
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = C_BEST;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(tx(r.mejorEpoca), PAD.top); ctx.lineTo(tx(r.mejorEpoca), PAD.top + ph); ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(tx(r.mejorEpoca), ty(VAL[r.mejorEpoca]), 5.5, 0, Math.PI * 2);
    ctx.fillStyle = C_BEST; ctx.fill();

    // marcador de la parada
    if (r.detenido) {
      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = C_STOP;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx(r.paro), PAD.top); ctx.lineTo(tx(r.paro), PAD.top + ph); ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(tx(r.paro), ty(VAL[r.paro]), 5.5, 0, Math.PI * 2);
      ctx.fillStyle = C_STOP; ctx.fill();
    }

    // el modelo con el que te quedas
    const epocaFinal = restaurar ? r.mejorEpoca : r.paro;
    ctx.beginPath();
    ctx.arc(tx(epocaFinal), ty(VAL[epocaFinal]), 9, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // leyenda
    ctx.font = '9.5px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = C_TRAIN; ctx.fillText('— train loss', PAD.left + 6, PAD.top - 18);
    ctx.fillStyle = C_VAL; ctx.fillText('— val loss', PAD.left + 100, PAD.top - 18);
    ctx.fillStyle = C_BEST; ctx.fillText('● mejor epoca', PAD.left + 186, PAD.top - 18);
    ctx.fillStyle = C_STOP; ctx.fillText('● parada', PAD.left + 300, PAD.top - 18);
    ctx.fillStyle = '#FFFF00'; ctx.fillText('○ modelo final', PAD.left + 386, PAD.top - 18);

    actualizarInfo(r);
  }

  function actualizarInfo(r) {
    const el = document.getElementById('early-stopping-info');
    if (!el) return;
    const epocaFinal = restaurar ? r.mejorEpoca : r.paro;
    const valFinal = VAL[epocaFinal];
    const ahorradas = N - 1 - r.paro;
    const penalizacion = valFinal - r.mejor;

    el.innerHTML =
      '<div class="widget-label"><span>Para en la época</span><span class="widget-value">' +
      (r.detenido ? r.paro : 'no para (' + (N - 1) + ')') + '</span></div>' +
      '<div class="widget-label"><span>Mejor época</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' + r.mejorEpoca + '</span></div>' +
      '<div class="widget-label"><span>Épocas ahorradas</span>' +
      '<span class="widget-value">' + ahorradas + ' de ' + (N - 1) + '</span></div>' +
      '<div class="widget-label"><span>val_loss del modelo final</span>' +
      '<span class="widget-value" style="color:' +
      (penalizacion < 1e-9 ? 'var(--c-green)' : 'var(--c-red)') + ';">' +
      valFinal.toFixed(4) + (penalizacion > 1e-9 ? '  (+' + penalizacion.toFixed(4) + ')' : '  (el mejor)') +
      '</span></div>';
  }

  const slider = document.getElementById('early-stopping-slider');
  const label = document.getElementById('early-stopping-patience-value');
  if (slider) {
    slider.addEventListener('input', function () {
      patience = parseInt(this.value, 10);
      if (label) label.textContent = patience;
      draw();
    });
  }
  document.querySelectorAll('.es-restore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      restaurar = btn.dataset.restore === 'true';
      document.querySelectorAll('.es-restore-btn').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  if (label) label.textContent = patience;
  const inicial = document.querySelector('.es-restore-btn[data-restore="true"]');
  if (inicial) inicial.classList.add('active');
  draw();
}
