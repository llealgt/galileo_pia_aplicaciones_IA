// ============================================================
// RAG Retriever Widget
// Muestra el compromiso central del retriever: cuantos documentos
// meter en el contexto (top-k). Con k chico se pierden documentos
// necesarios; con k grande entra ruido y se desperdicia ventana de
// contexto. Los puntajes son cosenos REALES (ver rag-data.js).
// ============================================================

function initRagRetrieverWidget() {
  const canvas = document.getElementById('rag-retriever-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof RAG_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = RAG_DEMO.docs;
  const N = DOCS.length;
  let qi = 0;
  let k = 3;

  function ranking() {
    const c = RAG_DEMO.consultas[qi];
    return DOCS.map((d, i) => ({ i, texto: d.texto, tipo: d.tipo,
                                 sim: c.sim[i], util: c.utiles.indexOf(i) >= 0 }))
      .sort((a, b) => b.sim - a.sim);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const c = RAG_DEMO.consultas[qi];
    const r = ranking();

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 18);
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(c.texto, 14, 38);

    ctx.font = '10.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    ctx.fillText('Base de conocimiento ordenada por similitud — los primeros k entran al prompt',
      14, 58);

    const fila = 24, y0 = 74, bx = 92, bw = 150;
    r.forEach((d, pos) => {
      const y = y0 + pos * fila;
      const dentro = pos < k;

      // marco del contexto
      if (dentro) {
        ctx.fillStyle = 'rgba(255,255,0,0.07)';
        ctx.fillRect(8, y - 13, W - 16, fila - 2);
      }

      ctx.textAlign = 'right';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.35)';
      ctx.fillText(d.sim.toFixed(3), bx - 8, y + 4);

      // barra de similitud
      const ancho = Math.max(2, Math.max(0, d.sim) * bw);
      ctx.fillStyle = dentro
        ? (d.util ? '#83C167' : '#FC6255')
        : (d.util ? 'rgba(131,193,103,0.3)' : 'rgba(168,162,144,0.18)');
      ctx.fillRect(bx, y - 8, ancho, 13);

      // texto del documento
      ctx.textAlign = 'left';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.35)';
      let t = d.texto;
      while (ctx.measureText(t).width > W - (bx + bw + 130) && t.length > 8) t = t.slice(0, -2);
      if (t !== d.texto) t += '…';
      ctx.fillText(t, bx + bw + 12, y + 4);

      // etiqueta util / ruido
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px Fira Code, monospace';
      if (dentro) {
        ctx.fillStyle = d.util ? '#83C167' : '#FC6255';
        ctx.fillText(d.util ? 'ÚTIL' : 'ruido', W - 14, y + 4);
      } else if (d.util) {
        ctx.fillStyle = 'rgba(252,98,85,0.9)';
        ctx.fillText('¡PERDIDO!', W - 14, y + 4);
      }
    });

    // linea de corte
    const yCorte = y0 + k * fila - 13;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(8, yCorte); ctx.lineTo(W - 8, yCorte); ctx.stroke();
    ctx.restore();
    // La etiqueta va sobre la linea con su propio fondo, para que no se
    // encime con el puntaje de la fila que queda justo en el corte.
    ctx.font = 'bold 10px Fira Code, monospace';
    ctx.textAlign = 'left';
    const etq = 'corte  k = ' + k;
    const we = ctx.measureText(etq).width;
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(8, yCorte - 7, we + 12, 14);
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(etq, 14, yCorte + 3);

    actualizarInfo(r);
  }

  function actualizarInfo(r) {
    const el = document.getElementById('rag-retriever-info');
    if (!el) return;
    const dentro = r.slice(0, k);
    const utilesTot = r.filter(d => d.util).length;
    const utilesDentro = dentro.filter(d => d.util).length;
    const ruido = dentro.length - utilesDentro;
    const perdidos = utilesTot - utilesDentro;

    el.innerHTML =
      '<div class="widget-label"><span>Útiles recuperados</span>' +
      '<span class="widget-value" style="color:' +
      (utilesDentro === utilesTot ? 'var(--c-green)' : 'var(--c-orange)') + ';">' +
      utilesDentro + ' / ' + utilesTot + '</span></div>' +
      '<div class="widget-label"><span>Documentos perdidos</span>' +
      '<span class="widget-value" style="color:' + (perdidos ? 'var(--c-red)' : 'var(--c-green)') + ';">' +
      perdidos + '</span></div>' +
      '<div class="widget-label"><span>Ruido en el contexto</span>' +
      '<span class="widget-value" style="color:' + (ruido > 2 ? 'var(--c-red)' : 'var(--c-text)') + ';">' +
      ruido + ' de ' + k + '</span></div>' +
      '<div class="widget-label"><span>Precisión del contexto</span>' +
      '<span class="widget-value">' + (100 * utilesDentro / Math.max(1, k)).toFixed(0) + '%</span></div>';
  }

  document.querySelectorAll('.rag-q-btn').forEach(b => {
    b.addEventListener('click', () => {
      qi = parseInt(b.dataset.q, 10);
      document.querySelectorAll('.rag-q-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const sK = document.getElementById('rag-retriever-k');
  const lK = document.getElementById('rag-retriever-k-value');
  if (sK) sK.addEventListener('input', function () {
    k = parseInt(this.value, 10);
    if (lK) lK.textContent = k;
    draw();
  });

  const ini = document.querySelector('.rag-q-btn[data-q="0"]');
  if (ini) ini.classList.add('active');
  if (lK) lK.textContent = k;
  draw();
}
