// ============================================================
// Botón de copiar para los prompts que se demuestran EN VIVO
//
// Cualquier <pre data-copiable> del deck recibe un botón que copia
// su texto tal cual, para pegarlo en Claude durante la clase. Se
// llama en cada 'slidechanged' y es idempotente: marca el bloque
// con data-copiable-listo para no duplicar el botón al volver.
//
// Es la generalizacion de lo que ya hacian self-query-prompts-widget
// y rag-prompts-widget, que traian su propio copiador:
//   - navigator.clipboard NO siempre existe sobre file://, asi que
//     hay fallback con execCommand sobre un textarea temporal
//   - inyectar DOM obliga a llamar a Reveal.layout(): si no, Reveal
//     ya centro la diapositiva con la altura de antes y el contenido
//     se sale del viewport
// ============================================================

function copiarTextoAlPortapapeles(texto, alTerminar) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(alTerminar,
      () => copiarConFallback(texto, alTerminar));
  } else {
    copiarConFallback(texto, alTerminar);
  }
}

function copiarConFallback(texto, alTerminar) {
  const ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.cssText = 'position:fixed; top:-1000px; opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    alTerminar();
  } catch (e) {
    /* sin permiso: el texto queda seleccionable a mano en la diapositiva */
  }
  document.body.removeChild(ta);
}

function initCopiarPrompt(slide) {
  const bloques = (slide || document).querySelectorAll('pre[data-copiable]');
  if (!bloques.length) return;
  let inyectado = false;

  bloques.forEach(pre => {
    if (pre.dataset.copiableListo) return;
    pre.dataset.copiableListo = '1';
    inyectado = true;

    // el <pre> pasa a ser el ancla del boton, que va flotando en su esquina
    if (getComputedStyle(pre).position === 'static') pre.style.position = 'relative';

    const b = document.createElement('button');
    const etq = pre.dataset.copiable === 'corto' ? '📋' : '📋 copiar';
    b.textContent = etq;
    b.title = 'Copiar el prompt para pegarlo en Claude';
    b.style.cssText =
      'position:absolute; top:4px; right:6px; z-index:5;' +
      'font-family:Fira Code, monospace; font-size:11px; line-height:1;' +
      'padding:4px 8px; border-radius:5px; cursor:pointer;' +
      'color:#58C4DD; background:rgba(27,27,47,0.92);' +
      'border:1px solid rgba(88,196,221,0.5);';
    b.addEventListener('mouseenter', () => { b.style.background = 'rgba(88,196,221,0.18)'; });
    b.addEventListener('mouseleave', () => { b.style.background = 'rgba(27,27,47,0.92)'; });

    b.addEventListener('click', ev => {
      ev.stopPropagation();
      const code = pre.querySelector('code');
      const texto = (code || pre).textContent.replace(/\s+$/, '');
      copiarTextoAlPortapapeles(texto, () => {
        b.textContent = '✔ copiado';
        b.style.color = '#83C167';
        b.style.borderColor = 'rgba(131,193,103,0.6)';
        setTimeout(() => {
          b.textContent = etq;
          b.style.color = '#58C4DD';
          b.style.borderColor = 'rgba(88,196,221,0.5)';
        }, 1400);
      });
    });

    pre.appendChild(b);
  });

  if (inyectado && typeof Reveal !== 'undefined' && Reveal.layout) Reveal.layout();
}
