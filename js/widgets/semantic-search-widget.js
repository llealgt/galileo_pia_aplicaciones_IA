// ============================================================
// Semantic Search Widget
// Compara el ranking por SIMILITUD SEMANTICA (coseno entre
// embeddings reales) contra el ranking por COINCIDENCIA LEXICA
// (solapamiento de palabras, tipo buscador tradicional).
// El punto: hay consultas que no comparten NI UNA palabra con el
// documento correcto, y aun asi el embedding las encuentra.
// Datos de js/widgets/embeddings-data.js
// ============================================================

function initSemanticSearchWidget() {
  const canvas = document.getElementById('semantic-search-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof EMBEDDINGS_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = EMBEDDINGS_DEMO.docs;
  const CONSULTAS = EMBEDDINGS_DEMO.consultas;
  const COLOR_TEMA = {
    'agricultura': '#83C167', 'deportes': '#FF862F',
    'machine learning': '#58C4DD', 'infraestructura': '#9A72AC', 'cocina': '#E48BB0',
  };

  let qi = 0;
  const TOP = 4;

  function ranking(puntajes) {
    return puntajes.map((s, j) => ({ j, s })).sort((a, b) => b.s - a.s).slice(0, TOP);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const c = CONSULTAS[qi];

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 10, 18);
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText('"' + c.texto + '"', 10, 38);

    const columnas = [
      { x: 10, w: 420, titulo: 'Busqueda LEXICA (palabras en comun)', datos: c.lexico, color: '#FC6255' },
      { x: 455, w: 415, titulo: 'Busqueda SEMANTICA (coseno)', datos: c.semantico, color: '#83C167' },
    ];

    columnas.forEach(col => {
      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = col.color;
      ctx.fillText(col.titulo, col.x, 64);

      const top = ranking(col.datos);
      const todoCero = top.every(o => o.s <= 1e-9);

      if (todoCero) {
        ctx.fillStyle = 'rgba(252,98,85,0.9)';
        ctx.font = 'bold 11px Fira Code, monospace';
        ctx.fillText('Ningun documento comparte palabras', col.x, 92);
        ctx.fillText('con la consulta -> 0 resultados', col.x, 108);
        ctx.fillStyle = 'rgba(168,162,144,0.7)';
        ctx.font = '9.5px Fira Code, monospace';
        ctx.fillText('un buscador por palabras clave', col.x, 132);
        ctx.fillText('no devolveria nada util aqui', col.x, 146);
        return;
      }

      top.forEach((o, k) => {
        const y = 88 + k * 54;
        const d = DOCS[o.j];
        const ancho = Math.max(2, o.s * 170);

        ctx.fillStyle = o.s > 1e-9 ? COLOR_TEMA[d.tema] : 'rgba(168,162,144,0.25)';
        ctx.fillRect(col.x, y - 10, ancho, 12);
        ctx.fillStyle = '#ece6d0';
        ctx.font = 'bold 10px Fira Code, monospace';
        ctx.fillText(o.s.toFixed(3), col.x + ancho + 6, y);

        ctx.fillStyle = o.s > 1e-9 ? 'rgba(236,230,208,0.9)' : 'rgba(168,162,144,0.45)';
        ctx.font = '9.5px Fira Code, monospace';
        envolver(d.texto, col.x, y + 15, col.w - 10, 12);

        ctx.fillStyle = 'rgba(168,162,144,0.55)';
        ctx.font = '8px Fira Code, monospace';
        ctx.fillText('[' + d.tema + ']', col.x, y + 41);
      });
    });

    // separador
    ctx.strokeStyle = 'rgba(168,162,144,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(440, 52); ctx.lineTo(440, H - 8); ctx.stroke();

    actualizarInfo(c);
  }

  function envolver(texto, x, y, maxW, lh) {
    const palabras = texto.split(' ');
    let linea = '', yy = y;
    palabras.forEach(p => {
      const prueba = linea + p + ' ';
      if (ctx.measureText(prueba).width > maxW && linea) {
        ctx.fillText(linea, x, yy); linea = p + ' '; yy += lh;
      } else linea = prueba;
    });
    if (linea) ctx.fillText(linea, x, yy);
  }

  function actualizarInfo(c) {
    const el = document.getElementById('semantic-search-info');
    if (!el) return;
    const maxLex = Math.max(...c.lexico);
    const mejorSem = ranking(c.semantico)[0];
    const temaSem = DOCS[mejorSem.j].tema;
    el.innerHTML =
      '<div class="widget-label"><span>Mejor coincidencia léxica</span>' +
      '<span class="widget-value" style="color:' + (maxLex <= 1e-9 ? 'var(--c-red)' : 'var(--c-text)') + ';">' +
      (maxLex <= 1e-9 ? 'ninguna (0.000)' : maxLex.toFixed(3)) + '</span></div>' +
      '<div class="widget-label"><span>Mejor coincidencia semántica</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' + mejorSem.s.toFixed(3) +
      ' &nbsp;[' + temaSem + ']</span></div>';
  }

  document.querySelectorAll('.sem-q-btn').forEach(b => {
    b.addEventListener('click', () => {
      qi = parseInt(b.dataset.q, 10);
      document.querySelectorAll('.sem-q-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const inicial = document.querySelector('.sem-q-btn[data-q="0"]');
  if (inicial) inicial.classList.add('active');

  draw();
}
