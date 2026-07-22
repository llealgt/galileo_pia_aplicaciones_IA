// ============================================================
// Metric Table Widget
// Dataset dummy de 10 pacientes (valor real vs. prediccion). Al
// elegir una metrica (Precision/Recall/Specificity/NPV) resalta
// SOLO el subconjunto de filas que esa metrica mira — el resto se
// atenua — y dentro del subconjunto marca en verde los aciertos y
// en rojo los errores, mostrando la fraccion resultante. La idea
// central: precision y NPV miran lo que el modelo PREDIJO;
// recall y specificity miran lo que en verdad ERA (y).
// ============================================================

function initMetricTableWidget() {
  const tbody = document.getElementById('metric-table-body');
  if (!tbody || tbody.dataset.initialized) return;
  tbody.dataset.initialized = 'true';

  // 10 pacientes: 5 con y=1 (enfermo), 5 con y=0 (sano)
  const DATA = [
    { real: 1, pred: 1 }, // TP
    { real: 0, pred: 0 }, // TN
    { real: 1, pred: 0 }, // FN
    { real: 0, pred: 0 }, // TN
    { real: 1, pred: 1 }, // TP
    { real: 0, pred: 1 }, // FP
    { real: 1, pred: 1 }, // TP
    { real: 0, pred: 0 }, // TN
    { real: 1, pred: 0 }, // FN
    { real: 0, pred: 0 }, // TN
  ];

  function category(d) {
    if (d.real === 1 && d.pred === 1) return 'TP';
    if (d.real === 0 && d.pred === 0) return 'TN';
    if (d.real === 0 && d.pred === 1) return 'FP';
    return 'FN';
  }

  const METRICS = {
    original: {
      titulo: 'Dataset Original — las 10 observaciones, sin filtrar',
      subset: () => true,
      correct: null, // sin distincion de acierto/error: todas se ven "neutras"
      simbolo: null,
      desc: 'Aquí ves las 10 observaciones completas, sin resaltar ni atenuar ninguna — el punto de partida antes de que cualquier métrica decida qué mirar.',
    },
    accuracy: {
      titulo: 'Accuracy — mira TODO el dataset (no filtra nada)',
      subset: () => true,
      correct: d => d.real === d.pred,
      simbolo: 'Aciertos / Total',
      desc: 'A diferencia de precision/recall/specificity/NPV, accuracy no filtra ningún subconjunto: mira las 10 observaciones completas y cuenta en cuántas acertó el modelo (sin importar si son enfermos o sanos).',
    },
    precision: {
      titulo: 'Precision (PPV) — mira la PREDICCIÓN',
      subset: d => d.pred === 1,
      correct: d => category(d) === 'TP',
      simbolo: 'TP / (TP + FP)',
      desc: 'Solo miramos los pacientes donde el modelo predijo "enfermo" (ŷ=1) — sin importar si en realidad lo estaban.',
    },
    recall: {
      titulo: 'Recall (Sensitividad) — mira el VALOR REAL',
      subset: d => d.real === 1,
      correct: d => category(d) === 'TP',
      simbolo: 'TP / (TP + FN)',
      desc: 'Solo miramos los pacientes que en realidad estaban enfermos (y=1) — sin importar qué predijo el modelo.',
    },
    specificity: {
      titulo: 'Specificity — mira el VALOR REAL',
      subset: d => d.real === 0,
      correct: d => category(d) === 'TN',
      simbolo: 'TN / (TN + FP)',
      desc: 'Solo miramos los pacientes que en realidad estaban sanos (y=0) — sin importar qué predijo el modelo.',
    },
    npv: {
      titulo: 'NPV — mira la PREDICCIÓN',
      subset: d => d.pred === 0,
      correct: d => category(d) === 'TN',
      simbolo: 'TN / (TN + FN)',
      desc: 'Solo miramos los pacientes donde el modelo predijo "sano" (ŷ=0) — sin importar si en realidad lo estaban.',
    },
  };

  function render(metricKey) {
    const metric = METRICS[metricKey];
    const noVerdict = metric.correct === null; // modo "Dataset Original": no hay acierto/error que marcar

    const rowsHtml = DATA.map((d, i) => {
      const inSubset = metric.subset(d);
      let rowClass = 'metric-row';
      if (noVerdict) {
        // todas las filas se ven igual: ni resaltadas ni atenuadas
      } else if (!inSubset) {
        rowClass += ' metric-row-dim';
      } else {
        rowClass += metric.correct(d) ? ' metric-row-correct' : ' metric-row-incorrect';
      }

      const realLabel = d.real === 1 ? 'Enfermo (1)' : 'Sano (0)';
      const predLabel = d.pred === 1 ? 'Enfermo (1)' : 'Sano (0)';
      const acierto = d.real === d.pred ? '✅' : '❌';

      return `<tr class="${rowClass}">
        <td>Paciente ${i + 1}</td>
        <td>${realLabel}</td>
        <td>${predLabel}</td>
        <td>${acierto}</td>
      </tr>`;
    }).join('');
    tbody.innerHTML = rowsHtml;

    const tituloEl = document.getElementById('metric-table-title');
    if (tituloEl) tituloEl.textContent = metric.titulo;

    const descEl = document.getElementById('metric-table-desc');
    if (descEl) descEl.textContent = metric.desc;

    const formulaEl = document.getElementById('metric-table-formula');
    if (formulaEl) {
      if (noVerdict) {
        formulaEl.innerHTML = '';
      } else {
        const subset = DATA.filter(metric.subset);
        const den = subset.length;
        const num = subset.filter(metric.correct).length;
        const valor = (num / den).toFixed(2);
        formulaEl.innerHTML = `${metric.simbolo} = <span style="color:var(--c-green);">${num}</span> / ${den} = <strong style="color:var(--c-yellow);">${valor}</strong>`;
      }
    }
  }

  document.querySelectorAll('.metric-table-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.metric-table-btn').forEach(b => b.classList.toggle('active', b === btn));
      render(btn.dataset.metric);
    });
  });

  render('original');
}
