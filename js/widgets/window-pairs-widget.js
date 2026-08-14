// ============================================================
// La ventana deslizante de Word2Vec
// Genera los pares de entrenamiento DE VERDAD: el algoritmo esta
// implementado aqui, no hay tabla precalculada. Mover la ventana o
// cambiar el radio recalcula los pares y el total de la frase.
//
// Sirve para el punto que el texto no transmite: la etiqueta no la
// pone nadie, la produce la posicion. Una frase de 9 palabras con
// radio 2 da 28 pares, y ese numero sale de contar, no de memoria.
// ============================================================

const W2V_FRASE = ['el', 'gato', 'negro', 'duerme', 'en', 'el', 'sofá', 'de', 'la', 'sala'];

// --- nucleo del algoritmo, fuera de la funcion para poder probarlo en Node ---
function w2vPares(palabras, centro, radio) {
  const ctx = [];
  for (let j = Math.max(0, centro - radio);
           j <= Math.min(palabras.length - 1, centro + radio); j++) {
    if (j !== centro) ctx.push({ j, p: palabras[j] });
  }
  return ctx;
}

function w2vTotal(palabras, radio) {
  let n = 0;
  for (let i = 0; i < palabras.length; i++) n += w2vPares(palabras, i, radio).length;
  return n;
}

function initWindowPairsWidget() {
  const canvas = document.getElementById('w2v-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMAR = '#FFFF00',
        AZUL = '#58C4DD', VERDE = '#83C167';

  let centro = 3;
  let radio = 2;
  let modo = 'skip';        // 'skip' | 'cbow'
  let auto = true;
  let ultimo = 0;

  const P = W2V_FRASE;

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const pares = w2vPares(P, centro, radio);
    const dentro = new Set(pares.map(o => o.j));

    // ---- la frase ----
    ctx.font = '15px Fira Code, monospace';
    const anchos = P.map(p => ctx.measureText(p).width + 20);
    const total = anchos.reduce((a, b) => a + b, 0) + (P.length - 1) * 6;
    let x = (W - total) / 2;
    const y = 74;

    // banda de la ventana
    const i0 = Math.max(0, centro - radio), i1 = Math.min(P.length - 1, centro + radio);
    let xa = x, xb = x;
    for (let k = 0; k < i0; k++) xa += anchos[k] + 6;
    xb = xa;
    for (let k = i0; k <= i1; k++) xb += anchos[k] + 6;
    ctx.fillStyle = 'rgba(255,255,0,0.06)';
    ctx.fillRect(xa - 4, y - 30, xb - xa - 2, 52);
    ctx.strokeStyle = 'rgba(255,255,0,0.35)';
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
    ctx.strokeRect(xa - 4, y - 30, xb - xa - 2, 52);
    ctx.setLineDash([]);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = 'rgba(255,255,0,0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(`ventana  radio ${radio}`, xa - 4, y - 38);

    // las palabras
    P.forEach((p, i) => {
      const w = anchos[i];
      const esCentro = i === centro;
      if (esCentro) {
        ctx.fillStyle = 'rgba(255,255,0,0.3)';
        ctx.fillRect(x, y - 20, w, 32);
        ctx.strokeStyle = AMAR; ctx.lineWidth = 1.6;
        ctx.strokeRect(x, y - 20, w, 32);
      } else if (dentro.has(i)) {
        ctx.fillStyle = 'rgba(88,196,221,0.16)';
        ctx.fillRect(x, y - 20, w, 32);
      }
      ctx.font = (esCentro ? 'bold ' : '') + '15px Fira Code, monospace';
      ctx.fillStyle = esCentro ? AMAR : (dentro.has(i) ? AZUL : DIM);
      ctx.textAlign = 'center';
      ctx.fillText(p, x + w / 2, y + 2);
      x += w + 6;
    });

    // ---- los pares generados ----
    ctx.textAlign = 'left';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    const etq = modo === 'skip'
      ? 'skip-gram — del centro a cada vecina:'
      : 'CBOW — de las vecinas al centro:';
    ctx.fillText(etq, 60, 128);

    ctx.font = '14px Fira Code, monospace';
    let py = 154;
    pares.forEach((o, k) => {
      const px = 60 + (k % 2) * 300;
      if (k % 2 === 0 && k > 0) py += 26;
      ctx.fillStyle = modo === 'skip' ? AMAR : AZUL;
      ctx.fillText(modo === 'skip' ? P[centro] : o.p, px, py);
      ctx.fillStyle = DIM;
      ctx.fillText('→', px + 92, py);
      ctx.fillStyle = modo === 'skip' ? AZUL : AMAR;
      ctx.fillText(modo === 'skip' ? o.p : P[centro], px + 118, py);
    });

    // ---- contadores ----
    const x0 = 648;
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('en esta posición', x0, 128);
    ctx.font = 'bold 30px Fira Code, monospace';
    ctx.fillStyle = VERDE;
    ctx.fillText(String(pares.length), x0, 160);
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('pares', x0 + (pares.length > 9 ? 44 : 26), 160);

    ctx.fillText('en toda la frase', x0, 196);
    ctx.font = 'bold 30px Fira Code, monospace';
    ctx.fillStyle = AMAR;
    const tot = w2vTotal(P, radio);
    ctx.fillText(String(tot), x0, 228);
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('pares', x0 + (tot > 99 ? 62 : 44), 228);

    ctx.font = 'italic 12px Lora, serif';
    ctx.fillStyle = DIM;
    envolver(`${P.length} palabras, sin una sola etiqueta escrita a mano.`,
             x0, 258, 210, 16);

    // pie
    ctx.font = '11px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('la etiqueta no la pone nadie: la produce la posición', W / 2, H - 12);
  }

  function envolver(txt, x, y, ancho, alto) {
    const pal = txt.split(' ');
    let linea = '', yy = y;
    pal.forEach(w => {
      const pr = linea ? linea + ' ' + w : w;
      if (ctx.measureText(pr).width > ancho && linea) {
        ctx.fillText(linea, x, yy); yy += alto; linea = w;
      } else linea = pr;
    });
    if (linea) ctx.fillText(linea, x, yy);
  }

  function bind(id, fn) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => { fn(b); dibujar(); });
  }
  bind('w2v-prev', () => { centro = (centro - 1 + P.length) % P.length; auto = false; });
  bind('w2v-next', () => { centro = (centro + 1) % P.length; auto = false; });
  bind('w2v-radio', b => {
    radio = radio % 3 + 1;
    b.textContent = `radio ${radio}`;
  });
  bind('w2v-modo', b => {
    modo = modo === 'skip' ? 'cbow' : 'skip';
    b.textContent = modo === 'skip' ? 'skip-gram' : 'CBOW';
  });
  bind('w2v-auto', b => {
    auto = !auto;
    b.textContent = auto ? '⏸ pausar' : '▶ recorrer';
  });

  function tick(t) {
    if (auto && t - ultimo > 1100) {
      centro = (centro + 1) % P.length;
      ultimo = t;
      dibujar();
    }
    requestAnimationFrame(tick);
  }
  dibujar();
  requestAnimationFrame(tick);
}
