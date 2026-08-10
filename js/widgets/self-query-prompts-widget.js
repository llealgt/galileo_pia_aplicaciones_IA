// ============================================================
// Self-query en vivo: prompts para pegar en Claude
// Cinco preguntas en lenguaje natural. El boton copia la
// instruccion + la pregunta en un solo pegado, y la respuesta
// esperada se revela aparte para poder preguntarle a la clase
// antes de mostrarla.
//
// Como el widget de prompts de RAG, este NO es canvas: el texto
// tiene que poder seleccionarse. navigator.clipboard no siempre
// existe sobre file://, asi que el copiado lleva fallback con
// execCommand.
//
// Los cinco casos estan escogidos para que cada uno rompa una
// suposicion distinta sobre el extractor:
//   1 el caso feliz          2 el query queda VACIO
//   3 conversion de unidades 4 "las mejores" es orden, no filtro
//   5 no hay nada que filtrar
// ============================================================

const SQ_ESQUEMA =
`titulo        texto
anio          entero
genero        uno de: ciencia ficción, drama, comedia, terror, documental
calificacion  decimal de 0 a 10
duracion_min  entero
idioma        texto
director      texto`;

const SQ_INSTRUCCION =
`Eres el componente "self-query" de un buscador de películas.
Recibes una pregunta en lenguaje natural y la separas en DOS partes:

1. "query": el texto que se manda a BÚSQUEDA SEMÁNTICA. Solo lo que
   describe el CONTENIDO de la película. Si no queda nada, usa "".
2. "filtros": las condiciones que se mandan al FILTRO DE METADATA,
   usando ÚNICAMENTE estos campos:

${SQ_ESQUEMA}

   Operadores permitidos: eq, ne, gt, gte, lt, lte, in

Responde SOLO con JSON, sin explicación:
{"query": "...", "filtros": [{"campo": "...", "op": "...", "valor": ...}]}

Si algo de la pregunta no cabe en ningún campo, NO lo conviertas en un
filtro: déjalo dentro de "query".

Pregunta: `;

const SQ_CASOS = [
  {
    tab: '1 · el caso feliz',
    pregunta: 'películas de ciencia ficción sobre viajes en el tiempo, posteriores a 2010 y con más de 8 de calificación',
    esperado:
`{"query": "viajes en el tiempo",
 "filtros": [
   {"campo": "genero", "op": "eq", "valor": "ciencia ficción"},
   {"campo": "anio", "op": "gt", "valor": 2010},
   {"campo": "calificacion", "op": "gt", "valor": 8}
 ]}`,
    nota: 'Las tres condiciones son explícitas y caben en el esquema. Al buscador vectorial le llegan tres palabras, no la frase entera.',
    color: '#83C167',
  },
  {
    tab: '2 · query vacío',
    pregunta: 'documentales de Werner Herzog de los años noventa',
    esperado:
`{"query": "",
 "filtros": [
   {"campo": "genero", "op": "eq", "valor": "documental"},
   {"campo": "director", "op": "eq", "valor": "Werner Herzog"},
   {"campo": "anio", "op": "gte", "valor": 1990},
   {"campo": "anio", "op": "lte", "valor": 1999}
 ]}`,
    nota: 'Aquí no hay nada semántico: la consulta es 100 % filtro. «Los años noventa» se convierte en un rango, que es algo que un embedding jamás haría.',
    color: '#58C4DD',
  },
  {
    tab: '3 · unidades',
    pregunta: 'algo corto y divertido para ver hoy, que no pase de hora y media',
    esperado:
`{"query": "divertido, ligero",
 "filtros": [
   {"campo": "duracion_min", "op": "lte", "valor": 90}
 ]}`,
    nota: '«Hora y media» → 90 minutos: una conversión que ninguna expresión regular haría por ti. Ojo con «divertido»: si el extractor lo convierte en genero = comedia está endureciendo un matiz en un filtro que puede dejar fuera resultados válidos.',
    color: '#FFFF00',
  },
  {
    tab: '4 · orden ≠ filtro',
    pregunta: 'las mejores películas de terror en japonés',
    esperado:
`{"query": "terror",
 "filtros": [
   {"campo": "genero", "op": "eq", "valor": "terror"},
   {"campo": "idioma", "op": "eq", "valor": "japonés"}
 ]}`,
    nota: '«Las mejores» NO es un filtro, es un orden — y el esquema no tiene cómo expresarlo. Si el modelo inventa calificacion > 8, se está sacando el umbral de la manga. Pregunta a la clase qué debería hacer.',
    color: '#FF862F',
  },
  {
    tab: '5 · sin filtros',
    pregunta: 'películas sobre inteligencia artificial que den miedo',
    esperado:
`{"query": "inteligencia artificial que da miedo",
 "filtros": []}`,
    nota: 'Nada de esto es estructurado. El extractor tiene que poder devolver la lista vacía; si fuerza genero = terror, descarta dramas y ciencia ficción que sí dan miedo.',
    color: '#9A72AC',
  },
];

function initSelfQueryPromptsWidget() {
  const cont = document.getElementById('self-query-prompts');
  if (!cont || cont.dataset.initialized) return;
  cont.dataset.initialized = 'true';

  let sel = 0;
  let mostrar = false;

  function copiar(texto, boton, etq) {
    const ok = () => {
      boton.textContent = '✔ copiado';
      setTimeout(() => { boton.textContent = etq; }, 1400);
    };
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
    try { document.execCommand('copy'); ok(); } catch (e) { /* se selecciona a mano */ }
    document.body.removeChild(ta);
  }

  function boton(etq, onClick, color) {
    const b = document.createElement('button');
    b.className = 'widget-btn fi-btn';
    b.textContent = etq;
    if (color) { b.style.borderColor = color; b.style.color = color; }
    b.addEventListener('click', () => onClick(b));
    return b;
  }

  function render() {
    const c = SQ_CASOS[sel];
    cont.innerHTML = '';

    // --- pestanas ---
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display:flex; gap:0.3em; justify-content:center; flex-wrap:wrap; margin-bottom:0.45em;';
    SQ_CASOS.forEach((k, i) => {
      const b = boton((i === sel ? '● ' : '○ ') + k.tab, () => { sel = i; mostrar = false; render(); });
      if (i === sel) { b.style.borderColor = k.color; b.style.color = k.color; }
      tabs.appendChild(b);
    });
    cont.appendChild(tabs);

    // --- la pregunta ---
    const q = document.createElement('div');
    q.style.cssText = 'border:1px solid ' + c.color + '66; border-left:4px solid ' + c.color +
      '; border-radius:6px; background:rgba(13,13,26,0.6); padding:0.4em 0.6em; margin-bottom:0.4em;';
    q.innerHTML = '<div style="font-size:0.5em; color:var(--c-text-dim); margin-bottom:0.15em;">'
      + 'lo que escribe el usuario</div>'
      + '<div style="font-size:0.62em; color:' + c.color + '; font-style:italic;">«' + c.pregunta + '»</div>';
    cont.appendChild(q);

    // --- acciones ---
    const acc = document.createElement('div');
    acc.style.cssText = 'display:flex; gap:0.4em; justify-content:center; margin-bottom:0.4em; flex-wrap:wrap;';
    acc.appendChild(boton('copiar prompt completo',
      b => copiar(SQ_INSTRUCCION + c.pregunta, b, 'copiar prompt completo'), '#83C167'));
    acc.appendChild(boton('copiar solo la instrucción',
      b => copiar(SQ_INSTRUCCION.trim(), b, 'copiar solo la instrucción')));
    acc.appendChild(boton(mostrar ? 'ocultar respuesta' : 'ver respuesta esperada',
      () => { mostrar = !mostrar; render(); }, '#FFFF00'));
    cont.appendChild(acc);

    // --- respuesta esperada, a lo ancho: el JSON no cabe en media columna ---
    const izq = document.createElement('div');
    if (mostrar) {
      izq.innerHTML = '<div style="font-size:0.5em; color:var(--c-text-dim); margin-bottom:0.15em; '
        + 'text-align:left;">lo que debe devolver</div>'
        + '<pre style="font-size:0.46em; font-family:\'Fira Code\',monospace; color:var(--c-text); '
        + 'background:rgba(13,13,26,0.6); border-radius:6px; padding:0.4em 0.6em; margin:0; '
        + 'white-space:pre; overflow-x:auto; text-align:left;">'
        + c.esperado.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</pre>';
    } else {
      izq.innerHTML = '<div style="font-size:0.5em; color:var(--c-text-dim); font-style:italic; '
        + 'text-align:center; padding:1.4em 0.5em; border:1px dashed rgba(236,230,208,0.2); '
        + 'border-radius:6px;">Pregunta a la clase qué debería salir antes de revelarlo</div>';
    }
    cont.appendChild(izq);

    const der = document.createElement('div');
    der.style.cssText = 'margin-top:0.4em;';
    der.innerHTML = '<div style="font-size:0.46em; text-align:left; line-height:1.35; '
      + 'color:var(--c-text-dim);"><strong style="color:' + c.color + ';">Lo interesante:</strong> '
      + c.nota + '</div>';
    cont.appendChild(der);

    // el widget inyecta DOM: sin esto Reveal centra con el contenedor vacio
    if (typeof Reveal !== 'undefined' && Reveal.layout) Reveal.layout();
  }

  render();
}
