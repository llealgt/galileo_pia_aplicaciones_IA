// ============================================================
// K-Fold Cross-Validation Widget
// Muestra como se parte el conjunto de desarrollo en k folds y
// como cada iteracion usa un fold distinto para validar y el
// resto para entrenar. Al avanzar fold por fold se va calculando
// el promedio y la desviacion estandar — la idea central: la
// metrica de k-fold es un PROMEDIO de k estimados, no un solo
// numero con suerte.
//
// Los scores son ilustrativos pero deterministas (dependen de k y
// del indice del fold), para que la demo sea reproducible en clase.
// ============================================================

function initKFoldWidget() {
  const canvas = document.getElementById('kfold-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const N_OBS = 455;          // mismo tamano que el conjunto de desarrollo del notebook
  const C_TRAIN = '#58C4DD';
  const C_VAL = '#FF862F';
  const C_DIM = 'rgba(168,162,144,0.18)';

  let k = 5;
  let revelados = 1;          // arranca con el fold 1 visible: un grid vacio se ve roto
  let timer = null;

  // PRNG determinista: mismo k y mismo fold => mismo score siempre.
  function scoreDe(kk, i) {
    let h = (kk * 7919 + i * 104729) >>> 0;
    h ^= h << 13; h >>>= 0;
    h ^= h >> 17;
    h ^= h << 5; h >>>= 0;
    const u = (h % 10000) / 10000;      // [0,1)
    return 0.958 + (u - 0.5) * 0.055;   // ~0.93 .. 0.985
  }

  function scoresActuales() {
    const out = [];
    for (let i = 0; i < revelados; i++) out.push(scoreDe(k, i));
    return out;
  }

  const PAD = { left: 14, right: 150, top: 52, bottom: 34 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const anchoUtil = W - PAD.left - PAD.right;

    // ---- barra del dataset completo ----
    ctx.fillStyle = '#a8a290';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Conjunto de desarrollo (n = ' + N_OBS + ') dividido en ' + k + ' folds', PAD.left, 20);

    const yTop = 28, hTop = 14;
    for (let i = 0; i < k; i++) {
      const x = PAD.left + (anchoUtil / k) * i;
      ctx.fillStyle = '#5CD0B3';
      ctx.fillRect(x + 1, yTop, anchoUtil / k - 2, hTop);
    }

    // ---- una fila por iteracion ----
    const areaH = H - PAD.top - PAD.bottom;
    const rowH = areaH / k;
    const barH = Math.min(22, rowH - 8);

    for (let it = 0; it < k; it++) {
      const y = PAD.top + it * rowH;
      const activo = it < revelados;

      ctx.fillStyle = activo ? '#a8a290' : 'rgba(168,162,144,0.35)';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.textAlign = 'left';

      for (let f = 0; f < k; f++) {
        const x = PAD.left + (anchoUtil / k) * f;
        const esVal = (f === it);
        if (!activo) {
          ctx.fillStyle = C_DIM;
        } else {
          ctx.fillStyle = esVal ? C_VAL : C_TRAIN;
        }
        ctx.fillRect(x + 1, y, anchoUtil / k - 2, barH);
      }

      // etiqueta y score a la derecha
      ctx.textAlign = 'left';
      ctx.font = '9.5px Fira Code, monospace';
      const xTexto = PAD.left + anchoUtil + 10;
      if (activo) {
        ctx.fillStyle = '#ece6d0';
        ctx.fillText('fold ' + (it + 1) + ':  F1 = ' + scoreDe(k, it).toFixed(3), xTexto, y + barH - 3);
      } else {
        ctx.fillStyle = 'rgba(168,162,144,0.4)';
        ctx.fillText('fold ' + (it + 1) + ':  —', xTexto, y + barH - 3);
      }
    }

    // ---- leyenda ----
    ctx.font = '9.5px Fira Code, monospace';
    ctx.textAlign = 'left';
    const yLeg = H - 14;
    ctx.fillStyle = C_TRAIN; ctx.fillRect(PAD.left, yLeg - 8, 10, 10);
    ctx.fillStyle = '#a8a290'; ctx.fillText('entrena', PAD.left + 14, yLeg);
    ctx.fillStyle = C_VAL; ctx.fillRect(PAD.left + 78, yLeg - 8, 10, 10);
    ctx.fillStyle = '#a8a290'; ctx.fillText('valida', PAD.left + 92, yLeg);

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('kfold-info');
    if (!el) return;
    const s = scoresActuales();
    if (s.length === 0) {
      el.innerHTML = '<div class="widget-label"><span>Folds ejecutados</span>' +
        '<span class="widget-value">0 / ' + k + '</span></div>' +
        '<div class="widget-label"><span>F1 promedio</span><span class="widget-value">—</span></div>';
      return;
    }
    const media = s.reduce((a, b) => a + b, 0) / s.length;
    const sd = Math.sqrt(s.reduce((a, b) => a + (b - media) ** 2, 0) / s.length);
    const completo = s.length === k;
    el.innerHTML =
      '<div class="widget-label"><span>Folds ejecutados</span>' +
      '<span class="widget-value">' + s.length + ' / ' + k + '</span></div>' +
      '<div class="widget-label"><span>F1 promedio</span>' +
      '<span class="widget-value" style="color:' + (completo ? 'var(--c-green)' : 'var(--c-yellow)') + ';">' +
      media.toFixed(4) + '</span></div>' +
      '<div class="widget-label"><span>Desviación estándar</span>' +
      '<span class="widget-value">±' + sd.toFixed(4) + '</span></div>' +
      '<div class="widget-label"><span>Modelos entrenados</span>' +
      '<span class="widget-value">' + s.length + '</span></div>';
  }

  function detener() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function siguiente() {
    if (revelados < k) { revelados++; draw(); }
    if (revelados >= k) detener();
  }

  function animar() {
    detener();
    revelados = 0;
    draw();
    timer = setInterval(siguiente, 550);
  }

  function reiniciar() {
    detener();
    revelados = 1;
    draw();
  }

  const slider = document.getElementById('kfold-slider');
  const kLabel = document.getElementById('kfold-k-value');
  if (slider) {
    slider.addEventListener('input', function () {
      k = parseInt(this.value, 10);
      if (kLabel) kLabel.textContent = k;
      reiniciar();
    });
  }
  const btnSig = document.getElementById('kfold-next');
  if (btnSig) btnSig.addEventListener('click', () => { detener(); siguiente(); });
  const btnAnim = document.getElementById('kfold-animate');
  if (btnAnim) btnAnim.addEventListener('click', animar);
  const btnReset = document.getElementById('kfold-reset');
  if (btnReset) btnReset.addEventListener('click', reiniciar);

  if (kLabel) kLabel.textContent = k;
  draw();
}
