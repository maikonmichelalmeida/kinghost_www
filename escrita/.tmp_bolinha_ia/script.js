"use strict";

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const resetButton = document.getElementById("resetButton");
const modeToggle = document.getElementById("modeToggle");
const modeLabel = document.getElementById("modeLabel");
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
const MAX_SPEED = 5;
const BOOST_MAX_SPEED = 10;
const BOOST_MAX_CHARGE = 150;
const BOOST_START_THRESHOLD = 30;
const BOOST_REUSE_COOLDOWN = 60;
const BOOST_RECHARGE_PER_FRAME = 0.2;
const BOOST_DRAIN_PER_FRAME = 1;
const WALL_BOUNCE = 0.94;
const BALL_BOUNCE = 0.98;
const BALL_SEPARATION_KICK = 2.8;
const BALL_EXTRA_SEPARATION = 4;
const ACTOR_LEARNING_RATE = 0.0003;
const CRITIC_LEARNING_RATE = 0.001;
const PPO_ROLLOUT_FRAMES = FPS * 8;
const REWARD_DISCOUNT = 0.99;
const GAE_LAMBDA = 0.97;
const PPO_CLIP_RANGE = 0.2;
const PPO_VALUE_CLIP_RANGE = 0.2;
const PPO_EPOCHS = 4;
const PPO_TARGET_KL = 0.03;
const ENTROPY_COEFFICIENT = 0.02;
const GRADIENT_CLIP_NORM = 0.5;
const POLICY_MINIBATCH_SIZE = 64;
const MIN_PROBABILITY = 1e-8;
const DIRECTION_BINS = 8;
const DIRECTION_OUTPUT_OFFSET = 0;
const BOOST_OUTPUT_INDEX = DIRECTION_BINS;
const VALUE_OUTPUT_INDEX = BOOST_OUTPUT_INDEX + 1;
const NETWORK_OUTPUT_SIZE = VALUE_OUTPUT_INDEX + 1;
const WALL_PENALTY = -8;
const WALL_SAFE_CLEARANCE = 90;
const WALL_PROXIMITY_PENALTY = 0.02;
const WALL_SAFE_REWARD = 0.001;
const WALL_PROGRESS_REWARD = 0.004;
const RED_HIT_REWARD = 12;
const BLUE_HIT_PENALTY = -4;
const BLUE_YELLOW_REWARD = 18;
const RED_YELLOW_PENALTY = -12;
const RED_BLUE_GOT_YELLOW_PENALTY = -32;
const RED_CHASE_PROGRESS_REWARD = 0.0015;
const BLUE_FLEE_PROGRESS_REWARD = 0.001;
const BLUE_TARGET_PROGRESS_REWARD = 0.0015;
const BALL_COLLISION_COOLDOWN = 10;
const YELLOW_RESPAWN_FRAMES = FPS * 30;
const TRAINING_BATCH_STEPS = 50;
const TRAINING_RENDER_EVERY = 12000;
const STORAGE_KEY = "bolinhaIA.training.v3";
const SAVE_INTERVAL_MS = 30000;
const WALL_REPULSION_DISTANCE = 28;
const WALL_REPULSION_SPEED_THRESHOLD = 1.25;
const WALL_REPULSION_FORCE = 1.5;
const WALL_REPULSION_WINDOW = 20;
const RESET_CONFIRMATION_MS = 4000;
const SENSOR_COUNT = 7;
const SENSOR_HISTORY_MAX_AGE = 120;
const SENSOR_HISTORY_AGES = [
  0, 1,
  ...Array.from({ length: 24 }, (_, index) => 5 + index * 5)
];
const TEMPORAL_INPUT_SIZE = SENSOR_HISTORY_AGES.length * SENSOR_COUNT;

const metricRows = [
  { key: "velocidade", label: "Velocidade", type: "bar", max: MAX_SPEED, boostEffect: true },
  { key: "carga_boost", label: "Boost", type: "bar", max: BOOST_MAX_CHARGE },
  { key: "direcao", label: "Direcao movimento" },
  { key: "diferenca_direcao_amarela", label: "Angulo amarela" },
  { key: "recompensa_recente", label: "Reward medio (1000 frames)", average: true },
  { key: "recompensa_media", label: "Reward medio total", average: true },
  { key: "media_sem_parede", label: "Frames sem parede (media 10)", average: true },
  { key: "media_entre_bolas", label: "Frames entre bolas (media 10)", average: true }
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

function createLayer(inputSize, outputSize) {
  const limit = Math.sqrt(6 / (inputSize + outputSize));
  return {
    weights: Array.from({ length: outputSize }, () =>
      Array.from({ length: inputSize }, () => randomBetween(-limit, limit))
    ),
    biases: Array(outputSize).fill(0)
  };
}

function createBrain() {
  return [
    createLayer(TEMPORAL_INPUT_SIZE, 48),
    createLayer(48, 24),
    createLayer(24, NETWORK_OUTPUT_SIZE)
  ];
}

function activate(value) {
  return Math.tanh(value);
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function softmax(values) {
  const maximum = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function sampleCategorical(probabilities) {
  const choice = Math.random();
  let cumulative = 0;

  for (let index = 0; index < probabilities.length; index += 1) {
    cumulative += probabilities[index];
    if (choice <= cumulative) {
      return index;
    }
  }

  return probabilities.length - 1;
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

      return isOutputLayer ? total : activate(total);
    });

    activations.push(next);
  });

  const output = activations[activations.length - 1];
  const directionProbabilities = softmax(
    output.slice(DIRECTION_OUTPUT_OFFSET, DIRECTION_OUTPUT_OFFSET + DIRECTION_BINS)
  );
  const boostProbability = sigmoid(output[BOOST_OUTPUT_INDEX]);

  return {
    activations,
    logits: output,
    policy: { directionProbabilities, boostProbability },
    value: output[VALUE_OUTPUT_INDEX]
  };
}

function createZeroGradients(brain) {
  return brain.map((layer) => ({
    weights: layer.weights.map((row) => row.map(() => 0)),
    biases: layer.biases.map(() => 0)
  }));
}

function accumulateExperienceGradients(brain, gradients, cache, outputDeltas) {
  const deltas = Array.from({ length: brain.length });
  deltas[brain.length - 1] = outputDeltas;

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
      row.forEach((unused, inputIndex) => {
        gradients[layerIndex].weights[outputIndex][inputIndex] +=
          deltas[layerIndex][outputIndex] * previous[inputIndex];
      });
      gradients[layerIndex].biases[outputIndex] += deltas[layerIndex][outputIndex];
    });
  });
}

function entropyGradient(probabilities, index) {
  const averageLog = probabilities.reduce((sum, probability) => {
    return sum + probability * Math.log(Math.max(probability, MIN_PROBABILITY));
  }, 0);
  const probability = probabilities[index];
  return ENTROPY_COEFFICIENT * probability *
    (Math.log(Math.max(probability, MIN_PROBABILITY)) - averageLog);
}

function categoricalEntropy(probabilities) {
  return -probabilities.reduce((sum, probability) => {
    return sum + probability * Math.log(Math.max(probability, MIN_PROBABILITY));
  }, 0);
}

function policyEntropy(policy) {
  const boostProbability = policy.boostProbability;
  const boostEntropy = -boostProbability * Math.log(Math.max(boostProbability, MIN_PROBABILITY)) -
    (1 - boostProbability) * Math.log(Math.max(1 - boostProbability, MIN_PROBABILITY));
  return categoricalEntropy(policy.directionProbabilities) + boostEntropy;
}

function policyLogProbability(policy, action) {
  const boostProbability = action.boost === 1
    ? policy.boostProbability
    : 1 - policy.boostProbability;
  return Math.log(Math.max(policy.directionProbabilities[action.directionIndex], MIN_PROBABILITY)) +
    Math.log(Math.max(boostProbability, MIN_PROBABILITY));
}

function buildActorOutputDeltas(cache, action, policyWeight) {
  const deltas = Array(NETWORK_OUTPUT_SIZE).fill(0);
  const direction = cache.policy.directionProbabilities;

  direction.forEach((probability, index) => {
    deltas[DIRECTION_OUTPUT_OFFSET + index] =
      (probability - (index === action.directionIndex ? 1 : 0)) * policyWeight +
      entropyGradient(direction, index);
  });

  const boostProbability = cache.policy.boostProbability;
  deltas[BOOST_OUTPUT_INDEX] =
    (boostProbability - action.boost) * policyWeight +
    ENTROPY_COEFFICIENT * boostProbability * (1 - boostProbability) *
      (Math.log(Math.max(boostProbability, MIN_PROBABILITY)) -
       Math.log(Math.max(1 - boostProbability, MIN_PROBABILITY)));
  return deltas;
}

function applyAccumulatedGradients(brain, gradients, sampleCount, learningRate) {
  let squaredNorm = 0;

  gradients.forEach((layer) => {
    layer.weights.forEach((row) => row.forEach((value) => {
      squaredNorm += (value / sampleCount) ** 2;
    }));
    layer.biases.forEach((value) => {
      squaredNorm += (value / sampleCount) ** 2;
    });
  });

  const norm = Math.sqrt(squaredNorm);
  const clipScale = norm > GRADIENT_CLIP_NORM ? GRADIENT_CLIP_NORM / norm : 1;

  brain.forEach((layer, layerIndex) => {
    layer.weights.forEach((row, outputIndex) => {
      row.forEach((weight, inputIndex) => {
        const gradient = gradients[layerIndex].weights[outputIndex][inputIndex] / sampleCount;
        row[inputIndex] = weight - learningRate * gradient * clipScale;
      });
      const biasGradient = gradients[layerIndex].biases[outputIndex] / sampleCount;
      layer.biases[outputIndex] -= learningRate * biasGradient * clipScale;
    });
  });

  return norm;
}

function calculateGAE(rollout, bootstrapValue) {
  const advantages = Array(rollout.length);
  const returns = Array(rollout.length);
  let nextValue = bootstrapValue;
  let gae = 0;

  for (let index = rollout.length - 1; index >= 0; index -= 1) {
    const delta = rollout[index].reward + REWARD_DISCOUNT * nextValue - rollout[index].value;
    gae = delta + REWARD_DISCOUNT * GAE_LAMBDA * gae;
    advantages[index] = gae;
    returns[index] = gae + rollout[index].value;
    nextValue = rollout[index].value;
  }
  return { advantages, returns };
}

function ppoPolicyWeight(advantage, ratio) {
  const isClipped = (advantage >= 0 && ratio > 1 + PPO_CLIP_RANGE) ||
    (advantage < 0 && ratio < 1 - PPO_CLIP_RANGE);
  return isClipped ? 0 : advantage * ratio;
}

function ppoPolicyLoss(advantage, ratio) {
  const unclipped = advantage * ratio;
  const clipped = advantage * clamp(ratio, 1 - PPO_CLIP_RANGE, 1 + PPO_CLIP_RANGE);
  return -Math.min(unclipped, clipped);
}

function clippedValueDelta(value, oldValue, targetReturn) {
  const clippedValue = oldValue + clamp(value - oldValue, -PPO_VALUE_CLIP_RANGE, PPO_VALUE_CLIP_RANGE);
  const regularError = value - targetReturn;
  const clippedError = clippedValue - targetReturn;

  if (clippedError ** 2 > regularError ** 2) {
    return Math.abs(value - oldValue) < PPO_VALUE_CLIP_RANGE ? clippedError : 0;
  }
  return regularError;
}

function applyCriticHeadGradients(brain, weightGradients, biasGradient, sampleCount) {
  const outputLayer = brain[brain.length - 1];
  const averageWeights = weightGradients.map((value) => value / sampleCount);
  const averageBias = biasGradient / sampleCount;
  const norm = Math.sqrt(
    averageWeights.reduce((sum, value) => sum + value ** 2, averageBias ** 2)
  );
  const clipScale = norm > GRADIENT_CLIP_NORM ? GRADIENT_CLIP_NORM / norm : 1;

  outputLayer.weights[VALUE_OUTPUT_INDEX].forEach((weight, index) => {
    outputLayer.weights[VALUE_OUTPUT_INDEX][index] =
      weight - CRITIC_LEARNING_RATE * averageWeights[index] * clipScale;
  });
  outputLayer.biases[VALUE_OUTPUT_INDEX] -= CRITIC_LEARNING_RATE * averageBias * clipScale;
  return norm;
}

function shuffledIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

function recordTemporalReward(ball, reward) {
  const current = ball.experienceBuffer[ball.experienceBuffer.length - 1];
  if (current) {
    current.reward += reward;
  }
}

function processPolicyRollout(ball, bootstrapInputs) {
  if (ball.experienceBuffer.length < PPO_ROLLOUT_FRAMES) {
    return false;
  }

  const rollout = ball.experienceBuffer.splice(0, PPO_ROLLOUT_FRAMES);
  const bootstrapValue = forwardBrain(ball.brain, bootstrapInputs).value;
  const { advantages: rawAdvantages, returns } = calculateGAE(rollout, bootstrapValue);
  const advantageMean = rawAdvantages.reduce((sum, value) => sum + value, 0) / rawAdvantages.length;
  const advantageVariance = rawAdvantages.reduce((sum, value) => {
    return sum + (value - advantageMean) ** 2;
  }, 0) / rawAdvantages.length;
  const advantageDeviation = Math.sqrt(advantageVariance + 1e-8);
  let policyLossSum = 0;
  let valueLossSum = 0;
  let entropySum = 0;
  let approximateKLSum = 0;
  let clippedSamples = 0;
  let trainedSamples = 0;
  let completedEpochs = 0;
  let lastActorGradientNorm = 0;
  let lastCriticGradientNorm = 0;

  for (let epoch = 0; epoch < PPO_EPOCHS; epoch += 1) {
    const sampleIndexes = shuffledIndexes(rollout.length).slice(0, POLICY_MINIBATCH_SIZE);
    const actorGradients = createZeroGradients(ball.brain);
    const criticWeightGradients = Array(ball.brain[ball.brain.length - 1].weights[VALUE_OUTPUT_INDEX].length).fill(0);
    let criticBiasGradient = 0;
    let epochKLSum = 0;

    sampleIndexes.forEach((index) => {
      const experience = rollout[index];
      const normalizedAdvantage = (rawAdvantages[index] - advantageMean) / advantageDeviation;
      const cache = forwardBrain(ball.brain, experience.inputs);
      const newLogProbability = policyLogProbability(cache.policy, experience.action);
      const ratio = Math.exp(clamp(newLogProbability - experience.logProbability, -20, 20));
      const policyWeight = ppoPolicyWeight(normalizedAdvantage, ratio);
      const valueDelta = clippedValueDelta(cache.value, experience.value, returns[index]);
      const hiddenOutput = cache.activations[cache.activations.length - 2];

      policyLossSum += ppoPolicyLoss(normalizedAdvantage, ratio);
      valueLossSum += 0.5 * Math.max(
        (cache.value - returns[index]) ** 2,
        (experience.value + clamp(cache.value - experience.value, -PPO_VALUE_CLIP_RANGE, PPO_VALUE_CLIP_RANGE) - returns[index]) ** 2
      );
      entropySum += policyEntropy(cache.policy);
      approximateKLSum += experience.logProbability - newLogProbability;
      epochKLSum += experience.logProbability - newLogProbability;
      clippedSamples += policyWeight === 0 ? 1 : 0;
      trainedSamples += 1;

      const actorDeltas = buildActorOutputDeltas(cache, experience.action, policyWeight);
      accumulateExperienceGradients(ball.brain, actorGradients, cache, actorDeltas);
      hiddenOutput.forEach((value, hiddenIndex) => {
        criticWeightGradients[hiddenIndex] += valueDelta * value;
      });
      criticBiasGradient += valueDelta;
    });

    lastActorGradientNorm = applyAccumulatedGradients(
      ball.brain,
      actorGradients,
      sampleIndexes.length,
      ACTOR_LEARNING_RATE
    );
    lastCriticGradientNorm = applyCriticHeadGradients(
      ball.brain,
      criticWeightGradients,
      criticBiasGradient,
      sampleIndexes.length
    );
    completedEpochs += 1;

    if (Math.abs(epochKLSum / sampleIndexes.length) > PPO_TARGET_KL) {
      break;
    }
  }

  ball.lastGradientNorm = lastActorGradientNorm;
  ball.lastCriticGradientNorm = lastCriticGradientNorm;
  ball.lastDiscountedReturn = returns[0];
  ball.lastAdvantage = rawAdvantages[0];
  ball.lastPolicyLoss = policyLossSum / trainedSamples;
  ball.lastValueLoss = valueLossSum / trainedSamples;
  ball.lastEntropy = entropySum / trainedSamples;
  ball.lastApproximateKL = approximateKLSum / trainedSamples;
  ball.lastClipFraction = clippedSamples / trainedSamples;
  ball.lastPPOEpochs = completedEpochs;
  return true;
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
    sensorHistory: [],
    output: {
      direction: 0,
      boost: false
    },
    boostCharge: BOOST_MAX_CHARGE,
    boostActive: false,
    boostUsedThisFrame: false,
    boostCooldown: 0,
    lastCache: null,
    experienceBuffer: [],
    lastDiscountedReturn: 0,
    lastAdvantage: 0,
    lastGradientNorm: 0,
    lastCriticGradientNorm: 0,
    lastPolicyLoss: 0,
    lastValueLoss: 0,
    lastEntropy: 0,
    lastApproximateKL: 0,
    lastClipFraction: 0,
    lastPPOEpochs: 0,
    previousWallClearance: null,
    previousOtherDistance: null,
    previousYellowDistance: null,
    lastWallShapingReward: 0,
    lastGoalProgressReward: 0,
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

  if (redBall && blueBall) {
    redBall.previousYellowDistance = Math.hypot(yellowBall.x - redBall.x, yellowBall.y - redBall.y);
    blueBall.previousYellowDistance = Math.hypot(yellowBall.x - blueBall.x, yellowBall.y - blueBall.y);
  }
}

function isValidBrain(brain) {
  const shapes = [[48, TEMPORAL_INPUT_SIZE], [24, 48], [NETWORK_OUTPUT_SIZE, 24]];

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

function saveTraining() {
  if (!redBall || !blueBall) {
    return;
  }

  const training = {
    version: 8,
    savedAt: Date.now(),
    frameNumber,
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
    if (training.version !== 8 || !isValidBrain(training.redBrain) || !isValidBrain(training.blueBrain)) {
      return false;
    }

    redBall.brain = training.redBrain;
    blueBall.brain = training.blueBrain;
    frameNumber = Number.isFinite(training.frameNumber) ? training.frameNumber : 0;
    yellowBall.lastMovedFrame = frameNumber;

    restoreBallStats(redBall, training.redStats);
    restoreBallStats(blueBall, training.blueStats);

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
  const currentDirection = getDirection(ball);
  const otherDirection = Math.atan2(dy, dx);
  const targetDirection = Math.atan2(targetDy, targetDx);

  return {
    posicao_x: ball.x,
    posicao_y: ball.y,
    distancia_da_outra_bolinha: Math.hypot(dx, dy),
    diferenca_direcao_outra: signedAngleDifference(otherDirection, currentDirection),
    distancia_bolinha_amarela: Math.hypot(targetDx, targetDy),
    diferenca_direcao_amarela: signedAngleDifference(targetDirection, currentDirection),
    carga_boost: ball.boostCharge
  };
}

function normalizeSensors(sensors) {
  return [
    sensors.posicao_x / WORLD_SIZE,
    sensors.posicao_y / WORLD_SIZE,
    sensors.distancia_da_outra_bolinha / (Math.SQRT2 * WORLD_SIZE),
    sensors.diferenca_direcao_outra / Math.PI,
    sensors.distancia_bolinha_amarela / (Math.SQRT2 * WORLD_SIZE),
    sensors.diferenca_direcao_amarela / Math.PI,
    sensors.carga_boost / BOOST_MAX_CHARGE
  ];
}

function updateSensorHistory(ball, currentInputs) {
  ball.sensorHistory.unshift([...currentInputs]);
  if (ball.sensorHistory.length > SENSOR_HISTORY_MAX_AGE + 1) {
    ball.sensorHistory.length = SENSOR_HISTORY_MAX_AGE + 1;
  }
}

function buildTemporalInputs(sensorHistory) {
  if (sensorHistory.length === 0) {
    return Array(TEMPORAL_INPUT_SIZE).fill(0);
  }

  return SENSOR_HISTORY_AGES.flatMap((age) => {
    const snapshot = sensorHistory[Math.min(age, sensorHistory.length - 1)];
    return [...snapshot];
  });
}

function buildBootstrapInputs(ball, currentInputs) {
  const previewHistory = [[...currentInputs], ...ball.sensorHistory]
    .slice(0, SENSOR_HISTORY_MAX_AGE + 1);
  return buildTemporalInputs(previewHistory);
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

function samplePolicyAction(cache) {
  return {
    directionIndex: sampleCategorical(cache.policy.directionProbabilities),
    boost: Math.random() < cache.policy.boostProbability ? 1 : 0
  };
}

function applyFixedVelocity(ball, boosted) {
  const movementSpeed = boosted ? BOOST_MAX_SPEED : MAX_SPEED;
  ball.hspeed = Math.cos(ball.output.direction) * movementSpeed;
  ball.vspeed = Math.sin(ball.output.direction) * movementSpeed;
}

function applyBrain(ball, otherBall, targetBall) {
  ball.sensors = buildSensors(ball, otherBall, targetBall);
  const currentInputs = normalizeSensors(ball.sensors);
  updateSensorHistory(ball, currentInputs);
  const inputs = buildTemporalInputs(ball.sensorHistory);
  ball.lastCache = forwardBrain(ball.brain, inputs);
  const sampledAction = samplePolicyAction(ball.lastCache);
  ball.output = {
    direction: sampledAction.directionIndex / DIRECTION_BINS * TWO_PI,
    boost: sampledAction.boost === 1
  };
  ball.experienceBuffer.push({
    inputs: [...inputs],
    action: sampledAction,
    reward: 0,
    value: ball.lastCache.value,
    logProbability: policyLogProbability(ball.lastCache.policy, sampledAction)
  });

  const usedBoost = updateBoost(ball);
  ball.boostUsedThisFrame = usedBoost;
  applyFixedVelocity(ball, usedBoost);
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

function getWallClearance(ball) {
  return Math.min(
    ball.x - BALL_RADIUS,
    WORLD_SIZE - BALL_RADIUS - ball.x,
    ball.y - BALL_RADIUS,
    WORLD_SIZE - BALL_RADIUS - ball.y
  );
}

function calculateWallShapingReward(ball) {
  const clearance = getWallClearance(ball);
  const previousClearance = ball.previousWallClearance;
  const proximity = clamp((WALL_SAFE_CLEARANCE - clearance) / WALL_SAFE_CLEARANCE, 0, 1);
  const positionReward = proximity > 0
    ? -WALL_PROXIMITY_PENALTY * proximity ** 2
    : WALL_SAFE_REWARD;
  const clearanceChange = previousClearance == null
    ? 0
    : clamp(clearance - previousClearance, -MAX_SPEED, MAX_SPEED) / MAX_SPEED;
  const progressReward = clearanceChange * WALL_PROGRESS_REWARD;

  ball.previousWallClearance = clearance;
  ball.lastWallShapingReward = positionReward + progressReward;
  return ball.lastWallShapingReward;
}

function calculateGoalProgressReward(ball, otherBall, targetBall) {
  const otherDistance = Math.hypot(otherBall.x - ball.x, otherBall.y - ball.y);
  const yellowDistance = Math.hypot(targetBall.x - ball.x, targetBall.y - ball.y);
  let reward = 0;

  if (ball.previousOtherDistance != null && ball.previousYellowDistance != null) {
    const otherChange = clamp(
      otherDistance - ball.previousOtherDistance,
      -BOOST_MAX_SPEED * 2,
      BOOST_MAX_SPEED * 2
    );
    const yellowChange = clamp(
      yellowDistance - ball.previousYellowDistance,
      -BOOST_MAX_SPEED,
      BOOST_MAX_SPEED
    );

    reward = ball.role === "red"
      ? -otherChange * RED_CHASE_PROGRESS_REWARD
      : otherChange * BLUE_FLEE_PROGRESS_REWARD - yellowChange * BLUE_TARGET_PROGRESS_REWARD;
  }

  ball.previousOtherDistance = otherDistance;
  ball.previousYellowDistance = yellowDistance;
  ball.lastGoalProgressReward = reward;
  return reward;
}

function updateRewards(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow) {
  redBall.rewardNow = redWallHits * WALL_PENALTY +
    calculateWallShapingReward(redBall) +
    calculateGoalProgressReward(redBall, blueBall, yellowBall);
  blueBall.rewardNow = blueWallHits * WALL_PENALTY +
    calculateWallShapingReward(blueBall) +
    calculateGoalProgressReward(blueBall, redBall, yellowBall);

  if (ballCollisionRewarded) {
    redBall.rewardNow += RED_HIT_REWARD;
    blueBall.rewardNow += BLUE_HIT_PENALTY;
    recordBallCollisionInterval(redBall);
    recordBallCollisionInterval(blueBall);
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

  updateRewards(redWallHits, blueWallHits, ballCollisionRewarded, redTouchedYellow, blueTouchedYellow);
  recordTemporalReward(redBall, redBall.rewardNow);
  recordTemporalReward(blueBall, blueBall.rewardNow);

  const yellowExpired = frameNumber - yellowBall.lastMovedFrame >= YELLOW_RESPAWN_FRAMES;
  if (redTouchedYellow || blueTouchedYellow || yellowExpired) {
    relocateYellowBall();
  }

  redBall.sensors = buildSensors(redBall, blueBall, yellowBall);
  blueBall.sensors = buildSensors(blueBall, redBall, yellowBall);
  const redBootstrapInputs = buildBootstrapInputs(redBall, normalizeSensors(redBall.sensors));
  const blueBootstrapInputs = buildBootstrapInputs(blueBall, normalizeSensors(blueBall.sensors));
  processPolicyRollout(redBall, redBootstrapInputs);
  processPolicyRollout(blueBall, blueBootstrapInputs);
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

function getMetricValues(ball, averages) {
  return {
    ...ball.sensors,
    velocidade: getSpeed(ball),
    direcao: getDirection(ball),
    carga_boost: ball.boostCharge,
    recompensa_recente: averages.recentRewardAverage,
    recompensa_media: averages.rewardAverage,
    media_sem_parede: averages.averageWallFreeFrames,
    media_entre_bolas: averages.averageBallCollisionFrames
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

  const redValues = getMetricValues(redBall, tableAverageSnapshot.red);
  const blueValues = getMetricValues(blueBall, tableAverageSnapshot.blue);

  metricsTableBody.innerHTML = metricRows.map((row) => {
    return `<tr><td>${renderMetricCell(row, redValues[row.key], "red", redBall)}</td><td>${row.label}</td><td>${renderMetricCell(row, blueValues[row.key], "blue", blueBall)}</td></tr>`;
  }).join("");
}

function getSimulationState() {
  return {
    frameNumber,
    learning: {
      type: "ppo-actor-critic",
      rolloutFrames: PPO_ROLLOUT_FRAMES,
      discount: REWARD_DISCOUNT,
      gaeLambda: GAE_LAMBDA,
      clipRange: PPO_CLIP_RANGE,
      epochs: PPO_EPOCHS,
      directionBins: DIRECTION_BINS,
      minibatchSize: POLICY_MINIBATCH_SIZE,
      sensorHistoryAges: SENSOR_HISTORY_AGES,
      temporalInputSize: TEMPORAL_INPUT_SIZE
    },
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
      experienceBufferSize: redBall.experienceBuffer.length,
      lastDiscountedReturn: redBall.lastDiscountedReturn,
      lastAdvantage: redBall.lastAdvantage,
      lastGradientNorm: redBall.lastGradientNorm,
      lastCriticGradientNorm: redBall.lastCriticGradientNorm,
      lastPolicyLoss: redBall.lastPolicyLoss,
      lastValueLoss: redBall.lastValueLoss,
      lastEntropy: redBall.lastEntropy,
      lastApproximateKL: redBall.lastApproximateKL,
      lastClipFraction: redBall.lastClipFraction,
      lastPPOEpochs: redBall.lastPPOEpochs,
      wallShapingReward: redBall.lastWallShapingReward,
      goalProgressReward: redBall.lastGoalProgressReward,
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
      experienceBufferSize: blueBall.experienceBuffer.length,
      lastDiscountedReturn: blueBall.lastDiscountedReturn,
      lastAdvantage: blueBall.lastAdvantage,
      lastGradientNorm: blueBall.lastGradientNorm,
      lastCriticGradientNorm: blueBall.lastCriticGradientNorm,
      lastPolicyLoss: blueBall.lastPolicyLoss,
      lastValueLoss: blueBall.lastValueLoss,
      lastEntropy: blueBall.lastEntropy,
      lastApproximateKL: blueBall.lastApproximateKL,
      lastClipFraction: blueBall.lastClipFraction,
      lastPPOEpochs: blueBall.lastPPOEpochs,
      wallShapingReward: blueBall.lastWallShapingReward,
      goalProgressReward: blueBall.lastGoalProgressReward,
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

function performFullReset() {
  cancelResetConfirmation();

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Nao foi possivel apagar o treinamento salvo.", error);
  }

  resetSimulation();
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
  setMode: setSimulationMode
};

modeToggle.addEventListener("click", toggleSimulationMode);
resetButton.addEventListener("click", handleResetButtonClick);
window.addEventListener("pagehide", saveTraining);
setInterval(saveTraining, SAVE_INTERVAL_MS);

resetSimulation();
loadTraining();
draw();
renderPanel();
setSimulationMode("visualization");
