// ============================================================
// Retrieval Metrics Widget
//
// Calcula precision@k, recall@k, average precision y reciprocal rank
// sobre un ranking REAL del mismo corpus de la unidad, con un juicio de
// relevancia explicito (IR_DEMO.relevantes_q0).
//
// Se puede cambiar de ranking (BM25 / semantica / RRF) para ver el punto
// que importa: las metricas no juzgan documentos sueltos, juzgan el
// ORDEN completo. El mismo corpus y la misma consulta dan AP muy
// distintos segun quien haya ordenado.
// ============================================================

function initRetrievalMetricsWidget() {
  const canvas = document.getElementById('metrics-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof IR_DEMO === 'undefined' || typeof irTokenizar === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = IR_DEMO.docs;
  const N = DOCS.length;
  const REL = new Set(IR_DEMO.relevantes_q0);
  const TOTAL_REL = REL.size;

  const TOKS = DOCS.map(irTokenizar);
  const LEN = TOKS.map(t => t.length);
  const AVGDL = LEN.reduce((a, b) => a + b, 0) / N;
  const DF = {};
  TOKS.forEach(t => new Set(t).forEach(w => { DF[w] = (DF[w] || 0) + 1; }));
  const idfBM25 = w => Math.log(1 + (N - (DF[w] || 0) + 0.5) / ((DF[w] || 0) + 0.5));

  const QI = 0;                       // la consulta con ground truth
  let k = 5, fuente = 'bm25';

  function bm25v() {
    const q = [...new Set(irTokenizar(IR_DEMO.consultas[QI].texto))];
    return TOKS.map((t, i) => {
      let s = 0;
      q.forEach(w => {
        const f = t.reduce((a, x) => a + (x === w ? 1 : 0), 0);
        if (f) s += idfBM25(w) * (f * 2.5) / (f + 1.5 * (0.25 + 0.75 * LEN[i] / AVGDL));
      });
      return s;
    });
  }

  function ordenDe(v) {
    return v.map((s, i) => [i, s]).sort((a, b) => b[1] - a[1]).map(o => o[0]);
  }

  function ranking() {
    const bm = bm25v(), sem = IR_DEMO.consultas[QI].sim;
    if (fuente === 'bm25') return { orden: ordenDe(bm), val: bm, fmt: v => v.toFixed(2) };
    if (fuente === 'sem') return { orden: ordenDe(sem), val: sem, fmt: v => v.toFixed(3) };
    // RRF con los valores estandar de la diapositiva (k=10, β=0.5)
    const rk = new Array(N), rs = new Array(N);
    ordenDe(bm).forEach((i, p) => { rk[i] = p + 1; });
    ordenDe(sem).forEach((i, p) => { rs[i] = p + 1; });
    const f = DOCS.map((_, i) => 0.5 / (10 + rs[i]) + 0.5 / (10 + rk[i]));
    return { orden: ordenDe(f), val: f, fmt: v => v.toFixed(4) };
  }

  // metricas acumuladas posicion por posicion
  function metricas(orden) {
    let enc = 0;
    const filas = orden.map((i, pos) => {
      const rel = REL.has(i);
      if (rel) enc++;
      return { i: i, pos: pos + 1, rel: rel, p: enc / (pos + 1), r: enc / TOTAL_REL, acum: enc };
    });
    // AP@k: promedio de precision@pos SOLO en las posiciones relevantes
    const dentro = filas.slice(0, k);
    const rels = dentro.filter(f => f.rel);
    const ap = rels.length ? rels.reduce((a, f) => a + f.p, 0) / TOTAL_REL : 0;
    const primera = filas.find(f => f.rel);
    const rr = primera && primera.pos <= k ? 1 / primera.pos : 0;
    return { filas: filas, ap: ap, rr: rr, rels: rels, primera: primera };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const R = ranking();
    const M = metricas(R.orden);

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 16);
    ctx.font = 'bold 12.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(IR_DEMO.consultas[QI].texto, 14, 34);
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    ctx.fillText('ground truth: ' + TOTAL_REL + ' documentos relevantes en toda la base',
      14, 51);

    // cabeceras de columnas
    const y0 = 72, fila = 20;
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('P@pos', W - 152, y0 - 8);
    ctx.fillText('R@pos', W - 88, y0 - 8);
    ctx.fillText('puntaje', W - 14, y0 - 8);

    M.filas.forEach((f, pos) => {
      const y = y0 + pos * fila;
      const dentro = pos < k;

      if (dentro) {
        ctx.fillStyle = 'rgba(255,255,0,0.06)';
        ctx.fillRect(8, y - 11, W - 16, fila - 2);
      }

      // marca de relevancia
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillStyle = f.rel ? '#83C167' : 'rgba(168,162,144,0.35)';
      ctx.fillText(f.rel ? '●' : '○', 14, y + 3);

      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = dentro ? 'rgba(236,230,208,0.85)' : 'rgba(168,162,144,0.4)';
      ctx.fillText(String(f.pos).padStart(2) + '.', 30, y + 3);

      ctx.fillStyle = dentro ? (f.rel ? '#ece6d0' : 'rgba(236,230,208,0.7)')
        : 'rgba(168,162,144,0.4)';
      let t = 'D' + (f.i + 1) + '  ' + DOCS[f.i];
      const maxw = W - 240;
      while (ctx.measureText(t).width > maxw && t.length > 6) t = t.slice(0, -2);
      if (t !== 'D' + (f.i + 1) + '  ' + DOCS[f.i]) t += '…';
      ctx.fillText(t, 58, y + 3);

      // precision y recall acumulados hasta esta posicion
      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = dentro ? (f.rel ? '#FFFF00' : 'rgba(168,162,144,0.6)')
        : 'rgba(168,162,144,0.28)';
      ctx.fillText((100 * f.p).toFixed(0) + '%', W - 152, y + 3);
      ctx.fillStyle = dentro ? 'rgba(131,193,103,0.9)' : 'rgba(168,162,144,0.28)';
      ctx.fillText((100 * f.r).toFixed(0) + '%', W - 88, y + 3);
      ctx.fillStyle = dentro ? 'rgba(236,230,208,0.65)' : 'rgba(168,162,144,0.28)';
      ctx.fillText(R.fmt(R.val[f.i]), W - 14, y + 3);
    });

    // linea de corte en k
    const yc = y0 + k * fila - 11;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, yc); ctx.lineTo(W - 8, yc); ctx.stroke();
    ctx.restore();
    ctx.font = 'bold 10px Fira Code, monospace';
    ctx.textAlign = 'left';
    const etq = 'k = ' + k;
    const we = ctx.measureText(etq).width;
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(8, yc - 7, we + 12, 14);
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(etq, 14, yc + 3);

    // desglose del AP: solo suman las posiciones relevantes
    const yA = y0 + N * fila + 12;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    const partes = M.rels.map(f => f.p.toFixed(2)).join(' + ') || '0';
    ctx.fillText('AP@' + k + ' = (' + partes + ') / ' + TOTAL_REL + ' = ' + M.ap.toFixed(3) +
      '     ·     RR = ' + (M.primera && M.primera.pos <= k
        ? '1/' + M.primera.pos + ' = ' + M.rr.toFixed(2) : '0 (ningún relevante en el top-k)'),
      14, yA + 3);

    actualizarInfo(M);
  }

  function actualizarInfo(M) {
    const el = document.getElementById('metrics-info');
    if (!el) return;
    const f = M.filas[k - 1];
    el.innerHTML =
      '<div class="widget-label"><span>Precisión@' + k + '</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      (100 * f.p).toFixed(0) + '%</span></div>' +
      '<div class="widget-label"><span>Recall@' + k + '</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' +
      (100 * f.r).toFixed(0) + '%</span></div>' +
      '<div class="widget-label"><span>AP@' + k + '</span>' +
      '<span class="widget-value">' + M.ap.toFixed(3) + '</span></div>' +
      '<div class="widget-label"><span>Reciprocal Rank</span>' +
      '<span class="widget-value">' + M.rr.toFixed(2) + '</span></div>';
  }

  document.querySelectorAll('.metrics-src-btn').forEach(bt => {
    bt.addEventListener('click', () => {
      fuente = bt.dataset.src;
      document.querySelectorAll('.metrics-src-btn').forEach(x => x.classList.toggle('active', x === bt));
      draw();
    });
  });
  const sK = document.getElementById('metrics-k'), lK = document.getElementById('metrics-k-value');
  if (sK) sK.addEventListener('input', function () {
    k = parseInt(this.value, 10);
    if (lK) lK.textContent = k;
    draw();
  });

  const ini = document.querySelector('.metrics-src-btn[data-src="bm25"]');
  if (ini) ini.classList.add('active');
  if (lK) lK.textContent = k;
  draw();
}
