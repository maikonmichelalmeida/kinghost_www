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

  function stateFor(key) {
    const raw = context?.states?.[key] || {};
    return { shift: clamp(raw.shift), up: raw.up !== false };
  }

  function updateControl(key, state) {
    const parts = controlsByKey.get(key);
    if (!parts) return;
    parts.input.value = clamp(state.shift);
    parts.checkbox.checked = state.up !== false;
    parts.arrow.textContent = parts.checkbox.checked ? '↑' : '↓';
    parts.wrap.dataset.ready = 'true';
  }

  function createControls(heading, key, title, text) {
    const state = stateFor(key);
    const wrap = document.createElement('div');
    wrap.className = 'lesson-training-controls';
    wrap.dataset.trainingKey = key;
    wrap.dataset.ready = 'true';

    const button = document.createElement('button');
    button.className = 'training-start';
    button.type = 'button';
    button.textContent = 'Início';
    button.title = `Abrir treino assistido: ${title}`;

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

    function save(event) {
      if (event?.type === 'input' && (input.value === '' || input.value === '-')) return;
      input.value = String(clamp(input.value));
      arrow.textContent = checkbox.checked ? '↑' : '↓';
      window.parent.postMessage({
        type: 'vocal-training-state-change',
        key,
        state: { shift: Number(input.value), up: checkbox.checked },
      }, '*');
    }

    input.addEventListener('input', save);
    input.addEventListener('change', save);
    checkbox.addEventListener('change', save);
    button.addEventListener('click', () => {
      save();
      window.parent.postMessage({
        type: 'vocal-open-training',
        section: { trainingKey: key, title, text },
      }, '*');
    });

    wrap.append(button, numberLabel, directionLabel);
    heading.insertAdjacentElement('afterend', wrap);
    controlsByKey.set(key, { wrap, input, checkbox, arrow });
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
      for (const [key] of controlsByKey) updateControl(key, stateFor(key));
    } else if (message.type === 'vocal-training-state') {
      if (context) context.states[message.key] = message.state;
      updateControl(message.key, message.state || {});
    }
  });

  window.parent.postMessage({ type: 'vocal-lesson-ready' }, '*');
})();
