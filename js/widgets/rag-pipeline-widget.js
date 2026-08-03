// ============================================================
// RAG Pipeline Widget
// Anima el recorrido de una consulta, con dos modos:
//   - "Sin RAG": prompt -> LLM -> respuesta (generica o inventada)
//   - "Con RAG": prompt -> retriever <-> base de conocimiento ->
//                documentos -> prompt aumentado -> LLM -> respuesta
// Sirve para ver de un vistazo que es lo que RAG agrega y donde
// aparece la latencia extra.
// ============================================================

function initRagPipelineWidget() {
  const canvas = document.getElementById('rag-pipeline-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const CONSULTA = '¿Por qué los hoteles en Vancouver están tan caros este fin de semana?';

  const SIN = [
    { t: 'Prompt del usuario', d: 'La pregunta tal cual', c: '#58C4DD' },
    { t: 'LLM', d: 'Responde solo con lo que aprendió al entrenarse', c: '#9A72AC' },
    { t: 'Respuesta', d: '"Los hoteles suelen subir de precio los fines de semana por la demanda."', c: '#FC6255' },
  ];
  const CON = [
    { t: 'Prompt del usuario', d: 'La pregunta tal cual', c: '#58C4DD' },
    { t: 'Retriever', d: 'Convierte la pregunta en consulta y busca en la base', c: '#FF862F' },
    { t: 'Base de conocimiento', d: 'Noticias y reportes recientes de la ciudad', c: '#5CD0B3' },
    { t: 'Documentos relevantes', d: 'Ocupación del 97%, 60,000 visitantes, conciertos del 6 al 8', c: '#83C167' },
    { t: 'Prompt aumentado', d: 'La pregunta + los documentos como contexto', c: '#FFFF00' },
    { t: 'LLM', d: 'Ahora sí tiene la información delante', c: '#9A72AC' },
    { t: 'Respuesta', d: '"Por los conciertos del Eras Tour: la ocupación llegó al 97%." [fuente: reporte]', c: '#83C167' },
  ];

  let modo = 'con';
  let paso = 0;
  let timer = null;

  const etapas = () => (modo === 'con' ? CON : SIN);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'left';
    ctx.font = '11px Fira Code, monospace';
    ctx.fillStyle = '#a8a290';
    ctx.fillText('Consulta', 14, 18);
    ctx.font = '12.5px Fira Code, monospace';
    ctx.fillStyle = '#ece6d0';
    ctx.fillText(CONSULTA, 14, 37);

    const E = etapas();
    const y0 = 62, alto = (H - y0 - 46) / E.length;

    E.forEach((e, i) => {
      const y = y0 + i * alto;
      const activo = i < paso;
      const bh = Math.min(38, alto - 8);

      // caja
      ctx.fillStyle = activo ? e.c : 'rgba(168,162,144,0.12)';
      ctx.globalAlpha = activo ? 0.22 : 1;
      ctx.fillRect(14, y, 210, bh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = activo ? e.c : 'rgba(168,162,144,0.25)';
      ctx.lineWidth = activo ? 2 : 1;
      ctx.strokeRect(14, y, 210, bh);

      ctx.textAlign = 'left';
      ctx.font = 'bold 12.5px Fira Code, monospace';
      ctx.fillStyle = activo ? e.c : 'rgba(168,162,144,0.4)';
      ctx.fillText(e.t, 24, y + bh / 2 + 4);

      // descripcion
      ctx.font = '11.5px Fira Code, monospace';
      ctx.fillStyle = activo ? 'rgba(236,230,208,0.9)' : 'rgba(168,162,144,0.3)';
      let t = e.d;
      while (ctx.measureText(t).width > W - 260 && t.length > 8) t = t.slice(0, -2);
      if (t !== e.d) t += '…';
      ctx.fillText(t, 244, y + bh / 2 + 4);

      // flecha
      if (i < E.length - 1) {
        const yf = y + bh, yf2 = y0 + (i + 1) * alto;
        ctx.strokeStyle = activo && i + 1 < paso ? e.c : 'rgba(168,162,144,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(119, yf); ctx.lineTo(119, yf2);
        ctx.stroke();
        if (activo && i + 1 < paso) {
          ctx.beginPath();
          ctx.moveTo(115, yf2 - 5); ctx.lineTo(119, yf2); ctx.lineTo(123, yf2 - 5);
          ctx.stroke();
        }
      }

      // flecha de vuelta entre retriever y base
      if (modo === 'con' && i === 1) {
        ctx.strokeStyle = activo && paso > 2 ? '#5CD0B3' : 'rgba(168,162,144,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(140, y + bh); ctx.lineTo(140, y0 + 2 * alto);
        ctx.stroke();
      }
    });

    // marca de latencia extra
    if (modo === 'con' && paso >= 5) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(255,134,47,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W - 26, y0 + alto); ctx.lineTo(W - 26, y0 + 4 * alto);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.translate(W - 12, y0 + 2.5 * alto);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = 'rgba(255,134,47,0.9)';
      ctx.font = 'bold 10px Fira Code, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('latencia extra', 0, 0);
      ctx.restore();
    }

    actualizarInfo();
  }

  function actualizarInfo() {
    const el = document.getElementById('rag-pipeline-info');
    if (!el) return;
    const E = etapas();
    const listo = paso >= E.length;
    el.innerHTML =
      '<div class="widget-label"><span>Etapas</span><span class="widget-value">' +
      Math.min(paso, E.length) + ' / ' + E.length + '</span></div>' +
      '<div class="widget-label"><span>Resultado</span><span class="widget-value" style="color:' +
      (listo ? (modo === 'con' ? 'var(--c-green)' : 'var(--c-red)') : 'var(--c-text-dim)') + ';">' +
      (listo ? (modo === 'con' ? 'fundamentado y citable' : 'genérico, sin la causa real') : '—') +
      '</span></div>';
  }

  function avanzar() {
    if (paso < etapas().length) { paso++; draw(); }
    else if (timer) { clearInterval(timer); timer = null; }
  }
  function animar() {
    if (timer) clearInterval(timer);
    paso = 0; draw();
    timer = setInterval(() => {
      if (paso >= etapas().length) { clearInterval(timer); timer = null; return; }
      avanzar();
    }, 750);
  }

  document.querySelectorAll('.rag-modo-btn').forEach(b => {
    b.addEventListener('click', () => {
      modo = b.dataset.modo;
      document.querySelectorAll('.rag-modo-btn').forEach(x => x.classList.toggle('active', x === b));
      if (timer) { clearInterval(timer); timer = null; }
      paso = 0; draw();
    });
  });
  const bN = document.getElementById('rag-pipeline-next');
  if (bN) bN.addEventListener('click', () => { if (timer) { clearInterval(timer); timer = null; } avanzar(); });
  const bA = document.getElementById('rag-pipeline-animar');
  if (bA) bA.addEventListener('click', animar);
  const bR = document.getElementById('rag-pipeline-reset');
  if (bR) bR.addEventListener('click', () => { if (timer) { clearInterval(timer); timer = null; } paso = 0; draw(); });

  const ini = document.querySelector('.rag-modo-btn[data-modo="con"]');
  if (ini) ini.classList.add('active');
  draw();
}
