// ============================================================
// La matriz contrastiva de CLIP
// Tres imagenes contra seis descripciones, con los cosenos REALES
// medidos con openai/clip-vit-base-patch32 (datos en clip-data.js).
//
// El boton alterna entre el coseno crudo y lo que CLIP hace de
// verdad: multiplicar por una temperatura APRENDIDA y aplicar
// softmax por fila. Ese es el punto de la diapositiva — en crudo
// todos los numeros parecen iguales (0.13 a 0.26) y despues de la
// temperatura la decision es casi segura (1.000, 0.953, 0.997).
// ============================================================

const CLIP_ETIQUETAS = ['templo', 'flor', 'retrato', 'pasta', 'gato', 'gráfica'];

function initClipMatrixWidget() {
  const canvas = document.getElementById('clip-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof CLIP_SIM === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', VERDE = '#83C167', AMAR = '#FFFF00';

  let softmax = false;
  const imgs = CLIP_IMGS.map(o => { const im = new Image(); im.src = o.src; return im; });

  const X0 = 122, Y0 = 92, CW = 110, CH = 62;

  function matriz() { return softmax ? CLIP_PROB : CLIP_SIM; }

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const M = matriz();
    const vals = M.flat();
    const lo = Math.min(...vals), hi = Math.max(...vals);

    // ---- encabezados de columna ----
    ctx.font = '12px Lora, serif';
    ctx.fillStyle = DIM;
    ctx.textAlign = 'center';
    CLIP_ETIQUETAS.forEach((t, j) => {
      ctx.fillText(t, X0 + j * CW + CW / 2, Y0 - 12);
    });
    ctx.font = '11px Fira Code, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('texto  →', 24, Y0 - 12);

    // ---- filas ----
    CLIP_IMGS.forEach((o, i) => {
      const y = Y0 + i * CH;
      // miniatura
      const im = imgs[i];
      if (im && im.complete && im.naturalWidth) {
        ctx.save();
        ctx.beginPath(); ctx.rect(24, y + 5, 72, CH - 14); ctx.clip();
        ctx.drawImage(im, 24, y + 5, 72, (72 * im.naturalHeight) / im.naturalWidth);
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(236,230,208,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(24, y + 5, 72, CH - 14);

      // celdas
      const fila = M[i];
      const jmax = fila.indexOf(Math.max(...fila));
      fila.forEach((v, j) => {
        const x = X0 + j * CW;
        const t = (v - lo) / (hi - lo || 1);
        ctx.fillStyle = `rgba(88,196,221,${0.06 + 0.62 * t})`;
        ctx.fillRect(x + 3, y + 4, CW - 6, CH - 12);
        if (j === jmax) {
          ctx.strokeStyle = VERDE; ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 4, CW - 6, CH - 12);
        }
        ctx.font = (j === jmax ? 'bold ' : '') + '14px Fira Code, monospace';
        ctx.fillStyle = j === jmax ? VERDE : FG;
        ctx.textAlign = 'center';
        ctx.fillText(softmax ? v.toFixed(3) : v.toFixed(3), x + CW / 2, y + CH / 2 + 1);
      });
    });

    // ---- pie ----
    const yF = Y0 + 3 * CH + 16;
    ctx.textAlign = 'left';
    ctx.font = '12px Lora, serif';
    if (!softmax) {
      ctx.fillStyle = AMAR;
      ctx.fillText('Coseno crudo: todos los números se parecen (0.12 a 0.26)…', 24, yF);
      ctx.fillStyle = DIM;
      ctx.fillText('pero el mayor de cada fila ya es el correcto.', 24, yF + 18);
    } else {
      ctx.fillStyle = VERDE;
      ctx.fillText(`× ${CLIP_ESCALA.toFixed(0)} (temperatura aprendida) y softmax por fila:`, 24, yF);
      ctx.fillStyle = DIM;
      ctx.fillText('la misma matriz se vuelve una decisión. Eso es clasificación zero-shot.',
                   24, yF + 18);
    }
    ctx.font = '9.5px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.34)';
    ctx.fillText('CLIP ViT-B/32 · imágenes de scikit-learn (CC-BY 2.0) y matplotlib', 24, H - 7);
  }

  const b = document.getElementById('clip-softmax');
  if (b) b.addEventListener('click', () => {
    softmax = !softmax;
    b.textContent = softmax ? '← ver el coseno crudo' : '× temperatura y softmax →';
    dibujar();
  });

  let listo = false;
  function tick() {
    const todas = imgs.every(im => im.complete);
    if (!listo || todas) { dibujar(); listo = todas; }
    if (!todas) requestAnimationFrame(tick);
  }
  tick();
}
