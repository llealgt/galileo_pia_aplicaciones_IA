// ============================================================
// Cortarle la cabeza a la red
// Dibuja una ResNet completa y deja quitarle el clasificador para
// que se vea que lo que queda ES el embedding.
//
// Los dos caminos estan MEDIDOS con la misma ResNet-50 (datos en
// js/widgets/cut-head-data.js):
//   con cabeza -> las 3 clases mas probables de las 1000 de ImageNet
//   sin cabeza -> los cosenos entre los vectores de 2048 dimensiones
//
// El contraste es el contenido: la cabeza apenas se compromete con
// la flor (daisy 0.08) mientras que el vector de la capa anterior
// separa escenas casi perfecto (0.97 la misma, 0.02 distinta).
// ============================================================

const CORTE_CAPAS = [
  { n: 'conv 1',  w: 26, h: 118, c: '#58C4DD' },
  { n: 'conv 2',  w: 24, h: 100, c: '#58C4DD' },
  { n: 'conv 3',  w: 22, h: 82,  c: '#58C4DD' },
  { n: 'conv 4',  w: 20, h: 64,  c: '#58C4DD' },
  { n: 'pool',    w: 16, h: 46,  c: '#5CD0B3' },
];

function initCutHeadWidget() {
  const canvas = document.getElementById('corte-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof CORTE_MUESTRAS === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMAR = '#FFFF00',
        VERDE = '#83C167', ROJO = '#FC6255';

  let cortada = false;
  let sel = 0;
  let tCorte = 0;          // 0..1 de la animacion del corte
  const imgs = {};
  let listas = 0;
  ['CHINA', 'FLOR'].forEach(k => {
    const im = new Image();
    im.onload = () => { listas++; };
    im.src = (k === 'CHINA') ? CORTE_IMG_CHINA : CORTE_IMG_FLOR;
    imgs[k] = im;
  });

  // ---- miniatura con su variante aplicada ----
  function dibujarMuestra(m, x, y, w, h) {
    const im = imgs[m.src];
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.fillStyle = 'rgba(236,230,208,0.12)';
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (m.modo === 'flip') {
      ctx.translate(x + w, y); ctx.scale(-1, 1);
      ctx.drawImage(im, 0, 0, w, h);
    } else if (m.modo === 'crop') {
      const f = 0.55;
      const sw = im.naturalWidth * f, sh = im.naturalHeight * f;
      ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2,
                    sw, sh, x, y, w, h);
    } else {
      ctx.drawImage(im, x, y, w, h);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(236,230,208,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const m = CORTE_MUESTRAS[sel];
    const cy = 150;

    // ---- la imagen de entrada ----
    dibujarMuestra(m, 24, cy - 42, 92, 70);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM; ctx.textAlign = 'center';
    ctx.fillText('entrada', 70, cy + 44);

    // ---- las capas convolucionales ----
    let x = 138;
    ctx.textAlign = 'center';
    CORTE_CAPAS.forEach(c => {
      ctx.fillStyle = c.c; ctx.globalAlpha = 0.28;
      ctx.fillRect(x, cy - c.h / 2, c.w, c.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c.c; ctx.lineWidth = 1.2;
      ctx.strokeRect(x, cy - c.h / 2, c.w, c.h);
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = DIM;
      ctx.fillText(c.n, x + c.w / 2, cy + c.h / 2 + 14);
      x += c.w + 16;
    });

    // ---- la capa que nos interesa: 2048 ----
    const xe = x + 6, we = 30, he = 92;
    const resaltada = cortada;
    ctx.fillStyle = resaltada ? VERDE : '#9A72AC';
    ctx.globalAlpha = resaltada ? 0.42 : 0.28;
    ctx.fillRect(xe, cy - he / 2, we, he);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = resaltada ? VERDE : '#9A72AC';
    ctx.lineWidth = resaltada ? 2.4 : 1.2;
    ctx.strokeRect(xe, cy - he / 2, we, he);
    ctx.font = 'bold 11px Fira Code, monospace';
    ctx.fillStyle = resaltada ? VERDE : '#9A72AC';
    ctx.fillText('2048', xe + we / 2, cy + he / 2 + 15);
    if (resaltada) {
      ctx.font = 'bold 12px Lora, serif';
      ctx.fillText('embedding', xe + we / 2, cy - he / 2 - 10);
    }

    // ---- la cabeza clasificadora ----
    const xh = xe + we + 30;
    const desliz = tCorte * 120;            // se cae al cortar
    const alpha = 1 - tCorte;
    if (alpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(0, desliz);
      ctx.fillStyle = ROJO; ctx.globalAlpha = alpha * 0.22;
      ctx.fillRect(xh, cy - 58, 26, 116);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ROJO; ctx.lineWidth = 1.2;
      ctx.strokeRect(xh, cy - 58, 26, 116);
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = ROJO; ctx.textAlign = 'center';
      ctx.fillText('FC 1000', xh + 13, cy + 72);
      ctx.fillText('softmax', xh + 13, cy - 68);
      ctx.restore();
    }

    // ---- la tijera / linea de corte ----
    const xc = xe + we + 15;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = cortada ? VERDE : 'rgba(252,98,85,0.7)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(xc, cy - 78); ctx.lineTo(xc, cy + 78); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '15px Lora, serif';
    ctx.fillStyle = cortada ? VERDE : ROJO;
    ctx.fillText('✂', xc, cy - 86);

    // ---- flechas entre bloques ----
    ctx.strokeStyle = 'rgba(236,230,208,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, cy); ctx.lineTo(134, cy); ctx.stroke();

    panel();
    leyendaImagenes();
  }

  function panel() {
    const m = CORTE_MUESTRAS[sel];
    const x0 = 520;
    let y = 44;
    ctx.textAlign = 'left';

    if (!cortada) {
      ctx.font = 'bold 15px Lora, serif';
      ctx.fillStyle = ROJO;
      ctx.fillText('Con la cabeza: una etiqueta', x0, y);
      ctx.font = '12px Lora, serif'; ctx.fillStyle = DIM;
      y = envolver('La red te devuelve una de las 1000 clases de ImageNet. '
                 + 'Nada más.', x0, y + 20, 356, 16) + 8;
      m.cabeza.forEach(([c, p]) => {
        // el marco marca el 1.0: sin el, una barra corta parece un error de
        // dibujo en vez de "el modelo apenas se compromete", que es el punto
        ctx.strokeStyle = 'rgba(236,230,208,0.18)'; ctx.lineWidth = 1;
        ctx.strokeRect(x0, y, 250, 13);
        ctx.fillStyle = 'rgba(252,98,85,0.55)';
        ctx.fillRect(x0, y, Math.max(2, p * 250), 13);
        ctx.font = '12px Fira Code, monospace';
        ctx.fillStyle = FG;
        ctx.fillText(`${p.toFixed(2)}  ${c}`, x0 + 6, y + 11);
        y += 19;
      });
      y += 12;
      ctx.font = 'italic 12px Lora, serif'; ctx.fillStyle = AMAR;
      envolver('¿Y si tu problema no es ninguna de esas 1000 clases? '
             + 'Fíjate en lo poco que se compromete con la flor.', x0, y, 356, 16);
      return;
    }

    ctx.font = 'bold 15px Lora, serif';
    ctx.fillStyle = VERDE;
    ctx.fillText('Sin la cabeza: un vector', x0, y);
    ctx.font = '12px Lora, serif'; ctx.fillStyle = DIM;
    y = envolver('Lo que queda son 2048 números que describen la imagen. '
               + 'Ya es un embedding.', x0, y + 20, 356, 16) + 4;
    ctx.font = '11px Fira Code, monospace'; ctx.fillStyle = FG;
    ctx.fillText('[' + CORTE_VECTOR.slice(0, 7).map(v => v.toFixed(3)).join(', ') + ', …]', x0, y + 10);
    ctx.font = 'italic 10.5px Lora, serif'; ctx.fillStyle = DIM;
    ctx.fillText('casi todos son cero: la capa sale de un ReLU', x0, y + 26);
    y += 42;

    ctx.font = '11px Fira Code, monospace'; ctx.fillStyle = DIM;
    ctx.fillText('coseno contra las demás:', x0, y);
    y += 6;
    CORTE_MUESTRAS.forEach((o, j) => {
      if (j === sel) return;
      const c = CORTE_COS[sel][j];
      const mismaEscena = (sel < 3) === (j < 3);
      y += 18;
      ctx.font = 'bold 12px Fira Code, monospace';
      ctx.fillStyle = mismaEscena ? VERDE : ROJO;
      ctx.fillText(c.toFixed(3), x0, y);
      ctx.font = '12px Lora, serif'; ctx.fillStyle = FG;
      ctx.fillText(o.n, x0 + 46, y);
      ctx.fillStyle = mismaEscena ? 'rgba(131,193,103,0.45)' : 'rgba(252,98,85,0.4)';
      ctx.fillRect(x0 + 150, y - 9, Math.max(2, Math.abs(c) * 200), 11);
    });
    y += 22;
    ctx.font = 'italic 12px Lora, serif'; ctx.fillStyle = AMAR;
    envolver('La red nunca vio estas imágenes juntas y aun así separa las '
           + 'escenas: 0.97 la misma, 0.02 distinta.', x0, y, 356, 16);
  }

  function leyendaImagenes() {
    ctx.font = '9.5px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.35)';
    ctx.textAlign = 'left';
    ctx.fillText('Imágenes: scikit-learn (china.jpg, flower.jpg) — CC-BY 2.0, '
               + 'danielbuechele y vultilion.', 24, H - 8);
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
    if (linea) { ctx.fillText(linea, x, yy); yy += alto; }
    return yy;
  }

  // ---- controles ----
  const bCortar = document.getElementById('corte-btn');
  if (bCortar) bCortar.addEventListener('click', () => {
    cortada = !cortada;
    bCortar.textContent = cortada ? '↩ volver a pegarla' : '✂ cortar el clasificador';
  });
  document.querySelectorAll('.corte-img-btn').forEach(b => {
    b.addEventListener('click', () => {
      sel = parseInt(b.dataset.i, 10);
      document.querySelectorAll('.corte-img-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
    });
  });
  document.querySelectorAll('.corte-img-btn').forEach((o, i) => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (i === 0 ? '● ' : '○ ') + o.dataset.etq;
  });

  function tick() {
    const objetivo = cortada ? 1 : 0;
    tCorte += (objetivo - tCorte) * 0.12;
    if (Math.abs(objetivo - tCorte) < 0.002) tCorte = objetivo;
    dibujar();
    requestAnimationFrame(tick);
  }
  tick();
}
