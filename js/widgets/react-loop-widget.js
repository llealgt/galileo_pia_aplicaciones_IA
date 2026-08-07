// ============================================================
// El Bucle ReAct, paso a paso
// Recorre tres trazas REALES de Qwen2.5-1.5B-Instruct capturadas
// al ejecutar el notebook 28 (agente ReAct con dos herramientas:
// calculadora y buscar_documentos sobre el manual interno).
//
// Las tres estan elegidas a proposito para cubrir lo que de verdad
// pasa con un agente:
//   1. EXITO      — la calculadora resuelve 3947 x 6213 y da
//                   24522711, el numero exacto que el modelo falla
//                   por 14,200 cuando se le pregunta directo
//                   (ver la unidad 12, "Un Modelo Moderno Acierta
//                   Mas, no Distinto").
//   2. ATASCO     — repite la misma accion cuatro veces porque la
//                   observacion no le sirve y nada lo obliga a
//                   cambiar de estrategia. Solo lo detiene el tope
//                   de pasos.
//   3. ALUCINACION— pide saludo[bonjour], una herramienta que nunca
//                   se le ofrecio. El registro la rechaza, el error
//                   se le devuelve COMO OBSERVACION, y el agente se
//                   corrige solo.
//
// Ningun texto de aqui esta inventado: son las salidas literales.
// ============================================================

const REACT_ETAPAS = [
  { nombre: 'PENSAMIENTO', color: '#58C4DD' },
  { nombre: 'ACCIÓN', color: '#FF862F' },
  { nombre: 'OBSERVACIÓN', color: '#83C167' },
];

const REACT_CASOS = {
  exito: {
    etiqueta: '✔ funciona',
    pregunta: '¿Cuánto es 3947 multiplicado por 6213?',
    veredicto: { texto: 'Respondió en 2 pasos, con el resultado exacto.', color: '#83C167' },
    pasos: [
      { tipo: 0, texto: 'Necesito calcular el producto para responder a la pregunta.' },
      { tipo: 1, texto: 'calculadora[3947*6213]' },
      { tipo: 2, texto: '24522711' },
      { tipo: 0, texto: 'El resultado del cálculo es 24522711.' },
      { tipo: 3, texto: '24522711' },
    ],
  },
  atasco: {
    etiqueta: '✘ se atasca',
    pregunta: '¿Cuántos días de vacaciones me tocan si llevo tres años en la empresa?',
    veredicto: { texto: 'Cuatro pasos idénticos. Nunca respondió: lo paró el tope.', color: '#FC6255' },
    pasos: [
      { tipo: 0, texto: 'Para responder esta pregunta necesito información sobre las políticas de vacaciones.' },
      { tipo: 1, texto: 'buscar_documentos[políticas_vacaciones]' },
      { tipo: 2, texto: 'Los gastos de viaje se reembolsan contra factura dentro de los 30 dias siguientes. | Las vacaciones…' },
      { tipo: 0, texto: 'La observación no contiene información relevante para resolver la pregunta.' },
      { tipo: 1, texto: 'buscar_documentos[políticas_vacaciones]', repetida: true },
      { tipo: 2, texto: 'Los gastos de viaje se reembolsan contra factura dentro de los 30 dias siguientes. | Las vacaciones…' },
      { tipo: 0, texto: 'La observación no contiene información relevante para resolver la pregunta.' },
      { tipo: 1, texto: 'buscar_documentos[políticas_vacaciones]', repetida: true },
      { tipo: 4, texto: 'se agotó el tope de pasos sin respuesta' },
    ],
  },
  alucina: {
    etiqueta: '⚠ inventa una herramienta',
    pregunta: 'Hola, buenos días',
    veredicto: { texto: 'Pidió una herramienta inexistente y se recuperó al recibir el error.', color: '#FF862F' },
    pasos: [
      { tipo: 0, texto: 'Puedo responder al saludo del usuario.' },
      { tipo: 1, texto: 'saludo[bonjour]', inventada: true },
      { tipo: 2, texto: "ERROR: la herramienta 'saludo' no existe. Las disponibles son: buscar_documentos, calculadora", error: true },
      { tipo: 0, texto: 'Debo usar una de las herramientas disponibles.' },
      { tipo: 1, texto: "buscar_documentos['saludo']" },
      { tipo: 2, texto: 'El seguro medico cubre al colaborador y a un dependiente directo desde el primer dia. | Vacaciones…' },
    ],
  },
};

function initReactLoopWidget() {
  const canvas = document.getElementById('react-canvas');
  if (!canvas || canvas.dataset.initialized) return;
  canvas.dataset.initialized = 'true';
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const CX = 170, CY = 195, R = 92;
  const PANEL_X = 330, PANEL_W = W - PANEL_X - 20;

  let caso = 'exito';
  let visibles = 1;            // cuantos pasos de la traza se muestran
  let timer = null;

  const pasos = () => REACT_CASOS[caso].pasos;

  function nodo(i) {
    const ang = -Math.PI / 2 + i * (2 * Math.PI / 3);
    return { x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) };
  }

  function envolver(texto, maxAncho) {
    const palabras = texto.split(' ');
    const lineas = [];
    let actual = '';
    for (const p of palabras) {
      const prueba = actual ? actual + ' ' + p : p;
      if (ctx.measureText(prueba).width > maxAncho && actual) { lineas.push(actual); actual = p; }
      else { actual = prueba; }
    }
    if (actual) lineas.push(actual);
    return lineas;
  }

  function caja(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function dibujarBucle() {
    const ultimo = pasos()[visibles - 1];
    const activo = ultimo.tipo <= 2 ? ultimo.tipo : -1;   // respuesta y fin no iluminan nodo

    ctx.strokeStyle = 'rgba(168,162,144,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < 3; i++) {           // puntas de flecha entre nodos
      const a = -Math.PI / 2 + i * (2 * Math.PI / 3) + Math.PI / 3;
      const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
      ctx.fillStyle = 'rgba(168,162,144,0.5)';
      ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 4); ctx.lineTo(-4.5, 4);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }

    const BW = 118, BH = 32;
    for (let i = 0; i < 3; i++) {
      const p = nodo(i), et = REACT_ETAPAS[i], on = (i === activo);
      if (on) {
        ctx.fillStyle = et.color + '22';
        caja(p.x - BW / 2 - 4, p.y - BH / 2 - 4, BW + 8, BH + 8, 11); ctx.fill();
      }
      ctx.fillStyle = on ? '#232340' : '#1f1f38';
      caja(p.x - BW / 2, p.y - BH / 2, BW, BH, 8); ctx.fill();
      ctx.strokeStyle = on ? et.color : 'rgba(168,162,144,0.35)';
      ctx.lineWidth = on ? 2 : 1;
      caja(p.x - BW / 2, p.y - BH / 2, BW, BH, 8); ctx.stroke();
      ctx.fillStyle = on ? et.color : '#a8a290';
      ctx.font = (on ? 'bold ' : '') + '11px Fira Code, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(et.nombre, p.x, p.y + 1);
      ctx.textBaseline = 'alphabetic';
    }

    // contador de vueltas y de llamadas al LLM
    const llamadas = pasos().slice(0, visibles).filter(p => p.tipo === 0).length;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8a290'; ctx.font = '9px Fira Code, monospace';
    ctx.fillText('llamadas al LLM', CX, CY - 7);
    ctx.fillStyle = '#ece6d0'; ctx.font = 'bold 22px Fira Code, monospace';
    ctx.fillText(String(llamadas), CX, CY + 17);
  }

  function dibujarTraza() {
    const c = REACT_CASOS[caso];
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a8a290'; ctx.font = '10px Fira Code, monospace';
    ctx.fillText('PREGUNTA', PANEL_X, 24);
    ctx.fillStyle = '#ece6d0'; ctx.font = '12px Lora, serif';
    let y = 40;
    for (const l of envolver(c.pregunta, PANEL_W)) { ctx.fillText(l, PANEL_X, y); y += 15; }
    y += 8;

    for (let i = 0; i < visibles; i++) {
      const p = pasos()[i];
      if (p.tipo === 4) {                       // fin por tope de pasos
        ctx.fillStyle = '#FC6255'; ctx.font = 'bold 11px Fira Code, monospace';
        ctx.fillText('⛔ ' + p.texto, PANEL_X, y); y += 18;
        continue;
      }
      const es_respuesta = p.tipo === 3;
      const et = es_respuesta ? { nombre: 'RESPUESTA', color: '#FFFF00' } : REACT_ETAPAS[p.tipo];
      const nuevo = (i === visibles - 1);

      ctx.globalAlpha = nuevo ? 1 : 0.55;
      ctx.fillStyle = et.color; ctx.font = 'bold 9.5px Fira Code, monospace';
      let etiqueta = et.nombre;
      if (p.repetida) etiqueta += '  (otra vez lo mismo)';
      if (p.inventada) etiqueta += '  (NO EXISTE)';
      ctx.fillText(etiqueta, PANEL_X, y);
      y += 13;

      const mono = (p.tipo === 1);
      ctx.fillStyle = p.error ? '#FC6255' : (mono ? '#ece6d0' : '#c9c3ad');
      ctx.font = mono ? '11px Fira Code, monospace' : '11.5px Lora, serif';
      for (const l of envolver(p.texto, PANEL_W)) { ctx.fillText(l, PANEL_X + 8, y); y += 14; }
      y += 6;
      ctx.globalAlpha = 1;
    }

    if (visibles === pasos().length) {          // veredicto del caso, al terminar
      const v = REACT_CASOS[caso].veredicto;
      ctx.fillStyle = v.color; ctx.font = 'bold 11px Fira Code, monospace';
      for (const l of envolver(v.texto, PANEL_W)) { ctx.fillText(l, PANEL_X, H - 16); }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, W, H);
    dibujarBucle();
    dibujarTraza();
    const b = document.getElementById('react-paso');
    if (b) b.disabled = (visibles >= pasos().length);
  }

  function siguiente() {
    if (visibles < pasos().length) { visibles++; draw(); }
  }

  function animar() {
    if (timer) { clearInterval(timer); timer = null; return; }
    timer = setInterval(() => {
      if (visibles >= pasos().length) { clearInterval(timer); timer = null; return; }
      siguiente();
    }, 1100);
  }

  document.querySelectorAll('.react-caso-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      caso = btn.dataset.caso;
      visibles = 1;
      if (timer) { clearInterval(timer); timer = null; }
      document.querySelectorAll('.react-caso-btn').forEach(b => {
        b.style.opacity = b.dataset.caso === caso ? '1' : '0.5';
        b.style.borderColor = b.dataset.caso === caso ? 'var(--c-blue)' : 'rgba(168,162,144,0.35)';
      });
      draw();
    });
  });
  const bp = document.getElementById('react-paso');
  const ba = document.getElementById('react-animar');
  const br = document.getElementById('react-reset');
  if (bp) bp.addEventListener('click', siguiente);
  if (ba) ba.addEventListener('click', animar);
  if (br) br.addEventListener('click', () => {
    visibles = 1;
    if (timer) { clearInterval(timer); timer = null; }
    draw();
  });

  document.querySelectorAll('.react-caso-btn').forEach(b => {
    b.style.opacity = b.dataset.caso === caso ? '1' : '0.5';
  });
  draw();
}
