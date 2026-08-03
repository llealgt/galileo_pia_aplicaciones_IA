// ============================================================
// Quantization Widget
//
// Dos vistas sobre la misma idea:
//
//   proceso -> los 4 pasos del modulo sobre un vector REAL: encontrar
//              min y max, partir el rango en 2^bits niveles, asignar
//              enteros y guardar min + escala para poder reconstruir.
//              El error de reconstruccion se calcula en vivo.
//
//   recall  -> la tabla MEDIDA de que se pierde al cuantizar: recall@10
//              contra el ranking exacto en float32, sobre 42 documentos.
//
// El hallazgo que importa: int8 conserva el 100% del recall con 4x menos
// memoria, mientras que truncar a 256 dimensiones (que ocupa MAS) cae al
// 82.5%. Truncar solo funciona en modelos entrenados con perdida
// Matryoshka; este no lo esta.
// ============================================================

function initQuantizationWidget() {
  const canvas = document.getElementById('quant-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof PROD5 === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const Q = PROD5.quant;
  const V = Q.ejemplo;                 // 8 componentes reales de un embedding
  let bits = 8, vista = 'proceso';

  // Los 4 pasos, calculados de verdad sobre V
  function cuantizar() {
    const mn = Math.min.apply(null, V), mx = Math.max.apply(null, V);
    const niveles = Math.pow(2, bits) - 1;
    const escala = (mx - mn) / niveles;
    const enteros = V.map(v => Math.round((v - mn) / escala));
    const recon = enteros.map(e => e * escala + mn);
    const err = V.reduce((a, v, i) => a + Math.abs(v - recon[i]), 0) / V.length;
    return { mn: mn, mx: mx, niveles: niveles, escala: escala,
             enteros: enteros, recon: recon, err: err };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);
    if (vista === 'proceso') dibujarProceso(); else dibujarRecall();
    actualizarInfo();
  }

  function dibujarProceso() {
    const C = cuantizar();

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('8 de las 384 componentes de un embedding real', 14, 15);

    // ---- fila 1: los valores originales ----
    const x0 = 22, cw = (W - 44) / V.length, y1 = 42;
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(88,196,221,0.9)';
    ctx.fillText('float32 original', 14, y1 - 10);
    V.forEach((v, i) => {
      const x = x0 + i * cw;
      ctx.fillStyle = 'rgba(88,196,221,0.18)';
      ctx.fillRect(x, y1 - 6, cw - 6, 18);
      ctx.textAlign = 'center';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = '#ece6d0';
      ctx.fillText(v.toFixed(3), x + (cw - 6) / 2, y1 + 7);
    });

    // ---- pasos 1 y 2 ----
    const y2 = 86;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('1. min y max', 14, y2);
    ctx.fillStyle = 'rgba(236,230,208,0.9)';
    ctx.fillText('min = ' + C.mn.toFixed(4) + '     max = ' + C.mx.toFixed(4), 120, y2);

    ctx.fillStyle = '#FFFF00';
    ctx.fillText('2. partir el rango', 14, y2 + 17);
    ctx.fillStyle = 'rgba(236,230,208,0.9)';
    ctx.fillText('en ' + (C.niveles + 1) + ' niveles  →  escala = (max − min) / ' +
      C.niveles + ' = ' + C.escala.toFixed(6), 120, y2 + 17);

    // ---- fila 3: los enteros ----
    const y3 = 140;
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('3. asignar enteros', 14, y3 - 10);
    V.forEach((v, i) => {
      const x = x0 + i * cw;
      ctx.fillStyle = 'rgba(255,255,0,0.16)';
      ctx.fillRect(x, y3 - 6, cw - 6, 18);
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillStyle = '#FFFF00';
      ctx.fillText(String(C.enteros[i]), x + (cw - 6) / 2, y3 + 7);
    });

    // ---- fila 4: reconstruido y error ----
    const y4 = 190;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#83C167';
    ctx.fillText('4. reconstruir  (entero × escala + min)', 14, y4 - 10);
    V.forEach((v, i) => {
      const x = x0 + i * cw;
      const e = Math.abs(v - C.recon[i]);
      const rel = Math.min(1, e / Math.max(1e-9, C.escala));
      ctx.fillStyle = 'rgba(131,193,103,' + (0.10 + 0.25 * rel).toFixed(2) + ')';
      ctx.fillRect(x, y4 - 6, cw - 6, 18);
      ctx.textAlign = 'center';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(236,230,208,0.92)';
      ctx.fillText(C.recon[i].toFixed(3), x + (cw - 6) / 2, y4 + 7);
      // error debajo
      ctx.font = '8px Fira Code, monospace';
      ctx.fillStyle = e > C.escala * 0.4 ? 'rgba(252,98,85,0.9)' : 'rgba(168,162,144,0.55)';
      ctx.fillText('±' + e.toFixed(4), x + (cw - 6) / 2, y4 + 20);
    });

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('Se guardan solo los enteros + min + escala. Cada componente pasa de ' +
      '32 bits a ' + bits + '.', 14, H - 12);
  }

  function dibujarRecall() {
    const F = Q.filas;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('recall@10 medido contra el ranking exacto en float32  ·  ' +
      Q.n_docs + ' documentos de ' + Q.dims + ' dimensiones', 14, 15);

    const y0 = 44, fila = 24, bx = 250, bw = 300;
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText('esquema', 14, y0 - 10);
    ctx.fillText('recall@10', bx, y0 - 10);
    ctx.textAlign = 'right';
    ctx.fillText('bytes/vector', W - 74, y0 - 10);
    ctx.fillText('ahorro', W - 12, y0 - 10);

    const base = F[0].bytes;
    F.forEach((f, i) => {
      const y = y0 + i * fila;
      const trunc = f.nombre.indexOf('primeras') === 0;
      ctx.textAlign = 'left';
      ctx.font = (i === 0 ? 'bold ' : '') + '10.5px Fira Code, monospace';
      ctx.fillStyle = i === 0 ? '#ece6d0' : trunc ? 'rgba(154,114,172,0.95)' : 'rgba(236,230,208,0.9)';
      ctx.fillText(f.nombre, 14, y + 4);

      // barra de recall
      const w = f.recall * bw;
      ctx.fillStyle = 'rgba(168,162,144,0.10)';
      ctx.fillRect(bx, y - 7, bw, 14);
      ctx.fillStyle = f.recall >= 0.99 ? '#83C167' : f.recall >= 0.9 ? '#FFFF00'
        : f.recall >= 0.75 ? '#FF862F' : '#FC6255';
      ctx.fillRect(bx, y - 7, w, 14);
      ctx.textAlign = 'left';
      ctx.font = 'bold 9.5px Fira Code, monospace';
      ctx.fillStyle = '#1b1b2f';
      if (w > 42) ctx.fillText((100 * f.recall).toFixed(1) + '%', bx + 6, y + 4);
      else { ctx.fillStyle = '#ece6d0'; ctx.fillText((100 * f.recall).toFixed(1) + '%', bx + w + 6, y + 4); }

      ctx.textAlign = 'right';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(236,230,208,0.85)';
      ctx.fillText(f.bytes + ' B', W - 74, y + 4);
      ctx.fillStyle = i === 0 ? 'rgba(168,162,144,0.5)' : '#5CD0B3';
      ctx.fillText(i === 0 ? '—' : (base / f.bytes).toFixed(1) + '×', W - 12, y + 4);
    });

    ctx.textAlign = 'left';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(154,114,172,0.9)';
    ctx.fillText('en morado: truncar dimensiones. Pierde MÁS que cuantizar y ocupa más — ' +
      'este modelo no se entrenó para truncarse.', 14, H - 12);
  }

  // 1e6 vectores de B bytes = B MB exactos
  const fmtMB = b => b >= 1000 ? (b / 1000).toFixed(1) + ' GB' : b + ' MB';

  function actualizarInfo() {
    const el = document.getElementById('quant-info');
    if (!el) return;
    if (vista === 'proceso') {
      const C = cuantizar();
      const bytesOrig = Q.dims * 4;
      const bytesQ = Math.ceil(Q.dims * bits / 8);
      el.innerHTML =
        '<div class="widget-label"><span>Niveles disponibles</span>' +
        '<span class="widget-value">' + (C.niveles + 1) + '  (' + bits +
        (bits === 1 ? ' bit' : ' bits') + ')</span></div>' +
        '<div class="widget-label"><span>Error medio de reconstrucción</span>' +
        '<span class="widget-value" style="color:' +
        (C.err < 0.002 ? 'var(--c-green)' : C.err < 0.02 ? 'var(--c-yellow)' : 'var(--c-red)') +
        ';">' + C.err.toFixed(5) + '</span></div>' +
        '<div class="widget-label"><span>Un vector de ' + Q.dims + ' dims ocupa</span>' +
        '<span class="widget-value">' + bytesQ + ' B  <span style="color:var(--c-text-dim);">(era ' +
        bytesOrig + ' B)</span></span></div>' +
        // un millon de vectores de B bytes son exactamente B megabytes
        '<div class="widget-label"><span>Un millón de vectores</span>' +
        '<span class="widget-value" style="color:var(--c-teal);">' +
        fmtMB(bytesQ) + '  <span style="color:var(--c-text-dim);">(eran ' +
        fmtMB(bytesOrig) + ')</span></span></div>';
    } else {
      const f = Q.filas.find(x => x.nombre === 'int' + bits) || Q.filas[0];
      const base = Q.filas[0].bytes;
      el.innerHTML =
        '<div class="widget-label"><span>Esquema seleccionado</span>' +
        '<span class="widget-value">' + f.nombre + '</span></div>' +
        '<div class="widget-label"><span>Recall@10 conservado</span>' +
        '<span class="widget-value" style="color:' +
        (f.recall >= 0.99 ? 'var(--c-green)' : f.recall >= 0.9 ? 'var(--c-yellow)' : 'var(--c-red)') +
        ';">' + (100 * f.recall).toFixed(1) + '%</span></div>' +
        '<div class="widget-label"><span>Memoria por vector</span>' +
        '<span class="widget-value">' + f.bytes + ' B</span></div>' +
        '<div class="widget-label"><span>Ahorro</span>' +
        '<span class="widget-value" style="color:var(--c-teal);">' +
        (base / f.bytes).toFixed(1) + '×</span></div>';
    }
  }

  document.querySelectorAll('.quant-vista-btn').forEach(b => {
    b.addEventListener('click', () => {
      vista = b.dataset.vista;
      document.querySelectorAll('.quant-vista-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const sB = document.getElementById('quant-bits'), lB = document.getElementById('quant-bits-value');
  if (sB) sB.addEventListener('input', function () {
    bits = [1, 2, 4, 8, 16][parseInt(this.value, 10)];
    if (lB) lB.textContent = bits;
    draw();
  });

  const ini = document.querySelector('.quant-vista-btn[data-vista="proceso"]');
  if (ini) ini.classList.add('active');
  if (lB) lB.textContent = bits;
  draw();
}
