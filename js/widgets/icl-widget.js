// ============================================================
// In-Context Learning Widget (0-shot / 1-shot / few-shot)
//
// Muestra el prompt creciendo ejemplo por ejemplo y, al lado, el efecto
// MEDIDO sobre el modelo: cuanta probabilidad le da a la salida correcta
// y que tokens propone.
//
// Dos tareas, con conclusiones opuestas y las dos reales:
//
//   formato     -> el few-shot SI funciona. La salida correcta pasa de
//                  -4.262 a -2.460 de log-probabilidad: 6.1 veces mas
//                  probable. Sin ejemplos el modelo quiere emitir un
//                  salto de linea; con ejemplos emite la inicial del
//                  apellido en mayuscula.
//
//   sentimiento -> con un modelo pequeno el few-shot EMPEORA: 4/4 aciertos
//                  sin ejemplos, 2/4 con seis, y sesgo hacia la ultima
//                  etiqueta vista. Es un limite honesto que conviene
//                  ensenar junto con la tecnica.
//
// Todo viene de icl-data.js, medido con DeepESP/gpt2-spanish.
// ============================================================

function initIclWidget() {
  const canvas = document.getElementById('icl-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof ICL === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const F = ICL.formato, S = ICL.sentimiento;
  let k = 0, tarea = 'formato';

  const maxK = () => (tarea === 'formato' ? 4 : 6);
  const filaF = kk => F.filas[Math.min(kk, F.filas.length - 1)];
  const filaS = kk => S.filas.reduce((a, f) => (f.k <= kk ? f : a), S.filas[0]);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    const nom = k === 0 ? 'zero-shot' : k === 1 ? 'one-shot' : 'few-shot (' + k + ' ejemplos)';
    ctx.fillText('El prompt que se le manda al modelo   ·   ' + nom, 14, 15);

    // ---------- panel izquierdo: el prompt ----------
    const px = 14, py = 26, pw = 430, ph = H - 44;
    ctx.fillStyle = 'rgba(236,230,208,0.04)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(168,162,144,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    let y = py + 18;
    ctx.font = '10.5px Fira Code, monospace';
    if (tarea === 'formato') {
      for (let i = 0; i < k; i++) {
        const [a, b] = F.ejemplos[i];
        ctx.fillStyle = 'rgba(131,193,103,0.85)';
        ctx.fillRect(px + 6, y - 10, 3, 13);
        ctx.fillStyle = 'rgba(236,230,208,0.9)';
        ctx.fillText(a + '  =>  ', px + 16, y);
        ctx.fillStyle = '#83C167';
        ctx.fillText(b, px + 16 + ctx.measureText(a + '  =>  ').width, y);
        y += 19;
      }
      if (k === 0) {
        ctx.fillStyle = 'rgba(168,162,144,0.5)';
        ctx.font = 'italic 10px Fira Code, monospace';
        ctx.fillText('(sin ningún ejemplo: el modelo tiene que adivinar', px + 16, y);
        ctx.fillText(' el formato que quieres)', px + 16, y + 15);
        y += 34;
        ctx.font = '10.5px Fira Code, monospace';
      }
      y += 6;
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(px + 6, y - 10, 3, 13);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText(F.prueba[0][0] + '  =>  ', px + 16, y);
      ctx.fillStyle = 'rgba(168,162,144,0.55)';
      ctx.fillText('?', px + 16 + ctx.measureText(F.prueba[0][0] + '  =>  ').width, y);
      y += 26;
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.7)';
      ctx.fillText('salida correcta:  ' + F.prueba[0][1], px + 16, y);
    } else {
      ctx.fillStyle = 'rgba(168,162,144,0.85)';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillText('Clasifica la reseña como positivo o negativo.', px + 16, y);
      y += 22;
      ctx.font = '9.5px Fira Code, monospace';
      const EJS = [['Me encantó, volvería sin dudarlo.', 'positivo'],
                   ['Un desastre, no lo recomiendo.', 'negativo'],
                   ['Excelente atención y comida deliciosa.', 'positivo'],
                   ['Llegó tarde y frío, muy mal.', 'negativo'],
                   ['La mejor experiencia del año.', 'positivo'],
                   ['Pésimo servicio, nunca más.', 'negativo']];
      for (let i = 0; i < Math.min(k, 6); i++) {
        const col = EJS[i][1] === 'positivo' ? '#83C167' : '#FC6255';
        ctx.fillStyle = col;
        ctx.fillRect(px + 6, y - 9, 3, 12);
        ctx.fillStyle = 'rgba(236,230,208,0.82)';
        let t = EJS[i][0];
        while (ctx.measureText(t).width > pw - 130) t = t.slice(0, -2);
        ctx.fillText(t, px + 16, y);
        ctx.fillStyle = col;
        ctx.fillText(EJS[i][1], px + pw - 78, y);
        y += 17;
      }
      if (k === 0) {
        ctx.fillStyle = 'rgba(168,162,144,0.5)';
        ctx.font = 'italic 10px Fira Code, monospace';
        ctx.fillText('(sin ejemplos)', px + 16, y); y += 20;
      }
      y += 6;
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(px + 6, y - 9, 3, 12);
      ctx.fillText('El lugar es maravilloso y el trato inmejorable.', px + 16, y);
      ctx.fillStyle = 'rgba(168,162,144,0.55)';
      ctx.fillText('?', px + pw - 78, y);
    }

    // ---------- panel derecho: el efecto medido ----------
    const qx = px + pw + 18, qw = W - qx - 14;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText(tarea === 'formato'
      ? 'Qué tan probable es la salida correcta'
      : 'Qué tan seguro está de la etiqueta correcta', qx, 15);

    if (tarea === 'formato') {
      // barras de log-prob por k (mas alto = mejor)
      const bw = qw / 5, y0 = 46, alto = 96;
      const lps = F.filas.map(f => f.logprob);
      const lo = Math.min.apply(null, lps) - 0.4, hi = Math.max.apply(null, lps) + 0.2;
      F.filas.forEach((f, i) => {
        const x = qx + i * bw;
        const hh = ((f.logprob - lo) / (hi - lo)) * alto;
        const act = f.k === k;
        ctx.fillStyle = act ? '#83C167' : 'rgba(131,193,103,0.30)';
        ctx.fillRect(x + 6, y0 + alto - hh, bw - 14, hh);
        ctx.textAlign = 'center';
        ctx.font = (act ? 'bold ' : '') + '9px Fira Code, monospace';
        ctx.fillStyle = act ? '#ece6d0' : 'rgba(168,162,144,0.6)';
        ctx.fillText(f.logprob.toFixed(2), x + bw / 2 - 1, y0 + alto - hh - 4);
        ctx.fillStyle = act ? '#FFFF00' : 'rgba(168,162,144,0.6)';
        ctx.fillText('k=' + f.k, x + bw / 2 - 1, y0 + alto + 13);
      });
      ctx.textAlign = 'left';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.6)';
      ctx.fillText('log-probabilidad media (más alto = mejor)', qx, y0 - 6);

      // tokens que propone el modelo con este k
      const yt = y0 + alto + 34;
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(168,162,144,0.8)';
      ctx.fillText('Lo que el modelo quiere escribir ahora:', qx, yt);
      filaF(k).top.slice(0, 4).forEach(([t, p], i) => {
        const y2 = yt + 17 + i * 15;
        const et = t === '\n' ? '⏎ (salto de línea)' : '"' + t + '"';
        const bueno = /^[ ]?[A-ZÁÉÍÓÚÑ]/.test(t);
        ctx.fillStyle = bueno ? '#83C167' : 'rgba(168,162,144,0.6)';
        ctx.fillText(et, qx + 6, y2);
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(236,230,208,0.75)';
        ctx.fillText((100 * p).toFixed(0) + '%', qx + qw - 6, y2);
        ctx.textAlign = 'left';
      });
    } else {
      const f = filaS(k), f0 = S.filas[0];
      const y0 = 52, bw = qw - 20, alto = 22;
      [['sin ejemplos (k=0)', f0, 'rgba(131,193,103,0.7)'],
       ['con k=' + f.k, f, f.p >= f0.p ? 'rgba(131,193,103,0.7)' : 'rgba(252,98,85,0.75)']]
        .forEach(([nom, ff, col], i) => {
          const y2 = y0 + i * 46;
          ctx.textAlign = 'left';
          ctx.font = '10px Fira Code, monospace';
          ctx.fillStyle = 'rgba(236,230,208,0.85)';
          ctx.fillText(nom, qx, y2 - 6);
          ctx.fillStyle = 'rgba(168,162,144,0.12)';
          ctx.fillRect(qx, y2, bw, alto);
          ctx.fillStyle = col;
          ctx.fillRect(qx, y2, bw * ff.p, alto);
          ctx.fillStyle = '#ece6d0';
          ctx.font = 'bold 10px Fira Code, monospace';
          ctx.fillText((100 * ff.p).toFixed(1) + '%   ' + ff.aciertos + '/' + ff.n + ' aciertos',
            qx + 8, y2 + 15);
        });
      ctx.font = '9.5px Fira Code, monospace';
      ctx.fillStyle = 'rgba(252,98,85,0.9)';
      ctx.fillText('Con este modelo, agregar ejemplos EMPEORA', qx, y0 + 112);
      ctx.fillStyle = 'rgba(168,162,144,0.75)';
      ctx.fillText('la clasificación: se sesga hacia la última', qx, y0 + 126);
      ctx.fillText('etiqueta que vio ("' + S.ultima_etiqueta + '").', qx, y0 + 140);
    }

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('icl-info');
    if (!el) return;
    const nom = k === 0 ? 'zero-shot' : k === 1 ? 'one-shot' : 'few-shot';
    if (tarea === 'formato') {
      const f = filaF(k), f0 = F.filas[0];
      const rel = Math.exp(f.logprob - f0.logprob);
      el.innerHTML =
        '<div class="widget-label"><span>Ejemplos en el prompt</span>' +
        '<span class="widget-value" style="color:var(--c-yellow);">' + k + '  (' + nom + ')</span></div>' +
        '<div class="widget-label"><span>Log-prob de la salida correcta</span>' +
        '<span class="widget-value">' + f.logprob.toFixed(3) + '</span></div>' +
        '<div class="widget-label"><span>Frente a no dar ningún ejemplo</span>' +
        '<span class="widget-value" style="color:' +
        (rel > 3 ? 'var(--c-green)' : rel > 1.2 ? 'var(--c-yellow)' : 'var(--c-text-dim)') + ';">' +
        rel.toFixed(1) + '× más probable</span></div>' +
        '<div class="widget-label"><span>Token más probable</span>' +
        '<span class="widget-value">' +
        (f.top[0][0] === '\n' ? '⏎ salto de línea' : '"' + f.top[0][0] + '"') + '</span></div>';
    } else {
      const f = filaS(k), f0 = S.filas[0];
      el.innerHTML =
        '<div class="widget-label"><span>Ejemplos en el prompt</span>' +
        '<span class="widget-value" style="color:var(--c-yellow);">' + f.k + '  (' + nom + ')</span></div>' +
        '<div class="widget-label"><span>Aciertos</span>' +
        '<span class="widget-value" style="color:' +
        (f.aciertos === f.n ? 'var(--c-green)' : 'var(--c-red)') + ';">' +
        f.aciertos + ' de ' + f.n + '</span></div>' +
        '<div class="widget-label"><span>P(etiqueta correcta)</span>' +
        '<span class="widget-value">' + (100 * f.p).toFixed(1) + '%</span></div>' +
        '<div class="widget-label"><span>Cambio frente a zero-shot</span>' +
        '<span class="widget-value" style="color:' +
        (f.p >= f0.p ? 'var(--c-green)' : 'var(--c-red)') + ';">' +
        (f.p >= f0.p ? '+' : '') + (100 * (f.p - f0.p)).toFixed(1) + ' puntos</span></div>';
    }
  }

  document.querySelectorAll('.icl-tarea-btn').forEach(b => {
    b.addEventListener('click', () => {
      tarea = b.dataset.tarea;
      document.querySelectorAll('.icl-tarea-btn').forEach(x => x.classList.toggle('active', x === b));
      const s = document.getElementById('icl-k');
      if (s) { s.max = String(maxK()); if (k > maxK()) k = maxK(); s.value = k; }
      const l = document.getElementById('icl-k-value');
      if (l) l.textContent = k;
      draw();
    });
  });
  const sK = document.getElementById('icl-k'), lK = document.getElementById('icl-k-value');
  if (sK) sK.addEventListener('input', function () {
    k = parseInt(this.value, 10);
    if (lK) lK.textContent = k;
    draw();
  });

  const ini = document.querySelector('.icl-tarea-btn[data-tarea="formato"]');
  if (ini) ini.classList.add('active');
  if (lK) lK.textContent = k;
  draw();
}
