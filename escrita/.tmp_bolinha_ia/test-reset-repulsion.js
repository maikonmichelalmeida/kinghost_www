"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const source = fs.readFileSync(".tmp_bolinha_ia/script.js", "utf8");
const storage = new Map([["bolinhaIA.training.v3", "saved-training"]]);

class ClassList {
  constructor() { this.values = new Set(); }
  toggle(name, force) { force ? this.values.add(name) : this.values.delete(name); }
  add(name) { this.values.add(name); }
  remove(name) { this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}

class Element {
  constructor() { this.dataset = {}; this.listeners = {}; this.attributes = {}; this.classList = new ClassList(); this.textContent = ""; this.innerHTML = ""; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  click() { this.listeners.click(); }
}

const ids = ["world", "resetButton", "modeToggle", "modeLabel", "backpropButton", "geneticButton", "algorithmValue", "rateLabel", "fpsValue", "metricsTableBody"];
const elements = Object.fromEntries(ids.map((id) => [id, new Element()]));
elements.world.getContext = () => ({ beginPath() {}, clearRect() {}, fill() {}, fillRect() {}, arc() {}, lineTo() {}, moveTo() {}, stroke() {}, strokeRect() {} });

let timeoutCallback = null;
const context = {
  console, Math, JSON, Number, Date, Object, Array, String,
  performance: { now: () => Date.now() },
  document: { getElementById: (id) => elements[id] },
  localStorage: {
    getItem: () => null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  },
  requestAnimationFrame: () => 1, cancelAnimationFrame() {},
  setTimeout(callback) { timeoutCallback = callback; return 1; },
  clearTimeout() { timeoutCallback = null; },
  setInterval: () => 1,
  window: { addEventListener() {} }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context);

const repulsion = vm.runInContext(`
  frameNumber = 100;
  redBall.x = BALL_RADIUS; redBall.y = BALL_RADIUS; redBall.hspeed = 0; redBall.vspeed = 0; redBall.lastWallHitFrame = frameNumber;
  const cornerApplied = applyWallRepulsion(redBall);
  const cornerVelocity = { x: redBall.hspeed, y: redBall.vspeed };

  blueBall.x = WORLD_SIZE - BALL_RADIUS; blueBall.y = WORLD_SIZE * 0.5; blueBall.hspeed = 0; blueBall.vspeed = 0; blueBall.lastWallHitFrame = frameNumber;
  const rightApplied = applyWallRepulsion(blueBall);
  const rightVelocity = blueBall.hspeed;

  blueBall.hspeed = 2; blueBall.vspeed = 0;
  const fastApplied = applyWallRepulsion(blueBall);
  ({ cornerApplied, cornerVelocity, rightApplied, rightVelocity, fastApplied });
`, context);

assert.strictEqual(repulsion.cornerApplied, true);
assert.ok(repulsion.cornerVelocity.x > 0);
assert.ok(repulsion.cornerVelocity.y > 0);
assert.strictEqual(repulsion.rightApplied, true);
assert.ok(repulsion.rightVelocity < 0);
assert.strictEqual(repulsion.fastApplied, false);

const brainBefore = vm.runInContext("JSON.stringify(redBall.brain)", context);
elements.resetButton.click();
assert.strictEqual(elements.resetButton.textContent, "Confirmar reset");
assert.strictEqual(vm.runInContext("JSON.stringify(redBall.brain)", context), brainBefore);
assert.strictEqual(storage.has("bolinhaIA.training.v3"), true);

timeoutCallback();
assert.strictEqual(elements.resetButton.textContent, "Reiniciar");
assert.strictEqual(vm.runInContext("JSON.stringify(redBall.brain)", context), brainBefore);

elements.resetButton.click();
elements.resetButton.click();
const brainAfter = vm.runInContext("JSON.stringify(redBall.brain)", context);
assert.notStrictEqual(brainAfter, brainBefore);
assert.strictEqual(storage.has("bolinhaIA.training.v3"), false);
assert.strictEqual(elements.resetButton.textContent, "Reiniciar");
assert.strictEqual(vm.runInContext("frameNumber", context), 0);

console.log(JSON.stringify({
  repulsion,
  firstClickOnlyAsked: true,
  timeoutCancelledReset: true,
  secondClickResetBrains: true,
  storageCleared: true
}, null, 2));
