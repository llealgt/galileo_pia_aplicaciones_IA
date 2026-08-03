// ============================================================
// Transfer Learning Widget
//
// Dos vistas sobre la misma unidad:
//
//   matriz     -> la decision clasica: que estrategia conviene segun
//                 cuantos datos tienes y que tan parecido es tu dominio
//                 al de ImageNet. Se mueven los dos ejes y se ve caer
//                 la recomendacion en uno de los cuatro cuadrantes.
//
//   resultados -> lo que se midio de verdad en los notebooks 13 y 14,
//                 con 245 imagenes de hormigas y abejas:
//                   desde cero          67.3% (Keras) / 70.6% (PyTorch)
//                   feature extraction  94.8%         / 94.1%
//                   fine-tuning         94.1%         / 94.1%
//                   BatchNorm mal            —        / 88.2%
//                 Feature extraction entreno 1,281 parametros en Keras
//                 y 2,562 en PyTorch: menos que la CNN desde cero, que
//                 entreno mas de 93,000.
// ============================================================

function initTransferWidget() {
  const canvas = document.getElementById('transfer-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let datos = 1;        // 0 = cientos, 1 = miles, 2 = decenas de miles, 3 = millones
  let similitud = 2;    // 0 = muy distinto ... 3 = muy parecido
  let vista = 'matriz';

  const NDATOS = ['cientos', 'miles', 'decenas de miles', 'millones'];
  const NSIM = ['muy distinto', 'distinto', 'parecido', 'muy parecido'];

  // Medido en los notebooks 13 (Keras) y 14 (PyTorch)
  const MEDIDO = [
    { n: 'CNN desde cero',       k: 0.673, p: 0.706, pk: 93377,  pp: 93506,   c: '#0072B2' },
    { n: 'Feature extraction',   k: 0.948, p: 0.941, pk: 1281,   pp: 2562,    c: '#009E73' },
    { n: 'Fine-tuning',          k: 0.941, p: 0.941, pk: 1840897, pp: 1683906, c: '#E69F00' },
    { n: 'BatchNorm sin congelar', k: null, p: 0.882, pk: null,  pp: 2562,    c: '#D55E00' },
  ];

  // La recomendacion clasica del transfer learning
  function recomendacion() {
    const pocos = datos <= 1;
    const parecido = similitud >= 2;
    if (pocos && parecido)
      return ['Feature extraction', '#009E73',
              'Congela todo y entrena solo la cabeza. Con pocos datos, tocar el backbone sobreajusta.'];
    if (pocos && !parecido)
      return ['Feature extraction desde capas intermedias', '#56B4E9',
              'Las capas profundas están especializadas en ImageNet y no te sirven. Usa la salida de una capa más temprana.'];
    if (!pocos && parecido)
      return ['Fine-tuning de las capas profundas', '#E69F00',
              'Ya tienes datos para reajustar sin sobreajustar. Learning rate chico y solo la parte profunda.'];
    return ['Fine-tuning completo, o entrenar desde cero', '#D55E00',
            'Dominio lejano y muchos datos: hasta las capas tempranas conviene reajustarlas. Aun así, arrancar de pesos preentrenados suele converger más rápido.'];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);
    if (vista === 'matriz') dibujarMatriz(); else dibujarResultados();
    actualizarInfo();
  }

  function dibujarMatriz() {
    const x0 = 118, y0 = 34, cw = 132, ch = 52;

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    ctx.fillText('cuántos datos etiquetados tienes  →', x0, y0 - 12);
    // centrada en la rejilla y corta: si es larga invade la recomendacion de abajo
    ctx.save();
    ctx.translate(20, y0 + 2 * ch);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('parecido a ImageNet  →', 0, 0);
    ctx.restore();

    // etiquetas de columna
    ctx.font = '9.5px Fira Code, monospace';
    NDATOS.forEach((t, j) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = (j === datos) ? '#FFFF00' : 'rgba(168,162,144,0.75)';
      ctx.fillText(t, x0 + j * cw + cw / 2, y0 - 2);
    });

    // celdas: 4x4 agrupadas en los 4 cuadrantes de la recomendacion
    for (let i = 3; i >= 0; i--) {           // i = similitud (arriba = mas parecido)
      const fy = y0 + (3 - i) * ch;
      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = (i === similitud) ? '#FFFF00' : 'rgba(168,162,144,0.75)';
      ctx.fillText(NSIM[i], x0 - 10, fy + ch / 2 + 3);

      for (let j = 0; j < 4; j++) {
        const pocos = j <= 1, parecido = i >= 2;
        const col = (pocos && parecido) ? '#009E73' : (pocos && !parecido) ? '#56B4E9'
          : (!pocos && parecido) ? '#E69F00' : '#D55E00';
        const sel = (i === similitud && j === datos);
        ctx.fillStyle = col;
        ctx.globalAlpha = sel ? 0.55 : 0.16;
        ctx.fillRect(x0 + j * cw + 2, fy + 2, cw - 4, ch - 4);
        ctx.globalAlpha = 1;
        if (sel) {
          ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.5;
          ctx.strokeRect(x0 + j * cw + 2, fy + 2, cw - 4, ch - 4);
        }
      }
    }

    // etiquetas de los cuadrantes, en el centro de cada bloque 2x2
    const bloques = [
      [0, 0, 'feature\nextraction', '#009E73'],
      [2, 0, 'fine-tuning\nprofundo', '#E69F00'],
      [0, 2, 'capas\nintermedias', '#56B4E9'],
      [2, 2, 'fine-tuning\ncompleto', '#D55E00'],
    ];
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Fira Code, monospace';
    bloques.forEach(([cx, cy, txt, col]) => {
      const X = x0 + cx * cw + cw, Y = y0 + cy * ch + ch;
      const lineas = txt.split('\n');
      const ancho = Math.max.apply(null, lineas.map(l => ctx.measureText(l).width)) + 14;
      ctx.fillStyle = '#1b1b2f';
      ctx.globalAlpha = 0.82;
      ctx.fillRect(X - ancho / 2, Y - 10, ancho, 12 * lineas.length + 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      lineas.forEach((l, k) => ctx.fillText(l, X, Y + 2 + k * 12));
    });

    // la recomendacion, abajo
    const [nom, col, det] = recomendacion();
    const yR = y0 + 4 * ch + 20;
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.fillStyle = col;
    ctx.fillText(nom, 22, yR);
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(236,230,208,0.85)';
    let t = det, linea = '';
    const palabras = det.split(' '); const lineas = [];
    palabras.forEach(p => {
      if (ctx.measureText(linea + ' ' + p).width > W - 50) { lineas.push(linea); linea = p; }
      else linea = linea ? linea + ' ' + p : p;
    });
    if (linea) lineas.push(linea);
    lineas.slice(0, 2).forEach((l, k) => ctx.fillText(l, 22, yR + 17 + k * 14));
  }

  function dibujarResultados() {
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Medido en los notebooks 13 y 14 — 245 imágenes de entrenamiento, MobileNetV2',
      14, 15);

    const y0 = 44, fila = 40, bx = 240, bw = 300;
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText('accuracy en validación', bx, y0 - 12);
    ctx.textAlign = 'right';
    ctx.fillText('parámetros entrenados', W - 14, y0 - 12);

    MEDIDO.forEach((m, i) => {
      const y = y0 + i * fila;
      ctx.textAlign = 'left';
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = m.k === null ? 'rgba(213,94,0,0.95)' : '#ece6d0';
      ctx.fillText(m.n, 14, y + 4);

      // dos barras: Keras arriba, PyTorch abajo
      [[m.k, 'Keras', -8], [m.p, 'PyTorch', 6]].forEach(([v, fw, dy]) => {
        if (v === null) return;
        ctx.fillStyle = 'rgba(168,162,144,0.10)';
        ctx.fillRect(bx, y + dy - 5, bw, 11);
        ctx.fillStyle = m.c;
        ctx.globalAlpha = fw === 'Keras' ? 0.9 : 0.55;
        ctx.fillRect(bx, y + dy - 5, v * bw, 11);
        ctx.globalAlpha = 1;
        ctx.font = '8.5px Fira Code, monospace';
        ctx.fillStyle = 'rgba(236,230,208,0.9)';
        ctx.fillText((100 * v).toFixed(1) + '%  ' + fw, bx + v * bw + 6, y + dy + 3);
      });

      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.8)';
      const pk = m.pk === null ? '—' : m.pk.toLocaleString('es');
      ctx.fillText(pk + ' / ' + m.pp.toLocaleString('es'), W - 14, y + 4);
    });

    // linea del azar
    const xa = bx + 0.5 * bw;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(168,162,144,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xa, y0 - 8); ctx.lineTo(xa, y0 + 4 * fila - 22); ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('azar', xa, y0 - 12);

    ctx.textAlign = 'left';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(131,193,103,0.9)';
    ctx.fillText('Feature extraction entrenó MENOS parámetros que la CNN desde cero — y acertó 27 puntos más.',
      14, H - 12);
  }

  function actualizarInfo() {
    const el = document.getElementById('transfer-info');
    if (!el) return;
    if (vista === 'matriz') {
      const [nom, col] = recomendacion();
      el.innerHTML =
        '<div class="widget-label"><span>Datos etiquetados</span>' +
        '<span class="widget-value" style="color:var(--c-yellow);">' + NDATOS[datos] + '</span></div>' +
        '<div class="widget-label"><span>Parecido a ImageNet</span>' +
        '<span class="widget-value" style="color:var(--c-yellow);">' + NSIM[similitud] + '</span></div>' +
        '<div class="widget-label"><span>Estrategia recomendada</span>' +
        '<span class="widget-value" style="color:' + col + ';">' + nom + '</span></div>' +
        '<div class="widget-label"><span>Learning rate</span>' +
        '<span class="widget-value">' +
        (nom.indexOf('ine-tuning') >= 0 ? 'bajo (10–100× menor)' : 'normal (solo la cabeza)') +
        '</span></div>';
    } else {
      el.innerHTML =
        '<div class="widget-label"><span>Mejor sin transfer learning</span>' +
        '<span class="widget-value" style="color:var(--c-red);">70.6%</span></div>' +
        '<div class="widget-label"><span>Mejor con transfer learning</span>' +
        '<span class="widget-value" style="color:var(--c-green);">94.8%</span></div>' +
        '<div class="widget-label"><span>Parámetros que hizo falta entrenar</span>' +
        '<span class="widget-value" style="color:var(--c-teal);">1,281</span></div>' +
        '<div class="widget-label"><span>Costo de no congelar BatchNorm</span>' +
        '<span class="widget-value" style="color:var(--c-orange);">−5.9 puntos</span></div>';
    }
  }

  document.querySelectorAll('.transfer-vista-btn').forEach(b => {
    b.addEventListener('click', () => {
      vista = b.dataset.vista;
      document.querySelectorAll('.transfer-vista-btn').forEach(x => x.classList.toggle('active', x === b));
      const p = document.getElementById('transfer-params');
      if (p) p.style.opacity = (vista === 'matriz') ? '1' : '0.25';
      draw();
    });
  });
  const sD = document.getElementById('transfer-datos'), lD = document.getElementById('transfer-datos-value');
  if (sD) sD.addEventListener('input', function () {
    datos = parseInt(this.value, 10); if (lD) lD.textContent = NDATOS[datos]; draw();
  });
  const sS = document.getElementById('transfer-sim'), lS = document.getElementById('transfer-sim-value');
  if (sS) sS.addEventListener('input', function () {
    similitud = parseInt(this.value, 10); if (lS) lS.textContent = NSIM[similitud]; draw();
  });

  const ini = document.querySelector('.transfer-vista-btn[data-vista="matriz"]');
  if (ini) ini.classList.add('active');
  if (lD) lD.textContent = NDATOS[datos];
  if (lS) lS.textContent = NSIM[similitud];
  draw();
}
