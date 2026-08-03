// ============================================================
// Embedding Space Widget
// Mapa 2D (PCA) de 20 frases reales codificadas con un modelo de
// sentence embeddings. Al elegir una frase se resaltan sus vecinos
// mas cercanos por coseno REAL en el espacio de 384 dimensiones
// (no por distancia en el dibujo, que es solo una proyeccion).
// Los datos vienen de js/widgets/embeddings-data.js
// ============================================================

function initEmbeddingSpaceWidget() {
  const canvas = document.getElementById('embedding-space-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof EMBEDDINGS_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = EMBEDDINGS_DEMO.docs;
  const SIM = EMBEDDINGS_DEMO.sim;

  const COLOR_TEMA = {
    'agricultura': '#83C167',
    'deportes': '#FF862F',
    'machine learning': '#58C4DD',
    'infraestructura': '#9A72AC',
    'cocina': '#E48BB0',
  };
  const TEMAS = Object.keys(COLOR_TEMA);

  let seleccionado = 8;     // "La red neuronal sobreajusta con pocos datos"
  let mostrarTemas = true;
  let K = 3;

  const P = { x0: 30, x1: 470, y0: 46, y1: 300 };
  const tx = x => P.x0 + x * (P.x1 - P.x0);
  const ty = y => P.y1 - y * (P.y1 - P.y0);

  function vecinos(i, k) {
    return SIM[i]
      .map((s, j) => ({ j, s }))
      .filter(o => o.j !== i)
      .sort((a, b) => b.s - a.s)
      .slice(0, k);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Proyeccion 2D (PCA) de 20 frases en 384 dimensiones', 8, 18);
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillText('las 2 componentes explican solo el ' +
      (EMBEDDINGS_DEMO.varianza_pca * 100).toFixed(0) + '% de la varianza', 8, 32);

    // marco
    ctx.strokeStyle = 'rgba(168,162,144,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(P.x0 - 12, P.y0 - 8, (P.x1 - P.x0) + 26, (P.y1 - P.y0) + 22);

    const vs = vecinos(seleccionado, K);
    const esVecino = {};
    vs.forEach(v => { esVecino[v.j] = v.s; });

    // lineas a los vecinos
    vs.forEach(v => {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(tx(DOCS[seleccionado].x), ty(DOCS[seleccionado].y));
      ctx.lineTo(tx(DOCS[v.j].x), ty(DOCS[v.j].y));
      ctx.stroke();
    });

    // puntos
    DOCS.forEach((d, i) => {
      const x = tx(d.x), y = ty(d.y);
      const sel = i === seleccionado;
      const vec = esVecino[i] !== undefined;
      ctx.beginPath();
      ctx.arc(x, y, sel ? 7 : (vec ? 6 : 4.5), 0, Math.PI * 2);
      ctx.fillStyle = mostrarTemas ? COLOR_TEMA[d.tema] : 'rgba(168,162,144,0.75)';
      ctx.globalAlpha = (sel || vec || !mostrarTemas) ? 1 : 0.85;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (sel) {
        ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (vec) {
        ctx.strokeStyle = 'rgba(255,255,0,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    });

    // leyenda de temas
    if (mostrarTemas) {
      ctx.font = '8.5px Fira Code, monospace';
      ctx.textAlign = 'left';
      let lx = P.x0 - 12;
      TEMAS.forEach(t => {
        ctx.fillStyle = COLOR_TEMA[t];
        ctx.fillRect(lx, H - 16, 8, 8);
        ctx.fillStyle = 'rgba(168,162,144,0.9)';
        ctx.fillText(t, lx + 11, H - 9);
        lx += 11 + ctx.measureText(t).width + 14;
      });
    }

    // ---------- panel derecho ----------
    const DX = 500;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Frase seleccionada', DX, 18);

    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 10.5px Fira Code, monospace';
    envolver(DOCS[seleccionado].texto, DX, 36, W - DX - 12, 14);

    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText('Vecinos mas cercanos (coseno real)', DX, 86);

    vs.forEach((v, k) => {
      const y = 108 + k * 42;
      // barra de similitud
      const ancho = Math.max(2, v.s * 150);
      ctx.fillStyle = COLOR_TEMA[DOCS[v.j].tema];
      ctx.fillRect(DX, y - 9, ancho, 11);
      ctx.fillStyle = '#ece6d0';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillText(v.s.toFixed(3), DX + ancho + 6, y);
      ctx.fillStyle = 'rgba(236,230,208,0.85)';
      ctx.font = '9.5px Fira Code, monospace';
      envolver(DOCS[v.j].texto, DX, y + 14, W - DX - 12, 12);
    });
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

  // ---------- controles ----------
  const select = document.getElementById('embedding-space-select');
  if (select && !select.options.length) {
    DOCS.forEach((d, i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = d.texto.length > 46 ? d.texto.slice(0, 46) + '…' : d.texto;
      select.appendChild(o);
    });
    select.value = seleccionado;
    select.addEventListener('change', () => { seleccionado = parseInt(select.value, 10); draw(); });
  }
  document.querySelectorAll('.emb-k-btn').forEach(b => {
    b.addEventListener('click', () => {
      K = parseInt(b.dataset.k, 10);
      document.querySelectorAll('.emb-k-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const btnTemas = document.getElementById('embedding-space-temas');
  if (btnTemas) btnTemas.addEventListener('click', () => {
    mostrarTemas = !mostrarTemas;
    btnTemas.classList.toggle('active', mostrarTemas);
    draw();
  });

  const kInicial = document.querySelector('.emb-k-btn[data-k="3"]');
  if (kInicial) kInicial.classList.add('active');
  if (btnTemas) btnTemas.classList.add('active');

  // clic sobre el mapa: selecciona el punto mas cercano
  canvas.addEventListener('click', ev => {
    const r = canvas.getBoundingClientRect();
    const mx = (ev.clientX - r.left) * (W / r.width);
    const my = (ev.clientY - r.top) * (H / r.height);
    let mejor = -1, dmin = 1e9;
    DOCS.forEach((d, i) => {
      const dx = tx(d.x) - mx, dy = ty(d.y) - my;
      const dd = dx * dx + dy * dy;
      if (dd < dmin) { dmin = dd; mejor = i; }
    });
    if (mejor >= 0 && dmin < 900) {
      seleccionado = mejor;
      if (select) select.value = mejor;
      draw();
    }
  });

  draw();
}
