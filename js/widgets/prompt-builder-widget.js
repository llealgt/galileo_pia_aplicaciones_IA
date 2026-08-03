// ============================================================
// Prompt Builder Widget
//
// Arma el prompt aumentado bloque por bloque y muestra lo que de verdad
// duele en produccion: cuanta ventana de contexto consume cada pieza.
//
// Los conteos de tokens son REALES (tokenizador de gpt2-spanish sobre los
// textos que se muestran). Los bloques son los del modulo: instrucciones
// de sistema, ejemplos (in-context learning), historial de conversacion,
// documentos recuperados, tokens de razonamiento y la consulta.
//
// La leccion: la consulta del usuario son 11 tokens. Todo lo demas —lo
// que el ingeniero decide agregar— es lo que llena la ventana y lo que
// se paga en cada llamada.
// ============================================================

function initPromptBuilderWidget() {
  const canvas = document.getElementById('prompt-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof LLM4 === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const B = LLM4.prompt.bloques;

  // cuantas copias de cada bloque (los docs y el historial se repiten)
  const PIEZAS = [
    { k: 'sistema',      nom: 'Instrucciones de sistema', c: '#9A72AC', n: 1, fijo: true },
    { k: 'ejemplos',     nom: 'Ejemplos (few-shot)',      c: '#5CD0B3', n: 0 },
    { k: 'historial',    nom: 'Historial de la conversación', c: '#58C4DD', n: 1 },
    { k: 'documento',    nom: 'Documentos recuperados',   c: '#83C167', n: 3 },
    { k: 'razonamiento', nom: 'Tokens de razonamiento',   c: '#FF862F', n: 0 },
    { k: 'consulta',     nom: 'Consulta del usuario',     c: '#FFFF00', n: 1, fijo: true },
  ];
  let piezas = PIEZAS.map(p => Object.assign({}, p));
  let ventana = 2048;
  const RESPUESTA = 300;      // hay que reservar espacio para la respuesta

  const totalTokens = () => piezas.reduce((a, p) => a + B[p.k].tokens * p.n, 0);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const total = totalTokens();
    const usado = total + RESPUESTA;

    // ---- barra de la ventana de contexto ----
    const bx = 14, by = 30, bw = W - 28, bh = 30;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Ventana de contexto: ' + ventana + ' tokens', bx, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = usado > ventana ? '#FC6255' : 'rgba(168,162,144,0.8)';
    ctx.fillText(usado + ' usados (' + (100 * usado / ventana).toFixed(0) + '%)', W - 14, 18);

    ctx.fillStyle = 'rgba(168,162,144,0.10)';
    ctx.fillRect(bx, by, bw, bh);
    let x = bx;
    piezas.forEach(p => {
      const t = B[p.k].tokens * p.n;
      if (!t) return;
      const w = (t / ventana) * bw;
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(x, by, Math.max(1, w), bh);
      ctx.globalAlpha = 1;
      if (w > 34) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 9px Fira Code, monospace';
        ctx.fillStyle = '#1b1b2f';
        ctx.fillText(String(t), x + w / 2, by + bh / 2 + 3);
      }
      x += w;
    });
    // espacio reservado para la respuesta
    const wr = (RESPUESTA / ventana) * bw;
    ctx.fillStyle = 'rgba(236,230,208,0.22)';
    ctx.fillRect(x, by, Math.max(1, wr), bh);
    ctx.textAlign = 'center';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(236,230,208,0.8)';
    if (wr > 42) ctx.fillText('respuesta', x + wr / 2, by + bh / 2 + 3);

    if (usado > ventana) {
      ctx.fillStyle = 'rgba(252,98,85,0.25)';
      ctx.fillRect(bx + bw, by, 6, bh);
      ctx.textAlign = 'right';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillStyle = '#FC6255';
      ctx.fillText('¡NO CABE!', W - 14, by + bh + 13);
    }
    ctx.strokeStyle = 'rgba(168,162,144,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // ---- desglose por bloque ----
    const y0 = 92, fila = 25;
    piezas.forEach((p, i) => {
      const y = y0 + i * fila;
      const t = B[p.k].tokens * p.n;
      const activo = p.n > 0;

      ctx.fillStyle = activo ? p.c : 'rgba(168,162,144,0.25)';
      ctx.fillRect(14, y - 9, 5, 18);

      ctx.textAlign = 'left';
      ctx.font = (activo ? 'bold ' : '') + '11px Fira Code, monospace';
      ctx.fillStyle = activo ? '#ece6d0' : 'rgba(168,162,144,0.4)';
      ctx.fillText(p.nom, 28, y + 4);

      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.7)';
      ctx.fillText(p.fijo ? '(siempre presente)' : '× ' + p.n, 262, y + 4);

      // barra proporcional
      const w = (t / Math.max(1, total)) * 240;
      ctx.fillStyle = activo ? p.c : 'rgba(168,162,144,0.15)';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(400, y - 7, Math.max(activo ? 2 : 0, w), 14);
      ctx.globalAlpha = 1;

      ctx.textAlign = 'right';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = activo ? '#ece6d0' : 'rgba(168,162,144,0.4)';
      ctx.fillText(t + ' tok', 700, y + 4);
      ctx.fillStyle = 'rgba(168,162,144,0.65)';
      ctx.fillText(total ? (100 * t / total).toFixed(0) + '%' : '0%', 760, y + 4);

      // costo relativo: cuanto de la llamada es esta pieza
      ctx.fillStyle = 'rgba(168,162,144,0.5)';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillText(B[p.k].tokens + '/u', 840, y + 4);
    });

    actualizarInfo(total, usado);
  }

  function actualizarInfo(total, usado) {
    const el = document.getElementById('prompt-info');
    if (!el) return;
    const cons = B.consulta.tokens;
    const docs = B.documento.tokens * (piezas.find(p => p.k === 'documento').n);
    // precio de referencia: 0.15 USD por millon de tokens de entrada
    const costo = (usado / 1e6) * 0.15;
    el.innerHTML =
      '<div class="widget-label"><span>Tokens del prompt</span>' +
      '<span class="widget-value" style="color:' +
      (usado > ventana ? 'var(--c-red)' : 'var(--c-text)') + ';">' + total + '</span></div>' +
      '<div class="widget-label"><span>Lo que escribió el usuario</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      cons + ' tok  (' + (100 * cons / Math.max(1, total)).toFixed(0) + '%)</span></div>' +
      '<div class="widget-label"><span>Documentos recuperados</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' +
      docs + ' tok  (' + (100 * docs / Math.max(1, total)).toFixed(0) + '%)</span></div>' +
      '<div class="widget-label"><span>Costo por consulta (a $0.15/M)</span>' +
      '<span class="widget-value">$' + costo.toFixed(6) + '</span></div>' +
      '<div class="widget-label"><span>¿Cabe en la ventana de ' +
      (ventana >= 1024 ? (ventana / 1024) + 'k' : ventana) + '?</span>' +
      '<span class="widget-value" style="color:' +
      (usado > ventana ? 'var(--c-red)' : 'var(--c-green)') + ';">' +
      (usado > ventana ? 'NO — sobran ' + (usado - ventana) + ' tok'
        : 'sí — sobran ' + (ventana - usado) + ' tok') + '</span></div>';
  }

  document.querySelectorAll('.prompt-pieza-btn').forEach(b => {
    b.addEventListener('click', () => {
      const p = piezas.find(x => x.k === b.dataset.k);
      if (!p) return;
      const max = b.dataset.k === 'documento' ? 12 : b.dataset.k === 'historial' ? 8 : 1;
      p.n = p.n >= max ? 0 : p.n + 1;
      b.classList.toggle('active', p.n > 0);
      draw();
    });
  });
  const sV = document.getElementById('prompt-ventana'), lV = document.getElementById('prompt-ventana-value');
  if (sV) sV.addEventListener('input', function () {
    ventana = [512, 1024, 2048, 4096, 8192, 32768][parseInt(this.value, 10)];
    if (lV) lV.textContent = ventana >= 1024 ? (ventana / 1024) + 'k' : ventana;
    draw();
  });
  const bR = document.getElementById('prompt-reset');
  if (bR) bR.addEventListener('click', () => {
    piezas = PIEZAS.map(p => Object.assign({}, p));
    document.querySelectorAll('.prompt-pieza-btn').forEach(b => {
      const p = piezas.find(x => x.k === b.dataset.k);
      b.classList.toggle('active', !!(p && p.n > 0));
    });
    draw();
  });

  document.querySelectorAll('.prompt-pieza-btn').forEach(b => {
    const p = piezas.find(x => x.k === b.dataset.k);
    b.classList.toggle('active', !!(p && p.n > 0));
  });
  if (lV) lV.textContent = '2k';
  draw();
}
