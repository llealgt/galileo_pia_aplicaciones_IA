// ============================================================
// Por qué alucinan, medido
// Tres preguntas a Qwen2.5-1.5B-Instruct: una que sabe, una que no
// puede saber y una que no existe. Se muestra la distribucion REAL
// del primer token de la respuesta y lo que contesta de verdad.
//
// El punto NO es que la distribucion sea igual —no lo es, la entropia
// va de 0.70 a 4.69 bits—. El punto es que la RESPUESTA sale igual de
// firme en los tres casos. La duda existe dentro del modelo y se
// pierde al elegir el token mas probable.
// ============================================================

function initHallucinationWidget() {
  const canvas = document.getElementById('aluc-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof ALUC_CASOS === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMAR = '#FFFF00',
        VERDE = '#83C167', ROJO = '#FC6255';

  let sel = 0;

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const c = ALUC_CASOS[sel];
    const sabe = sel === 0;

    // ---- la pregunta ----
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('le preguntas', 30, 34);
    ctx.font = '13.5px Lora, serif';
    ctx.fillStyle = FG;
    let y = envolver(c.preg, 30, 56, 400, 18);
    ctx.font = 'italic 11.5px Lora, serif';
    ctx.fillStyle = DIM;
    ctx.fillText('(' + c.nota + ')', 30, y + 4);

    // ---- lo que contesta ----
    const yr = 138;
    ctx.fillStyle = 'rgba(255,255,0,0.08)';
    ctx.fillRect(30, yr - 20, 400, 42);
    ctx.strokeStyle = 'rgba(255,255,0,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(30, yr - 20, 400, 42);
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('y contesta', 38, yr - 5);
    ctx.font = 'bold 20px Lora, serif';
    ctx.fillStyle = sabe ? VERDE : ROJO;
    ctx.fillText(c.resp, 38, yr + 15);

    ctx.font = 'italic 12px Lora, serif';
    ctx.fillStyle = sabe ? DIM : ROJO;
    envolver(sabe ? 'Correcto. Y sin ningún aviso, igual que los otros dos.'
                  : 'Se lo inventó. Sin avisar, sin dudar y sin decir que no sabe.',
             30, yr + 46, 400, 16);

    // ---- la distribucion ----
    const x0 = 470;
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('la distribución del primer token de esa respuesta', x0, 34);

    const maxp = Math.max(...ALUC_CASOS.map(o => o.probs[0]));
    c.piezas.forEach((pz, i) => {
      const p = c.probs[i];
      const yy = 54 + i * 22;
      const w = (p / maxp) * 250;
      ctx.fillStyle = i === 0 ? (sabe ? 'rgba(131,193,103,0.55)' : 'rgba(252,98,85,0.5)')
                              : 'rgba(88,196,221,0.28)';
      ctx.fillRect(x0 + 84, yy - 11, Math.max(1.5, w), 14);
      ctx.font = '12px Fira Code, monospace';
      ctx.fillStyle = i === 0 ? FG : DIM;
      ctx.textAlign = 'right';
      ctx.fillText(pz.replace(/ /g, '␣'), x0 + 76, yy);
      ctx.textAlign = 'left';
      ctx.fillStyle = i === 0 ? FG : DIM;
      ctx.fillText(p.toFixed(3), x0 + 84 + Math.max(1.5, w) + 8, yy);
    });

    // ---- entropia ----
    const ye = 54 + 10 * 22 + 16;
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('entropía (sobre las 151k opciones)', x0, ye);
    ctx.font = 'bold 22px Fira Code, monospace';
    ctx.fillStyle = sabe ? VERDE : ROJO;
    ctx.fillText(c.entropia.toFixed(2) + ' bits', x0, ye + 26);

    // comparativa
    ctx.font = '10.5px Fira Code, monospace';
    ALUC_CASOS.forEach((o, i) => {
      const yy = ye + 46 + i * 15;
      ctx.fillStyle = i === sel ? AMAR : DIM;
      ctx.fillText(o.n, x0, yy);
      ctx.fillStyle = i === sel ? 'rgba(255,255,0,0.5)' : 'rgba(236,230,208,0.2)';
      ctx.fillRect(x0 + 108, yy - 8, (o.entropia / 5) * 130, 10);
      ctx.fillStyle = i === sel ? AMAR : DIM;
      ctx.fillText(o.entropia.toFixed(2), x0 + 246, yy);
    });

    // ---- moraleja ----
    ctx.font = 'italic 12px Lora, serif';
    ctx.fillStyle = AMAR;
    envolver('La duda SÍ está dentro: de 0.70 a 4.69 bits. Lo que no está es '
           + 'en la respuesta — elegir el token más probable la borra.',
             30, H - 40, 400, 16);
    ctx.font = '9.5px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.34)';
    ctx.fillText('medido con Qwen2.5-1.5B-Instruct y su plantilla de chat', 30, H - 8);
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

  document.querySelectorAll('.aluc-btn').forEach(b => {
    b.addEventListener('click', () => {
      sel = parseInt(b.dataset.i, 10);
      document.querySelectorAll('.aluc-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
      dibujar();
    });
  });
  document.querySelectorAll('.aluc-btn').forEach((o, i) => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (i === 0 ? '● ' : '○ ') + o.dataset.etq;
  });

  dibujar();
}
