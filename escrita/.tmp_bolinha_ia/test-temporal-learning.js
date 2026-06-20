"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const source = fs.readFileSync(".tmp_bolinha_ia/script.js", "utf8");

class ClassList {
  toggle() {}
  add() {}
  remove() {}
}

class Element {
  constructor() {
    this.dataset = {};
    this.listeners = {};
    this.attributes = {};
    this.classList = new ClassList();
    this.textContent = "";
    this.innerHTML = "";
  }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
}

const ids = ["world", "resetButton", "modeToggle", "modeLabel", "rateLabel", "fpsValue", "metricsTableBody"];
const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
elements.world.getContext = () => ({ beginPath() {}, clearRect() {}, fill() {}, fillRect() {}, arc() {}, lineTo() {}, moveTo() {}, stroke() {}, strokeRect() {} });

const context = {
  console, Math, JSON, Number, Date, Object, Array, String,
  performance: { now: () => Date.now() },
  document: { getElementById: (id) => elements[id] },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  setTimeout: () => 1,
  clearTimeout() {},
  setInterval: () => 1,
  window: { addEventListener() {} }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);

const results = vm.runInContext(`
  function zeroBrainForTest() {
    const brain = createBrain();
    brain.forEach((layer) => {
      layer.weights.forEach((row) => row.fill(0));
      layer.biases.fill(0);
    });
    return brain;
  }

  const inputs = Array(TEMPORAL_INPUT_SIZE).fill(0.25);
  const action = { directionIndex: 0, boost: 1 };
  const rewardedBrain = zeroBrainForTest();
  const rewardedCache = forwardBrain(rewardedBrain, inputs);
  const uniformLogProbability = policyLogProbability(rewardedCache.policy, action);
  const rewardedGradients = createZeroGradients(rewardedBrain);
  accumulateExperienceGradients(
    rewardedBrain,
    rewardedGradients,
    rewardedCache,
    buildActorOutputDeltas(rewardedCache, action, ppoPolicyWeight(1, 1))
  );
  applyAccumulatedGradients(rewardedBrain, rewardedGradients, 1, ACTOR_LEARNING_RATE);
  const rewardedPolicy = forwardBrain(rewardedBrain, inputs).policy;

  const punishedBrain = zeroBrainForTest();
  const punishedCache = forwardBrain(punishedBrain, inputs);
  const punishedGradients = createZeroGradients(punishedBrain);
  accumulateExperienceGradients(
    punishedBrain,
    punishedGradients,
    punishedCache,
    buildActorOutputDeltas(punishedCache, action, ppoPolicyWeight(-1, 1))
  );
  applyAccumulatedGradients(punishedBrain, punishedGradients, 1, ACTOR_LEARNING_RATE);
  const punishedPolicy = forwardBrain(punishedBrain, inputs).policy;

  const gaeResult = calculateGAE(
    [
      { reward: 1, value: 0.5 },
      { reward: 2, value: 0.6 },
      { reward: 3, value: 0.7 }
    ],
    4
  );

  redBall.brain = zeroBrainForTest();
  redBall.experienceBuffer = Array.from({ length: PPO_ROLLOUT_FRAMES }, (_, index) => ({
    inputs: [...inputs],
    action: {
      directionIndex: index % DIRECTION_BINS,
      boost: index % 2
    },
    reward: index === PPO_ROLLOUT_FRAMES - 1 ? 10 : 0,
    value: 0,
    logProbability: uniformLogProbability
  }));
  const processed = processPolicyRollout(redBall, inputs);
  const trainedValue = forwardBrain(redBall.brain, inputs).value;

  ({
    rewardedDirectionProbability: rewardedPolicy.directionProbabilities[0],
    punishedDirectionProbability: punishedPolicy.directionProbabilities[0],
    rewardedBoostProbability: rewardedPolicy.boostProbability,
    punishedBoostProbability: punishedPolicy.boostProbability,
    gaeResult,
    expectedLastAdvantage: 3 + REWARD_DISCOUNT * 4 - 0.7,
    processed,
    remainingExperiences: redBall.experienceBuffer.length,
    trainedValue,
    rolloutFrames: PPO_ROLLOUT_FRAMES,
    discount: REWARD_DISCOUNT,
    directionBins: DIRECTION_BINS,
    outputSize: NETWORK_OUTPUT_SIZE,
    positiveUnclippedWeight: ppoPolicyWeight(1, 1.1),
    positiveClippedWeight: ppoPolicyWeight(1, 1.3),
    negativeUnclippedWeight: ppoPolicyWeight(-1, 0.9),
    negativeClippedWeight: ppoPolicyWeight(-1, 0.7),
    uniformLogProbability,
    expectedUniformLogProbability: Math.log(1 / 8) + Math.log(0.5),
    sensorHistoryAges: [...SENSOR_HISTORY_AGES],
    temporalInputSize: TEMPORAL_INPUT_SIZE,
    newestValue: buildTemporalInputs(
      Array.from({ length: 121 }, () => Array(SENSOR_COUNT).fill(1))
    )[0],
    oldestValue: buildTemporalInputs(
      Array.from({ length: 121 }, () => Array(SENSOR_COUNT).fill(1))
    )[TEMPORAL_INPUT_SIZE - 1],
    ageTenValue: buildTemporalInputs(
      Array.from({ length: 121 }, (_, age) => Array(SENSOR_COUNT).fill(age))
    )[3 * SENSOR_COUNT]
  });
`, context);

assert.ok(results.rewardedDirectionProbability > 1 / 8, "recompensa deve aumentar P(direcao)");
assert.ok(results.punishedDirectionProbability < 1 / 8, "penalidade deve reduzir P(direcao)");
assert.ok(results.rewardedBoostProbability > 0.5, "recompensa deve aumentar P(boost)");
assert.ok(results.punishedBoostProbability < 0.5, "penalidade deve reduzir P(boost)");
assert.ok(Math.abs(results.gaeResult.advantages[2] - results.expectedLastAdvantage) < 1e-12);
assert.ok(Math.abs(results.gaeResult.returns[2] - (results.expectedLastAdvantage + 0.7)) < 1e-12);
assert.strictEqual(results.processed, true);
assert.strictEqual(results.remainingExperiences, 0);
assert.ok(results.trainedValue > 0, "o critico deve aprender retorno positivo");
assert.strictEqual(results.rolloutFrames, 240);
assert.strictEqual(results.discount, 0.99);
assert.strictEqual(results.directionBins, 8);
assert.strictEqual(results.outputSize, 10);
assert.ok(Math.abs(results.positiveUnclippedWeight - 1.1) < 1e-12);
assert.strictEqual(results.positiveClippedWeight, 0);
assert.ok(Math.abs(results.negativeUnclippedWeight + 0.9) < 1e-12);
assert.strictEqual(results.negativeClippedWeight, 0);
assert.ok(Math.abs(results.uniformLogProbability - results.expectedUniformLogProbability) < 1e-12);
assert.deepStrictEqual(Array.from(results.sensorHistoryAges), [
  0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
  60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120
]);
assert.strictEqual(results.temporalInputSize, 182);
assert.strictEqual(results.newestValue, 1);
assert.strictEqual(results.oldestValue, 1);
assert.strictEqual(results.ageTenValue, 10);

const shaping = vm.runInContext(`
  redBall.x = WORLD_SIZE / 2;
  redBall.y = WORLD_SIZE / 2;
  redBall.previousWallClearance = null;
  const safeReward = calculateWallShapingReward(redBall);

  redBall.x = BALL_RADIUS + 5;
  redBall.y = WORLD_SIZE / 2;
  redBall.previousWallClearance = 5;
  const nearReward = calculateWallShapingReward(redBall);

  redBall.previousWallClearance = 11;
  const approachingReward = calculateWallShapingReward(redBall);

  redBall.x = BALL_RADIUS + 95;
  redBall.previousWallClearance = 89;
  const movingAwaySafelyReward = calculateWallShapingReward(redBall);

  redBall.x = 100;
  redBall.y = 100;
  blueBall.x = 200;
  blueBall.y = 100;
  redBall.previousOtherDistance = 110;
  redBall.previousYellowDistance = Math.hypot(yellowBall.x - redBall.x, yellowBall.y - redBall.y);
  const redChaseReward = calculateGoalProgressReward(redBall, blueBall, yellowBall);

  redBall.output.direction = 0;
  applyFixedVelocity(redBall, false);
  const normalSpeed = getSpeed(redBall);
  applyFixedVelocity(redBall, true);
  const boostedSpeed = getSpeed(redBall);

  redBall.x = 300; redBall.y = 360;
  blueBall.x = 420; blueBall.y = 360;
  yellowBall.x = blueBall.x; yellowBall.y = blueBall.y;
  redBall.previousWallClearance = getWallClearance(redBall);
  blueBall.previousWallClearance = getWallClearance(blueBall);
  redBall.previousOtherDistance = 120; blueBall.previousOtherDistance = 120;
  redBall.previousYellowDistance = 120; blueBall.previousYellowDistance = 0;
  updateRewards(0, 0, false, false, true);
  const redPenaltyWhenBlueGetsYellow = redBall.rewardNow;

  yellowBall.x = redBall.x; yellowBall.y = redBall.y;
  redBall.previousWallClearance = getWallClearance(redBall);
  blueBall.previousWallClearance = getWallClearance(blueBall);
  redBall.previousOtherDistance = 120; blueBall.previousOtherDistance = 120;
  redBall.previousYellowDistance = 0; blueBall.previousYellowDistance = 120;
  updateRewards(0, 0, false, true, false);
  const redPenaltyWhenRedGetsYellow = redBall.rewardNow;

  ({
    safeReward,
    nearReward,
    approachingReward,
    movingAwaySafelyReward,
    redChaseReward,
    normalSpeed,
    boostedSpeed,
    redPenaltyWhenBlueGetsYellow,
    redPenaltyWhenRedGetsYellow
  });
`, context);

assert.ok(shaping.safeReward > 0);
assert.ok(shaping.nearReward < 0);
assert.ok(shaping.approachingReward < shaping.nearReward);
assert.ok(shaping.movingAwaySafelyReward > shaping.safeReward);
assert.ok(shaping.redChaseReward > 0);
assert.ok(Math.abs(-8) > Math.abs(shaping.approachingReward) * 100);
assert.ok(Math.abs(shaping.normalSpeed - 5) < 1e-12);
assert.ok(Math.abs(shaping.boostedSpeed - 10) < 1e-12);
assert.ok(shaping.redPenaltyWhenBlueGetsYellow < -30);
assert.ok(shaping.redPenaltyWhenRedGetsYellow < -10);
assert.ok(Math.abs(shaping.redPenaltyWhenBlueGetsYellow) > Math.abs(shaping.redPenaltyWhenRedGetsYellow) * 2);

const stability = vm.runInContext(`
  resetSimulation();
  for (let index = 0; index < 480; index += 1) {
    update();
  }
  const redPolicy = forwardBrain(redBall.brain, buildTemporalInputs(redBall.sensorHistory)).policy;
  const bluePolicy = forwardBrain(blueBall.brain, buildTemporalInputs(blueBall.sensorHistory)).policy;
  ({
    redBuffer: redBall.experienceBuffer.length,
    blueBuffer: blueBall.experienceBuffer.length,
    redBrainValid: isValidBrain(redBall.brain),
    blueBrainValid: isValidBrain(blueBall.brain),
    redStateFinite: [redBall.x, redBall.y, redBall.hspeed, redBall.vspeed, redBall.lastDiscountedReturn, redBall.lastGradientNorm, redBall.lastCriticGradientNorm, redBall.lastPolicyLoss, redBall.lastValueLoss, redBall.lastEntropy, redBall.lastApproximateKL, redBall.lastClipFraction].every(Number.isFinite),
    blueStateFinite: [blueBall.x, blueBall.y, blueBall.hspeed, blueBall.vspeed, blueBall.lastDiscountedReturn, blueBall.lastGradientNorm, blueBall.lastCriticGradientNorm, blueBall.lastPolicyLoss, blueBall.lastValueLoss, blueBall.lastEntropy, blueBall.lastApproximateKL, blueBall.lastClipFraction].every(Number.isFinite),
    redDirectionSum: redPolicy.directionProbabilities.reduce((sum, value) => sum + value, 0),
    blueDirectionSum: bluePolicy.directionProbabilities.reduce((sum, value) => sum + value, 0)
  });
`, context);

assert.strictEqual(stability.redBuffer, 0);
assert.strictEqual(stability.blueBuffer, 0);
assert.strictEqual(stability.redBrainValid, true);
assert.strictEqual(stability.blueBrainValid, true);
assert.strictEqual(stability.redStateFinite, true);
assert.strictEqual(stability.blueStateFinite, true);
assert.ok(Math.abs(stability.redDirectionSum - 1) < 1e-12);
assert.ok(Math.abs(stability.blueDirectionSum - 1) < 1e-12);

console.log(JSON.stringify({ results, shaping, stability }, null, 2));
