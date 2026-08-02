// ============================================================
// Batch Normalization — Resultados Experimentales
// Datos REALES tomados del notebook de referencia:
// https://github.com/llealgt/Batch_Normalization
// (Batch_Normalization_Lesson.ipynb, accuracy sobre el test set
// completo de MNIST).
//
// El experimento esta controlado: misma arquitectura, mismos datos
// y — clave — los MISMOS pesos iniciales para la red con y sin
// batch norm. Lo unico que cambia es la presencia de BN.
// ============================================================

function initBatchNormExperimentsWidget() {
  const canvas = document.getElementById('bn-exp-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const C_SIN = '#58C4DD';
  const C_CON = '#FF862F';
  const AZAR = 0.10;          // accuracy de adivinar siempre lo mismo en MNIST

  const VISTAS = {
    buenos: {
      titulo: 'Pesos iniciales razonables — 50,000 iteraciones',
      nota: 'Con ReLU y learning rate alto, la red SIN batch norm colapsa al nivel del azar.',
      filas: [
        { etiqueta: 'ReLU     lr=0.01', sin: 0.9718, con: 0.9800 },
        { etiqueta: 'ReLU     lr=1',    sin: 0.1957, con: 0.9825 },
        { etiqueta: 'ReLU     lr=2',    sin: 0.1010, con: 0.9822 },
        { etiqueta: 'sigmoid  lr=0.01', sin: 0.8107, con: 0.9739 },
        { etiqueta: 'sigmoid  lr=1',    sin: 0.9775, con: 0.9796 },
        { etiqueta: 'sigmoid  lr=2',    sin: 0.9756, con: 0.9786 },
      ],
    },
    malos: {
      titulo: 'Pesos iniciales MALOS (desviación estándar 5) — 50,000 iteraciones',
      nota: 'Sin batch norm la red casi nunca despega; con BN aprende pese a la mala inicialización.',
      filas: [
        { etiqueta: 'ReLU     lr=0.01', sin: 0.0980, con: 0.8130 },
        { etiqueta: 'ReLU     lr=1',    sin: 0.0980, con: 0.7613 },
        { etiqueta: 'ReLU     lr=2',    sin: 0.0980, con: 0.9072 },
        { etiqueta: 'sigmoid  lr=0.01', sin: 0.2723, con: 0.8507 },
        { etiqueta: 'sigmoid  lr=1',    sin: 0.8906, con: 0.9540 },
        { etiqueta: 'sigmoid  lr=2',    sin: 0.8997, con: 0.9570 },
      ],
    },
    cortas: {
      titulo: 'Solo 2,000 iteraciones (pesos razonables) — velocidad de convergencia',
      nota: 'Con el mismo presupuesto de iteraciones, la red con BN ya llegó mucho más lejos.',
      filas: [
        { etiqueta: 'ReLU     lr=0.01', sin: 0.8167, con: 0.9501 },
        { etiqueta: 'sigmoid  lr=1',    sin: 0.8987, con: 0.9318 },
        { etiqueta: 'sigmoid  lr=2',    sin: 0.9438, con: 0.9477 },
      ],
    },
  };

  let vista = 'buenos';

  const PAD = { left: 132, right: 24, top: 52, bottom: 46 };

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const v = VISTAS[vista];
    const filas = v.filas;

    ctx.fillStyle = '#ece6d0';
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(v.titulo, 10, 18);

    ctx.fillStyle = '#a8a290';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillText('accuracy en el test set de MNIST', 10, 33);

    const pw = W - PAD.left - PAD.right;
    const areaH = H - PAD.top - PAD.bottom;
    const rowH = areaH / filas.length;
    const barH = Math.min(13, rowH / 2 - 5);
    const tx = a => PAD.left + a * pw;

    // rejilla vertical
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach(a => {
      ctx.strokeStyle = 'rgba(168,162,144,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx(a), PAD.top - 6);
      ctx.lineTo(tx(a), PAD.top + areaH);
      ctx.stroke();
      ctx.fillStyle = 'rgba(168,162,144,0.7)';
      ctx.fillText((a * 100).toFixed(0) + '%', tx(a), PAD.top + areaH + 15);
    });

    // linea del azar (10%): explica por que tantas barras se quedan ahi
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = 'rgba(252,98,85,0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx(AZAR), PAD.top - 6);
    ctx.lineTo(tx(AZAR), PAD.top + areaH);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#FC6255';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('azar (10%)', tx(AZAR) + 4, PAD.top - 10);

    filas.forEach((f, i) => {
      const yBase = PAD.top + i * rowH + rowH / 2;

      ctx.fillStyle = '#a8a290';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(f.etiqueta, PAD.left - 10, yBase + 3);

      const ySin = yBase - barH - 1;
      const yCon = yBase + 1;

      ctx.fillStyle = C_SIN;
      ctx.fillRect(PAD.left, ySin, Math.max(2, f.sin * pw), barH);
      ctx.fillStyle = C_CON;
      ctx.fillRect(PAD.left, yCon, Math.max(2, f.con * pw), barH);

      // Etiqueta fuera de la barra si hay espacio; si la barra llega casi al 100%
      // se dibuja dentro, para que el texto no se salga del canvas.
      ctx.font = '9px Fira Code, monospace';
      function etiqueta(valor, y) {
        const txt = (valor * 100).toFixed(1) + '%';
        const fin = tx(valor);
        if (fin + 42 > W - 4) {
          ctx.textAlign = 'right';
          ctx.fillStyle = '#1b1b2f';
          ctx.fillText(txt, fin - 5, y + barH - 2);
        } else {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#ece6d0';
          ctx.fillText(txt, fin + 5, y + barH - 2);
        }
      }
      etiqueta(f.sin, ySin);
      etiqueta(f.con, yCon);
    });

    // leyenda
    ctx.font = '9.5px Fira Code, monospace';
    ctx.textAlign = 'left';
    const yLeg = H - 12;
    ctx.fillStyle = C_SIN; ctx.fillRect(PAD.left, yLeg - 9, 11, 11);
    ctx.fillStyle = '#a8a290'; ctx.fillText('sin batch norm', PAD.left + 16, yLeg);
    ctx.fillStyle = C_CON; ctx.fillRect(PAD.left + 135, yLeg - 9, 11, 11);
    ctx.fillStyle = '#a8a290'; ctx.fillText('con batch norm', PAD.left + 151, yLeg);

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('bn-exp-info');
    if (!el) return;
    const filas = VISTAS[vista].filas;
    const mSin = filas.reduce((a, f) => a + f.sin, 0) / filas.length;
    const mCon = filas.reduce((a, f) => a + f.con, 0) / filas.length;
    const peor = filas.reduce((a, f) => (f.con - f.sin > a.con - a.sin ? f : a), filas[0]);
    el.innerHTML =
      '<div class="widget-label"><span>Promedio sin BN</span>' +
      '<span class="widget-value" style="color:' + C_SIN + ';">' + (mSin * 100).toFixed(1) + '%</span></div>' +
      '<div class="widget-label"><span>Promedio con BN</span>' +
      '<span class="widget-value" style="color:' + C_CON + ';">' + (mCon * 100).toFixed(1) + '%</span></div>' +
      '<div class="widget-label"><span>Diferencia promedio</span>' +
      '<span class="widget-value" style="color:var(--c-green);">+' + ((mCon - mSin) * 100).toFixed(1) + ' pts</span></div>' +
      '<div class="widget-label"><span>Mayor rescate</span>' +
      '<span class="widget-value" style="font-size:0.85em;">' + peor.etiqueta.replace(/\s+/g, ' ') + '</span></div>';
  }

  document.querySelectorAll('.bn-exp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      vista = btn.dataset.vista;
      document.querySelectorAll('.bn-exp-btn').forEach(b => b.classList.toggle('active', b === btn));
      draw();
    });
  });

  const inicial = document.querySelector('.bn-exp-btn[data-vista="buenos"]');
  if (inicial) inicial.classList.add('active');
  draw();
}
