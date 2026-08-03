// ============================================================
// Token Generation Widget
// Muestra el bucle de generacion de un LLM paso por paso con datos
// REALES (ver llm-trie-data.js): estado actual -> distribucion sobre
// el vocabulario -> muestreo -> el token elegido se agrega y vuelve
// a empezar. Genera hasta 18 tokens, suficiente para frases con
// sentido.
//
// temperatura y top-k transforman la distribucion de verdad
// (p^(1/T) renormalizado equivale a dividir los logits entre T).
// T = 0 es el caso limite greedy, como temperature=0 en las APIs.
// ============================================================

function initTokenGenerationWidget() {
  const canvas = document.getElementById('token-gen-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof LLM_TRIE === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const COL = ['#58C4DD', '#FF862F', '#83C167', '#E48BB0', '#9A72AC', '#5CD0B3'];
  const MAX_TOKENS = 18;

  let clave = 'sol';
  let nodo = '0';
  let generados = [];
  let temperatura = 1.0;
  let topK = 6;
  let corrida = 1;
  let ultimoDado = null;
  let timer = null;

  const info = () => LLM_TRIE[clave].n[nodo];
  const terminado = () => {
    const i = info();
    return !i || Object.keys(i[1]).length === 0 || generados.length >= MAX_TOKENS;
  };

  // Candidatos = los del top-6 que estan expandidos en el trie, limitados
  // por top-k, con temperatura aplicada y renormalizados.
  function candidatos() {
    const i = info();
    if (!i) return [];
    const [disp, hijos] = i;
    const dentroK = Object.keys(hijos).map(Number).filter(j => j < topK).sort((a, b) => a - b);
    const usar = dentroK.length ? dentroK : [Math.min.apply(null, Object.keys(hijos).map(Number))];
    if (temperatura < 0.02) {
      return usar.map((j, k) => ({ j, t: disp[j][0], base: disp[j][1], q: k === 0 ? 1 : 0 }));
    }
    const w = usar.map(j => Math.pow(disp[j][1], 1 / temperatura));
    const s = w.reduce((a, b) => a + b, 0);
    return usar.map((j, k) => ({ j, t: disp[j][0], base: disp[j][1], q: w[k] / s }));
  }

  const vis = t => t.replace(/\n/g, '⏎');

  function siguiente() {
    if (terminado()) return;
    const cs = candidatos();
    if (!cs.length) return;
    const r = Math.random();
    let acc = 0, el = cs[cs.length - 1];
    for (const c of cs) { acc += c.q; if (r <= acc) { el = c; break; } }
    ultimoDado = { r, cs };
    generados.push({ t: el.t, p: el.base });
    nodo = String(info()[1][String(el.j)]);
    draw();
  }

  function reiniciar(nueva) {
    if (timer) { clearInterval(timer); timer = null; }
    nodo = '0'; generados = []; ultimoDado = null;
    if (nueva) corrida++;
    draw();
  }

  function generarTodo() {
    reiniciar(true);
    timer = setInterval(() => {
      if (terminado()) { clearInterval(timer); timer = null; draw(); return; }
      siguiente();
    }, 260);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ---------------- texto generado ----------------
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Secuencia: prompt + tokens generados  (' + generados.length + '/' + MAX_TOKENS + ')', 14, 18);

    ctx.font = '15px Fira Code, monospace';
    const maxX = W - 18;
    let x = 14, y = 44;
    const prompt = LLM_TRIE[clave].p;
    ctx.fillStyle = '#ece6d0';
    ctx.fillText(prompt, x, y);
    x += ctx.measureText(prompt).width;

    generados.forEach((g, k) => {
      const txt = vis(g.t);
      const w = ctx.measureText(txt).width;
      if (x + w > maxX) { x = 14; y += 23; }
      const c = COL[k % COL.length];
      ctx.fillStyle = c; ctx.globalAlpha = 0.22;
      ctx.fillRect(x - 1, y - 13, w + 2, 19);
      ctx.globalAlpha = 1;
      ctx.fillStyle = c;
      ctx.fillText(txt, x, y);
      x += w;
    });
    if (!terminado()) {
      ctx.fillStyle = 'rgba(255,255,0,0.85)';
      ctx.fillRect(x + 2, y - 12, 9, 16);
    }

    const yb = 118;

    if (terminado()) {
      ctx.fillStyle = '#83C167';
      ctx.font = '14px Fira Code, monospace';
      ctx.fillText(generados.length >= MAX_TOKENS
        ? 'Se alcanzó max_tokens = ' + MAX_TOKENS
        : 'Fin de la secuencia', 14, yb + 24);
      ctx.fillStyle = 'rgba(168,162,144,0.85)';
      ctx.font = '12px Fira Code, monospace';
      ctx.fillText('Presiona "Otra corrida": con la misma configuración, el texto será distinto.', 14, yb + 50);
      actualizarInfo();
      return;
    }

    // ---------------- distribucion ----------------
    const par = info();
    const disp = par[0], hijos = par[1];
    const cs = candidatos();
    const qDe = {}; cs.forEach(c => { qDe[c.j] = c.q; });

    ctx.textAlign = 'left';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Distribución sobre el siguiente token', 14, yb);
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('top 6 de un vocabulario de 50,257', 14, yb + 15);

    const bx = 150, bw = 235, fila = 24;
    disp.forEach((o, j) => {
      const yy = yb + 46 + j * fila;
      const dentro = qDe[j] !== undefined;

      ctx.textAlign = 'right';
      ctx.font = 'bold 13px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.3)';
      ctx.fillText("'" + vis(o[0]) + "'", bx - 10, yy + 5);

      ctx.fillStyle = dentro ? 'rgba(88,196,221,0.3)' : 'rgba(168,162,144,0.12)';
      ctx.fillRect(bx, yy - 8, Math.max(2, o[1] * bw), 16);
      if (dentro) {
        ctx.fillStyle = COL[generados.length % COL.length];
        ctx.fillRect(bx, yy - 8, Math.max(2, qDe[j] * bw), 16);
      }

      ctx.textAlign = 'left';
      ctx.font = '12px Fira Code, monospace';
      ctx.fillStyle = dentro ? '#ece6d0' : 'rgba(168,162,144,0.3)';
      const ancho = Math.max(2, Math.max(o[1], dentro ? qDe[j] : 0) * bw);
      ctx.fillText(dentro
        ? (o[1] * 100).toFixed(1) + '% → ' + (qDe[j] * 100).toFixed(1) + '%'
        : (o[1] * 100).toFixed(1) + '%',
        bx + ancho + 10, yy + 4.5);
    });

    const yLeg = yb + 46 + 6 * fila;
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(88,196,221,0.55)';
    ctx.fillRect(bx, yLeg - 8, 11, 11);
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('del modelo', bx + 16, yLeg + 1);
    ctx.fillStyle = COL[generados.length % COL.length];
    ctx.fillRect(bx + 115, yLeg - 8, 11, 11);
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('tras T y top-k', bx + 131, yLeg + 1);

    // ---------------- ruleta del muestreo ----------------
    const rx = 545, rw = W - rx - 20;
    ctx.textAlign = 'left';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Muestreo: un dado en [0,1)', rx, yb);

    let acc = 0;
    cs.forEach((c, i) => {
      const x0 = rx + acc * rw, x1 = rx + (acc + c.q) * rw;
      ctx.fillStyle = COL[i % COL.length];
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x0, yb + 22, Math.max(1, x1 - x0), 30);
      ctx.globalAlpha = 1;
      if (c.q > 0.12) {
        ctx.fillStyle = '#1b1b2f';
        ctx.font = 'bold 11px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(vis(c.t).trim().slice(0, 8), (x0 + x1) / 2, yb + 41);
      }
      acc += c.q;
    });

    ctx.textAlign = 'left';
    if (ultimoDado) {
      const px = rx + ultimoDado.r * rw;
      ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, yb + 14); ctx.lineTo(px, yb + 60); ctx.stroke();
      ctx.fillStyle = '#FFFF00';
      ctx.font = '11px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('dado = ' + ultimoDado.r.toFixed(3), px, yb + 75);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = 'rgba(168,162,144,0.65)';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillText('presiona "Siguiente token"', rx, yb + 74);
    }

    ctx.font = '11.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ['1. procesar la secuencia', '2. calcular probabilidades',
      '3. muestrear un token', '4. agregarlo y repetir'].forEach((t, i) => {
        ctx.fillText(t, rx, yb + 106 + i * 19);
      });

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('token-gen-info');
    if (!el) return;
    const texto = LLM_TRIE[clave].p + generados.map(g => g.t).join('');
    el.innerHTML =
      '<div class="widget-label"><span>Corrida</span><span class="widget-value">#' + corrida + '</span></div>' +
      '<div class="widget-label"><span>Tokens</span><span class="widget-value">' +
      generados.length + ' / ' + MAX_TOKENS + '</span></div>';
  }

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
    if (lT) lT.textContent = temperatura < 0.02 ? '0' : temperatura.toFixed(2);
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

  const ini = document.querySelector('.tg-prompt-btn[data-prompt="sol"]');
  if (ini) ini.classList.add('active');
  if (lT) lT.textContent = temperatura.toFixed(2);
  if (lK) lK.textContent = topK;

  draw();
}
