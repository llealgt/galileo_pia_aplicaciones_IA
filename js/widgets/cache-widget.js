// ============================================================
// Semantic Cache Widget
//
// Un cache semantico responde sin llamar al LLM cuando la consulta nueva
// se parece bastante a una ya respondida. Todo depende del UMBRAL, y ese
// es justo el problema: bajarlo sube la tasa de aciertos y tambien la de
// respuestas EQUIVOCADAS.
//
// Los cosenos son reales (paraphrase-multilingual-MiniLM-L12-v2) entre
// consultas nuevas y un cache de 12 consultas. Cuatro de las seis nuevas
// NO tienen respuesta valida en el cache y deberian dejarse pasar.
//
// Lo medido: los dos aciertos legitimos estan en 0.831 y 0.888, pero hay
// dos falsos positivos en 0.678 y 0.672. Con umbral 0.65 el sistema
// contesta el costo del ENVIO a quien pregunta por el costo de la
// DEVOLUCION. Con 0.80 no se equivoca, pero solo acierta 2 de 6.
// ============================================================

function initCacheWidget() {
  const canvas = document.getElementById('cache-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof PROD5 === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const C = PROD5.cache;
  const NUE = C.nuevas, CAC = C.cacheadas;
  let umbral = 0.80, sel = 0;

  // Para cada consulta nueva: cual es su mejor pareja en el cache y si
  // ese acierto seria correcto o un error servido al usuario.
  function estado() {
    return NUE.map(q => {
      let mejor = 0;
      q.sim.forEach((v, i) => { if (v > q.sim[mejor]) mejor = i; });
      const acierta = q.sim[mejor] >= umbral;
      const correcto = q.esperada >= 0 && mejor === q.esperada;
      return { q: q, mejor: mejor, val: q.sim[mejor], acierta: acierta,
               correcto: correcto,
               // servir del cache algo que no responde la pregunta
               danino: acierta && !correcto,
               // dejar pasar algo que si estaba: solo cuesta latencia
               perdido: !acierta && q.esperada >= 0 };
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const S = estado();

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consultas nuevas contra un caché de ' + CAC.length + ' consultas ya respondidas',
      14, 15);

    const y0 = 40, fila = 27, bx = 330, bw = 300;
    S.forEach((s, i) => {
      const y = y0 + i * fila;
      if (i === sel) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(8, y - 11, W - 16, fila - 3);
      }

      // marca de resultado
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Fira Code, monospace';
      const col = s.danino ? '#FC6255' : s.acierta ? '#83C167'
        : s.perdido ? '#FF862F' : 'rgba(168,162,144,0.55)';
      ctx.fillStyle = col;
      ctx.fillText(s.danino ? '✘' : s.acierta ? '✔' : '·', 14, y + 4);

      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = s.danino ? '#ece6d0' : 'rgba(236,230,208,0.88)';
      let t = s.q.texto;
      while (ctx.measureText(t).width > bx - 46 && t.length > 6) t = t.slice(0, -2);
      if (t !== s.q.texto) t += '…';
      ctx.fillText(t, 32, y + 4);

      // barra de similitud con la mejor pareja
      ctx.fillStyle = 'rgba(168,162,144,0.10)';
      ctx.fillRect(bx, y - 7, bw, 14);
      ctx.fillStyle = s.danino ? 'rgba(252,98,85,0.75)'
        : s.acierta ? 'rgba(131,193,103,0.75)' : 'rgba(168,162,144,0.30)';
      ctx.fillRect(bx, y - 7, Math.max(1, s.val * bw), 14);
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.fillStyle = '#ece6d0';
      ctx.fillText(s.val.toFixed(3), bx + Math.max(1, s.val * bw) + 6, y + 3);

      // que devolveria
      ctx.textAlign = 'right';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillStyle = s.danino ? '#FC6255' : s.acierta ? 'rgba(131,193,103,0.9)'
        : 'rgba(168,162,144,0.5)';
      const et = s.danino ? 'responde OTRA cosa' : s.acierta ? 'del caché'
        : s.perdido ? 'pasa al LLM (estaba)' : 'pasa al LLM ✓';
      ctx.fillText(et, W - 12, y + 3);
    });

    // linea del umbral
    const xu = bx + umbral * bw;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xu, y0 - 14); ctx.lineTo(xu, y0 + NUE.length * fila - 8); ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('umbral ' + umbral.toFixed(2), xu, y0 - 18);

    // detalle de la consulta seleccionada
    const yd = y0 + NUE.length * fila + 8;
    const s = S[sel];
    ctx.textAlign = 'left';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('"' + s.q.texto + '"  →  su pareja más cercana en el caché:', 14, yd + 4);
    ctx.font = (s.danino ? 'bold ' : '') + '10px Fira Code, monospace';
    ctx.fillStyle = s.danino ? '#FC6255' : '#83C167';
    ctx.fillText('"' + CAC[s.mejor] + '"   ' + s.val.toFixed(3), 30, yd + 20);
    if (s.q.esperada < 0) {
      ctx.font = '9px Fira Code, monospace';
      ctx.fillStyle = 'rgba(252,98,85,0.85)';
      ctx.fillText('…pero ninguna consulta del caché responde de verdad esta pregunta.', 30, yd + 34);
    }

    actualizarInfo(S);
  }

  function actualizarInfo(S) {
    const el = document.getElementById('cache-info');
    if (!el) return;
    const hits = S.filter(s => s.acierta).length;
    const malos = S.filter(s => s.danino).length;
    const buenos = S.filter(s => s.acierta && s.correcto).length;
    // ahorro: cada acierto se salta la generacion completa (~1.8 s)
    const ahorro = (hits / S.length) * 100;
    el.innerHTML =
      '<div class="widget-label"><span>Aciertos de caché</span>' +
      '<span class="widget-value" style="color:var(--c-blue);">' + hits + ' de ' + S.length +
      '  (' + ahorro.toFixed(0) + '%)</span></div>' +
      '<div class="widget-label"><span>Correctos</span>' +
      '<span class="widget-value" style="color:var(--c-green);">' + buenos + '</span></div>' +
      '<div class="widget-label"><span>Respuestas equivocadas servidas</span>' +
      '<span class="widget-value" style="color:' +
      (malos ? 'var(--c-red)' : 'var(--c-green)') + ';">' + malos + '</span></div>' +
      '<div class="widget-label"><span>Latencia media</span>' +
      '<span class="widget-value">' +
      (((S.length - hits) * 1800 + hits * 40) / S.length).toFixed(0) + ' ms</span></div>';
  }

  const sU = document.getElementById('cache-umbral'), lU = document.getElementById('cache-umbral-value');
  if (sU) sU.addEventListener('input', function () {
    umbral = parseInt(this.value, 10) / 100;
    if (lU) lU.textContent = umbral.toFixed(2);
    draw();
  });
  canvas.addEventListener('click', e => {
    const rc = canvas.getBoundingClientRect();
    const my = (e.clientY - rc.top) * (H / rc.height);
    const i = Math.floor((my - 29) / 27);
    if (i >= 0 && i < NUE.length) { sel = i; draw(); }
  });

  if (lU) lU.textContent = umbral.toFixed(2);
  draw();
}
