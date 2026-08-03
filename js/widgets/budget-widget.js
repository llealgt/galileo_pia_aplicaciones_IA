// ============================================================
// Budget Widget: la traza de un prompt, con costo y latencia
//
// Muestra el compromiso central del modulo 5: no se puede optimizar solo
// la calidad. Cada componente que se enciende agrega latencia y dinero,
// y el widget obliga a ver las tres cifras a la vez.
//
// Tambien es la vista de "traza" de una plataforma de observabilidad:
// el recorrido completo de una consulta con el tiempo de cada etapa.
//
// Las latencias de los tres componentes basados en transformer son las
// del modulo (reranker 50 ms, reescritor 300 ms, router 200 ms). El resto
// son valores de referencia razonables, NO medidos: sirven para comparar
// configuraciones entre si, no para predecir una factura.
// ============================================================

function initBudgetWidget() {
  const canvas = document.getElementById('budget-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // ms = latencia; usd = costo por consulta; cal = puntos de calidad
  const ETAPAS = [
    { k: 'router',   nom: 'Router LLM',        ms: 200,  usd: 0.00002, cal: 0,  c: '#9A72AC',
      det: 'decide si hace falta recuperar', op: true,  on: false },
    { k: 'rewrite',  nom: 'Reescritor',        ms: 300,  usd: 0.00003, cal: 8,  c: '#FF862F',
      det: 'limpia y expande la consulta',   op: true,  on: false },
    { k: 'embed',    nom: 'Embedding',         ms: 15,   usd: 0.000001, cal: 0, c: '#5CD0B3',
      det: 'vectoriza la consulta',          op: false, on: true },
    { k: 'ann',      nom: 'Búsqueda ANN',      ms: 12,   usd: 0.000002, cal: 0, c: '#58C4DD',
      det: 'HNSW sobre la base vectorial',   op: false, on: true },
    { k: 'bm25',     nom: 'BM25 + fusión',     ms: 8,    usd: 0.000001, cal: 6, c: '#58C4DD',
      det: 'búsqueda híbrida con RRF',       op: true,  on: true },
    { k: 'rerank',   nom: 'Reranker',          ms: 50,   usd: 0.00001, cal: 14, c: '#E48BB0',
      det: 'cross-encoder sobre 25 candidatos', op: true, on: true },
    { k: 'llm',      nom: 'Generación (LLM)',  ms: 1800, usd: 0.00220, cal: 55, c: '#FC6255',
      det: 'el cuello de botella real',      op: false, on: true },
    { k: 'cite',     nom: 'Citador',           ms: 250,  usd: 0.00004, cal: 9,  c: '#83C167',
      det: 'verifica y coloca las citas',    op: true,  on: false },
  ];
  let etapas = ETAPAS.map(e => Object.assign({}, e));
  let modelo = 'grande';    // grande | chico | chico-cuantizado

  // El modelo elegido reescala la etapa de generacion
  const MODELOS = {
    'grande':          { ms: 1800, usd: 0.00220, cal: 55, nom: 'grande' },
    'chico':           { ms: 620,  usd: 0.00018, cal: 44, nom: 'chico' },
    'chico-cuantizado':{ ms: 380,  usd: 0.00011, cal: 42, nom: 'chico int8' },
  };

  function activas() {
    return etapas.filter(e => e.on).map(e => {
      if (e.k !== 'llm') return e;
      const m = MODELOS[modelo];
      return Object.assign({}, e, { ms: m.ms, usd: m.usd, cal: m.cal,
                                    nom: 'Generación (' + m.nom + ')' });
    });
  }

  const total = f => activas().reduce((a, e) => a + e[f], 0);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const A = activas();
    const ms = total('ms');

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Traza de una consulta — cada barra es una etapa del pipeline', 14, 15);

    // ---- barra apilada de latencia (la vista de traza) ----
    const bx = 14, by = 28, bw = W - 28, bh = 26;
    let x = bx;
    A.forEach(e => {
      const w = (e.ms / ms) * bw;
      ctx.fillStyle = e.c;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x, by, Math.max(1, w), bh);
      ctx.globalAlpha = 1;
      if (w > 46) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 9px Fira Code, monospace';
        ctx.fillStyle = '#1b1b2f';
        ctx.fillText(e.ms + 'ms', x + w / 2, by + bh / 2 + 3);
      }
      x += w;
    });
    ctx.strokeStyle = 'rgba(168,162,144,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.textAlign = 'right';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    ctx.fillText('total ' + ms + ' ms', W - 14, by + bh + 12);

    // ---- lista de etapas ----
    const y0 = 82, fila = 21;
    etapas.forEach((e0, i) => {
      const e = e0.k === 'llm' ? A.find(a => a.k === 'llm') || e0 : e0;
      const y = y0 + i * fila;
      const on = e0.on;

      ctx.fillStyle = on ? e0.c : 'rgba(168,162,144,0.22)';
      ctx.fillRect(14, y - 7, 5, 14);

      ctx.textAlign = 'left';
      ctx.font = (on ? 'bold ' : '') + '10px Fira Code, monospace';
      ctx.fillStyle = on ? '#ece6d0' : 'rgba(168,162,144,0.38)';
      ctx.fillText(e0.k === 'llm' ? e.nom : e0.nom, 28, y + 4);

      ctx.font = '9px Fira Code, monospace';
      ctx.fillStyle = on ? 'rgba(168,162,144,0.7)' : 'rgba(168,162,144,0.3)';
      ctx.fillText(e0.det, 190, y + 4);
      if (!e0.op) {
        ctx.fillStyle = 'rgba(168,162,144,0.45)';
        ctx.fillText('(obligatoria)', 430, y + 4);
      }

      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = on ? 'rgba(236,230,208,0.9)' : 'rgba(168,162,144,0.3)';
      ctx.fillText((e0.k === 'llm' ? e.ms : e0.ms) + ' ms', 640, y + 4);
      ctx.fillText('$' + (e0.k === 'llm' ? e.usd : e0.usd).toFixed(5), 730, y + 4);
      ctx.fillStyle = on ? (e0.cal ? '#83C167' : 'rgba(168,162,144,0.5)') : 'rgba(168,162,144,0.3)';
      const cal = e0.k === 'llm' ? e.cal : e0.cal;
      ctx.fillText(cal ? '+' + cal + ' cal.' : '—', 820, y + 4);
    });

    actualizarInfo(A);
  }

  function actualizarInfo(A) {
    const el = document.getElementById('budget-info');
    if (!el) return;
    const ms = total('ms'), usd = total('usd'), cal = total('cal');
    // 100,000 consultas al mes es una escala tipica de un bot mediano
    const mes = usd * 100000;
    el.innerHTML =
      '<div class="widget-label"><span>Latencia total</span>' +
      '<span class="widget-value" style="color:' +
      (ms > 2200 ? 'var(--c-red)' : ms > 1200 ? 'var(--c-orange)' : 'var(--c-green)') +
      ';">' + ms + ' ms</span></div>' +
      '<div class="widget-label"><span>Calidad estimada</span>' +
      '<span class="widget-value" style="color:' +
      (cal >= 80 ? 'var(--c-green)' : cal >= 60 ? 'var(--c-yellow)' : 'var(--c-red)') +
      ';">' + cal + ' / 92</span></div>' +
      '<div class="widget-label"><span>Costo por consulta</span>' +
      '<span class="widget-value">$' + usd.toFixed(5) + '</span></div>' +
      '<div class="widget-label"><span>Costo a 100 mil consultas/mes</span>' +
      '<span class="widget-value" style="color:var(--c-teal);">$' + mes.toFixed(0) + '</span></div>';
  }

  document.querySelectorAll('.budget-etapa-btn').forEach(b => {
    b.addEventListener('click', () => {
      const e = etapas.find(x => x.k === b.dataset.k);
      if (!e || !e.op) return;
      e.on = !e.on;
      b.classList.toggle('active', e.on);
      draw();
    });
  });
  document.querySelectorAll('.budget-modelo-btn').forEach(b => {
    b.addEventListener('click', () => {
      modelo = b.dataset.modelo;
      document.querySelectorAll('.budget-modelo-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const bR = document.getElementById('budget-reset');
  if (bR) bR.addEventListener('click', () => {
    etapas = ETAPAS.map(e => Object.assign({}, e));
    modelo = 'grande';
    document.querySelectorAll('.budget-etapa-btn').forEach(b => {
      const e = etapas.find(x => x.k === b.dataset.k);
      b.classList.toggle('active', !!(e && e.on));
    });
    document.querySelectorAll('.budget-modelo-btn').forEach(x =>
      x.classList.toggle('active', x.dataset.modelo === 'grande'));
    draw();
  });

  document.querySelectorAll('.budget-etapa-btn').forEach(b => {
    const e = etapas.find(x => x.k === b.dataset.k);
    b.classList.toggle('active', !!(e && e.on));
  });
  const im = document.querySelector('.budget-modelo-btn[data-modelo="grande"]');
  if (im) im.classList.add('active');
  draw();
}
