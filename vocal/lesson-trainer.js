(() => {
  'use strict';

  const controlsByKey = new Map();
  const configsByKey = new Map();
  let context = null;
  let initialized = false;
  let localTrainerPopup = null;
  let previewContext = null;
  let previewInstrument = null;
  let previewInstrumentName = null;
  let previewRunId = 0;
  let previewTimers = [];
  const previewOscillators = new Set();

  const PRACTICE_TITLE = /progress[aã]o|protocolo|n[ií]vel|viol[aã]o|fantasm|sess[aã]o-modelo|vers[aã]o-base|dom[ií]nio|isole|treine|pr[aá]tica|exerc[ií]cio completo|transposi[cç][aã]o|velocidade|staccato|legato|sustent|vibrato|tetracorde|tr[ií]ade|subida completa|s[oó] a descida|apenas a descida|apenas a subida/i;
  const PRACTICE_TEXT = /\b(fa[cç]a|cante|toque|repita|sustente|inspire|expire|fale|diga|alterne|comece|suba|des[cç]a|use o viol[aã]o|retire o viol[aã]o|grave)\b/i;
  const EXCLUDE_TITLE = /base cient[ií]fica|refer[eê]ncias|diagn[oó]stico|crit[eé]rios|evid[eê]ncia|o que conta como progresso|objetivo central|n[aã]o use este exerc[ií]cio|o que a ci[eê]ncia n[aã]o permite/i;
  const NOTE_TOKEN = /\b[A-Ga-g](?:[#♯b♭])?-?\d+\b/g;
  const NOTE_CLASSES = { C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11 };
  const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function noteToMidi(note) {
    const match = String(note || '').replaceAll('♯','#').replaceAll('♭','b').match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
    if (!match) return null;
    const pitchClass = NOTE_CLASSES[match[1].toUpperCase() + match[2]];
    return Number.isInteger(pitchClass) ? 12 * (Number(match[3]) + 1) + pitchClass : null;
  }

  function midiToNote(midi) {
    return `${SHARP_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  }

  function transposeSequence(notes, shift) {
    return (Array.isArray(notes) ? notes : []).map(note => {
      if (!note) return null;
      const midi = noteToMidi(note);
      return midi == null ? note : midiToNote(midi + shift);
    });
  }

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

  function clearPreview() {
    previewRunId += 1;
    previewTimers.forEach(clearTimeout);
    previewTimers = [];
    try { previewInstrument?.stop(); } catch (_) {}
    previewOscillators.forEach(oscillator => { try { oscillator.stop(); } catch (_) {} });
    previewOscillators.clear();
    document.querySelectorAll('.training-listen[data-playing="true"]').forEach(button => {
      button.dataset.playing = 'false';
      button.textContent = 'Ouvir';
    });
  }

  async function ensurePreviewContext() {
    if (!previewContext || previewContext.state === 'closed') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio indisponível');
      previewContext = new AudioContextClass({ latencyHint: 'interactive' });
    }
    await Promise.race([
      previewContext.resume(),
      new Promise(resolve => setTimeout(resolve, 900)),
    ]);
    if (previewContext.state !== 'running') throw new Error('áudio bloqueado pelo navegador');
    return previewContext;
  }

  async function ensurePreviewInstrument(name) {
    await ensurePreviewContext();
    if (previewInstrument && previewInstrumentName === name) return previewInstrument;
    try { previewInstrument?.dispose(); } catch (_) {}
    const { Soundfont } = await import('https://unpkg.com/smplr/dist/index.mjs');
    previewInstrumentName = name;
    previewInstrument = Soundfont(previewContext, {
      instrument: name,
      kit: 'MusyngKite',
      volume: 105,
    });
    await previewInstrument.ready;
    return previewInstrument;
  }

  function playPreviewClick(accent = false) {
    if (!previewContext) return;
    const now = previewContext.currentTime;
    const oscillator = previewContext.createOscillator();
    const gain = previewContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(accent ? 1320 : 880, now);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(accent ? .12 : .07, now + .005);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .055);
    oscillator.connect(gain).connect(previewContext.destination);
    previewOscillators.add(oscillator);
    oscillator.start(now);
    oscillator.stop(now + .065);
    oscillator.addEventListener('ended', () => previewOscillators.delete(oscillator), { once: true });
  }

  async function previewConfig(config, button) {
    if (!config) {
      button.textContent = 'Aguarde';
      setTimeout(() => { button.textContent = 'Ouvir'; }, 900);
      return;
    }
    if (button.dataset.playing === 'true') {
      clearPreview();
      return;
    }
    clearPreview();
    const runId = previewRunId;
    button.dataset.playing = 'true';
    button.textContent = 'Parar';
    try {
      const notes = config.mode === 'breathing' ? [] : (config.guideNotes || []);
      if (!notes.some(Boolean)) {
        await ensurePreviewContext();
        const beatMs = config.mode === 'breathing' ? 300 : Math.round(60000 / config.bpm);
        [0,1,2,3].forEach(index => previewTimers.push(setTimeout(() => playPreviewClick(index === 0), index * beatMs)));
        previewTimers.push(setTimeout(clearPreview, beatMs * 4 + 80));
        return;
      }
      const instrument = await ensurePreviewInstrument(config.instrument || 'acoustic_guitar_nylon');
      if (runId !== previewRunId) return;
      const noteMs = Math.round(60000 / (config.bpm * config.subdivision));
      notes.forEach((note, index) => previewTimers.push(setTimeout(() => {
        if (runId !== previewRunId || !note) return;
        const midi = noteToMidi(note);
        if (midi != null) instrument.start({
          note: midi,
          duration: Math.max(.12, noteMs / 1000 * .82),
          velocity: 84,
        });
      }, index * noteMs)));
      previewTimers.push(setTimeout(clearPreview, notes.length * noteMs + 100));
    } catch (error) {
      clearPreview();
      button.textContent = 'Tente de novo';
      button.title = `Não foi possível ativar o áudio: ${error.message}`;
    }
  }

  function currentConfig(key, parts) {
    const base = configsByKey.get(key);
    if (!base) return null;
    const shift = clamp(parts.input.value);
    const delta = shift - (Number(base.transpose) || 0);
    const bpm = clampBpm(parts.bpm.value, parts.suggested.bpm);
    return {
      ...base,
      transpose: shift,
      directionUp: parts.checkbox.checked,
      guided: parts.guided.checked,
      bpm,
      subdivision: clampSubdivision(parts.subdivision.value, parts.suggested.subdivision),
      vocalNotes: transposeSequence(base.vocalNotes, delta),
      guideNotes: transposeSequence(base.guideNotes, delta),
      breathingDurationSec: base.mode === 'breathing'
        ? Math.min(180, Math.max(8, Math.round((base.breathingDurationSec || 30) * (base.bpm || bpm) / bpm)))
        : base.breathingDurationSec,
    };
  }

  function popupUrl(config) {
    const url = new URL('../trainer/index.html', window.location.href);
    url.hash = `config=${encodeURIComponent(JSON.stringify(config))}`;
    return url.href;
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
    listenButton.disabled = true;
    if (window.location.protocol === 'file:') button.disabled = true;

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
    const tempoDown = document.createElement('button');
    tempoDown.className = 'tempo-step';
    tempoDown.type = 'button';
    tempoDown.textContent = '−';
    tempoDown.setAttribute('aria-label', 'Diminuir 4 bpm');
    const bpmSuffix = document.createElement('span');
    bpmSuffix.textContent = 'bpm';
    const tempoUp = document.createElement('button');
    tempoUp.className = 'tempo-step';
    tempoUp.type = 'button';
    tempoUp.textContent = '+';
    tempoUp.setAttribute('aria-label', 'Aumentar 4 bpm');
    tempoLabel.append(bpmHidden, tempoDown, bpm, bpmSuffix, tempoUp);

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

    const section = { trainingKey: key, title, text };

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
        section,
      }, '*');
    }

    input.addEventListener('input', save);
    input.addEventListener('change', save);
    checkbox.addEventListener('change', save);
    guided.addEventListener('change', save);
    bpm.addEventListener('change', save);
    subdivision.addEventListener('change', save);
    tempoDown.addEventListener('click', () => {
      bpm.value = String(clampBpm(Number(bpm.value) - 4, suggested.bpm));
      save();
    });
    tempoUp.addEventListener('click', () => {
      bpm.value = String(clampBpm(Number(bpm.value) + 4, suggested.bpm));
      save();
    });
    button.addEventListener('click', () => {
      clearPreview();
      save();
      const config = currentConfig(key, { input, checkbox, guided, bpm, subdivision, suggested });
      if (window.location.protocol === 'file:' && config) {
        localTrainerPopup = window.open(
          popupUrl(config),
          'vocalTrainerWindow',
          'popup=yes,width=1180,height=820,resizable=yes,scrollbars=yes'
        );
        if (localTrainerPopup) return;
      }
      window.parent.postMessage({
        type: 'vocal-open-training',
        section,
      }, '*');
    });

    listenButton.addEventListener('click', () => {
      save();
      previewConfig(currentConfig(key, { input, checkbox, guided, bpm, subdivision, suggested }), listenButton);
    });

    wrap.append(button, listenButton, numberLabel, directionLabel, guidedLabel, tempoLabel, subdivisionLabel);
    heading.insertAdjacentElement('afterend', wrap);
    controlsByKey.set(key, { wrap, button, listenButton, input, checkbox, arrow, guided, bpm, subdivision, suggested, title, text });
    window.parent.postMessage({ type: 'vocal-register-training', section }, '*');
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
    if (localTrainerPopup && event.source === localTrainerPopup) {
      if (message.type === 'vocal-trainer-complete') {
        window.parent.postMessage({ type: 'vocal-training-complete', key: message.trainingKey }, '*');
        try { localTrainerPopup.close(); } catch (_) {}
        localTrainerPopup = null;
      } else if (message.type === 'vocal-trainer-close') {
        try { localTrainerPopup.close(); } catch (_) {}
        localTrainerPopup = null;
      }
      return;
    }
    if (event.source !== window.parent) return;

    if (message.type === 'vocal-lesson-context') {
      context = message;
      initialize();
      for (const [key, parts] of controlsByKey) updateControl(key, stateFor(key, parts.title, parts.text));
    } else if (message.type === 'vocal-training-state') {
      if (context) context.states[message.key] = message.state;
      updateControl(message.key, message.state || {});
    } else if (message.type === 'vocal-section-config') {
      configsByKey.set(message.key, message.config);
      const parts = controlsByKey.get(message.key);
      if (parts) {
        parts.listenButton.disabled = false;
        parts.button.disabled = false;
        parts.wrap.dataset.configReady = 'true';
      }
    }
  });

  window.parent.postMessage({ type: 'vocal-lesson-ready' }, '*');
})();
