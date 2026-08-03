// ============================================================
// PDF RAG Widget
//
// El enfoque moderno para PDFs y diapositivas: en vez de extraer el texto
// con detectores, se trata la pagina como IMAGEN, se parte en parches, se
// vectoriza cada parche y se puntua como ColBERT (cada token de la
// consulta busca su parche mas parecido y se suman los maximos).
//
// La ilustracion de la pagina y los puntajes de parecido son ESQUEMATICOS
// —no hay un modelo de vision corriendo aqui—, pero la aritmetica de
// almacenamiento es REAL y es justo el punto que el modulo marca como la
// gran desventaja: pasar de 1 vector por pagina a 1 por parche multiplica
// la base vectorial por el numero de parches.
//
// Con la cuantizacion del bloque anterior se puede ver cuanto de ese
// costo se recupera: int8 divide entre 4 sin perder recall.
// ============================================================

function initPdfRagWidget() {
  const canvas = document.getElementById('pdfrag-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let rejilla = 4;          // parches por lado
  let paginas = 10000;      // paginas en la base
  let bits = 32;            // precision de los vectores
  const DIMS = 128;         // ColBERT suele usar 128 por token/parche

  // Zonas de la pagina, para colorear los parches segun su contenido
  const ZONAS = [
    { x0: 0.05, y0: 0.05, x1: 0.95, y1: 0.18, t: 'título',  c: '#58C4DD' },
    { x0: 0.05, y0: 0.22, x1: 0.48, y1: 0.62, t: 'gráfica', c: '#FF862F' },
    { x0: 0.52, y0: 0.22, x1: 0.95, y1: 0.45, t: 'texto',   c: '#83C167' },
    { x0: 0.52, y0: 0.48, x1: 0.95, y1: 0.62, t: 'tabla',   c: '#9A72AC' },
    { x0: 0.05, y0: 0.66, x1: 0.95, y1: 0.94, t: 'texto',   c: '#83C167' },
  ];
  // La consulta "esquematica" busca la grafica: se resalta ese parche.
  const CONSULTA = '¿cuánto subió la ocupación hotelera?';

  function zonaDe(cx, cy) {
    for (const z of ZONAS) {
      if (cx >= z.x0 && cx <= z.x1 && cy >= z.y0 && cy <= z.y1) return z;
    }
    return null;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Una diapositiva tratada como imagen, partida en ' +
      rejilla + ' × ' + rejilla + ' = ' + (rejilla * rejilla) + ' parches', 14, 15);

    // ---- la pagina ----
    const px = 20, py = 30, pw = 250, ph = 190;
    ctx.fillStyle = 'rgba(236,230,208,0.06)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(168,162,144,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);
    // contenido simulado de la pagina
    ZONAS.forEach(z => {
      ctx.fillStyle = z.c;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(px + z.x0 * pw, py + z.y0 * ph,
        (z.x1 - z.x0) * pw, (z.y1 - z.y0) * ph);
      ctx.globalAlpha = 1;
      ctx.font = '7.5px Fira Code, monospace';
      ctx.fillStyle = z.c;
      ctx.textAlign = 'left';
      ctx.fillText(z.t, px + z.x0 * pw + 3, py + z.y0 * ph + 9);
    });

    // ---- la rejilla de parches ----
    const cw = pw / rejilla, ch = ph / rejilla;
    let mejor = null, mejorV = -1;
    for (let i = 0; i < rejilla; i++) {
      for (let j = 0; j < rejilla; j++) {
        const cx = (j + 0.5) / rejilla, cy = (i + 0.5) / rejilla;
        const z = zonaDe(cx, cy);
        // parecido ESQUEMATICO: la consulta pregunta por la grafica
        const v = z && z.t === 'gráfica' ? 0.86 : z && z.t === 'tabla' ? 0.52
          : z && z.t === 'texto' ? 0.34 : z ? 0.28 : 0.12;
        if (v > mejorV) { mejorV = v; mejor = [i, j]; }
        ctx.strokeStyle = 'rgba(168,162,144,0.35)';
        ctx.lineWidth = 0.7;
        ctx.strokeRect(px + j * cw, py + i * ch, cw, ch);
      }
    }
    // resaltar el parche ganador
    if (mejor) {
      ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 2.5;
      ctx.strokeRect(px + mejor[1] * cw, py + mejor[0] * ch, cw, ch);
    }

    // ---- explicacion del puntaje ----
    const tx = 296;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('"' + CONSULTA + '"', tx, py + 10);
    ctx.font = '9.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    const lineas = [
      'Cada token de la consulta se compara contra',
      'TODOS los parches y se queda con el mejor.',
      'Los máximos se suman: es el MaxSim de ColBERT,',
      'pero entre texto e imagen.',
      '',
      'No hizo falta extraer el texto del PDF: la gráfica,',
      'la tabla y el diseño entran tal cual.',
    ];
    lineas.forEach((l, k) => ctx.fillText(l, tx, py + 30 + k * 14));

    ctx.font = '9px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.55)';
    ctx.fillText('(el parecido de la ilustración es esquemático; la aritmética de abajo es real)',
      tx, py + 30 + lineas.length * 14 + 6);

    // ---- aritmetica de almacenamiento ----
    const yA = 244;
    const nParches = rejilla * rejilla;
    const bytesVec = Math.ceil(DIMS * bits / 8);
    const totPag = paginas * bytesVec;                 // 1 vector por pagina
    const totPar = paginas * nParches * bytesVec;      // 1 vector por parche

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('Base de ' + paginas.toLocaleString('es') + ' páginas · vectores de ' +
      DIMS + ' dims a ' + bits + ' bits (' + bytesVec + ' B cada uno)', 14, yA);

    const fmt = b => b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB'
      : b >= 1e6 ? (b / 1e6).toFixed(0) + ' MB' : (b / 1e3).toFixed(0) + ' KB';
    const bw2 = 300, bxx = 250;
    [['1 vector por página', totPag, '#58C4DD'],
     [nParches + ' vectores por página', totPar, '#FC6255']].forEach(([nom, tot, col], k) => {
      const y = yA + 20 + k * 22;
      ctx.textAlign = 'left';
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = 'rgba(236,230,208,0.9)';
      ctx.fillText(nom, 22, y + 4);
      const w = (tot / totPar) * bw2;
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.7;
      ctx.fillRect(bxx, y - 7, Math.max(2, w), 14);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ece6d0';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillText(fmt(tot), bxx + Math.max(2, w) + 8, y + 4);
    });

    actualizarInfo(nParches, bytesVec, totPag, totPar);
  }

  function actualizarInfo(nParches, bytesVec, totPag, totPar) {
    const el = document.getElementById('pdfrag-info');
    if (!el) return;
    const fmt = b => b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : (b / 1e6).toFixed(0) + ' MB';
    el.innerHTML =
      '<div class="widget-label"><span>Vectores por página</span>' +
      '<span class="widget-value" style="color:var(--c-orange);">' + nParches + '</span></div>' +
      '<div class="widget-label"><span>Vectores en total</span>' +
      '<span class="widget-value">' + (paginas * nParches).toLocaleString('es') + '</span></div>' +
      '<div class="widget-label"><span>Almacenamiento</span>' +
      '<span class="widget-value" style="color:' +
      (totPar > 4e9 ? 'var(--c-red)' : totPar > 1e9 ? 'var(--c-orange)' : 'var(--c-green)') +
      ';">' + fmt(totPar) + '</span></div>' +
      '<div class="widget-label"><span>Frente a 1 vector por página</span>' +
      '<span class="widget-value" style="color:var(--c-red);">' +
      (totPar / totPag).toFixed(0) + '× más</span></div>';
  }

  const conf = [['pdfrag-rejilla', v => { rejilla = v; }, v => v + '×' + v],
                ['pdfrag-paginas', v => { paginas = [1000, 10000, 100000, 1000000][v]; },
                 v => [1000, 10000, 100000, 1000000][v].toLocaleString('es')],
                ['pdfrag-bits', v => { bits = [1, 8, 32][v]; }, v => [1, 8, 32][v] + ' bits']];
  conf.forEach(([id, set, fmt]) => {
    const s = document.getElementById(id), l = document.getElementById(id + '-value');
    if (!s) return;
    s.addEventListener('input', function () {
      set(parseInt(this.value, 10));
      if (l) l.textContent = fmt(parseInt(this.value, 10));
      draw();
    });
    if (l) l.textContent = fmt(parseInt(s.value, 10));
  });

  draw();
}
