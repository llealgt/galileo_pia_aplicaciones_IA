// ============================================================
// ColBERT / MaxSim Widget
//
// Muestra la matriz de similitud token-a-token entre una consulta y un
// documento, y como ColBERT la resume: cada token de la CONSULTA se
// queda con su mejor pareja en el documento (MaxSim) y se suman esos
// maximos.
//
// La matriz es REAL: son embeddings de token de
// paraphrase-multilingual-MiniLM-L12-v2. Aviso honesto: NO es un ColBERT
// entrenado para late interaction; el mecanismo que se ilustra es el
// mismo y los numeros son medidos, pero un ColBERT de verdad entrena
// esos vectores especificamente para esta tarea.
//
// Lo que hay que hacer notar en clase: "comer" encuentra "comida" con
// 0.858 aunque no comparten ni una letra de raiz. Eso es exactamente lo
// que la busqueda por palabras clave no puede hacer.
// ============================================================

function initColbertWidget() {
  const canvas = document.getElementById('colbert-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof PROD_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const D = PROD_DEMO.colbert;
  const TQ = D.tok_q, TD = D.tok_d, M = D.sim;
  const nq = TQ.length, nd = TD.length;

  let paso = 0;          // 0 = solo matriz; 1..nq = revelando MaxSim; nq+1 = total
  let hover = null;

  // maximo por fila y en que columna
  const MAXJ = M.map(f => f.indexOf(Math.max.apply(null, f)));
  const MAXV = M.map(f => Math.max.apply(null, f));

  function color(v) {
    // azul para negativo, amarillo/verde para alto
    if (v < 0) return 'rgba(88,196,221,' + Math.min(0.55, -v * 1.2).toFixed(2) + ')';
    if (v < 0.5) return 'rgba(168,162,144,' + (0.06 + v * 0.3).toFixed(2) + ')';
    const t = (v - 0.5) / 0.5;
    return 'rgba(' + Math.round(131 + 124 * t) + ',' + Math.round(193 + 62 * t) + ',' +
      Math.round(103 - 103 * t) + ',' + (0.30 + 0.55 * t).toFixed(2) + ')';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const x0 = 92, y0 = 70;   // deja aire para las etiquetas en diagonal
    const cw = Math.min(46, (W - x0 - 120) / nd), ch = 22;

    // encabezado
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 15);
    ctx.font = 'bold 11.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(D.consulta, 66, 15);
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Documento', 14, 31);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = 'rgba(236,230,208,0.85)';
    ctx.fillText(D.documento, 74, 31);

    // etiquetas de columna (tokens del documento), en diagonal si no caben
    ctx.font = '9px Fira Code, monospace';
    TD.forEach((t, j) => {
      ctx.save();
      ctx.translate(x0 + j * cw + cw / 2, y0 - 6);
      ctx.rotate(-Math.PI / 5);
      ctx.textAlign = 'left';
      const usado = paso > 0 && MAXJ.slice(0, paso).indexOf(j) >= 0;
      ctx.fillStyle = usado ? '#FFFF00' : 'rgba(168,162,144,0.8)';
      ctx.fillText(t, 0, 0);
      ctx.restore();
    });

    // celdas
    for (let i = 0; i < nq; i++) {
      for (let j = 0; j < nd; j++) {
        const x = x0 + j * cw, y = y0 + i * ch;
        const esMax = (j === MAXJ[i]);
        const rev = paso > i;
        ctx.fillStyle = color(M[i][j]);
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        if (rev && esMax) {
          ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
        }
        ctx.font = '8.5px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = rev && esMax ? '#FFFF00' : 'rgba(236,230,208,0.75)';
        ctx.fillText(M[i][j].toFixed(2), x + cw / 2, y + ch / 2 + 3);
      }
      // etiqueta de fila
      ctx.textAlign = 'right';
      ctx.font = (paso > i ? 'bold ' : '') + '10px Fira Code, monospace';
      ctx.fillStyle = paso > i ? '#FFFF00' : 'rgba(236,230,208,0.85)';
      ctx.fillText(TQ[i], x0 - 8, y0 + i * ch + ch / 2 + 3);

      // MaxSim de la fila, a la derecha
      if (paso > i) {
        ctx.textAlign = 'left';
        ctx.font = 'bold 10px Fira Code, monospace';
        ctx.fillStyle = '#83C167';
        ctx.fillText(MAXV[i].toFixed(3), x0 + nd * cw + 10, y0 + i * ch + ch / 2 + 3);
      }
    }

    // total
    const yT = y0 + nq * ch + 16;
    if (paso > nq) {
      const suma = MAXV.reduce((a, b) => a + b, 0);
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('MaxSim = ' + MAXV.map(v => v.toFixed(2)).join(' + ') +
        ' = ' + suma.toFixed(3), 14, yT + 4);
    } else if (paso > 0) {
      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.85)';
      ctx.fillText('Cada token de la consulta se queda con su mejor pareja en el documento…',
        14, yT + 4);
    } else {
      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.85)';
      ctx.fillText('Similitud de CADA token de la consulta contra CADA token del documento',
        14, yT + 4);
    }

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('colbert-info');
    if (!el) return;
    const suma = MAXV.reduce((a, b) => a + b, 0);
    // El par mas interesante: alto puntaje entre tokens DISTINTOS y con
    // contenido. Se excluyen las palabras funcionales porque se emparejan
    // con cualquier cosa (ruido real del metodo, no un hallazgo).
    const FUNC = new Set(('la el los las de del en y a un una que para por con ' +
      'al se su sus lo le es son o u ni mas muy sin sobre entre como todo el').split(' '));
    let mejorDist = -1, iD = 0;
    MAXV.forEach((v, i) => {
      const a = TQ[i].toLowerCase(), b = TD[MAXJ[i]].toLowerCase();
      if (a !== b && !FUNC.has(a) && !FUNC.has(b) && v > mejorDist) { mejorDist = v; iD = i; }
    });
    el.innerHTML =
      '<div class="widget-label"><span>Vectores comparados</span>' +
      '<span class="widget-value">' + nq + ' × ' + nd + ' = ' + (nq * nd) + '</span></div>' +
      '<div class="widget-label"><span>MaxSim total</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      (paso > nq ? suma.toFixed(3) : '—') + '</span></div>' +
      '<div class="widget-label"><span>Mejor pareja de palabras distintas</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' +
      TQ[iD] + ' ↔ ' + TD[MAXJ[iD]] + '  ' + mejorDist.toFixed(3) + '</span></div>' +
      '<div class="widget-label"><span>Almacenamiento</span>' +
      '<span class="widget-value" style="color:var(--c-orange);">' + nd +
      ' vectores para 1 documento</span></div>';
  }

  const bN = document.getElementById('colbert-next');
  if (bN) bN.addEventListener('click', () => { if (paso <= nq) { paso++; draw(); } });
  const bA = document.getElementById('colbert-all');
  if (bA) bA.addEventListener('click', () => { paso = nq + 1; draw(); });
  const bR = document.getElementById('colbert-reset');
  if (bR) bR.addEventListener('click', () => { paso = 0; draw(); });

  draw();
}
