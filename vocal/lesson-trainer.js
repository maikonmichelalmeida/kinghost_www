(() => {
  'use strict';

  const controlsByKey = new Map();
  let context = null;
  let initialized = false;

  const PRACTICE_TITLE = /progress[aã]o|protocolo|n[ií]vel|viol[aã]o|fantasm|sess[aã]o-modelo|vers[aã]o-base|dom[ií]nio|isole|treine|pr[aá]tica|exerc[ií]cio completo|transposi[cç][aã]o|velocidade|staccato|legato|sustent|vibrato|tetracorde|tr[ií]ade|subida completa|s[oó] a descida|apenas a descida|apenas a subida/i;
  const PRACTICE_TEXT = /\b(fa[cç]a|cante|toque|repita|sustente|inspire|expire|fale|diga|alterne|comece|suba|des[cç]a|use o viol[aã]o|retire o viol[aã]o|grave)\b/i;
  const EXCLUDE_TITLE = /base cient[ií]fica|refer[eê]ncias|diagn[oó]stico|crit[eé]rios|evid[eê]ncia|o que conta como progresso|objetivo central|n[aã]o use este exerc[ií]cio|o que a ci[eê]ncia n[aã]o permite/i;
  const NOTE_TOKEN = /\b[A-Ga-g](?:[#♯b♭])?-?\d+\b/g;

  function clamp(value) {
    const min = context?.limits?.min ?? -8;
    const max = context?.limits?.max ?? 8;
    const parsed = Number.parseInt(value, 10);
    return Math.min(max, Math.max(min, Number.isFinite(parsed) ? parsed : 0));
  }

  function clampBpm(value, fallback = 80) {
    const parsed = Number.parseInt(value, 10);
    return Math.min(180, Math.max(40, Number.isFinite(parsed) ? parsed : fallback));
  }

  function clampSubdivision(value, fallback = 1) {
    const parsed = Number.parseInt(value, 10);
    return Math.min(4, Math.max(1, Number.isFinite(parsed) ? parsed : fallback));
  }

  function suggestedTempo(title, text) {
    const sample = `${title}\n${text}`;
    const defaults = context?.tempoDefaults || { bpm: 80, subdivision: 1 };
    const range = sample.match(/(\d{2,3})\s*[–—-]\s*(\d{2,3})\s*bpm/i);
    const single = sample.match(/(\d{2,3})\s*bpm/i);
    const bpm = range
      ? Math.round((Number(range[1]) + Number(range[2])) / 2)
      : (single ? Number(single[1]) : defaults.bpm);
    let subdivision = defaults.subdivision;
    if (/tercina|triplet/i.test(sample)) subdivision = 3;
    else if (/semicolcheia|quatro notas por pulso/i.test(sample)) subdivision = 4;
    else if (/colcheia|duas notas por pulso/i.test(sample)) subdivision = 2;
    return { bpm: clampBpm(bpm), subdivision: clampSubdivision(subdivision) };
  }

  function slug(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'trecho';
  }

  function sectionText(heading) {
    const level = Number(heading.tagName.slice(1));
    const lines = [];
    let node = heading.nextElementSibling;
    while (node) {
      if (/^H[1-6]$/.test(node.tagName) && Number(node.tagName.slice(1)) <= level) break;
      if (!node.classList?.contains('lesson-training-controls')) lines.push(node.innerText || node.textContent || '');
      node = node.nextElementSibling;
    }
    return lines.join('\n').trim();
  }

  function isPractical(heading, text) {
    const title = heading.innerText.trim();
    if (!title || EXCLUDE_TITLE.test(title)) return false;
    if (PRACTICE_TITLE.test(title)) return true;

    const noteCount = (text.match(NOTE_TOKEN) || []).length;
    return PRACTICE_TEXT.test(text) && (noteCount > 0 || /pulso|bpm|segundo|minuto|respira|pitch|nota|escala|arpejo|intervalo|vogal|consoante/i.test(text));
  }

  function stateFor(key, title = '', text = '') {
    const raw = context?.states?.[key] || {};
    const suggested = suggestedTempo(title, text);
    return {
      shift: clamp(raw.shift),
      up: raw.up !== false,
      guided: raw.guided !== false,
      bpm: clampBpm(raw.bpm, suggested.bpm),
      subdivision: clampSubdivision(raw.subdivision, suggested.subdivision),
    };
  }

  function updateControl(key, state) {
    const parts = controlsByKey.get(key);
    if (!parts) return;
    parts.input.value = clamp(state.shift);
    parts.checkbox.checked = state.up !== false;
    parts.arrow.textContent = parts.checkbox.checked ? '↑' : '↓';
    parts.guided.checked = state.guided !== false;
    parts.bpm.value = clampBpm(state.bpm, parts.suggested.bpm);
    parts.subdivision.value = String(clampSubdivision(state.subdivision, parts.suggested.subdivision));
    parts.wrap.dataset.ready = 'true';
  }

  function createControls(heading, key, title, text) {
    const suggested = suggestedTempo(title, text);
    const state = stateFor(key, title, text);
    const wrap = document.createElement('div');
    wrap.className = 'lesson-training-controls';
    wrap.dataset.trainingKey = key;
    wrap.dataset.ready = 'true';

    const button = document.createElement('button');
    button.className = 'training-start';
    button.type = 'button';
    button.textContent = 'Início';
    button.title = `Abrir e começar automaticamente: ${title}`;

    const listenButton = document.createElement('button');
    listenButton.className = 'training-listen';
    listenButton.type = 'button';
    listenButton.textContent = 'Ouvir';
    listenButton.title = 'Ouvir apenas as referências permitidas neste exercício';

    const numberLabel = document.createElement('label');
    numberLabel.className = 'transpose-field';
    numberLabel.title = 'Transposição atual em semitons (de -8 a +8)';
    const hidden = document.createElement('span');
    hidden.className = 'sr-only';
    hidden.textContent = 'Transposição em semitons';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(context.limits?.min ?? -8);
    input.max = String(context.limits?.max ?? 8);
    input.step = '1';
    input.inputMode = 'numeric';
    input.value = String(state.shift);
    numberLabel.append(hidden, input);

    const directionLabel = document.createElement('label');
    directionLabel.className = 'direction-field';
    directionLabel.title = 'Marcado: próximo treino sobe 1 semitom. Desmarcado: desce 1 semitom.';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = state.up;
    const arrow = document.createElement('span');
    arrow.textContent = state.up ? '↑' : '↓';
    directionLabel.append(checkbox, arrow);

    const guidedLabel = document.createElement('label');
    guidedLabel.className = 'guided-field';
    guidedLabel.title = 'Marcado: o instrumento guia toca junto com a voz. Desmarcado: toca apenas a nota inicial.';
    const guided = document.createElement('input');
    guided.type = 'checkbox';
    guided.checked = state.guided;
    const guidedText = document.createElement('span');
    guidedText.textContent = 'Guia';
    guidedLabel.append(guided, guidedText);

    const tempoLabel = document.createElement('label');
    tempoLabel.className = 'tempo-field';
    tempoLabel.title = 'Andamento deste treino em batidas por minuto';
    const bpmHidden = document.createElement('span');
    bpmHidden.className = 'sr-only';
    bpmHidden.textContent = 'Batidas por minuto';
    const bpm = document.createElement('input');
    bpm.type = 'number';
    bpm.min = '40';
    bpm.max = '180';
    bpm.step = '1';
    bpm.inputMode = 'numeric';
    bpm.value = String(state.bpm);
    const bpmSuffix = document.createElement('span');
    bpmSuffix.textContent = 'bpm';
    tempoLabel.append(bpmHidden, bpm, bpmSuffix);

    const subdivisionLabel = document.createElement('label');
    subdivisionLabel.className = 'subdivision-field';
    subdivisionLabel.title = 'Quantidade de notas por batida';
    const subdivisionHidden = document.createElement('span');
    subdivisionHidden.className = 'sr-only';
    subdivisionHidden.textContent = 'Notas por batida';
    const subdivision = document.createElement('select');
    [1, 2, 3, 4].forEach(value => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = `${value}/pulso`;
      subdivision.appendChild(option);
    });
    subdivision.value = String(state.subdivision);
    subdivisionLabel.append(subdivisionHidden, subdivision);

    function save(event) {
      if (event?.type === 'input' && (input.value === '' || input.value === '-')) return;
      input.value = String(clamp(input.value));
      bpm.value = String(clampBpm(bpm.value, suggested.bpm));
      subdivision.value = String(clampSubdivision(subdivision.value, suggested.subdivision));
      arrow.textContent = checkbox.checked ? '↑' : '↓';
      window.parent.postMessage({
        type: 'vocal-training-state-change',
        key,
        state: {
          shift: Number(input.value),
          up: checkbox.checked,
          guided: guided.checked,
          bpm: Number(bpm.value),
          subdivision: Number(subdivision.value),
        },
      }, '*');
    }

    input.addEventListener('input', save);
    input.addEventListener('change', save);
    checkbox.addEventListener('change', save);
    guided.addEventListener('change', save);
    bpm.addEventListener('change', save);
    subdivision.addEventListener('change', save);
    button.addEventListener('click', () => {
      save();
      window.parent.postMessage({
        type: 'vocal-open-training',
        section: { trainingKey: key, title, text },
      }, '*');
    });

    listenButton.addEventListener('click', () => {
      save();
      window.parent.postMessage({
        type: 'vocal-preview-training',
        section: { trainingKey: key, title, text },
      }, '*');
    });

    wrap.append(button, listenButton, numberLabel, directionLabel, guidedLabel, tempoLabel, subdivisionLabel);
    heading.insertAdjacentElement('afterend', wrap);
    controlsByKey.set(key, { wrap, input, checkbox, arrow, guided, bpm, subdivision, suggested, title, text });
  }

  function initialize() {
    if (initialized || !context?.exercise?.id) return;
    initialized = true;
    const counts = new Map();
    const headings = [...document.querySelectorAll('h3, h4')];

    for (const heading of headings) {
      if (heading.closest('.lesson-training-controls')) continue;
      const title = heading.innerText.trim();
      const text = sectionText(heading);
      if (!isPractical(heading, text)) continue;

      const base = slug(title);
      const occurrence = (counts.get(base) || 0) + 1;
      counts.set(base, occurrence);
      const key = `${context.exercise.id}:lesson:${base}:${occurrence}`;
      createControls(heading, key, title, text);
    }
  }

  window.addEventListener('message', event => {
    const message = event.data || {};
    if (event.source !== window.parent) return;

    if (message.type === 'vocal-lesson-context') {
      context = message;
      initialize();
      for (const [key, parts] of controlsByKey) updateControl(key, stateFor(key, parts.title, parts.text));
    } else if (message.type === 'vocal-training-state') {
      if (context) context.states[message.key] = message.state;
      updateControl(message.key, message.state || {});
    }
  });

  window.parent.postMessage({ type: 'vocal-lesson-ready' }, '*');
})();
