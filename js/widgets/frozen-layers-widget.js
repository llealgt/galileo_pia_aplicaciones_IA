// ============================================================
// Congelar o descongelar: que se entrena en cada estrategia
// Dibuja MobileNetV2 bloque por bloque, con el ANCHO proporcional
// a sus parametros, y deja congelar/descongelar para ver que se
// entrena y cuanto cuesta.
//
// Los 19 bloques y sus parametros estan MEDIDOS con torchvision
// (mobilenet_v2, pesos por defecto). El total es 2,223,872 en
// features mas 1,281 de la cabeza binaria de los notebooks 13 y 14.
// El contador de entrenables se calcula de verdad al mover el
// slider, no es una tabla interpolada.
//
// El dato que sorprende: los ultimos 4 bloques concentran el 51 %
// de los parametros, asi que "descongelar unas capitas" no es
// barato.
// ============================================================

// parametros por bloque de features[0..18], medidos
const MNV2_BLOQUES = [928, 896, 5136, 8832, 10000, 14848, 14848, 21056, 54272,
                      54272, 54272, 66624, 118272, 118272, 155264, 320000,
                      320000, 473920, 412160];
const MNV2_CABEZA = 1281;          // cabeza binaria: 1280 -> 1 mas el sesgo
const MNV2_TOTAL = MNV2_BLOQUES.reduce((a, b) => a + b, 0) + MNV2_CABEZA;

// resultados medidos en los notebooks 13 y 14 (245 imagenes)
const MNV2_MEDIDO = {
  cero:    { keras: '67.3 %', torch: '70.6 %', nota: 'una CNN chica entrenada desde cero' },
  extrac:  { keras: '94.8 %', torch: '94.1 %', nota: 'el backbone no se toca' },
  fino:    { keras: '94.1 %', torch: '94.1 %', nota: 'con 245 imágenes no aportó nada' },
};

function initFrozenLayersWidget() {
  const canvas = document.getElementById('congelar-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AZUL = '#58C4DD', VERDE = '#83C167',
        ROJO = '#FC6255', NARANJA = '#FF862F', AMAR = '#FFFF00';

  let modo = 'extrac';        // 'cero' | 'extrac' | 'fino'
  let descongelados = 2;      // bloques descongelados en fine-tuning
  let t0 = performance.now();

  // cuantos bloques del final se entrenan segun el modo
  function nEntrenables() {
    if (modo === 'cero') return MNV2_BLOQUES.length;
    if (modo === 'extrac') return 0;
    return descongelados;
  }

  function paramsEntrenables() {
    const n = nEntrenables();
    let s = MNV2_CABEZA;
    for (let i = MNV2_BLOQUES.length - n; i < MNV2_BLOQUES.length; i++) s += MNV2_BLOQUES[i];
    return s;
  }

  // ---- geometria: el ancho de cada bloque es proporcional a sus parametros ----
  const X0 = 26, X1 = W - 322, YB = 132, ALTO = 62;   // deja sitio a la cabeza y al panel
  const MIN_W = 5;
  function anchos() {
    const bruto = MNV2_BLOQUES.map(p => Math.sqrt(p));       // raiz: si no, los primeros no se ven
    const suma = bruto.reduce((a, b) => a + b, 0);
    const disp = (X1 - X0) - MNV2_BLOQUES.length * 2;
    return bruto.map(v => Math.max(MIN_W, (v / suma) * disp));
  }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const AW = anchos();
    const nEnt = nEntrenables();
    const corte = MNV2_BLOQUES.length - nEnt;

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('MobileNetV2 · el ancho de cada bloque es proporcional a sus parámetros', X0, 34);

    // ---- los bloques ----
    let x = X0;
    MNV2_BLOQUES.forEach((p, i) => {
      const w = AW[i];
      const entrena = i >= corte;
      const col = entrena ? NARANJA : AZUL;
      ctx.fillStyle = col;
      ctx.globalAlpha = entrena ? 0.55 : 0.13;
      ctx.fillRect(x, YB, w, ALTO);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col;
      ctx.lineWidth = entrena ? 1.6 : 0.8;
      ctx.globalAlpha = entrena ? 1 : 0.45;
      ctx.strokeRect(x, YB, w, ALTO);
      ctx.globalAlpha = 1;
      if (!entrena && w > 13) {                    // candado en lo congelado
        ctx.font = '12px serif';
        ctx.fillStyle = 'rgba(236,230,208,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('❄', x + w / 2, YB + ALTO / 2 + 5);
        ctx.textAlign = 'left';
      }
      x += w + 2;
    });

    // ---- la cabeza ----
    const wc = 54;
    ctx.fillStyle = VERDE; ctx.globalAlpha = 0.5;
    ctx.fillRect(x + 8, YB, wc, ALTO);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = VERDE; ctx.lineWidth = 1.8;
    ctx.strokeRect(x + 8, YB, wc, ALTO);
    ctx.font = '10.5px Fira Code, monospace';
    ctx.fillStyle = VERDE; ctx.textAlign = 'center';
    ctx.fillText('cabeza', x + 8 + wc / 2, YB + ALTO / 2 + 4);
    ctx.fillText('nueva', x + 8 + wc / 2, YB + ALTO / 2 + 16);

    // ---- la linea de corte ----
    if (modo !== 'cero') {
      let xc = X0;
      for (let i = 0; i < corte; i++) xc += AW[i] + 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = AMAR; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(xc - 1, YB - 22); ctx.lineTo(xc - 1, YB + ALTO + 26); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '10.5px Fira Code, monospace';
      ctx.fillStyle = AMAR; ctx.textAlign = 'center';
      ctx.fillText(modo === 'extrac' ? 'todo congelado' : 'aquí se descongela', xc - 1, YB - 28);
    }

    // ---- el gradiente que viaja hacia atras y se detiene ----
    const p = ((performance.now() - t0) % 2600) / 2600;
    let xFin = X0;
    for (let i = 0; i < corte; i++) xFin += AW[i] + 2;
    const xIni = x + 8 + wc;
    const xg = xIni - p * (xIni - xFin);
    ctx.fillStyle = ROJO; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(xg, YB + ALTO + 12);
    ctx.lineTo(xg + 11, YB + ALTO + 6);
    ctx.lineTo(xg + 11, YB + ALTO + 18);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '10.5px Fira Code, monospace';
    ctx.fillStyle = ROJO; ctx.textAlign = 'left';
    ctx.fillText('el gradiente retrocede… y se detiene aquí', X0, YB + ALTO + 40);

    ctx.strokeStyle = 'rgba(252,98,85,0.35)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xFin, YB + ALTO + 12); ctx.lineTo(xIni, YB + ALTO + 12); ctx.stroke();
    ctx.setLineDash([]);

    panel();
  }

  function panel() {
    const x0 = W - 232;
    const ent = paramsEntrenables();
    const pct = ent / MNV2_TOTAL;
    const m = MNV2_MEDIDO[modo];

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('parámetros que se entrenan', x0, 44);
    ctx.font = 'bold 25px Fira Code, monospace';
    ctx.fillStyle = modo === 'extrac' ? VERDE : (modo === 'cero' ? ROJO : NARANJA);
    ctx.fillText(ent.toLocaleString('es'), x0, 74);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText(`${(pct * 100).toFixed(1)} % de los ${MNV2_TOTAL.toLocaleString('es')}`, x0, 92);

    // barra
    ctx.fillStyle = 'rgba(236,230,208,0.12)';
    ctx.fillRect(x0, 102, 200, 10);
    ctx.fillStyle = modo === 'extrac' ? VERDE : (modo === 'cero' ? ROJO : NARANJA);
    ctx.fillRect(x0, 102, Math.max(2, 200 * pct), 10);

    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('learning rate típico', x0, 142);
    ctx.font = 'bold 15px Fira Code, monospace';
    ctx.fillStyle = FG;
    ctx.fillText(modo === 'fino' ? '1e-5 … 1e-4' : '1e-3', x0, 162);
    if (modo === 'fino') {
      ctx.font = 'italic 10.5px Lora, serif';
      ctx.fillStyle = AMAR;
      ctx.fillText('10 a 100 veces más chico', x0, 178);
    }

    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('accuracy medida (245 fotos)', x0, 208);
    ctx.font = 'bold 14px Fira Code, monospace';
    ctx.fillStyle = FG;
    ctx.fillText(`${m.keras}  Keras`, x0, 228);
    ctx.fillText(`${m.torch}  PyTorch`, x0, 246);
    ctx.font = 'italic 11px Lora, serif';
    ctx.fillStyle = DIM;
    envolver(m.nota, x0, 266, 210, 14);
  }

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

  document.querySelectorAll('.congelar-btn').forEach(b => {
    b.addEventListener('click', () => {
      modo = b.dataset.modo;
      document.querySelectorAll('.congelar-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
      const s = document.getElementById('congelar-slider-caja');
      if (s) s.style.visibility = (modo === 'fino') ? 'visible' : 'hidden';
      t0 = performance.now();
    });
  });
  document.querySelectorAll('.congelar-btn').forEach(o => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (o.dataset.modo === modo ? '● ' : '○ ') + o.dataset.etq;
  });
  const sl = document.getElementById('congelar-slider');
  if (sl) sl.addEventListener('input', function () {
    descongelados = parseInt(this.value, 10);
    const et = document.getElementById('congelar-slider-valor');
    if (et) et.textContent = descongelados;
  });
  const caja = document.getElementById('congelar-slider-caja');
  if (caja) caja.style.visibility = 'hidden';

  (function tick() { dibujar(); requestAnimationFrame(tick); })();
}
