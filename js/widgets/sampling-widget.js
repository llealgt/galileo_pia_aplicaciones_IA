// ============================================================
// Sampling Widget
//
// Muestra los cuatro controles de muestreo actuando sobre distribuciones
// REALES de siguiente token (DeepESP/gpt2-spanish):
//
//   temperatura -> reescala:  p^(1/T) renormalizado
//   top-k       -> se queda con los k mas probables, siempre k
//   top-p       -> se queda con los que acumulen p, cuantos hagan falta
//   penalizacion de repeticion -> divide el puntaje de tokens ya usados
//
// El punto que el modulo quiere dejar claro es la ADAPTATIVIDAD: con el
// mismo top-p = 0.85, la distribucion picuda admite 2 tokens y la plana
// mas de 40. Top-k admite k en las dos, que es demasiado en un caso y
// demasiado poco en el otro. Los tres prompts se eligieron midiendo la
// entropia sobre 9 candidatos.
// ============================================================

function initSamplingWidget() {
  const canvas = document.getElementById('sampling-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof LLM4 === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const D = LLM4.sampling;
  let di = 0, temp = 1.0, topk = 40, topp = 1.0, penal = 1.0;
  const MOSTRAR = 14;

  // Tokens "ya usados" para la penalizacion de repeticion: se toman del
  // propio prompt, que es exactamente lo que hace la API de verdad.
  function yaUsados() {
    const p = D[di].prompt.toLowerCase();
    return D[di].tokens.map(t => p.indexOf(t.trim().toLowerCase()) >= 0 && t.trim().length > 2);
  }

  // Aplica los cuatro controles en el mismo orden que las librerias:
  // penalizacion -> temperatura -> top-k -> top-p -> renormalizar
  function procesar() {
    const base = D[di].probs.slice();
    const rep = yaUsados();
    let p = base.map((v, i) => (penal > 1 && rep[i]) ? v / penal : v);
    if (temp < 0.02) {
      const mx = Math.max.apply(null, p);
      p = p.map(v => (v === mx ? 1 : 0));
    } else {
      p = p.map(v => Math.pow(v, 1 / temp));
    }
    // Se renormaliza contando TAMBIEN la cola que no se guardo (`resto`).
    // Sin esto, los 40 tokens guardados se repartirian el 100% y las
    // probabilidades saldrian infladas: "Blanca" pasaria de 0.831 a 0.870 y
    // el corte de top-p = 0.85 dejaria 1 token en vez de los 2 reales.
    // A temperatura 1 esto devuelve exactamente la distribucion del modelo.
    const s0 = p.reduce((a, b) => a + b, 0) + D[di].resto;
    p = p.map(v => v / s0);

    // orden por probabilidad ya procesada
    const idx = p.map((v, i) => i).sort((a, b) => p[b] - p[a]);
    const vivo = new Array(p.length).fill(false);
    let acc = 0, nTopP = 0;
    idx.forEach((i, r) => {
      if (p[i] <= 1e-9) return;                    // ya lo mato la temperatura
      if (r >= topk) return;                       // fuera por top-k
      if (acc >= topp) return;                     // fuera por top-p
      vivo[i] = true; acc += p[i]; nTopP++;
    });
    const sv = idx.filter(i => vivo[i]).reduce((a, i) => a + p[i], 0);
    const fin = p.map((v, i) => vivo[i] ? v / sv : 0);
    return { base: base, proc: p, fin: fin, vivo: vivo, idx: idx,
             nVivos: nTopP, rep: rep };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const S = procesar();
    const d = D[di];

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Prompt', 14, 15);
    ctx.font = 'bold 12.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('"' + d.prompt + ' ___"', 62, 15);

    const x0 = 14, y0 = 38, bw = (W - 32) / MOSTRAR, alto = 104;
    const mx = Math.max.apply(null, S.idx.slice(0, MOSTRAR).map(i => S.fin[i] || S.proc[i]));

    let accum = 0;
    S.idx.slice(0, MOSTRAR).forEach((i, r) => {
      const x = x0 + r * bw;
      const vivo = S.vivo[i];
      // barra gris de fondo: la probabilidad ORIGINAL del modelo
      const hb = (S.base[i] / Math.max.apply(null, S.base)) * alto;
      ctx.fillStyle = 'rgba(168,162,144,0.14)';
      ctx.fillRect(x + 3, y0 + alto - hb, bw - 8, hb);
      // barra de color: la probabilidad ya procesada
      const hp = ((vivo ? S.fin[i] : S.proc[i]) / mx) * alto;
      ctx.fillStyle = vivo ? (S.rep[i] && penal > 1 ? '#FF862F' : '#58C4DD')
        : 'rgba(252,98,85,0.30)';
      ctx.fillRect(x + 3, y0 + alto - hp, bw - 8, hp);

      if (vivo) { accum += S.fin[i]; }

      ctx.save();
      ctx.translate(x + bw / 2, y0 + alto + 6);
      ctx.rotate(-Math.PI / 3.2);
      ctx.textAlign = 'right';
      ctx.font = (vivo ? 'bold ' : '') + '9.5px Fira Code, monospace';
      ctx.fillStyle = vivo ? '#ece6d0' : 'rgba(168,162,144,0.4)';
      // recortar los tokens largos: rotados se salen del lienzo
      let et = d.tokens[i].trim() || '␠';
      if (et.length > 9) et = et.slice(0, 8) + '…';
      ctx.fillText(et, 0, 0);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.font = '8.5px Fira Code, monospace';
      ctx.fillStyle = vivo ? 'rgba(236,230,208,0.9)' : 'rgba(168,162,144,0.35)';
      const v = vivo ? S.fin[i] : S.proc[i];
      if (v > 0.004) ctx.fillText((100 * v).toFixed(0) + '%', x + bw / 2, y0 + alto - hp - 4);
    });

    // linea de corte de top-k
    if (topk < MOSTRAR) {
      const xk = x0 + topk * bw;
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#9A72AC'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xk, y0 - 4); ctx.lineTo(xk, y0 + alto); ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.fillStyle = '#9A72AC';
      ctx.fillText('top-k = ' + topk, xk + 4, y0 + 6);
    }
    // linea de corte de top-p
    if (S.nVivos < MOSTRAR && topp < 1) {
      const xp = x0 + S.nVivos * bw;
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#83C167'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xp, y0 - 4); ctx.lineTo(xp, y0 + alto); ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.fillStyle = '#83C167';
      ctx.fillText('top-p → ' + S.nVivos + ' tokens', xp + 4, y0 + 20);
    }

    // leyenda
    ctx.textAlign = 'right';
    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('gris = distribución original del modelo', W - 14, 15);

    // suma acumulada de los sobrevivientes
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('Sobreviven ' + S.nVivos + ' de ' + D[di].probs.length +
      ' tokens; su probabilidad se renormaliza para sumar 100%', 14, H - 10);

    actualizarInfo(S);
  }

  function actualizarInfo(S) {
    const el = document.getElementById('sampling-info');
    if (!el) return;
    // cuantos tokens harian falta para acumular topp, sobre la distribucion
    // ORIGINAL: es la medida de "que tan seguro esta el modelo"
    let acc = 0, n85 = 0;
    for (const v of D[di].probs) { acc += v; n85++; if (acc >= 0.85) break; }
    const seguro = D[di].probs[0];
    el.innerHTML =
      '<div class="widget-label"><span>Confianza del modelo (top-1)</span>' +
      '<span class="widget-value" style="color:' +
      (seguro > 0.5 ? 'var(--c-green)' : seguro > 0.2 ? 'var(--c-yellow)' : 'var(--c-red)') +
      ';">' + (100 * seguro).toFixed(1) + '%</span></div>' +
      '<div class="widget-label"><span>Tokens candidatos ahora</span>' +
      '<span class="widget-value" style="color:var(--c-blue);">' + S.nVivos + '</span></div>' +
      '<div class="widget-label"><span>Para acumular 85% hacen falta</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' +
      (acc >= 0.85 ? n85 + ' tokens' : 'más de ' + D[di].probs.length) + '</span></div>' +
      '<div class="widget-label"><span>Token más probable</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' +
      (D[di].tokens[S.idx[0]] || '').trim() + '</span></div>';
  }

  document.querySelectorAll('.samp-dist-btn').forEach(b => {
    b.addEventListener('click', () => {
      di = parseInt(b.dataset.d, 10);
      document.querySelectorAll('.samp-dist-btn').forEach(x => x.classList.toggle('active', x === b));
      draw();
    });
  });
  const par = [['samp-temp', v => { temp = v / 100; }, v => (v / 100).toFixed(2)],
               ['samp-topk', v => { topk = v; }, v => String(v)],
               ['samp-topp', v => { topp = v / 100; }, v => (v / 100).toFixed(2)],
               ['samp-penal', v => { penal = v / 100; }, v => (v / 100).toFixed(2)]];
  par.forEach(([id, set, fmt]) => {
    const s = document.getElementById(id), l = document.getElementById(id + '-value');
    if (!s) return;
    s.addEventListener('input', function () {
      set(parseInt(this.value, 10));
      if (l) l.textContent = fmt(parseInt(this.value, 10));
      draw();
    });
    if (l) l.textContent = fmt(parseInt(s.value, 10));
  });

  const ini = document.querySelector('.samp-dist-btn[data-d="0"]');
  if (ini) ini.classList.add('active');
  draw();
}
