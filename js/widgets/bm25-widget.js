// ============================================================
// BM25 / TF-IDF Widget
//
// Deja comparar las tres formas de puntuar una busqueda por palabras
// sobre el MISMO corpus y la MISMA consulta:
//   TF        -> frecuencia normalizada por longitud
//   TF-IDF    -> TF x log(N / df), premia palabras raras
//   BM25      -> TF-IDF con saturacion (k1) y normalizacion suave (b)
//
// Todo se calcula en vivo (no hay puntajes precalculados) para que los
// sliders de k1 y b muevan los numeros de verdad. La implementacion
// esta verificada contra una referencia en Python.
// ============================================================

// Tokenizador compartido: minusculas, sin tildes, sin palabras vacias.
// Es a proposito MUY simple, igual que un indice invertido basico: eso
// hace visible en clase que "hornos" y "horno" son tokens distintos.
const IR_STOP = new Set(('de la el en y a los las un una con para por que del al se su ' +
  'sus lo le es son o u ni mas muy sin sobre entre como').split(' '));

function irTokenizar(t) {
  return t.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g)
    .filter(w => !IR_STOP.has(w));
}

function initBm25Widget() {
  const canvas = document.getElementById('bm25-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof IR_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const DOCS = IR_DEMO.docs;
  const N = DOCS.length;
  const TOKS = DOCS.map(irTokenizar);
  const LEN = TOKS.map(t => t.length);
  const AVGDL = LEN.reduce((a, b) => a + b, 0) / N;

  // document frequency de cada termino
  const DF = {};
  TOKS.forEach(t => new Set(t).forEach(w => { DF[w] = (DF[w] || 0) + 1; }));

  let qi = 0;
  let modo = 'bm25';     // 'tf' | 'tfidf' | 'bm25'
  let k1 = 1.5, b = 0.75;

  const idfBM25 = w => Math.log(1 + (N - (DF[w] || 0) + 0.5) / ((DF[w] || 0) + 0.5));
  const idfTFIDF = w => (DF[w] ? Math.log(N / DF[w]) : 0);

  // Devuelve, por documento, el puntaje total y el desglose por termino.
  function puntajes() {
    const q = [...new Set(irTokenizar(IR_DEMO.consultas[qi].texto))];
    return TOKS.map((t, i) => {
      let total = 0;
      const partes = q.map(w => {
        const f = t.reduce((a, x) => a + (x === w ? 1 : 0), 0);
        let s = 0;
        if (f > 0) {
          if (modo === 'tf') s = f / LEN[i];
          else if (modo === 'tfidf') s = (f / LEN[i]) * idfTFIDF(w);
          else s = idfBM25(w) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * LEN[i] / AVGDL));
        }
        total += s;
        return { w: w, f: f, s: s };
      });
      return { i: i, texto: DOCS[i], total: total, partes: partes, len: LEN[i] };
    }).sort((a, b2) => b2.total - a.total);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const q = [...new Set(irTokenizar(IR_DEMO.consultas[qi].texto))];
    const r = puntajes();
    const max = Math.max(1e-9, r[0].total);

    // ---- encabezado: consulta y sus tokens ----
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 17);
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(IR_DEMO.consultas[qi].texto, 14, 36);

    // tokens con su df/idf: el "por que" del ranking
    let x = 14;
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('tokens:', x, 55); x += 52;
    q.forEach(w => {
      const et = w + '  df=' + (DF[w] || 0);
      const wd = ctx.measureText(et).width + 12;
      // mas oscuro = mas comun = aporta menos
      const raro = 1 - (DF[w] || 0) / N;
      ctx.fillStyle = 'rgba(88,196,221,' + (0.18 + 0.5 * raro).toFixed(2) + ')';
      ctx.fillRect(x, 46, wd, 13);
      ctx.fillStyle = '#ece6d0';
      ctx.fillText(et, x + 6, 55);
      x += wd + 6;
    });

    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText('N = ' + N + ' documentos   ·   largo promedio = ' + AVGDL.toFixed(2) + ' tokens', x + 10, 55);

    // ---- filas ----
    const y0 = 70, fila = 21, bx = 78, bw = 130;
    r.forEach((d, pos) => {
      const y = y0 + pos * fila;
      const cero = d.total < 1e-9;

      ctx.textAlign = 'right';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = cero ? 'rgba(168,162,144,0.35)' : '#ece6d0';
      ctx.fillText(d.total.toFixed(3), bx - 8, y + 4);

      // barra: verde si aporta, gris si el documento no comparte ninguna palabra
      const ancho = Math.max(1, (d.total / max) * bw);
      ctx.fillStyle = cero ? 'rgba(168,162,144,0.18)' : '#58C4DD';
      ctx.fillRect(bx, y - 8, ancho, 12);

      // desglose por termino dentro de la barra (apilado)
      if (!cero) {
        let acc = 0;
        const col = ['#83C167', '#FF862F', '#9A72AC', '#E48BB0', '#5CD0B3'];
        d.partes.forEach((p, j) => {
          if (p.s <= 0) return;
          const wSeg = (p.s / max) * bw;
          ctx.fillStyle = col[j % col.length];
          ctx.fillRect(bx + acc, y - 8, wSeg, 12);
          acc += wSeg;
        });
      }

      ctx.textAlign = 'left';
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = cero ? 'rgba(168,162,144,0.35)' : '#ece6d0';
      let t = d.texto;
      const maxw = W - (bx + bw + 105);
      while (ctx.measureText(t).width > maxw && t.length > 8) t = t.slice(0, -2);
      if (t !== d.texto) t += '…';
      ctx.fillText(t, bx + bw + 12, y + 4);

      // largo del documento: hace visible el efecto de b
      ctx.textAlign = 'right';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.55)';
      ctx.fillText(d.len + ' tok', W - 14, y + 4);
    });

    // ---- leyenda de colores por termino ----
    const yl = y0 + N * fila + 12;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    const col = ['#83C167', '#FF862F', '#9A72AC', '#E48BB0', '#5CD0B3'];
    let lx = 78;
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText('aporte por término:', 14, yl + 4);
    lx = 152;
    q.forEach((w, j) => {
      ctx.fillStyle = col[j % col.length];
      ctx.fillRect(lx, yl - 5, 9, 9);
      ctx.fillStyle = 'rgba(236,230,208,0.85)';
      const et = w + (modo === 'tf' ? '' : '  idf=' +
        (modo === 'bm25' ? idfBM25(w) : idfTFIDF(w)).toFixed(2));
      ctx.fillText(et, lx + 13, yl + 3);
      lx += ctx.measureText(et).width + 30;
    });

    actualizarInfo(r, q);
  }

  function actualizarInfo(r, q) {
    const el = document.getElementById('bm25-info');
    if (!el) return;
    const conCero = r.filter(d => d.total < 1e-9).length;
    const formula = modo === 'tf'
      ? 'f(t,d) / |d|'
      : modo === 'tfidf'
        ? 'TF × log(N / df)'
        : 'IDF × f(k₁+1) / (f + k₁(1−b+b·|d|/avgdl))';
    el.innerHTML =
      '<div class="widget-label"><span>Fórmula</span>' +
      '<span class="widget-value" style="font-size:0.82em;">' + formula + '</span></div>' +
      '<div class="widget-label"><span>Mejor documento</span>' +
      '<span class="widget-value" style="color:var(--c-green);">#' + (r[0].i + 1) + '</span></div>' +
      '<div class="widget-label"><span>Sin ninguna palabra en común</span>' +
      '<span class="widget-value" style="color:var(--c-red);">' + conCero + ' de ' + N + '</span></div>' +
      '<div class="widget-label"><span>Puntaje máximo</span>' +
      '<span class="widget-value">' + r[0].total.toFixed(3) + '</span></div>';
  }

  // ---- controles ----
  document.querySelectorAll('.bm25-q-btn').forEach(bt => {
    bt.addEventListener('click', () => {
      qi = parseInt(bt.dataset.q, 10);
      document.querySelectorAll('.bm25-q-btn').forEach(x => x.classList.toggle('active', x === bt));
      draw();
    });
  });
  document.querySelectorAll('.bm25-modo-btn').forEach(bt => {
    bt.addEventListener('click', () => {
      modo = bt.dataset.modo;
      document.querySelectorAll('.bm25-modo-btn').forEach(x => x.classList.toggle('active', x === bt));
      // k1 y b solo tienen sentido en BM25
      const cont = document.getElementById('bm25-params');
      if (cont) cont.style.opacity = (modo === 'bm25') ? '1' : '0.3';
      draw();
    });
  });
  const sK = document.getElementById('bm25-k1'), lK = document.getElementById('bm25-k1-value');
  if (sK) sK.addEventListener('input', function () {
    k1 = parseInt(this.value, 10) / 10;
    if (lK) lK.textContent = k1.toFixed(1);
    if (modo !== 'bm25') return;
    draw();
  });
  const sB = document.getElementById('bm25-b'), lB = document.getElementById('bm25-b-value');
  if (sB) sB.addEventListener('input', function () {
    b = parseInt(this.value, 10) / 100;
    if (lB) lB.textContent = b.toFixed(2);
    if (modo !== 'bm25') return;
    draw();
  });

  const iq = document.querySelector('.bm25-q-btn[data-q="0"]');
  if (iq) iq.classList.add('active');
  const im = document.querySelector('.bm25-modo-btn[data-modo="bm25"]');
  if (im) im.classList.add('active');
  if (lK) lK.textContent = k1.toFixed(1);
  if (lB) lB.textContent = b.toFixed(2);
  draw();
}
