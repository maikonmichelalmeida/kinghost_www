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

  const inputs = Array(12).fill(0.25);
  const experience = {
    inputs,
    action: { acceleration: 0.8, direction: 0.5, boost: 0.5 },
    reward: 0
  };

  const rewardedBrain = zeroBrainForTest();
  trainBrainFromExperience(rewardedBrain, experience, 1);
  const rewardedOutput = forwardBrain(rewardedBrain, inputs).rawOutput[0];

  const punishedBrain = zeroBrainForTest();
  trainBrainFromExperience(punishedBrain, experience, -1);
  const punishedOutput = forwardBrain(punishedBrain, inputs).rawOutput[0];

  const returnValue = discountedReturn(
    { reward: 1 },
    [{ reward: 2 }, { reward: 3 }]
  );

  redBall.brain = zeroBrainForTest();
  redBall.returnBaseline = 0;
  redBall.experienceBuffer = Array.from({ length: TEMPORAL_BUFFER_FRAMES + 1 }, (_, index) => ({
    inputs: [...inputs],
    action: { acceleration: 0.8, direction: 0.5, boost: 0.5 },
    reward: index === TEMPORAL_BUFFER_FRAMES ? 10 : 0
  }));
  const processed = processTemporalLearning(redBall);

  ({
    rewardedOutput,
    punishedOutput,
    returnValue,
    expectedReturn: 1 + 2 * REWARD_DISCOUNT + 3 * REWARD_DISCOUNT ** 2,
    processed,
    remainingExperiences: redBall.experienceBuffer.length,
    delayedReturn: redBall.lastDiscountedReturn,
    expectedDelayedReturn: 10 * REWARD_DISCOUNT ** TEMPORAL_BUFFER_FRAMES,
    bufferFrames: TEMPORAL_BUFFER_FRAMES,
    discount: REWARD_DISCOUNT
  });
`, context);

assert.ok(results.rewardedOutput > 0.5, "recompensa deve aproximar a rede da acao executada");
assert.ok(results.punishedOutput < 0.5, "penalidade deve afastar a rede da acao executada");
assert.ok(Math.abs(results.returnValue - results.expectedReturn) < 1e-12);
assert.strictEqual(results.processed, true);
assert.strictEqual(results.remainingExperiences, 240);
assert.ok(Math.abs(results.delayedReturn - results.expectedDelayedReturn) < 1e-12);
assert.strictEqual(results.bufferFrames, 240);
assert.strictEqual(results.discount, 0.99);

const stability = vm.runInContext(`
  resetSimulation();
  for (let index = 0; index < 5000; index += 1) {
    update();
  }
  ({
    redBuffer: redBall.experienceBuffer.length,
    blueBuffer: blueBall.experienceBuffer.length,
    redBrainValid: isValidBrain(redBall.brain),
    blueBrainValid: isValidBrain(blueBall.brain),
    redStateFinite: [redBall.x, redBall.y, redBall.hspeed, redBall.vspeed, redBall.lastDiscountedReturn].every(Number.isFinite),
    blueStateFinite: [blueBall.x, blueBall.y, blueBall.hspeed, blueBall.vspeed, blueBall.lastDiscountedReturn].every(Number.isFinite)
  });
`, context);

assert.strictEqual(stability.redBuffer, 240);
assert.strictEqual(stability.blueBuffer, 240);
assert.strictEqual(stability.redBrainValid, true);
assert.strictEqual(stability.blueBrainValid, true);
assert.strictEqual(stability.redStateFinite, true);
assert.strictEqual(stability.blueStateFinite, true);

console.log(JSON.stringify({ results, stability }, null, 2));
