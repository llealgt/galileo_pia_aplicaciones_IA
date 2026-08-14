// ============================================================
// Busqueda semantica, paso a paso
// Cinco etapas animadas sobre el MISMO espacio:
//   0 el corpus ya esta indexado
//   1 llega la consulta, todavia como texto
//   2 el modelo la convierte en vector
//   3 se mide la distancia contra TODOS los documentos
//   4 se queda con los k mas cercanos
//
// Datos en js/widgets/semantic-search-data.js: 13 documentos y 5
// consultas codificados de verdad. Las posiciones son t-SNE elegido
// midiendo (100 % de coincidencia del vecino mas cercano contra el
// coseno real) y los puntajes son los cosenos REALES en 384
// dimensiones, no la distancia del dibujo.
// ============================================================

const BUSQ_COLOR = {
  'cocina': '#FF862F',
  'fútbol': '#83C167',
  'astronomía': '#58C4DD',
  'finanzas': '#9A72AC',
};

const BUSQ_ETAPAS = [
  { t: 'El corpus ya está indexado',      d: 'Cada documento es un punto. Esto se calculó una sola vez.' },
  { t: 'Llega la consulta',               d: 'Todavía es texto: el índice no sabe qué hacer con ella.' },
  { t: 'El mismo modelo la codifica',     d: 'La consulta pasa por el MISMO modelo que los documentos.' },
  { t: 'Se mide contra todos',            d: 'Un coseno por documento. Aquí son 13; en producción, millones.' },
  { t: 'Se queda con los k más cercanos', d: 'Esos k son los que van al prompt del LLM.' },
];

function initSemanticSearchFlowWidget() {
  const canvas = document.getElementById('busq-flow-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof BUSQ_DOCS === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMARILLO = '#FFFF00', VERDE = '#83C167';
  const K = 3;

  let etapa = 0;
  let consulta = 0;
  let t0 = performance.now();     // inicio de la animacion de la etapa actual
  let corriendo = true;

  // --- el mapa ocupa la izquierda; el panel, la derecha ---
  const MAPA = { x0: 34, x1: 470, y0: 56, y1: H - 30 };
  const mx = x => MAPA.x0 + x * (MAPA.x1 - MAPA.x0);
  const my = y => MAPA.y1 - y * (MAPA.y1 - MAPA.y0);

  function cq() { return BUSQ_CONSULTAS[consulta]; }

  function ranking() {
    return cq().sim
      .map((s, j) => ({ j, s }))
      .sort((a, b) => b.s - a.s);
  }

  // avance 0..1 de la etapa actual
  function prog() {
    const dur = [500, 700, 1500, 1400, 900][etapa];
    return Math.min(1, (performance.now() - t0) / dur);
  }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const p = prog();
    const R = ranking();
    const top = new Set(R.slice(0, K).map(r => r.j));

    // ---- marco del espacio ----
    ctx.strokeStyle = 'rgba(236,230,208,0.10)';
    ctx.lineWidth = 1;
    ctx.strokeRect(MAPA.x0 - 14, MAPA.y0 - 14,
                   MAPA.x1 - MAPA.x0 + 28, MAPA.y1 - MAPA.y0 + 28);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.textAlign = 'left';
    ctx.fillText('el espacio de embeddings (proyectado a 2D)', MAPA.x0 - 14, MAPA.y0 - 22);

    // ---- lineas de distancia (etapa 3 en adelante) ----
    if (etapa >= 3) {
      const Q = { x: mx(cq().x), y: my(cq().y) };
      const n = etapa === 3 ? Math.floor(p * BUSQ_DOCS.length) : BUSQ_DOCS.length;
      BUSQ_DOCS.forEach((d, j) => {
        if (etapa === 3 && j >= n) return;
        const esTop = top.has(j);
        if (etapa === 4 && !esTop) return;
        const s = cq().sim[j];
        ctx.strokeStyle = esTop ? VERDE : 'rgba(236,230,208,0.30)';
        ctx.lineWidth = esTop ? 2.2 : 1;
        ctx.globalAlpha = esTop ? 0.9 : 0.25 + 0.5 * Math.max(0, s);
        ctx.beginPath();
        ctx.moveTo(Q.x, Q.y);
        ctx.lineTo(mx(d.x), my(d.y));
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    }

    // ---- documentos ----
    BUSQ_DOCS.forEach((d, j) => {
      const esTop = etapa >= 4 && top.has(j);
      const X = mx(d.x), Y = my(d.y);
      if (esTop) {
        ctx.beginPath();
        ctx.arc(X, Y, 13, 0, Math.PI * 2);
        ctx.strokeStyle = VERDE; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(X, Y, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = BUSQ_COLOR[d.tema] || DIM;
      ctx.globalAlpha = (etapa >= 4 && !esTop) ? 0.3 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // ---- la consulta ----
    if (etapa >= 2) {
      const q = cq();
      // en la etapa 2 viaja desde la caja de texto hasta su posicion
      const destX = mx(q.x), destY = my(q.y);
      const origX = MAPA.x0 + 40, origY = MAPA.y0 - 4;
      const f = etapa === 2 ? easeOut(p) : 1;
      const X = origX + (destX - origX) * f;
      const Y = origY + (destY - origY) * f;
      ctx.beginPath();
      ctx.arc(X, Y, 9, 0, Math.PI * 2);
      ctx.fillStyle = AMARILLO;
      ctx.fill();
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 2; ctx.stroke();
      if (f > 0.9) {
        ctx.font = 'bold 12px Lora, serif';
        ctx.fillStyle = AMARILLO;
        ctx.textAlign = 'center';
        ctx.fillText('consulta', X, Y - 16);
      }
    }

    leyenda();
    panel();
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function leyenda() {
    ctx.font = '11px Lora, serif';
    ctx.textAlign = 'left';
    let x = MAPA.x0 - 14;
    Object.keys(BUSQ_COLOR).forEach(k => {
      ctx.beginPath();
      ctx.arc(x + 5, H - 12, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = BUSQ_COLOR[k]; ctx.fill();
      ctx.fillStyle = DIM;
      ctx.fillText(k, x + 13, H - 8);
      x += 15 + ctx.measureText(k).width + 12;
    });
  }

  function panel() {
    const x0 = 512;
    let y = 40;
    const p = prog();

    // titulo de la etapa
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText(`paso ${etapa + 1} de 5`, x0, y - 16);
    ctx.font = 'bold 15px Lora, serif';
    ctx.fillStyle = AMARILLO;
    ctx.fillText(BUSQ_ETAPAS[etapa].t, x0, y + 2);
    ctx.font = '12px Lora, serif';
    ctx.fillStyle = DIM;
    y = envolver(BUSQ_ETAPAS[etapa].d, x0, y + 22, 352, 16) + 10;

    // la consulta como texto
    if (etapa >= 1) {
      ctx.fillStyle = 'rgba(255,255,0,0.07)';
      ctx.fillRect(x0, y - 2, 352, 26);
      ctx.font = 'italic 13.5px Lora, serif';
      ctx.fillStyle = AMARILLO;
      ctx.fillText('«' + cq().t + '»', x0 + 8, y + 16);
      y += 40;
    }

    // el vector
    if (etapa >= 2) {
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = DIM;
      ctx.fillText('modelo →  384 números', x0, y);
      const n = etapa === 2 ? Math.floor(p * BUSQ_MUESTRA_VECTOR.length) : BUSQ_MUESTRA_VECTOR.length;
      ctx.font = '11.5px Fira Code, monospace';
      ctx.fillStyle = FG;
      const txt = '[' + BUSQ_MUESTRA_VECTOR.slice(0, n).map(v => v.toFixed(2)).join(', ')
                + (n >= BUSQ_MUESTRA_VECTOR.length ? ', …]' : '');
      ctx.fillText(txt, x0, y + 18);
      y += 42;
    }

    // el ranking
    if (etapa >= 3) {
      const R = ranking();
      const n = etapa === 3 ? Math.max(1, Math.floor(p * 6)) : 6;
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = DIM;
      ctx.fillText(etapa >= 4 ? `los ${K} más cercanos` : 'coseno contra cada documento', x0, y);
      y += 16;
      R.slice(0, etapa >= 4 ? K : Math.min(n, 6)).forEach((r, i) => {
        const d = BUSQ_DOCS[r.j];
        const dentro = i < K;
        ctx.font = 'bold 12px Fira Code, monospace';
        ctx.fillStyle = (etapa >= 4 || dentro) ? VERDE : DIM;
        ctx.fillText(r.s.toFixed(3), x0, y + 11);
        ctx.beginPath();
        ctx.arc(x0 + 46, y + 7, 4, 0, Math.PI * 2);
        ctx.fillStyle = BUSQ_COLOR[d.tema] || DIM; ctx.fill();
        ctx.font = '12px Lora, serif';
        ctx.fillStyle = (etapa >= 4 || dentro) ? FG : DIM;
        ctx.fillText(recorta(d.t, 38), x0 + 56, y + 11);
        y += 19;
      });
      if (etapa >= 4) {
        y += 8;
        ctx.font = 'italic 11.5px Lora, serif';
        ctx.fillStyle = DIM;
        envolver('Ninguna palabra de la consulta aparece en ellos: el parecido '
               + 'es del vector, no del texto.', x0, y, 352, 15);
      }
    }
  }

  function recorta(t, n) { return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  function envolver(txt, x, y, ancho, alto) {
    const pal = txt.split(' ');
    let linea = '', yy = y;
    pal.forEach(w => {
      const pr = linea ? linea + ' ' + w : w;
      if (ctx.measureText(pr).width > ancho && linea) {
        ctx.fillText(linea, x, yy); yy += alto; linea = w;
      } else linea = pr;
    });
    if (linea) { ctx.fillText(linea, x, yy); yy += alto; }
    return yy;
  }

  // ---- controles ----
  function ir(e) { etapa = Math.max(0, Math.min(4, e)); t0 = performance.now(); }

  const bSig = document.getElementById('busq-sig');
  if (bSig) bSig.addEventListener('click', () => {
    if (etapa >= 4) { ir(0); } else { ir(etapa + 1); }
    corriendo = true;
  });
  const bReset = document.getElementById('busq-reset');
  if (bReset) bReset.addEventListener('click', () => ir(0));

  document.querySelectorAll('.busq-q-btn').forEach(b => {
    b.addEventListener('click', () => {
      consulta = parseInt(b.dataset.q, 10);
      document.querySelectorAll('.busq-q-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
      ir(1);
    });
  });
  // marcar la consulta inicial
  document.querySelectorAll('.busq-q-btn').forEach((o, i) => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (i === 0 ? '● ' : '○ ') + o.dataset.etq;
  });

  function tick() {
    if (corriendo) dibujar();
    requestAnimationFrame(tick);
  }
  tick();
}
