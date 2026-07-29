// ============================================================
// Search Strategy Widget (Grid vs. Random vs. Bayesiana)
// Panel izquierdo: un espacio de 2 hyper-parametros donde el color
// de fondo es la metrica que obtendriamos en cada punto (en la vida
// real NO la conocemos: por eso hay que buscar). Se van dibujando
// los puntos que evalua la estrategia elegida.
// Panel derecho: curva de "mejor metrica encontrada hasta ahora"
// contra numero de evaluaciones, acumulando las estrategias ya
// ejecutadas para poder compararlas con el MISMO presupuesto.
// ============================================================

function initSearchStrategyWidget() {
  const canvas = document.getElementById('search-strategy-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const PRESUPUESTO = 36;
  const COLORES = { grid: '#58C4DD', random: '#FF862F', bayes: '#83C167' };
  const NOMBRES = { grid: 'Grid Search', random: 'Random Search', bayes: 'Bayesiana (TPE)' };

  // ---- la funcion objetivo "desconocida" ----
  // Una zona buena ancha con un pico mas fino adentro: premia explorar
  // primero y luego afinar, que es justo lo que hace la bayesiana.
  function objetivo(x, y) {
    const g1 = Math.exp(-(((x - 0.58) ** 2 + (y - 0.50) ** 2) / (2 * 0.20 * 0.20)));
    const g2 = Math.exp(-(((x - 0.66) ** 2 + (y - 0.42) ** 2) / (2 * 0.09 * 0.09)));
    return 0.76 * g1 + 0.24 * g2;   // maximo real ~0.929
  }

  // mulberry32: buena distribucion en 2D. Un LCG simple NO sirve aqui —
  // sus valores consecutivos caen en planos reticulares, y al usarlos como
  // pares (x, y) el "muestreo aleatorio" queda con huecos artificiales,
  // haciendo que random search se vea peor de lo que es.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- generadores de puntos por estrategia ----
  function puntosGrid() {
    const lado = Math.round(Math.sqrt(PRESUPUESTO));   // 6x6
    const pts = [];
    for (let i = 0; i < lado; i++) {
      for (let j = 0; j < lado; j++) {
        pts.push({ x: (i + 0.5) / lado, y: (j + 0.5) / lado });
      }
    }
    return pts;
  }

  function puntosRandom() {
    const rng = makeRng(332598);   // semilla con resultado mediano (ver nota abajo)
    const pts = [];
    for (let i = 0; i < PRESUPUESTO; i++) pts.push({ x: rng(), y: rng() });
    return pts;
  }

  // Simulacion didactica de TPE: arranca explorando al azar y luego
  // concentra las muestras alrededor del mejor punto conocido, dejando
  // algo de exploracion. No es el algoritmo real, pero reproduce su
  // comportamiento observable.
  function puntosBayes() {
    const rng = makeRng(987654321);
    const pts = [];
    let mejor = null, mejorV = -1;
    const N_INICIAL = 8;
    for (let i = 0; i < PRESUPUESTO; i++) {
      let p;
      if (i < N_INICIAL || rng() < 0.2) {
        p = { x: rng(), y: rng() };                     // exploracion
      } else {
        const avance = (i - N_INICIAL) / (PRESUPUESTO - N_INICIAL);
        const sigma = 0.26 * (1 - avance) + 0.035;      // se va afinando
        const gauss = () => {
          let u = 0, v = 0;
          while (u === 0) u = rng();
          while (v === 0) v = rng();
          return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        };
        p = {
          x: Math.min(0.999, Math.max(0.001, mejor.x + gauss() * sigma)),
          y: Math.min(0.999, Math.max(0.001, mejor.y + gauss() * sigma)),
        };
      }
      const v = objetivo(p.x, p.y);
      if (v > mejorV) { mejorV = v; mejor = p; }
      pts.push(p);
    }
    return pts;
  }

  const GENERADORES = { grid: puntosGrid, random: puntosRandom, bayes: puntosBayes };

  // ---- estado ----
  let estrategiaActual = null;
  let puntos = [];
  let mostrados = 0;
  let timer = null;
  const curvas = {};        // estrategia -> array de mejor-hasta-ahora

  // ---- layout ----
  const A = { x0: 40, x1: 400, y0: 42, y1: 284 };     // espacio de busqueda
  const B = { x0: 500, x1: 855, y0: 42, y1: 268 };    // curva de convergencia

  // Fondo del panel A precalculado una sola vez
  const RES = 60;
  function dibujarFondo() {
    const cw = (A.x1 - A.x0) / RES, ch = (A.y1 - A.y0) / RES;
    for (let i = 0; i < RES; i++) {
      for (let j = 0; j < RES; j++) {
        const x = (i + 0.5) / RES, y = (j + 0.5) / RES;
        const v = objetivo(x, y);
        // rampa de un solo tono (oscuro -> claro) sobre el fondo del tema
        const t = Math.min(1, Math.max(0, v));
        const r = Math.round(27 + t * (88 - 27));
        const g = Math.round(27 + t * (196 - 27));
        const b = Math.round(47 + t * (221 - 47));
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fillRect(A.x0 + i * cw, A.y1 - (j + 1) * ch, cw + 0.6, ch + 0.6);
      }
    }
  }

  function tx(x) { return A.x0 + x * (A.x1 - A.x0); }
  function ty(y) { return A.y1 - y * (A.y1 - A.y0); }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ---------- panel A ----------
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Espacio de busqueda (el color = metrica, en la vida real es desconocida)', 8, 18);

    dibujarFondo();

    ctx.strokeStyle = 'rgba(168,162,144,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);

    ctx.fillStyle = '#a8a290';
    ctx.font = '9.5px Fira Code, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('hyper-parametro 1', (A.x0 + A.x1) / 2, A.y1 + 20);
    ctx.save();
    ctx.translate(14, (A.y0 + A.y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('hyper-parametro 2', 0, 0);
    ctx.restore();

    // puntos evaluados
    let mejorV = -1, mejorP = null;
    for (let i = 0; i < mostrados; i++) {
      const p = puntos[i];
      const v = objetivo(p.x, p.y);
      if (v > mejorV) { mejorV = v; mejorP = p; }
      ctx.beginPath();
      ctx.arc(tx(p.x), ty(p.y), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = estrategiaActual ? COLORES[estrategiaActual] : '#ece6d0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(27,27,47,0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    if (mejorP) {
      ctx.beginPath();
      ctx.arc(tx(mejorP.x), ty(mejorP.y), 9, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // ---------- panel B ----------
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Mejor metrica encontrada vs. evaluaciones', B.x0 - 34, 18);

    const bx = i => B.x0 + (i / PRESUPUESTO) * (B.x1 - B.x0);
    const by = v => B.y1 - ((v - 0.3) / 0.75) * (B.y1 - B.y0);

    ctx.strokeStyle = 'rgba(168,162,144,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(B.x0, B.y0); ctx.lineTo(B.x0, B.y1); ctx.lineTo(B.x1, B.y1); ctx.stroke();

    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.font = '8.5px Fira Code, monospace';
    ctx.textAlign = 'right';
    [0.4, 0.6, 0.8, 1.0].forEach(v => ctx.fillText(v.toFixed(1), B.x0 - 5, by(v) + 3));
    ctx.textAlign = 'center';
    [0, 12, 24, 36].forEach(i => ctx.fillText(String(i), bx(i), B.y1 + 14));
    ctx.fillText('evaluaciones', (B.x0 + B.x1) / 2, B.y1 + 30);

    Object.keys(curvas).forEach(est => {
      const c = curvas[est];
      ctx.beginPath();
      ctx.strokeStyle = COLORES[est];
      ctx.lineWidth = 2;
      c.forEach((v, i) => {
        const px = bx(i + 1), py = by(v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    // curva parcial de la estrategia en ejecucion
    if (estrategiaActual && mostrados > 0 && !curvas[estrategiaActual]) {
      const parcial = [];
      let m = -1;
      for (let i = 0; i < mostrados; i++) {
        m = Math.max(m, objetivo(puntos[i].x, puntos[i].y));
        parcial.push(m);
      }
      ctx.beginPath();
      ctx.strokeStyle = COLORES[estrategiaActual];
      ctx.lineWidth = 2;
      parcial.forEach((v, i) => {
        const px = bx(i + 1), py = by(v);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // leyenda
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'left';
    let yl = B.y0 + 4;
    ['grid', 'random', 'bayes'].forEach(est => {
      const hecho = !!curvas[est] || est === estrategiaActual;
      ctx.strokeStyle = hecho ? COLORES[est] : 'rgba(168,162,144,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(B.x1 - 128, yl); ctx.lineTo(B.x1 - 110, yl); ctx.stroke();
      ctx.fillStyle = hecho ? '#ece6d0' : 'rgba(168,162,144,0.4)';
      ctx.fillText(NOMBRES[est], B.x1 - 105, yl + 3.5);
      yl += 15;
    });

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('search-strategy-info');
    if (!el) return;
    let html = '';
    ['grid', 'random', 'bayes'].forEach(est => {
      let val = null;
      if (curvas[est]) {
        val = curvas[est][curvas[est].length - 1];
      } else if (est === estrategiaActual && mostrados > 0) {
        let m = -1;
        for (let i = 0; i < mostrados; i++) m = Math.max(m, objetivo(puntos[i].x, puntos[i].y));
        val = m;
      }
      html += '<div class="widget-label"><span style="color:' + COLORES[est] + ';">' + NOMBRES[est] + '</span>' +
        '<span class="widget-value">' + (val === null ? '—' : val.toFixed(4)) + '</span></div>';
    });
    el.innerHTML = html;
  }

  function detener() { if (timer) { clearInterval(timer); timer = null; } }

  function ejecutar(est) {
    detener();
    estrategiaActual = est;
    puntos = GENERADORES[est]();
    mostrados = 0;
    delete curvas[est];
    document.querySelectorAll('.search-strategy-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.strategy === est));
    timer = setInterval(() => {
      mostrados++;
      if (mostrados >= puntos.length) {
        mostrados = puntos.length;
        const c = [];
        let m = -1;
        puntos.forEach(p => { m = Math.max(m, objetivo(p.x, p.y)); c.push(m); });
        curvas[est] = c;
        detener();
      }
      draw();
    }, 70);
    draw();
  }

  function reiniciar() {
    detener();
    estrategiaActual = null;
    puntos = [];
    mostrados = 0;
    Object.keys(curvas).forEach(k => delete curvas[k]);
    document.querySelectorAll('.search-strategy-btn').forEach(b => b.classList.remove('active'));
    draw();
  }

  document.querySelectorAll('.search-strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => ejecutar(btn.dataset.strategy));
  });
  const btnReset = document.getElementById('search-strategy-reset');
  if (btnReset) btnReset.addEventListener('click', reiniciar);

  draw();
}
