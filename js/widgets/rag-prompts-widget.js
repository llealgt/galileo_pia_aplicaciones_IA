// ============================================================
// Prompts para correr en vivo: sin retrieval vs. aumentado
// Cinco casos que un LLM NO puede responder con lo que tiene
// dentro, cada uno con su version aumentada lista para copiar.
//
// A diferencia del resto de widgets del deck este NO es canvas:
// el texto tiene que poder seleccionarse y copiarse al chat que
// el catedratico tenga abierto en clase.
//
// En los casos 2 y 5 el dato recuperado CONTRADICE a proposito lo
// que el modelo contestaria por promedio (20 dias en vez de 15,
// penalizacion inusual): asi la diferencia entre las dos corridas
// se ve sin tener que explicarla.
// ============================================================

const RAG_PROMPT_CASOS = [
  {
    id: 'cambio',
    tab: '💱 Tipo de cambio',
    motivo: 'Cambia todos los días — el modelo se congeló en su fecha de corte',
    sin:
`Un cliente en Guatemala debe pagar una factura de USD 1,250.
¿Cuánto es en quetzales al tipo de cambio de HOY?
Dame el monto exacto que voy a poner en la factura.`,
    con:
`Eres un asistente que responde SOLO con la información del contexto.
Si el contexto no alcanza, di "no tengo información suficiente".

--- CONTEXTO ---
[1] (Banco de Guatemala, tipo de cambio de referencia, consultado hoy)
    1 USD = Q<<PEGA AQUÍ EL VALOR DE HOY>>

--- PREGUNTA ---
Un cliente debe pagar una factura de USD 1,250. ¿Cuánto es en quetzales?
Muestra la operación y cita la fuente entre corchetes.`,
    observar:
      'Casi nunca dice "no sé": entrega un tipo de cambio con dos decimales y tono de certeza. ' +
      'Pregúntale de qué fecha es ese dato — ahí se cae. Ir a buscar el valor real, en vivo, ES el ' +
      'paso de retrieval: por eso ese hueco del prompt queda vacío en la diapositiva.',
  },
  {
    id: 'vacaciones',
    tab: '🏖 Política de vacaciones',
    motivo: 'Documento privado: nunca estuvo en internet',
    sin:
`¿Cuántos días de vacaciones me corresponden en mi empresa si llevo
3 años trabajando? ¿Puedo partirlos en dos periodos?`,
    con:
`Eres un asistente que responde SOLO con la información del contexto.
Si el contexto no alcanza, di "no tengo información suficiente".
Cita la sección entre corchetes.

--- CONTEXTO ---
[1] (Manual del Colaborador v4, sec. 7.2 — vigente desde 2025-01-01)
    Vacaciones: 15 días hábiles al cumplir el primer año.
    A partir del TERCER año cumplido: 20 días hábiles.
[2] (Manual del Colaborador v4, sec. 7.4)
    Los días pueden dividirse en un máximo de DOS periodos, y al menos
    uno debe ser de 10 días hábiles continuos.
[3] (Circular RRHH 2025-03)
    La solicitud se hace con 15 días de anticipación en el portal,
    con visto bueno de la jefatura.

--- PREGUNTA ---
Llevo 3 años en la empresa. ¿Cuántos días me tocan y puedo partirlos
en dos periodos?`,
    observar:
      'Sin contexto responde con la ley genérica o con "lo usual" — y ni siquiera pregunta de qué ' +
      'empresa hablas. Con contexto dice 20 días y agrega la regla de los 10 días continuos, que ' +
      'no había forma de adivinar. Las dos respuestas suenan igual de seguras.',
  },
  {
    id: 'pedido',
    tab: '📦 Estado de un pedido',
    motivo: 'Vive en una base de datos transaccional, no en un corpus',
    sin:
`¿Cuál es el estado del pedido A-4471 y en qué fecha llega?`,
    con:
`Eres un asistente de soporte. Responde SOLO con la información del
contexto. Si el contexto no alcanza, dilo.

--- CONTEXTO ---
[1] (sistema de pedidos, consulta de hoy)
    pedido      : A-4471
    estado      : en tránsito (aduana)
    despachado  : 2026-07-28
    entrega_est : 2026-08-09
    incidencia  : retenido 4 días por revisión aduanal

--- PREGUNTA ---
¿Cuál es el estado del pedido A-4471 y en qué fecha llega?
Redáctalo como respuesta al cliente, en dos frases.`,
    observar:
      'Corre el prompt sin contexto TRES veces en chats distintos. Si inventa, las fechas cambian ' +
      'entre corridas: esa inconsistencia es la evidencia más limpia de que no consultó nada.',
  },
  {
    id: 'version',
    tab: '📦 Algo posterior al corte',
    motivo: 'Ocurrió después de su fecha de corte de entrenamiento',
    sin:
`¿Cuál es la versión más reciente de scikit-learn y qué trae de nuevo
respecto a la anterior?`,
    con:
`Responde SOLO con la información del contexto.

--- CONTEXTO ---
[1] (pypi.org/project/scikit-learn, consultado hoy)
    versión más reciente: <<PEGA AQUÍ LA VERSIÓN DE HOY>>
[2] (changelog oficial de esa versión)
    <<PEGA AQUÍ LOS PUNTOS DEL CHANGELOG>>

--- PREGUNTA ---
¿Cuál es la versión más reciente de scikit-learn y qué trae de nuevo?`,
    observar:
      'Va a nombrar una versión con total seguridad. Abre pypi.org en la otra pestaña y compara: ' +
      'suele estar atrasada, y el modelo no advierte que su información tiene fecha. Sirve para ' +
      'cualquier librería — usa la que estén ocupando en el capstone.',
  },
  {
    id: 'contrato',
    tab: '📄 Cláusula de un contrato',
    motivo: 'Documento propio y específico: lo "usual" no aplica',
    sin:
`¿Cuál es la penalización si termino mi contrato de arrendamiento
antes de tiempo?`,
    con:
`Responde SOLO con la información del contexto y cita la cláusula.

--- CONTEXTO ---
[1] (Contrato de arrendamiento, cláusula 9.3)
    En caso de terminación anticipada por el arrendatario, este pagará
    la renta de los meses faltantes hasta un MÁXIMO de tres, y perderá
    el depósito de garantía.
[2] (Contrato de arrendamiento, cláusula 9.4)
    No aplica penalización alguna si el aviso se da con 60 días de
    anticipación y el inmueble se entrega sin daños.

--- PREGUNTA ---
Quiero salirme del contrato. ¿Cuánto me van a cobrar?`,
    observar:
      'Sin contexto responde "uno o dos meses de renta": el promedio de internet. Con contexto ' +
      'aparece la cláusula 9.4, que cambia la respuesta por completo — hay un camino sin ' +
      'penalización. Ese matiz es exactamente lo que se pierde cuando el modelo adivina.',
  },
];

function initRagPromptsWidget() {
  const cont = document.getElementById('rag-prompts');
  if (!cont || cont.dataset.initialized) return;
  cont.dataset.initialized = 'true';

  let activo = 0;

  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex; flex-wrap:wrap; gap:0.25em; justify-content:center; margin-bottom:0.3em;';

  const motivo = document.createElement('div');
  motivo.style.cssText = 'text-align:center; font-size:0.3em; color:var(--c-text-dim); margin-bottom:0.25em;';

  const cajas = document.createElement('div');
  cajas.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:0.5em; align-items:start;';

  const observar = document.createElement('p');
  observar.style.cssText = 'font-size:0.3em; margin:0.35em 0 0 0; text-align:left; line-height:1.4;';

  cont.appendChild(tabs);
  cont.appendChild(motivo);
  cont.appendChild(cajas);
  cont.appendChild(observar);

  function copiar(texto, boton) {
    // navigator.clipboard no siempre existe sobre file://, asi que hay fallback
    const ok = () => { boton.textContent = '✔ copiado'; setTimeout(() => { boton.textContent = 'copiar'; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, () => fallback(texto, ok));
    } else {
      fallback(texto, ok);
    }
  }
  function fallback(texto, ok) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed; left:-9999px;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { /* sin permiso: se selecciona a mano */ }
    document.body.removeChild(ta);
  }

  function caja(titulo, color, texto) {
    const d = document.createElement('div');
    d.style.cssText = 'border:1px solid ' + color + '55; border-radius:8px; background:rgba(13,13,26,0.55); ' +
                      'padding:0.3em 0.45em; overflow:hidden;';
    const h = document.createElement('div');
    h.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:0.4em; margin-bottom:0.2em;';
    const t = document.createElement('span');
    t.textContent = titulo;
    t.style.cssText = 'font-size:0.3em; font-weight:700; color:' + color + ';';
    const b = document.createElement('button');
    b.textContent = 'copiar';
    b.className = 'widget-btn fi-btn';
    b.style.cssText = 'font-size:0.24em; padding:0.1em 0.45em;';
    b.addEventListener('click', () => copiar(texto, b));
    h.appendChild(t); h.appendChild(b);
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:0; font-size:0.26em; line-height:1.4; white-space:pre-wrap; ' +
                        'word-break:break-word; text-align:left; user-select:text;';
    const code = document.createElement('code');
    code.textContent = texto;
    pre.appendChild(code);
    d.appendChild(h); d.appendChild(pre);
    return d;
  }

  function render() {
    const c = RAG_PROMPT_CASOS[activo];
    Array.from(tabs.children).forEach((b, i) => {
      b.style.opacity = i === activo ? '1' : '0.5';
      b.style.borderColor = i === activo ? 'var(--c-blue)' : 'rgba(168,162,144,0.35)';
    });
    motivo.innerHTML = 'Por qué no puede responderlo: <strong style="color:var(--c-orange);">' +
                       c.motivo + '</strong>';
    cajas.innerHTML = '';
    cajas.appendChild(caja('✘ SIN RETRIEVAL — irresoluble', '#FC6255', c.sin));
    cajas.appendChild(caja('✔ AUMENTADO — con lo recuperado', '#83C167', c.con));
    observar.innerHTML = '<strong style="color:var(--c-yellow);">Qué observar en vivo:</strong> ' + c.observar;

    // Reveal centro el slide cuando este contenedor todavia estaba vacio, asi que su
    // offset superior quedo calculado de menos y el contenido crece fuera del viewport.
    // Hay que pedirle que recalcule cada vez que cambia el alto del widget.
    if (typeof Reveal !== 'undefined' && Reveal.layout) Reveal.layout();
  }

  RAG_PROMPT_CASOS.forEach((c, i) => {
    const b = document.createElement('button');
    b.textContent = c.tab;
    b.className = 'widget-btn fi-btn';
    b.style.cssText = 'font-size:0.28em; padding:0.15em 0.5em;';
    b.addEventListener('click', () => { activo = i; render(); });
    tabs.appendChild(b);
  });

  render();
}
