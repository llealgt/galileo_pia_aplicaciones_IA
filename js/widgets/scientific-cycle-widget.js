// ============================================================
// Ciclo Cientifico Aplicado al ML
// Anima el bucle hipotesis -> experimento -> medicion -> analisis
// -> nueva hipotesis, y en cada vuelta muestra una iteracion REAL
// de una investigacion sobre breast cancer con SVM.
//
// Los cuatro numeros de f1 (y sus desviaciones entre folds) estan
// medidos con el mismo setup del notebook 09: load_breast_cancer,
// y = 1 - target, split 80/20 con random_state=42, StratifiedKFold
// de 5 folds sobre el dev-set (n=455) y scoring="f1".
//
//   1. SVC() sin escalar                    0.875 +/- 0.053
//   2. StandardScaler + SVC()               0.961 +/- 0.008
//   3. StandardScaler + SVC(kernel=linear)  0.952 +/- 0.016
//   4. StandardScaler + SVC(C=10, g=0.01)   0.967 +/- 0.016
//
// La iteracion 3 REFUTA su hipotesis a proposito: es el punto
// didactico central del ciclo — un resultado negativo tambien
// descarta una rama del espacio de busqueda.
// ============================================================

const CICLO_ETAPAS = [
  { nombre: 'HIPÓTESIS', icono: '💡', color: '#58C4DD' },
  { nombre: 'EXPERIMENTO', icono: '🧪', color: '#FF862F' },
  { nombre: 'MEDICIÓN', icono: '📏', color: '#FFFF00' },
  { nombre: 'ANÁLISIS', icono: '🔍', color: '#5CD0B3' },
];

const CICLO_ITERACIONES = [
  {
    titulo: 'Iteración 1 — el punto de partida',
    f1: 0.875, sd: 0.053, veredicto: 'refutada',
    texto: [
      'Un SVM con los valores por defecto basta para este problema.',
      'SVC() sobre las 30 features crudas, 5-fold sobre el dev-set (n = 455).',
      'f1 = 0.875 ± 0.053',
      'Bajo e inestable. Las features van de 0.1 a 2500 y el kernel RBF mide ' +
      'distancias → sospecha: hay que escalar.',
    ],
  },
  {
    titulo: 'Iteración 2 — la sospecha se pone a prueba',
    f1: 0.961, sd: 0.008, veredicto: 'confirmada',
    texto: [
      'Estandarizar las features mejora el f1.',
      'StandardScaler + SVC(), exactamente los mismos folds que antes.',
      'f1 = 0.961 ± 0.008   (+0.086)',
      'Confirmada. Y la desviación entre folds cayó 6× : no solo es mejor, ' +
      'es más estable.',
    ],
  },
  {
    titulo: 'Iteración 3 — la hipótesis que no era',
    f1: 0.952, sd: 0.016, veredicto: 'refutada',
    texto: [
      'El problema es casi lineal: kernel="linear" debería igualar al RBF.',
      'Mismo pipeline y mismos folds, cambiando solo el kernel.',
      'f1 = 0.952 ± 0.016   (−0.009)',
      'REFUTADA — y eso también es un resultado: descarta una rama y confirma ' +
      'que la no-linealidad del RBF sí aporta.',
    ],
  },
  {
    titulo: 'Iteración 4 — el límite del tanteo',
    f1: 0.967, sd: 0.016, veredicto: 'dudosa',
    texto: [
      'Mover C y gamma a mano mejora sobre los valores por defecto.',
      '5 combinaciones elegidas a ojo, mismos folds.',
      'mejor C=10, γ=0.01 → 0.967 ± 0.016    peor C=1, γ=0.1 → 0.944',
      'La mejora (+0.006) es MENOR que la desviación entre folds: a ojo no ' +
      'sabemos si ganamos. Hace falta buscar de forma sistemática.',
    ],
  },
];

function initScientificCycleWidget() {
  const canvas = document.getElementById('sci-cycle-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const CX = 195, CY = 200, R = 124;      // centro y radio del ciclo
  const PANEL_X = 380;
  const PANEL_W = 476;                    // ancho util del texto del panel

  // fase continua en [0,4): la parte entera es la etapa activa.
  // El primer 45% de cada unidad el punto se queda en el nodo (dwell),
  // el 55% restante viaja hacia el siguiente.
  const DWELL = 0.45;
  const VELOCIDAD = 0.0060;               // fase por milisegundo escalada abajo

  let fase = 0;
  let iter = 0;
  let corriendo = true;
  let ultimoT = null;
  let raf = null;

  function posNodo(i) {
    const ang = -Math.PI / 2 + i * Math.PI / 2;   // 12, 3, 6, 9 en punto
    return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang), ang: ang };
  }

  function suavizar(t) { return t * t * (3 - 2 * t); }   // smoothstep

  // ---------- texto ----------
  function envolver(texto, maxAncho) {
    const palabras = texto.split(' ');
    const lineas = [];
    let actual = '';
    for (const p of palabras) {
      const prueba = actual ? actual + ' ' + p : p;
      if (ctx.measureText(prueba).width > maxAncho && actual) {
        lineas.push(actual);
        actual = p;
      } else {
        actual = prueba;
      }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  function nodoRedondeado(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- dibujo ----------
  function dibujarCiclo(etapaActiva, tViaje) {
    // arco de fondo
    ctx.strokeStyle = 'rgba(168,162,144,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // el tramo que cierra el ciclo (analisis -> hipotesis) va resaltado:
    // es la parte que la gente olvida, "volver a empezar"
    ctx.strokeStyle = etapaActiva === 3 ? '#FFFF00' : 'rgba(255,255,0,0.35)';
    ctx.lineWidth = etapaActiva === 3 ? 3 : 2;
    ctx.beginPath();
    ctx.arc(CX, CY, R, Math.PI, Math.PI * 1.5);
    ctx.stroke();

    // puntas de flecha a mitad de cada tramo
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 2 + Math.PI / 4;
      const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
      const tang = a + Math.PI / 2;                    // sentido horario
      ctx.fillStyle = i === 3 ? '#FFFF00' : 'rgba(168,162,144,0.55)';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tang);
      ctx.beginPath();
      ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // etiqueta del tramo de cierre
    ctx.fillStyle = etapaActiva === 3 ? '#FFFF00' : 'rgba(255,255,0,0.5)';
    ctx.font = 'italic 10px Lora, serif';
    ctx.textAlign = 'center';
    const lx = CX + (R + 26) * Math.cos(Math.PI * 1.25);
    const ly = CY + (R + 26) * Math.sin(Math.PI * 1.25);
    ctx.fillText('nueva hipótesis', lx, ly);

    // nodos
    const BW = 130, BH = 40;
    for (let i = 0; i < 4; i++) {
      const p = posNodo(i);
      const activo = (i === etapaActiva);
      const et = CICLO_ETAPAS[i];

      if (activo) {                                    // halo del nodo activo
        ctx.fillStyle = et.color + '22';
        nodoRedondeado(p.x - BW / 2 - 4, p.y - BH / 2 - 4, BW + 8, BH + 8, 12);
        ctx.fill();
      }
      ctx.fillStyle = activo ? '#232340' : '#1f1f38';
      nodoRedondeado(p.x - BW / 2, p.y - BH / 2, BW, BH, 9);
      ctx.fill();
      ctx.strokeStyle = activo ? et.color : 'rgba(168,162,144,0.35)';
      ctx.lineWidth = activo ? 2 : 1;
      nodoRedondeado(p.x - BW / 2, p.y - BH / 2, BW, BH, 9);
      ctx.stroke();

      ctx.font = '16px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = activo ? 1 : 0.5;
      ctx.fillText(et.icono, p.x - BW / 2 + 11, p.y + 1);
      ctx.fillStyle = activo ? et.color : '#a8a290';
      ctx.font = (activo ? 'bold ' : '') + '11.5px Fira Code, monospace';
      ctx.fillText(et.nombre, p.x - BW / 2 + 36, p.y + 1);
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
    }

    // el punto que viaja
    // solo mientras viaja: al llegar "se funde" en el nodo, que ya queda resaltado
    if (tViaje > 0) {
      const a0 = -Math.PI / 2 + etapaActiva * Math.PI / 2;
      const ang = a0 + suavizar(tViaje) * Math.PI / 2;
      const px = CX + R * Math.cos(ang), py = CY + R * Math.sin(ang);
      const col = CICLO_ETAPAS[etapaActiva].color;
      ctx.globalAlpha = Math.min(1, Math.sin(Math.PI * tViaje) * 2.2);
      ctx.fillStyle = col + '55';
      ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // numero de iteracion al centro
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8a290';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillText('vuelta', CX, CY - 10);
    ctx.fillStyle = '#ece6d0';
    ctx.font = 'bold 30px Fira Code, monospace';
    ctx.fillText(String(iter + 1), CX, CY + 22);
  }

  function dibujarPanel(etapaActiva) {
    const it = CICLO_ITERACIONES[iter];
    ctx.textAlign = 'left';

    ctx.fillStyle = '#58C4DD';
    ctx.font = 'bold 13px Fira Code, monospace';
    ctx.fillText(it.titulo, PANEL_X, 26);

    let y = 48;
    for (let i = 0; i < 4; i++) {
      const et = CICLO_ETAPAS[i];
      const visto = i <= etapaActiva;
      const activo = i === etapaActiva;
      ctx.globalAlpha = visto ? 1 : 0.28;

      if (activo) {                                    // barra lateral del activo
        ctx.fillStyle = et.color;
        ctx.fillRect(PANEL_X - 10, y - 11, 3, 14);
      }
      ctx.fillStyle = et.color;
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.fillText(et.nombre, PANEL_X, y);

      // la medicion se muestra en monoespaciado y grande: es el dato duro
      const esMedicion = (i === 2);
      ctx.fillStyle = esMedicion ? '#FFFF00' : '#ece6d0';
      ctx.font = esMedicion ? 'bold 13px Fira Code, monospace' : '12px Lora, serif';
      const lineas = envolver(it.texto[i], PANEL_W);
      let yy = y + 16;
      for (const ln of lineas) { ctx.fillText(ln, PANEL_X, yy); yy += 15; }
      y = yy + 13;
      ctx.globalAlpha = 1;
    }

    // veredicto de la vuelta, una vez completada
    if (etapaActiva === 3) {
      y -= 4;
      const v = it.veredicto;
      const col = v === 'confirmada' ? '#83C167' : (v === 'refutada' ? '#FC6255' : '#FF862F');
      const txt = v === 'confirmada' ? '✔ hipótesis confirmada'
                : (v === 'refutada' ? '✘ hipótesis refutada' : '≈ mejora dentro del ruido');
      ctx.fillStyle = col;
      ctx.font = 'bold 12px Fira Code, monospace';
      ctx.fillText(txt, PANEL_X, y);
    }
  }

  function dibujarProgreso() {
    // f1 por vuelta, con la barra de error de los 5 folds
    const x0 = PANEL_X + 22, x1 = W - 22, y0 = 312, y1 = 372;
    const LO = 0.80, HI = 1.00;
    const py = v => y1 - (v - LO) / (HI - LO) * (y1 - y0);

    ctx.strokeStyle = 'rgba(168,162,144,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();

    ctx.fillStyle = '#a8a290';
    ctx.font = '9px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('f1 de cross-validation por vuelta (± 1 sd entre folds)', x0, y0 - 8);
    ctx.textAlign = 'right';
    ctx.fillText('eje recortado 0.80–1.00', x1, y0 - 8);

    const paso = (x1 - x0) / 4;
    for (let i = 0; i < 4; i++) {
      const it = CICLO_ITERACIONES[i];
      const cx = x0 + paso * (i + 0.5);
      const revelado = i <= iter;
      ctx.globalAlpha = revelado ? 1 : 0.18;

      // linea que une con la vuelta anterior
      if (i > 0) {
        ctx.strokeStyle = 'rgba(88,196,221,0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - paso, py(CICLO_ITERACIONES[i - 1].f1));
        ctx.lineTo(cx, py(it.f1));
        ctx.stroke();
      }
      // barra de error +/- 1 sd entre folds
      ctx.strokeStyle = revelado ? 'rgba(236,230,208,0.55)' : 'rgba(236,230,208,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, py(it.f1 - it.sd)); ctx.lineTo(cx, py(it.f1 + it.sd));
      ctx.moveTo(cx - 4, py(it.f1 - it.sd)); ctx.lineTo(cx + 4, py(it.f1 - it.sd));
      ctx.moveTo(cx - 4, py(it.f1 + it.sd)); ctx.lineTo(cx + 4, py(it.f1 + it.sd));
      ctx.stroke();

      const col = i === iter ? '#FFFF00' : '#58C4DD';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(cx, py(it.f1), i === iter ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = i === iter ? '#FFFF00' : '#a8a290';
      ctx.font = '9px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(it.f1.toFixed(3), cx, py(it.f1) - 10);
      ctx.fillStyle = '#a8a290';
      ctx.fillText('vuelta ' + (i + 1), cx, y1 + 13);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const etapa = Math.floor(fase) % 4;
    const local = fase - Math.floor(fase);
    const tViaje = local < DWELL ? 0 : (local - DWELL) / (1 - DWELL);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    dibujarCiclo(etapa, tViaje);
    dibujarPanel(etapa);
    dibujarProgreso();
  }

  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (canvas.offsetParent === null) { ultimoT = null; return; }   // slide oculto
    if (!corriendo) { ultimoT = t; draw(); return; }
    if (ultimoT === null) ultimoT = t;
    const dt = Math.min(t - ultimoT, 100);
    ultimoT = t;

    const antes = Math.floor(fase);
    fase += dt * VELOCIDAD / 4;
    if (Math.floor(fase) !== antes && Math.floor(fase) >= 4) {
      fase -= 4;
      iter = (iter + 1) % CICLO_ITERACIONES.length;
    }
    draw();
  }

  // ---------- controles ----------
  const btnPlay = document.getElementById('sci-cycle-play');
  const btnPaso = document.getElementById('sci-cycle-step');
  const btnReset = document.getElementById('sci-cycle-reset');

  function etiquetaPlay() {
    if (btnPlay) btnPlay.textContent = corriendo ? '⏸ Pausar' : '▶ Reproducir';
  }
  if (btnPlay) btnPlay.addEventListener('click', () => {
    corriendo = !corriendo; ultimoT = null; etiquetaPlay();
  });
  if (btnPaso) btnPaso.addEventListener('click', () => {
    corriendo = false; etiquetaPlay();
    fase = Math.floor(fase) + 1;
    if (fase >= 4) { fase = 0; iter = (iter + 1) % CICLO_ITERACIONES.length; }
    draw();
  });
  if (btnReset) btnReset.addEventListener('click', () => {
    fase = 0; iter = 0; corriendo = true; ultimoT = null; etiquetaPlay();
  });
  etiquetaPlay();

  raf = requestAnimationFrame(tick);
}
