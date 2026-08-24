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

  // Fluxo automático do exercício. O encerramento é mais rápido quando a
  // última nota provavelmente já foi alcançada; caso contrário, há uma
  // tolerância maior para pausas respiratórias ocasionais.
  // Parada automática inteligente. O tempo de silêncio depende não só do
  // número de notas detectadas, mas também de quão bem a execução está
  // seguindo o roteiro esperado. Se a pessoa está no caminho certo, uma
  // respiração recebe bastante tolerância. Se a execução se perdeu claramente
  // e fica em silêncio, o encerramento é mais rápido. Ao chegar à última nota,
  // continuamos encerrando rapidamente.
  autoStopFinalSilenceFactor: 0.85,
  minFinalSilenceMs: 750,
  maxFinalSilenceMs: 1500,

  onRouteEarlySilenceFactor: 8.0,
  onRouteMidSilenceFactor: 7.0,
  onRouteLateSilenceFactor: 5.0,
  minOnRouteEarlySilenceMs: 6500,
  maxOnRouteEarlySilenceMs: 10000,
  minOnRouteMidSilenceMs: 5500,
  maxOnRouteMidSilenceMs: 9000,
  minOnRouteLateSilenceMs: 4200,
  maxOnRouteLateSilenceMs: 7000,

  uncertainSilenceFactor: 5.0,
  minUncertainSilenceMs: 4000,
  maxUncertainSilenceMs: 7000,

  offRouteSilenceFactor: 3.2,
  minOffRouteSilenceMs: 2800,
  maxOffRouteSilenceMs: 5000,

  // O roteiro é considerado coerente mesmo com pequenos erros de afinação.
  // Um semitom errado ainda pode pertencer à sequência; "fora do roteiro"
  // exige um afastamento maior e/ou várias regiões sem correspondência.
  routeMatchCents: 135,
  routeStrongOffCents: 230,
  routeLookAhead: 3,

  preSingCountdownStepMs: 360,
  preSingGuideDurationMs: 420,
  preSingGuideGapMs: 220,
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
let demoRunId = 0;

let appState = "WAITING"; // WAITING | PREPARING | DEMO | COUNTDOWN | LISTENING | CANCELLING | EVALUATING | DONE
let voiceStarted = false;
let lastVoicedT = null;
let stoppingAutomatically = false;
let integrationConfig = null;
let guidePattern = [];
let adaptiveGuide = null;
let guideTimeline = [];
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

function clearAdaptiveGuide() {
  adaptiveGuide = null;
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
  guideTimeline = [];
  graphCountdownLabel = null;
  graphCountdownCaption = "";
  tracker = null;
  reviewMode = false;
  evaluationOverlay = null;
  voiceStarted = false;
  lastVoicedT = null;
  stoppingAutomatically = false;
  adaptiveGuide = null;
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
  if (appState === "LISTENING") startAdaptiveGuide();
}

function adaptiveSlotTiming(index, voicedMs, elapsedMs, firstVoiceOffsetMs) {
  const noteMs = currentNoteDurationMs();
  const silenceRatio = voicedMs / Math.max(1, elapsedMs);
  const lateFirstAttack = index === 0 &&
    (firstVoiceOffsetMs == null || firstVoiceOffsetMs >= noteMs * 0.45);
  const mostlySilent = silenceRatio < 0.22 || lateFirstAttack;
  const extraMs = index === 0
    ? Math.max(2000, noteMs * 1.8)
    : (mostlySilent ? Math.max(800, noteMs * 0.85) : Math.max(500, noteMs * 0.55));
  return { noteMs, extraMs, mostlySilent };
}

function adaptiveGuideLeadMs() {
  const noteMs = adaptiveGuide?.noteMs ?? currentNoteDurationMs();
  return Math.min(220, Math.max(100, noteMs * 0.18));
}

function playAdaptiveTarget(index) {
  if (!adaptiveGuide || integrationConfig?.guided === false) return false;
  const reference = guidePattern[index];
  if (!reference || !guideInstrument) return false;
  try {
    guideInstrument.start({
      note: reference.midi,
      // Uma única emissão longa por posição. Ela é interrompida somente na
      // antecipação/entrada da próxima nota, nunca repetida enquanto aguardamos.
      duration: Math.max(2.2, adaptiveGuide.noteMs / 1000 * 3.2),
      velocity: 127,
    });
    adaptiveGuide.soundingIndex = index;
    return true;
  } catch {
    return false;
  }
}

function cueNextAdaptiveTarget(now) {
  const state = adaptiveGuide;
  if (!state || state.finished || integrationConfig?.guided === false) return;
  const nextIndex = state.index + 1;
  if (nextIndex >= expectedNotes.length || state.preCuedIndex === nextIndex) return;

  state.preCuedIndex = nextIndex;
  state.preCuedAtT = now;
  try { guideInstrument?.stop(); } catch {}
  state.soundingIndex = null;
  // Referência nula significa desafio: a antecipação é deliberadamente muda.
  playAdaptiveTarget(nextIndex);
}

function beginAdaptiveSlot(index, now) {
  if (!adaptiveGuide || index >= expectedNotes.length) return;
  const state = adaptiveGuide;
  const alreadyCued = state.preCuedIndex === index;
  const anticipatedAtT = alreadyCued ? state.preCuedAtT : null;

  state.index = index;
  state.slotStartT = now;
  state.slotGuideStartT = anticipatedAtT ?? now;
  state.lastUpdateT = now;
  state.voicedMs = 0;
  state.matchedMs = 0;
  state.closeMs = 0;
  state.firstVoiceOffsetMs = null;
  state.firstStableCaptureMs = 0;
  state.firstCaptureArmed = index !== 0;
  state.nextCandidateMs = 0;
  state.nextCandidateStartedT = null;
  state.projectedAdvanceT = now + state.noteMs;
  state.preCuedIndex = null;
  state.preCuedAtT = null;

  if (!alreadyCued) {
    try { guideInstrument?.stop(); } catch {}
    state.soundingIndex = null;
    playAdaptiveTarget(index);
  }
  renderDemoNotes(index);

  const target = expectedNotes[index];
  const reference = guidePattern[index];
  const guided = integrationConfig?.guided !== false;
  if (guided && reference) {
    setCue("CANTE", `Ajuste sua voz ao instrumento em ${target.label}.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Referência contínua, sem novos ataques enquanto o sistema aguarda.`;
  } else if (guided) {
    setCue("DESAFIO", `Cante ${target.label} sem referência auditiva.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Ataque mudo de progressão; o sistema continua ouvindo e avaliando.`;
  } else {
    setCue("CANTE", `Siga o pulso memorizado em ${target.label}.`, target.label);
    statusEl.textContent = `Alvo ${index + 1}/${expectedNotes.length}: ${target.label}. Guia contínuo desativado.`;
  }
}

function startAdaptiveGuide() {
  adaptiveGuide = {
    index: 0,
    noteMs: currentNoteDurationMs(),
    slotStartT: 0,
    lastUpdateT: 0,
    voicedMs: 0,
    matchedMs: 0,
    closeMs: 0,
    firstVoiceOffsetMs: null,
    firstStableCaptureMs: 0,
    firstCaptureArmed: false,
    nextCandidateMs: 0,
    nextCandidateStartedT: null,
    projectedAdvanceT: 0,
    slotGuideStartT: 0,
    soundingIndex: null,
    preCuedIndex: null,
    preCuedAtT: null,
    missedIndexes: new Set(),
    finished: false,
    finishedAtT: null,
  };
  beginAdaptiveSlot(0, 0);
  demoTimers.push(setTimeout(() => {
    if (appState !== "LISTENING") return;
    graphCountdownLabel = null;
    graphCountdownCaption = "";
    drawPitchGraph(Math.max(0, performance.now() - sessionStartMs));
  }, CONFIG.quickCountInMs));
}

function advanceAdaptiveSlot(now, missed = false, transition = null) {
  if (!adaptiveGuide || adaptiveGuide.finished) return;
  const state = adaptiveGuide;
  const effectiveT = Math.min(
    now,
    Math.max(state.slotStartT + CONFIG.analysisEveryMs, transition?.effectiveT ?? now),
  );
  if (missed) state.missedIndexes.add(state.index);
  guideTimeline.push({
    index: state.index,
    startT: state.slotStartT,
    endT: effectiveT,
    guideStartT: state.slotGuideStartT,
    guideEndT: state.preCuedAtT ?? effectiveT,
    missed,
  });
  const nextIndex = state.index + 1;
  if (nextIndex < expectedNotes.length) {
    beginAdaptiveSlot(nextIndex, now);
    if (transition?.carryNextMs > 0) {
      state.slotStartT = effectiveT;
      state.lastUpdateT = now;
      state.voicedMs = transition.carryNextMs;
      state.matchedMs = transition.carryNextMs;
      state.closeMs = transition.carryNextMs;
      state.firstVoiceOffsetMs = 0;
      state.projectedAdvanceT = Math.max(now, effectiveT + state.noteMs);
      statusEl.textContent += " A entrada antecipada na próxima nota foi reconhecida.";
    }
    return;
  }

  try { guideInstrument?.stop(); } catch {}
  state.soundingIndex = null;
  state.finished = true;
  state.finishedAtT = now;
  renderDemoNotes(-1);
  setCue("ROTEIRO CONCLUÍDO", "Finalize a última emissão; a avaliação abrirá automaticamente.", "✓");
  statusEl.textContent = "Todas as posições do roteiro foram percorridas. Aguardando o fim da voz.";
}

function updateAdaptiveGuide(now, midi = null, isVoiced = false, rmsLevel = 0) {
  if (!adaptiveGuide || adaptiveGuide.finished || !expectedNotes.length) {
    return { ignoreForTracker: false };
  }

  const state = adaptiveGuide;
  const elapsedMs = Math.max(0, now - state.slotStartT);
  const dt = Math.min(CONFIG.analysisEveryMs * 3, Math.max(0, now - state.lastUpdateT));
  state.lastUpdateT = now;

  const currentTarget = expectedNotes[state.index];
  const nextTarget = expectedNotes[state.index + 1] ?? null;
  const currentErrorCents = isVoiced && Number.isFinite(midi)
    ? Math.abs((midi - currentTarget.midi) * 100)
    : Infinity;
  const nextErrorCents = isVoiced && Number.isFinite(midi) && nextTarget
    ? Math.abs((midi - nextTarget.midi) * 100)
    : Infinity;
  const requiredMs = state.index === 0
    ? Math.min(1100, Math.max(320, state.noteMs * 0.90))
    : Math.min(850, Math.max(220, state.noteMs * 0.78));
  const exactAnchorRatio = state.index === 0 ? 0.45 : 0.30;

  if (isVoiced && Number.isFinite(midi)) {
    if (state.firstVoiceOffsetMs == null) state.firstVoiceOffsetMs = elapsedMs;
    state.voicedMs += dt;

    // A primeira nota só passa ao rastreador depois de uma pequena região
    // coerente. Scoops, ataques e tentativas iniciais continuam visíveis em azul,
    // mas não contaminam a avaliação por segmentos.
    if (state.index === 0 && !state.firstCaptureArmed) {
      if (currentErrorCents <= CONFIG.routeMatchCents) {
        state.firstStableCaptureMs += dt;
      } else {
        state.firstStableCaptureMs = Math.max(0, state.firstStableCaptureMs - dt * 1.5);
      }
      const captureArmMs = Math.min(360, Math.max(200, state.noteMs * 0.28));
      if (state.firstStableCaptureMs >= captureArmMs) state.firstCaptureArmed = true;
    }

    const intervalToNextCents = nextTarget
      ? Math.abs((nextTarget.midi - currentTarget.midi) * 100)
      : 0;
    const currentEvidenceMs = Math.min(360, Math.max(170, state.noteMs * 0.25));
    const earliestTransitionMs = Math.min(550, Math.max(220, state.noteMs * 0.48));
    const hasCurrentEvidence =
      state.closeMs >= currentEvidenceMs ||
      state.matchedMs >= currentEvidenceMs * 0.70;
    const nextIsUnambiguous =
      nextTarget &&
      intervalToNextCents >= 80 &&
      nextErrorCents <= 60 &&
      nextErrorCents + 30 <= currentErrorCents;
    const strongEnoughVoice = rmsLevel >= CONFIG.minRms * 1.35;
    const candidateForNext =
      elapsedMs >= earliestTransitionMs &&
      hasCurrentEvidence &&
      nextIsUnambiguous &&
      strongEnoughVoice;

    if (candidateForNext) {
      if (state.nextCandidateStartedT == null) state.nextCandidateStartedT = Math.max(state.slotStartT, now - dt);
      state.nextCandidateMs += dt;
    } else {
      state.nextCandidateMs = 0;
      state.nextCandidateStartedT = null;
    }

    const nextConfirmationMs = Math.min(280, Math.max(160, state.noteMs * 0.24));
    if (state.nextCandidateMs >= nextConfirmationMs && state.nextCandidateStartedT != null) {
      const earlyStartT = state.nextCandidateStartedT;
      const carryNextMs = state.nextCandidateMs;
      advanceAdaptiveSlot(now, false, { effectiveT: earlyStartT, carryNextMs });
      return { ignoreForTracker: false, recognizedEarlyTransition: true };
    }

    // Quadros já reconhecidos como tentativa estável da próxima nota não são
    // acumulados como erro da posição atual durante a confirmação conservadora.
    if (!candidateForNext) {
      if (currentErrorCents <= 70) state.matchedMs += dt;
      if (currentErrorCents <= CONFIG.routeMatchCents) state.closeMs += dt;
    }
  } else {
    state.nextCandidateMs = Math.max(0, state.nextCandidateMs - dt * 1.5);
    if (state.nextCandidateMs === 0) state.nextCandidateStartedT = null;
  }

  const exactEnough = state.matchedMs >= requiredMs;
  const rhythmicallyClose =
    state.closeMs >= requiredMs &&
    state.voicedMs >= requiredMs &&
    state.matchedMs >= requiredMs * exactAnchorRatio;
  const nominalElapsed = elapsedMs >= state.noteMs;
  const ignoreForTracker = state.index === 0 && !state.firstCaptureArmed;

  const timing = adaptiveSlotTiming(state.index, state.voicedMs, elapsedMs, state.firstVoiceOffsetMs);
  const nominalEndT = state.slotStartT + state.noteMs;
  const deadlineT = nominalEndT + timing.extraMs;
  let projectedAdvanceT = deadlineT;

  if (exactEnough || rhythmicallyClose) {
    projectedAdvanceT = Math.max(now, nominalEndT);
  } else if (currentErrorCents <= 70) {
    projectedAdvanceT = Math.max(nominalEndT, now + Math.max(0, requiredMs - state.matchedMs));
  } else if (
    currentErrorCents <= CONFIG.routeMatchCents &&
    state.matchedMs >= requiredMs * exactAnchorRatio
  ) {
    const remainingCloseMs = Math.max(
      0,
      requiredMs - state.closeMs,
      requiredMs - state.voicedMs,
    );
    projectedAdvanceT = Math.max(nominalEndT, now + remainingCloseMs);
  }

  state.projectedAdvanceT = Math.max(now, projectedAdvanceT);
  if (state.index + 1 < expectedNotes.length && now >= state.projectedAdvanceT - adaptiveGuideLeadMs()) {
    cueNextAdaptiveTarget(now);
  }

  if (nominalElapsed && (exactEnough || rhythmicallyClose)) {
    advanceAdaptiveSlot(now, false);
    return { ignoreForTracker };
  }

  if (nominalElapsed && elapsedMs >= timing.noteMs + timing.extraMs) {
    advanceAdaptiveSlot(now, true);
    return { ignoreForTracker };
  }

  if (nominalElapsed && timing.mostlySilent) {
    const remaining = Math.max(0, timing.noteMs + timing.extraMs - elapsedMs);
    setCue("RESPIRE", `Ainda aguardando ${expectedNotes[state.index].label}; avanço em até ${(remaining / 1000).toFixed(1)} s.`, "…");
  }

  return { ignoreForTracker };
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
    voiceStarted = false;
    lastVoicedT = null;
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

  if (level < CONFIG.minRms) {
    tracker.noPitch(now);
    updateAdaptiveGuide(now, null, false);
    updateNoPitchUi();
    drawPitchGraph(now);
    checkAutomaticFinish(now);
    return;
  }

  const [frequency, clarity] = detector.findPitch(audioBuffer, audioContext.sampleRate);

  if (
    !Number.isFinite(frequency) ||
    frequency < CONFIG.minHz ||
    frequency > CONFIG.maxHz ||
    clarity < CONFIG.minClarity
  ) {
    tracker.noPitch(now);
    updateAdaptiveGuide(now, null, false);
    updateNoPitchUi(clarity);
    drawPitchGraph(now);
    checkAutomaticFinish(now);
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

  const guideDecision = updateAdaptiveGuide(now, midi, true, level);
  if (guideDecision.ignoreForTracker) tracker.noPitch(now);
  else tracker.ingest(frame);
  graphFrames.push(frame);
  voiceStarted = true;
  lastVoicedT = now;

  // Se estávamos mostrando uma mensagem de pausa, a retomada da voz devolve a
  // interface imediatamente ao estado normal de escuta.
  if (cueTitle.textContent === "Respire") {
    setCue("CANTE", "Acompanhando sua execução; ESPAÇO cancela sem avaliar.", "●");
    statusEl.textContent = "Ouvindo sua voz…";
  }

  const cutoff = now - 30000;
  while (graphFrames.length && graphFrames[0].t < cutoff) graphFrames.shift();

  currentNoteEl.textContent = nearest.name;
  currentHzEl.textContent = `${frequency.toFixed(1)} Hz`;
  currentCentsEl.textContent = `${fmtSigned(nearest.cents)} c`;
  currentClarityEl.textContent = clarity.toFixed(2);
  trackerStateEl.textContent = tracker.state;

  drawPitchGraph(now);
  checkAutomaticFinish(now);
}

function updateNoPitchUi(clarity = NaN) {
  currentNoteEl.textContent = "—";
  currentHzEl.textContent = "—";
  currentCentsEl.textContent = "—";
  currentClarityEl.textContent = Number.isFinite(clarity) ? clarity.toFixed(2) : "—";
  trackerStateEl.textContent = tracker?.state ?? "—";
}

function liveDetectedSegments() {
  if (!tracker) return [];

  const detected = tracker.segments.map((segment) => ({ ...segment }));

  // A região atual ainda não foi finalizada, mas já pode ser usada para saber
  // onde o cantor está no roteiro. Não alteramos o rastreador para fazer isso.
  if (tracker.current?.samples?.length >= CONFIG.minCoreSamples) {
    const startT = tracker.current.startT;
    const endT = tracker.current.lastT;
    const durationMs = Math.max(0, endT - startT);
    if (durationMs >= 100) {
      const centerMidi = robustCenterMidi(tracker.current.samples);
      detected.push({
        ...tracker.current,
        endT,
        durationMs,
        centerMidi,
        nearest: midiFloatToNearestNote(centerMidi),
        live: true,
      });
    }
  }

  return detected;
}

function assessLiveRoute() {
  const detected = liveDetectedSegments();
  const n = expectedNotes.length;

  if (!n || !detected.length) {
    return {
      detectedCount: detected.length,
      matchedCount: 0,
      progressIndex: -1,
      progress: 0,
      adherence: 0,
      medianError: Infinity,
      recentError: Infinity,
      onRoute: false,
      stronglyOffRoute: false,
      nearFinal: false,
      finalReached: false,
    };
  }

  let cursor = 0;
  let matchedCount = 0;
  let offRouteCount = 0;
  let progressIndex = -1;
  const errors = [];
  let recentError = Infinity;
  let recentMatchedIndex = -1;

  for (const segment of detected) {
    const center = segment.centerMidi ?? robustCenterMidi(segment.samples ?? []);
    if (!Number.isFinite(center)) continue;

    // Procuramos a melhor correspondência apenas em uma pequena janela à
    // frente. Isso preserva a ordem musical e evita que uma nota aleatória seja
    // "encaixada" muito adiante no exercício.
    const searchStart = Math.max(0, cursor - 1);
    const searchEnd = Math.min(n - 1, cursor + CONFIG.routeLookAhead);
    let bestIndex = -1;
    let bestError = Infinity;

    for (let i = searchStart; i <= searchEnd; i++) {
      const error = Math.abs(centsBetweenMidi(center, expectedNotes[i].midi));
      if (error < bestError) {
        bestError = error;
        bestIndex = i;
      }
    }

    recentError = bestError;
    recentMatchedIndex = bestIndex;

    if (bestIndex >= 0 && bestError <= CONFIG.routeMatchCents) {
      matchedCount++;
      errors.push(bestError);
      progressIndex = Math.max(progressIndex, bestIndex);

      // Só avançamos o cursor quando realmente chegamos à posição atual ou a
      // uma posição futura. Uma sustentação longa da mesma nota não deve pular
      // o exercício inteiro.
      if (bestIndex >= cursor) cursor = bestIndex + 1;
    } else {
      offRouteCount++;
    }
  }

  const adherence = detected.length ? matchedCount / detected.length : 0;
  const medianError = errors.length ? median(errors) : Infinity;
  const progress = progressIndex >= 0 ? (progressIndex + 1) / n : 0;

  // Consideramos "no roteiro" quando a maior parte das regiões tem explicação
  // musical na sequência esperada. Um erro de aproximadamente um semitom ainda
  // não destrói essa classificação; isso é importante para o app não encerrar
  // uma tentativa legítima só porque houve uma nota desafinada.
  const onRoute =
    matchedCount >= 1 &&
    adherence >= (detected.length <= 2 ? 0.5 : 0.60) &&
    medianError <= CONFIG.routeMatchCents;

  // "Muito fora" exige evidência forte: região recente a mais de ~2,3 semitons
  // de qualquer candidato próximo, ou uma sequência com pouca aderência e erro
  // recente grande. Isso serve para detectar tentativas abandonadas/reinícios.
  const stronglyOffRoute =
    recentError >= CONFIG.routeStrongOffCents ||
    (detected.length >= 2 && adherence < 0.40 && recentError > 170);

  const lastExpectedIndex = n - 1;
  const nearFinal = progressIndex >= Math.max(0, lastExpectedIndex - 1);
  const finalReached =
    progressIndex >= lastExpectedIndex &&
    recentMatchedIndex === lastExpectedIndex &&
    recentError <= Math.max(CONFIG.routeMatchCents, 160);

  return {
    detectedCount: detected.length,
    matchedCount,
    offRouteCount,
    progressIndex,
    progress,
    adherence,
    medianError,
    recentError,
    onRoute,
    stronglyOffRoute,
    nearFinal,
    finalReached,
  };
}

function likelyReachedFinalNote() {
  return assessLiveRoute().finalReached;
}

function boundedSilence(noteMs, factor, minMs, maxMs) {
  return Math.min(maxMs, Math.max(minMs, noteMs * factor));
}

function checkAutomaticFinish(now) {
  if (stoppingAutomatically) return;
  const noteMs = currentNoteDurationMs();

  if (!voiceStarted || lastVoicedT == null) {
    const abandonMs = Math.min(10000, Math.max(6500, noteMs * 6));
    const finishedWithoutVoice = adaptiveGuide?.finished &&
      now - adaptiveGuide.finishedAtT >= Math.min(1200, Math.max(750, noteMs * 0.8));
    if (finishedWithoutVoice || now >= abandonMs) {
      statusEl.textContent = "Nenhuma nota identificável foi recebida. Encerrando e registrando as posições como não detectadas.";
      finishAnalysisAutomatically();
    }
    return;
  }

  const silenceMs = now - lastVoicedT;
  if (adaptiveGuide?.finished) {
    const completedSilenceMs = boundedSilence(noteMs, 0.85, 750, 1500);
    if (silenceMs >= 500 && silenceMs < completedSilenceMs) {
      setCue("FINALIZE", "O roteiro terminou; aguardando o fim da última emissão.", "…");
    }
    if (silenceMs >= completedSilenceMs) finishAnalysisAutomatically();
    return;
  }

  const route = assessLiveRoute();

  const finalSilenceMs = boundedSilence(
    noteMs,
    CONFIG.autoStopFinalSilenceFactor,
    CONFIG.minFinalSilenceMs,
    CONFIG.maxFinalSilenceMs,
  );

  let threshold;
  let pauseMessage;

  if (route.finalReached) {
    // Última nota reconhecida: o silêncio provavelmente significa fim real.
    threshold = finalSilenceMs;
    pauseMessage = "Última nota reconhecida — concluindo quando o silêncio se confirmar…";
  } else if (route.onRoute) {
    // Aqui está a principal mudança da V5: se a pessoa está seguindo o roteiro,
    // silêncio intermediário é tratado como respiração, não como abandono.
    if (route.progress < 0.35) {
      threshold = boundedSilence(
        noteMs,
        CONFIG.onRouteEarlySilenceFactor,
        CONFIG.minOnRouteEarlySilenceMs,
        CONFIG.maxOnRouteEarlySilenceMs,
      );
    } else if (route.progress < 0.75) {
      threshold = boundedSilence(
        noteMs,
        CONFIG.onRouteMidSilenceFactor,
        CONFIG.minOnRouteMidSilenceMs,
        CONFIG.maxOnRouteMidSilenceMs,
      );
    } else {
      threshold = boundedSilence(
        noteMs,
        CONFIG.onRouteLateSilenceFactor,
        CONFIG.minOnRouteLateSilenceMs,
        CONFIG.maxOnRouteLateSilenceMs,
      );
    }
    pauseMessage = `Pausa para respirar — roteiro coerente (${Math.round(route.progress * 100)}%). Continuo aguardando…`;
  } else if (route.stronglyOffRoute) {
    // Se a última região ficou claramente fora do exercício e depois veio uma
    // pausa longa, é mais provável que a tentativa tenha sido abandonada.
    threshold = boundedSilence(
      noteMs,
      CONFIG.offRouteSilenceFactor,
      CONFIG.minOffRouteSilenceMs,
      CONFIG.maxOffRouteSilenceMs,
    );
    pauseMessage = "Pausa após trecho fora do roteiro — aguardando um pouco antes de encerrar…";
  } else {
    // Caso ambíguo: nem presumimos respiração longa, nem encerramos cedo.
    threshold = boundedSilence(
      noteMs,
      CONFIG.uncertainSilenceFactor,
      CONFIG.minUncertainSilenceMs,
      CONFIG.maxUncertainSilenceMs,
    );
    pauseMessage = "Pausa detectada — mantendo a sessão aberta…";
  }

  // O feedback aparece só depois de uma pausa perceptível, para não piscar a
  // interface a cada pequena lacuna entre fonemas.
  if (silenceMs >= 550 && silenceMs < threshold) {
    statusEl.textContent = pauseMessage;
    setCue("Respire", `${Math.max(0, (threshold - silenceMs) / 1000).toFixed(1)} s de tolerância restante`, "…");
  }

  if (silenceMs >= threshold) finishAnalysisAutomatically();
}


async function cancelListeningSession() {
  if (appState !== "LISTENING") return;

  demoRunId++;
  clearDemoTimers();
  clearBreathingTimers();
  clearAdaptiveGuide();
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
  demoRunId++;
  clearDemoTimers();
  clearBreathingTimers();
  clearAdaptiveGuide();
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
  demoRunId++;
  clearDemoTimers();
  clearAdaptiveGuide();
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
  const segments = guideTimeline.map(item => ({
    ...item,
    startT: Math.min(item.startT, item.guideStartT ?? item.startT),
  }));
  const state = adaptiveGuide;

  if (state && !state.finished && expectedNotes.length) {
    const currentEndT = Math.max(nowMs + 40, state.projectedAdvanceT || state.slotStartT + state.noteMs);
    segments.push({
      index: state.index,
      startT: Math.min(state.slotStartT, state.slotGuideStartT ?? state.slotStartT),
      endT: currentEndT,
      live: true,
    });

    let cursorT = currentEndT;
    for (let index = state.index + 1; index < expectedNotes.length; index++) {
      const anticipated = state.preCuedIndex === index && state.preCuedAtT != null;
      const startT = anticipated ? Math.min(cursorT, state.preCuedAtT) : cursorT;
      const endT = startT + state.noteMs;
      segments.push({ index, startT, endT, future: true, anticipated });
      cursorT = endT;
    }
  } else if (appState === "COUNTDOWN" && expectedNotes.length && !segments.length) {
    let cursorT = 0;
    const noteMs = currentNoteDurationMs();
    expectedNotes.forEach((_, index) => {
      segments.push({ index, startT: cursorT, endT: cursorT + noteMs, future: true });
      cursorT += noteMs;
    });
  }

  return segments.filter(segment => guidePattern[segment.index]);
}

function updateGraphGuideReadout(nowMs) {
  if (!graphNowEl || !graphNextEl) return;
  if (graphCountdownLabel != null) {
    graphNowEl.textContent = `Contagem: ${graphCountdownLabel}`;
    graphNextEl.textContent = graphCountdownCaption || "Prepare a entrada";
    return;
  }

  const state = adaptiveGuide;
  if (state?.finished) {
    graphNowEl.textContent = "Roteiro concluído";
    graphNextEl.textContent = "Finalize a emissão; a avaliação abrirá automaticamente.";
    return;
  }

  if (state && expectedNotes[state.index]) {
    const currentVisible = Boolean(guidePattern[state.index]);
    graphNowEl.textContent = currentVisible
      ? `Agora: ${expectedNotes[state.index].label}`
      : "Agora: desafio mudo";
    const remainingMs = Math.max(0, (state.projectedAdvanceT || nowMs) - nowMs);
    const nextIndex = state.index + 1;
    if (nextIndex >= expectedNotes.length) {
      graphNextEl.textContent = `Fim previsto em ${(remainingMs / 1000).toFixed(1)} s`;
    } else {
      const nextLabel = guidePattern[nextIndex]?.label || "desafio mudo";
      const anticipated = state.preCuedIndex === nextIndex;
      graphNextEl.textContent = anticipated
        ? `Referência antecipada: ${nextLabel} · troca em ${(remainingMs / 1000).toFixed(1)} s`
        : `Próxima: ${nextLabel} · troca prevista em ${(remainingMs / 1000).toFixed(1)} s`;
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
    const historyStart = guideTimeline[0]?.startT ?? 0;
    const historyEnd = guideTimeline.at(-1)?.endT ?? 0;
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

  // As notas deliberadamente mudas continuam sendo avaliadas, mas não ganham
  // linha nem rótulo: o gráfico não pode entregar a referência do desafio.
  const referenceMidis = expectedNotes
    .filter((_, index) => guidePattern[index])
    .map((note) => note.midi);
  const uniqueMidis = [...new Set(referenceMidis)];
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

  // Roteiro esperado. Trechos futuros ficam um pouco mais discretos e a nota
  // cujo instrumento está soando ganha maior espessura.
  ctx.lineCap = "round";
  graphGuideSegments(nowMs).forEach(segment => {
    const x0 = xFor(segment.startT);
    const x1 = xFor(segment.endT);
    if (x1 < 0 || x0 > cssWidth) return;
    const sounding = adaptiveGuide?.soundingIndex === segment.index;
    ctx.strokeStyle = sounding
      ? "#ff4f5f"
      : (segment.future ? "rgba(255, 48, 64, 0.58)" : "rgba(255, 48, 64, 0.88)");
    ctx.lineWidth = sounding ? 7 : 4;
    ctx.beginPath();
    ctx.moveTo(Math.max(0, x0), yFor(expectedNotes[segment.index].midi));
    ctx.lineTo(Math.min(cssWidth, x1), yFor(expectedNotes[segment.index].midi));
    ctx.stroke();
  });
  ctx.lineCap = "butt";

  const visible = graphFrames.filter((f) => f.t >= leftT && f.t <= rightT);
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

  if (!reviewMode && appState === "LISTENING" && adaptiveGuide && !adaptiveGuide.finished) {
    const xNow = xFor(nowMs);
    const currentIndex = adaptiveGuide.index;
    const visibleTarget = guidePattern[currentIndex];
    ctx.strokeStyle = "#22c76a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(xNow, 0);
    ctx.lineTo(xNow, cssHeight);
    ctx.stroke();

    if (visibleTarget) {
      const yNow = yFor(expectedNotes[currentIndex].midi);
      ctx.fillStyle = "#22c76a";
      ctx.beginPath();
      ctx.arc(xNow, yNow, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    const remainingMs = Math.max(0, adaptiveGuide.projectedAdvanceT - nowMs);
    const currentLabel = visibleTarget ? expectedNotes[currentIndex].label : "DESAFIO MUDO";
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
  demoRunId++;
  clearDemoTimers();
  clearBreathingTimers();
  clearAdaptiveGuide();
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
