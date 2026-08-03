// ============================================================
// Contrastive Training Widget
//
// Muestra COMO un modelo de embeddings aprende donde poner cada texto:
// no hay nada semantico en las posiciones iniciales (son aleatorias),
// y el significado aparece solo despues de empujar y jalar pares.
//
// La animacion NO es decorativa: se optimiza de verdad, por descenso de
// gradiente, la perdida contrastiva clasica
//
//    L = Σ_pos (d - m_pos)²  +  Σ_neg max(0, m_neg - d)²
//
// Los pares positivos se atraen hasta quedar a distancia m_pos; los
// negativos se repelen solo si estan mas cerca que m_neg. La perdida
// que se muestra en pantalla es la que se esta minimizando, y baja
// porque la optimizacion funciona, no porque este programada para bajar.
//
// Nota: el termino positivo es de dos lados (los lleva A m_pos en vez de
// pegarlos) unicamente para que en 2D las dos etiquetas de un par no
// queden encimadas. Un modelo real trabaja en cientos de dimensiones,
// donde sobra espacio y no hace falta ese cuidado.
//
// La semilla no se eligio a ojo: se probaron 40 y se tomo la de menor
// perdida final (6 tras 400 pasos) entre las que dejan los pares a mas
// de 32 px y los grupos a mas de 175 px, es decir legibles en pantalla.
// ============================================================

function initContrastiveWidget() {
  const canvas = document.getElementById('contrastive-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // 3 grupos de significado, 2 frases cada uno
  const TEXTOS = [
    { t: 'Buenos días',            g: 0, c: '#58C4DD' },
    { t: 'Hola, ¿qué tal?',        g: 0, c: '#58C4DD' },
    { t: 'Olía las rosas',         g: 1, c: '#83C167' },
    { t: 'Un campo de flores',     g: 1, c: '#83C167' },
    { t: 'El león rugió',          g: 2, c: '#FF862F' },
    { t: 'Un rugido en la sabana', g: 2, c: '#FF862F' },
  ];
  const GRUPOS = ['saludos', 'flores', 'leones'];
  const n = TEXTOS.length;
  const MARGEN = 190;      // m_neg: separacion minima entre grupos, en pixeles
  const MPOS = 36;         // m_pos: separacion a la que quedan los pares
  const LR = 0.0016;

  // pares positivos (mismo grupo) y negativos (distinto grupo)
  const POS = [], NEG = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      (TEXTOS[i].g === TEXTOS[j].g ? POS : NEG).push([i, j]);
    }
  }

  // mulberry32: PRNG determinista y sin el patron de red del LCG
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const SEED = 28;
  let P = [], paso = 0, timer = null, resaltado = -1;

  function reiniciar() {
    const rnd = mulberry32(SEED);
    // inicializacion aleatoria: al principio la posicion no significa nada
    P = TEXTOS.map(() => [80 + rnd() * (W - 300), 60 + rnd() * (H - 150)]);
    paso = 0;
  }

  function perdida() {
    let L = 0;
    POS.forEach(([i, j]) => {
      const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
      L += (d - MPOS) * (d - MPOS);
    });
    NEG.forEach(([i, j]) => {
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < MARGEN) L += (MARGEN - d) * (MARGEN - d);
    });
    return L / (POS.length + NEG.length);
  }

  // un paso de descenso de gradiente sobre la perdida de arriba
  function entrenar() {
    const G = P.map(() => [0, 0]);
    POS.forEach(([i, j]) => {
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
      const d = Math.hypot(dx, dy) || 1e-6;
      const g = 2 * (d - MPOS) / d;
      G[i][0] += g * dx; G[i][1] += g * dy;
      G[j][0] -= g * dx; G[j][1] -= g * dy;
    });
    NEG.forEach(([i, j]) => {
      const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
      const d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      if (d < MARGEN) {
        const g = -2 * (MARGEN - d) / d;
        G[i][0] += g * dx; G[i][1] += g * dy;
        G[j][0] -= g * dx; G[j][1] -= g * dy;
      }
    });
    for (let i = 0; i < n; i++) {
      P[i][0] -= LR * G[i][0];
      P[i][1] -= LR * G[i][1];
      // mantener todo dentro del lienzo
      P[i][0] = Math.max(70, Math.min(W - 70, P[i][0]));
      P[i][1] = Math.max(46, Math.min(H - 34, P[i][1]));
    }
    paso++;
  }

  function etapa() {
    if (paso === 0) return ['Inicialización aleatoria', 'las posiciones NO significan nada todavía', '#FC6255'];
    if (paso < 60) return ['Entrenando', 'empujando y jalando pares', '#FF862F'];
    if (paso < 200) return ['Entrenando', 'los grupos empiezan a separarse', '#FFFF00'];
    return ['Modelo entrenado', 'la cercanía ya significa parecido', '#83C167'];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // lineas de pares: verdes atraen, rojas repelen (solo si violan el margen)
    const verPares = document.getElementById('contrastive-pares');
    const mostrar = !verPares || verPares.checked;
    if (mostrar) {
      NEG.forEach(([i, j]) => {
        const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= MARGEN) return;         // ya cumple: no hay fuerza
        if (resaltado >= 0 && i !== resaltado && j !== resaltado) return;
        ctx.strokeStyle = 'rgba(252,98,85,' + (0.15 + 0.5 * (1 - d / MARGEN)).toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
        ctx.setLineDash([]);
      });
      POS.forEach(([i, j]) => {
        if (resaltado >= 0 && i !== resaltado && j !== resaltado) return;
        ctx.strokeStyle = 'rgba(131,193,103,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
      });
    }

    // puntos + etiquetas
    TEXTOS.forEach((d, i) => {
      const [x, y] = P[i];
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = d.c; ctx.fill();
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 2; ctx.stroke();

      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = '#ece6d0';
      const w = ctx.measureText(d.t).width;
      // etiqueta al lado que quepa
      const izq = x + 12 + w > W - 8;
      ctx.textAlign = izq ? 'right' : 'left';
      ctx.fillText(d.t, izq ? x - 12 : x + 12, y + 4);
    });

    // encabezado de etapa
    const [tit, sub, col] = etapa();
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillStyle = col;
    ctx.fillText(tit, 14, 22);
    // el ancho hay que medirlo CON la fuente del titulo todavia activa,
    // si no el subtitulo se encima
    const anchoTit = ctx.measureText(tit).width;
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText(sub, 14 + anchoTit + 14, 22);

    // leyenda
    ctx.textAlign = 'right';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#83C167';
    ctx.fillText('— par positivo: se atraen', W - 14, 18);
    ctx.fillStyle = '#FC6255';
    ctx.fillText('- - par negativo: se repelen', W - 14, 32);

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('contrastive-info');
    if (!el) return;
    // separacion media dentro del grupo vs entre grupos: el numero que
    // resume si el espacio ya "significa" algo
    let dIn = 0, dOut = 0;
    POS.forEach(([i, j]) => { dIn += Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); });
    NEG.forEach(([i, j]) => { dOut += Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]); });
    dIn /= POS.length; dOut /= NEG.length;
    const ratio = dOut / Math.max(1e-6, dIn);
    el.innerHTML =
      '<div class="widget-label"><span>Paso de entrenamiento</span>' +
      '<span class="widget-value">' + paso + '</span></div>' +
      '<div class="widget-label"><span>Pérdida contrastiva</span>' +
      '<span class="widget-value" style="color:var(--c-yellow);">' + perdida().toFixed(0) + '</span></div>' +
      '<div class="widget-label"><span>Distancia dentro / entre grupos</span>' +
      '<span class="widget-value">' + dIn.toFixed(0) + ' / ' + dOut.toFixed(0) + '</span></div>' +
      '<div class="widget-label"><span>Separación (entre ÷ dentro)</span>' +
      '<span class="widget-value" style="color:' +
      (ratio > 3 ? 'var(--c-green)' : ratio > 1.5 ? 'var(--c-yellow)' : 'var(--c-red)') + ';">' +
      ratio.toFixed(1) + '×</span></div>';
  }

  function animar() {
    if (timer) { clearInterval(timer); timer = null; return; }
    timer = setInterval(() => {
      for (let k = 0; k < 3; k++) entrenar();
      draw();
      if (paso >= 400) { clearInterval(timer); timer = null; }
    }, 40);
  }

  const bA = document.getElementById('contrastive-animar');
  if (bA) bA.addEventListener('click', animar);
  const bP = document.getElementById('contrastive-paso');
  if (bP) bP.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; }
    for (let k = 0; k < 20; k++) entrenar();
    draw();
  });
  const bR = document.getElementById('contrastive-reset');
  if (bR) bR.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; }
    reiniciar(); draw();
  });
  const cP = document.getElementById('contrastive-pares');
  if (cP) cP.addEventListener('change', draw);

  // resaltar el grupo al pasar el mouse: ayuda a ver de quien es cada fuerza
  canvas.addEventListener('mousemove', e => {
    const rc = canvas.getBoundingClientRect();
    const mx = (e.clientX - rc.left) * (W / rc.width);
    const my = (e.clientY - rc.top) * (H / rc.height);
    let cerca = -1, best = 22;
    P.forEach((p, i) => {
      const d = Math.hypot(p[0] - mx, p[1] - my);
      if (d < best) { best = d; cerca = i; }
    });
    if (cerca !== resaltado) { resaltado = cerca; draw(); }
  });
  canvas.addEventListener('mouseleave', () => { resaltado = -1; draw(); });

  reiniciar();
  draw();
}
