// ============================================================
// Attention Widget
//
// Matrices de atencion REALES de DeepESP/gpt2-spanish sobre la frase del
// modulo. Se puede recorrer las 12 capas y las 12 cabezas y ver que cada
// una aprendio un patron distinto.
//
// Dos vistas:
//   matriz -> el mapa de calor completo (fila = token que "mira",
//             columna = token "mirado")
//   arcos  -> para UN token, de donde saca su significado
//
// Los atajos van a cabezas concretas cuyo patron se encontro midiendo,
// no eligiendo a ojo:
//   capa 3  cabeza 4  -> token anterior (0.99)
//   capa 5  cabeza 10 -> "sentó" mira a "perro", su sujeto (0.889)
//   capa 5  cabeza 3  -> todos miran al primer token (0.98)
//   capa 11 cabeza 1  -> cada token se mira a si mismo (0.53)
//
// Es causal: la mitad superior esta vacia porque un LLM decoder-only
// solo puede mirar hacia atras.
// ============================================================

function initAttentionWidget() {
  const canvas = document.getElementById('attention-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof LLM4 === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const A = LLM4.attention;
  const TOK = A.tokens, n = TOK.length;
  let capa = 5, cabeza = 10, vista = 'matriz', foco = 4;   // 4 = "sentó"

  const M = () => A.att[capa][cabeza];

  function color(v) {
    if (v < 0.02) return 'rgba(168,162,144,0.05)';
    const t = Math.min(1, Math.pow(v, 0.6));
    return 'rgba(' + Math.round(88 + 167 * t) + ',' + Math.round(196 + 59 * t) + ',' +
      Math.round(221 - 221 * t) + ',' + (0.15 + 0.8 * t).toFixed(2) + ')';
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('capa ' + (capa + 1) + ' de ' + A.capas +
      '   ·   cabeza ' + (cabeza + 1) + ' de ' + A.cabezas +
      '   ·   ' + A.modelo, 14, 15);

    if (vista === 'matriz') dibujarMatriz(); else dibujarArcos();
    actualizarInfo();
  }

  function dibujarMatriz() {
    const m = M();
    const cw = 46, ch = 21, x0 = 118, y0 = 62;

    // etiquetas de columna (a quien se mira)
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.textAlign = 'center';
    TOK.forEach((t, j) => ctx.fillText(t, x0 + j * cw + cw / 2, y0 - 8));
    ctx.textAlign = 'left';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('← a qué token se mira', x0, y0 - 24);
    ctx.save();
    ctx.translate(20, y0 + n * ch / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('quién mira →', 0, 0);
    ctx.restore();

    for (let i = 0; i < n; i++) {
      ctx.textAlign = 'right';
      ctx.font = (i === foco ? 'bold ' : '') + '9.5px Fira Code, monospace';
      ctx.fillStyle = i === foco ? '#FFFF00' : 'rgba(236,230,208,0.85)';
      ctx.fillText(TOK[i], x0 - 8, y0 + i * ch + ch / 2 + 3);

      for (let j = 0; j < n; j++) {
        const x = x0 + j * cw, y = y0 + i * ch;
        if (j > i) {
          // mascara causal: el token i todavia no "existe" para j > i
          ctx.strokeStyle = 'rgba(168,162,144,0.10)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + ch - 2); ctx.lineTo(x + cw - 2, y + 2);
          ctx.stroke();
          continue;
        }
        ctx.fillStyle = color(m[i][j]);
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
        if (m[i][j] >= 0.10) {
          ctx.font = '8.5px Fira Code, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = m[i][j] > 0.5 ? '#1b1b2f' : 'rgba(236,230,208,0.9)';
          ctx.fillText(m[i][j].toFixed(2), x + cw / 2, y + ch / 2 + 3);
        }
      }
      if (i === foco) {
        ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5;
        ctx.strokeRect(x0, y0 + i * ch, (i + 1) * cw, ch);
      }
    }
    ctx.textAlign = 'left';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('la mitad tachada está vacía: un LLM solo puede mirar hacia atrás',
      x0, y0 + n * ch + 16);
  }

  function dibujarArcos() {
    const m = M()[foco];
    const y = 168, x0 = 30;
    // ancho de cada token proporcional a su texto
    ctx.font = '13px Fira Code, monospace';
    const anchos = TOK.map(t => ctx.measureText(t).width + 26);
    const total = anchos.reduce((a, b) => a + b, 0);
    const esc = Math.min(1, (W - 60) / total);
    const xs = []; let x = x0;
    anchos.forEach(a => { xs.push(x + a * esc / 2); x += a * esc; });

    // arcos desde el token en foco hacia los que mira
    TOK.forEach((t, j) => {
      if (j > foco || m[j] < 0.015) return;
      const alto = 30 + 90 * Math.min(1, Math.abs(foco - j) / n);
      ctx.strokeStyle = color(m[j]).replace(/[\d.]+\)$/, Math.min(0.95, 0.2 + m[j]).toFixed(2) + ')');
      ctx.lineWidth = Math.max(1, m[j] * 16);
      ctx.beginPath();
      ctx.moveTo(xs[foco], y - 12);
      ctx.bezierCurveTo(xs[foco], y - 12 - alto, xs[j], y - 12 - alto, xs[j], y - 12);
      ctx.stroke();
      if (m[j] > 0.08) {
        ctx.font = 'bold 9px Fira Code, monospace';
        ctx.fillStyle = '#FFFF00';
        ctx.textAlign = 'center';
        ctx.fillText((100 * m[j]).toFixed(0) + '%', (xs[foco] + xs[j]) / 2, y - 16 - alto / 1.6);
      }
    });

    // los tokens
    TOK.forEach((t, j) => {
      const w = anchos[j] * esc;
      const activo = j === foco, mirado = j <= foco && m[j] >= 0.015;
      ctx.fillStyle = activo ? 'rgba(255,255,0,0.20)'
        : mirado ? color(m[j]) : 'rgba(168,162,144,0.06)';
      ctx.fillRect(xs[j] - w / 2 + 3, y - 10, w - 6, 24);
      ctx.font = (activo ? 'bold ' : '') + '13px Fira Code, monospace';
      ctx.fillStyle = activo ? '#FFFF00' : mirado ? '#ece6d0' : 'rgba(168,162,144,0.45)';
      ctx.textAlign = 'center';
      ctx.fillText(t, xs[j], y + 7);
    });

    ctx.textAlign = 'left';
    ctx.font = '10.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('Al procesar "' + TOK[foco] + '", ¿de qué otros tokens toma su significado?',
      30, 44);
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('clic en un token para cambiar el foco', 30, y + 46);

    // ranking a la derecha
    const orden = m.slice(0, foco + 1).map((v, j) => [j, v]).sort((a, b) => b[1] - a[1]).slice(0, 4);
    ctx.font = '10px Fira Code, monospace';
    orden.forEach(([j, v], k) => {
      ctx.fillStyle = k === 0 ? '#FFFF00' : 'rgba(236,230,208,0.75)';
      ctx.textAlign = 'left';
      ctx.fillText((100 * v).toFixed(0).padStart(3) + '%  ' + TOK[j], 30, y + 70 + k * 15);
    });
  }

  function actualizarInfo() {
    const el = document.getElementById('attention-info');
    if (!el) return;
    const m = M();
    // que patron tiene ESTA cabeza, medido sobre la propia matriz
    let prev = 0, self_ = 0, first = 0;
    for (let i = 1; i < n; i++) { prev += m[i][i - 1]; self_ += m[i][i]; first += m[i][0]; }
    prev /= (n - 1); self_ /= (n - 1); first /= (n - 1);
    let patron = 'mezcla de varios', col = 'var(--c-text)';
    if (prev > 0.5) { patron = 'mira al token anterior'; col = 'var(--c-blue)'; }
    else if (first > 0.5) { patron = 'mira al primer token'; col = 'var(--c-orange)'; }
    else if (self_ > 0.35) { patron = 'se mira a sí mismo'; col = 'var(--c-purple)'; }
    else {
      // ¿los tokens miran lejos, saltandose al vecino y al primero? Eso es
      // una relacion de largo alcance: lo que el modulo llama "atencion"
      // en el ejemplo del verbo y su sujeto.
      let lejos = 0, cuenta = 0;
      for (let i = 2; i < n; i++) {
        const f = m[i].slice(0, i + 1);
        const j = f.indexOf(Math.max.apply(null, f));
        if (j !== i && j !== i - 1 && j !== 0) { lejos++; }
        cuenta++;
      }
      if (cuenta && lejos / cuenta >= 0.5) {
        patron = 'relación de largo alcance'; col = 'var(--c-green)';
      }
    }

    const fila = m[foco].slice(0, foco + 1);
    const mx = Math.max.apply(null, fila);
    const jm = fila.indexOf(mx);
    el.innerHTML =
      '<div class="widget-label"><span>Patrón de esta cabeza</span>' +
      '<span class="widget-value" style="color:' + col + ';">' + patron + '</span></div>' +
      '<div class="widget-label"><span>Token en foco</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' + TOK[foco] + '</span></div>' +
      '<div class="widget-label"><span>A quién mira más</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' + TOK[jm] +
      '  ' + (100 * mx).toFixed(0) + '%</span></div>' +
      '<div class="widget-label"><span>Cabezas en total</span>' +
      '<span class="widget-value">' + (A.capas * A.cabezas) + '  (' +
      A.capas + ' capas × ' + A.cabezas + ')</span></div>';
  }

  // ---- controles ----
  const sL = document.getElementById('att-capa'), lL = document.getElementById('att-capa-value');
  if (sL) sL.addEventListener('input', function () {
    capa = parseInt(this.value, 10); if (lL) lL.textContent = capa + 1; draw();
  });
  const sH = document.getElementById('att-cabeza'), lH = document.getElementById('att-cabeza-value');
  if (sH) sH.addEventListener('input', function () {
    cabeza = parseInt(this.value, 10); if (lH) lH.textContent = cabeza + 1; draw();
  });
  document.querySelectorAll('.att-vista-btn').forEach(b => {
    b.addEventListener('click', () => {
      vista = b.dataset.vista;
      document.querySelectorAll('.att-vista-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  // atajos a las cabezas cuyo patron se encontro midiendo
  document.querySelectorAll('.att-atajo-btn').forEach(b => {
    b.addEventListener('click', () => {
      capa = parseInt(b.dataset.capa, 10);
      cabeza = parseInt(b.dataset.cabeza, 10);
      if (b.dataset.foco) foco = parseInt(b.dataset.foco, 10);
      if (sL) { sL.value = capa; if (lL) lL.textContent = capa + 1; }
      if (sH) { sH.value = cabeza; if (lH) lH.textContent = cabeza + 1; }
      draw();
    });
  });

  canvas.addEventListener('click', e => {
    const rc = canvas.getBoundingClientRect();
    const mx = (e.clientX - rc.left) * (W / rc.width);
    const my = (e.clientY - rc.top) * (H / rc.height);
    if (vista === 'matriz') {
      const i = Math.floor((my - 62) / 21);
      if (i >= 0 && i < n) { foco = i; draw(); }
    } else {
      ctx.font = '13px Fira Code, monospace';
      const anchos = TOK.map(t => ctx.measureText(t).width + 26);
      const total = anchos.reduce((a, b) => a + b, 0);
      const esc = Math.min(1, (W - 60) / total);
      let x = 30;
      for (let j = 0; j < n; j++) {
        const w = anchos[j] * esc;
        if (mx >= x && mx < x + w) { foco = j; draw(); return; }
        x += w;
      }
    }
  });

  const iv = document.querySelector('.att-vista-btn[data-vista="matriz"]');
  if (iv) iv.classList.add('active');
  if (sL) { sL.value = capa; if (lL) lL.textContent = capa + 1; }
  if (sH) { sH.value = cabeza; if (lH) lH.textContent = cabeza + 1; }
  draw();
}
