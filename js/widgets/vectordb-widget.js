// ============================================================
// Vector Database Widget
// Simula una base de datos vectorial: cada punto es un
// "documento" embebido en 2D. Al hacer click se coloca una
// consulta (query) y se resaltan sus k vecinos más cercanos
// (nearest neighbors) por distancia euclidiana.
// ============================================================

function initVectorDBWidget() {
  const canvas = document.getElementById('vectordb-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const CATS = [
    { name: 'Recetas',    color: '#FF862F' },
    { name: 'Deportes',   color: '#58C4DD' },
    { name: 'Tecnologia', color: '#83C167' },
    { name: 'Finanzas',   color: '#E48BB0' }
  ];

  // Documentos simulados: agrupados en "nubes" por categoria semantica
  const CENTERS = [
    { x: 0.22, y: 0.28, cat: 0 },
    { x: 0.78, y: 0.22, cat: 1 },
    { x: 0.30, y: 0.75, cat: 2 },
    { x: 0.75, y: 0.72, cat: 3 }
  ];

  let docs = [];
  function seedDocs() {
    docs = [];
    let id = 1;
    CENTERS.forEach(c => {
      for (let i = 0; i < 9; i++) {
        docs.push({
          id: id++,
          x: Math.min(0.96, Math.max(0.04, c.x + (Math.random() - 0.5) * 0.22)),
          y: Math.min(0.94, Math.max(0.06, c.y + (Math.random() - 0.5) * 0.22)),
          cat: c.cat
        });
      }
    });
  }
  seedDocs();

  let query = null; // {x, y} in normalized [0,1] coords
  let k = 5;

  const pad = 20;
  const pw = W - pad * 2, ph = H - pad * 2;
  function tx(v) { return pad + v * pw; }
  function ty(v) { return pad + v * ph; }

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const gx = tx(i / 10), gy = ty(i / 10);
      ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
    }

    let ranked = [];
    if (query) {
      ranked = docs
        .map(d => ({ d, dist: dist(d, query) }))
        .sort((a, b) => a.dist - b.dist);
      const top = ranked.slice(0, k);

      // Connecting lines to nearest neighbors
      top.forEach((r, idx) => {
        ctx.strokeStyle = `rgba(255,255,0,${0.75 - idx * 0.08})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(tx(query.x), ty(query.y));
        ctx.lineTo(tx(r.d.x), ty(r.d.y));
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // Documents
    const topIds = new Set(query ? ranked.slice(0, k).map(r => r.d.id) : []);
    docs.forEach(d => {
      const isTop = topIds.has(d.id);
      const r = isTop ? 8 : 5.5;
      ctx.beginPath();
      ctx.arc(tx(d.x), ty(d.y), r, 0, Math.PI * 2);
      ctx.fillStyle = CATS[d.cat].color;
      ctx.globalAlpha = query ? (isTop ? 1 : 0.35) : 0.9;
      ctx.fill();
      if (isTop) {
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFF00';
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });

    // Query point
    if (query) {
      const qx = tx(query.x), qy = ty(query.y);
      ctx.fillStyle = '#ece6d0';
      ctx.beginPath();
      const spikes = 5, outer = 10, inner = 4.5;
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(qx, qy - outer);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(qx + Math.cos(rot) * outer, qy + Math.sin(rot) * outer);
        rot += step;
        ctx.lineTo(qx + Math.cos(rot) * inner, qy + Math.sin(rot) * inner);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Legend
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'left';
    CATS.forEach((c, i) => {
      const lx = pad + 4, ly = pad + 14 + i * 16;
      ctx.fillStyle = c.color;
      ctx.beginPath(); ctx.arc(lx, ly - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8a290';
      ctx.fillText(c.name, lx + 10, ly);
    });

    if (!query) {
      ctx.fillStyle = 'rgba(236,230,208,0.55)';
      ctx.font = '12px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Click en el mapa para colocar una consulta (query)', W / 2, H - 8);
    }

    updateInfoPanel(ranked);
  }

  function updateInfoPanel(ranked) {
    const panel = document.getElementById('vectordb-results');
    if (!panel) return;
    if (!query) {
      panel.innerHTML = '<div class="widget-label">Sin consulta todavia — haz click en el espacio vectorial.</div>';
      return;
    }
    const top = ranked.slice(0, k);
    const maxD = Math.sqrt(2);
    panel.innerHTML = top.map((r, idx) => {
      const sim = (1 - r.dist / maxD) * 100;
      return `<div class="widget-label" style="margin:0.25em 0;">
        <span>#${idx + 1} doc_${String(r.d.id).padStart(2, '0')} <span style="color:${CATS[r.d.cat].color}">(${CATS[r.d.cat].name})</span></span>
        <span class="widget-value">${sim.toFixed(1)}% similar</span>
      </div>`;
    }).join('');
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const nx = Math.min(1, Math.max(0, (cx - pad) / pw));
    const ny = Math.min(1, Math.max(0, (cy - pad) / ph));
    query = { x: nx, y: ny };
    draw();
  });

  const kSlider = document.getElementById('vectordb-k-slider');
  const kLabel = document.getElementById('vectordb-k-value');
  if (kSlider) {
    kSlider.addEventListener('input', function () {
      k = parseInt(this.value, 10);
      if (kLabel) kLabel.textContent = k;
      draw();
    });
  }

  const resetBtn = document.getElementById('vectordb-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      seedDocs();
      query = null;
      draw();
    });
  }

  draw();
}
