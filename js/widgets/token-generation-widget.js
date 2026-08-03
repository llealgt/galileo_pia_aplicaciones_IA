// ============================================================
// Token Generation Widget
// Muestra el bucle de generacion de un LLM paso por paso, con
// distribuciones REALES de GPT-2 en espanol (ver llm-tree-data.js):
//   estado actual -> distribucion sobre el vocabulario -> muestreo
//   -> el token elegido se agrega y el ciclo vuelve a empezar.
//
// Los controles de temperatura y top-k transforman la distribucion
// de verdad (p^(1/T) renormalizado equivale a dividir los logits
// entre T), asi que se ve el efecto real de cada parametro.
// ============================================================

function initTokenGenerationWidget() {
  const canvas = document.getElementById('token-gen-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof LLM_TREE === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const RAMAS = 4;                 // tokens expandibles = maximo top-k
  const COLORES = ['#58C4DD', '#FF862F', '#83C167', '#E48BB0', '#9A72AC', '#5CD0B3'];

  let clave = 'sol';
  let camino = '';                 // que tokens se han elegido
  let generados = [];              // [{t, p, idx}]
  let temperatura = 1.0;
  let topK = 4;
  let corrida = 1;
  let ultimoMuestreo = null;       // para dibujar la ruleta del muestreo
  let timer = null;

  function nodo() { return LLM_TREE[clave].nodos[camino]; }
  function terminado() { return !LLM_TREE[clave].nodos[camino + '0']; }

  // p^(1/T) renormalizado sobre los primeros topK candidatos.
  // T = 0 es el caso limite: toda la masa al mas probable (greedy),
  // que es lo que hace temperature=0 en las APIs reales.
  function distribucionAjustada() {
    const d = nodo();
    if (!d) return [];
    const cand = d.slice(0, Math.min(topK, RAMAS));
    if (temperatura < 0.02) {
      return cand.map((o, i) => ({ t: o.t, base: o.p, q: i === 0 ? 1 : 0, i }));
    }
    const w = cand.map(o => Math.pow(o.p, 1 / temperatura));
    const s = w.reduce((a, b) => a + b, 0);
    return cand.map((o, i) => ({ t: o.t, base: o.p, q: w[i] / s, i }));
  }

  function visible(t) {
    return t.replace(/\n/g, '⏎').replace(/ /g, '·');
  }

  function siguiente() {
    if (terminado()) return;
    const aj = distribucionAjustada();
    const r = Math.random();
    let acc = 0, elegido = aj[aj.length - 1];
    for (const o of aj) { acc += o.q; if (r <= acc) { elegido = o; break; } }
    ultimoMuestreo = { r, aj };
    generados.push({ t: elegido.t, p: elegido.base, q: elegido.q, idx: elegido.i });
    camino += String(elegido.i);
    draw();
  }

  function reiniciar(nuevaCorrida) {
    if (timer) { clearInterval(timer); timer = null; }
    camino = ''; generados = []; ultimoMuestreo = null;
    if (nuevaCorrida) corrida++;
    draw();
  }

  function generarTodo() {
    if (timer) { clearInterval(timer); timer = null; }
    reiniciar(true);
    timer = setInterval(() => {
      if (terminado()) { clearInterval(timer); timer = null; return; }
      siguiente();
    }, 700);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ---------- texto generado ----------
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Secuencia de entrada (prompt + tokens ya generados)', 12, 18);

    ctx.font = '13px Fira Code, monospace';
    let x = 12, y = 42;
    ctx.fillStyle = '#ece6d0';
    const prompt = LLM_TREE[clave].prompt;
    ctx.fillText(prompt, x, y);
    x += ctx.measureText(prompt).width + 4;

    generados.forEach((g, k) => {
      const txt = visible(g.t);
      const w = ctx.measureText(txt).width;
      if (x + w > W - 20) { x = 12; y += 24; }
      ctx.fillStyle = COLORES[k % COLORES.length];
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x - 2, y - 13, w + 4, 18);
      ctx.globalAlpha = 1;
      ctx.fillStyle = COLORES[k % COLORES.length];
      ctx.fillText(txt, x, y);
      x += w + 4;
    });

    // cursor
    if (!terminado()) {
      ctx.fillStyle = 'rgba(255,255,0,0.8)';
      ctx.fillRect(x, y - 12, 8, 15);
    }

    const yBase = 92;

    if (terminado()) {
      ctx.fillStyle = '#83C167';
      ctx.font = '12px Fira Code, monospace';
      ctx.fillText('fin de la demo (el arbol precalculado llega hasta 4 tokens)', 12, yBase + 20);
      actualizarInfo(null);
      return;
    }

    // ---------- distribucion ----------
    const d = nodo();
    const aj = distribucionAjustada();
    const qDe = {};
    aj.forEach(o => { qDe[o.i] = o.q; });

    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.textAlign = 'left';
    ctx.fillText('Distribución de probabilidad sobre el siguiente token', 12, yBase - 8);
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.fillText('top 8 de un vocabulario de 50,257 tokens', 12, yBase + 5);

    const bx = 130, bw = 340, fila = 21;
    d.forEach((o, i) => {
      const yy = yBase + 22 + i * fila;
      const dentro = i < Math.min(topK, RAMAS);

      ctx.textAlign = 'right';
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.35)';
      ctx.fillText("'" + visible(o.t) + "'", bx - 8, yy + 4);

      // barra: probabilidad original
      ctx.fillStyle = dentro ? 'rgba(88,196,221,0.35)' : 'rgba(168,162,144,0.15)';
      ctx.fillRect(bx, yy - 6, Math.max(1, o.p * bw), 12);

      // barra: probabilidad tras temperatura + top-k
      if (dentro) {
        ctx.fillStyle = COLORES[generados.length % COLORES.length];
        ctx.fillRect(bx, yy - 6, Math.max(1, qDe[i] * bw), 12);
      }

      ctx.textAlign = 'left';
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.35)';
      const txt = dentro
        ? (o.p * 100).toFixed(1) + '%  →  ' + (qDe[i] * 100).toFixed(1) + '%'
        : (o.p * 100).toFixed(1) + '%  (fuera de top-k)';
      ctx.fillText(txt, bx + Math.max(1, o.p * bw) + 8, yy + 3.5);
    });

    // leyenda de las dos barras
    ctx.font = '8.5px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(88,196,221,0.6)';
    ctx.fillRect(bx, yBase + 22 + 8 * fila + 2, 9, 9);
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('probabilidad del modelo', bx + 13, yBase + 22 + 8 * fila + 10);
    ctx.fillStyle = COLORES[generados.length % COLORES.length];
    ctx.fillRect(bx + 175, yBase + 22 + 8 * fila + 2, 9, 9);
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('tras temperatura y top-k', bx + 188, yBase + 22 + 8 * fila + 10);

    // ---------- la ruleta del muestreo ----------
    const rx = 560, rw = W - rx - 24;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Muestreo: se tira un dado en [0,1)', rx, yBase);

    let acc = 0;
    aj.forEach((o, i) => {
      const x0 = rx + acc * rw, x1 = rx + (acc + o.q) * rw;
      ctx.fillStyle = COLORES[i % COLORES.length];
      ctx.globalAlpha = 0.8;
      ctx.fillRect(x0, yBase + 26, Math.max(1, x1 - x0), 26);
      ctx.globalAlpha = 1;
      if (o.q > 0.08) {
        ctx.fillStyle = '#1b1b2f';
        ctx.font = 'bold 9px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(visible(o.t).slice(0, 7), (x0 + x1) / 2, yBase + 43);
      }
      acc += o.q;
    });

    if (ultimoMuestreo) {
      const px = rx + ultimoMuestreo.r * rw;
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(px, yBase + 18); ctx.lineTo(px, yBase + 58); ctx.stroke();
      ctx.fillStyle = '#FFFF00';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('dado = ' + ultimoMuestreo.r.toFixed(3), px, yBase + 70);
    } else {
      ctx.fillStyle = 'rgba(168,162,144,0.6)';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('presiona "Siguiente token"', rx, yBase + 70);
    }

    // texto explicativo del ciclo
    ctx.textAlign = 'left';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('1. procesar la secuencia', rx, yBase + 100);
    ctx.fillText('2. calcular probabilidades', rx, yBase + 116);
    ctx.fillText('3. muestrear un token', rx, yBase + 132);
    ctx.fillText('4. agregarlo y repetir', rx, yBase + 148);

    actualizarInfo(aj);
  }

  function actualizarInfo(aj) {
    const el = document.getElementById('token-gen-info');
    if (!el) return;
    const texto = LLM_TREE[clave].prompt + generados.map(g => g.t).join('');
    el.innerHTML =
      '<div class="widget-label"><span>Corrida</span><span class="widget-value">#' + corrida + '</span></div>' +
      '<div class="widget-label"><span>Tokens generados</span><span class="widget-value">' +
      generados.length + '</span></div>' +
      '<div class="widget-label" style="grid-column:1/-1;"><span>Texto</span>' +
      '<span class="widget-value" style="color:var(--c-yellow); font-size:0.9em;">' +
      texto.replace(/\n/g, '⏎') + '</span></div>';
  }

  // ---------- controles ----------
  document.querySelectorAll('.tg-prompt-btn').forEach(b => {
    b.addEventListener('click', () => {
      clave = b.dataset.prompt;
      document.querySelectorAll('.tg-prompt-btn').forEach(x => x.classList.toggle('active', x === b));
      corrida = 1; reiniciar(false);
    });
  });
  const sT = document.getElementById('token-gen-temp');
  const lT = document.getElementById('token-gen-temp-value');
  if (sT) sT.addEventListener('input', function () {
    temperatura = parseFloat(this.value);
    if (lT) lT.textContent = temperatura < 0.02 ? '0 (greedy)' : temperatura.toFixed(2);
    draw();
  });
  const sK = document.getElementById('token-gen-topk');
  const lK = document.getElementById('token-gen-topk-value');
  if (sK) sK.addEventListener('input', function () {
    topK = parseInt(this.value, 10);
    if (lK) lK.textContent = topK;
    draw();
  });
  const bN = document.getElementById('token-gen-next');
  if (bN) bN.addEventListener('click', () => { if (timer) { clearInterval(timer); timer = null; } siguiente(); });
  const bA = document.getElementById('token-gen-all');
  if (bA) bA.addEventListener('click', generarTodo);
  const bR = document.getElementById('token-gen-reset');
  if (bR) bR.addEventListener('click', () => reiniciar(true));

  const inicial = document.querySelector('.tg-prompt-btn[data-prompt="sol"]');
  if (inicial) inicial.classList.add('active');
  if (lT) lT.textContent = temperatura.toFixed(2);
  if (lK) lK.textContent = topK;

  draw();
}
