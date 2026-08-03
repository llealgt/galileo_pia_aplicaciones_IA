// ============================================================
// Attention Cost Widget
//
// Por que "cada token que agregas al prompt lo pagas en cada consulta",
// con la aritmetica real de un transformer.
//
// El costo de una pasada se reparte en dos terminos que crecen distinto
// con el largo del prompt n y la dimension del modelo d:
//
//   atencion      ∝ n² · d   -> CUADRATICO en el largo
//   feed forward  ∝ n · d²   -> lineal en el largo
//
// (constantes: 4·n²·d para las matrices de atencion y 16·n·d² para las
// proyecciones y el bloque feed forward de un transformer estandar.)
//
// De ahi sale un resultado preciso y poco conocido: la atencion NO
// domina siempre. Solo empieza a dominar cuando el prompt se acerca al
// tamano de la dimension del modelo. Con d = 4096, eso ocurre a partir
// de unos 16 mil tokens; por debajo, el grueso del costo esta en el feed
// forward.
//
// Todo se calcula en vivo con esas formulas: no hay tiempos medidos ni
// inventados, son proporciones de operaciones.
// ============================================================

function initAttentionCostWidget() {
  const canvas = document.getElementById('attcost-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let n = 2000;          // tokens del prompt
  let d = 4096;          // dimension del modelo
  const NMAX = 64000;

  // operaciones por pasada, en unidades arbitrarias comparables
  const attn = (n, d) => 4 * n * n * d;
  const ffn  = (n, d) => 16 * n * d * d;
  const tot  = (n, d) => attn(n, d) + ffn(n, d);
  // donde la atencion iguala al feed forward:  4n²d = 16nd²  ->  n = 4d
  const cruce = d => 4 * d;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const x0 = 58, y0 = 34, w = W - 208, h = H - 92;   // el ancho deja sitio a la leyenda
    const maxY = tot(NMAX, d);
    const px = t => x0 + (t / NMAX) * w;
    const py = v => y0 + h - (v / maxY) * h;

    // rejilla
    ctx.strokeStyle = 'rgba(168,162,144,0.12)';
    ctx.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const y = y0 + (k / 4) * h;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(168,162,144,0.35)';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();

    // area apilada: feed forward abajo, atencion encima
    const PASO = 160;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    for (let t = 0; t <= NMAX; t += PASO) ctx.lineTo(px(t), py(ffn(t, d)));
    ctx.lineTo(px(NMAX), py(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(88,196,221,0.28)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    for (let t = 0; t <= NMAX; t += PASO) ctx.lineTo(px(t), py(tot(t, d)));
    for (let t = NMAX; t >= 0; t -= PASO) ctx.lineTo(px(t), py(ffn(t, d)));
    ctx.closePath();
    ctx.fillStyle = 'rgba(252,98,85,0.30)';
    ctx.fill();

    // curva total
    ctx.strokeStyle = '#FC6255'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t <= NMAX; t += PASO) {
      const X = px(t), Y = py(tot(t, d));
      if (t === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    // referencia lineal: como crecería si todo fuera proporcional al largo
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(131,193,103,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(NMAX), py(tot(NMAX, d) * 0 + (tot(1000, d) / 1000) * NMAX));
    ctx.stroke();
    ctx.setLineDash([]);

    // punto de cruce
    const xc = cruce(d);
    if (xc <= NMAX) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(255,255,0,0.7)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px(xc), y0); ctx.lineTo(px(xc), y0 + h); ctx.stroke();
      ctx.setLineDash([]);
      // etiqueta horizontal y corta: rotada no cabe en la altura del lienzo
      ctx.textAlign = 'center';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('aquí se igualan', px(xc), y0 - 8);
    }

    // marcador del prompt actual
    ctx.strokeStyle = '#ece6d0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px(n), y0); ctx.lineTo(px(n), y0 + h); ctx.stroke();
    ctx.beginPath(); ctx.arc(px(n), py(tot(n, d)), 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ece6d0'; ctx.fill();

    // ejes
    ctx.textAlign = 'center';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.75)';
    [0, 16000, 32000, 48000, 64000].forEach(t =>
      ctx.fillText(t ? (t / 1000) + 'k' : '0', px(t), y0 + h + 14));
    ctx.fillText('tokens del prompt', x0 + w / 2, y0 + h + 28);
    ctx.save();
    ctx.translate(16, y0 + h / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('operaciones por pasada', 0, 0);
    ctx.restore();

    // leyenda
    ctx.textAlign = 'left';
    ctx.font = '9.5px Fira Code, monospace';
    const ley = [['atención  ∝ n² · d', 'rgba(252,98,85,0.85)'],
                 ['feed forward  ∝ n · d²', 'rgba(88,196,221,0.85)'],
                 ['si todo fuera lineal', 'rgba(131,193,103,0.8)']];
    ley.forEach(([t, c], k) => {
      ctx.fillStyle = c;
      ctx.fillRect(x0 + w + 12, y0 + 6 + k * 16, 9, 9);
      ctx.fillStyle = 'rgba(236,230,208,0.85)';
      ctx.fillText(t, x0 + w + 25, y0 + 15 + k * 16);
    });

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('attcost-info');
    if (!el) return;
    const base = 500;                          // prompt corto de referencia
    const rel = tot(n, d) / tot(base, d);
    const vecesTok = n / base;
    const parteAtt = 100 * attn(n, d) / tot(n, d);
    el.innerHTML =
      '<div class="widget-label"><span>Prompt</span>' +
      '<span class="widget-value">' + n.toLocaleString('es') + ' tokens</span></div>' +
      '<div class="widget-label"><span>Cuesta frente a uno de 500 tokens</span>' +
      '<span class="widget-value" style="color:' +
      (rel > 60 ? 'var(--c-red)' : rel > 20 ? 'var(--c-orange)' : 'var(--c-yellow)') + ';">' +
      rel.toFixed(1) + '×  <span style="color:var(--c-text-dim);">(con ' +
      vecesTok.toFixed(0) + '× más tokens)</span></span></div>' +
      '<div class="widget-label"><span>Del costo, se va en atención</span>' +
      '<span class="widget-value" style="color:var(--c-red);">' + parteAtt.toFixed(0) + '%</span></div>' +
      '<div class="widget-label"><span>La atención domina a partir de</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      cruce(d).toLocaleString('es') + ' tokens</span></div>';
  }

  const sN = document.getElementById('attcost-n'), lN = document.getElementById('attcost-n-value');
  if (sN) sN.addEventListener('input', function () {
    n = parseInt(this.value, 10);
    if (lN) lN.textContent = n >= 1000 ? (n / 1000) + 'k' : n;
    draw();
  });
  const sD = document.getElementById('attcost-d'), lD = document.getElementById('attcost-d-value');
  if (sD) sD.addEventListener('input', function () {
    d = [1024, 2048, 4096, 8192][parseInt(this.value, 10)];
    if (lD) lD.textContent = d;
    draw();
  });

  if (lN) lN.textContent = '2k';
  if (lD) lD.textContent = d;
  draw();
}
