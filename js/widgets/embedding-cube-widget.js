// ============================================================
// Cubo de Embeddings
// Tres vistas de las MISMAS seis palabras:
//   2D    dos dimensiones inventadas -> rey y hombre caen encima
//   3D    la tercera dimension los separa; el cubo de juguete
//   real  proyeccion PCA de los embeddings de verdad (384 dims)
//
// El espacio de juguete es DIDACTICO: las coordenadas las asignamos
// nosotros. El espacio real esta MEDIDO con
// paraphrase-multilingual-MiniLM-L12-v2 (el mismo modelo del resto de
// la unidad) y proyectado con PCA; sus tres componentes explican el
// 89.7 % de la varianza de las seis palabras.
//
// Los cosenos entre desplazamientos tambien estan medidos: en el
// juguete los tres valen exactamente 1, en el real 0.68 / 0.41 / 0.40.
// ============================================================

// coordenadas inventadas: (humano, femenino, realeza)
const CUBO_JUGUETE = [
  { p: 'león',   c: [0, 0, 0], col: '#FF862F' },
  { p: 'leona',  c: [0, 1, 0], col: '#FF862F' },
  { p: 'hombre', c: [1, 0, 0], col: '#58C4DD' },
  { p: 'mujer',  c: [1, 1, 0], col: '#58C4DD' },
  { p: 'rey',    c: [1, 0, 1], col: '#FFFF00' },
  { p: 'reina',  c: [1, 1, 1], col: '#FFFF00' },
];

// PCA de los embeddings reales; se reescala a [0,1] al dibujar
const CUBO_REAL = [
  { p: 'hombre', c: [0.2688, -0.3864,  0.2514], col: '#58C4DD' },
  { p: 'mujer',  c: [0.3841,  0.3464,  0.1898], col: '#58C4DD' },
  { p: 'rey',    c: [0.0262, -0.4312, -0.2891], col: '#FFFF00' },
  { p: 'reina',  c: [0.2189,  0.1548, -0.1499], col: '#FFFF00' },
  { p: 'león',   c: [-0.7049, -0.0182, 0.1965], col: '#FF862F' },
  { p: 'leona',  c: [-0.1932, 0.3345, -0.1988], col: '#FF862F' },
];

const CUBO_PARES = [['hombre', 'mujer'], ['rey', 'reina'], ['león', 'leona']];

// cosenos medidos entre los tres desplazamientos, en el espacio real
const CUBO_COS_REAL = [
  ['hombre→mujer', 'rey→reina', 0.676],
  ['hombre→mujer', 'león→leona', 0.411],
  ['rey→reina', 'león→leona', 0.401],
];

function initEmbeddingCubeWidget() {
  const canvas = document.getElementById('emb-cube-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let vista = '2d';          // '2d' | '3d' | 'real'
  let flechas = false;
  let girando = true;
  let yaw = 0.7, pitch = 0.42;
  let arrastrando = false, lastX = 0, lastY = 0;

  const FG = '#ece6d0', DIM = '#8a86a0', VERDE = '#83C167', ROJO = '#FC6255';

  // ---- normaliza el conjunto activo a un cubo [0,1]^3 ----
  function datos() {
    const src = vista === 'real' ? CUBO_REAL : CUBO_JUGUETE;
    if (vista !== 'real') return src.map(d => ({ ...d }));
    const ejes = [0, 1, 2].map(k => {
      const vs = src.map(d => d.c[k]);
      return { min: Math.min(...vs), max: Math.max(...vs) };
    });
    return src.map(d => ({
      ...d,
      c: d.c.map((v, k) => (v - ejes[k].min) / (ejes[k].max - ejes[k].min || 1)),
    }));
  }

  // ---- proyeccion ----
  const CX = 292, CY = H / 2 + 6, ESC = 118;

  function proy(c) {
    if (vista === '2d') {
      // solo humano/animal y sexo; la realeza se ignora a proposito
      return { x: CX + (c[0] - 0.5) * ESC * 1.7, y: CY - (c[1] - 0.5) * ESC * 1.5, z: 0 };
    }
    const x = c[0] - 0.5, y = c[1] - 0.5, z = c[2] - 0.5;
    const cy_ = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = x * cy_ - z * sy;
    const z1 = x * sy + z * cy_;
    const y1 = y * cp - z1 * sp;
    const z2 = y * sp + z1 * cp;
    return { x: CX + x1 * ESC * 1.6, y: CY - y1 * ESC * 1.6, z: z2 };
  }

  function pt(nombre, D) { return D.find(d => d.p === nombre); }

  // ---- dibujo ----
  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const D = datos();

    dibujarEjes();

    // aristas del cubo de juguete
    if (vista === '3d') {
      ctx.strokeStyle = 'rgba(236,230,208,0.13)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const a = [(i >> 2) & 1, (i >> 1) & 1, i & 1];
        for (let b = 0; b < 3; b++) {
          if (a[b]) continue;
          const q = a.slice(); q[b] = 1;
          const P1 = proy(a), P2 = proy(q);
          ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
        }
      }
      // los dos vertices vacios
      ctx.fillStyle = 'rgba(236,230,208,0.22)';
      [[0, 0, 1], [0, 1, 1]].forEach(v => {
        const P = proy(v);
        ctx.beginPath(); ctx.arc(P.x, P.y, 4, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.font = 'italic 11px Lora, serif';
      ctx.fillStyle = 'rgba(236,230,208,0.4)';
      ctx.textAlign = 'center';
      const Pv = proy([0, 0.5, 1]);
      ctx.fillText('¿animal + realeza?', Pv.x, Pv.y - 12);
    }

    if (flechas) dibujarFlechas(D);

    // puntos, de atras hacia adelante
    const orden = D.map((d, i) => ({ d, P: proy(d.c), i }))
      .sort((a, b) => a.P.z - b.P.z);

    // en 2D, rey/reina caen sobre hombre/mujer: se marca
    const solapados = {};
    if (vista === '2d') {
      orden.forEach(o => {
        const k = Math.round(o.P.x) + ',' + Math.round(o.P.y);
        (solapados[k] = solapados[k] || []).push(o);
      });
    }

    orden.forEach(o => {
      const { d, P } = o;
      ctx.beginPath();
      ctx.arc(P.x, P.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = d.col;
      ctx.globalAlpha = vista === '2d' ? 1 : 0.55 + 0.45 * (P.z + 0.9);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    // etiquetas
    ctx.font = 'bold 14px Lora, serif';
    ctx.textAlign = 'center';
    if (vista === '2d') {
      Object.values(solapados).forEach(gr => {
        const P = gr[0].P;
        const nombres = gr.map(g => g.d.p);
        ctx.fillStyle = gr[0].d.col;
        ctx.fillText(nombres[0], P.x, P.y - 14);
        if (nombres.length > 1) {
          ctx.fillStyle = ROJO;
          ctx.fillText(nombres.slice(1).join(' · '), P.x, P.y + 26);
        }
      });
    } else {
      orden.forEach(o => {
        ctx.fillStyle = o.d.col;
        ctx.fillText(o.d.p, o.P.x, o.P.y - 14);
      });
    }

    panel();
  }

  function dibujarEjes() {
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.textAlign = 'center';
    if (vista === '2d') {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236,230,208,0.2)'; ctx.lineWidth = 1;
      ctx.moveTo(CX - 150, CY + 110); ctx.lineTo(CX + 150, CY + 110);
      ctx.moveTo(CX - 150, CY + 110); ctx.lineTo(CX - 150, CY - 110);
      ctx.stroke();
      ctx.fillText('animal  →  humano', CX, CY + 128);
      ctx.save();
      ctx.translate(CX - 166, CY); ctx.rotate(-Math.PI / 2);
      ctx.fillText('masculino  →  femenino', 0, 0);
      ctx.restore();
    } else {
      const O = proy([0, 0, 0]);
      const ejes = [
        { v: [1, 0, 0], t: vista === 'real' ? 'PC 1' : 'humano' },
        { v: [0, 1, 0], t: vista === 'real' ? 'PC 2' : 'femenino' },
        { v: [0, 0, 1], t: vista === 'real' ? 'PC 3' : 'realeza' },
      ];
      ejes.forEach(e => {
        const P = proy(e.v);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(236,230,208,0.28)'; ctx.lineWidth = 1;
        ctx.moveTo(O.x, O.y); ctx.lineTo(P.x, P.y); ctx.stroke();
        const dx = P.x - O.x, dy = P.y - O.y;
        const n = Math.hypot(dx, dy) || 1;
        ctx.fillStyle = DIM;
        ctx.fillText(e.t, P.x + dx / n * 34, P.y + dy / n * 34 + 4);
      });
    }
  }

  function dibujarFlechas(D) {
    CUBO_PARES.forEach(([a, b]) => {
      const A = pt(a, D), B = pt(b, D);
      if (!A || !B) return;
      const P1 = proy(A.c), P2 = proy(B.c);
      const col = vista === 'real' ? ROJO : VERDE;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.lineTo(P2.x, P2.y); ctx.stroke();
      const ang = Math.atan2(P2.y - P1.y, P2.x - P1.x);
      ctx.beginPath();
      ctx.moveTo(P2.x, P2.y);
      ctx.lineTo(P2.x - 9 * Math.cos(ang - 0.4), P2.y - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(P2.x - 9 * Math.cos(ang + 0.4), P2.y - 9 * Math.sin(ang + 0.4));
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function panel() {
    const x0 = 572, y0 = 34;
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Lora, serif';

    if (vista === '2d') {
      ctx.fillStyle = ROJO;
      ctx.fillText('Dos dimensiones no alcanzan', x0, y0);
      ctx.font = '12.5px Lora, serif'; ctx.fillStyle = FG;
      envolver('«rey» cae exactamente encima de «hombre», y «reina» encima de '
             + '«mujer»: con estos dos ejes son el mismo punto.', x0, y0 + 22, 278, 17);
      ctx.fillStyle = DIM;
      envolver('Hace falta un eje más para separarlos. Ese es todo el motivo de '
             + 'que un embedding real tenga cientos.', x0, y0 + 92, 278, 17);
      return;
    }

    if (vista === '3d') {
      ctx.fillStyle = VERDE;
      ctx.fillText('Aquí sí significan algo', x0, y0);
      ctx.font = '12.5px Lora, serif'; ctx.fillStyle = FG;
      envolver('Las tres coordenadas las inventamos nosotros: humano, femenino, '
             + 'realeza. Es un espacio de juguete.', x0, y0 + 22, 278, 17);
      ctx.font = '12.5px Fira Code, monospace';
      ctx.fillStyle = VERDE;
      ctx.fillText('rey − hombre + mujer', x0, y0 + 88);
      ctx.fillText('  = (1,1,1) = reina', x0, y0 + 106);
      ctx.font = '12.5px Lora, serif'; ctx.fillStyle = DIM;
      envolver('Los tres desplazamientos son el MISMO vector (0,1,0). '
             + 'La analogía sale exacta, no aproximada.', x0, y0 + 130, 278, 17);
      return;
    }

    ctx.fillStyle = '#FF862F';
    ctx.fillText('El espacio real, proyectado', x0, y0);
    ctx.font = '12.5px Lora, serif'; ctx.fillStyle = FG;
    envolver('384 dimensiones reducidas a 3 con PCA (89.7 % de la varianza). '
           + 'Los ejes ya no son «femenino» ni «realeza»: son componentes.',
      x0, y0 + 22, 278, 17);
    ctx.font = '12px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('coseno entre desplazamientos:', x0, y0 + 108);
    CUBO_COS_REAL.forEach((c, i) => {
      ctx.fillStyle = c[2] > 0.6 ? '#FFFF00' : ROJO;
      ctx.fillText(`${c[0]} · ${c[1]}`, x0, y0 + 128 + i * 30);
      ctx.fillText(`   ${c[2].toFixed(3)}`, x0, y0 + 143 + i * 30);
    });
    ctx.fillStyle = DIM;
    ctx.font = 'italic 12px Lora, serif';
    ctx.fillText('en el juguete los tres valen 1.000', x0, y0 + 228);
  }

  function envolver(txt, x, y, ancho, alto) {
    const pal = txt.split(' ');
    let linea = '', yy = y;
    pal.forEach(p => {
      const prueba = linea ? linea + ' ' + p : p;
      if (ctx.measureText(prueba).width > ancho && linea) {
        ctx.fillText(linea, x, yy); yy += alto; linea = p;
      } else linea = prueba;
    });
    if (linea) ctx.fillText(linea, x, yy);
  }

  // ---- interaccion ----
  function bind(id, fn) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', () => { fn(b); dibujar(); });
  }
  // El estado activo se pinta con estilo inline a proposito: con solo la clase
  // .active el boton de la izquierda se quedaba resaltado aunque la pestana
  // fuera otra, y en clase eso confunde. Inline gana sobre cualquier regla.
  // La pestana activa se marca con un punto en el TEXTO, no con color: la clase
  // .active del tema no se refleja de forma fiable en estos botones (el primero
  // se queda pintado aunque la pestana sea otra) y en clase eso confunde.
  // El texto es inequivoco y ademas se lee proyectado desde el fondo del aula.
  function pintarTabs() {
    document.querySelectorAll('.emb-cube-tab').forEach(b => {
      if (!b.dataset.etq) b.dataset.etq = b.textContent.trim();
      const on = b.dataset.vista === vista;
      b.classList.toggle('active', on);
      b.textContent = (on ? '● ' : '○ ') + b.dataset.etq;
    });
  }
  document.querySelectorAll('.emb-cube-tab').forEach(b => {
    b.addEventListener('click', () => {
      vista = b.dataset.vista;
      pintarTabs();
      const bg = document.getElementById('emb-cube-giro');
      if (bg) bg.style.display = vista === '2d' ? 'none' : '';
      dibujar();
    });
  });
  pintarTabs();
  bind('emb-cube-flechas', b => {
    flechas = !flechas;
    b.textContent = flechas ? '✔ desplazamientos' : '→ desplazamientos';
  });
  bind('emb-cube-giro', b => {
    girando = !girando;
    b.textContent = girando ? '⏸ pausar giro' : '▶ girar';
  });

  canvas.addEventListener('mousedown', e => {
    arrastrando = true; girando = false;
    const bg = document.getElementById('emb-cube-giro');
    if (bg) bg.textContent = '▶ girar';
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { arrastrando = false; });
  window.addEventListener('mousemove', e => {
    if (!arrastrando || vista === '2d') return;
    yaw += (e.clientX - lastX) * 0.01;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX; lastY = e.clientY;
    dibujar();
  });

  function tick() {
    if (girando && vista !== '2d' && !arrastrando) { yaw += 0.006; dibujar(); }
    requestAnimationFrame(tick);
  }
  dibujar();
  tick();
}
