const PLAYERS = 4;
const TEAM_BY_PLAYER = [0, 1, 0, 1];
const TEAM_NAMES = ["A", "B"];
const MATCH_POINTS = 4;
const DEFAULT_HUMAN_BOT_DELAY_MS = 1000;
const TRAINING_STEPS_PER_FRAME = 140;
const BOARD_CELL = 34;
const LEARNING_RATE = 0.01;
const GAMMA = 0.8;
const BRAIN_SAVE_INTERVAL_MS = 60000;
const DEFAULT_BRAIN_BASE_NAME = "basico";
const DOMINO_BRAIN_API = "/api/domino/brains";
const INPUT_SIZE = 203;
const HIDDEN_SIZES = [96, 64, 32, 16];
const LAYER_SIZES = [INPUT_SIZE, ...HIDDEN_SIZES, 1];
const TILE_IDS = buildTileIds();
const BELIEF_INPUT_SIZE = 165;
const BELIEF_OUTPUT_SIZE = PLAYERS * 7 + PLAYERS * TILE_IDS.length;
const BELIEF_LAYER_SIZES = [BELIEF_INPUT_SIZE, 96, 64, BELIEF_OUTPUT_SIZE];
const BELIEF_LEARNING_RATE = 0.008;
const BELIEF_HISTORY_LIMIT = 12000;
const CHART_POINT_LIMIT = 900;
const CHART_SMOOTH_WINDOW = 100;
const LOBO_BELIEF_SUMMARY_SIZE = 34;
const LOBO_EXTRA_SIZE = 17;
const LOBO_INPUT_SIZE = INPUT_SIZE + LOBO_BELIEF_SUMMARY_SIZE + LOBO_EXTRA_SIZE;
const LOBO_LAYER_SIZES = [LOBO_INPUT_SIZE, 64, 32, 1];
const LOBO_LEARNING_RATE = 0.008;
const MATCH_HISTORY_LIMIT = 300;
const REWARD_STORAGE_KEY = "domino-reward-profiles-v1";
const REWARD_KEYS = ["pass", "partner", "aggression", "mobility", "safety"];

const els = {
  scoreA: document.querySelector("#score-a"),
  scoreB: document.querySelector("#score-b"),
  winsA: document.querySelector("#wins-a"),
  winsB: document.querySelector("#wins-b"),
  hands: document.querySelector("#hands"),
  board: document.querySelector("#board"),
  ends: document.querySelector("#ends"),
  status: document.querySelector("#status"),
  resultOverlay: document.querySelector("#result-overlay"),
  humanHand: document.querySelector("#human-hand"),
  handPanel: document.querySelector(".hand-panel"),
  humanActions: document.querySelector("#human-actions"),
  newGame: document.querySelector("#new-game"),
  resetResults: document.querySelector("#reset-results"),
  trainStart: document.querySelector("#train-start"),
  trainStop: document.querySelector("#train-stop"),
  trainPredictionHistory: document.querySelector("#train-prediction-history"),
  brainSelects: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-select-${i}`)),
  newBrainButtons: [...document.querySelectorAll("[data-new-brain]")],
  humanSpeed: document.querySelector("#human-speed"),
  humanSpeedValue: document.querySelector("#human-speed-value"),
  agentModes: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#agent-${i}`)),
  rewardSliders: [...document.querySelectorAll("[data-reward]")],
  brainStats: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-stat-${i}`)),
  brainCounts: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-${i}`)),
  beliefDashboard: document.querySelector("#belief-dashboard"),
  players: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#player-${i}`)),
};

const state = {
  hands: [[], [], [], []],
  board: [],
  leftEnd: null,
  rightEnd: null,
  current: 0,
  passedPlayers: Array(PLAYERS).fill(false),
  firstHand: true,
  requireDoubleSix: true,
  nextStarter: 0,
  consecutivePasses: 0,
  scores: [0, 0],
  wins: [0, 0],
  handsPlayed: 0,
  training: false,
  predictionTrainingEnabled: false,
  humanSeat: null,
  selectedTileId: null,
  handFinished: false,
  matchFinished: false,
  statusMessage: "",
  statusKind: "neutral",
  resultType: null,
  botTimer: null,
  resultTimer: null,
  brainSaveInFlight: false,
  lastBrainSaveAt: 0,
  lastBrainTrainingClock: 0,
  lastLearningDashboardRenderAt: 0,
  lastMoveId: null,
  moveSequence: 0,
  handHistoryId: 0,
  handHistory: null,
  lastHandHistory: null,
  minPathIndex: 0,
  maxPathIndex: 0,
  decisions: [],
  agentModesBeforeTraining: null,
  matchStartAgentModes: null,
  matchHistory: [],
  publicSignals: createPublicSignals(),
  rewardProfiles: createRewardProfiles(),
  brains: Array.from({ length: PLAYERS }, createBrain),
  brainNames: Array.from({ length: PLAYERS }, (_, i) => `${DEFAULT_BRAIN_BASE_NAME}J${i + 1}`),
  brainOptions: Array.from({ length: PLAYERS }, () => []),
  brainTrainMs: Array(PLAYERS).fill(0),
  brainGames: 0,
  epsilon: 0.35,
};

function createBrain() {
  const lobo = createLoboNetwork();
  return {
    layers: LAYER_SIZES.slice(1).map((outputSize, index) => {
      const inputSize = LAYER_SIZES[index];
      return createLayer(inputSize, outputSize, Math.sqrt(2 / inputSize));
    }),
    belief: createBeliefNetwork(),
    beliefStats: createBeliefStats(),
    lobo,
    loboStats: createLoboStats(),
    games: 0,
    roundsTrained: 0,
    treinosRealizados: 0,
    generation: 0,
  };
}

function buildTileIds() {
  const ids = [];
  for (let a = 0; a <= 6; a += 1) {
    for (let b = a; b <= 6; b += 1) ids.push(`${a}-${b}`);
  }
  return ids;
}

function createBeliefNetwork() {
  return {
    layers: BELIEF_LAYER_SIZES.slice(1).map((outputSize, index) => {
      const inputSize = BELIEF_LAYER_SIZES[index];
      return createLayer(inputSize, outputSize, Math.sqrt(2 / inputSize));
    }),
  };
}

function createLoboNetwork() {
  return {
    layers: LOBO_LAYER_SIZES.slice(1).map((outputSize, index) => {
      const inputSize = LOBO_LAYER_SIZES[index];
      return createLayer(inputSize, outputSize, Math.sqrt(2 / inputSize));
    }),
  };
}

function createLoboStats() {
  return {
    trainSteps: 0,
    avgTdError: 1,
    lastTdError: 1,
    valueMean: 0,
    history: [],
  };
}

function createBeliefStats() {
  return {
    trainSteps: 0,
    lastLoss: 1,
    avgLoss: 1,
    numberAccuracy: 0,
    tileAccuracy: 0,
    numberPrecision: 0,
    numberRecall: 0,
    tilePrecision: 0,
    tileRecall: 0,
    positiveCloseness: 0,
    positiveMetricsReady: false,
    closeness: 0,
    baselineCloseness: null,
    bestCloseness: 0,
    history: [],
  };
}

function createLayer(inputSize, outputSize, scale) {
  return {
    weights: Array.from({ length: outputSize }, () =>
      Array.from({ length: inputSize }, () => (Math.random() * 2 - 1) * scale),
    ),
    biases: Array.from({ length: outputSize }, () => 0),
  };
}

function createPublicSignals() {
  return Array.from({ length: PLAYERS }, () => ({
    passes: Array(7).fill(0),
    avoids: Array(7).fill(0),
  }));
}

function createRewardProfiles() {
  return Array.from({ length: PLAYERS }, () =>
    Object.fromEntries(REWARD_KEYS.map((key) => [key, 50])),
  );
}

function loadRewardProfiles() {
  try {
    const raw = localStorage.getItem(REWARD_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || saved.length !== PLAYERS) return;
    state.rewardProfiles = createRewardProfiles().map((profile, player) => ({
      ...profile,
      ...Object.fromEntries(
        REWARD_KEYS.map((key) => [key, clamp(Number(saved[player]?.[key] ?? profile[key]), 0, 100)]),
      ),
    }));
  } catch {
    localStorage.removeItem(REWARD_STORAGE_KEY);
  }
}

function saveRewardProfiles() {
  try {
    localStorage.setItem(REWARD_STORAGE_KEY, JSON.stringify(state.rewardProfiles));
  } catch {
    // Reward tuning still works in memory if storage is unavailable.
  }
}

function normalizeBrain(brain) {
  const roundsTrained = Number(brain.roundsTrained ?? brain.treinosRealizados) || 0;
  const lobo = isValidLoboNetwork(brain.lobo) ? brain.lobo : createLoboNetwork();
  const normalized = {
    ...brain,
    belief: isValidBeliefNetwork(brain.belief) ? brain.belief : createBeliefNetwork(),
    beliefStats: normalizeBeliefStats(brain.beliefStats),
    lobo,
    loboStats: normalizeLoboStats(brain.loboStats),
    games: Number(brain.games) || 0,
    roundsTrained,
    treinosRealizados: roundsTrained,
    generation: Number(brain.generation) || 0,
  };
  return normalized;
}

function normalizeLoboStats(stats = {}) {
  return {
    ...createLoboStats(),
    ...stats,
    trainSteps: Number(stats.trainSteps) || 0,
    avgTdError: Number.isFinite(Number(stats.avgTdError)) ? Number(stats.avgTdError) : 1,
    lastTdError: Number.isFinite(Number(stats.lastTdError)) ? Number(stats.lastTdError) : 1,
    valueMean: Number(stats.valueMean) || 0,
    history: Array.isArray(stats.history) ? stats.history.slice(-BELIEF_HISTORY_LIMIT) : [],
  };
}

function normalizeBeliefStats(stats = {}) {
  const normalizedHistory = Array.isArray(stats.history)
    ? stats.history
        .map((entry, index) => normalizeBeliefHistoryEntry(entry, index))
        .filter(Boolean)
        .slice(-BELIEF_HISTORY_LIMIT)
    : [];
  const closeness = Number(stats.closeness) || 0;
  const historyBaseline = normalizedHistory[0]?.closeness;
  const bestHistoryCloseness = normalizedHistory.reduce((best, entry) => Math.max(best, entry.closeness || 0), 0);
  const numberAccuracy = Number(stats.numberAccuracy) || 0;
  const tileAccuracy = Number(stats.tileAccuracy) || 0;
  const hasNumberRecall = Object.prototype.hasOwnProperty.call(stats, "numberRecall");
  const hasTileRecall = Object.prototype.hasOwnProperty.call(stats, "tileRecall");
  const hasTilePrecision = Object.prototype.hasOwnProperty.call(stats, "tilePrecision");
  const positiveMetricsReady = Boolean(stats.positiveMetricsReady);
  return {
    ...createBeliefStats(),
    ...stats,
    trainSteps: Number(stats.trainSteps) || 0,
    lastLoss: Number.isFinite(Number(stats.lastLoss)) ? Number(stats.lastLoss) : 1,
    avgLoss: Number.isFinite(Number(stats.avgLoss)) ? Number(stats.avgLoss) : 1,
    numberAccuracy,
    tileAccuracy,
    numberPrecision: Number(stats.numberPrecision) || 0,
    numberRecall: positiveMetricsReady && hasNumberRecall ? Number(stats.numberRecall) || 0 : numberAccuracy,
    tilePrecision: positiveMetricsReady && hasTilePrecision ? Number(stats.tilePrecision) || 0 : tileAccuracy,
    tileRecall: positiveMetricsReady && hasTileRecall ? Number(stats.tileRecall) || 0 : tileAccuracy,
    positiveCloseness: Number(stats.positiveCloseness) || 0,
    positiveMetricsReady,
    closeness,
    baselineCloseness: Number.isFinite(Number(stats.baselineCloseness)) ? Number(stats.baselineCloseness) : historyBaseline ?? null,
    bestCloseness: Math.max(Number(stats.bestCloseness) || 0, bestHistoryCloseness, closeness),
    history: normalizedHistory,
  };
}

function normalizeBeliefHistoryEntry(entry, index = 0) {
  if (typeof entry === "number") {
    return {
      step: index,
      closeness: clamp(entry, 0, 1),
      avgLoss: clamp(1 - entry, 0, 1),
      numberRecall: 0,
      tileRecall: 0,
      positiveCloseness: 0,
    };
  }
  if (!entry || typeof entry !== "object") return null;
  const closeness = Number(entry.closeness) || 0;
  return {
    step: Number(entry.step ?? index) || index,
    closeness: clamp(closeness, 0, 1),
    avgLoss: clamp(Number(entry.avgLoss ?? 1 - closeness) || 0, 0, 1),
    numberRecall: clamp(Number(entry.numberRecall) || 0, 0, 1),
    tileRecall: clamp(Number(entry.tileRecall) || 0, 0, 1),
    positiveCloseness: clamp(Number(entry.positiveCloseness) || 0, 0, 1),
  };
}

function isValidBeliefNetwork(network) {
  return (
    network &&
    Array.isArray(network.layers) &&
    network.layers.length === BELIEF_LAYER_SIZES.length - 1 &&
    network.layers.every((layer, index) => {
      const outputSize = BELIEF_LAYER_SIZES[index + 1];
      const inputSize = BELIEF_LAYER_SIZES[index];
      return (
        Array.isArray(layer.weights) &&
        layer.weights.length === outputSize &&
        layer.weights.every((weights) => Array.isArray(weights) && weights.length === inputSize) &&
        Array.isArray(layer.biases) &&
        layer.biases.length === outputSize
      );
    })
  );
}

function isValidLoboNetwork(network) {
  return (
    network &&
    Array.isArray(network.layers) &&
    network.layers.length === LOBO_LAYER_SIZES.length - 1 &&
    network.layers.every((layer, index) => {
      const outputSize = LOBO_LAYER_SIZES[index + 1];
      const inputSize = LOBO_LAYER_SIZES[index];
      return (
        Array.isArray(layer.weights) &&
        layer.weights.length === outputSize &&
        layer.weights.every((weights) => Array.isArray(weights) && weights.length === inputSize) &&
        Array.isArray(layer.biases) &&
        layer.biases.length === outputSize
      );
    })
  );
}

function isValidBrain(brain) {
  return (
    brain &&
    Array.isArray(brain.layers) &&
    brain.layers.length === LAYER_SIZES.length - 1 &&
    brain.layers.every((layer, index) => {
      const outputSize = LAYER_SIZES[index + 1];
      const inputSize = LAYER_SIZES[index];
      return (
        Array.isArray(layer.weights) &&
        layer.weights.length === outputSize &&
        layer.weights.every((weights) => Array.isArray(weights) && weights.length === inputSize) &&
        Array.isArray(layer.biases) &&
        layer.biases.length === outputSize
      );
    })
  );
}

async function initBrainsFromDatabase() {
  try {
    await refreshBrainOptions();
    for (let player = 0; player < PLAYERS; player += 1) {
      const defaultBase = DEFAULT_BRAIN_BASE_NAME;
      const option = state.brainOptions[player].find((item) => item.baseName === defaultBase) || state.brainOptions[player][0];
      if (option) {
        await loadBrainFromDatabase(player, option.baseName);
      }
    }
    render("CÃƒÂ©rebros carregados do banco.");
  } catch (error) {
    console.error(error);
    render("NÃƒÂ£o foi possÃƒÂ­vel carregar os cÃƒÂ©rebros do banco. Usando cÃƒÂ©rebros temporÃƒÂ¡rios em memÃƒÂ³ria.");
  }
}

async function refreshBrainOptions() {
  const payload = await fetchJson(DOMINO_BRAIN_API);
  state.brainOptions = Array.from({ length: PLAYERS }, (_, player) =>
    (payload.brains || [])
      .filter((brain) => brain.player === player + 1)
      .sort((a, b) => a.baseName.localeCompare(b.baseName, "pt-BR")),
  );
  renderBrainSelectors();
}

async function loadBrainFromDatabase(player, baseName) {
  const safeBaseName = sanitizeBrainBaseName(baseName);
  const payload = await fetchJson(`${DOMINO_BRAIN_API}/${player + 1}/${encodeURIComponent(safeBaseName)}`);
  const brain = normalizeBrain(payload.brain);
  if (!isValidBrain(brain)) throw new Error("CÃƒÂ©rebro incompatÃƒÂ­vel.");
  state.brains[player] = brain;
  state.brainNames[player] = payload.nome;
  state.brainTrainMs[player] = Number(payload.tempoTreino) || 0;
  renderBrainSelectors();
}

async function createBrainInDatabase(player, rawName) {
  const baseName = sanitizeBrainBaseName(rawName);
  const payload = await fetchJson(DOMINO_BRAIN_API, {
    method: "POST",
    body: JSON.stringify({ player: player + 1, nome: baseName }),
  });
  await refreshBrainOptions();
  await loadBrainFromDatabase(player, payload.baseName || baseName);
  render(`CÃƒÂ©rebro ${baseName}J${player + 1} criado e carregado.`);
}

async function saveSelectedBrains(force = false) {
  if (state.brainSaveInFlight) return;
  const now = Date.now();
  accrueTrainingTime(now);
  if (!force && now - state.lastBrainSaveAt < BRAIN_SAVE_INTERVAL_MS) return;
  syncBrainTrainingCounters();
  state.brainSaveInFlight = true;
  try {
    await fetchJson(DOMINO_BRAIN_API, {
      method: "PUT",
      body: JSON.stringify({
        items: state.brains.map((brain, player) => ({
          player: player + 1,
          nome: state.brainNames[player],
          brain,
          tempoTreino: Math.round(state.brainTrainMs[player]),
        })),
      }),
    });
    state.lastBrainSaveAt = now;
  } catch (error) {
    console.error(error);
  } finally {
    state.brainSaveInFlight = false;
  }
}

function syncBrainTrainingCounters() {
  for (const brain of state.brains) {
    brain.roundsTrained = Number(brain.roundsTrained) || 0;
    brain.treinosRealizados = brain.roundsTrained;
  }
}

function accrueTrainingTime(now = Date.now()) {
  if (!state.training || state.lastBrainTrainingClock === 0) {
    state.lastBrainTrainingClock = now;
    return;
  }
  const elapsed = Math.max(0, now - state.lastBrainTrainingClock);
  for (let player = 0; player < PLAYERS; player += 1) {
    if (isTrainableAgent(player)) state.brainTrainMs[player] += elapsed;
  }
  state.lastBrainTrainingClock = now;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erro na comunicaÃƒÂ§ÃƒÂ£o com o banco.");
  return payload;
}

function sanitizeBrainBaseName(value) {
  const cleaned = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/J[1-4]$/i, "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return cleaned || DEFAULT_BRAIN_BASE_NAME;
}

function brainBaseName(player) {
  const match = String(state.brainNames[player] || "").match(/^(.+)J[1-4]$/);
  return match ? match[1] : DEFAULT_BRAIN_BASE_NAME;
}

function createTiles() {
  const tiles = [];
  for (let a = 0; a <= 6; a += 1) {
    for (let b = a; b <= 6; b += 1) {
      tiles.push({ a, b, id: `${a}-${b}` });
    }
  }
  return tiles;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startMatch() {
  clearBotTimer();
  clearResultTimer();
  state.matchStartAgentModes = currentAgentModes().map((mode) => (mode === "human" ? "humano" : agentModeLabel(mode)));
  state.scores = [0, 0];
  state.firstHand = true;
  state.requireDoubleSix = true;
  state.nextStarter = 0;
  state.handFinished = false;
  state.matchFinished = false;
  state.statusMessage = "";
  state.statusKind = "neutral";
  state.resultType = null;
  startHand();
}

function resetCounters() {
  state.scores = [0, 0];
  state.wins = [0, 0];
  state.handsPlayed = 0;
  state.statusMessage = "";
  state.statusKind = "neutral";
  state.resultType = null;
}

function startHand(autoSchedule = true) {
  clearBotTimer();
  clearResultTimer();
  const deck = shuffle(createTiles());
  state.hands = [[], [], [], []];
  state.board = [];
  state.leftEnd = null;
  state.rightEnd = null;
  state.consecutivePasses = 0;
  state.passedPlayers = Array(PLAYERS).fill(false);
  state.selectedTileId = null;
  state.handFinished = false;
  state.matchFinished = false;
  state.statusMessage = "";
  state.statusKind = "neutral";
  state.resultType = null;
  state.lastMoveId = null;
  state.minPathIndex = 0;
  state.maxPathIndex = 0;
  state.decisions = [];
  state.publicSignals = createPublicSignals();
  state.handHistory = null;

  for (let i = 0; i < deck.length; i += 1) {
    state.hands[i % PLAYERS].push(deck[i]);
  }
  state.hands.forEach(sortHand);

  if (state.firstHand) {
    state.current = state.hands.findIndex((hand) => hand.some((tile) => tile.id === "6-6"));
    state.nextStarter = (state.current + 1) % PLAYERS;
    state.requireDoubleSix = true;
    state.firstHand = false;
  } else {
    state.current = state.nextStarter;
    state.nextStarter = (state.nextStarter + 1) % PLAYERS;
    state.requireDoubleSix = false;
  }

  if (shouldCollectTrainingHistory()) startHandHistory();
  render();
  if (autoSchedule) scheduleBots();
}

function sortHand(hand) {
  hand.sort((x, y) => y.a + y.b - (x.a + x.b) || y.a - x.a || y.b - x.b);
}

function legalMoves(player) {
  if (state.handFinished || state.matchFinished) return [];
  const hand = state.hands[player];
  if (state.board.length === 0) {
    const doubleSix = hand.find((tile) => tile.id === "6-6");
    if (state.requireDoubleSix && doubleSix) return [{ tile: doubleSix, side: "start" }];
    return hand.map((tile) => ({ tile, side: "start" }));
  }

  const moves = [];
  for (const tile of hand) {
    if (tile.a === state.leftEnd || tile.b === state.leftEnd) moves.push({ tile, side: "left" });
    if (tile.a === state.rightEnd || tile.b === state.rightEnd) moves.push({ tile, side: "right" });
  }
  return filterLockingMoves(moves, player);
}

function filterLockingMoves(moves, player) {
  if (moves.length <= 1) return moves;
  const safeMoves = moves.filter((move) => !isProhibitedLockMove(move, player));
  return safeMoves.length > 0 ? safeMoves : moves;
}

function isProhibitedLockMove(move, player) {
  if (state.hands[player].length <= 1) return false;
  return createsExhaustedDoubleEnd(move) || closesTableForEveryone(move, player);
}

function createsExhaustedDoubleEnd(move) {
  const ends = previewEnds(move);
  if (ends.left !== ends.right) return false;
  const value = ends.left;
  return countPlayedNonDoublesFor(value, move.tile) >= 6;
}

function countPlayedNonDoublesFor(value, candidateTile) {
  const playedCount = state.board.filter((tile) => tile.a !== tile.b && (tile.a === value || tile.b === value)).length;
  const candidateCount =
    candidateTile.a !== candidateTile.b && (candidateTile.a === value || candidateTile.b === value) ? 1 : 0;
  return playedCount + candidateCount;
}

function recordPassSignal(player) {
  if (state.board.length === 0 || state.leftEnd === null || state.rightEnd === null) return;
  addSignal(state.publicSignals[player].passes, state.leftEnd, 1);
  if (state.rightEnd !== state.leftEnd) addSignal(state.publicSignals[player].passes, state.rightEnd, 1);
}

function recordChoiceSignal(player, move, tile) {
  if (state.leftEnd === state.rightEnd) return;
  const avoidedEnd = move.side === "left" ? state.rightEnd : state.leftEnd;
  if (!tileHasNumber(tile, avoidedEnd)) addSignal(state.publicSignals[player].avoids, avoidedEnd, 0.35);
}

function recordPlayedSignal(player, tile) {
  for (const number of tileNumbers(tile)) {
    state.publicSignals[player].avoids[number] *= 0.5;
  }
}

function addSignal(vector, number, amount) {
  if (number === null || number === undefined) return;
  vector[number] = Math.min(4, vector[number] + amount);
}

function tileHasNumber(tile, number) {
  return tile.a === number || tile.b === number;
}

function tileNumbers(tile) {
  return tile.a === tile.b ? [tile.a] : [tile.a, tile.b];
}

function startHandHistory() {
  state.handHistoryId += 1;
  const initialPublic = publicSnapshot();
  state.handHistory = {
    id: state.handHistoryId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    initial: {
      scores: state.scores.slice(),
      starter: state.current,
      requireDoubleSix: state.requireDoubleSix,
      nextStarter: state.nextStarter,
      publicSnapshot: initialPublic,
    },
    turns: [],
    knownMissingNumbers: createKnownMissingNumbers(),
    passCountsByOpenNumber: Array.from({ length: PLAYERS }, () => Array(7).fill(0)),
    choiceCountsByAvoidedNumber: Array.from({ length: PLAYERS }, () => Array(7).fill(0)),
    couldHavePlayedButAvoidedCounts: Array.from({ length: PLAYERS }, () => Array(7).fill(0)),
    playedNumberCountsByPlayer: Array.from({ length: PLAYERS }, () => Array(7).fill(0)),
    result: null,
    privateTruth: {
      initialHands: cloneHands(state.hands),
      finalHands: null,
    },
  };
}

function shouldCollectTrainingHistory() {
  return state.training && state.predictionTrainingEnabled;
}

function createKnownMissingNumbers() {
  return Array.from({ length: PLAYERS }, () => Array.from({ length: 7 }, () => []));
}

function recordTurnHistoryBefore(player, legalMovesForTurn) {
  if (!state.handHistory) return null;
  const legalMoves = legalMovesForTurn.map(historyMoveSummary);
  return {
    turnIndex: state.handHistory.turns.length,
    player,
    team: TEAM_BY_PLAYER[player],
    before: publicSnapshot(),
    legalMoves,
    derivedBefore: derivedHistoryFeatures(player, legalMovesForTurn, null),
  };
}

function recordMoveHistory(player, move, tile, beforeSnapshot) {
  if (!state.handHistory || !beforeSnapshot) return;
  const afterSnapshot = publicSnapshot();
  const playedNumbers = tileNumbers(tile);
  const avoidedNumber = avoidedOpenNumber(move, tile, beforeSnapshot.before.ends);
  const avoidableNumber = avoidedPlayableOpenNumber(move, tile, beforeSnapshot);
  for (const number of playedNumbers) {
    state.handHistory.playedNumberCountsByPlayer[player][number] += 1;
    clearKnownMissingNumber(player, number, beforeSnapshot.turnIndex);
  }
  if (avoidedNumber !== null) {
    state.handHistory.choiceCountsByAvoidedNumber[player][avoidedNumber] += 1;
  }
  if (avoidableNumber !== null) {
    state.handHistory.couldHavePlayedButAvoidedCounts[player][avoidableNumber] += 1;
  }
  state.handHistory.turns.push({
    ...beforeSnapshot,
    type: "move",
    move: {
      side: move.side,
      tile: cloneTile(tile),
      numbers: playedNumbers,
      avoidedNumber,
      avoidableNumber,
      playedId: state.lastMoveId,
    },
    after: afterSnapshot,
    derivedAfter: derivedHistoryFeatures(player, [], move),
  });
}

function recordPassHistory(player, beforeSnapshot) {
  if (!state.handHistory || !beforeSnapshot) return;
  const openNumbers = openEndNumbers(beforeSnapshot.before.ends);
  for (const number of openNumbers) {
    state.handHistory.passCountsByOpenNumber[player][number] += 1;
    markKnownMissingNumber(player, number, beforeSnapshot.turnIndex);
  }
  state.handHistory.turns.push({
    ...beforeSnapshot,
    type: "pass",
    pass: {
      openNumbers,
      certainty: openNumbers.map((number) => ({ number, reason: "passed_on_open_end", probability: 1 })),
    },
    after: publicSnapshot(),
    derivedAfter: derivedHistoryFeatures(player, [], null),
  });
}

function finishHandHistory(winnerTeam, winningPlayer = null, closed = false) {
  if (!state.handHistory || state.handHistory.result) return;
  state.handHistory.endedAt = new Date().toISOString();
  state.handHistory.result = {
    winnerTeam,
    winningPlayer,
    closed,
    scoresAfterHand: state.scores.slice(),
    handsPlayedAfter: state.handsPlayed,
    publicSnapshot: publicSnapshot(),
  };
  state.handHistory.privateTruth.finalHands = cloneHands(state.hands);
  state.handHistory.privateTruth.finalSnapshot = privateTruthSnapshot();
  state.lastHandHistory = state.handHistory;
}

function publicSnapshot() {
  return {
    moveSequence: state.moveSequence,
    current: state.current,
    scores: state.scores.slice(),
    handsPlayed: state.handsPlayed,
    ends: { left: state.leftEnd, right: state.rightEnd },
    board: state.board.map((tile) => ({
      id: tile.id,
      a: tile.a,
      b: tile.b,
      owner: tile.owner,
      playedId: tile.playedId,
      pathIndex: tile.pathIndex,
    })),
    handCounts: state.hands.map((hand) => hand.length),
    passedPlayers: state.passedPlayers.slice(),
    publicSignals: state.publicSignals.map((signals) => ({
      passes: signals.passes.slice(),
      avoids: signals.avoids.slice(),
    })),
    playedNumberStats: playedNumberStats(),
    playedNumberPresenceStats: playedNumberPresenceStats(),
    unseenNumberCounts: unseenNumberCounts(),
    stage: handStage(),
    teamHandDelta: teamHandSizeDelta(),
    matchProgress: {
      teamA: state.scores[0] / MATCH_POINTS,
      teamB: state.scores[1] / MATCH_POINTS,
    },
  };
}

function visibleSnapshotFor(player) {
  return {
    ...publicSnapshot(),
    perspectivePlayer: player,
    ownHand: cloneTiles(state.hands[player]),
  };
}

function privateTruthSnapshot() {
  return {
    hands: cloneHands(state.hands),
    handNumberPresence: state.hands.map(numberPresenceCounts),
    handTileIds: state.hands.map((hand) => hand.map((tile) => tile.id)),
  };
}

function derivedHistoryFeatures(player, legalMovesForTurn, move) {
  const ends = { left: state.leftEnd, right: state.rightEnd };
  const ownHand = state.hands[player];
  const handAfterMove = move ? ownHand.filter((tile) => tile.id !== move.tile.id) : ownHand;
  const partner = (player + 2) % PLAYERS;
  const nextOpponent = (player + 1) % PLAYERS;
  return {
    stage: handStage(),
    legalMoveCount: legalMovesForTurn.length,
    ownPlayableAfter: countPlayableTiles(handAfterMove, ends),
    partnerLikelyMobility: visibleMobilityForKnownHand(partner, ends),
    nextOpponentKnownMobility: visibleMobilityForKnownHand(nextOpponent, ends),
    teamHandDelta: teamHandSizeDelta(),
    unseenNumberCounts: unseenNumberCounts(),
    tileCriticality: move ? tileCriticality(move.tile) : null,
    doubleRiskAfter: handAfterMove.filter((tile) => tile.a === tile.b && !canTilePlayEnds(tile, ends)).length,
    handConnectivityAfter: handConnectivity(handAfterMove),
    moveFavorsNextOpponent: move ? visibleMobilityForKnownHand(nextOpponent, ends) : null,
    moveHelpsPartner: move ? visibleMobilityForKnownHand(partner, ends) : null,
  };
}

function historyMoveSummary(move) {
  return {
    tileId: move.tile.id,
    a: move.tile.a,
    b: move.tile.b,
    side: move.side,
    isDouble: move.tile.a === move.tile.b,
  };
}

function avoidedOpenNumber(move, tile, ends) {
  if (!move || move.side === "start" || ends.left === ends.right) return null;
  const avoided = move.side === "left" ? ends.right : ends.left;
  return tileHasNumber(tile, avoided) ? null : avoided;
}

function avoidedPlayableOpenNumber(move, tile, beforeSnapshot) {
  const avoided = avoidedOpenNumber(move, tile, beforeSnapshot.before.ends);
  if (avoided === null) return null;
  const avoidedSide = move.side === "left" ? "right" : "left";
  return beforeSnapshot.legalMoves.some((candidate) => candidate.side === avoidedSide) ? avoided : null;
}

function openEndNumbers(ends) {
  if (!ends || ends.left === null || ends.left === undefined) return [];
  return ends.left === ends.right ? [ends.left] : [ends.left, ends.right];
}

function markKnownMissingNumber(player, number, turnIndex) {
  const entries = state.handHistory.knownMissingNumbers[player][number];
  const last = entries[entries.length - 1];
  if (last && last.untilTurn === null) return;
  entries.push({ fromTurn: turnIndex, untilTurn: null, reason: "pass_on_open_end" });
}

function clearKnownMissingNumber(player, number, turnIndex) {
  if (!state.handHistory) return;
  const entries = state.handHistory.knownMissingNumbers[player][number];
  const last = entries[entries.length - 1];
  if (last && last.untilTurn === null) last.untilTurn = turnIndex;
}

function unseenNumberCounts() {
  const played = playedNumberStats().total;
  return played.map((count) => Math.max(0, 8 - count));
}

function handStage() {
  const remainingTiles = state.hands.reduce((sum, hand) => sum + hand.length, 0);
  if (remainingTiles > 20) return "inicio";
  if (remainingTiles > 10) return "meio";
  return "fim";
}

function teamHandSizeDelta() {
  const teamA = state.hands[0].length + state.hands[2].length;
  const teamB = state.hands[1].length + state.hands[3].length;
  return teamA - teamB;
}

function visibleMobilityForKnownHand(player, ends) {
  return countPlayableTiles(state.hands[player], ends);
}

function tileCriticality(tile) {
  const unseen = unseenNumberCounts();
  const numbers = tileNumbers(tile);
  const scarcity = numbers.reduce((sum, number) => sum + (1 - unseen[number] / 8), 0) / numbers.length;
  return {
    isDouble: tile.a === tile.b,
    scarcity: clamp(scarcity, 0, 1),
    remainingForNumbers: Object.fromEntries(numbers.map((number) => [number, unseen[number]])),
  };
}

function handConnectivity(hand) {
  if (hand.length === 0) return { components: 0, largestComponent: 0, isolatedTiles: 0 };
  const visited = new Set();
  const adjacency = hand.map((tile, index) =>
    hand
      .map((other, otherIndex) => (index !== otherIndex && tileNumbers(tile).some((number) => tileHasNumber(other, number)) ? otherIndex : -1))
      .filter((index) => index !== -1),
  );
  const componentSizes = [];
  for (let i = 0; i < hand.length; i += 1) {
    if (visited.has(i)) continue;
    const stack = [i];
    visited.add(i);
    let size = 0;
    while (stack.length > 0) {
      const current = stack.pop();
      size += 1;
      for (const next of adjacency[current]) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
    componentSizes.push(size);
  }
  return {
    components: componentSizes.length,
    largestComponent: Math.max(...componentSizes),
    isolatedTiles: componentSizes.filter((size) => size === 1).length,
  };
}

function cloneHands(hands) {
  return hands.map(cloneTiles);
}

function cloneTiles(tiles) {
  return tiles.map(cloneTile);
}

function cloneTile(tile) {
  return { a: tile.a, b: tile.b, id: tile.id };
}

function closesTableForEveryone(move, player) {
  const ends = previewEnds(move);
  return state.hands.every((hand, handOwner) =>
    hand.every((tile) => {
      if (handOwner === player && tile.id === move.tile.id) return true;
      return !canTilePlayEnds(tile, ends);
    }),
  );
}

function canTilePlayEnds(tile, ends) {
  return tile.a === ends.left || tile.b === ends.left || tile.a === ends.right || tile.b === ends.right;
}

function playMove(player, move) {
  if (state.handFinished || state.matchFinished) return false;
  const hand = state.hands[player];
  const index = hand.findIndex((tile) => tile.id === move.tile.id);
  if (index === -1) return false;
  const beforeHistory = shouldCollectTrainingHistory() ? recordTurnHistoryBefore(player, legalMoves(player)) : null;
  const [tile] = hand.splice(index, 1);
  const playedId = `${player}-${state.moveSequence}`;
  state.moveSequence += 1;
  let pathIndex = 0;

  if (state.board.length === 0) {
    recordPlayedSignal(player, tile);
    state.minPathIndex = 0;
    state.maxPathIndex = 0;
    state.board.push({ ...tile, owner: player, playedId, pathIndex });
    state.leftEnd = tile.a;
    state.rightEnd = tile.b;
  } else if (move.side === "left") {
    recordChoiceSignal(player, move, tile);
    recordPlayedSignal(player, tile);
    const oriented = tile.a === state.leftEnd ? { a: tile.b, b: tile.a } : { a: tile.a, b: tile.b };
    pathIndex = state.minPathIndex - 1;
    state.minPathIndex = pathIndex;
    state.board.unshift({ ...oriented, owner: player, playedId, pathIndex });
    state.leftEnd = oriented.a;
  } else {
    recordChoiceSignal(player, move, tile);
    recordPlayedSignal(player, tile);
    const oriented = tile.a === state.rightEnd ? { a: tile.a, b: tile.b } : { a: tile.b, b: tile.a };
    pathIndex = state.maxPathIndex + 1;
    state.maxPathIndex = pathIndex;
    state.board.push({ ...oriented, owner: player, playedId, pathIndex });
    state.rightEnd = oriented.b;
  }

  state.lastMoveId = playedId;
  recordMoveHistory(player, move, tile, beforeHistory);
  state.consecutivePasses = 0;
  state.selectedTileId = null;
  if (state.hands[player].length === 0) {
    const team = TEAM_BY_PLAYER[player];
    finishHand(team, `Jogador ${player + 1} bateu. Time ${TEAM_NAMES[team]} marcou 1 ponto.`, player, false);
    return true;
  }
  advanceTurn();
  return true;
}

function passTurn() {
  if (state.handFinished || state.matchFinished) return;
  const player = state.current;
  const beforeHistory = shouldCollectTrainingHistory() ? recordTurnHistoryBefore(player, legalMoves(player)) : null;
  state.passedPlayers[player] = true;
  if (state.training) rewardOpponentPassOutcome(player);
  recordPassSignal(player);
  recordPassHistory(player, beforeHistory);
  state.consecutivePasses += 1;
  if (state.consecutivePasses >= PLAYERS) {
    finishHand(null, "Jogo fechado. Ninguem marcou porque nenhuma mao foi esvaziada.", null, true);
    return;
  }
  advanceTurn();
}

function advanceTurn() {
  state.current = (state.current + 1) % PLAYERS;
  state.passedPlayers[state.current] = false;
}

function finishHand(winnerTeam, message, winningPlayer = null, closed = false) {
  state.handFinished = true;
  state.passedPlayers = Array(PLAYERS).fill(false);
  clearBotTimer();
  clearResultTimer();

  if (winnerTeam !== null) {
    state.scores[winnerTeam] += 1;
  }

  state.handsPlayed += 1;
  if (shouldCollectTrainingHistory()) finishHandHistory(winnerTeam, winningPlayer, closed);
  if (state.training) {
    trainFromHand(winnerTeam);
    state.brainGames += 1;
    state.epsilon = Math.max(0.04, 0.35 * Math.pow(0.997, state.brainGames));
  }

  const matchWinner = state.scores.findIndex((score) => score >= MATCH_POINTS);
  if (matchWinner !== -1) {
    state.wins[matchWinner] += 1;
    recordMatchResult(matchWinner);
    if (state.humanSeat === null) {
      state.scores = [0, 0];
      state.firstHand = true;
      state.nextStarter = 0;
      startHand(false);
      return;
    }

    state.matchFinished = true;
    state.statusMessage = matchResultMessage(matchWinner, message);
    state.statusKind = resultKindForTeam(matchWinner);
    state.resultType = "match";
    render();
    state.resultTimer = window.setTimeout(() => {
      if (state.matchFinished) startMatch();
    }, resultDelay(25));
    return;
  }

  if (state.training) {
    startHand(false);
    return;
  }

  state.statusMessage = humanResultMessage(winnerTeam, message);
  state.statusKind = resultKindForTeam(winnerTeam);
  state.resultType = "hand";

  render();
  state.resultTimer = window.setTimeout(() => {
    if (!state.training && state.handFinished && !state.matchFinished) startHand();
  }, resultDelay(10));
}

function humanResultMessage(winnerTeam, fallback) {
  if (state.humanSeat === null || winnerTeam === null) return fallback;
  const humanTeam = TEAM_BY_PLAYER[state.humanSeat];
  return winnerTeam === humanTeam ? `VitÃƒÂ³ria! ${fallback}` : `Derrota. ${fallback}`;
}

function matchResultMessage(winnerTeam, handMessage) {
  const base = `Time ${TEAM_NAMES[winnerTeam]} venceu a partida por ${state.scores[winnerTeam]} a ${state.scores[1 - winnerTeam]}. ${handMessage}`;
  if (state.humanSeat === null) return base;
  const humanTeam = TEAM_BY_PLAYER[state.humanSeat];
  if (winnerTeam === humanTeam) return `Grande vitÃƒÂ³ria! Seu time fechou a partida. Nova partida em instantes.`;
  return `Fim de partida. O outro time chegou a ${MATCH_POINTS} pontos. Nova chance em instantes.`;
}

function resultKindForTeam(winnerTeam) {
  if (winnerTeam === null) return "neutral";
  if (state.humanSeat === null) return winnerTeam === 0 ? "team-a-win" : "team-b-win";
  return TEAM_BY_PLAYER[state.humanSeat] === winnerTeam ? "win" : "loss";
}

function chooseBotMove(player) {
  const moves = legalMoves(player);
  if (moves.length === 0) return null;
  if (isRandomAgent(player)) return randomAgentMove(moves);
  if (state.training && Math.random() < state.epsilon) return moves[Math.floor(Math.random() * moves.length)];
  if (isLoboAgent(player)) return chooseLoboMove(player, moves);
  return moves
    .map((move) => ({ move, score: evaluate(state.brains[player], featuresFor(player, move)).value }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function chooseLoboMove(player, moves) {
  const brain = state.brains[player];
  const beliefOutput = loboBeliefOutputFor(player);
  return moves
    .map((move) => ({ move, score: evaluate(brain.lobo, loboFeaturesFor(player, move, beliefOutput)).value }))
    .sort((a, b) => b.score - a.score)[0].move;
}

function randomMove(moves) {
  return moves[Math.floor(Math.random() * moves.length)];
}

function randomAgentMove(moves) {
  const doubleMoves = moves.filter((move) => move.tile.a === move.tile.b);
  return randomMove(doubleMoves.length > 0 ? doubleMoves : moves);
}

function isRandomAgent(player) {
  return agentMode(player) === "random";
}

function isLoboAgent(player) {
  return agentMode(player) === "lobo";
}

function agentMode(player) {
  const value = els.agentModes[player]?.value || "carneiro";
  return value === "trained" ? "carneiro" : value;
}

function syncHumanSeatFromAgents() {
  state.humanSeat = agentMode(0) === "human" ? 0 : null;
  if (state.humanSeat === null) state.selectedTileId = null;
}

function forceAllAgentsTrained() {
  for (const select of els.agentModes) {
    select.value = "carneiro";
  }
  state.humanSeat = null;
  state.selectedTileId = null;
}

function currentAgentModes() {
  return els.agentModes.map((select) => select.value);
}

function agentModeLabel(mode) {
  if (mode === "lobo") return "Lobo";
  if (mode === "carneiro" || mode === "trained") return "Carneiro";
  if (mode === "random") return "Aleatoria";
  if (mode === "human") return "Humano";
  return mode || "Agente";
}

function teamAgentLabel(modes, team) {
  const players = team === 0 ? [0, 2] : [1, 3];
  return players.map((player) => modes?.[player] || agentModeLabel(agentMode(player))).join("+");
}

function recordMatchResult(winnerTeam) {
  const modes = state.matchStartAgentModes || currentAgentModes().map(agentModeLabel);
  const entry = {
    winnerTeam,
    teamA: teamAgentLabel(modes, 0),
    teamB: teamAgentLabel(modes, 1),
    at: Date.now(),
  };
  state.matchHistory.push(entry);
  state.matchHistory = state.matchHistory.slice(-MATCH_HISTORY_LIMIT);
}

function restoreAgentModes(modes) {
  if (!modes) return;
  modes.forEach((mode, index) => {
    els.agentModes[index].value = mode;
  });
}

function setAgentModes(modes) {
  modes.forEach((mode, player) => {
    if (els.agentModes[player]) els.agentModes[player].value = mode;
  });
}

function startTrainingMode() {
  state.agentModesBeforeTraining = currentAgentModes();
  forceAllAgentsTrained();
  state.training = true;
  state.predictionTrainingEnabled = Boolean(els.trainPredictionHistory?.checked);
  state.lastBrainSaveAt = Date.now();
  state.lastBrainTrainingClock = Date.now();
  syncHumanSeatFromAgents();
  startMatch();
}

function stopTrainingMode(restoreAgents = true) {
  saveSelectedBrains(true);
  state.training = false;
  state.predictionTrainingEnabled = false;
  state.lastBrainTrainingClock = 0;
  if (restoreAgents) restoreAgentModes(state.agentModesBeforeTraining);
  state.agentModesBeforeTraining = null;
  syncHumanSeatFromAgents();
}
function featuresFor(player, move) {
  const tile = move.tile;
  const myRemaining = state.hands[player].length - 1;
  const partner = (player + 2) % PLAYERS;
  const next = (player + 1) % PLAYERS;
  const previousOpponent = (player + 3) % PLAYERS;
  const newEnds = previewEnds(move);
  const played = playedNumberStats();
  const playedPresence = playedNumberPresenceStats();
  const handCounts = numberCounts(state.hands[player]);
  const handPresence = numberPresenceCounts(state.hands[player]);
  const handAfterMove = state.hands[player].filter((candidate) => candidate.id !== tile.id);
  const handCountsAfter = numberCounts(handAfterMove);
  const handPresenceAfter = numberPresenceCounts(handAfterMove);
  const visibleOccurrence = sumCountVectors([played.total, handCounts]);
  const visiblePresence = sumCountVectors([playedPresence.total, handPresence]);
  const unseenOccurrence = visibleOccurrence.map((count) => Math.max(0, 8 - count));
  const unseenPresence = visiblePresence.map((count) => Math.max(0, 7 - count));
  const partnerBelief = beliefVectorFor(player, partner, played, playedPresence, handPresence);
  const nextBelief = beliefVectorFor(player, next, played, playedPresence, handPresence);
  const previousOpponentBelief = beliefVectorFor(player, previousOpponent, played, playedPresence, handPresence);
  const partnerCanPlay = likelyCanPlayFromBelief(partnerBelief, newEnds);
  const nextCanPlay = likelyCanPlayFromBelief(nextBelief, newEnds);
  const previousOpponentCanPlay = likelyCanPlayFromBelief(previousOpponentBelief, newEnds);
  const averageOpponentCanPlay = (nextCanPlay + previousOpponentCanPlay) / 2;
  const ownMobilityAfter = countPlayableTiles(handAfterMove, newEnds);
  const ownDiversityAfter = handPresenceAfter.filter(Boolean).length;
  const ownEndMatchAfter = countOwnEndMatches(handAfterMove, newEnds);
  const side = move.side === "left" ? -1 : move.side === "right" ? 1 : 0;
  const leftEnd = newEnds.left ?? 0;
  const rightEnd = newEnds.right ?? leftEnd;
  const inputs = [
    1,
    tile.a === tile.b ? 1 : 0,
    myRemaining === 0 ? 1 : 0,
    myRemaining / 7,
    state.hands[partner].length / 7,
    state.hands[next].length / 7,
    state.hands[previousOpponent].length / 7,
    state.board.length / 28,
    state.scores[TEAM_BY_PLAYER[player]] / MATCH_POINTS,
    state.scores[1 - TEAM_BY_PLAYER[player]] / MATCH_POINTS,
    side,
    move.side === "start" ? 1 : 0,
    state.board.length > 0 &&
    (tile.a === state.leftEnd || tile.b === state.leftEnd) &&
    (tile.a === state.rightEnd || tile.b === state.rightEnd)
      ? 1
      : 0,
    newEnds.left === newEnds.right ? 1 : 0,
    createsExhaustedDoubleEnd(move) ? 1 : 0,
    ownMobilityAfter / 7,
    ownDiversityAfter / 7,
    ownEndMatchAfter / Math.max(1, myRemaining),
    (played.total[leftEnd] || 0) / 8,
    (played.total[rightEnd] || 0) / 8,
    partnerCanPlay,
    nextCanPlay,
    previousOpponentCanPlay,
    averageOpponentCanPlay,
    partnerCanPlay - averageOpponentCanPlay,
    (unseenPresence[leftEnd] || 0) / 7,
    (unseenPresence[rightEnd] || 0) / 7,
    Math.max(countPlayedNonDoublesFor(leftEnd, tile), countPlayedNonDoublesFor(rightEnd, tile)) / 6,
  ];

  inputs.push(...oneHotNumber(tile.a));
  inputs.push(...oneHotNumber(tile.b));
  inputs.push(...oneHotNumber(newEnds.left));
  inputs.push(...oneHotNumber(newEnds.right));
  inputs.push(...handCounts.map((count) => count / 8));
  inputs.push(...handPresence.map((count) => count / 7));
  inputs.push(...handCountsAfter.map((count) => count / 8));
  inputs.push(...handPresenceAfter.map((count) => count / 7));
  inputs.push(...played.total.map((count) => count / 8));
  inputs.push(...playedPresence.total.map((count) => count / 7));
  inputs.push(...unseenOccurrence.map((count) => count / 8));
  inputs.push(...unseenPresence.map((count) => count / 7));
  inputs.push(...played.byPlayer[player].map((count) => count / 8));
  inputs.push(...played.byPlayer[partner].map((count) => count / 8));
  inputs.push(...played.byPlayer[next].map((count) => count / 8));
  inputs.push(...played.byPlayer[previousOpponent].map((count) => count / 8));
  inputs.push(...signalVector(partner, "passes"));
  inputs.push(...signalVector(next, "passes"));
  inputs.push(...signalVector(previousOpponent, "passes"));
  inputs.push(...signalVector(partner, "avoids"));
  inputs.push(...signalVector(next, "avoids"));
  inputs.push(...signalVector(previousOpponent, "avoids"));
  inputs.push(...partnerBelief);
  inputs.push(...nextBelief);
  inputs.push(...previousOpponentBelief);

  return fitInputs(inputs);
}

function loboFeaturesFor(player, move, beliefOutput = loboBeliefOutputFor(player)) {
  const baseFeatures = featuresFor(player, move);
  const newEnds = previewEnds(move);
  const partner = (player + 2) % PLAYERS;
  const next = (player + 1) % PLAYERS;
  const previousOpponent = (player + 3) % PLAYERS;
  const handAfterMove = state.hands[player].filter((candidate) => candidate.id !== move.tile.id);
  const ownAfter = numberPresenceCounts(handAfterMove);
  const partnerBelief = beliefNumberSlice(beliefOutput, partner);
  const nextBelief = beliefNumberSlice(beliefOutput, next);
  const previousOpponentBelief = beliefNumberSlice(beliefOutput, previousOpponent);
  const partnerCanPlay = likelyCanPlayFromBelief(partnerBelief, newEnds);
  const nextCanPlay = likelyCanPlayFromBelief(nextBelief, newEnds);
  const previousOpponentCanPlay = likelyCanPlayFromBelief(previousOpponentBelief, newEnds);
  const opponentCanPlay = (nextCanPlay + previousOpponentCanPlay) / 2;
  const ownCanContinue = countPlayableTiles(handAfterMove, newEnds) / 7;
  const ownConnected = handConnectivityScore(handAfterMove);
  const ownEndCoverage =
    newEnds.left === newEnds.right
      ? ownAfter[newEnds.left] / 7
      : ((ownAfter[newEnds.left] || 0) + (ownAfter[newEnds.right] || 0)) / 7;
  const tileRarity = tileRarityScore(move.tile);
  const doubleRisk = trappedDoubleRisk(handAfterMove, newEnds);
  const loboExtras = [
    partnerCanPlay,
    nextCanPlay,
    previousOpponentCanPlay,
    opponentCanPlay,
    partnerCanPlay - opponentCanPlay,
    ownCanContinue,
    ownConnected,
    ownEndCoverage,
    tileRarity,
    doubleRisk,
    createsExhaustedDoubleEnd(move) ? 1 : 0,
    moveLeavesOwnHandDead(handAfterMove, newEnds) ? 1 : 0,
    state.consecutivePasses / PLAYERS,
    state.scores[TEAM_BY_PLAYER[player]] / MATCH_POINTS,
    state.scores[1 - TEAM_BY_PLAYER[player]] / MATCH_POINTS,
    state.hands[player].length / 7,
    state.board.length / 28,
  ];
  return fitLoboInputs([...baseFeatures, ...loboBeliefSummary(player, move, beliefOutput, newEnds), ...loboExtras]);
}

function loboBeliefOutputFor(player) {
  return evaluateBelief(state.brains[player].belief, liveBeliefInputsFor(player)).outputs;
}

function loboBeliefSummary(player, move, beliefOutput, ends = previewEnds(move)) {
  const partner = (player + 2) % PLAYERS;
  const next = (player + 1) % PLAYERS;
  const previousOpponent = (player + 3) % PLAYERS;
  const players = [player, partner, next, previousOpponent];
  const numbers = openEndNumbers(ends);
  const tile = move.tile;
  const numberSummary = players.flatMap((target) => {
    const belief = beliefNumberSlice(beliefOutput, target);
    const left = ends.left === null || ends.left === undefined ? 1 : belief[ends.left] || 0;
    const right = ends.right === null || ends.right === undefined ? 1 : belief[ends.right] || 0;
    const tileA = belief[tile.a] || 0;
    const tileB = belief[tile.b] || 0;
    const bestEnd = numbers.length ? Math.max(...numbers.map((number) => belief[number] || 0)) : 1;
    const averageStrength = belief.reduce((sum, value) => sum + value, 0) / 7;
    return [left, right, bestEnd, tileA, tileB, averageStrength];
  });
  const tileSummary = [partner, next, previousOpponent].map((target) => beliefTileChance(beliefOutput, target, tile.id));
  const partnerEnd = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, partner), ends);
  const nextEnd = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, next), ends);
  const previousEnd = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, previousOpponent), ends);
  const opponentEnd = (nextEnd + previousEnd) / 2;
  return fitLoboBeliefSummary([
    ...numberSummary,
    ...tileSummary,
    partnerEnd,
    nextEnd,
    previousEnd,
    opponentEnd,
    partnerEnd - opponentEnd,
    beliefTileChance(beliefOutput, player, tile.id),
    Math.max(0, opponentEnd - partnerEnd),
  ]);
}

function beliefTileChance(output, player, tileId) {
  const index = TILE_IDS.indexOf(tileId);
  if (index === -1) return 0;
  return output[PLAYERS * 7 + player * TILE_IDS.length + index] || 0;
}

function liveBeliefInputsFor(observer) {
  const snapshot = publicSnapshot();
  const ends = snapshot.ends || {};
  const played = snapshot.playedNumberStats || { total: Array(7).fill(0) };
  const unseen = snapshot.unseenNumberCounts || Array(7).fill(8);
  const observerHand = state.hands[observer] || [];
  const ownCounts = numberCounts(observerHand);
  const ownTiles = tilePresenceVector(observerHand);
  const knownMissing = state.handHistory
    ? activeKnownMissingVector(state.handHistory, state.handHistory.turns.length)
    : Array(PLAYERS * 7).fill(0);
  return fitBeliefInputs([
    ...oneHot(observer, PLAYERS),
    ...oneHot(snapshot.current ?? observer, PLAYERS),
    snapshot.scores[0] / MATCH_POINTS,
    snapshot.scores[1] / MATCH_POINTS,
    ...snapshot.handCounts.map((count) => count / 7),
    ...oneHotNumberOrEmpty(ends.left),
    ...oneHotNumberOrEmpty(ends.right),
    snapshot.board.length / 28,
    ...stageVector(snapshot.stage),
    ...played.total.map((count) => count / 8),
    ...unseen.map((count) => count / 8),
    ...snapshot.publicSignals.flatMap((signals) => [
      ...signals.passes.map((value) => Math.min(1, value / 4)),
      ...signals.avoids.map((value) => Math.min(1, value / 4)),
    ]),
    ...knownMissing,
    ...ownCounts.map((count) => count / 7),
    ...ownTiles,
  ]);
}

function beliefNumberSlice(output, player) {
  const start = player * 7;
  return output.slice(start, start + 7);
}

function handConnectivityScore(hand) {
  if (hand.length <= 1) return 1;
  const presence = numberPresenceCounts(hand);
  const activeNumbers = presence.filter(Boolean).length;
  const totalPresence = presence.reduce((sum, count) => sum + count, 0);
  return clamp(totalPresence / Math.max(1, activeNumbers * hand.length), 0, 1);
}

function tileRarityScore(tile) {
  const played = playedNumberPresenceStats().total;
  const aRarity = (played[tile.a] || 0) / 7;
  const bRarity = (played[tile.b] || 0) / 7;
  return tile.a === tile.b ? aRarity : (aRarity + bRarity) / 2;
}

function trappedDoubleRisk(hand, ends) {
  const doubles = hand.filter((tile) => tile.a === tile.b);
  if (doubles.length === 0) return 0;
  const blocked = doubles.filter((tile) => ends.left !== tile.a && ends.right !== tile.a).length;
  return blocked / doubles.length;
}

function moveLeavesOwnHandDead(hand, ends) {
  return hand.length > 0 && countPlayableTiles(hand, ends) === 0;
}

function oneHotNumber(value) {
  return Array.from({ length: 7 }, (_, number) => (number === value ? 1 : 0));
}

function numberCounts(tiles) {
  const counts = Array(7).fill(0);
  for (const tile of tiles) {
    counts[tile.a] += 1;
    counts[tile.b] += 1;
  }
  return counts;
}

function numberPresenceCounts(tiles) {
  const counts = Array(7).fill(0);
  for (const tile of tiles) {
    counts[tile.a] += 1;
    if (tile.b !== tile.a) counts[tile.b] += 1;
  }
  return counts;
}

function playedNumberStats() {
  const byPlayer = Array.from({ length: PLAYERS }, () => Array(7).fill(0));
  const total = Array(7).fill(0);
  for (const tile of state.board) {
    byPlayer[tile.owner][tile.a] += 1;
    byPlayer[tile.owner][tile.b] += 1;
    total[tile.a] += 1;
    total[tile.b] += 1;
  }
  return { byPlayer, total };
}

function playedNumberPresenceStats() {
  const byPlayer = Array.from({ length: PLAYERS }, () => Array(7).fill(0));
  const total = Array(7).fill(0);
  for (const tile of state.board) {
    byPlayer[tile.owner][tile.a] += 1;
    total[tile.a] += 1;
    if (tile.b !== tile.a) {
      byPlayer[tile.owner][tile.b] += 1;
      total[tile.b] += 1;
    }
  }
  return { byPlayer, total };
}

function sumCountVectors(vectors) {
  return vectors.reduce(
    (sum, vector) => sum.map((value, index) => value + vector[index]),
    Array(7).fill(0),
  );
}

function beliefVectorFor(observer, target, played, playedPresence, observerHandPresence) {
  if (observer === target || state.hands[target].length === 0) return Array(7).fill(0);
  const signals = state.publicSignals[target];
  return Array.from({ length: 7 }, (_, number) => {
    if (signals.passes[number] > 0) return 0;
    const unseenPresence = Math.max(0, 7 - playedPresence.total[number] - observerHandPresence[number]) / 7;
    const remainingPressure = state.hands[target].length / 7;
    const playedHint = Math.min(0.25, played.byPlayer[target][number] * 0.05);
    const avoidPenalty = Math.min(0.55, signals.avoids[number] * 0.12);
    return clamp(unseenPresence * (0.25 + remainingPressure) + playedHint - avoidPenalty, 0, 1);
  });
}

function likelyCanPlayFromBelief(belief, ends) {
  if (ends.left === null || ends.left === undefined) return 1;
  if (ends.left === ends.right) return belief[ends.left] || 0;
  const leftChance = belief[ends.left] || 0;
  const rightChance = belief[ends.right] || 0;
  return 1 - (1 - leftChance) * (1 - rightChance);
}

function signalVector(player, key) {
  return state.publicSignals[player][key].map((value) => Math.min(1, value / 4));
}

function countPlayableTiles(tiles, ends) {
  return tiles.filter((tile) => canTilePlayEnds(tile, ends)).length;
}

function countOwnEndMatches(tiles, ends) {
  if (ends.left === null || ends.left === undefined) return 0;
  return tiles.reduce((sum, tile) => {
    const left = tileHasNumber(tile, ends.left) ? 1 : 0;
    const right = ends.right !== ends.left && tileHasNumber(tile, ends.right) ? 1 : 0;
    return sum + left + right;
  }, 0);
}

function fitInputs(inputs) {
  if (inputs.length === INPUT_SIZE) return inputs;
  if (inputs.length > INPUT_SIZE) return inputs.slice(0, INPUT_SIZE);
  return [...inputs, ...Array(INPUT_SIZE - inputs.length).fill(0)];
}

function fitLoboInputs(inputs) {
  if (inputs.length === LOBO_INPUT_SIZE) return inputs;
  if (inputs.length > LOBO_INPUT_SIZE) return inputs.slice(0, LOBO_INPUT_SIZE);
  return [...inputs, ...Array(LOBO_INPUT_SIZE - inputs.length).fill(0)];
}

function fitLoboBeliefSummary(inputs) {
  if (inputs.length === LOBO_BELIEF_SUMMARY_SIZE) return inputs;
  if (inputs.length > LOBO_BELIEF_SUMMARY_SIZE) return inputs.slice(0, LOBO_BELIEF_SUMMARY_SIZE);
  return [...inputs, ...Array(LOBO_BELIEF_SUMMARY_SIZE - inputs.length).fill(0)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function previewEnds(move) {
  if (state.board.length === 0) return { left: move.tile.a, right: move.tile.b };
  if (move.side === "left") {
    return { left: move.tile.a === state.leftEnd ? move.tile.b : move.tile.a, right: state.rightEnd };
  }
  return { left: state.leftEnd, right: move.tile.a === state.rightEnd ? move.tile.b : move.tile.a };
}

function evaluate(brain, inputs) {
  const activations = [inputs];
  const preActivations = [];
  let current = inputs;

  for (let layerIndex = 0; layerIndex < brain.layers.length; layerIndex += 1) {
    const layer = brain.layers[layerIndex];
    const z = layer.biases.map((bias, neuron) => {
      return bias + layer.weights[neuron].reduce((sum, weight, inputIndex) => sum + weight * current[inputIndex], 0);
    });
    preActivations.push(z);
    current = layerIndex === brain.layers.length - 1 ? z : z.map(Math.tanh);
    activations.push(current);
  }

  return { value: current[0], activations, preActivations };
}

function rememberDecision(player, move) {
  const mode = agentMode(player);
  const features = mode === "lobo" ? loboFeaturesFor(player, move) : featuresFor(player, move);
  const network = mode === "lobo" ? state.brains[player].lobo : state.brains[player];
  const evaluation = evaluate(network, features);
  state.decisions.push({
    player,
    team: TEAM_BY_PLAYER[player],
    mode,
    features,
    immediateReward: mode === "lobo" ? loboMoveHeuristicReward(player, move) : moveHeuristicReward(player, move),
    value: evaluation.value,
  });
}

function trainFromHand(winnerTeam) {
  const trainedPlayers = new Set();
  trainCarneiroDecisions(winnerTeam, trainedPlayers);
  for (const player of trainedPlayers) {
    state.brains[player].roundsTrained = (state.brains[player].roundsTrained || 0) + 1;
    state.brains[player].treinosRealizados = state.brains[player].roundsTrained;
  }
  if (state.predictionTrainingEnabled) trainBeliefFromHandHistory(state.lastHandHistory);
}

function trainCarneiroDecisions(winnerTeam, trainedPlayers) {
  for (let index = 0; index < state.decisions.length; index += 1) {
    const decision = state.decisions[index];
    if (decision.mode === "lobo") continue;
    const finalReward = winnerTeam === null ? -0.3 : decision.team === winnerTeam ? 1 : -1;
    const distanceFromEnd = state.decisions.length - 1 - index;
    const discount = 0.55 + 0.45 * Math.pow(GAMMA, Math.min(6, distanceFromEnd));
    const target = clamp(finalReward * discount + decision.immediateReward, -1.25, 1.25);
    trainNetwork(state.brains[decision.player], decision.features, target);
    state.brains[decision.player].games = (state.brains[decision.player].games || 0) + 1;
    trainedPlayers.add(decision.player);
  }
}

function trainLoboDecisions(winnerTeam, trainedPlayers) {
  const loboDecisions = state.decisions.filter((decision) => decision.mode === "lobo");
  for (let index = 0; index < loboDecisions.length; index += 1) {
    const decision = loboDecisions[index];
    const nextTeamDecision = loboDecisions.slice(index + 1).find((candidate) => candidate.team === decision.team);
    const finalReward = winnerTeam === null ? -0.25 : decision.team === winnerTeam ? 1 : -1;
    const terminal = !nextTeamDecision;
    const reward = terminal ? finalReward : decision.immediateReward;
    const bootstrap = terminal ? 0 : nextTeamDecision.value;
    const target = clamp(reward + GAMMA * bootstrap, -1.25, 1.25);
    const before = evaluate(state.brains[decision.player].lobo, decision.features).value;
    trainValueNetwork(state.brains[decision.player].lobo, decision.features, target, LOBO_LEARNING_RATE);
    updateLoboStats(state.brains[decision.player], Math.abs(target - before), before);
    state.brains[decision.player].games = (state.brains[decision.player].games || 0) + 1;
    trainedPlayers.add(decision.player);
  }
}

function trainBeliefFromHandHistory(history) {
  if (!history || !history.privateTruth?.initialHands || history.turns.length === 0) return;
  for (let turnIndex = 0; turnIndex < history.turns.length; turnIndex += 1) {
    const handsAtTurn = handsAtHistoryTurn(history, turnIndex);
    for (let observer = 0; observer < PLAYERS; observer += 1) {
      if (!isTrainableAgent(observer)) continue;
      const inputs = beliefInputsForHistoryTurn(history, turnIndex, observer, handsAtTurn[observer]);
      const target = beliefTargetFromHands(handsAtTurn);
      const result = trainBeliefNetwork(state.brains[observer].belief, inputs, target);
      updateBeliefStats(state.brains[observer], result);
    }
  }
}

function isTrainableAgent(player) {
  const mode = agentMode(player);
  return mode === "carneiro" || mode === "lobo";
}

function handsAtHistoryTurn(history, turnIndex) {
  const hands = cloneHands(history.privateTruth.initialHands);
  for (let i = 0; i < turnIndex; i += 1) {
    const turn = history.turns[i];
    if (turn.type !== "move") continue;
    const hand = hands[turn.player];
    const index = hand.findIndex((tile) => tile.id === turn.move.tile.id);
    if (index !== -1) hand.splice(index, 1);
  }
  return hands;
}

function beliefInputsForHistoryTurn(history, turnIndex, observer, observerHand) {
  const turn = history.turns[turnIndex];
  const snapshot = turn.before;
  const ends = snapshot.ends || {};
  const played = snapshot.playedNumberStats || { total: Array(7).fill(0) };
  const unseen = snapshot.unseenNumberCounts || Array(7).fill(8);
  const ownCounts = numberCounts(observerHand);
  const ownTiles = tilePresenceVector(observerHand);
  const knownMissing = activeKnownMissingVector(history, turnIndex);
  return fitBeliefInputs([
    ...oneHot(observer, PLAYERS),
    ...oneHot(snapshot.current ?? turn.player, PLAYERS),
    snapshot.scores[0] / MATCH_POINTS,
    snapshot.scores[1] / MATCH_POINTS,
    ...snapshot.handCounts.map((count) => count / 7),
    ...oneHotNumberOrEmpty(ends.left),
    ...oneHotNumberOrEmpty(ends.right),
    snapshot.board.length / 28,
    ...stageVector(snapshot.stage),
    ...played.total.map((count) => count / 8),
    ...unseen.map((count) => count / 8),
    ...snapshot.publicSignals.flatMap((signals) => [
      ...signals.passes.map((value) => Math.min(1, value / 4)),
      ...signals.avoids.map((value) => Math.min(1, value / 4)),
    ]),
    ...knownMissing,
    ...ownCounts.map((count) => count / 7),
    ...ownTiles,
  ]);
}

function beliefTargetFromHands(hands) {
  return [
    ...hands.flatMap((hand) => numberPresenceCounts(hand)),
    ...hands.flatMap((hand) => tilePresenceVector(hand)),
  ];
}

function tilePresenceVector(hand) {
  const ids = new Set(hand.map((tile) => tile.id));
  return TILE_IDS.map((id) => (ids.has(id) ? 1 : 0));
}

function activeKnownMissingVector(history, turnIndex) {
  return history.knownMissingNumbers.flatMap((playerEntries) =>
    playerEntries.map((entries) =>
      entries.some((entry) => entry.fromTurn <= turnIndex && (entry.untilTurn === null || entry.untilTurn > turnIndex)) ? 1 : 0,
    ),
  );
}

function fitBeliefInputs(inputs) {
  if (inputs.length === BELIEF_INPUT_SIZE) return inputs;
  if (inputs.length > BELIEF_INPUT_SIZE) return inputs.slice(0, BELIEF_INPUT_SIZE);
  return [...inputs, ...Array(BELIEF_INPUT_SIZE - inputs.length).fill(0)];
}

function oneHot(index, size) {
  return Array.from({ length: size }, (_, i) => (i === index ? 1 : 0));
}

function oneHotNumberOrEmpty(number) {
  return Array.from({ length: 7 }, (_, i) => (number === i ? 1 : 0));
}

function stageVector(stage) {
  return [stage === "inicio" ? 1 : 0, stage === "meio" ? 1 : 0, stage === "fim" ? 1 : 0];
}

function evaluateBelief(network, inputs) {
  const activations = [inputs];
  const preActivations = [];
  let current = inputs;
  for (let layerIndex = 0; layerIndex < network.layers.length; layerIndex += 1) {
    const layer = network.layers[layerIndex];
    const z = layer.biases.map((bias, neuron) => {
      return bias + layer.weights[neuron].reduce((sum, weight, inputIndex) => sum + weight * current[inputIndex], 0);
    });
    preActivations.push(z);
    current = layerIndex === network.layers.length - 1 ? z.map(sigmoid) : z.map(Math.tanh);
    activations.push(current);
  }
  return { outputs: current, activations, preActivations };
}

function trainBeliefNetwork(network, inputs, target) {
  const evaluation = evaluateBelief(network, inputs);
  const layers = network.layers;
  const output = evaluation.outputs;
  const outputDelta = output.map((prediction, index) => {
    const error = prediction - target[index];
    return error * prediction * (1 - prediction);
  });
  const deltas = [outputDelta];
  for (let layerIndex = layers.length - 2; layerIndex >= 0; layerIndex -= 1) {
    const layerOutput = evaluation.activations[layerIndex + 1];
    const nextLayer = layers[layerIndex + 1];
    const nextDelta = deltas[0];
    const delta = layerOutput.map((value, neuron) => {
      const downstream = nextDelta.reduce((sum, nextValue, nextNeuron) => {
        return sum + nextLayer.weights[nextNeuron][neuron] * nextValue;
      }, 0);
      return downstream * (1 - value * value);
    });
    deltas.unshift(delta);
  }
  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const inputActivation = evaluation.activations[layerIndex];
    for (let neuron = 0; neuron < layer.weights.length; neuron += 1) {
      const clippedDelta = clamp(deltas[layerIndex][neuron], -2, 2);
      for (let inputIndex = 0; inputIndex < layer.weights[neuron].length; inputIndex += 1) {
        layer.weights[neuron][inputIndex] -= BELIEF_LEARNING_RATE * clippedDelta * inputActivation[inputIndex];
      }
      layer.biases[neuron] -= BELIEF_LEARNING_RATE * clippedDelta;
    }
  }
  return beliefMetrics(output, target);
}

function beliefMetrics(output, target) {
  let absoluteError = 0;
  let numberCorrect = 0;
  let tileCorrect = 0;
  let positiveError = 0;
  let positiveTotal = 0;
  const counts = {
    number: { tp: 0, fp: 0, fn: 0 },
    tile: { tp: 0, fp: 0, fn: 0 },
  };
  for (let i = 0; i < output.length; i += 1) {
    absoluteError += Math.abs(output[i] - target[i]);
    const predicted = output[i] >= 0.5;
    const actual = target[i] >= 0.5;
    const correct = predicted === actual;
    const group = i < PLAYERS * 7 ? counts.number : counts.tile;
    if (actual) {
      positiveError += Math.abs(output[i] - target[i]);
      positiveTotal += 1;
    }
    if (predicted && actual) group.tp += 1;
    else if (predicted && !actual) group.fp += 1;
    else if (!predicted && actual) group.fn += 1;
    if (i < PLAYERS * 7) numberCorrect += correct ? 1 : 0;
    else tileCorrect += correct ? 1 : 0;
  }
  const numberTotal = PLAYERS * 7;
  const tileTotal = PLAYERS * TILE_IDS.length;
  const mae = absoluteError / output.length;
  const numberPrecision = safeRatio(counts.number.tp, counts.number.tp + counts.number.fp);
  const numberRecall = safeRatio(counts.number.tp, counts.number.tp + counts.number.fn);
  const tilePrecision = safeRatio(counts.tile.tp, counts.tile.tp + counts.tile.fp);
  const tileRecall = safeRatio(counts.tile.tp, counts.tile.tp + counts.tile.fn);
  return {
    loss: mae,
    closeness: clamp(1 - mae, 0, 1),
    numberAccuracy: numberCorrect / numberTotal,
    tileAccuracy: tileCorrect / tileTotal,
    numberPrecision,
    numberRecall,
    tilePrecision,
    tileRecall,
    positiveCloseness: positiveTotal ? clamp(1 - positiveError / positiveTotal, 0, 1) : 0,
  };
}

function safeRatio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function updateBeliefStats(brain, result) {
  brain.beliefStats = normalizeBeliefStats(brain.beliefStats);
  const stats = brain.beliefStats;
  stats.trainSteps += 1;
  stats.lastLoss = result.loss;
  stats.avgLoss = stats.trainSteps === 1 ? result.loss : stats.avgLoss * 0.985 + result.loss * 0.015;
  stats.numberAccuracy = stats.numberAccuracy * 0.985 + result.numberAccuracy * 0.015;
  stats.tileAccuracy = stats.tileAccuracy * 0.985 + result.tileAccuracy * 0.015;
  if (!stats.positiveMetricsReady) {
    stats.numberPrecision = result.numberPrecision;
    stats.numberRecall = result.numberRecall;
    stats.tilePrecision = result.tilePrecision;
    stats.tileRecall = result.tileRecall;
    stats.positiveCloseness = result.positiveCloseness;
    stats.positiveMetricsReady = true;
  } else {
    stats.numberPrecision = stats.numberPrecision * 0.985 + result.numberPrecision * 0.015;
    stats.numberRecall = stats.numberRecall * 0.985 + result.numberRecall * 0.015;
    stats.tilePrecision = stats.tilePrecision * 0.985 + result.tilePrecision * 0.015;
    stats.tileRecall = stats.tileRecall * 0.985 + result.tileRecall * 0.015;
    stats.positiveCloseness = stats.positiveCloseness * 0.985 + result.positiveCloseness * 0.015;
  }
  stats.closeness = stats.closeness * 0.985 + result.closeness * 0.015;
  if (stats.baselineCloseness === null && stats.trainSteps >= 12) {
    stats.baselineCloseness = stats.closeness;
  }
  stats.bestCloseness = Math.max(stats.bestCloseness || 0, stats.closeness);
  if (stats.trainSteps % 12 === 0) {
    stats.history.push({
      step: stats.trainSteps,
      closeness: Number(stats.closeness.toFixed(4)),
      avgLoss: Number(stats.avgLoss.toFixed(4)),
      numberRecall: Number(stats.numberRecall.toFixed(4)),
      tileRecall: Number(stats.tileRecall.toFixed(4)),
      positiveCloseness: Number(stats.positiveCloseness.toFixed(4)),
    });
    stats.history = stats.history.slice(-BELIEF_HISTORY_LIMIT);
  }
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function moveHeuristicReward(player, move) {
  const partner = (player + 2) % PLAYERS;
  const next = (player + 1) % PLAYERS;
  const previousOpponent = (player + 3) % PLAYERS;
  const newEnds = previewEnds(move);
  const played = playedNumberStats();
  const playedPresence = playedNumberPresenceStats();
  const handPresence = numberPresenceCounts(state.hands[player]);
  const handAfterMove = state.hands[player].filter((candidate) => candidate.id !== move.tile.id);
  const partnerCanPlay = likelyCanPlayFromBelief(
    beliefVectorFor(player, partner, played, playedPresence, handPresence),
    newEnds,
  );
  const nextCanPlay = likelyCanPlayFromBelief(beliefVectorFor(player, next, played, playedPresence, handPresence), newEnds);
  const previousOpponentCanPlay = likelyCanPlayFromBelief(
    beliefVectorFor(player, previousOpponent, played, playedPresence, handPresence),
    newEnds,
  );
  const ownMobility = countPlayableTiles(handAfterMove, newEnds) / 7;
  const averageOpponentCanPlay = (nextCanPlay + previousOpponentCanPlay) / 2;
  const teamPressure = partnerCanPlay - averageOpponentCanPlay;
  const opponentPassPressure = 1 - averageOpponentCanPlay;
  const endgamePressure = (8 - state.hands[player].length) / 7;
  const finishingBonus = state.hands[player].length === 1 ? 0.32 : 0;
  const doublePush = move.tile.a === move.tile.b ? 0.025 : 0;
  const danger =
    (createsExhaustedDoubleEnd(move) ? 0.28 : 0) +
    (ownMobility === 0 && handAfterMove.length > 0 ? 0.16 : 0) +
    (closesTableForEveryone(move, player) ? 0.22 : 0);
  const reward =
    opponentPassPressure * 0.1 * rewardFactor(player, "pass") +
    (Math.max(0, teamPressure) * 0.14 + partnerCanPlay * 0.035) * rewardFactor(player, "partner") +
    (finishingBonus + endgamePressure * 0.045 + doublePush) * rewardFactor(player, "aggression") +
    ownMobility * 0.1 * rewardFactor(player, "mobility") -
    danger * rewardFactor(player, "safety");
  return clamp(reward, -0.45, 0.55);
}

function loboMoveHeuristicReward(player, move) {
  const newEnds = previewEnds(move);
  const partner = (player + 2) % PLAYERS;
  const next = (player + 1) % PLAYERS;
  const previousOpponent = (player + 3) % PLAYERS;
  const beliefOutput = evaluateBelief(state.brains[player].belief, liveBeliefInputsFor(player)).outputs;
  const partnerCanPlay = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, partner), newEnds);
  const nextCanPlay = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, next), newEnds);
  const previousOpponentCanPlay = likelyCanPlayFromBelief(beliefNumberSlice(beliefOutput, previousOpponent), newEnds);
  const handAfterMove = state.hands[player].filter((candidate) => candidate.id !== move.tile.id);
  const ownMobility = countPlayableTiles(handAfterMove, newEnds) / 7;
  const averageOpponentCanPlay = (nextCanPlay + previousOpponentCanPlay) / 2;
  const finishingBonus = handAfterMove.length === 0 ? 0.35 : 0;
  const doubleRelief = move.tile.a === move.tile.b ? 0.04 : 0;
  const pressure = (1 - averageOpponentCanPlay) * 0.12 * rewardFactor(player, "pass");
  const partnership = Math.max(0, partnerCanPlay - averageOpponentCanPlay) * 0.14 * rewardFactor(player, "partner");
  const mobility = ownMobility * 0.1 * rewardFactor(player, "mobility");
  const safetyPenalty =
    ((createsExhaustedDoubleEnd(move) ? 0.24 : 0) +
      (moveLeavesOwnHandDead(handAfterMove, newEnds) ? 0.14 : 0) +
      trappedDoubleRisk(handAfterMove, newEnds) * 0.12) *
    rewardFactor(player, "safety");
  return clamp(pressure + partnership + mobility + finishingBonus + doubleRelief - safetyPenalty, -0.45, 0.55);
}

function rewardOpponentPassOutcome(passingPlayer) {
  const passingTeam = TEAM_BY_PLAYER[passingPlayer];
  for (let i = state.decisions.length - 1; i >= 0; i -= 1) {
    const decision = state.decisions[i];
    if (decision.team !== passingTeam) {
      decision.immediateReward = clamp(
        decision.immediateReward + 0.08 * rewardFactor(decision.player, "pass"),
        -0.5,
        0.6,
      );
      return;
    }
  }
}

function rewardFactor(player, key) {
  return clamp((state.rewardProfiles[player]?.[key] ?? 50) / 50, 0, 2);
}

function trainNetwork(brain, inputs, target) {
  trainValueNetwork(brain, inputs, target, LEARNING_RATE);
}

function trainValueNetwork(network, inputs, target, learningRate) {
  const evaluation = evaluate(network, inputs);
  const layers = network.layers;
  let deltas = [[evaluation.value - target]];

  for (let layerIndex = layers.length - 2; layerIndex >= 0; layerIndex -= 1) {
    const nextLayer = layers[layerIndex + 1];
    const nextDelta = deltas[0];
    const activation = evaluation.activations[layerIndex + 1];
    const delta = activation.map((value, neuron) => {
      const downstream = nextDelta.reduce((sum, nextValue, nextNeuron) => {
        return sum + nextLayer.weights[nextNeuron][neuron] * nextValue;
      }, 0);
      return downstream * (1 - value * value);
    });
    deltas.unshift(delta);
  }

  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const inputActivation = evaluation.activations[layerIndex];
    for (let neuron = 0; neuron < layer.weights.length; neuron += 1) {
      const clippedDelta = Math.max(-2, Math.min(2, deltas[layerIndex][neuron]));
      for (let inputIndex = 0; inputIndex < layer.weights[neuron].length; inputIndex += 1) {
        layer.weights[neuron][inputIndex] -= learningRate * clippedDelta * inputActivation[inputIndex];
      }
      layer.biases[neuron] -= learningRate * clippedDelta;
    }
  }
}

function updateLoboStats(brain, tdError, value) {
  brain.loboStats = normalizeLoboStats(brain.loboStats);
  const stats = brain.loboStats;
  stats.trainSteps += 1;
  stats.lastTdError = tdError;
  stats.avgTdError = stats.trainSteps === 1 ? tdError : stats.avgTdError * 0.985 + tdError * 0.015;
  stats.valueMean = stats.valueMean * 0.985 + value * 0.015;
  if (stats.trainSteps % 12 === 0) {
    stats.history.push({
      step: stats.trainSteps,
      avgTdError: Number(stats.avgTdError.toFixed(4)),
      valueMean: Number(stats.valueMean.toFixed(4)),
    });
    stats.history = stats.history.slice(-BELIEF_HISTORY_LIMIT);
  }
}

function stepBot(renderAfter = true) {
  if (state.humanSeat === state.current && !state.training) return;
  if (state.handFinished || state.matchFinished) return;
  const player = state.current;
  const move = chooseBotMove(player);
  if (move) {
    if (state.training && !isRandomAgent(player)) rememberDecision(player, move);
    playMove(player, move);
  } else {
    passTurn();
  }
  if (renderAfter) render();
}

function scheduleBots() {
  clearBotTimer();
  if (state.handFinished || state.matchFinished) return;
  if (state.training) {
    requestAnimationFrame(trainFast);
    return;
  }
  if (state.humanSeat !== state.current) {
    const delay = humanBotDelay();
    state.botTimer = window.setTimeout(() => {
      stepBot();
      scheduleBots();
    }, delay);
  }
}

function humanBotDelay() {
  if (!els.humanSpeed) return DEFAULT_HUMAN_BOT_DELAY_MS;
  const percent = Number(els.humanSpeed.value);
  if (percent <= 0) return 0;
  const points = [
    [0, 0],
    [10, 120],
    [50, 1000],
    [75, 3000],
    [100, 5000],
  ];
  for (let i = 1; i < points.length; i += 1) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (percent <= x2) {
      const t = (percent - x1) / (x2 - x1);
      return Math.round(y1 + (y2 - y1) * easeInOut(t));
    }
  }
  return 5000;
}

function humanBotDelayLabel() {
  const delay = humanBotDelay();
  if (delay === 0) return "mÃƒÂ¡x.";
  if (delay < 1000) return `${delay}ms`;
  return `${(delay / 1000).toFixed(1)}s`;
}

function resultDelay(multiplier) {
  return humanBotDelay() * multiplier;
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function clearBotTimer() {
  if (state.botTimer !== null) {
    window.clearTimeout(state.botTimer);
    state.botTimer = null;
  }
}

function clearResultTimer() {
  if (state.resultTimer !== null) {
    window.clearTimeout(state.resultTimer);
    state.resultTimer = null;
  }
}

function dismissResultOverlay() {
  if (state.humanSeat === null || !state.handFinished || !state.resultType) return;
  clearResultTimer();
  if (state.matchFinished) {
    startMatch();
    return;
  }
  startHand();
}

function trainFast() {
  if (!state.training) return;
  for (let i = 0; i < TRAINING_STEPS_PER_FRAME; i += 1) {
    if (state.humanSeat === state.current) {
      const oldSeat = state.humanSeat;
      state.humanSeat = null;
      stepBot(false);
      state.humanSeat = oldSeat;
    } else {
      stepBot(false);
    }
  }
  saveSelectedBrains(false);
  render();
  requestAnimationFrame(trainFast);
}

function render(message = "") {
  els.scoreA.textContent = state.scores[0];
  els.scoreB.textContent = state.scores[1];
  els.winsA.textContent = state.wins[0];
  els.winsB.textContent = state.wins[1];
  els.hands.textContent = state.handsPlayed;
  els.humanSpeedValue.textContent = humanBotDelayLabel();
  els.trainStart.hidden = state.training;
  els.trainStop.hidden = !state.training;
  renderRewardSliders();
  renderBrainSelectors();
  els.agentModes.forEach((select) => {
    select.disabled = state.training;
  });
  if (els.trainPredictionHistory) els.trainPredictionHistory.disabled = state.training;
  els.handPanel.hidden = state.humanSeat === null;
  renderBrainStats();
  const now = Date.now();
  if (!state.training || now - state.lastLearningDashboardRenderAt >= 1000) {
    renderBeliefDashboard();
    state.lastLearningDashboardRenderAt = now;
  }

  renderPlayers();
  renderBoard();
  renderHumanHand();
  renderHumanActions();
  renderResultOverlay(message || state.statusMessage, state.statusKind);

  if (message || state.statusMessage) {
    els.status.className = `status ${state.statusKind}`;
    els.status.textContent = message || state.statusMessage;
    return;
  }

  els.status.className = "status neutral";
  const moves = legalMoves(state.current);
  const turn = `Vez do jogador ${state.current + 1}`;
  const passText = moves.length === 0 ? " sem jogada" : "";
  els.status.textContent = state.matchFinished ? "Partida encerrada." : `${turn}${passText}.`;
}

function renderResultOverlay(message, kind) {
  const show = state.handFinished && state.humanSeat !== null && message && state.resultType;
  els.resultOverlay.hidden = !show;
  if (!show) {
    els.resultOverlay.innerHTML = "";
    return;
  }

  const isWin = kind === "win";
  const title = state.resultType === "match" ? (isWin ? "Partida vencida" : "Partida perdida") : isWin ? "Rodada vencida" : "Rodada perdida";
  const kicker = state.resultType === "match" ? "Fim da partida" : "Fim da rodada";
  els.resultOverlay.className = `result-overlay ${kind} ${state.resultType}`;
  els.resultOverlay.innerHTML = `
    <div class="result-card">
      <div class="result-glow"></div>
      <div class="result-kicker">${kicker}</div>
      <div class="result-title">${title}</div>
      <div class="result-score">Time A ${state.scores[0]} &times; ${state.scores[1]} Time B</div>
      <div class="result-message">${message}</div>
      <div class="result-timer">${state.resultType === "match" ? "Nova partida em instantes" : "PrÃƒÂ³xima rodada em instantes"}</div>
    </div>
  `;
}

function renderPlayers() {
  for (let i = 0; i < PLAYERS; i += 1) {
    const team = TEAM_BY_PLAYER[i];
    const tablePosition = ["player-bottom", "player-right", "player-top", "player-left"][i];
    els.players[i].className = `player ${tablePosition} player-${i}`;
    els.players[i].classList.toggle("active", i === state.current && !state.handFinished && !state.matchFinished);
    els.players[i].innerHTML = `
      <span class="player-chip">J${i + 1}</span>
      <span class="player-hand-count">
        <span class="tile-count">${state.hands[i].length}</span>
        <span class="mini-domino" aria-hidden="true"><span></span><span></span></span>
      </span>
      ${state.passedPlayers[i] ? '<span class="pass-badge">Passe</span>' : ""}
    `;
  }
}

function renderBrainStats() {
  for (let i = 0; i < PLAYERS; i += 1) {
    els.brainStats[i].hidden = false;
    els.brainCounts[i].textContent = state.brains[i].roundsTrained || 0;
  }
}

function renderBeliefDashboard() {
  if (!els.beliefDashboard) return;
  const bestPlayer = state.brains
    .map((brain, player) => ({ player, stats: normalizeBeliefStats(brain.beliefStats) }))
    .sort((a, b) => b.stats.closeness - a.stats.closeness)[0];
  els.beliefDashboard.innerHTML = `
    ${matchAnalyticsHtml()}
    ${learningDiagnosisHtml()}
    <div class="belief-dashboard-header">
      <div>
        <h2>Rede de previsão</h2>
        <span>mede se cada cérebro está se aproximando da verdade revelada no fim da rodada</span>
      </div>
      <strong>${bestPlayer ? `Melhor agora: J${bestPlayer.player + 1} ${formatPercent(bestPlayer.stats.closeness)}` : ""}</strong>
    </div>
    <div class="belief-card-grid">
      ${state.brains.map((brain, player) => beliefCardHtml(brain, player)).join("")}
    </div>
  `;
}

function learningDiagnosisHtml() {
  const beliefSteps = state.brains.reduce((sum, brain) => sum + (normalizeBeliefStats(brain.beliefStats).trainSteps || 0), 0);
  const avgCloseness = average(state.brains.map((brain) => normalizeBeliefStats(brain.beliefStats).closeness));
  const active = state.training && state.predictionTrainingEnabled;
  const beliefStatus = active
    ? "Histórico e previsão ativos"
    : state.training
      ? "Treino rápido: previsão desligada"
      : "Previsão em espera";
  return `
    <section class="learning-diagnosis" aria-label="Diagnóstico de aprendizado">
      <div>
        <span>${beliefStatus}</span>
        <strong>${formatPercent(avgCloseness)}</strong>
        <em>${beliefSteps} ajustes de previsão</em>
      </div>
      <p>${active ? "Cada rodada gera o histórico privado e corrige a rede preditiva no encerramento." : "O Carneiro está livre do custo de histórico e backpropagation preditivo. Marque a opção antes de iniciar para ativá-los."}</p>
    </section>
  `;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + Number(value), 0) / valid.length;
}

function matchAnalyticsHtml() {
  const last50 = state.matchHistory.slice(-50);
  const last200 = state.matchHistory.slice(-200);
  const a50 = winRateForTeam(last50, 0);
  const b50 = winRateForTeam(last50, 1);
  const a200 = winRateForTeam(last200, 0);
  const b200 = winRateForTeam(last200, 1);
  const last = state.matchHistory[state.matchHistory.length - 1];
  const matchup = last ? `${last.teamA} vs ${last.teamB}` : `${teamAgentLabel(state.matchStartAgentModes, 0)} vs ${teamAgentLabel(state.matchStartAgentModes, 1)}`;
  return `
    <section class="match-analytics" aria-label="Avaliação dos agentes">
      <div class="match-analytics-title">
        <h2>Avaliação em jogo</h2>
        <span>${escapeHtml(matchup)}</span>
      </div>
      <div class="match-analytics-grid">
        ${matchMetricHtml("Time A últimas 50", a50, last50.length)}
        ${matchMetricHtml("Time B últimas 50", b50, last50.length)}
        ${matchMetricHtml("Time A últimas 200", a200, last200.length)}
        ${matchMetricHtml("Time B últimas 200", b200, last200.length)}
      </div>
    </section>
  `;
}

function matchMetricHtml(label, value, sampleSize) {
  const percent = clamp(value, 0, 1) * 100;
  return `
    <div class="match-metric">
      <span>${label}</span>
      <strong>${sampleSize ? `${percent.toFixed(1)}%` : "--"}</strong>
      <i style="--value:${sampleSize ? percent : 0}%"></i>
      <em>${sampleSize} partidas</em>
    </div>
  `;
}

function winRateForTeam(matches, team) {
  if (!matches.length) return 0;
  return matches.filter((match) => match.winnerTeam === team).length / matches.length;
}

function beliefCardHtml(brain, player) {
  const stats = normalizeBeliefStats(brain.beliefStats);
  const history = stats.history.length > 0 ? stats.history : [beliefHistoryPoint(stats)];
  const delta = beliefTrendDelta(stats);
  const trend = beliefTrendLabel(delta);
  const chart = beliefSparklineData(history, "closeness", 900, 116);
  return `
    <article class="belief-card belief-card-${player}">
      <div class="belief-card-title">
        <span class="player-chip">J${player + 1}</span>
        <strong>${escapeHtml(brainBaseName(player))}</strong>
        <em class="${trend.className}">${trend.label}</em>
      </div>
      <div class="belief-headline">
        <strong>${formatPercent(stats.closeness)}</strong>
        <span>${formatSignedPercent(delta)} desde a base</span>
      </div>
      <div class="belief-metrics">
        ${beliefMetricHtml("Erro médio", 1 - stats.avgLoss, true)}
        ${beliefMetricHtml("Números achados", stats.numberRecall)}
        ${beliefMetricHtml("Pedras achadas", stats.tileRecall)}
        ${beliefMetricHtml("Precisão pedras", stats.tilePrecision)}
      </div>
      <div class="belief-chart-wrap">
        <span class="chart-label">Previsão: proximidade com a verdade, média a cada 100 pontos</span>
        <svg class="belief-chart" viewBox="0 0 900 116" role="img" aria-label="Evolução da proximidade J${player + 1}">
          <line x1="6" y1="106" x2="894" y2="106"></line>
          <polyline points="${chart.points}"></polyline>
        </svg>
        <div class="belief-scale">
          <span>${formatPercent(chart.max)}</span>
          <span>${formatPercent(chart.min)}</span>
        </div>
      </div>
      <div class="belief-foot">
        <span>melhor ${formatPercent(stats.bestCloseness || stats.closeness)}</span>
        <span>${stats.trainSteps || 0} ajustes</span>
      </div>
    </article>
  `;
}

function loboLearningLabel(stats) {
  if (!stats.trainSteps) return "Lobo sem treino";
  if (stats.avgTdError < 0.25) return "Lobo estável";
  if (stats.avgTdError < 0.55) return "Lobo aprendendo";
  return "Lobo instável";
}

function beliefMetricHtml(label, value, alreadyCloseness = false) {
  const percent = clamp(value || 0, 0, 1) * 100;
  return `
    <div class="belief-metric">
      <span>${label}</span>
      <strong>${percent.toFixed(1)}%</strong>
      <i class="${alreadyCloseness ? "belief-bar-loss" : ""}" style="--value:${percent}%"></i>
    </div>
  `;
}

function beliefHistoryPoint(stats) {
  return {
    step: stats.trainSteps || 0,
    closeness: stats.closeness || 0,
    avgLoss: stats.avgLoss || 1,
    numberRecall: stats.numberRecall || 0,
    tileRecall: stats.tileRecall || 0,
    positiveCloseness: stats.positiveCloseness || 0,
  };
}

function beliefTrendDelta(stats) {
  const baseline = Number.isFinite(Number(stats.baselineCloseness))
    ? Number(stats.baselineCloseness)
    : Number(stats.history[0]?.closeness ?? stats.closeness ?? 0);
  return (stats.closeness || 0) - baseline;
}

function beliefTrendLabel(delta) {
  if (delta > 0.015) return { label: "subindo", className: "belief-trend-up" };
  if (delta < -0.015) return { label: "caindo", className: "belief-trend-down" };
  return { label: "estável", className: "belief-trend-flat" };
}

function beliefSparklineData(history, field, width = 180, height = 62, lowerIsBetter = false) {
  const sampledHistory = sampleHistoryForChart(smoothHistoryForChart(history, field, CHART_SMOOTH_WINDOW), CHART_POINT_LIMIT);
  const values = sampledHistory.map((entry) => {
    const value = Number(entry?.[field]);
    if (!Number.isFinite(value)) return 0;
    return lowerIsBetter ? Math.max(0, value) : clamp(value, 0, 1);
  });
  const normalized = values.length > 1 ? values : [0, values[0] || 0];
  let min = Math.min(...normalized);
  let max = Math.max(...normalized);
  const padding = 0.015;
  min = lowerIsBetter ? Math.max(0, min - padding) : clamp(min - padding, 0, 1);
  max = lowerIsBetter ? Math.max(min + 0.001, max + padding) : clamp(max + padding, 0, 1);
  if (max - min < 0.04) {
    const middle = (max + min) / 2;
    min = lowerIsBetter ? Math.max(0, middle - 0.02) : clamp(middle - 0.02, 0, 1);
    max = lowerIsBetter ? Math.max(min + 0.04, middle + 0.02) : clamp(middle + 0.02, 0, 1);
  }
  const span = Math.max(max - min, 0.001);
  const left = 6;
  const right = width - 6;
  const bottom = height - 10;
  const top = 7;
  const drawableWidth = right - left;
  const drawableHeight = bottom - top;
  const points = normalized
    .map((value, index) => {
      const x = (index / (normalized.length - 1)) * drawableWidth + left;
      const ratio = (clamp(value, min, max) - min) / span;
      const visualRatio = lowerIsBetter ? 1 - ratio : ratio;
      const y = bottom - visualRatio * drawableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return { points, min, max };
}

function smoothHistoryForChart(history, field, windowSize) {
  if (!Array.isArray(history) || history.length === 0) return [];
  if (history.length < windowSize) return history;
  const smoothed = [];
  for (let start = 0; start < history.length; start += windowSize) {
    const bucket = history.slice(start, start + windowSize);
    const values = bucket
      .map((entry) => Number(entry?.[field]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) continue;
    smoothed.push({
      ...bucket[bucket.length - 1],
      [field]: values.reduce((sum, value) => sum + value, 0) / values.length,
    });
  }
  return smoothed;
}

function sampleHistoryForChart(history, limit) {
  if (!Array.isArray(history) || history.length <= limit) return history || [];
  const sampled = [];
  const lastIndex = history.length - 1;
  for (let i = 0; i < limit; i += 1) {
    sampled.push(history[Math.round((i / (limit - 1)) * lastIndex)]);
  }
  return sampled;
}

function formatPercent(value) {
  return `${(clamp(value || 0, 0, 1) * 100).toFixed(1)}%`;
}

function formatSignedPercent(value) {
  const percent = (value || 0) * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)} p.p.`;
}

function formatDecimal(value) {
  return (Number(value) || 0).toFixed(3);
}

function renderRewardSliders() {
  for (const slider of els.rewardSliders) {
    const player = Number(slider.dataset.player);
    const key = slider.dataset.reward;
    const value = state.rewardProfiles[player][key];
    if (Number(slider.value) !== value) slider.value = value;
    const valueEl = document.querySelector(`[data-reward-value="${player}-${key}"]`);
    if (valueEl) valueEl.textContent = value;
  }
}

function renderBrainSelectors() {
  for (let player = 0; player < PLAYERS; player += 1) {
    const select = els.brainSelects[player];
    if (!select) continue;
    const options = state.brainOptions[player];
    const selectedBase = brainBaseName(player);
    select.innerHTML = options
      .map((option) => `<option value="${escapeHtml(option.baseName)}">${escapeHtml(option.baseName)}</option>`)
      .join("");
    if (options.some((option) => option.baseName === selectedBase)) {
      select.value = selectedBase;
    }
    select.disabled = state.training;
  }
  for (const button of els.newBrainButtons) {
    button.disabled = state.training;
  }
}

function renderBoard() {
  els.ends.textContent =
    state.board.length === 0 ? "Mesa vazia" : `Pontas abertas: ${state.leftEnd} e ${state.rightEnd}`;
  const layout = boardLayout(state.board);
  els.board.innerHTML = state.board
    .map((tile) => {
      const item = layout.items.get(tile.playedId);
      return tileHtml(tile, item.orientation, item, displayValuesForTile(tile, item, layout));
    })
    .join("");
}

function boardLayout(tiles) {
  const width = Math.max(320, els.board.clientWidth || 640);
  const height = Math.max(320, els.board.clientHeight || 352);
  const horizontalLimit = Math.max(6, Math.floor((width / 2 - 90) / BOARD_CELL));
  const verticalLimit = Math.max(2, Math.floor((height / 2 - BOARD_CELL) / BOARD_CELL));
  const centerTile = tiles.find((tile) => tile.pathIndex === 0);
  const center = centerPlacement(centerTile);
  const rightStart = centerTile?.a === centerTile?.b ? { x: 0, y: 0 } : { x: 1, y: 0 };
  const leftStart = { x: 0, y: 0 };
  const logicalItems = [
    ...(centerTile ? [{ tile: centerTile, ...center }] : []),
    ...traceGridSide(
      tiles.filter((tile) => tile.pathIndex > 0).sort((a, b) => a.pathIndex - b.pathIndex),
      1,
      rightStart,
      horizontalLimit,
      verticalLimit,
    ),
    ...traceGridSide(
      tiles.filter((tile) => tile.pathIndex < 0).sort((a, b) => b.pathIndex - a.pathIndex),
      -1,
      leftStart,
      horizontalLimit,
      verticalLimit,
    ),
  ];
  const boxes = logicalItems.map((item) => ({ ...item, ...logicalTileBox(item) }));
  return {
    cellSize: BOARD_CELL,
    items: new Map(
      boxes.map((item) => [
        item.tile.playedId,
        {
          ...item,
          x: width / 2 + item.centerX * BOARD_CELL,
          y: height / 2 + item.centerY * BOARD_CELL,
          width: item.widthUnits * BOARD_CELL,
          height: item.heightUnits * BOARD_CELL,
          cellSize: BOARD_CELL,
          orientation: tileOrientation(item.tile, item.axis),
        },
      ]),
    ),
    byIndex: new Map(
      boxes.map((item) => [
        item.tile.pathIndex,
        {
          ...item,
          x: width / 2 + item.centerX * BOARD_CELL,
          y: height / 2 + item.centerY * BOARD_CELL,
          width: item.widthUnits * BOARD_CELL,
          height: item.heightUnits * BOARD_CELL,
          cellSize: BOARD_CELL,
          orientation: tileOrientation(item.tile, item.axis),
        },
      ]),
    ),
  };
}

function centerPlacement(tile) {
  if (tile?.a === tile?.b) {
    return {
      c1: { x: 0, y: 0 },
      c2: { x: 0, y: 0 },
      axis: "horizontal",
      pathIndex: 0,
    };
  }
  return {
    c1: { x: 0, y: 0 },
    c2: { x: 1, y: 0 },
    axis: "horizontal",
    pathIndex: 0,
  };
}

function traceGridSide(tiles, sign, startConnector, horizontalLimit, verticalLimit) {
  const items = [];
  const minX = -horizontalLimit;
  const maxX = horizontalLimit + 1;
  const cells = createSerpentineCells(sign, startConnector, minX, maxX, verticalLimit);
  let cursor = 0;

  for (const tile of tiles) {
    const length = tile.a === tile.b ? 1 : 2;
    const c1 = cells[cursor] || cells[cells.length - 1];
    const c2 = length === 1 ? c1 : cells[cursor + 1] || c1;
    const axis = length === 1 ? c1.axis : c1.x === c2.x ? "vertical" : "horizontal";

    items.push({
      tile,
      c1,
      c2,
      axis,
      direction: axis === "vertical" ? { x: 0, y: sign > 0 ? 1 : -1 } : { x: sign, y: 0 },
    });

    cursor += length;
  }

  return items;
}

function createSerpentineCells(sign, startConnector, minX, maxX, verticalLimit) {
  const cells = [];
  const addCell = (x, y, axis) => cells.push({ x, y, axis });

  if (sign > 0) {
    for (let x = startConnector.x + 1; x <= maxX; x += 1) addCell(x, 0, "horizontal");
    addVerticalRun(cells, maxX, 1, Math.min(2, verticalLimit));
    for (let x = maxX - 1; x >= minX; x -= 1) addCell(x, 2, "horizontal");
    if (verticalLimit >= 4) {
      addVerticalRun(cells, minX, 3, 4);
      for (let x = minX + 1; x <= maxX; x += 1) addCell(x, 4, "horizontal");
    }
    return cells;
  }

  for (let x = startConnector.x - 1; x >= minX; x -= 1) addCell(x, 0, "horizontal");
  addVerticalRun(cells, minX, -1, -Math.min(2, verticalLimit));
  for (let x = minX + 1; x <= maxX; x += 1) addCell(x, -2, "horizontal");
  if (verticalLimit >= 4) {
    addVerticalRun(cells, maxX, -3, -4);
    for (let x = maxX - 1; x >= minX; x -= 1) addCell(x, -4, "horizontal");
  }
  return cells;
}

function addVerticalRun(cells, x, fromY, toY) {
  const step = fromY <= toY ? 1 : -1;
  for (let y = fromY; step > 0 ? y <= toY : y >= toY; y += step) {
    cells.push({ x, y, axis: "vertical" });
  }
}

function logicalTileBox(item) {
  const orientation = tileOrientation(item.tile, item.axis);
  const minCellX = Math.min(item.c1.x, item.c2.x);
  const maxCellX = Math.max(item.c1.x, item.c2.x);
  const minCellY = Math.min(item.c1.y, item.c2.y);
  const maxCellY = Math.max(item.c1.y, item.c2.y);
  const widthUnits = orientation === "horizontal" ? 2 : 1;
  const heightUnits = orientation === "horizontal" ? 1 : 2;
  const centerX = (item.c1.x + item.c2.x) / 2;
  const centerY = (item.c1.y + item.c2.y) / 2;
  return {
    centerX,
    centerY,
    widthUnits,
    heightUnits,
    minX: Math.min(minCellX, centerX - widthUnits / 2),
    maxX: Math.max(maxCellX, centerX + widthUnits / 2),
    minY: Math.min(minCellY, centerY - heightUnits / 2),
    maxY: Math.max(maxCellY, centerY + heightUnits / 2),
  };
}

function tileOrientation(tile, axis) {
  if (tile.a === tile.b) return axis === "horizontal" ? "vertical" : "horizontal";
  return axis;
}

function displayValuesForTile(tile, item, layout) {
  if (tile.a === tile.b) return [tile.a, tile.b];
  const c1Value = tile.pathIndex < 0 ? tile.b : tile.a;
  const c2Value = tile.pathIndex < 0 ? tile.a : tile.b;
  const cells = [
    { ...item.c1, value: c1Value },
    { ...item.c2, value: c2Value },
  ];
  if (item.axis === "vertical") {
    return cells.sort((a, b) => a.y - b.y).map((cell) => cell.value);
  }
  return cells.sort((a, b) => a.x - b.x).map((cell) => cell.value);
}

function renderHumanHand() {
  if (state.humanSeat === null) {
    els.humanHand.innerHTML = "";
    return;
  }
  els.humanHand.innerHTML = state.hands[state.humanSeat]
    .map((tile) => {
      const selected = tile.id === state.selectedTileId ? " selected" : "";
      return `<button class="tile${tile.a === tile.b ? " double" : ""}${selected}" data-tile="${tile.id}" type="button">${tileNumberHtml(tile.a)}${tileNumberHtml(tile.b)}</button>`;
    })
    .join("");
}

function renderHumanActions() {
  els.humanActions.innerHTML = "";
  if (state.humanSeat !== state.current || state.training || state.handFinished || state.matchFinished) return;
  const moves = legalMoves(state.humanSeat);
  if (moves.length === 0) {
    els.humanActions.innerHTML = `<button type="button" data-pass="true">Passar</button>`;
    return;
  }
  if (!state.selectedTileId) return;
  const selectedMoves = moves.filter((move) => move.tile.id === state.selectedTileId);
  if (automaticSameEndMove(selectedMoves)) return;
  els.humanActions.innerHTML = selectedMoves
    .map((move) => `<button type="button" data-side="${move.side}">${labelSide(move.side)}</button>`)
    .join("");
}

function tileHtml(tile, orientation = "horizontal", item = null, values = [tile.a, tile.b]) {
  const classes = [
    "tile",
    tile.a === tile.b ? "double" : "",
    `played-by-${tile.owner}`,
    `orient-${orientation}`,
  ]
    .filter(Boolean)
    .join(" ");
  const position = item
    ? ` style="left:${item.x}px;top:${item.y}px;width:${item.width}px;height:${item.height}px;transform:translate(-50%,-50%);"`
    : "";
  return `<span class="${classes}"${position}>${tileNumberHtml(values[0])}${tileNumberHtml(values[1])}</span>`;
}

function tileNumberHtml(value) {
  return `<span class="pip pip-${value}">${value}</span>`;
}

function labelSide(side) {
  if (side === "start") return "Jogar";
  return side === "left" ? "Esquerda" : "Direita";
}

els.newGame.addEventListener("click", () => {
  if (state.training) stopTrainingMode(true);
  else syncHumanSeatFromAgents();
  startMatch();
});

els.resetResults.addEventListener("click", () => {
  resetCounters();
  render("Resultados zerados.");
});

els.trainStart.addEventListener("click", () => {
  startTrainingMode();
});

els.trainStop.addEventListener("click", () => {
  stopTrainingMode(true);
  startMatch();
});

els.agentModes.forEach((select) => {
  select.addEventListener("change", () => {
    if (state.training) stopTrainingMode(false);
    syncHumanSeatFromAgents();
    startMatch();
  });
});

els.brainSelects.forEach((select, player) => {
  select.addEventListener("change", async () => {
    if (state.training) return;
    try {
      await loadBrainFromDatabase(player, select.value);
      render(`CÃ©rebro ${select.value}J${player + 1} carregado.`);
    } catch (error) {
      console.error(error);
      render("NÃ£o foi possÃ­vel carregar esse cÃ©rebro.");
    }
  });
});

els.newBrainButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (state.training) return;
    const player = Number(button.dataset.newBrain);
    const name = window.prompt(`Nome do novo cÃ©rebro para J${player + 1}:`, "cerebro");
    if (name === null) return;
    try {
      await createBrainInDatabase(player, name);
    } catch (error) {
      console.error(error);
      render("NÃ£o foi possÃ­vel criar esse cÃ©rebro.");
    }
  });
});
els.rewardSliders.forEach((slider) => {
  slider.addEventListener("input", () => {
    const player = Number(slider.dataset.player);
    const key = slider.dataset.reward;
    state.rewardProfiles[player][key] = Number(slider.value);
    const valueEl = document.querySelector(`[data-reward-value="${player}-${key}"]`);
    if (valueEl) valueEl.textContent = slider.value;
    saveRewardProfiles();
  });
});

els.humanSpeed.addEventListener("input", () => {
  render();
  if (state.humanSeat !== null && state.humanSeat !== state.current) scheduleBots();
});

els.humanHand.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tile]");
  if (!button || state.humanSeat !== state.current || state.handFinished || state.matchFinished) return;
  const selectedMoves = legalMoves(state.humanSeat).filter((move) => move.tile.id === button.dataset.tile);
  const automaticMove = selectedMoves.length === 1 ? selectedMoves[0] : automaticSameEndMove(selectedMoves);
  if (automaticMove) {
    playMove(state.humanSeat, automaticMove);
    render();
    scheduleBots();
    return;
  }
  state.selectedTileId = selectedMoves.length > 0 ? button.dataset.tile : null;
  render();
});

els.humanActions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || state.humanSeat !== state.current || state.handFinished || state.matchFinished) return;
  if (button.dataset.pass) {
    passTurn();
  } else {
    const move = legalMoves(state.humanSeat).find(
      (candidate) => candidate.tile.id === state.selectedTileId && candidate.side === button.dataset.side,
    );
    if (move) playMove(state.humanSeat, move);
  }
  render();
  scheduleBots();
});

function automaticSameEndMove(moves) {
  if (moves.length < 2 || state.board.length === 0 || state.leftEnd !== state.rightEnd) return null;
  const leftMove = moves.find((move) => move.side === "left");
  const rightMove = moves.find((move) => move.side === "right");
  if (!leftMove || !rightMove) return null;
  return Math.abs(state.minPathIndex) <= state.maxPathIndex ? leftMove : rightMove;
}

document.addEventListener("pointerdown", dismissResultOverlay);
document.addEventListener("keydown", dismissResultOverlay);

syncHumanSeatFromAgents();
loadRewardProfiles();
startMatch();
initBrainsFromDatabase();
