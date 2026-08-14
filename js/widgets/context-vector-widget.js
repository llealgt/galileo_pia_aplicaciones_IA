// ============================================================
// El vector depende del contexto (la idea de ELMo)
// Izquierda: el esquema del modelo bidireccional — una pasada hacia
// adelante, otra hacia atras, y la suma pesada de las capas.
// Derecha: la MISMA palabra en tres frases, con los cosenos MEDIDOS
// entre sus vectores contextuales.
//
// Medido con mDeBERTa-v3-base (bidireccional, ya en cache) sobre el
// vector de la palabra en cada frase. Un embedding estatico tipo
// Word2Vec daria 1.000 en las tres comparaciones, porque es
// literalmente el mismo vector; aqui "planta" de regar contra
// "planta" de ensamblaje da 0.576.
// ============================================================

const CTX_CASOS = {
  'banco': {
    frases: ['Me senté en el banco del parque a leer',
             'El banco me negó el préstamo por mi historial',
             'El banco de arena bloqueaba la entrada al puerto'],
    corto: ['el del parque', 'el del préstamo', 'el de arena'],
    cos: [[1.000, 0.755, 0.682],
          [0.755, 1.000, 0.846],
          [0.682, 0.846, 1.000]],
  },
  'planta': {
    frases: ['Regué la planta antes de salir de casa',
             'La planta de ensamblaje produce mil piezas por hora',
             'Me duele la planta del pie después de correr'],
    corto: ['la que se riega', 'la de ensamblaje', 'la del pie'],
    cos: [[1.000, 0.576, 0.696],
          [0.576, 1.000, 0.860],
          [0.696, 0.860, 1.000]],
  },
};

function initContextVectorWidget() {
  const canvas = document.getElementById('ctx-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMAR = '#FFFF00',
        AZUL = '#58C4DD', ROJO = '#FC6255', VERDE = '#83C167', MOR = '#9A72AC';

  let palabra = 'planta';
  let estatico = false;

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    diagrama();
    panel();
  }

  // ---------- esquema del modelo bidireccional ----------
  function diagrama() {
    const x0 = 30, ancho = 300;
    const toks = ['la', 'planta', 'de', 'ensamblaje'];
    const n = toks.length;
    const paso = ancho / n;
    const yTok = 250;

    ctx.textAlign = 'center';
    ctx.font = '11.5px Fira Code, monospace';
    toks.forEach((t, i) => {
      const x = x0 + paso * (i + 0.5);
      const esClave = t === 'planta';
      ctx.fillStyle = esClave ? AMAR : DIM;
      ctx.fillText(t, x, yTok + 4);
      if (esClave) {
        ctx.strokeStyle = 'rgba(255,255,0,0.4)'; ctx.lineWidth = 1;
        ctx.strokeRect(x - 26, yTok - 11, 52, 18);
      }
    });

    // dos capas: adelante y atras
    const capas = [
      { y: 196, c: AZUL, dir: 1,  n: 'capa 1  →' },
      { y: 196, c: ROJO, dir: -1, n: '←  capa 1' },
      { y: 148, c: AZUL, dir: 1,  n: 'capa 2  →' },
      { y: 148, c: ROJO, dir: -1, n: '←  capa 2' },
    ];
    capas.forEach(cp => {
      ctx.strokeStyle = cp.c; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.4;
      for (let i = 0; i < n - 1; i++) {
        const a = x0 + paso * (i + 0.5), b = x0 + paso * (i + 1.5);
        const xa = cp.dir > 0 ? a : b, xb = cp.dir > 0 ? b : a;
        const dy = cp.dir > 0 ? -5 : 5;
        ctx.beginPath();
        ctx.moveTo(xa, cp.y + dy); ctx.lineTo(xb, cp.y + dy); ctx.stroke();
        // punta
        const s = Math.sign(xb - xa);
        ctx.beginPath();
        ctx.moveTo(xb, cp.y + dy);
        ctx.lineTo(xb - s * 6, cp.y + dy - 3);
        ctx.lineTo(xb - s * 6, cp.y + dy + 3);
        ctx.closePath(); ctx.fillStyle = cp.c; ctx.fill();
      }
      ctx.globalAlpha = 1;
      // nodos
      for (let i = 0; i < n; i++) {
        const x = x0 + paso * (i + 0.5);
        ctx.beginPath();
        ctx.arc(x, cp.y + (cp.dir > 0 ? -5 : 5), 3.2, 0, Math.PI * 2);
        ctx.fillStyle = cp.c; ctx.fill();
      }
    });
    ctx.font = '10px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = AZUL; ctx.fillText('adelante →', x0, 128);
    ctx.fillStyle = ROJO; ctx.fillText('← atrás', x0 + 78, 128);
    ctx.fillStyle = DIM;
    ctx.textAlign = 'right';
    ctx.fillText('2 capas', x0 + ancho, 128);

    // suma pesada -> vector
    const xv = x0 + paso * 1.5;
    ctx.strokeStyle = 'rgba(236,230,208,0.25)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xv, 143); ctx.lineTo(xv, 104); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(154,114,172,0.25)';
    ctx.fillRect(xv - 74, 78, 148, 24);
    ctx.strokeStyle = MOR; ctx.lineWidth = 1.4;
    ctx.strokeRect(xv - 74, 78, 148, 24);
    ctx.textAlign = 'center';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = MOR;
    ctx.fillText('suma pesada de capas', xv, 94);
    ctx.font = 'bold 12px Lora, serif';
    ctx.fillStyle = FG;
    ctx.fillText('el vector de «planta» en ESTA frase', x0 + ancho / 2, 62);

    ctx.font = 'italic 10.5px Lora, serif';
    ctx.fillStyle = DIM;
    ctx.fillText('cambia la frase → cambia el vector', x0 + ancho / 2, 284);
  }

  // ---------- panel medido ----------
  function panel() {
    const c = CTX_CASOS[palabra];
    const x0 = 392;
    ctx.textAlign = 'left';

    ctx.font = 'bold 14px Lora, serif';
    ctx.fillStyle = AMAR;
    ctx.fillText(`«${palabra}» en tres frases`, x0, 46);

    ctx.font = '12px Lora, serif';
    c.frases.forEach((f, i) => {
      ctx.fillStyle = DIM;
      ctx.fillText(`${i + 1}.`, x0, 72 + i * 20);
      ctx.fillStyle = FG;
      ctx.fillText(recorta(f, 52), x0 + 18, 72 + i * 20);
    });

    // matriz
    const yM = 156, cw = 74, ch = 30;
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText(estatico ? 'coseno con un embedding ESTÁTICO:'
                          : 'coseno entre los vectores contextuales:', x0, yM - 10);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const v = estatico ? 1.0 : c.cos[i][j];
        const x = x0 + 26 + j * cw, y = yM + i * ch;
        const diag = i === j;
        ctx.fillStyle = diag ? 'rgba(236,230,208,0.08)'
                            : `rgba(252,98,85,${0.10 + 0.5 * (1 - v)})`;
        ctx.fillRect(x, y, cw - 5, ch - 5);
        ctx.font = (diag ? '' : 'bold ') + '13px Fira Code, monospace';
        ctx.fillStyle = diag ? DIM : (v < 0.7 ? ROJO : FG);
        ctx.textAlign = 'center';
        ctx.fillText(v.toFixed(3), x + (cw - 5) / 2, y + 18);
      }
      ctx.textAlign = 'right';
      ctx.font = '11px Fira Code, monospace';
      ctx.fillStyle = DIM;
      ctx.fillText(String(i + 1), x0 + 20, yM + i * ch + 18);
    }

    ctx.textAlign = 'left';
    ctx.font = 'italic 12px Lora, serif';
    if (estatico) {
      ctx.fillStyle = ROJO;
      envolver('Word2Vec da UN vector por palabra: los tres serían idénticos. '
             + 'El sentido lo pone quien lee, no el modelo.', x0, yM + 108, 356, 16);
    } else {
      ctx.fillStyle = VERDE;
      const min = Math.min(...c.cos.flat());
      envolver(`El par más lejano baja a ${min.toFixed(3)}. Misma palabra, `
             + 'misma grafía, vectores distintos.', x0, yM + 108, 356, 16);
    }
    ctx.font = '9.5px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.34)';
    ctx.fillText('medido con mDeBERTa-v3-base (bidireccional)', x0, H - 8);
  }

  function recorta(t, n) { return t.length > n ? t.slice(0, n - 1) + '…' : t; }

  function envolver(txt, x, y, ancho, alto) {
    const pal = txt.split(' ');
    let linea = '', yy = y;
    pal.forEach(w => {
      const pr = linea ? linea + ' ' + w : w;
      if (ctx.measureText(pr).width > ancho && linea) {
        ctx.fillText(linea, x, yy); yy += alto; linea = w;
      } else linea = pr;
    });
    if (linea) ctx.fillText(linea, x, yy);
  }

  document.querySelectorAll('.ctx-pal-btn').forEach(b => {
    b.addEventListener('click', () => {
      palabra = b.dataset.p;
      document.querySelectorAll('.ctx-pal-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
      dibujar();
    });
  });
  document.querySelectorAll('.ctx-pal-btn').forEach(o => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (o.dataset.p === palabra ? '● ' : '○ ') + o.dataset.etq;
  });
  const be = document.getElementById('ctx-estatico');
  if (be) be.addEventListener('click', () => {
    estatico = !estatico;
    be.textContent = estatico ? '← ver el contextual' : 'comparar con estático →';
    dibujar();
  });

  dibujar();
}
