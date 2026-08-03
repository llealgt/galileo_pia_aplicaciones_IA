// ============================================================
// Chunking Widget
//
// Parte un documento REAL con las cuatro estrategias del modulo, sobre
// el mismo texto, para que se vean las fronteras que produce cada una:
//
//   fijo       -> corta cada N caracteres, sin mirar el contenido
//   traslape   -> igual, pero cada chunk repite el final del anterior
//   recursivo  -> corta en los separadores del texto (parrafo, oracion)
//   semantico  -> corta donde la distancia coseno entre oraciones
//                 consecutivas supera un umbral (distancias REALES,
//                 medidas con paraphrase-multilingual-MiniLM-L12-v2)
//
// El texto tiene dos temas (conciertos/hoteles y clima/transporte) y la
// distancia maxima medida, 0.958, cae exactamente en el cambio de tema.
// ============================================================

function initChunkingWidget() {
  const canvas = document.getElementById('chunking-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  if (typeof PROD_DEMO === 'undefined') return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const TXT = PROD_DEMO.chunks.texto;
  const ORA = PROD_DEMO.chunks.oraciones;
  const DIST = PROD_DEMO.chunks.dist;

  let modo = 'fijo';
  let tam = 200;        // caracteres por chunk
  let trasl = 10;       // porcentaje de traslape (10% es el del modulo: 25 car. en chunks de 250)
  let umbral = 0.90;    // umbral de distancia para el corte semantico

  // Cada estrategia devuelve una lista de {ini, fin} sobre el texto.
  function cortes() {
    if (modo === 'fijo' || modo === 'traslape') {
      const paso = modo === 'fijo' ? tam : Math.max(20, Math.round(tam * (1 - trasl / 100)));
      const out = [];
      for (let i = 0; i < TXT.length; i += paso) {
        out.push({ ini: i, fin: Math.min(TXT.length, i + tam) });
        if (i + tam >= TXT.length) break;
      }
      return out;
    }
    if (modo === 'recursivo') {
      // Corta en el separador mas grande que quepa: primero intenta juntar
      // oraciones completas hasta llenar el tamano, sin partir ninguna.
      const out = [];
      let ini = 0, acc = 0;
      let pos = 0;
      ORA.forEach((o, k) => {
        const largo = o.length + 1;
        if (acc > 0 && acc + largo > tam) {
          out.push({ ini: ini, fin: pos });
          ini = pos; acc = 0;
        }
        acc += largo; pos += largo;
        if (k === ORA.length - 1) out.push({ ini: ini, fin: TXT.length });
      });
      return out;
    }
    // semantico: corta donde la distancia entre oraciones supera el umbral
    const out = [];
    let ini = 0, pos = 0;
    ORA.forEach((o, k) => {
      pos += o.length + 1;
      const corta = k < DIST.length && DIST[k] > umbral;
      if (corta || k === ORA.length - 1) {
        out.push({ ini: ini, fin: Math.min(TXT.length, pos) });
        ini = pos;
      }
    });
    return out;
  }

  const PAL = ['#58C4DD', '#83C167', '#FF862F', '#9A72AC', '#E48BB0', '#5CD0B3',
    '#FFFF00', '#FC6255', '#8FA3C8', '#C8A05C'];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    const C = cortes();

    // ---- el texto, coloreado por chunk ----
    // se envuelve a mano para poder pintar cada caracter con el color del
    // chunk al que pertenece (y ver el traslape como color doble)
    ctx.font = '11px Fira Code, monospace';
    const anchoChar = ctx.measureText('M').width;
    const cols = Math.floor((W - 28) / anchoChar);
    const y0 = 34, alto = 15;

    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Documento (' + TXT.length + ' caracteres, ' + ORA.length + ' oraciones)', 14, 17);

    // a que chunks pertenece cada caracter
    const de = TXT.split('').map(() => []);
    C.forEach((c, k) => { for (let i = c.ini; i < c.fin; i++) if (de[i]) de[i].push(k); });

    // partir en lineas respetando palabras
    const lineas = [];
    let linea = '', iniLinea = 0, i = 0;
    const pal = TXT.split(' ');
    let cursor = 0;
    pal.forEach(p => {
      if (linea.length + p.length + 1 > cols) { lineas.push([linea, iniLinea]); linea = ''; iniLinea = cursor; }
      linea += (linea ? ' ' : '') + p;
      cursor += p.length + 1;
    });
    if (linea) lineas.push([linea, iniLinea]);

    ctx.font = '11px Fira Code, monospace';
    lineas.forEach(([txt, off], li) => {
      const y = y0 + li * alto;
      for (let k = 0; k < txt.length; k++) {
        const gi = off + k;
        const ch = de[gi] || [];
        const x = 14 + k * anchoChar;
        if (ch.length > 1) {
          // traslape: el fondo se parte en dos, con el color de cada chunk.
          // Mas opaco que un chunk simple para que salte a la vista.
          ctx.fillStyle = PAL[ch[0] % PAL.length] + '77';
          ctx.fillRect(x, y - 9, anchoChar, 6);
          ctx.fillStyle = PAL[ch[1] % PAL.length] + '77';
          ctx.fillRect(x, y - 3, anchoChar, 6);
        } else if (ch.length === 1) {
          ctx.fillStyle = PAL[ch[0] % PAL.length] + '44';
          ctx.fillRect(x, y - 9, anchoChar, 12);
        }
        ctx.fillStyle = ch.length ? '#ece6d0' : 'rgba(168,162,144,0.4)';
        ctx.fillText(txt[k], x, y);
      }
      // marcas de inicio de chunk
      for (let k = 0; k < txt.length; k++) {
        const gi = off + k;
        if (C.some(c => c.ini === gi)) {
          const idx = C.findIndex(c => c.ini === gi);
          ctx.strokeStyle = PAL[idx % PAL.length];
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(14 + k * anchoChar - 1, y - 11);
          ctx.lineTo(14 + k * anchoChar - 1, y + 5);
          ctx.stroke();
          // numero del chunk sobre la marca, para poder contarlos
          ctx.font = 'bold 7.5px Fira Code, monospace';
          ctx.textAlign = 'left';
          ctx.fillStyle = PAL[idx % PAL.length];
          ctx.fillText(String(idx + 1), 14 + k * anchoChar + 1, y - 6);
          ctx.font = '11px Fira Code, monospace';
        }
      }
    });

    // ---- perfil de distancias semanticas ----
    const yD = y0 + lineas.length * alto + 22;
    ctx.textAlign = 'left';
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.8)';
    ctx.fillText('Distancia coseno entre oraciones consecutivas (real)', 14, yD - 6);

    const bw = (W - 60) / DIST.length, bh = 42;
    DIST.forEach((d, k) => {
      const x = 30 + k * bw, h = d * bh;
      const activo = modo === 'semantico' && d > umbral;
      ctx.fillStyle = activo ? '#FC6255' : 'rgba(88,196,221,0.45)';
      ctx.fillRect(x, yD + bh - h, bw - 6, h);
      ctx.fillStyle = activo ? '#FC6255' : 'rgba(168,162,144,0.6)';
      ctx.font = '8.5px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.toFixed(2), x + (bw - 6) / 2, yD + bh + 10);
      ctx.fillText((k + 1) + '|' + (k + 2), x + (bw - 6) / 2, yD + bh + 20);
    });
    if (modo === 'semantico') {
      const yU = yD + bh - umbral * bh;
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#FFFF00'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(24, yU); ctx.lineTo(W - 20, yU); ctx.stroke();
      ctx.restore();
      ctx.textAlign = 'left';
      ctx.font = 'bold 9px Fira Code, monospace';
      ctx.fillStyle = '#FFFF00';
      ctx.fillText('umbral ' + umbral.toFixed(2), 26, yU - 3);
    }

    actualizarInfo(C);
  }

  function actualizarInfo(C) {
    const el = document.getElementById('chunking-info');
    if (!el) return;
    const largos = C.map(c => c.fin - c.ini);
    const prom = largos.reduce((a, b) => a + b, 0) / largos.length;
    // cuantos chunks parten una oracion por la mitad: es el defecto que
    // el chunking recursivo y el semantico evitan por construccion
    let cortados = 0, pos = 0;
    const fronteras = new Set([0]);
    ORA.forEach(o => { pos += o.length + 1; fronteras.add(pos); });
    C.forEach(c => { if (!fronteras.has(c.ini)) cortados++; });
    const total = C.reduce((a, c) => a + (c.fin - c.ini), 0);

    el.innerHTML =
      '<div class="widget-label"><span>Chunks generados</span>' +
      '<span class="widget-value">' + C.length + '</span></div>' +
      '<div class="widget-label"><span>Tamaño medio</span>' +
      '<span class="widget-value">' + prom.toFixed(0) + ' car. (' +
      Math.min.apply(null, largos) + '–' + Math.max.apply(null, largos) + ')</span></div>' +
      '<div class="widget-label"><span>Cortan una oración por la mitad</span>' +
      '<span class="widget-value" style="color:' +
      (cortados ? 'var(--c-red)' : 'var(--c-green)') + ';">' + cortados + ' de ' + C.length + '</span></div>' +
      '<div class="widget-label"><span>Texto almacenado</span>' +
      '<span class="widget-value" style="color:' +
      (total > TXT.length * 1.05 ? 'var(--c-orange)' : 'var(--c-text)') + ';">' +
      (100 * total / TXT.length).toFixed(0) + '% del original</span></div>';
  }

  document.querySelectorAll('.chunk-modo-btn').forEach(b => {
    b.addEventListener('click', () => {
      modo = b.dataset.modo;
      document.querySelectorAll('.chunk-modo-btn').forEach(x => x.classList.toggle('active', x === b));
      const pT = document.getElementById('chunk-p-tam');
      const pO = document.getElementById('chunk-p-trasl');
      const pU = document.getElementById('chunk-p-umbral');
      if (pT) pT.style.opacity = (modo === 'semantico') ? '0.25' : '1';
      if (pO) pO.style.opacity = (modo === 'traslape') ? '1' : '0.25';
      if (pU) pU.style.opacity = (modo === 'semantico') ? '1' : '0.25';
      draw();
    });
  });
  const s1 = document.getElementById('chunk-tam'), l1 = document.getElementById('chunk-tam-value');
  if (s1) s1.addEventListener('input', function () {
    tam = parseInt(this.value, 10); if (l1) l1.textContent = tam; draw();
  });
  const s2 = document.getElementById('chunk-trasl'), l2 = document.getElementById('chunk-trasl-value');
  if (s2) s2.addEventListener('input', function () {
    trasl = parseInt(this.value, 10); if (l2) l2.textContent = trasl + '%'; draw();
  });
  const s3 = document.getElementById('chunk-umbral'), l3 = document.getElementById('chunk-umbral-value');
  if (s3) s3.addEventListener('input', function () {
    umbral = parseInt(this.value, 10) / 100; if (l3) l3.textContent = umbral.toFixed(2); draw();
  });

  const ini = document.querySelector('.chunk-modo-btn[data-modo="fijo"]');
  if (ini) ini.classList.add('active');
  if (l1) l1.textContent = tam;
  if (l2) l2.textContent = trasl + '%';
  if (l3) l3.textContent = umbral.toFixed(2);
  const pO = document.getElementById('chunk-p-trasl');
  const pU = document.getElementById('chunk-p-umbral');
  if (pO) pO.style.opacity = '0.25';
  if (pU) pU.style.opacity = '0.25';
  draw();
}
