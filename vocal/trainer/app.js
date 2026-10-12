(async () => {
const { PitchDetector } = await import("https://esm.sh/pitchy@4");
const { Soundfont } = await import("https://unpkg.com/smplr/dist/index.mjs");

// ------------------------------------------------------------
// CONFIGURAÇÃO
// ------------------------------------------------------------
const CONFIG = {
  fftSize: 4096,
  analysisEveryMs: 20,

  // Uma estimativa só entra no rastreador se passar por estes dois gates.
  minClarity: 0.86,
  minRms: 0.008,

  // Faixa útil para voz. Pode ser ampliada se necessário.
  minHz: 65,
  maxHz: 1200,

  // Enquanto o pitch ficar dentro desta região, consideramos a mesma nota.
  leaveToleranceCents: 75,

  // Se sair da nota, a nova região precisa mostrar coerência antes de virar
  // uma transição verdadeira. Assim um pico isolado não cria uma nota falsa.
  candidateFrames: 3,
  candidateSpreadCents: 38,
  minNewRegionDistanceCents: 80,
  newRegionMembershipCents: 55,

  // Pausas curtas não quebram a nota. Uma pausa maior encerra o segmento.
  maxUnvoicedGapMs: 180,

  // Segmentos muito curtos tendem a ser ruído/transiente.
  minSegmentMs: 75,

  // Aquisição inicial (e após pausas longas): o primeiro pitch coerente só vira
  // uma nota depois de algumas leituras concordarem entre si. Isso evita que
  // o ataque inicial/latência do detector seja registrado como uma nota errada.
  initialAcquireFrames: 3,
  initialAcquireSpreadCents: 30,
  initialAcquireMaxDeviationCents: 45,
  initialAcquireMembershipCents: 52,
  initialAcquireMaxBufferFrames: 20,
  initialAcquireResetGapMs: 240,

  // Notas consecutivas iguais não podem ser separadas por pitch. Quando o
  // exercício pede E3 E3, usamos uma pausa curta de articulação ou, como
  // fallback, o tempo conhecido do exercício para abrir o segundo segmento.
  repeatedSameNoteGapMs: 50,
  repeatedSameNoteTimingToleranceMs: 35,

  // Avaliação pedagógica: não “condenar” ataques e bordas da nota.
  // O núcleo estável é analisado depois de retirar um pequeno trecho das bordas.
  evaluationEdgeTrimMs: 38,
  minCoreSamples: 3,
  lowConfidenceMs: 180,
  highConfidenceMs: 320,

  // Canvas mostra os últimos N segundos durante a captura.
  graphWindowSeconds: 8,

  // O instrumento anuncia cada posição antes do alvo visual e da medição.
  // A defasagem é sempre proporcional à duração escolhida para a nota.
  guideLeadRatio: 0.20,

  preSingGuideDurationMs: 420,
  quickCountInMs: 300,
};

// ------------------------------------------------------------
// DOM
// ------------------------------------------------------------
const $ = (id) => document.getElementById(id);

const exerciseInput = $("exercise");
const noteDurationInput = $("noteDuration");
const instrumentSelect = $("instrument");
const clarityThresholdInput = $("clarityThreshold");
const rmsThresholdInput = $("rmsThreshold");
const bpmInput = $("bpm");
const subdivisionSelect = $("subdivision");
const startButton = $("startButton");
const retryBtn = $("retryBtn");
const completeBtn = $("completeBtn");
const resultCloseBtn = $("resultCloseBtn");
const resultActions = $("resultActions");
const globalScoreEl = $("globalScore");
const trainerTitleEl = $("trainerTitle");
const trainerContextEl = $("trainerContext");
const vocalSequenceEl = $("vocalSequence");
const guideSequenceEl = $("guideSequence");
const transposeDisplayEl = $("transposeDisplay");
const tempoDisplayEl = $("tempoDisplay");
const breathingSection = $("breathingSection");
const breathingTimerEl = $("breathingTimer");
const statusEl = $("status");
const transportCue = $("transportCue");
const cueTitle = $("cueTitle");
const cueText = $("cueText");
const cuePulse = $("cuePulse");
const demoNotesEl = $("demoNotes");
const pitchSection = $("pitchSection");
const evaluationSection = $("evaluationSection");

const currentNoteEl = $("currentNote");
const currentHzEl = $("currentHz");
const currentCentsEl = $("currentCents");
const currentClarityEl = $("currentClarity");
const trackerStateEl = $("trackerState");

const summaryEl = $("summary");
const resultsBody = $("resultsBody");
const extrasEl = $("extras");
const canvas = $("pitchCanvas");
const ctx = canvas.getContext("2d");
const graphNowEl = $("graphNow");
const graphNextEl = $("graphNext");

// ------------------------------------------------------------
// ESTADO DE ÁUDIO
// ------------------------------------------------------------
let audioContext = null;
let mediaStream = null;
let preparedMediaStream = null;
let sourceNode = null;
let analyserNode = null;
let detector = null;
let audioBuffer = null;
let analysisTimer = null;
let sessionStartMs = 0;
let expectedNotes = [];
let tracker = null;
let graphFrames = [];
let reviewMode = false;
let evaluationOverlay = null;

let guideAudioContext = null;
let guideInstrument = null;
let guideInstrumentName = null;
let demoTimers = [];

let appState = "WAITING"; // WAITING | PREPARING | DEMO | COUNTDOWN | LISTENING | CANCELLING | EVALUATING | DONE
let stoppingAutomatically = false;
let integrationConfig = null;
let guidePattern = [];
let fixedGuide = null;
let graphCountdownLabel = null;
let graphCountdownCaption = "";
let breathingTimerId = null;
let metronomeTimerId = null;
let breathingEndAt = 0;
let needsActivationRetry = false;

function postHostMessage(message) {
  const target = window.opener && !window.opener.closed ? window.opener : window.parent;
  if (target && target !== window) target.postMessage(message, "*");
}

// ------------------------------------------------------------
// FUNÇÕES MUSICAIS
// ------------------------------------------------------------
const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
  "B#": 0,
};

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function normalizeNoteToken(token) {
  return token
    .trim()
    .replaceAll("♯", "#")
    .replaceAll("♭", "b");
}

function noteNameToMidi(note) {
  const token = normalizeNoteToken(note);
  const match = token.match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) throw new Error(`Nota inválida: "${note}"`);

  const letter = match[1].toUpperCase();
  const accidental = match[2];
  const octave = Number(match[3]);
  const name = letter + accidental;

  if (!(name in NOTE_TO_SEMITONE)) {
    throw new Error(`Nota inválida: "${note}"`);
  }

  let semitone = NOTE_TO_SEMITONE[name];
  let octaveAdjust = 0;

  // B# pertence à oitava seguinte; Cb pertence à anterior.
  if (name === "B#") octaveAdjust = 1;
  if (name === "Cb") octaveAdjust = -1;

  return 12 * (octave + 1 + octaveAdjust) + semitone;
}

function parseExercise(text) {
  const tokens = text
    .replaceAll(",", " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) throw new Error("Digite pelo menos uma nota no exercício.");

  return tokens.map((token, index) => ({
    index,
    label: normalizeNoteToken(token),
    midi: noteNameToMidi(token),
  }));
}

function parseGuidePattern(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note, index) => {
    if (note == null || note === "" || note === "—") return null;
    const label = normalizeNoteToken(String(note));
    return { index, label, midi: noteNameToMidi(label) };
  });
}

function hzToMidiFloat(hz) {
  return 69 + 12 * Math.log2(hz / 440);
}

function midiToHz(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function midiFloatToNearestNote(midiFloat) {
  const midi = Math.round(midiFloat);
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const cents = (midiFloat - midi) * 100;
  return {
    midi,
    name: `${SHARP_NAMES[pitchClass]}${octave}`,
    cents,
  };
}

function centsBetweenMidi(midiFloat, referenceMidi) {
  return (midiFloat - referenceMidi) * 100;
}

// ------------------------------------------------------------
// ESTATÍSTICA ROBUSTA
// ------------------------------------------------------------
function mean(values) {
  if (!values.length) return NaN;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values) {
  if (!values.length) return NaN;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function percentile(values, p) {
  if (!values.length) return NaN;
  const a = [...values].sort((x, y) => x - y);
  const index = (a.length - 1) * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  if (lo === hi) return a[lo];
  const w = index - lo;
  return a[lo] * (1 - w) + a[hi] * w;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

function robustCenterMidi(samples) {
  return median(samples.map((s) => s.midi));
}

function robustSpreadCents(samples) {
  if (!samples.length) return Infinity;
  const values = samples.map((s) => s.midi * 100);
  // IQR é menos sensível a um ponto extremo do que max-min.
  return percentile(values, 0.75) - percentile(values, 0.25);
}

function rms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// ------------------------------------------------------------
// RASTREADOR DE SEGMENTOS / TRANSIÇÕES
// ------------------------------------------------------------
class SegmentTracker {
  constructor(expected = [], noteDurationMs = 1000) {
    this.expected = expected;
    this.noteDurationMs = noteDurationMs;
    this.reset();
  }

  reset() {
    this.current = null;
    this.pendingTransition = null;
    this.segments = [];
    this.outlierCount = 0;
    this.lastValidT = null;
    this.initialFrames = [];
    this.initialRawStartT = null;
    this.lastInitialT = null;
    this.unvoicedStartT = null;
    this.state = "SILÊNCIO";
  }

  ingest(frame) {
    this.lastValidT = frame.t;

    if (!this.current) {
      this._ingestInitial(frame);
      return;
    }

    // Se houve um pequeno buraco de pitch entre duas notas iguais esperadas,
    // tratamos a volta da voz como uma nova articulação em vez de fundir tudo.
    if (this.unvoicedStartT != null) {
      const gapMs = frame.t - this.unvoicedStartT;
      if (this._nextExpectedIsSamePitch() && gapMs >= CONFIG.repeatedSameNoteGapMs) {
        const splitT = this.unvoicedStartT;
        this._finalizeCurrent(splitT);
        this._startSegment([frame], {
          startT: splitT,
          endT: frame.t,
          durationMs: Math.max(0, frame.t - splitT),
          kind: "rearticulation",
        }, splitT);
        this.unvoicedStartT = null;
        this.pendingTransition = null;
        this.state = "NOVA ARTICULAÇÃO";
        return;
      }
      this.unvoicedStartT = null;
    }

    const currentCenter = robustCenterMidi(this.current.samples);
    const distanceFromCurrent = Math.abs((frame.midi - currentCenter) * 100);

    // E3 -> E3 não possui salto de frequência para detectar. Como o exercício
    // fornece o tempo por nota, usamos esse relógio apenas para notas iguais
    // consecutivas. Isso impede que duas repetições virem um único segmento.
    if (
      !this.pendingTransition &&
      distanceFromCurrent <= CONFIG.leaveToleranceCents &&
      this._nextExpectedIsSamePitch() &&
      this._samePitchBoundaryReached(frame.t)
    ) {
      const boundaryT = this.current.nominalStartT + this.noteDurationMs;
      this._finalizeCurrent(boundaryT);
      this._startSegment([frame], {
        startT: boundaryT,
        endT: frame.t,
        durationMs: Math.max(0, frame.t - boundaryT),
        kind: "same-note-timing",
      }, boundaryT);
      this.state = "NOTA REPETIDA";
      return;
    }

    if (!this.pendingTransition) {
      if (distanceFromCurrent <= CONFIG.leaveToleranceCents) {
        this.current.samples.push(frame);
        this.current.lastT = frame.t;
        this.state = "NOTA";
      } else {
        // Não decidimos ainda se é ruído ou mudança verdadeira.
        this.pendingTransition = {
          startT: frame.t,
          frames: [frame],
        };
        this.state = "TRANSIÇÃO?";
      }
      return;
    }

    // Há uma hipótese de transição em aberto.
    this.pendingTransition.frames.push(frame);

    // Se voltou rapidamente para a região antiga, a excursão é tratada como outlier.
    const refreshedCurrentCenter = robustCenterMidi(this.current.samples);
    const backToCurrent = Math.abs((frame.midi - refreshedCurrentCenter) * 100)
      <= CONFIG.leaveToleranceCents;

    if (backToCurrent) {
      this.outlierCount += this.pendingTransition.frames.length - 1;
      this.pendingTransition = null;
      this.current.samples.push(frame);
      this.current.lastT = frame.t;
      this.state = "NOTA";
      return;
    }

    const candidate = this.pendingTransition.frames.slice(-CONFIG.candidateFrames);
    if (candidate.length < CONFIG.candidateFrames) {
      this.state = "TRANSIÇÃO?";
      return;
    }

    const candidateCenter = robustCenterMidi(candidate);
    const candidateSpread = robustSpreadCents(candidate);
    const distanceCenters = Math.abs((candidateCenter - refreshedCurrentCenter) * 100);

    const coherentNewRegion =
      candidateSpread <= CONFIG.candidateSpreadCents &&
      distanceCenters >= CONFIG.minNewRegionDistanceCents;

    if (!coherentNewRegion) {
      this.state = "TRANSIÇÃO";
      return;
    }

    // A nova região persistiu: retrocedemos no buffer da transição para achar
    // quando o pitch começou de fato a permanecer perto do novo centro.
    const frames = this.pendingTransition.frames;
    let stableStartIndex = frames.length - 1;

    for (let i = frames.length - 1; i >= 0; i--) {
      const d = Math.abs((frames[i].midi - candidateCenter) * 100);
      if (d <= CONFIG.newRegionMembershipCents) {
        stableStartIndex = i;
      } else {
        break;
      }
    }

    const stableFrames = frames.slice(stableStartIndex);
    const stableStartT = stableFrames[0].t;
    const transitionStartT = this.pendingTransition.startT;

    this._finalizeCurrent(transitionStartT);

    this._startSegment(stableFrames, {
      startT: transitionStartT,
      endT: stableStartT,
      durationMs: Math.max(0, stableStartT - transitionStartT),
    });

    this.pendingTransition = null;
    this.state = "NOTA";
  }

  noPitch(t) {
    if (!this.current || this.lastValidT == null) {
      if (
        this.initialFrames.length &&
        this.lastInitialT != null &&
        t - this.lastInitialT >= CONFIG.initialAcquireResetGapMs
      ) {
        this.initialFrames = [];
        this.initialRawStartT = null;
        this.lastInitialT = null;
      }
      this.state = this.initialFrames.length ? "ADQUIRINDO" : "SILÊNCIO";
      return;
    }

    if (this.unvoicedStartT == null) this.unvoicedStartT = t;

    if (t - this.lastValidT >= CONFIG.maxUnvoicedGapMs) {
      this._finalizeCurrent(this.lastValidT);
      this.current = null;
      this.pendingTransition = null;
      this.unvoicedStartT = null;
      this.initialFrames = [];
      this.initialRawStartT = null;
      this.lastInitialT = null;
      this.state = "SILÊNCIO";
    } else {
      this.state = "SEM PITCH";
    }
  }

  _ingestInitial(frame) {
    if (!this.initialFrames.length) this.initialRawStartT = frame.t;
    this.initialFrames.push(frame);
    this.lastInitialT = frame.t;

    if (this.initialFrames.length > CONFIG.initialAcquireMaxBufferFrames) {
      // Mantemos initialRawStartT como o primeiro ataque válido ouvido. O buffer
      // pode rolar, mas o relógio nominal da primeira nota não deve andar junto.
      this.initialFrames.shift();
    }

    if (this.initialFrames.length < CONFIG.initialAcquireFrames) {
      this.state = "ADQUIRINDO";
      return;
    }

    const candidate = this.initialFrames.slice(-CONFIG.initialAcquireFrames);
    const center = robustCenterMidi(candidate);
    const spread = robustSpreadCents(candidate);
    const maxDeviation = Math.max(
      ...candidate.map((f) => Math.abs((f.midi - center) * 100)),
    );

    if (
      spread > CONFIG.initialAcquireSpreadCents ||
      maxDeviation > CONFIG.initialAcquireMaxDeviationCents
    ) {
      this.state = "ADQUIRINDO";
      return;
    }

    // A estabilidade foi confirmada agora, mas retrocedemos apenas pelas
    // leituras que já pertencem à mesma região. O ataque instável anterior não
    // entra no segmento avaliado.
    let stableStartIndex = this.initialFrames.length - CONFIG.initialAcquireFrames;
    for (let i = stableStartIndex - 1; i >= 0; i--) {
      const d = Math.abs((this.initialFrames[i].midi - center) * 100);
      if (d <= CONFIG.initialAcquireMembershipCents) stableStartIndex = i;
      else break;
    }

    const stableFrames = this.initialFrames.slice(stableStartIndex);
    const ignored = Math.max(0, stableStartIndex);
    this.outlierCount += ignored;

    this._startSegment(stableFrames, null, this.initialRawStartT ?? stableFrames[0].t);
    this.initialFrames = [];
    this.initialRawStartT = null;
    this.lastInitialT = null;
    this.state = "NOTA";
  }

  _nextExpectedIsSamePitch() {
    const currentExpectedIndex = this.segments.length;
    const currentExpected = this.expected[currentExpectedIndex];
    const nextExpected = this.expected[currentExpectedIndex + 1];
    return Boolean(
      currentExpected &&
      nextExpected &&
      currentExpected.midi === nextExpected.midi
    );
  }

  _samePitchBoundaryReached(t) {
    if (!this.current || !Number.isFinite(this.noteDurationMs)) return false;
    const boundaryT = this.current.nominalStartT + this.noteDurationMs;
    return t >= boundaryT - CONFIG.repeatedSameNoteTimingToleranceMs;
  }

  flush() {
    // Se a sessão terminou no meio de uma hipótese, tentamos uma última confirmação.
    if (this.pendingTransition && this.pendingTransition.frames.length >= CONFIG.candidateFrames) {
      const candidate = this.pendingTransition.frames.slice(-CONFIG.candidateFrames);
      const currentCenter = robustCenterMidi(this.current.samples);
      const candidateCenter = robustCenterMidi(candidate);
      const candidateSpread = robustSpreadCents(candidate);
      const distanceCenters = Math.abs((candidateCenter - currentCenter) * 100);

      if (
        candidateSpread <= CONFIG.candidateSpreadCents &&
        distanceCenters >= CONFIG.minNewRegionDistanceCents
      ) {
        const frames = this.pendingTransition.frames;
        let stableStartIndex = frames.length - 1;
        for (let i = frames.length - 1; i >= 0; i--) {
          const d = Math.abs((frames[i].midi - candidateCenter) * 100);
          if (d <= CONFIG.newRegionMembershipCents) stableStartIndex = i;
          else break;
        }
        const stableFrames = frames.slice(stableStartIndex);
        const stableStartT = stableFrames[0].t;
        const transitionStartT = this.pendingTransition.startT;

        this._finalizeCurrent(transitionStartT);
        this._startSegment(stableFrames, {
          startT: transitionStartT,
          endT: stableStartT,
          durationMs: Math.max(0, stableStartT - transitionStartT),
        });
      } else {
        this.outlierCount += this.pendingTransition.frames.length;
      }
    }

    this.pendingTransition = null;

    if (this.current) {
      this._finalizeCurrent(this.lastValidT ?? this.current.lastT);
      this.current = null;
    }

    return this._cleanSegments(this.segments);
  }

  _startSegment(seedFrames, transition, nominalStartT = seedFrames[0].t) {
    this.current = {
      startT: seedFrames[0].t,
      nominalStartT,
      lastT: seedFrames.at(-1).t,
      samples: [...seedFrames],
      transitionFromPrevious: transition,
    };
  }

  _finalizeCurrent(endT) {
    if (!this.current || !this.current.samples.length) return;

    const segment = {
      ...this.current,
      detectedIndex: this.segments.length,
      endT: Math.max(endT, this.current.startT),
    };
    segment.durationMs = segment.endT - segment.startT;
    segment.centerMidi = robustCenterMidi(segment.samples);
    segment.nearest = midiFloatToNearestNote(segment.centerMidi);

    this.segments.push(segment);
  }

  _cleanSegments(segments) {
    return segments.filter((segment) => segment.durationMs >= CONFIG.minSegmentMs);
  }
}

// ------------------------------------------------------------
// ALINHAMENTO: SEGMENTOS DETECTADOS x EXERCÍCIO ESPERADO
// ------------------------------------------------------------
function alignSegments(expected, detected) {
  const n = expected.length;
  const m = detected.length;

  const MISSING_EXPECTED_COST = 3.5;
  const EXTRA_DETECTED_COST = 1.2;

  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  const prev = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  dp[0][0] = 0;

  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const base = dp[i][j];
      if (!Number.isFinite(base)) continue;

      if (i < n && j < m) {
        const absCents = Math.abs(centsBetweenMidi(detected[j].centerMidi, expected[i].midi));
        // 100 cents ~ custo 1. O teto evita que uma execução muito ruim
        // destrua completamente o alinhamento temporal da sequência.
        const matchCost = Math.min(absCents / 100, 5);
        relax(i + 1, j + 1, base + matchCost, { type: "match", i, j });
      }

      if (i < n) {
        relax(i + 1, j, base + MISSING_EXPECTED_COST, { type: "missing", i, j });
      }

      if (j < m) {
        relax(i, j + 1, base + EXTRA_DETECTED_COST, { type: "extra", i, j });
      }
    }
  }

  function relax(ni, nj, cost, step) {
    if (cost < dp[ni][nj]) {
      dp[ni][nj] = cost;
      prev[ni][nj] = step;
    }
  }

  const assignments = Array(n).fill(null);
  const extras = [];

  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const step = prev[i][j];
    if (!step) break;

    if (step.type === "match") {
      assignments[step.i] = step.j;
      i--;
      j--;
    } else if (step.type === "missing") {
      assignments[step.i] = null;
      i--;
    } else {
      extras.push(step.j);
      j--;
    }
  }

  extras.reverse();
  return { assignments, extras, cost: dp[n][m] };
}

// ------------------------------------------------------------
// MÉTRICAS DE AFINAÇÃO
// ------------------------------------------------------------
function medianAbsoluteDeviation(values) {
  if (!values.length) return 0;
  const m = median(values);
  return median(values.map((v) => Math.abs(v - m)));
}

function stableCoreSamples(segment) {
  const samples = segment.samples;
  if (samples.length <= CONFIG.minCoreSamples) return [...samples];

  // Retira ataque e saída do segmento. Em segmentos curtos, faz um corte menor
  // para não jogar fora informação demais.
  let trimMs = CONFIG.evaluationEdgeTrimMs;
  if (segment.durationMs < 300) trimMs = 35;
  if (segment.durationMs < 210) trimMs = 15;

  let core = samples.filter(
    (s) => s.t >= segment.startT + trimMs && s.t <= segment.endT - trimMs,
  );

  if (core.length < CONFIG.minCoreSamples) core = [...samples];

  // Rejeição robusta de glitches dentro do próprio segmento. O centro usado
  // aqui é o centro do que foi cantado, não o pitch esperado; portanto uma nota
  // realmente cantada 1 semitom errada NÃO é “corrigida” por este filtro.
  const midiCents = core.map((s) => s.midi * 100);
  const center = median(midiCents);
  const mad = medianAbsoluteDeviation(midiCents);
  const robustSigma = 1.4826 * mad;
  const limit = Math.min(90, Math.max(30, 3.0 * robustSigma));

  const filtered = core.filter((s) => Math.abs(s.midi * 100 - center) <= limit);
  return filtered.length >= CONFIG.minCoreSamples ? filtered : core;
}

function confidenceFor(result) {
  const duration = result.analyzedDurationMs;
  if (result.sampleCount < CONFIG.minCoreSamples || duration < CONFIG.lowConfidenceMs) {
    return { label: "Baixa", className: "confidence-low", rank: 0 };
  }
  if (duration < CONFIG.highConfidenceMs) {
    return { label: "Média", className: "confidence-medium", rank: 1 };
  }
  return { label: "Alta", className: "confidence-high", rank: 2 };
}

function analyzeMatchedSegment(segment, expected) {
  const coreSamples = stableCoreSamples(segment);
  const cents = coreSamples.map((s) => centsBetweenMidi(s.midi, expected.midi));
  const abs = cents.map(Math.abs);

  const bias = median(cents);                // erro central sustentado
  const mae = mean(abs);                     // erro absoluto médio do núcleo
  const p90 = percentile(abs, 0.90);         // cauda sem depender de um único pico
  const sigma = stdDev(cents);               // estabilidade, não “nota certa/errada”
  const rmse = Math.sqrt(mean(cents.map((c) => c * c)));

  const analyzedDurationMs = coreSamples.length > 1
    ? coreSamples.at(-1).t - coreSamples[0].t + CONFIG.analysisEveryMs
    : 0;

  const result = {
    expected,
    segment,
    coreSamples,
    sampleCount: coreSamples.length,
    analyzedDurationMs,
    bias,
    mae,
    p90,
    sigma,
    rmse,
  };

  result.confidence = confidenceFor(result);
  return result;
}

function gradeTuning(result) {
  if (!result) return { label: "Não detectada", className: "grade-missing", rank: -1 };

  // Trechos curtos não recebem julgamento vermelho: há pouca evidência para
  // distinguir ataque/transição de uma nota realmente sustentada.
  if (result.confidence.rank === 0) {
    return { label: "Baixa confiança", className: "grade-uncertain", rank: 0 };
  }

  const e = Math.abs(result.bias);
  if (e <= 18) return { label: "Excelente", className: "grade-excellent", rank: 1 };
  if (e <= 35) return { label: "Boa", className: "grade-good", rank: 2 };
  if (e <= 50) return { label: "Atenção", className: "grade-attention", rank: 3 };
  if (e <= 70) return { label: "Desvio perceptível", className: "grade-deviation", rank: 4 };
  return { label: "Erro claro", className: "grade-problem", rank: 5 };
}

function gradeStability(result) {
  if (!result || result.confidence.rank === 0) {
    return { label: "—", className: "stability-neutral" };
  }

  const s = result.sigma;
  if (s <= 12) return { label: "Muito estável", className: "stability-good" };
  if (s <= 25) return { label: "Estável", className: "stability-good" };
  if (s <= 40) return { label: "Variável", className: "stability-variable" };
  return { label: "Instável", className: "stability-variable" };
}

function fmtSigned(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
}

function formatTransitionMs(ms) {
  if (!Number.isFinite(ms)) return "—";
  if (ms <= 1) return `< ${CONFIG.analysisEveryMs} ms`;
  return `${Math.round(ms)} ms`;
}

// ------------------------------------------------------------
// FLUXO AUTOMÁTICO / ÁUDIO / LOOP DE PITCH
// ------------------------------------------------------------
function setAppState(next) {
  appState = next;
  transportCue.dataset.state = next.toLowerCase();
}

function setCue(title, text = "", pulse = "") {
  cueTitle.textContent = title;
  cueText.textContent = text;
  cuePulse.textContent = pulse;
}

function setControlsLocked(locked) {
  exerciseInput.disabled = locked;
  noteDurationInput.disabled = locked;
  instrumentSelect.disabled = locked;
  clarityThresholdInput.disabled = locked;
  rmsThresholdInput.disabled = locked;
  bpmInput.disabled = locked;
  subdivisionSelect.disabled = locked;
  startButton.disabled = locked;
}

function clearDemoTimers() {
  for (const id of demoTimers) clearTimeout(id);
  demoTimers = [];
}

function clearFixedGuide() {
  fixedGuide = null;
  graphCountdownLabel = null;
  graphCountdownCaption = "";
  try { guideInstrument?.stop(); } catch {}
  renderDemoNotes(-1);
}

function renderDemoNotes(activeIndex = -1) {
  demoNotesEl.innerHTML = "";
  const visualPattern = guidePattern.length ? guidePattern : expectedNotes;
  visualPattern.forEach((note, index) => {
    const span = document.createElement("span");
    span.textContent = note?.label || "—";
    if (!note) span.classList.add("rest");
    if (index === activeIndex) span.classList.add("active");
    demoNotesEl.appendChild(span);
  });
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function currentNoteDurationMs() {
  const bpm = clampNumber(bpmInput.value, 40, 180, 80);
  const subdivision = clampNumber(subdivisionSelect.value, 1, 4, 1);
  const noteMs = Math.round(60000 / (bpm * subdivision));
  noteDurationInput.value = String(noteMs);
  return clampNumber(noteMs, 80, 4000, 1000);
}

function currentBeatDurationMs() {
  const bpm = clampNumber(bpmInput.value, 40, 180, 80);
  return Math.round(60000 / bpm);
}

async function ensureGuideAudioContext() {
  if (!guideAudioContext || guideAudioContext.state === "closed") {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio não está disponível neste navegador.");
    guideAudioContext = new AudioContextClass({ latencyHint: "interactive" });
  }
  await Promise.race([
    guideAudioContext.resume(),
    new Promise(resolve => setTimeout(resolve, 900)),
  ]);
  if (guideAudioContext.state !== "running") {
    throw new Error("O navegador bloqueou o áudio. Clique uma vez na janela e tente novamente.");
  }
  return guideAudioContext;
}

function playMetronomeClick(accent = false) {
  if (!guideAudioContext || guideAudioContext.state === "closed") return;
  const now = guideAudioContext.currentTime;
  const oscillator = guideAudioContext.createOscillator();
  const gain = guideAudioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(accent ? 1320 : 880, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.16 : 0.09, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain).connect(guideAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.065);
}

function clearBreathingTimers() {
  if (breathingTimerId) clearInterval(breathingTimerId);
  if (metronomeTimerId) clearInterval(metronomeTimerId);
  breathingTimerId = null;
  metronomeTimerId = null;
}

async function prepareMicrophone() {
  if (preparedMediaStream?.active) return preparedMediaStream;

  if (!navigator.mediaDevices?.getUserMedia) {
    const localHint = window.location.protocol === "file:"
      ? "Abra este treino na janela própria gerada pelo tutorial, não dentro de outro frame."
      : "O navegador não liberou getUserMedia para esta origem HTTP. Confirme a autorização da origem nas configurações do navegador.";
    throw new Error(`Microfone indisponível neste contexto. ${localHint}`);
  }

  preparedMediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: integrationConfig?.guided !== false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
    video: false,
  });
  return preparedMediaStream;
}

async function prepareGuideInstrument() {
  const name = instrumentSelect.value;
  await ensureGuideAudioContext();

  if (guideInstrument && guideInstrumentName === name) return guideInstrument;

  if (guideInstrument) {
    try { guideInstrument.dispose(); } catch {}
    guideInstrument = null;
  }

  guideInstrumentName = name;
  guideInstrument = Soundfont(guideAudioContext, {
    instrument: name,
    kit: "MusyngKite",
    volume: 127,
  });
  await guideInstrument.ready;
  return guideInstrument;
}

function resetSessionVisuals() {
  clearBreathingTimers();
  resultsBody.innerHTML = "";
  extrasEl.textContent = "";
  summaryEl.textContent = "Aguardando execução…";
  globalScoreEl.hidden = true;
  globalScoreEl.innerHTML = "";
  resultActions.hidden = true;
  graphFrames = [];
  graphCountdownLabel = null;
  graphCountdownCaption = "";
  tracker = null;
  reviewMode = false;
  evaluationOverlay = null;
  stoppingAutomatically = false;
  fixedGuide = null;
  currentNoteEl.textContent = "—";
  currentHzEl.textContent = "—";
  currentCentsEl.textContent = "—";
  currentClarityEl.textContent = "—";
  trackerStateEl.textContent = "—";
  drawPitchGraph(0);
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

async function startBreathingFlow() {
  if (!["WAITING", "DONE"].includes(appState)) return;
  resetSessionVisuals();
  setControlsLocked(true);
  setAppState("PREPARING");
  statusEl.textContent = "Preparando metrônomo…";

  try {
    await ensureGuideAudioContext();
  } catch (err) {
    needsActivationRetry = true;
    setControlsLocked(false);
    setAppState("WAITING");
    setCue("Ative nesta janela", "Clique uma vez aqui ou pressione ESPAÇO para liberar o áudio.", "!");
    statusEl.textContent = `Não foi possível preparar o áudio: ${err.message}`;
    return;
  }

  needsActivationRetry = false;
  if (appState !== "PREPARING") return;
  await runQuickCountIn();
  if (appState !== "COUNTDOWN") return;
  const durationSec = clampNumber(integrationConfig?.breathingDurationSec, 8, 180, 30);
  breathingEndAt = performance.now() + durationSec * 1000;
  breathingTimerEl.textContent = formatClock(durationSec);
  setAppState("LISTENING");
  setCue("COMECE", "Mantenha a coordenação indicada pela aula até o fim do tempo.", "●");
  statusEl.textContent = `Treino cronometrado por ${durationSec} segundos, sem avaliação de afinação.`;
  if (integrationConfig?.guided !== false) {
    const beatMs = currentBeatDurationMs();
    playMetronomeClick(true);
    metronomeTimerId = setInterval(() => playMetronomeClick(false), beatMs);
  }
  breathingTimerId = setInterval(() => {
    const remaining = (breathingEndAt - performance.now()) / 1000;
    breathingTimerEl.textContent = formatClock(remaining);
    if (remaining <= 0) finishBreathingAutomatically(durationSec);
  }, 100);
}

async function runQuickCountIn() {
  setAppState("COUNTDOWN");
  for (let count = 4; count >= 1; count--) {
    if (appState !== "COUNTDOWN") return;
    graphCountdownLabel = String(count);
    graphCountdownCaption = "batidas para entrar";
    drawPitchGraph(0);
    setCue("Prepare-se", "Quatro batidas rápidas e entrada imediata.", String(count));
    playMetronomeClick(count === 4);
    await new Promise(resolve => setTimeout(resolve, CONFIG.quickCountInMs));
  }
  if (appState !== "COUNTDOWN") return;
  graphCountdownLabel = "0";
  graphCountdownCaption = "entre agora";
  drawPitchGraph(0);
  setCue("ENTRE AGORA", "A primeira posição começa neste instante.", "0");
}

async function finishBreathingAutomatically(durationSec) {
  if (appState !== "LISTENING" || integrationConfig?.mode !== "breathing") return;
  clearBreathingTimers();
  setAppState("DONE");
  setControlsLocked(false);
  setCue("Treino concluído", "Você pode repetir, concluir ou fechar sem avançar.", "✓");
  statusEl.textContent = "Tempo proposto concluído automaticamente.";
  breathingTimerEl.textContent = "00:00";
  globalScoreEl.hidden = false;
  globalScoreEl.innerHTML = `
    <div class="score-number">✓</div>
    <div><div class="score-label">Treino respiratório concluído</div>
    <div class="score-detail">${Math.round(durationSec)} segundos praticados. Afinação não avaliada neste trecho.</div></div>`;
  summaryEl.innerHTML = "A atividade foi registrada como concluída. Use <strong>Concluir</strong> para avançar a transposição, ou repita sem alterar o valor.";
  resultActions.hidden = false;
  requestAnimationFrame(() => evaluationSection.scrollIntoView({ behavior: "smooth", block: "start" }));
}

async function startDemoFlow() {
  if (!["WAITING", "DONE"].includes(appState)) return;

  if (integrationConfig?.mode === "breathing") {
    await startBreathingFlow();
    return;
  }

  try {
    expectedNotes = parseExercise(exerciseInput.value);
    guidePattern = parseGuidePattern(integrationConfig?.guideNotes);
    if (!guidePattern.length) guidePattern = [...expectedNotes];
  } catch (err) {
    statusEl.textContent = err.message;
    return;
  }

  CONFIG.minClarity = clampNumber(clarityThresholdInput.value, 0.5, 0.99, 0.86);
  CONFIG.minRms = clampNumber(rmsThresholdInput.value, 0.001, 0.1, 0.008);

  resetSessionVisuals();
  renderDemoNotes();
  setControlsLocked(true);
  setAppState("PREPARING");
  setCue("Preparando áudio…", "Carregando o instrumento e preparando o microfone.", "");
  statusEl.textContent = "Preparando o início automático…";

  try {
    await Promise.all([prepareMicrophone(), prepareGuideInstrument()]);
  } catch (err) {
    await teardownAnalysisAudio();
    needsActivationRetry = true;
    setControlsLocked(false);
    setAppState("WAITING");
    setCue("Ative nesta janela", "Clique uma vez aqui ou pressione ESPAÇO para liberar áudio e microfone.", "!");
    statusEl.textContent = `Não foi possível preparar o áudio: ${err.message}`;
    return;
  }

  needsActivationRetry = false;
  if (appState !== "PREPARING") return;
  const guided = integrationConfig?.guided !== false;
  const firstReference = guidePattern[0];
  pitchSection.scrollIntoView({ behavior: "smooth", block: "center" });

  // No modo guiado a primeira referência é apresentada uma vez antes da
  // contagem. No zero ela será tocada novamente, já junto com o microfone.
  if (guided && firstReference && guideInstrument) {
    graphCountdownLabel = "♪";
    graphCountdownCaption = `referência inicial: ${firstReference.label}`;
    drawPitchGraph(0);
    setCue("REFERÊNCIA INICIAL", `Ouça ${firstReference.label}; a contagem vem em seguida.`, firstReference.label);
    statusEl.textContent = `Referência inicial em ${firstReference.label}. Depois entram quatro batidas rápidas.`;
    try {
      guideInstrument.start({
        note: firstReference.midi,
        duration: (CONFIG.preSingGuideDurationMs + CONFIG.quickCountInMs * 4 + 500) / 1000,
        velocity: 127,
      });
    } catch {}
    await new Promise(resolve => setTimeout(resolve, CONFIG.preSingGuideDurationMs + 50));
    if (appState !== "PREPARING") return;
  }

  await runQuickCountIn();
  if (appState !== "COUNTDOWN") return;
  if (guided) {
    // A referência sustentada atravessou toda a contagem; no zero ela cede
    // lugar ao novo ataque da primeira posição, já com o microfone ativo.
    try { guideInstrument?.stop(); } catch {}
  }

  if (!guided) {
    if (firstReference && guideInstrument) {
      graphCountdownLabel = "♪";
      graphCountdownCaption = `nota inicial: ${firstReference.label}`;
      drawPitchGraph(0);
      setCue("Nota inicial", `Use ${firstReference.label} como referência e entre em seguida.`, firstReference.label);
      statusEl.textContent = `Referência inicial: ${firstReference.label}. Depois, você canta sem guia.`;
      renderDemoNotes(0);
      try {
        guideInstrument.start({
          note: firstReference.midi,
          duration: CONFIG.preSingGuideDurationMs / 1000,
          velocity: 127,
        });
      } catch {}
      await new Promise(resolve => setTimeout(resolve, CONFIG.preSingGuideDurationMs + 90));
      if (appState !== "COUNTDOWN") return;
    }
  }

  renderDemoNotes(-1);
  setCue(
    "CANTE",
    guided ? "O guia entra junto com a sua voz. Use fones para evitar retorno no microfone." : "Sem guia contínuo: siga a pulsação memorizada.",
    "●"
  );
  statusEl.textContent = guided
    ? "Microfone ativo e guia simultâneo. As notas de desafio permanecem mudas."
    : "Microfone ativo. Somente a nota inicial foi usada como referência.";
  await startAnalysisFromPreparedMic();
  if (appState === "LISTENING") startFixedGuide();
}

function fixedGuideLeadMs(noteMs = fixedGuide?.noteMs ?? currentNoteDurationMs()) {
  return noteMs * CONFIG.guideLeadRatio;
}

function fixedTargetIndexAt(now) {
  if (!fixedGuide || !expectedNotes.length) return -1;
  const relativeT = now - fixedGuide.leadMs;
  if (relativeT < 0 || now >= fixedGuide.endT) return -1;
  return Math.min(expectedNotes.length - 1, Math.floor(relativeT / fixedGuide.noteMs));
}

function fixedTargetStartT(index) {
  if (!fixedGuide) return 0;
  return fixedGuide.leadMs + index * fixedGuide.noteMs;
}

function showFixedTarget(index) {
  if (!fixedGuide || !expectedNotes[index] || fixedGuide.targetIndex === index) return;
  fixedGuide.targetIndex = index;
  graphCountdownLabel = null;
  graphCountdownCaption = "";
  renderDemoNotes(index);

  const target = expectedNotes[index];
  const guided = integrationConfig?.guided !== false;
  if (guided && guidePattern[index]) {
    setCue("CANTE", `Ajuste sua voz ao instrumento em ${target.label}.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Tempo fixo pelo metrônomo.`;
  } else if (guided) {
    setCue("DESAFIO", `Cante ${target.label} sem referência auditiva.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Ataque fantasma no tempo fixo.`;
  } else {
    setCue("CANTE", `Siga o pulso memorizado em ${target.label}.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Guia contínuo desativado.`;
  }
}

function syncFixedTimeline(now) {
  if (!fixedGuide || fixedGuide.finished) return -1;
  if (now >= fixedGuide.endT) {
    fixedGuide.finished = true;
    fixedGuide.targetIndex = -1;
    try { guideInstrument?.stop(); } catch {}
    renderDemoNotes(-1);
    return -1;
  }

  const targetIndex = fixedTargetIndexAt(now);
  if (targetIndex >= 0) showFixedTarget(targetIndex);
  return targetIndex;
}

function playFixedGuideTarget(index) {
  if (!fixedGuide || fixedGuide.finished || appState !== "LISTENING") return;
  try { guideInstrument?.stop(); } catch {}

  if (integrationConfig?.guided === false) return;
  const reference = guidePattern[index];
  if (!reference || !guideInstrument) return;

  try {
    guideInstrument.start({
      note: reference.midi,
      duration: fixedGuide.noteMs / 1000 * 1.08,
      velocity: 127,
    });
  } catch {}
}

function startFixedGuide() {
  const noteMs = currentNoteDurationMs();
  const leadMs = fixedGuideLeadMs(noteMs);
  const delayUntil = (sessionT) => Math.max(0, sessionT - (performance.now() - sessionStartMs));
  fixedGuide = {
    noteMs,
    leadMs,
    endT: leadMs + expectedNotes.length * noteMs,
    targetIndex: -1,
    finished: false,
  };

  graphCountdownLabel = "♪";
  graphCountdownCaption = `alvo em ${(leadMs / 1000).toFixed(1)} s`;

  if (integrationConfig?.guided !== false) {
    playFixedGuideTarget(0);
    for (let index = 1; index < expectedNotes.length; index++) {
      demoTimers.push(setTimeout(() => playFixedGuideTarget(index), delayUntil(index * noteMs)));
    }
  }

  demoTimers.push(setTimeout(() => {
    if (appState !== "LISTENING" || !fixedGuide) return;
    showFixedTarget(0);
    drawPitchGraph(Math.max(0, performance.now() - sessionStartMs));
  }, delayUntil(leadMs)));

  demoTimers.push(setTimeout(() => {
    if (appState === "LISTENING") finishAnalysisAutomatically();
  }, delayUntil(fixedGuide.endT)));
}

async function startAnalysisFromPreparedMic() {
  if (analysisTimer) return;

  try {
    mediaStream = preparedMediaStream?.active ? preparedMediaStream : await prepareMicrophone();
    preparedMediaStream = null;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio não está disponível neste navegador.");
    audioContext = new AudioContextClass({ latencyHint: "interactive" });
    await Promise.race([
      audioContext.resume(),
      new Promise(resolve => setTimeout(resolve, 900)),
    ]);
    if (audioContext.state !== "running") throw new Error("O navegador bloqueou o processamento do microfone.");

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = CONFIG.fftSize;
    analyserNode.smoothingTimeConstant = 0;
    sourceNode.connect(analyserNode);

    audioBuffer = new Float32Array(CONFIG.fftSize);
    detector = PitchDetector.forFloat32Array(CONFIG.fftSize);

    tracker = new SegmentTracker(expectedNotes, currentNoteDurationMs());
    graphFrames = [];
    sessionStartMs = performance.now();
    stoppingAutomatically = false;

    setAppState("LISTENING");
    setCue("CANTE", "A detecção termina automaticamente; ESPAÇO cancela esta tentativa sem avaliar.", "●");
    statusEl.textContent = "Ouvindo sua voz…";
    analysisTimer = setInterval(analyzeFrame, CONFIG.analysisEveryMs);
    pitchSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    statusEl.textContent = `Não foi possível abrir o microfone: ${err.message}`;
    await teardownAnalysisAudio();
    setControlsLocked(false);
    setAppState("WAITING");
    setCue("Pressione ESPAÇO", "para tentar novamente", "ESPAÇO");
  }
}

function analyzeFrame() {
  if (!analyserNode || !detector || !tracker || appState !== "LISTENING") return;

  analyserNode.getFloatTimeDomainData(audioBuffer);

  const now = performance.now() - sessionStartMs;
  const level = rms(audioBuffer);
  const targetIndex = syncFixedTimeline(now);

  if (fixedGuide?.finished || (fixedGuide && now >= fixedGuide.endT)) {
    finishAnalysisAutomatically();
    return;
  }

  if (level < CONFIG.minRms) {
    if (targetIndex >= 0) tracker.noPitch(now);
    updateNoPitchUi();
    drawPitchGraph(now);
    return;
  }

  const [frequency, clarity] = detector.findPitch(audioBuffer, audioContext.sampleRate);

  if (
    !Number.isFinite(frequency) ||
    frequency < CONFIG.minHz ||
    frequency > CONFIG.maxHz ||
    clarity < CONFIG.minClarity
  ) {
    if (targetIndex >= 0) tracker.noPitch(now);
    updateNoPitchUi(clarity);
    drawPitchGraph(now);
    return;
  }

  const midi = hzToMidiFloat(frequency);
  const nearest = midiFloatToNearestNote(midi);

  const frame = {
    t: now,
    hz: frequency,
    midi,
    clarity,
    rms: level,
  };

  if (targetIndex >= 0) {
    tracker.ingest(frame);
    frame.hiddenDuringLive = !guidePattern[targetIndex];
    graphFrames.push(frame);
  }

  const cutoff = now - 30000;
  while (graphFrames.length && graphFrames[0].t < cutoff) graphFrames.shift();

  currentNoteEl.textContent = nearest.name;
  currentHzEl.textContent = `${frequency.toFixed(1)} Hz`;
  currentCentsEl.textContent = `${fmtSigned(nearest.cents)} c`;
  currentClarityEl.textContent = clarity.toFixed(2);
  trackerStateEl.textContent = tracker.state;

  drawPitchGraph(now);
}

function updateNoPitchUi(clarity = NaN) {
  currentNoteEl.textContent = "—";
  currentHzEl.textContent = "—";
  currentCentsEl.textContent = "—";
  currentClarityEl.textContent = Number.isFinite(clarity) ? clarity.toFixed(2) : "—";
  trackerStateEl.textContent = tracker?.state ?? "—";
}

async function cancelListeningSession() {
  if (appState !== "LISTENING") return;

  clearDemoTimers();
  clearBreathingTimers();
  clearFixedGuide();
  stoppingAutomatically = true;
  setAppState("CANCELLING");
  setCue("Tentativa cancelada", "Nenhuma avaliação será gerada.", "ESPAÇO");
  statusEl.textContent = "Sessão interrompida pelo teclado. A avaliação foi cancelada.";

  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }

  await teardownAnalysisAudio();
  setControlsLocked(false);
  setAppState("WAITING");
  stoppingAutomatically = false;
  currentNoteEl.textContent = "—";
  currentHzEl.textContent = "—";
  currentCentsEl.textContent = "—";
  currentClarityEl.textContent = "—";
  trackerStateEl.textContent = "CANCELADO";
  summaryEl.textContent = "Tentativa cancelada — nenhum resultado foi calculado.";
  resultsBody.innerHTML = "";
  extrasEl.textContent = "";
  setCue("Pressione ESPAÇO", "para iniciar uma nova tentativa", "ESPAÇO");
}

async function cancelPendingFlow() {
  if (!["PREPARING", "COUNTDOWN"].includes(appState)) return;
  clearDemoTimers();
  clearBreathingTimers();
  clearFixedGuide();
  setAppState("CANCELLING");
  await teardownAnalysisAudio();
  setControlsLocked(false);
  setAppState("WAITING");
  setCue("Pressione ESPAÇO", "para começar novamente", "ESPAÇO");
  statusEl.textContent = "Preparação cancelada.";
}
async function finishAnalysisAutomatically() {
  if (stoppingAutomatically || appState !== "LISTENING") return;
  stoppingAutomatically = true;
  clearDemoTimers();
  if (fixedGuide) {
    fixedGuide.finished = true;
    fixedGuide.targetIndex = -1;
  }
  graphCountdownLabel = null;
  graphCountdownCaption = "";
  try { guideInstrument?.stop(); } catch {}
  setAppState("EVALUATING");
  setCue("Analisando…", "Organizando as notas e calculando os desvios em cents.", "···");
  statusEl.textContent = "Roteiro encerrado. Avaliando automaticamente, inclusive as notas não identificadas…";

  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }

  const segments = tracker?.flush() ?? [];
  await teardownAnalysisAudio();
  renderEvaluation(segments);
  setControlsLocked(false);
  setAppState("DONE");
  setCue("Análise concluída", "Pressione ESPAÇO para repetir o exercício.", "ESPAÇO");
  statusEl.textContent = `Avaliação concluída com ${segments.length} segmento(s) estável(is).`;

  requestAnimationFrame(() => {
    evaluationSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function teardownAnalysisAudio() {
  if (analysisTimer) {
    clearInterval(analysisTimer);
    analysisTimer = null;
  }

  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop();
  }

  if (preparedMediaStream) {
    for (const track of preparedMediaStream.getTracks()) track.stop();
  }

  if (audioContext && audioContext.state !== "closed") {
    await audioContext.close();
  }

  mediaStream = null;
  preparedMediaStream = null;
  audioContext = null;
  sourceNode = null;
  analyserNode = null;
  detector = null;
  audioBuffer = null;
}

// ------------------------------------------------------------
// RELATÓRIO
// ------------------------------------------------------------
function globalGrade(score) {
  if (score >= 90) return "Excelente";
  if (score >= 75) return "Boa";
  if (score >= 60) return "Atenção";
  return "Refazer";
}

function renderGlobalScore(rows = []) {
  const total = expectedNotes.length;
  const reliable = rows.filter(result => result && result.confidence.rank > 0);
  const coverage = total ? reliable.length / total : 0;
  const meanBias = reliable.length ? mean(reliable.map(result => Math.abs(result.bias))) : 100;
  const meanStability = reliable.length ? mean(reliable.map(result => result.sigma)) : 60;
  const intonationPoints = total
    ? Array.from({ length: total }, (_, index) => {
        const result = rows[index];
        return result && result.confidence.rank > 0
          ? Math.max(0, 100 - Math.abs(result.bias) * 1.25)
          : 0;
      }).reduce((sum, value) => sum + value, 0) / total
    : 0;
  const stabilityPoints = total
    ? Array.from({ length: total }, (_, index) => {
        const result = rows[index];
        return result && result.confidence.rank > 0
          ? Math.max(0, 100 - result.sigma * 1.8)
          : 0;
      }).reduce((sum, value) => sum + value, 0) / total
    : 0;
  const score = Math.round(intonationPoints * 0.70 + stabilityPoints * 0.15 + coverage * 100 * 0.15);
  const label = globalGrade(score);

  globalScoreEl.hidden = false;
  globalScoreEl.innerHTML = `
    <div class="score-number">${score}<small>/100</small></div>
    <div>
      <div class="score-label">Avaliação global: ${label}</div>
      <div class="score-detail">Afinação 70% · estabilidade 15% · conclusão 15%. ${reliable.length}/${total} notas com confiança suficiente; cada nota não detectada recebe zero.</div>
    </div>`;
  return { score, label, coverage, meanBias, meanStability };
}

function renderEvaluation(segments) {
  resultsBody.innerHTML = "";
  extrasEl.textContent = "";

  if (!segments.length) {
    summaryEl.innerHTML = "Não encontrei segmentos vocais estáveis suficientes. Tente cantar mais perto do microfone ou diminuir levemente os limiares de RMS/clareza.";
    renderGlobalScore([]);
    reviewMode = true;
    evaluationOverlay = null;
    drawPitchGraph(graphFrames.at(-1)?.t ?? 0);
    resultActions.hidden = false;
    return;
  }

  const alignment = alignSegments(expectedNotes, segments);
  const rows = expectedNotes.map((expected, i) => {
    const segmentIndex = alignment.assignments[i];
    if (segmentIndex == null) return null;
    return analyzeMatchedSegment(segments[segmentIndex], expected);
  });
  renderGlobalScore(rows);

  // O “pior ponto” agora significa maior ERRO CENTRAL de afinação com evidência
  // temporal suficiente. Instabilidade não transforma uma nota centrada em erro.
  let worstIndex = -1;
  let worstAbsBias = -Infinity;
  rows.forEach((result, i) => {
    if (!result || result.confidence.rank === 0) return;
    const absBias = Math.abs(result.bias);
    if (absBias > worstAbsBias) {
      worstAbsBias = absBias;
      worstIndex = i;
    }
  });

  rows.forEach((result, i) => {
    const tr = document.createElement("tr");
    if (i === worstIndex) tr.classList.add("worst");

    const expected = expectedNotes[i];
    const grade = gradeTuning(result);

    if (!result) {
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${expected.label}</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td><span class="badge ${grade.className}">${grade.label}</span></td>
      `;
      resultsBody.appendChild(tr);
      return;
    }

    const { segment } = result;
    const detectedNearest = midiFloatToNearestNote(segment.centerMidi);
    const transitionMs = segment.transitionFromPrevious?.durationMs;
    const stability = gradeStability(result);

    tr.innerHTML = `
      <td>${i + 1}${i === worstIndex ? " ⚠" : ""}</td>
      <td>${expected.label}</td>
      <td>${detectedNearest.name} (${fmtSigned(result.bias)} c)</td>
      <td>${Math.round(result.analyzedDurationMs)} ms</td>
      <td>${fmtSigned(result.bias)} c</td>
      <td>${result.mae.toFixed(1)} c</td>
      <td>${result.p90.toFixed(1)} c</td>
      <td><span class="stability ${stability.className}">${stability.label}</span> <small>σ ${result.sigma.toFixed(1)} c</small></td>
      <td>${formatTransitionMs(transitionMs)}</td>
      <td><span class="confidence ${result.confidence.className}">${result.confidence.label}</span></td>
      <td><span class="badge ${grade.className}">${grade.label}</span></td>
    `;

    resultsBody.appendChild(tr);
  });

  const matchedReliable = rows.filter((r) => r && r.confidence.rank > 0);
  const overallBiasAbs = matchedReliable.length
    ? mean(matchedReliable.map((r) => Math.abs(r.bias)))
    : NaN;
  const totalAnalyzedMs = matchedReliable.reduce((sum, r) => sum + r.analyzedDurationMs, 0);
  const worst = worstIndex >= 0 ? rows[worstIndex] : null;

  if (worst) {
    const direction = worst.bias < 0 ? "abaixo" : "acima";
    const semitones = Math.abs(worst.bias) / 100;
    const severity = gradeTuning(worst);
    const nearSemitone = semitones >= 0.70
      ? ` Isso corresponde a aproximadamente <strong>${semitones.toFixed(2)} semitom</strong>.`
      : "";

    summaryEl.innerHTML = `
      <div class="problem-title">Principal ponto de afinação: ${worst.expected.label}, posição ${worstIndex + 1}</div>
      <div>
        Centro sustentado em <strong>${Math.abs(worst.bias).toFixed(1)} cents ${direction}</strong>
        do alvo, durante cerca de <strong>${Math.round(worst.analyzedDurationMs)} ms</strong> analisados.${nearSemitone}
        Classificação: <strong>${severity.label}</strong>.
      </div>
      <div class="summary-secondary">
        Média do erro central absoluto nas notas com confiança suficiente:
        <strong>${overallBiasAbs.toFixed(1)} cents</strong>. Tempo útil analisado:
        <strong>${(totalAnalyzedMs / 1000).toFixed(2)} s</strong>.
        P90 e σ continuam visíveis para diagnóstico, mas não tornam sozinhos uma nota “errada”.
      </div>
    `;
  } else {
    summaryEl.innerHTML = `<strong>Não houve duração suficiente para apontar um erro principal com confiança.</strong>`;
  }

  if (alignment.extras.length) {
    const labels = alignment.extras.map((j) => {
      const s = segments[j];
      const n = midiFloatToNearestNote(s.centerMidi);
      return `${n.name} (${Math.round(s.durationMs)} ms)`;
    });
    extrasEl.textContent = `Segmentos extras ignorados no alinhamento: ${labels.join(", ")}.`;
  } else {
    extrasEl.textContent = `Outliers/transientes rejeitados durante a captura: ${tracker.outlierCount}.`;
  }

  // No modo de revisão, todo o exercício fica visível. O traço permanece azul e
  // somente o principal problema de afinação recebe destaque vermelho.
  reviewMode = true;
  evaluationOverlay = { rows, worstIndex };
  drawPitchGraph(graphFrames.at(-1)?.t ?? 0);
  resultActions.hidden = false;
}

// ------------------------------------------------------------
// GRÁFICO
// ------------------------------------------------------------
function graphGuideSegments(nowMs) {
  const noteMs = fixedGuide?.noteMs ?? currentNoteDurationMs();
  const leadMs = fixedGuide?.leadMs ?? fixedGuideLeadMs(noteMs);
  const currentIndex = fixedTargetIndexAt(nowMs);
  return expectedNotes.map((_, index) => ({
    index,
    startT: leadMs + index * noteMs,
    endT: leadMs + (index + 1) * noteMs,
    live: index === currentIndex,
    future: nowMs < leadMs + index * noteMs,
  }));
}

function updateGraphGuideReadout(nowMs) {
  if (!graphNowEl || !graphNextEl) return;
  if (reviewMode) {
    graphNowEl.textContent = "Relatório completo";
    graphNextEl.textContent = "Inclui roteiro, canto detectado e ataques fantasmas.";
    return;
  }
  if (graphCountdownLabel != null) {
    graphNowEl.textContent = `Contagem: ${graphCountdownLabel}`;
    graphNextEl.textContent = graphCountdownCaption || "Prepare a entrada";
    return;
  }

  const state = fixedGuide;
  if (state?.finished) {
    graphNowEl.textContent = "Roteiro concluído";
    graphNextEl.textContent = "A avaliação será exibida automaticamente.";
    return;
  }

  const currentIndex = fixedTargetIndexAt(nowMs);
  if (state && currentIndex >= 0 && expectedNotes[currentIndex]) {
    const currentGhost = !guidePattern[currentIndex];
    graphNowEl.textContent = currentGhost
      ? `Agora: ${expectedNotes[currentIndex].label} · ataque fantasma`
      : `Agora: ${expectedNotes[currentIndex].label}`;
    const remainingMs = Math.max(0, fixedTargetStartT(currentIndex + 1) - nowMs);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= expectedNotes.length) {
      graphNextEl.textContent = `Fim previsto em ${(remainingMs / 1000).toFixed(1)} s`;
    } else {
      const nextLabel = guidePattern[nextIndex]
        ? expectedNotes[nextIndex].label
        : `${expectedNotes[nextIndex].label} · fantasma`;
      graphNextEl.textContent = `Próxima: ${nextLabel} · troca em ${(remainingMs / 1000).toFixed(1)} s`;
    }
    return;
  }

  graphNowEl.textContent = "Agora: aguardando";
  graphNextEl.textContent = "O contador e o próximo alvo aparecerão aqui.";
}

function drawPitchGraph(nowMs = 0) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;

  if (canvas.width !== Math.round(cssWidth * dpr) || canvas.height !== Math.round(cssHeight * dpr)) {
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  ctx.fillStyle = "#0c1115";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  updateGraphGuideReadout(nowMs);
  if (!expectedNotes.length) return;

  const expectedMidis = expectedNotes.map((n) => n.midi);
  const minMidi = Math.min(...expectedMidis) - 2;
  const maxMidi = Math.max(...expectedMidis) + 2;

  let leftT;
  let rightT;
  if (reviewMode) {
    const guideSegments = graphGuideSegments(nowMs);
    const historyStart = guideSegments[0]?.startT ?? 0;
    const historyEnd = guideSegments.at(-1)?.endT ?? 0;
    const contentStart = graphFrames[0]?.t ?? historyStart;
    const contentEnd = graphFrames.at(-1)?.t ?? historyEnd;
    leftT = Math.min(contentStart, historyStart) - 80;
    rightT = Math.max(leftT + 1000, contentEnd, historyEnd) + 80;
  } else {
    const windowMs = CONFIG.graphWindowSeconds * 1000;
    leftT = nowMs - windowMs * 0.62;
    rightT = nowMs + windowMs * 0.38;
  }

  const xFor = (t) => ((t - leftT) / (rightT - leftT)) * cssWidth;
  const yFor = (midi) => cssHeight - ((midi - minMidi) / (maxMidi - minMidi)) * cssHeight;

  // O alvo escrito permanece visível também nos ataques fantasmas: a ausência
  // de ajuda é auditiva e corretiva, não a remoção da "partitura" esperada.
  const uniqueMidis = [...new Set(expectedNotes.map(note => note.midi))];
  ctx.font = "12px system-ui";
  uniqueMidis.forEach((midi) => {
    const y = yFor(midi);
    ctx.strokeStyle = "#26343f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cssWidth, y);
    ctx.stroke();

    ctx.fillStyle = "#748593";
    ctx.fillText(midiFloatToNearestNote(midi).name, 8, Math.max(13, y - 4));
  });

  // Roteiro esperado, sempre preso à grade do metrônomo.
  ctx.lineCap = "round";
  graphGuideSegments(nowMs).forEach(segment => {
    const x0 = xFor(segment.startT);
    const x1 = xFor(segment.endT);
    if (x1 < 0 || x0 > cssWidth) return;
    const currentTarget = segment.live;
    ctx.strokeStyle = currentTarget
      ? "#ff4f5f"
      : (segment.future ? "rgba(255, 48, 64, 0.58)" : "rgba(255, 48, 64, 0.88)");
    ctx.lineWidth = currentTarget ? 6 : 4;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, x0), yFor(expectedNotes[segment.index].midi));
    ctx.lineTo(Math.min(cssWidth, x1), yFor(expectedNotes[segment.index].midi));
    ctx.stroke();
  });
  ctx.lineCap = "butt";

  const visible = graphFrames.filter(frame =>
    frame.t >= leftT &&
    frame.t <= rightT &&
    (reviewMode || !frame.hiddenDuringLive)
  );
  if (visible.length >= 2) {
    // Traço geral: neutro/azul. Não pinta toda a execução de vermelho.
    ctx.strokeStyle = "#76c7ff";
    ctx.lineWidth = 2;
    ctx.beginPath();

    let started = false;
    let prevT = null;
    for (const frame of visible) {
      const x = xFor(frame.t);
      const y = yFor(frame.midi);

      if (!started || (prevT != null && frame.t - prevT > 120)) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
      prevT = frame.t;
    }
    ctx.stroke();
  }

  const currentIndex = fixedTargetIndexAt(nowMs);
  if (!reviewMode && appState === "LISTENING" && fixedGuide && !fixedGuide.finished && currentIndex >= 0) {
    const xNow = xFor(nowMs);
    const ghostTarget = !guidePattern[currentIndex];
    ctx.strokeStyle = "#22c76a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xNow, 0);
    ctx.lineTo(xNow, cssHeight);
    ctx.stroke();

    const yNow = yFor(expectedNotes[currentIndex].midi);
    ctx.fillStyle = "#22c76a";
    ctx.beginPath();
    ctx.arc(xNow, yNow, 13, 0, Math.PI * 2);
    ctx.fill();

    const remainingMs = Math.max(0, fixedTargetStartT(currentIndex + 1) - nowMs);
    const currentLabel = ghostTarget
      ? `${expectedNotes[currentIndex].label} · FANTASMA`
      : expectedNotes[currentIndex].label;
    const badgeX = Math.min(cssWidth - 168, xNow + 12);
    ctx.fillStyle = "rgba(9, 25, 18, 0.92)";
    ctx.fillRect(badgeX, 10, 156, 47);
    ctx.fillStyle = "#80efae";
    ctx.font = "700 13px system-ui";
    ctx.fillText(`AGORA · ${currentLabel}`, badgeX + 9, 29);
    ctx.fillStyle = "#c4d2ca";
    ctx.font = "12px system-ui";
    ctx.fillText(`troca em ${(remainingMs / 1000).toFixed(1)} s`, badgeX + 9, 47);
  }

  if (!reviewMode && graphCountdownLabel != null) {
    const centerX = cssWidth * 0.62;
    const centerY = cssHeight * 0.50;
    ctx.fillStyle = "rgba(8, 18, 14, 0.86)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#22c76a";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = "#b9f7d1";
    ctx.font = "700 42px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(graphCountdownLabel), centerX, centerY - 4);
    ctx.font = "12px system-ui";
    ctx.fillStyle = "#d0ded6";
    ctx.fillText(graphCountdownCaption, centerX, centerY + 35);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  // Depois da avaliação, destaca SOMENTE o principal erro sustentado.
  const worst = evaluationOverlay?.worstIndex >= 0
    ? evaluationOverlay.rows[evaluationOverlay.worstIndex]
    : null;

  if (reviewMode && worst) {
    const startT = worst.coreSamples[0]?.t ?? worst.segment.startT;
    const endT = worst.coreSamples.at(-1)?.t ?? worst.segment.endT;
    const badFrames = visible.filter((f) => f.t >= startT && f.t <= endT);

    if (badFrames.length) {
      const x0 = xFor(startT);
      const x1 = xFor(endT);

      ctx.fillStyle = "rgba(255, 179, 71, 0.10)";
      ctx.fillRect(x0, 0, Math.max(2, x1 - x0), cssHeight);

      ctx.strokeStyle = "#ffb347";
      ctx.lineWidth = 4;
      ctx.beginPath();
      badFrames.forEach((frame, index) => {
        const x = xFor(frame.t);
        const y = yFor(frame.midi);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const label = `${worst.expected.label}: ${fmtSigned(worst.bias)} cents`;
      const labelX = Math.min(Math.max(x0 + 8, 8), cssWidth - 165);
      const labelY = 22;
      ctx.font = "bold 12px system-ui";
      ctx.fillStyle = "#ffd59a";
      ctx.fillText(label, labelX, labelY);
    }
  }
}

// ------------------------------------------------------------
// UI
// ------------------------------------------------------------
async function stopCurrentActivity() {
  clearDemoTimers();
  clearBreathingTimers();
  clearFixedGuide();
  await teardownAnalysisAudio();
  stoppingAutomatically = false;
}

async function applyIntegrationConfig(config) {
  if (!config || !config.trainingKey) return;
  await stopCurrentActivity();
  integrationConfig = config;

  const vocalNotes = Array.isArray(config.vocalNotes) ? config.vocalNotes.filter(Boolean) : [];
  const guideNotes = Array.isArray(config.guideNotes) ? config.guideNotes : vocalNotes;
  exerciseInput.value = vocalNotes.join(" ");
  bpmInput.value = String(clampNumber(config.bpm, 40, 180, 80));
  subdivisionSelect.value = String(clampNumber(config.subdivision, 1, 4, 1));
  instrumentSelect.value = config.instrument || "acoustic_guitar_nylon";
  noteDurationInput.value = String(currentNoteDurationMs());
  guidePattern = parseGuidePattern(guideNotes);

  trainerTitleEl.textContent = `${config.exerciseName} · ${config.trainingTitle}`;
  trainerContextEl.textContent = config.objective || "Treino guiado a partir do trecho selecionado na aula.";
  vocalSequenceEl.textContent = config.mode === "breathing" ? "Sem alvo de afinação" : (vocalNotes.join(" ") || "—");
  const guided = config.guided !== false;
  guideSequenceEl.textContent = config.mode === "breathing"
    ? (guided ? `Metrônomo contínuo a ${bpmInput.value} bpm` : "Somente quatro batidas de entrada")
    : `${guided ? "Simultâneo" : "Só nota inicial"}: ${guideNotes.map(note => note || "—").join(" ") || "sem referência"}`;
  const shift = Number(config.transpose) || 0;
  transposeDisplayEl.textContent = `${shift > 0 ? "+" : ""}${shift} ${Math.abs(shift) === 1 ? "semitom" : "semitons"}`;
  tempoDisplayEl.textContent = `${bpmInput.value} bpm · ${subdivisionSelect.value} nota(s)/pulso`;

  const breathing = config.mode === "breathing";
  document.body.classList.toggle("breathing-mode", breathing);
  breathingSection.hidden = !breathing;
  breathingTimerEl.textContent = formatClock(config.breathingDurationSec || 30);
  startButton.textContent = breathing ? "Iniciar treino cronometrado" : "Iniciar avaliação";

  initializeUi();
  renderDemoNotes(-1);
  statusEl.textContent = "Configuração recebida. Início automático em instantes.";
  setCue("Preparando", "O treino começa sozinho com quatro batidas rápidas.", "4");
  const receivedConfig = integrationConfig;
  setTimeout(() => {
    if (integrationConfig === receivedConfig && appState === "WAITING") startDemoFlow();
  }, 40);
}

function initializeUi() {
  resultsBody.innerHTML = "";
  extrasEl.textContent = "";
  summaryEl.textContent = "Nenhuma análise concluída.";
  graphFrames = [];
  expectedNotes = [];
  reviewMode = false;
  evaluationOverlay = null;
  currentNoteEl.textContent = "—";
  currentHzEl.textContent = "—";
  currentCentsEl.textContent = "—";
  currentClarityEl.textContent = "—";
  trackerStateEl.textContent = "—";
  statusEl.textContent = integrationConfig ? "Preparando início automático." : "Aguardando configuração da aula.";
  setControlsLocked(false);
  setAppState("WAITING");
  setCue("Preparando", "O treino inicia automaticamente ao abrir.", "4");
  drawPitchGraph(0);
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

window.addEventListener("pointerdown", () => {
  if (needsActivationRetry && integrationConfig && appState === "WAITING") {
    needsActivationRetry = false;
    setTimeout(() => startDemoFlow(), 0);
  }
}, { capture: true });

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || isTypingTarget(event.target)) return;
  if (!integrationConfig) return;
  event.preventDefault();

  if (["WAITING", "DONE"].includes(appState)) {
    startDemoFlow();
  } else if (appState === "LISTENING") {
    // Durante o canto, ESPAÇO é um cancelamento explícito: para o microfone e
    // NÃO chama a rotina de avaliação.
    cancelListeningSession();
  } else if (["PREPARING", "COUNTDOWN"].includes(appState)) {
    cancelPendingFlow();
  }
});

window.addEventListener("resize", () => drawPitchGraph(graphFrames.at(-1)?.t ?? 0));
window.addEventListener("beforeunload", () => {
  clearDemoTimers();
  clearBreathingTimers();
  try { guideInstrument?.stop(); } catch {}
  try { guideInstrument?.dispose(); } catch {}
  if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop());
  if (preparedMediaStream) preparedMediaStream.getTracks().forEach((t) => t.stop());
});

startButton.addEventListener("click", () => startDemoFlow());

retryBtn.addEventListener("click", async () => {
  if (!integrationConfig) return;
  const config = integrationConfig;
  await applyIntegrationConfig(config);
});

completeBtn.addEventListener("click", () => {
  if (appState !== "DONE" || !integrationConfig) return;
  postHostMessage({
    type: "vocal-trainer-complete",
    trainingKey: integrationConfig.trainingKey,
  });
  if (window.opener) setTimeout(() => window.close(), 80);
});

function requestClose() {
  postHostMessage({ type: "vocal-trainer-close" });
  if (window.opener) window.close();
}

resultCloseBtn.addEventListener("click", requestClose);

bpmInput.addEventListener("change", () => {
  bpmInput.value = String(Math.round(clampNumber(bpmInput.value, 40, 180, 80)));
  noteDurationInput.value = String(currentNoteDurationMs());
});

subdivisionSelect.addEventListener("change", () => {
  noteDurationInput.value = String(currentNoteDurationMs());
});

window.addEventListener("message", async event => {
  const message = event.data || {};
  if (event.source !== window.parent) return;
  if (message.type === "vocal-trainer-config") {
    await applyIntegrationConfig(message.config);
  } else if (message.type === "vocal-trainer-stop") {
    await stopCurrentActivity();
    integrationConfig = null;
    setAppState("WAITING");
  }
});

initializeUi();
postHostMessage({ type: "vocal-trainer-ready" });

const hashParams = new URLSearchParams(window.location.hash.slice(1));
const hashConfig = hashParams.get("config");
if (hashConfig) {
  try {
    let parsed;
    try { parsed = JSON.parse(hashConfig); }
    catch (_) { parsed = JSON.parse(decodeURIComponent(hashConfig)); }
    await applyIntegrationConfig(parsed);
  } catch (error) {
    statusEl.textContent = `Configuração local inválida: ${error.message}`;
  }
}
})().catch(error => {
  console.error("Falha ao inicializar o treino assistido:", error);
  const status = document.getElementById("status");
  if (status) status.textContent = `Não foi possível carregar o afinador: ${error.message}`;
});
