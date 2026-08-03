// ============================================================
// Training Pairs Widget
// Ilustra que entrenar un LLM es aprendizaje supervisado ordinario:
// de cada texto crudo salen pares (x, y) = (secuencia, token
// siguiente), y el modelo se entrena como CLASIFICADOR sobre y.
//
// El punto clave: en el corpus hay MUCHOS textos que contienen la
// pregunta por el nacimiento de Einstein, y cada uno la continua de
// forma distinta. Todos esos pares comparten (casi) la misma x pero
// tienen y distintas -> por eso el modelo termina repartiendo
// probabilidad entre varias continuaciones en vez de dar una sola.
// ============================================================

function initTrainingPairsWidget() {
  const canvas = document.getElementById('training-pairs-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Documentos del "corpus": textos donde aparece la misma pregunta.
  // El campo `y` es el token que sigue justo despues de la pregunta.
  const CORPUS = [
    { fuente: 'enciclopedia', x: '¿Cuándo nació Einstein?', y: ' En', cola: ' 1879, en Ulm, Alemania.', color: '#83C167' },
    { fuente: 'blog de divulgación', x: '¿Cuándo nació Einstein?', y: ' Nació', cola: ' el 14 de marzo de 1879.', color: '#58C4DD' },
    { fuente: 'foro de preguntas', x: '¿Cuándo nació Einstein?', y: ' ¿', cola: 'Cuándo nació Planck? ¿Y Bohr?', color: '#FF862F' },
    { fuente: 'examen escolar', x: '¿Cuándo nació Einstein?', y: ' ¿', cola: 'Dónde estudió? ¿Qué publicó en 1905?', color: '#FF862F' },
    { fuente: 'novela', x: '¿Cuándo nació Einstein?', y: ' —', cola: 'preguntó el niño, sin levantar la vista.', color: '#E48BB0' },
    { fuente: 'libro de texto', x: '¿Cuándo nació Einstein?', y: ' El', cola: ' físico alemán nació en 1879 y murió en 1955.', color: '#9A72AC' },
    { fuente: 'transcripción de clase', x: '¿Cuándo nació Einstein?', y: ' En', cola: ' el año 1879, unos años antes que Bohr.', color: '#83C167' },
    { fuente: 'lista de FAQ', x: '¿Cuándo nació Einstein?', y: ' ¿', cola: 'Qué edad tenía al publicar la relatividad?', color: '#FF862F' },
  ];

  let paso = 0;          // 0 = solo textos, luego se van marcando pares, al final el conteo
  const TOTAL = CORPUS.length;

  function conteo() {
    const m = {};
    CORPUS.slice(0, Math.min(paso, TOTAL)).forEach(d => {
      m[d.y] = m[d.y] || { n: 0, color: d.color };
      m[d.y].n++;
    });
    return Object.entries(m).sort((a, b) => b[1].n - a[1].n);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    // ---------------- encabezados ----------------
    ctx.textAlign = 'left';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Textos del corpus de entrenamiento', 14, 20);
    ctx.fillStyle = '#FFFF00';
    ctx.fillText('x  (la secuencia)', 300, 20);
    ctx.fillStyle = '#FF862F';
    ctx.fillText('y  (a predecir)', 470, 20);
    ctx.fillStyle = 'rgba(168,162,144,0.7)';
    ctx.fillText('lo que seguía en ese texto', 610, 20);

    ctx.strokeStyle = 'rgba(168,162,144,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(14, 28); ctx.lineTo(W - 14, 28); ctx.stroke();

    // ---------------- filas ----------------
    const fila = 34;
    CORPUS.forEach((d, i) => {
      const y = 52 + i * fila;
      const activo = i < paso;

      ctx.textAlign = 'left';
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = activo ? 'rgba(168,162,144,0.9)' : 'rgba(168,162,144,0.35)';
      ctx.fillText(d.fuente, 14, y);

      // x
      ctx.font = '11.5px Fira Code, monospace';
      ctx.fillStyle = activo ? '#ece6d0' : 'rgba(236,230,208,0.3)';
      if (activo) {
        ctx.fillStyle = 'rgba(255,255,0,0.12)';
        ctx.fillRect(296, y - 12, 168, 17);
        ctx.fillStyle = '#ece6d0';
      }
      ctx.fillText('¿Cuándo nació Einstein?', 300, y);

      // y
      ctx.font = 'bold 13px Fira Code, monospace';
      if (activo) {
        ctx.fillStyle = d.color; ctx.globalAlpha = 0.3;
        ctx.fillRect(470, y - 13, 52, 19);
        ctx.globalAlpha = 1;
        ctx.fillStyle = d.color;
      } else {
        ctx.fillStyle = 'rgba(168,162,144,0.3)';
      }
      ctx.fillText("'" + d.y.trim() + "'", 476, y);

      // cola
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = activo ? 'rgba(168,162,144,0.75)' : 'rgba(168,162,144,0.25)';
      let cola = d.cola;
      while (ctx.measureText(cola).width > W - 620 && cola.length > 6) cola = cola.slice(0, -2);
      if (cola !== d.cola) cola += '…';
      ctx.fillText(cola, 610, y);

      // flecha x -> y
      if (activo) {
        ctx.strokeStyle = d.color; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(466, y - 4); ctx.lineTo(470, y - 4);
        ctx.stroke();
      }
    });

    // ---------------- conteo acumulado ----------------
    const yC = 52 + TOTAL * fila + 16;
    ctx.strokeStyle = 'rgba(168,162,144,0.25)';
    ctx.beginPath(); ctx.moveTo(14, yC - 14); ctx.lineTo(W - 14, yC - 14); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Con la MISMA x, ¿qué y aparece en el corpus?', 14, yC + 4);

    const c = conteo();
    if (!c.length) {
      ctx.fillStyle = 'rgba(168,162,144,0.6)';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillText('presiona "Siguiente ejemplo"', 470, yC + 4);
    } else {
      let x = 470;
      c.forEach(([tok, o]) => {
        const w = 30 + o.n * 26;
        ctx.fillStyle = o.color; ctx.globalAlpha = 0.85;
        ctx.fillRect(x, yC - 10, w, 22);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1b1b2f';
        ctx.font = 'bold 12px Fira Code, monospace';
        ctx.textAlign = 'center';
        ctx.fillText("'" + tok.trim() + "' ×" + o.n, x + w / 2, yC + 5);
        x += w + 8;
      });
      ctx.textAlign = 'left';
    }

    // ---------------- conclusion ----------------
    const yF = yC + 34;
    if (paso >= TOTAL) {
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 12.5px Fira Code, monospace';
      ctx.fillText('La misma x tiene ' + c.length + ' respuestas y distintas en el corpus.', 14, yF);
      ctx.fillStyle = 'rgba(236,230,208,0.9)';
      ctx.font = '11.5px Fira Code, monospace';
      ctx.fillText('El modelo no puede elegir una sola: aprende a repartir probabilidad entre todas.', 14, yF + 19);
    } else if (paso > 0) {
      ctx.fillStyle = 'rgba(168,162,144,0.75)';
      ctx.font = '11.5px Fira Code, monospace';
      ctx.fillText('Cada texto aporta un par (x, y). Sigue agregando…', 14, yF);
    }

    actualizarInfo(c);
  }

  function actualizarInfo(c) {
    const el = document.getElementById('training-pairs-info');
    if (!el) return;
    const total = Math.min(paso, TOTAL);
    el.innerHTML =
      '<div class="widget-label"><span>Pares (x, y) vistos</span><span class="widget-value">' +
      total + ' / ' + TOTAL + '</span></div>' +
      '<div class="widget-label"><span>Valores distintos de y</span><span class="widget-value" style="color:var(--c-yellow);">' +
      (c ? c.length : 0) + '</span></div>';
  }

  const bN = document.getElementById('training-pairs-next');
  if (bN) bN.addEventListener('click', () => { if (paso < TOTAL) { paso++; draw(); } });
  const bA = document.getElementById('training-pairs-all');
  if (bA) bA.addEventListener('click', () => { paso = TOTAL; draw(); });
  const bR = document.getElementById('training-pairs-reset');
  if (bR) bR.addEventListener('click', () => { paso = 0; draw(); });

  draw();
}
