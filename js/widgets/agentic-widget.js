// ============================================================
// Agentic Workflows Widget
//
// Anima las cuatro formas de encadenar llamadas a un LLM que describe el
// modulo: secuencial, condicional, iterativo y paralelo. Para cada una se
// recorre el flujo paso a paso y se van acumulando llamadas, latencia y
// costo, que es lo que de verdad decide cual usar.
//
// Los tiempos y precios son de referencia (modelo pequeno ~0.4 s y
// $0.0002 por llamada; modelo grande ~1.8 s y $0.003), no medidos: sirven
// para comparar las formas entre si, no para predecir una factura.
// ============================================================

function initAgenticWidget() {
  const canvas = document.getElementById('agentic-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // t = segundos, $ = dolares por llamada; 'g' marca modelo grande
  const CH = { t: 0.4, c: 0.0002 };     // chico
  const GR = { t: 1.8, c: 0.003 };      // grande

  // Cada flujo es una lista de etapas. `par` agrupa etapas simultaneas.
  const FLUJOS = {
    secuencial: {
      nom: 'Secuencial', desc: 'cada llamada prepara la siguiente',
      uso: 'parsear → reescribir → responder → citar',
      etapas: [
        { n: 'Parser', m: CH, y: 0 },
        { n: 'Reescritor', m: CH, y: 0 },
        { n: 'Generador', m: GR, y: 0 },
        { n: 'Citador', m: CH, y: 0 },
      ],
    },
    condicional: {
      nom: 'Condicional', desc: 'un router decide qué camino tomar',
      uso: 'saludo → responder directo; pregunta de datos → RAG completo',
      etapas: [
        { n: 'Router', m: CH, y: 0 },
        { n: 'Retriever', m: null, y: -1, rama: 'a' },
        { n: 'Generador\ncon RAG', m: GR, y: -1, rama: 'a' },
        { n: 'Respuesta\ndirecta', m: CH, y: 1, rama: 'b' },
      ],
      ramas: true,
    },
    iterativo: {
      nom: 'Iterativo', desc: 'un evaluador decide si hay que reintentar',
      uso: 'escribir → evaluar → corregir, hasta que pase el criterio',
      etapas: [
        { n: 'Escritor', m: GR, y: 0 },
        { n: 'Evaluador', m: CH, y: 0 },
        { n: 'Escritor\n(2ª vuelta)', m: GR, y: 0 },
        { n: 'Evaluador', m: CH, y: 0 },
      ],
      bucle: true,
    },
    paralelo: {
      nom: 'Paralelo', desc: 'varias llamadas a la vez, luego se juntan',
      uso: 'buscar en 3 fuentes distintas y sintetizar',
      etapas: [
        { n: 'Orquestador', m: CH, y: 0 },
        { n: 'Agente 1', m: CH, y: -1, par: 1 },
        { n: 'Agente 2', m: CH, y: 0, par: 1 },
        { n: 'Agente 3', m: CH, y: 1, par: 1 },
        { n: 'Sintetizador', m: GR, y: 0 },
      ],
    },
  };

  let flujo = 'secuencial';
  let paso = 0, timer = null;

  function metricas() {
    const F = FLUJOS[flujo];
    const hasta = F.etapas.slice(0, paso);
    let llamadas = 0, costo = 0, t = 0;
    const grupos = {};
    hasta.forEach(e => {
      if (!e.m) return;
      llamadas++; costo += e.m.c;
      if (e.par) { grupos[e.par] = Math.max(grupos[e.par] || 0, e.m.t); }
      else t += e.m.t;
    });
    Object.values(grupos).forEach(v => { t += v; });   // los paralelos cuestan el mas lento
    return { llamadas: llamadas, costo: costo, t: t, total: F.etapas.length };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);
    const F = FLUJOS[flujo];

    ctx.textAlign = 'left';
    ctx.font = 'bold 12.5px Fira Code, monospace';
    ctx.fillStyle = '#FFFF00';
    ctx.fillText(F.nom, 14, 18);
    ctx.font = '10.5px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.85)';
    ctx.fillText('— ' + F.desc, 14 + ctx.measureText(F.nom).width + 34, 18);
    ctx.font = '10px Fira Code, monospace';
    ctx.fillStyle = 'rgba(168,162,144,0.6)';
    ctx.fillText('ejemplo: ' + F.uso, 14, 34);

    const n = F.etapas.length;
    const cw = Math.min(132, (W - 150) / n), cx0 = 78, cy = 130, gap = 60;
    const paso1 = (W - 150) / n;

    // nodo inicial y final
    function caja(x, y, w, h, txt, col, activo, sub) {
      ctx.fillStyle = activo ? col : 'rgba(168,162,144,0.10)';
      ctx.globalAlpha = activo ? 0.20 : 1;
      ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = activo ? col : 'rgba(168,162,144,0.25)';
      ctx.lineWidth = activo ? 2 : 1;
      ctx.strokeRect(x, y, w, h);
      ctx.textAlign = 'center';
      ctx.font = (activo ? 'bold ' : '') + '10px Fira Code, monospace';
      ctx.fillStyle = activo ? col : 'rgba(168,162,144,0.45)';
      const lineas = txt.split('\n');
      lineas.forEach((l, k) => ctx.fillText(l, x + w / 2, y + h / 2 + 4 + (k - (lineas.length - 1) / 2) * 11));
      if (sub && activo) {
        ctx.font = '8px Fira Code, monospace';
        ctx.fillStyle = 'rgba(168,162,144,0.7)';
        ctx.fillText(sub, x + w / 2, y + h + 11);
      }
    }

    caja(10, cy - 16, 56, 32, 'Prompt', '#58C4DD', true);

    F.etapas.forEach((e, i) => {
      const x = cx0 + i * paso1;
      const y = cy - 20 + e.y * gap;
      const activo = i < paso;
      const col = e.m === GR ? '#FC6255' : e.m === CH ? '#9A72AC' : '#83C167';
      const sub = e.m ? (e.m === GR ? 'grande · 1.8s' : 'chico · 0.4s') : 'sin LLM';

      // De donde vienen las flechas hacia esta etapa. Si la etapa anterior
      // era un grupo paralelo, convergen TODAS: es lo que distingue al
      // patron paralelo de una simple cadena.
      let origenes = [];
      if (i === 0) origenes = [[66, cy]];
      else if (e.par) origenes = [[cx0 + cw, cy - 4 + F.etapas[0].y * gap]];
      else {
        const prevPar = F.etapas[i - 1].par;
        if (prevPar) {
          F.etapas.forEach((o, k) => {
            if (o.par === prevPar) origenes.push([cx0 + k * paso1 + cw, cy - 4 + o.y * gap]);
          });
        } else {
          origenes = [[cx0 + (i - 1) * paso1 + cw, cy - 4 + F.etapas[i - 1].y * gap]];
        }
      }
      ctx.strokeStyle = activo ? 'rgba(236,230,208,0.55)' : 'rgba(168,162,144,0.18)';
      ctx.lineWidth = 1.5;
      origenes.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + 18, py, x - 18, y + 20, x, y + 20);
        ctx.stroke();
      });
      if (activo) {
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 16); ctx.lineTo(x, y + 20); ctx.lineTo(x - 6, y + 24);
        ctx.stroke();
      }

      caja(x, y, cw, 40, e.n, col, activo, sub);

      // etiqueta de rama en el condicional
      if (F.ramas && e.rama) {
        ctx.textAlign = 'left';
        ctx.font = '8.5px Fira Code, monospace';
        ctx.fillStyle = activo ? '#FFFF00' : 'rgba(168,162,144,0.3)';
        ctx.fillText(e.rama === 'a' ? 'necesita datos' : 'no los necesita', x - 62, y + 12);
      }
    });

    // flecha de vuelta del bucle iterativo
    if (F.bucle && paso >= 2) {
      const xa = cx0 + 1 * paso1 + cw / 2, xb = cx0 + 2 * paso1 + cw / 2;
      ctx.strokeStyle = 'rgba(255,134,47,0.8)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xa, cy + 24);
      ctx.bezierCurveTo(xa, cy + 62, xb, cy + 62, xb, cy + 24);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = 'center';
      ctx.font = '9px Fira Code, monospace';
      ctx.fillStyle = '#FF862F';
      ctx.fillText('no pasó → reintentar', (xa + xb) / 2, cy + 74);
    }

    // respuesta final
    const listo = paso >= n;
    caja(W - 72, cy - 16, 62, 32, 'Respuesta', '#83C167', listo);

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('agentic-info');
    if (!el) return;
    const m = metricas();
    el.innerHTML =
      '<div class="widget-label"><span>Etapas recorridas</span>' +
      '<span class="widget-value">' + Math.min(paso, m.total) + ' / ' + m.total + '</span></div>' +
      '<div class="widget-label"><span>Llamadas a un LLM</span>' +
      '<span class="widget-value" style="color:var(--c-blue);">' + m.llamadas + '</span></div>' +
      '<div class="widget-label"><span>Latencia acumulada</span>' +
      '<span class="widget-value" style="color:' +
      (m.t > 3 ? 'var(--c-red)' : m.t > 1.5 ? 'var(--c-orange)' : 'var(--c-green)') + ';">' +
      m.t.toFixed(1) + ' s</span></div>' +
      '<div class="widget-label"><span>Costo por consulta</span>' +
      '<span class="widget-value">$' + m.costo.toFixed(5) + '</span></div>';
  }

  function avanzar() {
    if (paso < FLUJOS[flujo].etapas.length) { paso++; draw(); }
  }
  function animar() {
    if (timer) { clearInterval(timer); timer = null; }
    paso = 0; draw();
    timer = setInterval(() => {
      if (paso >= FLUJOS[flujo].etapas.length) { clearInterval(timer); timer = null; return; }
      avanzar();
    }, 700);
  }

  document.querySelectorAll('.agentic-flujo-btn').forEach(b => {
    b.addEventListener('click', () => {
      flujo = b.dataset.flujo;
      document.querySelectorAll('.agentic-flujo-btn').forEach(x => x.classList.toggle('active', x === b));
      if (timer) { clearInterval(timer); timer = null; }
      paso = 0; draw();
    });
  });
  const bN = document.getElementById('agentic-next');
  if (bN) bN.addEventListener('click', () => { if (timer) { clearInterval(timer); timer = null; } avanzar(); });
  const bA = document.getElementById('agentic-animar');
  if (bA) bA.addEventListener('click', animar);
  const bR = document.getElementById('agentic-reset');
  if (bR) bR.addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; } paso = 0; draw();
  });

  const ini = document.querySelector('.agentic-flujo-btn[data-flujo="secuencial"]');
  if (ini) ini.classList.add('active');
  draw();
}
