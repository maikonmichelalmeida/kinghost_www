"use strict";

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const resetButton = document.getElementById("resetButton");
const modeToggle = document.getElementById("modeToggle");
const modeLabel = document.getElementById("modeLabel");
const backpropButton = document.getElementById("backpropButton");
const geneticButton = document.getElementById("geneticButton");
const algorithmValue = document.getElementById("algorithmValue");
const rateLabel = document.getElementById("rateLabel");
const fpsValue = document.getElementById("fpsValue");
const metricsTableBody = document.getElementById("metricsTableBody");

const FPS = 30;
const FRAME_MS = 1000 / FPS;
const TWO_PI = Math.PI * 2;
const WORLD_SIZE = 720;
const BALL_RADIUS = 14;
const BALL_DIAMETER = BALL_RADIUS * 2;
const YELLOW_RADIUS = 9;
const MAX_ACCELERATION = 0.1;
const MAX_SPEED = 6;
const BOOST_ACCELERATION = 0.2;
const BOOST_MAX_SPEED = 12;
const BOOST_MAX_CHARGE = 150;
const BOOST_START_THRESHOLD = 30;
const BOOST_REUSE_COOLDOWN = 60;
const BOOST_RECHARGE_PER_FRAME = 0.2;
const BOOST_DRAIN_PER_FRAME = 1;
const WALL_BOUNCE = 0.94;
const BALL_BOUNCE = 0.98;
const BALL_SEPARATION_KICK = 2.8;
const BALL_EXTRA_SEPARATION = 4;
const LEARNING_RATE = 0.035;
const WALL_PENALTY = -8;
const RED_HIT_REWARD = 12;
const BLUE_HIT_PENALTY = -4;
const RED_SLOW_PENALTY = -0.006;
const BLUE_SLOW_REWARD = 0.005;
const BLUE_YELLOW_REWARD = 18;
const RED_YELLOW_PENALTY = -12;
const RED_BLUE_GOT_YELLOW_PENALTY = -32;
const BALL_COLLISION_COOLDOWN = 10;
const YELLOW_RESPAWN_FRAMES = FPS * 30;
const TRAINING_BATCH_STEPS = 1000;
const TRAINING_RENDER_EVERY = 12000;
const STORAGE_KEY = "bolinhaIA.training.v3";
const SAVE_INTERVAL_MS = 30000;
const GENETIC_POPULATION_SIZE = 10;
const GENETIC_MUTATION_DEVIATION = 0.06;
const GENETIC_SCORE_BONUS = 2000;
const GENETIC_BLUE_WALL_BONUS = 200;
const GENETIC_SPAWN_WALL_CLEARANCE = 75;
const GENETIC_SPAWN_OPPONENT_DISTANCE = 150;
const WALL_REPULSION_DISTANCE = 28;
const WALL_REPULSION_SPEED_THRESHOLD = 1.25;
const WALL_REPULSION_FORCE = 1.5;
const WALL_REPULSION_WINDOW = 20;
const RESET_CONFIRMATION_MS = 4000;

const metricRows = [
  { key: "velocidade", label: "Velocidade", type: "bar", max: MAX_SPEED, boostEffect: true },
  { key: "aceleracao_saida", label: "Aceleracao", type: "bar", max: MAX_ACCELERATION, boostEffect: true },
  { key: "carga_boost", label: "Boost", type: "bar", max: BOOST_MAX_CHARGE },
  { key: "direcao", label: "Direcao movimento" },
  { key: "diferenca_direcao_amarela", label: "Angulo amarela" },
  { key: "recompensa_recente", label: "Reward medio (1000 frames)", average: true },
  { key: "recompensa_media", label: "Reward medio total", average: true },
  { key: "media_sem_parede", label: "Frames sem parede (media 10)", average: true },
  { key: "media_entre_bolas", label: "Frames entre bolas (media 10)", average: true }
];

const geneticMetricRows = [
  { key: "score_genetico", label: "Score atual" },
  { key: "geracao_genetica", label: "Geracao" },
  { key: "individuo_genetico", label: "Individuo" }
];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  const wrapped = angle % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

function signedAngleDifference(targetAngle, currentAngle) {
  const difference = targetAngle - currentAngle;
  return Math.atan2(Math.sin(difference), Math.cos(difference));
}

function angleToOutput(angle, currentOutput) {
  const target = normalizeAngle(angle) / TWO_PI;
  const options = [target, target - 1, target + 1];
  const closest = options.reduce((best, option) => {
    return Math.abs(option - currentOutput) < Math.abs(best - currentOutput) ? option : best;
  }, target);

  return clamp(closest, 0.001, 0.999);
}

function createLayer(inputSize, outputSize) {
  return {
    weights: Array.from({ length: outputSize }, () =>
      Array.from({ length: inputSize }, () => randomBetween(-1, 1))
    ),
    biases: Array.from({ length: outputSize }, () => randomBetween(-1, 1))
  };
}

function createBrain() {
  return [
    createLayer(12, 10),
    createLayer(10, 8),
    createLayer(8, 5),
    createLayer(5, 3)
  ];
}

function cloneBrain(brain) {
  return brain.map((layer) => ({
    weights: layer.weights.map((row) => [...row]),
    biases: [...layer.biases]
  }));
}

function randomGaussian() {
  const first = Math.max(Number.EPSILON, Math.random());
  const second = Math.random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(TWO_PI * second);
}

function mutateBrain(brain) {
  const mutated = cloneBrain(brain);

  mutated.forEach((layer) => {
    layer.weights.forEach((row, outputIndex) => {
      row.forEach((weight, inputIndex) => {
        layer.weights[outputIndex][inputIndex] = weight + randomGaussian() * GENETIC_MUTATION_DEVIATION;
      });
    });
    layer.biases = layer.biases.map((bias) => bias + randomGaussian() * GENETIC_MUTATION_DEVIATION);
  });

  return mutated;
}

function activate(value) {
  return Math.tanh(value);
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function forwardBrain(brain, inputs) {
  const activations = [inputs];

  brain.forEach((layer, layerIndex) => {
    const previous = activations[layerIndex];
    const isOutputLayer = layerIndex === brain.length - 1;
    const next = layer.weights.map((row, outputIndex) => {
      const total = row.reduce((sum, weight, inputIndex) => {
        return sum + weight * previous[inputIndex];
      }, layer.biases[outputIndex]);

      return isOutputLayer ? sigmoid(total) : activate(total);
    });

    activations.push(next);
  });

  const output = activations[activations.length - 1];

  return {
    activations,
    rawOutput: output,
    action: {
      acceleration: output[0] * MAX_ACCELERATION,
      direction: output[1] * TWO_PI,
      boost: output[2] >= 0.5
    }
  };
}

function trainBrain(brain, cache, target, strength) {
  if (!cache) {
    return;
  }

  const deltas = Array.from({ length: brain.length });
  const output = cache.activations[cache.activations.length - 1];
  const scaledStrength = clamp(strength, 0.03, 24);

  deltas[brain.length - 1] = output.map((value, index) => {
    return (value - target[index]) * value * (1 - value) * scaledStrength;
  });

  for (let layerIndex = brain.length - 2; layerIndex >= 0; layerIndex -= 1) {
    const layerOutput = cache.activations[layerIndex + 1];
    const nextLayer = brain[layerIndex + 1];
    const nextDeltas = deltas[layerIndex + 1];

    deltas[layerIndex] = layerOutput.map((value, neuronIndex) => {
      const downstream = nextLayer.weights.reduce((sum, weights, nextIndex) => {
        return sum + weights[neuronIndex] * nextDeltas[nextIndex];
      }, 0);

      return downstream * (1 - value * value);
    });
  }

  brain.forEach((layer, layerIndex) => {
    const previous = cache.activations[layerIndex];

    layer.weights.forEach((row, outputIndex) => {
      row.forEach((weight, inputIndex) => {
        row[inputIndex] = weight - LEARNING_RATE * deltas[layerIndex][outputIndex] * previous[inputIndex];
      });

      layer.biases[outputIndex] -= LEARNING_RATE * deltas[layerIndex][outputIndex];
    });
  });
}

function createBall(role, color, x, y) {
  const direction = randomBetween(0, TWO_PI);
  const speed = randomBetween(0, 2);

  return {
    role,
    color,
    x,
    y,
    hspeed: Math.cos(direction) * speed,
    vspeed: Math.sin(direction) * speed,
    brain: createBrain(),
    sensors: {},
    output: {
      acceleration: 0,
      direction: 0,
      boost: false
    },
    boostCharge: BOOST_MAX_CHARGE,
    boostActive: false,
    boostUsedThisFrame: false,
    boostCooldown: 0,
    lastCache: null,
    rewardNow: 0,
    rewardSum: 0,
    rewardFrames: 0,
    rewardAverage: 0,
    recentRewards: [],
    recentRewardIndex: 0,
    recentRewardSum: 0,
    recentRewardAverage: 0,
    wallFreeIntervals: [],
    lastWallHitFrame: 0,
    averageWallFreeFrames: 0,
    ballCollisionIntervals: [],
    lastBallCollisionFrame: 0,
    averageBallCollisionFrames: 0
  };
}

let redBall;
let blueBall;
let yellowBall;
let frameNumber = 0;
let lastRewardedBallCollisionFrame = -Infinity;
let lastFrameTime = performance.now();
let frameAccumulator = 0;
let lastFpsUpdate = performance.now();
let framesSinceFpsUpdate = 0;
let simulationMode = "visualization";
let visualizationRequestId = null;
let trainingTimerId = null;
let lastTrainingRenderFrame = 0;
let rateWindowStartedAt = performance.now();
let stepsInRateWindow = 0;
let tableAverageSnapshot = null;
let lastTableAverageFrame = -Infinity;
let trainingAlgorithm = "backprop";
let geneticState = null;
let resetConfirmationPending = false;
let resetConfirmationTimer = null;

function resetSimulation() {
  redBall = createBall("red", "#ff3b3b", WORLD_SIZE * 0.28, WORLD_SIZE * 0.5);
  blueBall = createBall("blue", "#3394ff", WORLD_SIZE * 0.72, WORLD_SIZE * 0.5);
  frameNumber = 0;
  lastRewardedBallCollisionFrame = -Infinity;
  tableAverageSnapshot = null;
  lastTableAverageFrame = -Infinity;
  relocateYellowBall();
}

function createGeneticController(baseBrain) {
  const population = Array.from({ length: GENETIC_POPULATION_SIZE }, (_, index) => ({
    brain: index === 0 ? cloneBrain(baseBrain) : mutateBrain(baseBrain),
    score: 0
  }));

  return {
    generation: 1,
    currentIndex: 0,
    lastBestScore: 0,
    population
  };
}

function initializeGeneticTraining() {
  geneticState = {
    red: createGeneticController(redBall.brain),
    blue: createGeneticController(blueBall.brain)
  };
}

function synchronizeCurrentBrainsToGenetic() {
  for (const role of ["red", "blue"]) {
    const controller = geneticState[role];
    const ball = role === "red" ? redBall : blueBall;
    const individual = controller.population[controller.currentIndex];
    individual.brain = cloneBrain(ball.brain);
    individual.score = 0;
  }
}

function resetBallForGeneticIndividual(ball, role) {
  const opponent = role === "red" ? blueBall : redBall;
  const wallMargin = BALL_RADIUS + GENETIC_SPAWN_WALL_CLEARANCE;
  let spawn;

  do {
    spawn = {
      x: randomBetween(wallMargin, WORLD_SIZE - wallMargin),
      y: randomBetween(wallMargin, WORLD_SIZE - wallMargin)
    };
  } while (
    Math.hypot(spawn.x - opponent.x, spawn.y - opponent.y) < GENETIC_SPAWN_OPPONENT_DISTANCE ||
    Math.hypot(spawn.x - yellowBall.x, spawn.y - yellowBall.y) < BALL_RADIUS + YELLOW_RADIUS + 20
  );

  ball.x = spawn.x;
  ball.y = spawn.y;
  ball.hspeed = 0;
  ball.vspeed = 0;
  ball.boostCharge = BOOST_MAX_CHARGE;
  ball.boostActive = false;
  ball.boostUsedThisFrame = false;
  ball.boostCooldown = 0;
  ball.output = { acceleration: 0, direction: 0, boost: false };
  ball.lastCache = null;
  ball.lastWallHitFrame = frameNumber;
  ball.lastBallCollisionFrame = frameNumber;
}

function activateGeneticIndividual(role) {
  const controller = geneticState[role];
  const ball = role === "red" ? redBall : blueBall;
  ball.brain = cloneBrain(controller.population[controller.currentIndex].brain);
  resetBallForGeneticIndividual(ball, role);
}

function evolveGeneticController(controller) {
  const ranked = [...controller.population].sort((first, second) => second.score - first.score);
  const bestBrain = ranked[0].brain;
  const secondBrain = ranked[1].brain;
  controller.lastBestScore = ranked[0].score;
  controller.generation += 1;
  controller.currentIndex = 0;
  controller.population = Array.from({ length: GENETIC_POPULATION_SIZE }, (_, index) => {
    if (index === 0) {
      return { brain: cloneBrain(bestBrain), score: 0 };
    }

    const parent = index % 2 === 0 ? bestBrain : secondBrain;
    return { brain: mutateBrain(parent), score: 0 };
  });
}

function killGeneticIndividual(role) {
  const controller = geneticState[role];
  controller.currentIndex += 1;

  if (controller.currentIndex >= GENETIC_POPULATION_SIZE) {
    evolveGeneticController(controller);
  }

  activateGeneticIndividual(role);
}

function currentGeneticIndividual(role) {
  if (!geneticState) {
    return null;
  }

  const controller = geneticState[role];
  return controller.population[controller.currentIndex];
}

function relocateYellowBall() {
  const padding = YELLOW_RADIUS + 2;
  let position;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    position = {
      x: randomBetween(padding, WORLD_SIZE - padding),
      y: randomBetween(padding, WORLD_SIZE - padding)
    };

    const awayFromRed = Math.hypot(position.x - redBall.x, position.y - redBall.y) > BALL_RADIUS + YELLOW_RADIUS + 8;
    const awayFromBlue = Math.hypot(position.x - blueBall.x, position.y - blueBall.y) > BALL_RADIUS + YELLOW_RADIUS + 8;

    if (awayFromRed && awayFromBlue) {
      break;
    }
  }

  yellowBall = {
    x: position.x,
    y: position.y,
    radius: YELLOW_RADIUS,
    lastMovedFrame: frameNumber
  };
}

function isValidBrain(brain) {
  const shapes = [[10, 12], [8, 10], [5, 8], [3, 5]];

  return Array.isArray(brain) && brain.length === shapes.length && brain.every((layer, index) => {
    const [outputs, inputs] = shapes[index];
    return Array.isArray(layer.weights) &&
      layer.weights.length === outputs &&
      layer.weights.every((row) => Array.isArray(row) && row.length === inputs && row.every(Number.isFinite)) &&
      Array.isArray(layer.biases) &&
      layer.biases.length === outputs &&
      layer.biases.every(Number.isFinite);
  });
}

function isValidGeneticController(controller) {
  return controller &&
    Number.isInteger(controller.generation) && controller.generation >= 1 &&
    Number.isInteger(controller.currentIndex) && controller.currentIndex >= 0 && controller.currentIndex < GENETIC_POPULATION_SIZE &&
    Array.isArray(controller.population) && controller.population.length === GENETIC_POPULATION_SIZE &&
    controller.population.every((individual) => isValidBrain(individual.brain) && Number.isFinite(individual.score));
}

function isValidGeneticState(state) {
  return state && isValidGeneticController(state.red) && isValidGeneticController(state.blue);
}

function saveTraining() {
  if (!redBall || !blueBall) {
    return;
  }

  const training = {
    version: 3,
    savedAt: Date.now(),
    frameNumber,
    trainingAlgorithm,
    geneticState,
    redBrain: redBall.brain,
    blueBrain: blueBall.brain,
    redStats: {
      rewardSum: redBall.rewardSum,
      rewardFrames: redBall.rewardFrames,
      recentRewards: redBall.recentRewards,
      recentRewardIndex: redBall.recentRewardIndex,
      recentRewardSum: redBall.recentRewardSum,
      wallFreeIntervals: redBall.wallFreeIntervals,
      lastWallHitFrame: redBall.lastWallHitFrame,
      averageWallFreeFrames: redBall.averageWallFreeFrames,
      ballCollisionIntervals: redBall.ballCollisionIntervals,
      lastBallCollisionFrame: redBall.lastBallCollisionFrame,
      averageBallCollisionFrames: redBall.averageBallCollisionFrames
    },
    blueStats: {
      rewardSum: blueBall.rewardSum,
      rewardFrames: blueBall.rewardFrames,
      recentRewards: blueBall.recentRewards,
      recentRewardIndex: blueBall.recentRewardIndex,
      recentRewardSum: blueBall.recentRewardSum,
      wallFreeIntervals: blueBall.wallFreeIntervals,
      lastWallHitFrame: blueBall.lastWallHitFrame,
      averageWallFreeFrames: blueBall.averageWallFreeFrames,
      ballCollisionIntervals: blueBall.ballCollisionIntervals,
      lastBallCollisionFrame: blueBall.lastBallCollisionFrame,
      averageBallCollisionFrames: blueBall.averageBallCollisionFrames
    }
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(training));
  } catch (error) {
    console.warn("Nao foi possivel salvar o treinamento.", error);
  }
}

function loadTraining() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return false;
    }

    const training = JSON.parse(stored);
    if (training.version !== 3 || !isValidBrain(training.redBrain) || !isValidBrain(training.blueBrain)) {
      return false;
    }

    redBall.brain = training.redBrain;
    blueBall.brain = training.blueBrain;
    frameNumber = Number.isFinite(training.frameNumber) ? training.frameNumber : 0;
    yellowBall.lastMovedFrame = frameNumber;

    restoreBallStats(redBall, training.redStats);
    restoreBallStats(blueBall, training.blueStats);

    trainingAlgorithm = training.trainingAlgorithm === "genetic" ? "genetic" : "backprop";
    geneticState = isValidGeneticState(training.geneticState) ? training.geneticState : null;

    if (trainingAlgorithm === "genetic") {
      if (!geneticState) {
        initializeGeneticTraining();
      }
    }

    return true;
  } catch (error) {
    console.warn("Treinamento salvo invalido; iniciando uma nova rede.", error);
    return false;
  }
}

function restoreBallStats(ball, stats) {
  if (!stats) {
    return;
  }

  ball.rewardSum = Number(stats.rewardSum) || 0;
  ball.rewardFrames = Number(stats.rewardFrames) || 0;
  ball.rewardAverage = ball.rewardFrames > 0 ? ball.rewardSum / ball.rewardFrames : 0;
  ball.recentRewards = Array.isArray(stats.recentRewards)
    ? stats.recentRewards.filter(Number.isFinite).slice(0, 1000)
    : [];
  ball.recentRewardIndex = ball.recentRewards.length === 1000 && Number.isInteger(stats.recentRewardIndex)
    ? clamp(stats.recentRewardIndex, 0, 999)
    : 0;
  ball.recentRewardSum = ball.recentRewards.reduce((sum, reward) => sum + reward, 0);
  ball.recentRewardAverage = ball.recentRewards.length > 0
    ? ball.recentRewardSum / ball.recentRewards.length
    : 0;
  ball.wallFreeIntervals = Array.isArray(stats.wallFreeIntervals)
    ? stats.wallFreeIntervals.filter(Number.isFinite).slice(-10)
    : [];
  ball.averageWallFreeFrames = ball.wallFreeIntervals.length > 0
    ? ball.wallFreeIntervals.reduce((sum, frames) => sum + frames, 0) / ball.wallFreeIntervals.length
    : 0;
  ball.lastWallHitFrame = Number.isFinite(stats.lastWallHitFrame)
    ? stats.lastWallHitFrame
    : frameNumber;
  ball.ballCollisionIntervals = Array.isArray(stats.ballCollisionIntervals)
    ? stats.ballCollisionIntervals.filter(Number.isFinite).slice(-10)
    : [];
  ball.averageBallCollisionFrames = ball.ballCollisionIntervals.length > 0
    ? ball.ballCollisionIntervals.reduce((sum, frames) => sum + frames, 0) / ball.ballCollisionIntervals.length
    : 0;
  ball.lastBallCollisionFrame = Number.isFinite(stats.lastBallCollisionFrame)
    ? stats.lastBallCollisionFrame
    : frameNumber;
}

function getSpeed(ball) {
  return Math.hypot(ball.hspeed, ball.vspeed);
}

function currentMaxSpeed(ball) {
  return ball.boostActive || ball.boostUsedThisFrame ? BOOST_MAX_SPEED : MAX_SPEED;
}

function limitSpeed(ball) {
  const speed = getSpeed(ball);
  const maximumSpeed = currentMaxSpeed(ball);
  if (speed > maximumSpeed) {
    const scale = maximumSpeed / speed;
    ball.hspeed *= scale;
    ball.vspeed *= scale;
  }
}

function getDirection(ball) {
  if (getSpeed(ball) < 0.0001) {
    return 0;
  }

  return normalizeAngle(Math.atan2(ball.vspeed, ball.hspeed));
}

function buildSensors(ball, otherBall, targetBall) {
  const dx = otherBall.x - ball.x;
  const dy = otherBall.y - ball.y;
  const targetDx = targetBall.x - ball.x;
  const targetDy = targetBall.y - ball.y;
  const targetDirection = Math.atan2(targetDy, targetDx);

  return {
    distancia_parede_esquerda: ball.x - BALL_RADIUS,
    distancia_parede_direita: WORLD_SIZE - BALL_RADIUS - ball.x,
    distancia_parede_teto: WORLD_SIZE - BALL_RADIUS - ball.y,
    distancia_parede_chao: ball.y - BALL_RADIUS,
    velocidade: getSpeed(ball),
    direcao: getDirection(ball),
    distancia_da_outra_bolinha: Math.hypot(dx, dy),
    direcao_da_outra_bolinha: normalizeAngle(Math.atan2(dy, dx)),
    velocidade_da_outra_bolinha: getSpeed(otherBall),
    distancia_bolinha_amarela: Math.hypot(targetDx, targetDy),
    diferenca_direcao_amarela: signedAngleDifference(targetDirection, getDirection(ball)),
    carga_boost: ball.boostCharge
  };
}

function normalizeSensors(sensors) {
  return [
    sensors.distancia_parede_esquerda / WORLD_SIZE,
    sensors.distancia_parede_direita / WORLD_SIZE,
    sensors.distancia_parede_teto / WORLD_SIZE,
    sensors.distancia_parede_chao / WORLD_SIZE,
    sensors.velocidade / BOOST_MAX_SPEED,
    sensors.direcao / TWO_PI,
    sensors.distancia_da_outra_bolinha / (Math.SQRT2 * WORLD_SIZE),
    sensors.direcao_da_outra_bolinha / TWO_PI,
    sensors.velocidade_da_outra_bolinha / BOOST_MAX_SPEED,
    sensors.distancia_bolinha_amarela / (Math.SQRT2 * WORLD_SIZE),
    sensors.diferenca_direcao_amarela / Math.PI,
    sensors.carga_boost / BOOST_MAX_CHARGE
  ];
}

function updateBoost(ball) {
  const wantsBoost = ball.output.boost;
  let usedBoost = false;
  let deactivatedThisFrame = false;

  if (ball.boostActive) {
    if (!wantsBoost || ball.boostCharge <= 0) {
      ball.boostActive = false;
      ball.boostCooldown = BOOST_REUSE_COOLDOWN;
      deactivatedThisFrame = true;
    }
  } else if (ball.boostCooldown > 0) {
    ball.boostCooldown -= 1;
  } else if (!deactivatedThisFrame && wantsBoost && ball.boostCharge > BOOST_START_THRESHOLD) {
    ball.boostActive = true;
  }

  if (ball.boostActive) {
    usedBoost = true;
    ball.boostCharge = Math.max(0, ball.boostCharge - BOOST_DRAIN_PER_FRAME);
    if (ball.boostCharge <= 0) {
      ball.boostActive = false;
      ball.boostCooldown = BOOST_REUSE_COOLDOWN;
    }
  } else {
    ball.boostCharge = Math.min(BOOST_MAX_CHARGE, ball.boostCharge + BOOST_RECHARGE_PER_FRAME);
  }

  return usedBoost;
}

function applyBrain(ball, otherBall, targetBall) {
  ball.sensors = buildSensors(ball, otherBall, targetBall);
  ball.lastCache = forwardBrain(ball.brain, normalizeSensors(ball.sensors));
  ball.output = ball.lastCache.action;

  const usedBoost = updateBoost(ball);
  ball.boostUsedThisFrame = usedBoost;

  if (usedBoost) {
    ball.output.acceleration = ball.lastCache.rawOutput[0] * BOOST_ACCELERATION;
  }

  ball.hspeed += Math.cos(ball.output.direction) * ball.output.acceleration;
  ball.vspeed += Math.sin(ball.output.direction) * ball.output.acceleration;

  limitSpeed(ball);
}

function moveBall(ball) {
  let hits = 0;

  ball.x += ball.hspeed;
  ball.y += ball.vspeed;

  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.hspeed = Math.abs(ball.hspeed) * WALL_BOUNCE;
    hits += 1;
  }

  if (ball.x + BALL_RADIUS > WORLD_SIZE) {
    ball.x = WORLD_SIZE - BALL_RADIUS;
    ball.hspeed = -Math.abs(ball.hspeed) * WALL_BOUNCE;
    hits += 1;
  }

  if (ball.y - BALL_RADIUS < 0) {
    ball.y = BALL_RADIUS;
    ball.vspeed = Math.abs(ball.vspeed) * WALL_BOUNCE;
    hits += 1;
  }

  if (ball.y + BALL_RADIUS > WORLD_SIZE) {
    ball.y = WORLD_SIZE - BALL_RADIUS;
    ball.vspeed = -Math.abs(ball.vspeed) * WALL_BOUNCE;
    hits += 1;
  }

  if (hits > 0) {
    const wallFreeFrames = Math.max(1, frameNumber - ball.lastWallHitFrame);
    ball.wallFreeIntervals.push(wallFreeFrames);
    ball.wallFreeIntervals = ball.wallFreeIntervals.slice(-10);
    ball.averageWallFreeFrames = ball.wallFreeIntervals.reduce((sum, frames) => {
      return sum + frames;
    }, 0) / ball.wallFreeIntervals.length;
    ball.lastWallHitFrame = frameNumber;
  }

  applyWallRepulsion(ball);

  limitSpeed(ball);

  return hits;
}

function applyWallRepulsion(ball) {
  const collisionIsRecent = frameNumber - ball.lastWallHitFrame <= WALL_REPULSION_WINDOW;
  if (!collisionIsRecent || getSpeed(ball) >= WALL_REPULSION_SPEED_THRESHOLD) {
    return false;
  }

  const distances = {
    left: ball.x - BALL_RADIUS,
    right: WORLD_SIZE - BALL_RADIUS - ball.x,
    floor: ball.y - BALL_RADIUS,
    ceiling: WORLD_SIZE - BALL_RADIUS - ball.y
  };
  let pushX = 0;
  let pushY = 0;

  if (distances.left < WALL_REPULSION_DISTANCE) {
    pushX += 1 - distances.left / WALL_REPULSION_DISTANCE;
  }
  if (distances.right < WALL_REPULSION_DISTANCE) {
    pushX -= 1 - distances.right / WALL_REPULSION_DISTANCE;
  }
  if (distances.floor < WALL_REPULSION_DISTANCE) {
    pushY += 1 - distances.floor / WALL_REPULSION_DISTANCE;
  }
  if (distances.ceiling < WALL_REPULSION_DISTANCE) {
    pushY -= 1 - distances.ceiling / WALL_REPULSION_DISTANCE;
  }

  const pushLength = Math.hypot(pushX, pushY);
  if (pushLength <= 0) {
    return false;
  }

  ball.hspeed += pushX / pushLength * WALL_REPULSION_FORCE;
  ball.vspeed += pushY / pushLength * WALL_REPULSION_FORCE;
  return true;
}

function resolveBallCollision(ballA, ballB) {
  const dx = ballB.x - ballA.x;
  const dy = ballB.y - ballA.y;
  const distance = Math.hypot(dx, dy);

  if (distance >= BALL_DIAMETER) {
    return false;
  }

  const normalX = distance > 0 ? dx / distance : 1;
  const normalY = distance > 0 ? dy / distance : 0;
  const overlap = BALL_DIAMETER + BALL_EXTRA_SEPARATION - distance;

  ballA.x -= normalX * overlap * 0.5;
  ballA.y -= normalY * overlap * 0.5;
  ballB.x += normalX * overlap * 0.5;
  ballB.y += normalY * overlap * 0.5;

  const relativeVelocityX = ballB.hspeed - ballA.hspeed;
  const relativeVelocityY = ballB.vspeed - ballA.vspeed;
  const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;

  if (velocityAlongNormal < 0) {
    const impulse = -((1 + BALL_BOUNCE) * velocityAlongNormal) / 2;
    ballA.hspeed -= impulse * normalX;
    ballA.vspeed -= impulse * normalY;
    ballB.hspeed += impulse * normalX;
    ballB.vspeed += impulse * normalY;
  }

  ballA.hspeed -= normalX * BALL_SEPARATION_KICK;
  ballA.vspeed -= normalY * BALL_SEPARATION_KICK;
  ballB.hspeed += normalX * BALL_SEPARATION_KICK;
  ballB.vspeed += normalY * BALL_SEPARATION_KICK;

  keepInside(ballA);
  keepInside(ballB);
  limitSpeed(ballA);
  limitSpeed(ballB);

  return true;
}

function keepInside(ball) {
  ball.x = clamp(ball.x, BALL_RADIUS, WORLD_SIZE - BALL_RADIUS);
  ball.y = clamp(ball.y, BALL_RADIUS, WORLD_SIZE - BALL_RADIUS);
}

function directionToCenter(ball) {
  return Math.atan2(WORLD_SIZE * 0.5 - ball.y, WORLD_SIZE * 0.5 - ball.x);
}

function weightedGoalDirection(ball, otherBall, targetBall, touchedYellow) {
  const directionToOther = Math.atan2(otherBall.y - ball.y, otherBall.x - ball.x);
  const directionToYellow = Math.atan2(targetBall.y - ball.y, targetBall.x - ball.x);
  const distanceToOther = Math.hypot(otherBall.x - ball.x, otherBall.y - ball.y);
  const distanceToYellow = Math.hypot(targetBall.x - ball.x, targetBall.y - ball.y);
  let vectorX;
  let vectorY;

  if (ball.role === "blue") {
    const fleeWeight = clamp((260 - distanceToOther) / 260, 0, 1) * 2.2;
    const awayFromRed = normalizeAngle(directionToOther + Math.PI);
    vectorX = Math.cos(directionToYellow) * 1.5 + Math.cos(awayFromRed) * fleeWeight;
    vectorY = Math.sin(directionToYellow) * 1.5 + Math.sin(awayFromRed) * fleeWeight;
  } else {
    const yellowDanger = touchedYellow
      ? 4
      : clamp((220 - distanceToYellow) / 220, 0, 1) * 2.5;
    const awayFromYellow = normalizeAngle(directionToYellow + Math.PI);
    vectorX = Math.cos(directionToOther) + Math.cos(awayFromYellow) * yellowDanger;
    vectorY = Math.sin(directionToOther) + Math.sin(awayFromYellow) * yellowDanger;
  }

  return Math.atan2(vectorY, vectorX);
}

function learningTarget(ball, otherBall, targetBall, wallHits, touchedYellow) {
  const current = ball.lastCache ? ball.lastCache.rawOutput : [1, 0.5, 0];
  const accelerationTarget = 1;
  let targetDirection;
  let boostTarget = 0;

  if (wallHits > 0) {
    targetDirection = directionToCenter(ball);
  } else {
    targetDirection = weightedGoalDirection(ball, otherBall, targetBall, touchedYellow);

    const distanceToOther = Math.hypot(otherBall.x - ball.x, otherBall.y - ball.y);
    const distanceToYellow = Math.hypot(targetBall.x - ball.x, targetBall.y - ball.y);
    const hasStartCharge = ball.boostActive || (ball.boostCooldown === 0 && ball.boostCharge > BOOST_START_THRESHOLD);

    if (ball.role === "blue") {
      boostTarget = hasStartCharge && (distanceToYellow > 180 || distanceToOther < 170) ? 1 : 0;
    } else {
      boostTarget = hasStartCharge && (distanceToOther > 200 || distanceToYellow < 110) ? 1 : 0;
    }
  }

  return [
    accelerationTarget,
    angleToOutput(targetDirection, current[1]),
    boostTarget
  ];
}

function applyLearning(ball, otherBall, targetBall, reward, wallHits, touchedYellow) {
  const target = learningTarget(ball, otherBall, targetBall, wallHits, touchedYellow);
  const strength = Math.abs(reward) + (wallHits > 0 ? 2 : 0);

  trainBrain(ball.brain, ball.lastCache, target, strength);
}

function recordBallCollisionInterval(ball) {
  const collisionFreeFrames = Math.max(1, frameNumber - ball.lastBallCollisionFrame);
  ball.ballCollisionIntervals.push(collisionFreeFrames);
  ball.ballCollisionIntervals = ball.ballCollisionIntervals.slice(-10);
  ball.averageBallCollisionFrames = ball.ballCollisionIntervals.reduce((sum, frames) => {
    return sum + frames;
  }, 0) / ball.ballCollisionIntervals.length;
  ball.lastBallCollisionFrame = frameNumber;
}

function recordReward(ball, reward) {
  ball.rewardSum += reward;
  ball.rewardFrames += 1;
  ball.rewardAverage = ball.rewardSum / ball.rewardFrames;

  if (ball.recentRewards.length < 1000) {
    ball.recentRewards.push(reward);
    ball.recentRewardSum += reward;
  } else {
    ball.recentRewardSum -= ball.recentRewards[ball.recentRewardIndex];
    ball.recentRewards[ball.recentRewardIndex] = reward;
    ball.recentRewardSum += reward;
    ball.recentRewardIndex = (ball.recentRewardIndex + 1) % 1000;
  }

  ball.recentRewardAverage = ball.recentRewardSum / ball.recentRewards.length;
}

function updateRewards(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow) {
  redBall.rewardNow = redWallHits * WALL_PENALTY;
  blueBall.rewardNow = blueWallHits * WALL_PENALTY;

  if (ballCollisionRewarded) {
    redBall.rewardNow += RED_HIT_REWARD;
    blueBall.rewardNow += BLUE_HIT_PENALTY;
    recordBallCollisionInterval(redBall);
    recordBallCollisionInterval(blueBall);
  } else {
    redBall.rewardNow += RED_SLOW_PENALTY;
    blueBall.rewardNow += BLUE_SLOW_REWARD;
  }

  if (blueTouchedYellow) {
    blueBall.rewardNow += BLUE_YELLOW_REWARD;
    redBall.rewardNow += RED_BLUE_GOT_YELLOW_PENALTY;
  }

  if (redTouchedYellow) {
    redBall.rewardNow += RED_YELLOW_PENALTY;
  }

  recordReward(redBall, redBall.rewardNow);
  recordReward(blueBall, blueBall.rewardNow);
}

function updateGeneticTraining(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow) {
  const redIndividual = currentGeneticIndividual("red");
  const blueIndividual = currentGeneticIndividual("blue");
  let redFrameScore = 0;
  let blueFrameScore = 1;

  if (ballCollisionRewarded) {
    redFrameScore += GENETIC_SCORE_BONUS;
    recordBallCollisionInterval(redBall);
    recordBallCollisionInterval(blueBall);
  }

  if (blueTouchedYellow) {
    blueFrameScore += GENETIC_SCORE_BONUS;
  }

  if (blueWallHits > 0) {
    redFrameScore += GENETIC_BLUE_WALL_BONUS;
  }

  redIndividual.score += redFrameScore;
  blueIndividual.score += blueFrameScore;
  redBall.rewardNow = redFrameScore;
  blueBall.rewardNow = blueFrameScore;
  recordReward(redBall, redFrameScore);
  recordReward(blueBall, blueFrameScore);

  const redDied = redWallHits > 0 || redTouchedYellow || blueTouchedYellow;
  const blueDied = blueWallHits > 0;

  if (redDied) {
    killGeneticIndividual("red");
  }

  if (blueDied) {
    killGeneticIndividual("blue");
  }
}

function touchesYellow(ball) {
  return Math.hypot(ball.x - yellowBall.x, ball.y - yellowBall.y) <= BALL_RADIUS + YELLOW_RADIUS;
}

function update() {
  frameNumber += 1;

  applyBrain(redBall, blueBall, yellowBall);
  applyBrain(blueBall, redBall, yellowBall);

  const redWallHits = moveBall(redBall);
  const blueWallHits = moveBall(blueBall);
  const touching = resolveBallCollision(redBall, blueBall);
  const canRewardBallCollision = frameNumber - lastRewardedBallCollisionFrame > BALL_COLLISION_COOLDOWN;
  const ballCollisionRewarded = touching && canRewardBallCollision;

  if (ballCollisionRewarded) {
    lastRewardedBallCollisionFrame = frameNumber;
  }

  const redTouchedYellow = touchesYellow(redBall);
  const blueTouchedYellow = touchesYellow(blueBall);

  if (trainingAlgorithm === "genetic") {
    updateGeneticTraining(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow);
  } else {
    updateRewards(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow);
    applyLearning(redBall, blueBall, yellowBall, redBall.rewardNow, redWallHits, redTouchedYellow);
    applyLearning(blueBall, redBall, yellowBall, blueBall.rewardNow, blueWallHits, blueTouchedYellow);
  }

  const yellowExpired = frameNumber - yellowBall.lastMovedFrame >= YELLOW_RESPAWN_FRAMES;
  if (redTouchedYellow || blueTouchedYellow || yellowExpired) {
    relocateYellowBall();
  }

  redBall.sensors = buildSensors(redBall, blueBall, yellowBall);
  blueBall.sensors = buildSensors(blueBall, redBall, yellowBall);
  updateTableAverageSnapshot();
}

function drawGrid() {
  ctx.clearRect(0, 0, WORLD_SIZE, WORLD_SIZE);
  ctx.fillStyle = "#12151a";
  ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#262b33";

  for (let line = 60; line < WORLD_SIZE; line += 60) {
    ctx.beginPath();
    ctx.moveTo(line, 0);
    ctx.lineTo(line, WORLD_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, line);
    ctx.lineTo(WORLD_SIZE, line);
    ctx.stroke();
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d4d8df";
  ctx.strokeRect(2, 2, WORLD_SIZE - 4, WORLD_SIZE - 4);
}

function drawBall(ball) {
  const screenY = WORLD_SIZE - ball.y;

  ctx.beginPath();
  ctx.arc(ball.x, screenY, BALL_RADIUS, 0, TWO_PI);
  ctx.fillStyle = ball.color;
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  const direction = getDirection(ball);
  ctx.beginPath();
  ctx.moveTo(ball.x, screenY);
  ctx.lineTo(
    ball.x + Math.cos(direction) * BALL_RADIUS * 1.8,
    screenY - Math.sin(direction) * BALL_RADIUS * 1.8
  );
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

function drawYellowBall() {
  const screenY = WORLD_SIZE - yellowBall.y;

  ctx.beginPath();
  ctx.arc(yellowBall.x, screenY, YELLOW_RADIUS, 0, TWO_PI);
  ctx.fillStyle = "#ffd633";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff4ad";
  ctx.stroke();
}

function draw() {
  drawGrid();
  drawYellowBall();
  drawBall(redBall);
  drawBall(blueBall);
}

function formatMetricValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(3);
  }

  return value == null ? "0.000" : String(value);
}

function getMetricValues(ball, averages, role) {
  const geneticController = trainingAlgorithm === "genetic" && geneticState ? geneticState[role] : null;
  const geneticIndividual = geneticController ? geneticController.population[geneticController.currentIndex] : null;

  return {
    ...ball.sensors,
    velocidade: getSpeed(ball),
    direcao: getDirection(ball),
    carga_boost: ball.boostCharge,
    aceleracao_saida: ball.output.acceleration,
    recompensa_recente: averages.recentRewardAverage,
    recompensa_media: averages.rewardAverage,
    media_sem_parede: averages.averageWallFreeFrames,
    media_entre_bolas: averages.averageBallCollisionFrames,
    score_genetico: geneticIndividual ? geneticIndividual.score : 0,
    geracao_genetica: geneticController ? geneticController.generation : 0,
    individuo_genetico: geneticController ? `${geneticController.currentIndex + 1}/${GENETIC_POPULATION_SIZE}` : "-"
  };
}

function captureTableAverages() {
  return {
    red: {
      recentRewardAverage: redBall.recentRewardAverage,
      rewardAverage: redBall.rewardAverage,
      averageWallFreeFrames: averageIncludingCurrent(
        redBall.wallFreeIntervals,
        frameNumber - redBall.lastWallHitFrame
      ),
      averageBallCollisionFrames: averageIncludingCurrent(
        redBall.ballCollisionIntervals,
        frameNumber - redBall.lastBallCollisionFrame
      )
    },
    blue: {
      recentRewardAverage: blueBall.recentRewardAverage,
      rewardAverage: blueBall.rewardAverage,
      averageWallFreeFrames: averageIncludingCurrent(
        blueBall.wallFreeIntervals,
        frameNumber - blueBall.lastWallHitFrame
      ),
      averageBallCollisionFrames: averageIncludingCurrent(
        blueBall.ballCollisionIntervals,
        frameNumber - blueBall.lastBallCollisionFrame
      )
    }
  };
}

function averageIncludingCurrent(completedIntervals, currentInterval) {
  const samples = completedIntervals.slice(-9);
  samples.push(Math.max(0, currentInterval));
  return samples.reduce((sum, frames) => sum + frames, 0) / samples.length;
}

function updateTableAverageSnapshot(force = false) {
  if (force || !tableAverageSnapshot || frameNumber % 10 === 0) {
    tableAverageSnapshot = captureTableAverages();
    lastTableAverageFrame = frameNumber;
  }
}

function renderMetricCell(row, value, color, ball) {
  if (row.type !== "bar") {
    return formatMetricValue(value);
  }

  const safeValue = Number.isFinite(value) ? value : 0;
  const percentage = clamp(safeValue / row.max * 100, 0, 100);
  const boosted = row.boostEffect && ball.boostUsedThisFrame;
  const boostedClass = boosted ? " boosted" : "";
  const multiplier = boosted ? '<span class="boost-multiplier">x2</span>' : "";
  return `<div class="metric-bar-shell"><div class="metric-bar ${color}${boostedClass}" role="progressbar" aria-label="${row.label} ${color}" aria-valuemin="0" aria-valuemax="${row.max}" aria-valuenow="${safeValue.toFixed(3)}"><span class="metric-bar-fill" style="width:${percentage}%"></span></div>${multiplier}</div>`;
}

function renderMetricsTable() {
  updateTableAverageSnapshot(!tableAverageSnapshot);

  const redValues = getMetricValues(redBall, tableAverageSnapshot.red, "red");
  const blueValues = getMetricValues(blueBall, tableAverageSnapshot.blue, "blue");
  const activeRows = trainingAlgorithm === "genetic"
    ? [...metricRows.slice(0, 3), ...geneticMetricRows, ...metricRows.slice(3)]
    : metricRows;

  metricsTableBody.innerHTML = activeRows.map((row) => {
    return `<tr><td>${renderMetricCell(row, redValues[row.key], "red", redBall)}</td><td>${row.label}</td><td>${renderMetricCell(row, blueValues[row.key], "blue", blueBall)}</td></tr>`;
  }).join("");
}

function getSimulationState() {
  return {
    frameNumber,
    trainingAlgorithm,
    genetic: geneticState ? {
      red: {
        generation: geneticState.red.generation,
        currentIndex: geneticState.red.currentIndex,
        currentScore: geneticState.red.population[geneticState.red.currentIndex].score,
        lastBestScore: geneticState.red.lastBestScore
      },
      blue: {
        generation: geneticState.blue.generation,
        currentIndex: geneticState.blue.currentIndex,
        currentScore: geneticState.blue.population[geneticState.blue.currentIndex].score,
        lastBestScore: geneticState.blue.lastBestScore
      }
    } : null,
    constants: {
      ballRadius: BALL_RADIUS,
      maxSpeed: MAX_SPEED,
      boostMaxSpeed: BOOST_MAX_SPEED,
      boostMaxCharge: BOOST_MAX_CHARGE,
      worldSize: WORLD_SIZE
    },
    red: {
      x: redBall.x,
      y: redBall.y,
      hspeed: redBall.hspeed,
      vspeed: redBall.vspeed,
      speed: getSpeed(redBall),
      rewardNow: redBall.rewardNow,
      rewardAverage: redBall.rewardAverage,
      recentRewardAverage: redBall.recentRewardAverage,
      boostCharge: redBall.boostCharge,
      boostActive: redBall.boostActive,
      boostCooldown: redBall.boostCooldown,
      averageWallFreeFrames: redBall.averageWallFreeFrames,
      wallFreeSamples: redBall.wallFreeIntervals.length,
      averageBallCollisionFrames: redBall.averageBallCollisionFrames,
      ballCollisionSamples: redBall.ballCollisionIntervals.length,
      sensors: redBall.sensors,
      output: redBall.output
    },
    blue: {
      x: blueBall.x,
      y: blueBall.y,
      hspeed: blueBall.hspeed,
      vspeed: blueBall.vspeed,
      speed: getSpeed(blueBall),
      rewardNow: blueBall.rewardNow,
      rewardAverage: blueBall.rewardAverage,
      recentRewardAverage: blueBall.recentRewardAverage,
      boostCharge: blueBall.boostCharge,
      boostActive: blueBall.boostActive,
      boostCooldown: blueBall.boostCooldown,
      averageWallFreeFrames: blueBall.averageWallFreeFrames,
      wallFreeSamples: blueBall.wallFreeIntervals.length,
      averageBallCollisionFrames: blueBall.averageBallCollisionFrames,
      ballCollisionSamples: blueBall.ballCollisionIntervals.length,
      sensors: blueBall.sensors,
      output: blueBall.output
    },
    yellow: {
      x: yellowBall.x,
      y: yellowBall.y,
      radius: yellowBall.radius,
      lastMovedFrame: yellowBall.lastMovedFrame
    }
  };
}

function renderPanel() {
  renderMetricsTable();
  canvas.dataset.state = JSON.stringify(getSimulationState());
}

function updateRateDisplay(now, label) {
  const elapsed = now - rateWindowStartedAt;
  if (elapsed < 1000) {
    return;
  }

  rateLabel.textContent = label;
  fpsValue.textContent = Math.round(stepsInRateWindow * 1000 / elapsed).toLocaleString("pt-BR");
  stepsInRateWindow = 0;
  rateWindowStartedAt = now;
}

function visualizationLoop(now) {
  if (simulationMode !== "visualization") {
    return;
  }

  frameAccumulator += now - lastFrameTime;
  lastFrameTime = now;

  while (frameAccumulator >= FRAME_MS) {
    update();
    frameAccumulator -= FRAME_MS;
    framesSinceFpsUpdate += 1;
    stepsInRateWindow += 1;
  }

  draw();
  renderPanel();

  updateRateDisplay(now, "FPS");
  framesSinceFpsUpdate = 0;
  lastFpsUpdate = now;

  visualizationRequestId = requestAnimationFrame(visualizationLoop);
}

function trainingLoop() {
  if (simulationMode !== "training") {
    return;
  }

  for (let step = 0; step < TRAINING_BATCH_STEPS; step += 1) {
    update();
  }

  stepsInRateWindow += TRAINING_BATCH_STEPS;
  const now = performance.now();
  updateRateDisplay(now, "Passos/s");

  if (frameNumber - lastTrainingRenderFrame >= TRAINING_RENDER_EVERY) {
    draw();
    renderPanel();
    lastTrainingRenderFrame = frameNumber;
  }

  trainingTimerId = setTimeout(trainingLoop, 0);
}

function setSimulationMode(mode) {
  simulationMode = mode;
  const training = mode === "training";

  modeToggle.setAttribute("aria-checked", String(training));
  modeLabel.textContent = training ? "Treino" : "Visualizacao";
  rateLabel.textContent = training ? "Passos/s" : "FPS";
  stepsInRateWindow = 0;
  rateWindowStartedAt = performance.now();

  if (visualizationRequestId !== null) {
    cancelAnimationFrame(visualizationRequestId);
    visualizationRequestId = null;
  }

  if (trainingTimerId !== null) {
    clearTimeout(trainingTimerId);
    trainingTimerId = null;
  }

  if (training) {
    lastTrainingRenderFrame = frameNumber;
    trainingLoop();
  } else {
    lastFrameTime = performance.now();
    frameAccumulator = 0;
    visualizationRequestId = requestAnimationFrame(visualizationLoop);
  }
}

function toggleSimulationMode() {
  setSimulationMode(simulationMode === "visualization" ? "training" : "visualization");
}

function setTrainingAlgorithm(algorithm) {
  if (algorithm !== "backprop" && algorithm !== "genetic") {
    return;
  }

  if (algorithm === trainingAlgorithm && (algorithm !== "genetic" || geneticState)) {
    updateAlgorithmControls();
    return;
  }

  trainingAlgorithm = algorithm;

  if (trainingAlgorithm === "genetic") {
    if (!geneticState) {
      initializeGeneticTraining();
    } else {
      synchronizeCurrentBrainsToGenetic();
    }
  }

  tableAverageSnapshot = null;
  updateAlgorithmControls();
  renderPanel();
}

function updateAlgorithmControls() {
  const genetic = trainingAlgorithm === "genetic";
  backpropButton.classList.toggle("active", !genetic);
  geneticButton.classList.toggle("active", genetic);
  backpropButton.setAttribute("aria-pressed", String(!genetic));
  geneticButton.setAttribute("aria-pressed", String(genetic));
  algorithmValue.textContent = genetic ? "Genetico" : "Backprop";
}

function performFullReset() {
  cancelResetConfirmation();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Nao foi possivel apagar o treinamento salvo.", error);
  }

  geneticState = null;
  resetSimulation();

  if (trainingAlgorithm === "genetic") {
    initializeGeneticTraining();
  }

  updateAlgorithmControls();
  draw();
  renderPanel();
}

function cancelResetConfirmation() {
  if (resetConfirmationTimer !== null) {
    clearTimeout(resetConfirmationTimer);
    resetConfirmationTimer = null;
  }

  resetConfirmationPending = false;
  resetButton.textContent = "Reiniciar";
  resetButton.classList.remove("confirming");
  resetButton.setAttribute("aria-label", "Reiniciar todo o experimento");
}

function handleResetButtonClick() {
  if (resetConfirmationPending) {
    performFullReset();
    return;
  }

  resetConfirmationPending = true;
  resetButton.textContent = "Confirmar reset";
  resetButton.classList.add("confirming");
  resetButton.setAttribute("aria-label", "Clique novamente para confirmar o reset completo");
  resetConfirmationTimer = setTimeout(cancelResetConfirmation, RESET_CONFIRMATION_MS);
}

window.bolinhaIA = {
  getState: getSimulationState,
  reset: performFullReset,
  saveTraining,
  setMode: setSimulationMode,
  setAlgorithm: setTrainingAlgorithm
};

modeToggle.addEventListener("click", toggleSimulationMode);
resetButton.addEventListener("click", handleResetButtonClick);
backpropButton.addEventListener("click", () => setTrainingAlgorithm("backprop"));
geneticButton.addEventListener("click", () => setTrainingAlgorithm("genetic"));
window.addEventListener("pagehide", saveTraining);
setInterval(saveTraining, SAVE_INTERVAL_MS);

resetSimulation();
loadTraining();
updateAlgorithmControls();
draw();
renderPanel();
setSimulationMode("visualization");
