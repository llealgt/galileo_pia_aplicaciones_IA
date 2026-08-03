// ============================================================
// Reciprocal Rank Fusion Widget
//
// Fusiona la lista de keyword search (BM25, calculado en vivo) con la de
// busqueda semantica (cosenos reales) usando RRF:
//
//    score(d) = β · 1/(k + rank_sem(d))  +  (1−β) · 1/(k + rank_kw(d))
//
// Los dos sliders son los dos parametros que de verdad se tocan en
// produccion:
//   k  -> que tan dominante es un primer lugar (k=0: 10x entre el 1o y
//         el 10o; k=50: apenas 1.2x)
//   β  -> cuanto pesa la semantica frente a las palabras exactas
//
// El punto de la diapositiva: RRF solo mira POSICIONES, no puntajes, y
// por eso puede mezclar dos rankings cuyas escalas no son comparables
// (BM25 va de 0 a ~4.4; el coseno de -1 a 1).
// ============================================================

function initRrfWidget() {
  const canvas = document.getElementById('rrf-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof IR_DEMO === 'undefined' || typeof irTokenizar === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = IR_DEMO.docs;
  const N = DOCS.length;
  const TOKS = DOCS.map(irTokenizar);
  const LEN = TOKS.map(t => t.length);
  const AVGDL = LEN.reduce((a, b) => a + b, 0) / N;
  const DF = {};
  TOKS.forEach(t => new Set(t).forEach(w => { DF[w] = (DF[w] || 0) + 1; }));
  const idfBM25 = w => Math.log(1 + (N - (DF[w] || 0) + 0.5) / ((DF[w] || 0) + 0.5));

  let qi = 0, k = 10, beta = 0.5;

  function bm25(qi2) {
    const q = [...new Set(irTokenizar(IR_DEMO.consultas[qi2].texto))];
    return TOKS.map((t, i) => {
      let s = 0;
      q.forEach(w => {
        const f = t.reduce((a, x) => a + (x === w ? 1 : 0), 0);
        if (f) s += idfBM25(w) * (f * 2.5) / (f + 1.5 * (0.25 + 0.75 * LEN[i] / AVGDL));
      });
      return s;
    });
  }

  // rangos 1..N a partir de un vector de puntajes
  function rangos(v) {
    const orden = v.map((s, i) => [i, s]).sort((a, b) => b[1] - a[1]);
    const r = new Array(N);
    orden.forEach(([i], pos) => { r[i] = pos + 1; });
    return { r: r, orden: orden.map(o => o[0]) };
  }

  function estado() {
    const bm = bm25(qi);
    const sem = IR_DEMO.consultas[qi].sim;
    const KW = rangos(bm), SE = rangos(sem);
    const fus = DOCS.map((_, i) => ({
      i: i,
      kw: KW.r[i], se: SE.r[i],
      pKw: (1 - beta) / (k + KW.r[i]),
      pSe: beta / (k + SE.r[i]),
      bm: bm[i], cos: sem[i],
    }));
    fus.forEach(f => { f.rrf = f.pKw + f.pSe; });
    const orden = fus.slice().sort((a, b) => b.rrf - a.rrf);
    return { bm: bm, sem: sem, KW: KW, SE: SE, fus: fus, orden: orden };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const S = estado();
    const MOSTRAR = 8;                 // top-8 de cada lista, para que quepa
    const colX = [16, 306, 596], colW = 268;
    const y0 = 82, fila = 23;   // y0 deja aire para consulta + titulos de columna

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 16, 16);
    ctx.font = 'bold 12.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(IR_DEMO.consultas[qi].texto, 16, 34);

    const tit = [
      ['Keyword (BM25)', '#58C4DD', 'puntaje 0 – 4.4'],
      ['Semántica (coseno)', '#83C167', 'puntaje −1 – 1'],
      ['Fusionada (RRF)', '#FFFF00', 'solo usa posiciones'],
    ];
    tit.forEach((t, c) => {
      ctx.textAlign = 'left';
      ctx.font = 'bold 11.5px Fira Code, monospace';
      ctx.fillStyle = t[1];
      ctx.fillText(t[0], colX[c], y0 - 30);
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.6)';
      ctx.fillText(t[2], colX[c], y0 - 18);
      ctx.strokeStyle = 'rgba(168,162,144,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(colX[c], y0 - 13); ctx.lineTo(colX[c] + colW, y0 - 13); ctx.stroke();
    });

    // color estable por documento, para seguirlo entre columnas
    const PAL = ['#58C4DD', '#83C167', '#FF862F', '#9A72AC', '#E48BB0', '#5CD0B3',
      '#FFFF00', '#FC6255', '#8FA3C8', '#C8A05C', '#7FBF7F', '#B57FBF'];

    // posicion en pantalla de cada documento por columna, para las lineas
    const yDe = [{}, {}, {}];

    function fila1(c, pos, docIdx, txtIzq, txtDer) {
      const y = y0 + pos * fila;
      yDe[c][docIdx] = y;
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fillRect(colX[c], y - 11, colW, fila - 4);
      // franja de color = identidad del documento
      ctx.fillStyle = PAL[docIdx % PAL.length];
      ctx.fillRect(colX[c], y - 11, 4, fila - 4);

      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.8)';
      ctx.fillText((pos + 1) + '.', colX[c] + 10, y + 3);

      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = '#ece6d0';
      let t = txtIzq;
      const maxw = colW - 92;
      while (ctx.measureText(t).width > maxw && t.length > 5) t = t.slice(0, -2);
      if (t !== txtIzq) t += '…';
      ctx.fillText(t, colX[c] + 28, y + 3);

      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(236,230,208,0.7)';
      ctx.fillText(txtDer, colX[c] + colW - 6, y + 3);
    }

    const corto = i => 'D' + (i + 1) + ' ' + DOCS[i].slice(0, 30);

    S.KW.orden.slice(0, MOSTRAR).forEach((i, pos) =>
      fila1(0, pos, i, corto(i), S.bm[i].toFixed(2)));
    S.SE.orden.slice(0, MOSTRAR).forEach((i, pos) =>
      fila1(1, pos, i, corto(i), S.sem[i].toFixed(2)));
    S.orden.slice(0, MOSTRAR).forEach((f, pos) =>
      fila1(2, pos, f.i, corto(f.i), f.rrf.toFixed(4)));

    // lineas que siguen a cada documento de una columna a la siguiente
    ctx.lineWidth = 1;
    [[0, 1], [1, 2]].forEach(([a, b2]) => {
      Object.keys(yDe[a]).forEach(kk => {
        const i = +kk;
        if (yDe[b2][i] === undefined) return;
        ctx.strokeStyle = PAL[i % PAL.length] + '55';
        ctx.beginPath();
        ctx.moveTo(colX[a] + colW, yDe[a][i]);
        ctx.bezierCurveTo(colX[a] + colW + 14, yDe[a][i], colX[b2] - 14, yDe[b2][i],
          colX[b2], yDe[b2][i]);
        ctx.stroke();
      });
    });

    // el calculo explicito del documento que quedo primero en la fusion
    const g = S.orden[0];
    const yc = y0 + MOSTRAR * fila + 14;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('Ganador  D' + (g.i + 1) + ':   ' +
      beta.toFixed(2) + '·1/(' + k + '+' + g.se + ')  +  ' +
      (1 - beta).toFixed(2) + '·1/(' + k + '+' + g.kw + ')  =  ' +
      g.pSe.toFixed(4) + ' + ' + g.pKw.toFixed(4) + ' = ' + g.rrf.toFixed(4),
      16, yc + 3);

    actualizarInfo(S);
  }

  function actualizarInfo(S) {
    const el = document.getElementById('rrf-info');
    if (!el) return;
    // relacion entre el 1o y el 10o: el efecto de k, tal cual la diapositiva
    const rel = (1 / (k + 1)) / (1 / (k + 10));
    const t5 = S.orden.slice(0, 5).map(f => f.i);
    const kw5 = new Set(S.KW.orden.slice(0, 5));
    const se5 = new Set(S.SE.orden.slice(0, 5));
    // cuantos del top-5 fusionado los aporto UNA sola de las dos listas:
    // es la complementariedad entre keyword y semantica, medida
    let soloUna = 0;
    t5.forEach(i => { if (kw5.has(i) !== se5.has(i)) soloUna++; });
    let coinciden = 0;
    kw5.forEach(i => { if (se5.has(i)) coinciden++; });

    el.innerHTML =
      '<div class="widget-label"><span>Ventaja del 1º sobre el 10º</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' + rel.toFixed(1) + '×</span></div>' +
      '<div class="widget-label"><span>Top-5 en común entre las dos listas</span>' +
      '<span class="widget-value" style="color:' +
      (coinciden < 3 ? 'var(--c-orange)' : 'var(--c-text)') + ';">' + coinciden + ' de 5</span></div>' +
      '<div class="widget-label"><span>Top-5 fusionado</span>' +
      '<span class="widget-value" style="color:var(--c-green); font-size:0.86em;">' +
      t5.map(i => 'D' + (i + 1)).join(' ') + '</span></div>' +
      '<div class="widget-label"><span>Los aportó una sola lista</span>' +
      '<span class="widget-value" style="color:' +
      (soloUna ? 'var(--c-orange)' : 'var(--c-text-dim)') + ';">' + soloUna + ' de 5</span></div>';
  }

  document.querySelectorAll('.rrf-q-btn').forEach(bt => {
    bt.addEventListener('click', () => {
      qi = parseInt(bt.dataset.q, 10);
      document.querySelectorAll('.rrf-q-btn').forEach(x => x.classList.toggle('active', x === bt));
      draw();
    });
  });
  const sK = document.getElementById('rrf-k'), lK = document.getElementById('rrf-k-value');
  if (sK) sK.addEventListener('input', function () {
    k = parseInt(this.value, 10);
    if (lK) lK.textContent = k;
    draw();
  });
  const sB = document.getElementById('rrf-beta'), lB = document.getElementById('rrf-beta-value');
  if (sB) sB.addEventListener('input', function () {
    beta = parseInt(this.value, 10) / 100;
    if (lB) lB.textContent = beta.toFixed(2);
    draw();
  });

  const iq = document.querySelector('.rrf-q-btn[data-q="0"]');
  if (iq) iq.classList.add('active');
  if (lK) lK.textContent = k;
  if (lB) lB.textContent = beta.toFixed(2);
  draw();
}
