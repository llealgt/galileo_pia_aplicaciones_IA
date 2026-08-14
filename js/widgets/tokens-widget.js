// ============================================================
// Qué ve el modelo: tokens
// Tokenizaciones REALES de Qwen2.5-1.5B-Instruct (datos en
// js/widgets/tokens-data.js). Cada caja es un token y debajo va su id.
//
// Dos cosas que el texto de la diapositiva no puede mostrar:
//   - los numeros se parten DIGITO POR DIGITO (4|4|7|1), que es la
//     explicacion de por que el modelo falla multiplicando
//   - el espanol gasta mas tokens que el ingles para decir lo mismo,
//     aunque la frase sea mas corta en caracteres. Se paga por token.
// ============================================================

function initTokensWidget() {
  const canvas = document.getElementById('tok-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof TOK_CASOS === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const FG = '#ece6d0', DIM = '#8a86a0', AMAR = '#FFFF00',
        VERDE = '#83C167', ROJO = '#FC6255';
  const PAL = ['#58C4DD', '#83C167', '#FF862F', '#9A72AC', '#5CD0B3', '#E48BB0'];

  let sel = 0;
  let verIds = false;

  function dibujar() {
    ctx.clearRect(0, 0, W, H);
    const c = TOK_CASOS[sel];

    // ---- el texto original ----
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('lo que escribes', 34, 40);
    ctx.font = '16px Lora, serif';
    ctx.fillStyle = FG;
    ctx.fillText(c.texto, 34, 64);

    // ---- las cajas de tokens ----
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('lo que ve el modelo', 34, 104);

    ctx.font = '14px Fira Code, monospace';
    let x = 34, y = 128;
    const alto = verIds ? 40 : 28;
    c.piezas.forEach((p, i) => {
      const vis = p.replace(/ /g, '␣');
      const w = ctx.measureText(vis).width + 14;
      if (x + w > W - 250) { x = 34; y += alto + 10; }
      const col = PAL[i % PAL.length];
      ctx.fillStyle = col; ctx.globalAlpha = 0.22;
      ctx.fillRect(x, y, w, 26);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, 26);
      ctx.fillStyle = FG;
      ctx.font = '14px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(vis, x + w / 2, y + 18);
      if (verIds) {
        ctx.font = '10px Fira Code, monospace';
        ctx.fillStyle = DIM;
        ctx.fillText(String(c.ids[i]), x + w / 2, y + 38);
      }
      ctx.textAlign = 'left';
      x += w + 6;
    });

    // ---- contadores ----
    const x0 = W - 214;
    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('caracteres', x0, 44);
    ctx.font = 'bold 24px Fira Code, monospace';
    ctx.fillStyle = FG;
    ctx.fillText(String(c.texto.length), x0, 70);

    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('tokens', x0, 100);
    ctx.font = 'bold 24px Fira Code, monospace';
    ctx.fillStyle = AMAR;
    ctx.fillText(String(c.ids.length), x0, 126);

    const cpt = c.texto.length / c.ids.length;
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('caracteres por token', x0, 156);
    ctx.font = 'bold 24px Fira Code, monospace';
    ctx.fillStyle = cpt < 2.4 ? ROJO : (cpt > 4 ? VERDE : FG);
    ctx.fillText(cpt.toFixed(2), x0, 182);

    // barra comparativa contra todos los casos
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = DIM;
    ctx.fillText('comparado con los demás', x0, 210);
    const maxc = Math.max(...TOK_CASOS.map(o => o.texto.length / o.ids.length));
    TOK_CASOS.forEach((o, i) => {
      const v = o.texto.length / o.ids.length;
      const yy = 224 + i * 17;
      ctx.fillStyle = i === sel ? AMAR : 'rgba(236,230,208,0.22)';
      ctx.fillRect(x0 + 52, yy, (v / maxc) * 120, 11);
      ctx.font = '10px Fira Code, monospace';
      ctx.fillStyle = i === sel ? AMAR : DIM;
      ctx.fillText(o.n, x0, yy + 10);
      ctx.fillText(v.toFixed(2), x0 + 176, yy + 10);
    });

    // ---- la moraleja de cada caso ----
    ctx.font = 'italic 12.5px Lora, serif';
    ctx.fillStyle = AMAR;
    const notas = {
      'común': '«gato» se parte en dos: g + ato. Una palabra corriente, dos tokens.',
      'rara': 'Cuanto más rara la palabra, en más pedazos cae: hiperinflación son 5.',
      'números': 'Los dígitos van UNO POR UNO: 4|4|7|1. El modelo nunca ve «4471».',
      'código': 'El código gasta muchísimo: cada símbolo tiende a ser su propio token.',
      'inglés': 'La MISMA frase del primer caso: 28 % menos caracteres… y menos tokens.',
      'emoji': 'Un emoji puede costar varios tokens; los signos de apertura, uno cada uno.',
    };
    envolver(notas[c.n] || '', 34, H - 34, W - 300, 16);
    ctx.font = '9.5px Lora, serif';
    ctx.fillStyle = 'rgba(236,230,208,0.34)';
    ctx.fillText('tokenizador de Qwen2.5-1.5B-Instruct  ·  ␣ marca el espacio dentro del token',
                 34, H - 10);
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

  document.querySelectorAll('.tok-btn').forEach(b => {
    b.addEventListener('click', () => {
      sel = parseInt(b.dataset.i, 10);
      document.querySelectorAll('.tok-btn').forEach(o => {
        if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
        const on = o === b;
        o.classList.toggle('active', on);
        o.textContent = (on ? '● ' : '○ ') + o.dataset.etq;
      });
      dibujar();
    });
  });
  document.querySelectorAll('.tok-btn').forEach((o, i) => {
    if (!o.dataset.etq) o.dataset.etq = o.textContent.trim();
    o.textContent = (i === 0 ? '● ' : '○ ') + o.dataset.etq;
  });
  const bi = document.getElementById('tok-ids');
  if (bi) bi.addEventListener('click', () => {
    verIds = !verIds;
    bi.textContent = verIds ? '✔ ver los ids' : 'ver los ids';
    dibujar();
  });

  dibujar();
}
