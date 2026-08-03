// ============================================================
// Reranking Widget
//
// El patron de dos etapas, sobre el corpus de Vancouver que ya se uso en
// la unidad de RAG: primero el bi-encoder trae los top-k candidatos
// (rapido, aproximado), despues el cross-encoder reordena SOLO esos.
//
// Todos los puntajes son reales:
//   bi    -> cosenos de paraphrase-multilingual-MiniLM-L12-v2
//   cross -> logits de BAAI/bge-reranker-v2-m3
//
// Resultado medido: los 4 documentos utiles pasan de las posiciones
// 1, 2, 4 y 10 a ocupar exactamente 1, 2, 3 y 4. El del concierto —la
// causa real de que suban los hoteles— sube del ULTIMO lugar al cuarto.
// AP@4 pasa de 0.688 a 1.000.
//
// El slider de candidatos existe para mostrar el limite del patron: el
// reranker solo puede reordenar lo que la primera etapa le paso. Si el
// documento clave no entra en los candidatos, no hay reranking que lo
// salve.
// ============================================================

function initRerankWidget() {
  const canvas = document.getElementById('rerank-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof PROD_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const R = PROD_DEMO.rerank;
  const DOCS = R.docs, N = DOCS.length;
  const UTIL = new Set(R.utiles);
  const BI = R.bi, CR = R.cross;

  let cand = 10;        // cuantos candidatos pasa la primera etapa
  let etapa = 2;        // 1 = solo bi-encoder, 2 = ya reordenado
  let final = 4;        // cuantos se le mandan al LLM

  const ordBi = DOCS.map((_, i) => i).sort((a, b) => BI[b] - BI[a]);

  function ordenFinal() {
    const pasan = ordBi.slice(0, cand);
    return pasan.slice().sort((a, b) => CR[b] - CR[a]);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 15);
    ctx.font = 'bold 11.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(R.consulta, 66, 15);

    const colX = [14, 470], colW = 396;
    const y0 = 58, fila = 24;

    // titulos
    const tit = [
      ['1. Bi-encoder — rápido, sobre TODA la base', '#58C4DD'],
      ['2. Cross-encoder — caro, solo sobre ' + cand + ' candidatos', '#FF862F'],
    ];
    tit.forEach((t, c) => {
      if (c === 1 && etapa < 2) return;
      ctx.textAlign = 'left';
      ctx.font = 'bold 10.5px Fira Code, monospace';
      ctx.fillStyle = t[1];
      ctx.fillText(t[0], colX[c], y0 - 22);
      ctx.strokeStyle = 'rgba(168,162,144,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(colX[c], y0 - 14); ctx.lineTo(colX[c] + colW, y0 - 14); ctx.stroke();
    });

    const orden2 = ordenFinal();
    const yDe = [{}, {}];

    function pinta(c, pos, i, valor, dentroCand, dentroFinal) {
      const y = y0 + pos * fila;
      yDe[c][i] = y;
      // fondo: amarillo si va al LLM, tenue si solo es candidato
      if (c === 0 && dentroCand) { ctx.fillStyle = 'rgba(88,196,221,0.07)'; ctx.fillRect(colX[c], y - 11, colW, fila - 3); }
      if (c === 1 && dentroFinal) { ctx.fillStyle = 'rgba(255,255,0,0.09)'; ctx.fillRect(colX[c], y - 11, colW, fila - 3); }

      // marca de utilidad (ground truth)
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillStyle = UTIL.has(i) ? '#83C167' : 'rgba(168,162,144,0.3)';
      ctx.fillText(UTIL.has(i) ? '●' : '○', colX[c] + 6, y + 3);

      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.75)';
      ctx.fillText((pos + 1) + '.', colX[c] + 20, y + 3);

      ctx.fillStyle = (c === 0 ? dentroCand : dentroFinal) ? '#ece6d0' : 'rgba(168,162,144,0.38)';
      let t = 'D' + (i + 1) + ' ' + DOCS[i];
      const maxw = colW - 96;
      while (ctx.measureText(t).width > maxw && t.length > 6) t = t.slice(0, -2);
      if (t !== 'D' + (i + 1) + ' ' + DOCS[i]) t += '…';
      ctx.fillText(t, colX[c] + 40, y + 3);

      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(236,230,208,0.7)';
      ctx.fillText(valor, colX[c] + colW - 6, y + 3);
    }

    ordBi.forEach((i, pos) => pinta(0, pos, i, BI[i].toFixed(3), pos < cand, false));
    if (etapa >= 2) orden2.forEach((i, pos) => pinta(1, pos, i, CR[i].toFixed(1), true, pos < final));

    // flechas de los candidatos que cruzan
    if (etapa >= 2) {
      ctx.lineWidth = 1;
      ordBi.slice(0, cand).forEach(i => {
        if (yDe[1][i] === undefined) return;
        ctx.strokeStyle = UTIL.has(i) ? 'rgba(131,193,103,0.45)' : 'rgba(168,162,144,0.18)';
        ctx.beginPath();
        ctx.moveTo(colX[0] + colW, yDe[0][i]);
        ctx.bezierCurveTo(colX[0] + colW + 20, yDe[0][i], colX[1] - 20, yDe[1][i], colX[1], yDe[1][i]);
        ctx.stroke();
      });
    }

    // linea de corte de candidatos
    const yc = y0 + cand * fila - 11;
    if (cand < N) {
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#58C4DD'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(colX[0], yc); ctx.lineTo(colX[0] + colW, yc); ctx.stroke();
      ctx.restore();
    }
    // linea de corte de lo que va al LLM
    if (etapa >= 2 && final < cand) {
      const yf = y0 + final * fila - 11;
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(colX[1], yf); ctx.lineTo(colX[1] + colW, yf); ctx.stroke();
      ctx.restore();
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1b1b2f';
      ctx.fillRect(colX[1] + 2, yf - 7, 92, 13);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('→ al LLM (' + final + ')', colX[1] + 6, yf + 3);
    }

    actualizarInfo(orden2);
  }

  function met(orden, k) {
    let enc = 0; const ps = [];
    orden.slice(0, k).forEach((i, pos) => { if (UTIL.has(i)) { enc++; ps.push(enc / (pos + 1)); } });
    return { p: enc / k, r: enc / UTIL.size, ap: ps.length ? ps.reduce((a, b) => a + b, 0) / UTIL.size : 0 };
  }

  function actualizarInfo(orden2) {
    const el = document.getElementById('rerank-info');
    if (!el) return;
    const mb = met(ordBi, final);
    const mc = met(orden2, final);
    const usa = etapa >= 2 ? mc : mb;
    // cuantos utiles quedaron fuera de los candidatos: el limite del patron
    const perdidos = [...UTIL].filter(i => ordBi.indexOf(i) >= cand).length;

    el.innerHTML =
      '<div class="widget-label"><span>Precisión@' + final + '</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      (100 * usa.p).toFixed(0) + '%' +
      (etapa >= 2 ? ' <span style="color:var(--c-text-dim);">(antes ' + (100 * mb.p).toFixed(0) + '%)</span>' : '') +
      '</span></div>' +
      '<div class="widget-label"><span>AP@' + final + '</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' + usa.ap.toFixed(3) +
      (etapa >= 2 ? ' <span style="color:var(--c-text-dim);">(antes ' + mb.ap.toFixed(3) + ')</span>' : '') +
      '</span></div>' +
      '<div class="widget-label"><span>Pasadas por el cross-encoder</span>' +
      '<span class="widget-value">' + (etapa >= 2 ? cand : 0) + ' de ' + N + '</span></div>' +
      '<div class="widget-label"><span>Útiles que no llegaron a la 2ª etapa</span>' +
      '<span class="widget-value" style="color:' +
      (perdidos ? 'var(--c-red)' : 'var(--c-green)') + ';">' + perdidos + '</span></div>';
  }

  document.querySelectorAll('.rerank-etapa-btn').forEach(b => {
    b.addEventListener('click', () => {
      etapa = parseInt(b.dataset.etapa, 10);
      document.querySelectorAll('.rerank-etapa-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const s1 = document.getElementById('rerank-cand'), l1 = document.getElementById('rerank-cand-value');
  if (s1) s1.addEventListener('input', function () {
    cand = parseInt(this.value, 10);
    if (final > cand) final = cand;
    if (l1) l1.textContent = cand;
    draw();
  });
  const s2 = document.getElementById('rerank-final'), l2 = document.getElementById('rerank-final-value');
  if (s2) s2.addEventListener('input', function () {
    final = Math.min(parseInt(this.value, 10), cand);
    if (l2) l2.textContent = final;
    draw();
  });

  const ini = document.querySelector('.rerank-etapa-btn[data-etapa="2"]');
  if (ini) ini.classList.add('active');
  if (l1) l1.textContent = cand;
  if (l2) l2.textContent = final;
  draw();
}
