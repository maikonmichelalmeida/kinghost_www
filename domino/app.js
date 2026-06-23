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
  brainSelects: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-select-${i}`)),
  newBrainButtons: [...document.querySelectorAll("[data-new-brain]")],
  humanSpeed: document.querySelector("#human-speed"),
  humanSpeedValue: document.querySelector("#human-speed-value"),
  agentModes: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#agent-${i}`)),
  rewardSliders: [...document.querySelectorAll("[data-reward]")],
  brainStats: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-stat-${i}`)),
  brainCounts: [...Array(PLAYERS)].map((_, i) => document.querySelector(`#brain-${i}`)),
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
  lastMoveId: null,
  moveSequence: 0,
  minPathIndex: 0,
  maxPathIndex: 0,
  decisions: [],
  agentModesBeforeTraining: null,
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
  return {
    layers: LAYER_SIZES.slice(1).map((outputSize, index) => {
      const inputSize = LAYER_SIZES[index];
      return createLayer(inputSize, outputSize, Math.sqrt(2 / inputSize));
    }),
    games: 0,
    roundsTrained: 0,
    generation: 0,
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
  return {
    ...brain,
    games: brain.games || 0,
    roundsTrained: brain.roundsTrained || 0,
    generation: brain.generation || 0,
  };
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
    render("CÃ©rebros carregados do banco.");
  } catch (error) {
    console.error(error);
    render("NÃ£o foi possÃ­vel carregar os cÃ©rebros do banco. Usando cÃ©rebros temporÃ¡rios em memÃ³ria.");
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
  if (!isValidBrain(brain)) throw new Error("CÃ©rebro incompatÃ­vel.");
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
  render(`CÃ©rebro ${baseName}J${player + 1} criado e carregado.`);
}

async function saveSelectedBrains(force = false) {
  if (state.brainSaveInFlight) return;
  const now = Date.now();
  accrueTrainingTime(now);
  if (!force && now - state.lastBrainSaveAt < BRAIN_SAVE_INTERVAL_MS) return;
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

function accrueTrainingTime(now = Date.now()) {
  if (!state.training || state.lastBrainTrainingClock === 0) {
    state.lastBrainTrainingClock = now;
    return;
  }
  const elapsed = Math.max(0, now - state.lastBrainTrainingClock);
  for (let player = 0; player < PLAYERS; player += 1) {
    if (agentMode(player) === "trained") state.brainTrainMs[player] += elapsed;
  }
  state.lastBrainTrainingClock = now;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erro na comunicaÃ§Ã£o com o banco.");
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
  state.consecutivePasses = 0;
  state.selectedTileId = null;
  if (state.hands[player].length === 0) {
    const team = TEAM_BY_PLAYER[player];
    finishHand(team, `Jogador ${player + 1} bateu. Time ${TEAM_NAMES[team]} marcou 1 ponto.`);
    return true;
  }
  advanceTurn();
  return true;
}

function passTurn() {
  if (state.handFinished || state.matchFinished) return;
  state.passedPlayers[state.current] = true;
  if (state.training) rewardOpponentPassOutcome(state.current);
  recordPassSignal(state.current);
  state.consecutivePasses += 1;
  if (state.consecutivePasses >= PLAYERS) {
    finishHand(null, "Jogo fechado. NinguÃ©m marcou porque nenhuma mÃ£o foi esvaziada.");
    return;
  }
  advanceTurn();
}

function advanceTurn() {
  state.current = (state.current + 1) % PLAYERS;
  state.passedPlayers[state.current] = false;
}

function finishHand(winnerTeam, message) {
  state.handFinished = true;
  state.passedPlayers = Array(PLAYERS).fill(false);
  clearBotTimer();
  clearResultTimer();

  if (winnerTeam !== null) {
    state.scores[winnerTeam] += 1;
  }

  state.handsPlayed += 1;
  if (state.training) {
    trainFromHand(winnerTeam);
    state.brainGames += 1;
    state.epsilon = Math.max(0.04, 0.35 * Math.pow(0.997, state.brainGames));
  }

  const matchWinner = state.scores.findIndex((score) => score >= MATCH_POINTS);
  if (matchWinner !== -1) {
    state.wins[matchWinner] += 1;
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
  return winnerTeam === humanTeam ? `VitÃ³ria! ${fallback}` : `Derrota. ${fallback}`;
}

function matchResultMessage(winnerTeam, handMessage) {
  const base = `Time ${TEAM_NAMES[winnerTeam]} venceu a partida por ${state.scores[winnerTeam]} a ${state.scores[1 - winnerTeam]}. ${handMessage}`;
  if (state.humanSeat === null) return base;
  const humanTeam = TEAM_BY_PLAYER[state.humanSeat];
  if (winnerTeam === humanTeam) return `Grande vitÃ³ria! Seu time fechou a partida. Nova partida em instantes.`;
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
  return moves
    .map((move) => ({ move, score: evaluate(state.brains[player], featuresFor(player, move)).value }))
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

function agentMode(player) {
  return els.agentModes[player]?.value || "trained";
}

function syncHumanSeatFromAgents() {
  state.humanSeat = agentMode(0) === "human" ? 0 : null;
  if (state.humanSeat === null) state.selectedTileId = null;
}

function forceAllAgentsTrained() {
  for (const select of els.agentModes) {
    select.value = "trained";
  }
  state.humanSeat = null;
  state.selectedTileId = null;
}

function currentAgentModes() {
  return els.agentModes.map((select) => select.value);
}

function restoreAgentModes(modes) {
  if (!modes) return;
  modes.forEach((mode, index) => {
    els.agentModes[index].value = mode;
  });
}

function startTrainingMode() {
  state.agentModesBeforeTraining = currentAgentModes();
  state.training = true;
  state.lastBrainSaveAt = Date.now();
  state.lastBrainTrainingClock = Date.now();
  forceAllAgentsTrained();
  syncHumanSeatFromAgents();
  startMatch();
}

function stopTrainingMode(restoreAgents = true) {
  saveSelectedBrains(true);
  state.training = false;
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
  const features = featuresFor(player, move);
  const evaluation = evaluate(state.brains[player], features);
  state.decisions.push({
    player,
    team: TEAM_BY_PLAYER[player],
    features,
    immediateReward: moveHeuristicReward(player, move),
    value: evaluation.value,
  });
}

function trainFromHand(winnerTeam) {
  const trainedPlayers = new Set();
  for (let index = 0; index < state.decisions.length; index += 1) {
    const decision = state.decisions[index];
    const finalReward = winnerTeam === null ? -0.3 : decision.team === winnerTeam ? 1 : -1;
    const distanceFromEnd = state.decisions.length - 1 - index;
    const discount = 0.55 + 0.45 * Math.pow(GAMMA, Math.min(6, distanceFromEnd));
    const target = clamp(finalReward * discount + decision.immediateReward, -1.25, 1.25);
    trainNetwork(state.brains[decision.player], decision.features, target);
    state.brains[decision.player].games = (state.brains[decision.player].games || 0) + 1;
    trainedPlayers.add(decision.player);
  }
  for (const player of trainedPlayers) {
    state.brains[player].roundsTrained = (state.brains[player].roundsTrained || 0) + 1;
  }
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
  const evaluation = evaluate(brain, inputs);
  const layers = brain.layers;
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
        layer.weights[neuron][inputIndex] -= LEARNING_RATE * clippedDelta * inputActivation[inputIndex];
      }
      layer.biases[neuron] -= LEARNING_RATE * clippedDelta;
    }
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
  if (delay === 0) return "mÃ¡x.";
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
  els.handPanel.hidden = state.humanSeat === null;
  renderBrainStats();

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
      <div class="result-timer">${state.resultType === "match" ? "Nova partida em instantes" : "PrÃ³xima rodada em instantes"}</div>
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
    const isTrainedBot = agentMode(i) === "trained";
    els.brainStats[i].hidden = !isTrainedBot;
    els.brainCounts[i].textContent = state.brains[i].roundsTrained || 0;
  }
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
      render(`Cérebro ${select.value}J${player + 1} carregado.`);
    } catch (error) {
      console.error(error);
      render("Não foi possível carregar esse cérebro.");
    }
  });
});

els.newBrainButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (state.training) return;
    const player = Number(button.dataset.newBrain);
    const name = window.prompt(`Nome do novo cérebro para J${player + 1}:`, "cerebro");
    if (name === null) return;
    try {
      await createBrainInDatabase(player, name);
    } catch (error) {
      console.error(error);
      render("Não foi possível criar esse cérebro.");
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
