const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");

const ui = {
  toggleRun: document.querySelector("#toggleRun"),
  toggleTurbo: document.querySelector("#toggleTurbo"),
  settings: document.querySelector("#settings"),
  resetWorld: document.querySelector("#resetWorld"),
  clearEverything: document.querySelector("#clearEverything"),
  agentCount: document.querySelector("#agentCount"),
  foodCount: document.querySelector("#foodCount"),
  generationCount: document.querySelector("#generationCount"),
  foodRate: document.querySelector("#foodRate"),
  roundCount: document.querySelector("#roundCount"),
  bestWallTouchRate: document.querySelector("#bestWallTouchRate"),
  bestFramesPerTouch: document.querySelector("#bestFramesPerTouch"),
  survivalAverage: document.querySelector("#survivalAverage"),
  bestSurvivalAverage: document.querySelector("#bestSurvivalAverage"),
  meanSurvivalAverage: document.querySelector("#meanSurvivalAverage"),
  medianSurvivalAverage: document.querySelector("#medianSurvivalAverage"),
  survivalChart: document.querySelector("#survivalChart"),
};
const survivalCtx = ui.survivalChart.getContext("2d");

const WORLD = {
  width: 960,
  height: 640,
  wallSize: 20,
  agentSize: 20,
  foodSize: 10,
  maxAcceleration: 0.01,
  friction: 0.999,
  bounce: 0.65,
  home: { x: 40, y: 40, w: 80, h: 80 },
};

const SENSOR_TYPES = ["obstacle", "energy", "enemy", "ally"];
const SENSOR_DIRECTIONS = 8;
const SENSOR_CHANNELS = 4;
const SENSOR_INPUTS = SENSOR_TYPES.length * SENSOR_DIRECTIONS * SENSOR_CHANNELS;
const INTERNAL_INPUTS = 10;
const INPUT_SIZE = SENSOR_INPUTS + INTERNAL_INPUTS;
const HIDDEN_SIZE = 24;
const OUTPUT_SIZE = 2;
const MEMORY_EMPTY_AGE = 1_000_000;
const STORAGE_KEYS = {
  settings: "casa-ai-settings-v1",
  checkpoint: "casa-ai-checkpoint-v1",
};
const PROJECT_JSON_NAME = "casa-agentes-ia";
const PROJECT_JSON_API = projectJsonApiUrl(PROJECT_JSON_NAME);
const ELITE_BRAIN_LIMIT = 12;
const STORED_GENOME_LIMIT = 80;
const SURVIVAL_SAMPLE_SIZE = 10;
const SURVIVAL_SAMPLE_LIMIT = 1000;
const EVALUATION_ROUNDS = 10;

const defaults = {
  targetFood: 18,
  minAgents: 10,
  maxAgents: 30,
  maxEnergy: 1800,
  foodEnergy: 720,
  maxSpeed: 6,
  idleEnergyFrames: 3600,
  accelerationCostMultiplier: 0.75,
  collisionEnergyLossPercent: 10,
  memoryTau: 220,
  mutationChance: 0.25,
  mutationStrength: 0.04,
};

let settings = { ...defaults };
let agents = [];
let genomes = [];
let foods = [];
let walls = [];
let dynamicObstacleBlocks = [];
let pendingFood = 0;
let frame = 0;
let generation = 1;
let running = true;
let turboMode = false;
let nextAgentId = 1;
let nextGenomeId = 1;
let nextLineageId = 1;
let evaluationRound = 1;
let lastReproductionFrame = 0;
let survivalEpochBatch = [];
let survivalSamples = [];
let currentRoundResults = [];
let totalFoodEaten = 0;
let totalCollisions = 0;
let championMetrics = createChampionMetrics();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function rectsOverlap(a, b, padding = 0) {
  return (
    a.x - padding < b.x + b.w &&
    a.x + a.w + padding > b.x &&
    a.y - padding < b.y + b.h &&
    a.y + a.h + padding > b.y
  );
}

function distanceBetweenCenters(a, b) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h / 2;
  const bx = b.x + b.w / 2;
  const by = b.y + b.h / 2;
  return Math.hypot(ax - bx, ay - by);
}

function centerOf(rect) {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

function projectJsonApiUrl(projectName) {
  const encodedName = encodeURIComponent(projectName);
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  if (isLocalHost && window.location.port !== "21106") {
    return `http://127.0.0.1:21106/api/project-json/${encodedName}`;
  }
  return `/api/project-json/${encodedName}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Erro na comunicacao com o banco.");
  return payload;
}

class NeuralNetwork {
  constructor(inputSize = INPUT_SIZE, hiddenSize = HIDDEN_SIZE, outputSize = OUTPUT_SIZE) {
    this.inputSize = inputSize;
    this.hiddenSize = hiddenSize;
    this.outputSize = outputSize;
    this.inputHidden = Array.from({ length: hiddenSize }, () =>
      Array.from({ length: inputSize }, () => randomBetween(-0.28, 0.28))
    );
    this.hiddenBias = Array.from({ length: hiddenSize }, () => randomBetween(-0.08, 0.08));
    this.hiddenOutput = Array.from({ length: outputSize }, () =>
      Array.from({ length: hiddenSize }, () => randomBetween(-0.28, 0.28))
    );
    this.outputBias = Array.from({ length: outputSize }, () => randomBetween(-0.08, 0.08));
  }

  static clone(source) {
    return NeuralNetwork.fromData(source.toData ? source.toData() : source);
  }

  static fromData(data) {
    const net = new NeuralNetwork(INPUT_SIZE, HIDDEN_SIZE, OUTPUT_SIZE);
    const hiddenRows = Math.min(net.hiddenSize, data.hiddenSize ?? data.inputHidden?.length ?? 0);
    const inputCols = Math.min(net.inputSize, data.inputSize ?? data.inputHidden?.[0]?.length ?? 0);
    const outputRows = Math.min(net.outputSize, data.outputSize ?? data.hiddenOutput?.length ?? 0);
    const hiddenCols = Math.min(net.hiddenSize, data.hiddenSize ?? data.hiddenOutput?.[0]?.length ?? 0);

    for (let h = 0; h < hiddenRows; h += 1) {
      for (let i = 0; i < inputCols; i += 1) {
        net.inputHidden[h][i] = data.inputHidden?.[h]?.[i] ?? net.inputHidden[h][i];
      }
      net.hiddenBias[h] = data.hiddenBias?.[h] ?? net.hiddenBias[h];
    }

    for (let o = 0; o < outputRows; o += 1) {
      for (let h = 0; h < hiddenCols; h += 1) {
        net.hiddenOutput[o][h] = data.hiddenOutput?.[o]?.[h] ?? net.hiddenOutput[o][h];
      }
      net.outputBias[o] = data.outputBias?.[o] ?? net.outputBias[o];
    }

    return net;
  }

  activate(inputs) {
    const hidden = new Array(this.hiddenSize);

    for (let h = 0; h < this.hiddenSize; h += 1) {
      let sum = this.hiddenBias[h];
      const weights = this.inputHidden[h];
      for (let i = 0; i < this.inputSize; i += 1) {
        sum += inputs[i] * weights[i];
      }
      hidden[h] = Math.tanh(sum);
    }

    const output = new Array(this.outputSize);
    for (let o = 0; o < this.outputSize; o += 1) {
      let sum = this.outputBias[o];
      const weights = this.hiddenOutput[o];
      for (let h = 0; h < this.hiddenSize; h += 1) {
        sum += hidden[h] * weights[h];
      }
      output[o] = Math.tanh(sum);
    }

    return output;
  }

  mutate(strength) {
    const mutateValue = (value) => {
      if (Math.random() > 0.12) return value;
      return clamp(value + gaussianRandom() * strength, -2, 2);
    };

    this.inputHidden = this.inputHidden.map((row) => row.map(mutateValue));
    this.hiddenBias = this.hiddenBias.map(mutateValue);
    this.hiddenOutput = this.hiddenOutput.map((row) => row.map(mutateValue));
    this.outputBias = this.outputBias.map(mutateValue);
  }

  toData() {
    return {
      inputSize: this.inputSize,
      hiddenSize: this.hiddenSize,
      outputSize: this.outputSize,
      inputHidden: this.inputHidden.map((row) => row.slice()),
      hiddenBias: this.hiddenBias.slice(),
      hiddenOutput: this.hiddenOutput.map((row) => row.slice()),
      outputBias: this.outputBias.slice(),
    };
  }
}

function gaussianRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

class Agent {
  constructor(x, y, brain = new NeuralNetwork(), generationBorn = generation, genomeId = null) {
    this.id = nextAgentId;
    nextAgentId += 1;
    this.genomeId = genomeId;
    this.x = x;
    this.y = y;
    this.w = WORLD.agentSize;
    this.h = WORLD.agentSize;
    this.vx = randomBetween(-0.1, 0.1);
    this.vy = randomBetween(-0.1, 0.1);
    this.brain = brain;
    this.energy = settings.maxEnergy;
    this.age = 0;
    this.generationBorn = generationBorn;
    this.ax = 0;
    this.ay = 0;
    this.accelerationEffort = 0;
    this.collisionFlash = 0;
    this.foodsEaten = 0;
    this.collisions = 0;
    this.distanceTraveled = 0;
    this.memory = Array.from({ length: SENSOR_TYPES.length }, () =>
      Array.from({ length: SENSOR_DIRECTIONS }, () => ({
        proximity: 0,
        age: MEMORY_EMPTY_AGE,
      }))
    );
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update() {
    this.age += 1;
    const inputs = buildInputs(this);
    const [verticalAcceleration, horizontalAcceleration] = this.brain.activate(inputs);
    const ax = horizontalAcceleration * WORLD.maxAcceleration;
    const ay = verticalAcceleration * WORLD.maxAcceleration;
    const effort = clamp(Math.hypot(horizontalAcceleration, verticalAcceleration) / Math.SQRT2, 0, 1);
    this.ax = ax;
    this.ay = ay;
    this.accelerationEffort = effort;
    this.collisionFlash = Math.max(0, this.collisionFlash - 1);

    this.vx = clamp((this.vx + ax) * WORLD.friction, -settings.maxSpeed, settings.maxSpeed);
    this.vy = clamp((this.vy + ay) * WORLD.friction, -settings.maxSpeed, settings.maxSpeed);

    const startX = this.x;
    const startY = this.y;
    const collided = moveAgent(this, this.vx, this.vy);
    this.distanceTraveled += Math.hypot(this.x - startX, this.y - startY);
    if (collided) {
      this.collisions += 1;
      totalCollisions += 1;
      this.energy -= settings.maxEnergy * (settings.collisionEnergyLossPercent / 100);
      this.collisionFlash = 12;
    }

    const baseCost = settings.maxEnergy / settings.idleEnergyFrames;
    this.energy -= baseCost * (1 + effort * settings.accelerationCostMultiplier);
  }

  reproduce() {
    const childBrain = NeuralNetwork.clone(this.brain);
    if (Math.random() < settings.mutationChance) {
      childBrain.mutate(settings.mutationStrength);
    }
    return new Agent(
      randomBetween(WORLD.home.x + 8, WORLD.home.x + WORLD.home.w - WORLD.agentSize - 8),
      randomBetween(WORLD.home.y + 8, WORLD.home.y + WORLD.home.h - WORLD.agentSize - 8),
      childBrain,
      generation
    );
  }

  toData(includeMemory = false) {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      energy: this.energy,
      age: this.age,
      generationBorn: this.generationBorn,
      genomeId: this.genomeId,
      foodsEaten: this.foodsEaten,
      collisions: this.collisions,
      distanceTraveled: this.distanceTraveled,
      brain: this.brain.toData(),
      memory: includeMemory ? this.memory : undefined,
    };
  }
}

function createWalls() {
  const wallsList = [];
  const s = WORLD.wallSize;

  for (let x = 0; x < WORLD.width; x += s) {
    wallsList.push({ x, y: 0, w: s, h: s });
    wallsList.push({ x, y: WORLD.height - s, w: s, h: s });
  }

  for (let y = s; y < WORLD.height - s; y += s) {
    wallsList.push({ x: 0, y, w: s, h: s });
      wallsList.push({ x: WORLD.width - s, y, w: s, h: s });
  }

  return wallsList.concat(dynamicObstacleBlocks);
}

function createRandomHomeArea() {
  const s = WORLD.wallSize;
  const areaSize = s * 4;
  const maxGridX = Math.floor((WORLD.width - s - areaSize) / s);
  const maxGridY = Math.floor((WORLD.height - s - areaSize) / s);

  return {
    x: randomInt(1, maxGridX) * s,
    y: randomInt(1, maxGridY) * s,
    w: areaSize,
    h: areaSize,
  };
}

function createDynamicObstacle() {
  const s = WORLD.wallSize;
  const areaSize = s * 4;
  const existingWalls = createBorderWalls();
  const maxGridX = Math.floor((WORLD.width - s - areaSize) / s);
  const maxGridY = Math.floor((WORLD.height - s - areaSize) / s);
  const areas = [];
  const blocks = [];

  for (let areaIndex = 0; areaIndex < 2; areaIndex += 1) {
    const area = findDynamicObstacleArea(maxGridX, maxGridY, areaSize, existingWalls, areas);
    if (!area) continue;
    areas.push(area);

    for (let cell = 0; cell < 16; cell += 1) {
      if (Math.random() >= 3 / 8) continue;
      blocks.push({
        x: area.x + (cell % 4) * s,
        y: area.y + Math.floor(cell / 4) * s,
        w: s,
        h: s,
      });
    }
  }

  return blocks;
}

function findDynamicObstacleArea(maxGridX, maxGridY, areaSize, existingWalls, existingAreas) {
  const s = WORLD.wallSize;

  for (let attempt = 0; attempt < 250; attempt += 1) {
    const originX = randomInt(1, maxGridX) * s;
    const originY = randomInt(1, maxGridY) * s;
    const area = { x: originX, y: originY, w: areaSize, h: areaSize };

    if (rectsOverlap(area, WORLD.home, 80)) continue;
    if (existingWalls.some((wall) => rectsOverlap(area, wall))) continue;
    if (existingAreas.some((existingArea) => rectsOverlap(area, existingArea, 40))) continue;
    return area;
  }

  return null;
}

function createBorderWalls() {
  const wallsList = [];
  const s = WORLD.wallSize;

  for (let x = 0; x < WORLD.width; x += s) {
    wallsList.push({ x, y: 0, w: s, h: s });
    wallsList.push({ x, y: WORLD.height - s, w: s, h: s });
  }

  for (let y = s; y < WORLD.height - s; y += s) {
    wallsList.push({ x: 0, y, w: s, h: s });
    wallsList.push({ x: WORLD.width - s, y, w: s, h: s });
  }

  return wallsList;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function resetSimulation() {
  frame = 0;
  generation = 1;
  nextAgentId = 1;
  nextGenomeId = 1;
  nextLineageId = 1;
  evaluationRound = 1;
  lastReproductionFrame = 0;
  survivalEpochBatch = [];
  survivalSamples = [];
  currentRoundResults = [];
  totalFoodEaten = 0;
  totalCollisions = 0;
  championMetrics = createChampionMetrics();
  walls = createWalls();
  genomes = [];
  for (let i = 0; i < settings.maxAgents; i += 1) {
    genomes.push(createGenome());
  }

  resetGenomeEvaluations();
  startEvaluationRound();
  updateStats();
}

function createGenome(brain = new NeuralNetwork(), id = nextGenomeId, lineageId = null) {
  nextGenomeId = Math.max(nextGenomeId, id + 1);
  const resolvedLineageId = lineageId ?? nextLineageId;
  nextLineageId = Math.max(nextLineageId, resolvedLineageId + 1);
  return {
    id,
    lineageId: resolvedLineageId,
    brain,
    evaluation: createEmptyEvaluation(),
    lastAverageScore: 0,
    lastAverageSurvival: 0,
    lastAverageFood: 0,
    lastAverageCollisions: 0,
  };
}

function createChampionMetrics(lineageId = null, seed = {}) {
  return {
    lineageId,
    frames: seed.frames ?? 0,
    foods: seed.foods ?? 0,
    collisions: seed.collisions ?? 0,
  };
}

function createEmptyEvaluation() {
  return {
    trials: 0,
    scoreSum: 0,
    ageSum: 0,
    foodSum: 0,
    collisionSum: 0,
    distanceSum: 0,
    bestSurvival: 0,
    bestScore: -Infinity,
  };
}

function resetGenomeEvaluations() {
  for (const genome of genomes) {
    genome.evaluation = createEmptyEvaluation();
  }
}

function homeSpawnPosition() {
  return {
    x: randomBetween(WORLD.home.x + 8, WORLD.home.x + WORLD.home.w - WORLD.agentSize - 8),
    y: randomBetween(WORLD.home.y + 8, WORLD.home.y + WORLD.home.h - WORLD.agentSize - 8),
  };
}

function spawnAgentForGenome(genome) {
  const position = homeSpawnPosition();
  return new Agent(
    position.x,
    position.y,
    NeuralNetwork.clone(genome.brain),
    generation,
    genome.id
  );
}

function startEvaluationRound() {
  currentRoundResults = [];
  WORLD.home = createRandomHomeArea();
  dynamicObstacleBlocks = createDynamicObstacle();
  walls = createWalls();
  agents = genomes.map(spawnAgentForGenome);
  foods = [];
  pendingFood = settings.targetFood;
  fillFoodQuickly();
}

function spawnFreshAgent() {
  return new Agent(
    randomBetween(WORLD.home.x + 8, WORLD.home.x + WORLD.home.w - WORLD.agentSize - 8),
    randomBetween(WORLD.home.y + 8, WORLD.home.y + WORLD.home.h - WORLD.agentSize - 8)
  );
}

function agentFromData(data) {
  const agent = new Agent(
    clamp(data.x, WORLD.wallSize, WORLD.width - WORLD.wallSize - WORLD.agentSize),
    clamp(data.y, WORLD.wallSize, WORLD.height - WORLD.wallSize - WORLD.agentSize),
    NeuralNetwork.fromData(data.brain),
    data.generationBorn ?? generation,
    data.genomeId ?? null
  );

  agent.id = data.id ?? agent.id;
  agent.vx = clamp(data.vx ?? 0, -settings.maxSpeed, settings.maxSpeed);
  agent.vy = clamp(data.vy ?? 0, -settings.maxSpeed, settings.maxSpeed);
  agent.energy = clamp(data.energy ?? settings.maxEnergy, 0, settings.maxEnergy);
  agent.age = data.age ?? 0;
  agent.foodsEaten = data.foodsEaten ?? 0;
  agent.collisions = data.collisions ?? 0;
  agent.distanceTraveled = data.distanceTraveled ?? 0;

  if (Array.isArray(data.memory)) {
    agent.memory = data.memory;
  }

  return agent;
}

function buildInputs(agent) {
  const inputs = [];
  const detections = detectEnvironment(agent);

  for (let direction = 0; direction < SENSOR_DIRECTIONS; direction += 1) {
    for (let typeIndex = 0; typeIndex < SENSOR_TYPES.length; typeIndex += 1) {
      const detection = detections[typeIndex][direction];
      const memory = agent.memory[typeIndex][direction];

      if (detection.present) {
        memory.proximity = detection.proximity;
        memory.age = 0;
      } else {
        memory.age += 1;
      }

      let confidence = Math.exp(-memory.age / settings.memoryTau);
      if (confidence < 0.01) {
        confidence = 0;
        memory.proximity = 0;
      }

      inputs.push(detection.present ? 1 : 0);
      inputs.push(detection.present ? detection.proximity : 0);
      inputs.push(memory.proximity);
      inputs.push(confidence);
    }
  }

  const agentCenter = centerOf(agent.rect);
  const nearestFood = nearestRectSignal(agentCenter, foods);
  const nearestWall = nearestRectSignal(agentCenter, walls);
  const worldRange = Math.hypot(WORLD.width, WORLD.height);

  inputs.push(clamp(agent.energy / settings.maxEnergy, 0, 1));
  inputs.push(clamp(agent.vy / settings.maxSpeed, -1, 1));
  inputs.push(clamp(agent.vx / settings.maxSpeed, -1, 1));
  inputs.push(clamp(Math.hypot(agent.vx, agent.vy) / settings.maxSpeed, 0, 1));
  inputs.push(clamp((agentCenter.y / WORLD.height) * 2 - 1, -1, 1));
  inputs.push(clamp((agentCenter.x / WORLD.width) * 2 - 1, -1, 1));
  inputs.push(clamp(nearestFood.dy / WORLD.height, -1, 1));
  inputs.push(clamp(nearestFood.dx / WORLD.width, -1, 1));
  inputs.push(nearestFood.distance < Infinity ? clamp(1 - nearestFood.distance / worldRange, 0, 1) : 0);
  inputs.push(nearestWall.distance < Infinity ? clamp(1 - nearestWall.distance / 160, 0, 1) : 0);

  return inputs;
}

function nearestRectSignal(origin, rects) {
  let best = {
    dx: 0,
    dy: 0,
    distance: Infinity,
  };

  for (const rect of rects) {
    const target = centerOf(rect);
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance < best.distance) {
      best = { dx, dy, distance };
    }
  }

  return best;
}

function detectEnvironment(agent) {
  const result = Array.from({ length: SENSOR_TYPES.length }, () =>
    Array.from({ length: SENSOR_DIRECTIONS }, () => ({ present: false, proximity: 0 }))
  );
  const agentCenter = centerOf(agent.rect);
  const range = Math.hypot(WORLD.width, WORLD.height);

  const register = (typeIndex, targetRect) => {
    const targetCenter = centerOf(targetRect);
    const dx = targetCenter.x - agentCenter.x;
    const dy = targetCenter.y - agentCenter.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) return;

    const angle = Math.atan2(dy, dx);
    const direction = angleToDirection(angle);
    const proximity = clamp(1 - distance / range, 0, 1);
    const current = result[typeIndex][direction];

    if (!current.present || proximity > current.proximity) {
      current.present = true;
      current.proximity = proximity;
    }
  };

  for (const wall of walls) register(0, wall);
  for (const food of foods) register(1, food);
  for (const other of agents) {
    if (other === agent) continue;
    register(2, other.rect);
    register(3, other.rect);
  }

  return result;
}

function angleToDirection(angle) {
  const normalized = (angle + Math.PI * 2 + Math.PI / 8) % (Math.PI * 2);
  return Math.floor(normalized / (Math.PI / 4)) % SENSOR_DIRECTIONS;
}

function moveAgent(agent, dx, dy) {
  let collided = false;

  agent.x += dx;
  if (collidesWithWall(agent.rect)) {
    agent.x -= dx;
    agent.vx *= -WORLD.bounce;
    collided = true;
  }

  agent.y += dy;
  if (collidesWithWall(agent.rect)) {
    agent.y -= dy;
    agent.vy *= -WORLD.bounce;
    collided = true;
  }

  const clampedX = clamp(agent.x, WORLD.wallSize, WORLD.width - WORLD.wallSize - agent.w);
  const clampedY = clamp(agent.y, WORLD.wallSize, WORLD.height - WORLD.wallSize - agent.h);
  if (clampedX !== agent.x) {
    agent.x = clampedX;
    agent.vx *= -WORLD.bounce;
    collided = true;
  }
  if (clampedY !== agent.y) {
    agent.y = clampedY;
    agent.vy *= -WORLD.bounce;
    collided = true;
  }

  return collided;
}

function collidesWithWall(rect) {
  return walls.some((wall) => rectsOverlap(rect, wall));
}

function handleFoodCollection() {
  for (let a = agents.length - 1; a >= 0; a -= 1) {
    const agent = agents[a];
    for (let f = foods.length - 1; f >= 0; f -= 1) {
      if (rectsOverlap(agent.rect, foods[f])) {
        foods.splice(f, 1);
        pendingFood += 1;
        agent.foodsEaten += 1;
        totalFoodEaten += 1;
        agent.energy = Math.min(settings.maxEnergy, agent.energy + settings.foodEnergy);
      }
    }
  }
}

function removeDeadAgents() {
  const survivors = [];
  const deadAgents = [];

  for (const agent of agents) {
    if (agent.energy > 0) {
      survivors.push(agent);
    } else {
      deadAgents.push(agent);
      currentRoundResults.push(agent);
      collectGenomeResult(agent);
    }
  }

  agents = survivors;
  return deadAgents;
}

function collectGenomeResult(agent) {
  const genome = genomes.find((candidate) => candidate.id === agent.genomeId);
  if (!genome) return;

  recordChampionTrial(agent, genome);

  const score = scoreAgent(agent);
  const evaluation = genome.evaluation;
  evaluation.trials += 1;
  evaluation.scoreSum += score;
  evaluation.ageSum += agent.age;
  evaluation.foodSum += agent.foodsEaten;
  evaluation.collisionSum += agent.collisions;
  evaluation.distanceSum += agent.distanceTraveled;
  evaluation.bestSurvival = Math.max(evaluation.bestSurvival, agent.age);
  evaluation.bestScore = Math.max(evaluation.bestScore, score);
}

function recordChampionTrial(agent, genome) {
  if (championMetrics.lineageId !== genome.lineageId) return;
  championMetrics.frames += agent.age;
  championMetrics.foods += agent.foodsEaten;
  championMetrics.collisions += agent.collisions;
}

function metricsFromGenomeEvaluation(genome) {
  return {
    frames: genome.evaluation.ageSum,
    foods: genome.evaluation.foodSum,
    collisions: genome.evaluation.collisionSum,
  };
}

function syncChampionMetricsAfterCompetition(rankedGenomes, elites) {
  if (rankedGenomes.length === 0) {
    championMetrics = createChampionMetrics();
    return;
  }

  const championStillPreserved =
    championMetrics.lineageId !== null &&
    elites.some((genome) => genome.lineageId === championMetrics.lineageId);
  if (championStillPreserved) return;

  const winner = rankedGenomes[0];
  championMetrics = createChampionMetrics(winner.lineageId, metricsFromGenomeEvaluation(winner));
}

function finalizeRound() {
  if (currentRoundResults.length > 0) {
    recordSurvivalEpoch(currentRoundResults);
  }

  if (evaluationRound < EVALUATION_ROUNDS) {
    evaluationRound += 1;
    startEvaluationRound();
    return;
  }

  evolveGenomes();
  generation += 1;
  evaluationRound = 1;
  resetGenomeEvaluations();
  startEvaluationRound();
  saveCheckpoint("multiplication");
}

function averageGenomeScore(genome) {
  const trials = Math.max(1, genome.evaluation.trials);
  return genome.evaluation.scoreSum / trials;
}

function evolveGenomes() {
  for (const genome of genomes) {
    const trials = Math.max(1, genome.evaluation.trials);
    genome.lastAverageScore = genome.evaluation.scoreSum / trials;
    genome.lastAverageSurvival = genome.evaluation.ageSum / trials;
    genome.lastAverageFood = genome.evaluation.foodSum / trials;
    genome.lastAverageCollisions = genome.evaluation.collisionSum / trials;
  }

  const rankedGenomes = genomes
    .slice()
    .sort((a, b) => averageGenomeScore(b) - averageGenomeScore(a));
  const eliteCount = clamp(settings.minAgents, 1, Math.max(1, settings.maxAgents - 1));
  const elites = rankedGenomes.slice(0, eliteCount);
  syncChampionMetricsAfterCompetition(rankedGenomes, elites);
  const nextGenomes = elites.map((genome) => {
    const preserved = createGenome(NeuralNetwork.clone(genome.brain), nextGenomeId, genome.lineageId);
    preserved.lastAverageScore = genome.lastAverageScore;
    preserved.lastAverageSurvival = genome.lastAverageSurvival;
    preserved.lastAverageFood = genome.lastAverageFood;
    preserved.lastAverageCollisions = genome.lastAverageCollisions;
    return preserved;
  });

  let parentIndex = 0;
  while (nextGenomes.length < settings.maxAgents) {
    const parent = elites[parentIndex % elites.length] ?? rankedGenomes[0];
    const childBrain = NeuralNetwork.clone(parent.brain);
    const mutated = Math.random() < settings.mutationChance;
    if (mutated) {
      childBrain.mutate(settings.mutationStrength);
    }
    const child = createGenome(childBrain, nextGenomeId, mutated ? null : parent.lineageId);
    child.lastAverageScore = parent.lastAverageScore;
    child.lastAverageSurvival = parent.lastAverageSurvival;
    child.lastAverageFood = parent.lastAverageFood;
    child.lastAverageCollisions = parent.lastAverageCollisions;
    nextGenomes.push(child);
    parentIndex += 1;
  }

  genomes = nextGenomes;
}

function maintainFood() {
  if (foods.length > settings.targetFood) {
    foods.length = settings.targetFood;
  }

  pendingFood = clamp(pendingFood, 0, Math.max(0, settings.targetFood - foods.length));
  pendingFood += Math.max(0, settings.targetFood - foods.length - pendingFood);

  const attemptsThisFrame = Math.min(pendingFood, 8);
  for (let i = 0; i < attemptsThisFrame; i += 1) {
    if (trySpawnFood()) {
      pendingFood -= 1;
    }
  }
}

function fillFoodQuickly() {
  let safety = settings.targetFood * 30 + 200;
  while (foods.length < settings.targetFood && safety > 0) {
    if (trySpawnFood()) {
      pendingFood = Math.max(0, pendingFood - 1);
    }
    safety -= 1;
  }
}

function trySpawnFood() {
  const food = {
    x: randomBetween(WORLD.wallSize + 4, WORLD.width - WORLD.wallSize - WORLD.foodSize - 4),
    y: randomBetween(WORLD.wallSize + 4, WORLD.height - WORLD.wallSize - WORLD.foodSize - 4),
    w: WORLD.foodSize,
    h: WORLD.foodSize,
  };

  if (rectsOverlap(food, WORLD.home, 24)) return false;
  if (walls.some((wall) => rectsOverlap(food, wall, 2))) return false;
  if (foods.some((other) => rectsOverlap(food, other, 8))) return false;
  if (agents.some((agent) => distanceBetweenCenters(food, agent.rect) < 44)) return false;

  foods.push(food);
  return true;
}

function scoreAgent(agent) {
  return (
    agent.age +
    agent.foodsEaten * 2500 +
    agent.energy * 0.25 +
    agent.distanceTraveled * 0.03 -
    agent.collisions * 1200
  );
}

function recordSurvivalEpoch(parents) {
  const ages = parents.map((agent) => agent.age).sort((a, b) => a - b);
  const foodCounts = parents.map((agent) => agent.foodsEaten);
  const collisionCounts = parents.map((agent) => agent.collisions);
  const scores = parents.map(scoreAgent);
  const bestSurvival = ages[ages.length - 1] ?? 0;
  const meanSurvival = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;
  const medianSurvival =
    ages.length === 0
      ? 0
      : ages.length % 2 === 1
        ? ages[Math.floor(ages.length / 2)]
        : (ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2;
  const epochLength = Math.max(1, frame - lastReproductionFrame);
  lastReproductionFrame = frame;

  survivalEpochBatch.push({
    bestSurvival,
    meanSurvival,
    medianSurvival,
    epochLength,
    bestFood: Math.max(0, ...foodCounts),
    meanFood: foodCounts.length > 0 ? foodCounts.reduce((sum, value) => sum + value, 0) / foodCounts.length : 0,
    meanCollisions:
      collisionCounts.length > 0
        ? collisionCounts.reduce((sum, value) => sum + value, 0) / collisionCounts.length
        : 0,
    bestScore: Math.max(0, ...scores),
  });

  if (survivalEpochBatch.length >= SURVIVAL_SAMPLE_SIZE) {
    const averageMetric = (field) =>
      survivalEpochBatch.reduce((sum, epoch) => sum + epoch[field], 0) / survivalEpochBatch.length;

    survivalSamples.push({
      frame,
      generation,
      best: Math.round(averageMetric("bestSurvival")),
      mean: Math.round(averageMetric("meanSurvival")),
      median: Math.round(averageMetric("medianSurvival")),
      value: Math.round(averageMetric("bestSurvival")),
      averageEpochLength: Math.round(averageMetric("epochLength")),
      bestFood: Number(averageMetric("bestFood").toFixed(2)),
      meanFood: Number(averageMetric("meanFood").toFixed(2)),
      meanCollisions: Number(averageMetric("meanCollisions").toFixed(2)),
      bestScore: Math.round(averageMetric("bestScore")),
    });
    if (survivalSamples.length > SURVIVAL_SAMPLE_LIMIT) {
      survivalSamples = survivalSamples.slice(-SURVIVAL_SAMPLE_LIMIT);
    }
    survivalEpochBatch = [];
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Não foi possível salvar no localStorage.", error);
  }
}

function loadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Não foi possível ler o localStorage.", error);
    return null;
  }
}

function applySettingsToPanel(values) {
  for (const [key, value] of Object.entries(values)) {
    const input = ui.settings.elements.namedItem(key);
    if (input) {
      input.value = String(value);
    }
  }
}

function legacyLoadSettingsFromStorage() {
  const storedSettings = loadJson(STORAGE_KEYS.settings);
  if (storedSettings && typeof storedSettings === "object") {
    applySettingsToPanel({ ...defaults, ...storedSettings });
  }
}

function legacySaveSettings() {
  saveJson(STORAGE_KEYS.settings, settings);
}

function legacyClearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.checkpoint);
  } catch (error) {
    console.warn("Nao foi possivel limpar o localStorage.", error);
  }
}

function genomeToData(genome) {
  return {
    id: genome.id,
    lineageId: genome.lineageId,
    brain: genome.brain.toData(),
    evaluation: { ...genome.evaluation },
    lastAverageScore: genome.lastAverageScore,
    lastAverageSurvival: genome.lastAverageSurvival,
    lastAverageFood: genome.lastAverageFood,
    lastAverageCollisions: genome.lastAverageCollisions,
  };
}

function genomeFromData(data) {
  const genome = createGenome(NeuralNetwork.fromData(data.brain), data.id ?? nextGenomeId, data.lineageId ?? null);
  genome.evaluation = data.evaluation ? { ...createEmptyEvaluation(), ...data.evaluation } : createEmptyEvaluation();
  genome.lastAverageScore = data.lastAverageScore ?? 0;
  genome.lastAverageSurvival = data.lastAverageSurvival ?? 0;
  genome.lastAverageFood = data.lastAverageFood ?? 0;
  genome.lastAverageCollisions = data.lastAverageCollisions ?? 0;
  return genome;
}

function rankedGenomesForPersistence() {
  return genomes
    .slice()
    .sort(
      (a, b) =>
        (b.lastAverageScore || averageGenomeScore(b)) -
        (a.lastAverageScore || averageGenomeScore(a))
    );
}

function legacySaveCheckpoint(reason = "manual") {
  const rankedGenomes = rankedGenomesForPersistence();
  const eliteGenomes = rankedGenomes.slice(0, Math.max(1, settings.minAgents));

  saveJson(STORAGE_KEYS.checkpoint, {
    version: 2,
    eliteBrains: eliteGenomes.map((genome) => genome.brain.toData()),
  });
}

function legacyRestoreCheckpoint() {
  const checkpoint = loadJson(STORAGE_KEYS.checkpoint);
  if (!checkpoint || !Array.isArray(checkpoint.eliteBrains)) return false;

  frame = 0;
  generation = 1;
  nextAgentId = 1;
  nextGenomeId = 1;
  nextLineageId = 1;
  evaluationRound = 1;
  lastReproductionFrame = 0;
  survivalEpochBatch = [];
  survivalSamples = [];
  currentRoundResults = [];
  totalFoodEaten = 0;
  totalCollisions = 0;
  championMetrics = createChampionMetrics();
  genomes = [];

  if (Array.isArray(checkpoint.eliteBrains)) {
    for (const elite of checkpoint.eliteBrains.slice(0, settings.maxAgents)) {
      const brainData = elite?.brain ?? elite;
      if (brainData) {
        const genome = createGenome(NeuralNetwork.fromData(brainData));
        genomes.push(genome);
      }
    }
  }

  while (genomes.length < settings.maxAgents) {
    const parent = genomes[genomes.length % Math.max(1, genomes.length)];
    genomes.push(parent ? createGenome(NeuralNetwork.clone(parent.brain), nextGenomeId, parent.lineageId) : createGenome());
  }
  if (genomes.length > settings.maxAgents) {
    genomes = rankedGenomesForPersistence().slice(0, settings.maxAgents);
  }

  resetGenomeEvaluations();
  startEvaluationRound();
  nextGenomeId = Math.max(nextGenomeId, genomes.reduce((maxId, genome) => Math.max(maxId, genome.id + 1), 1));
  updateStats();
  return true;
}

var projectSaveTimer = 0;

function buildProjectState() {
  const rankedGenomes = rankedGenomesForPersistence();
  const eliteGenomes = rankedGenomes.slice(0, Math.max(1, settings.minAgents));

  return {
    version: 4,
    settings,
    training: {
      generation,
      totalFoodEaten,
      totalCollisions,
      survivalSamples: survivalSamples.slice(-SURVIVAL_SAMPLE_LIMIT),
    },
    eliteBrains: eliteGenomes.map((genome) => genome.brain.toData()),
  };
}

function saveSettings() {
  queueProjectSave();
}

function saveCheckpoint(reason = "manual") {
  queueProjectSave();
}

function queueProjectSave() {
  window.clearTimeout(projectSaveTimer);
  projectSaveTimer = window.setTimeout(() => {
    saveProjectStateNow();
  }, 600);
}

async function saveProjectStateNow(options = {}) {
  const payload = {
    json: buildProjectState(),
    tempoTreino: generation,
  };
  const body = JSON.stringify(payload);

  try {
    if (options.keepalive && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(PROJECT_JSON_API, blob);
      return;
    }

    await fetchJson(PROJECT_JSON_API, {
      method: "PUT",
      body,
      keepalive: Boolean(options.keepalive),
    });
  } catch (error) {
    console.warn("Nao foi possivel salvar o JSON do projeto no banco.", error);
  }
}

async function loadProjectStateFromDatabase() {
  try {
    const data = await fetchJson(PROJECT_JSON_API);
    return data.json || null;
  } catch (error) {
    console.warn("Nao foi possivel carregar o JSON do projeto no banco.", error);
    return null;
  }
}

async function restoreProjectFromDatabase() {
  const checkpoint = await loadProjectStateFromDatabase();
  if (!checkpoint || !Array.isArray(checkpoint.eliteBrains)) return false;

  if (checkpoint.settings && typeof checkpoint.settings === "object") {
    applySettingsToPanel({ ...defaults, ...checkpoint.settings });
    readSettings(false);
  }

  frame = 0;
  generation = Number.isFinite(checkpoint.training?.generation) ? checkpoint.training.generation : 1;
  nextAgentId = 1;
  nextGenomeId = 1;
  nextLineageId = 1;
  evaluationRound = 1;
  lastReproductionFrame = 0;
  survivalEpochBatch = [];
  survivalSamples = Array.isArray(checkpoint.training?.survivalSamples)
    ? checkpoint.training.survivalSamples.slice(-SURVIVAL_SAMPLE_LIMIT)
    : [];
  currentRoundResults = [];
  totalFoodEaten = Number.isFinite(checkpoint.training?.totalFoodEaten) ? checkpoint.training.totalFoodEaten : 0;
  totalCollisions = Number.isFinite(checkpoint.training?.totalCollisions) ? checkpoint.training.totalCollisions : 0;
  championMetrics = createChampionMetrics();
  genomes = [];

  for (const brainData of checkpoint.eliteBrains.slice(0, settings.maxAgents)) {
    if (brainData) {
      genomes.push(createGenome(NeuralNetwork.fromData(brainData)));
    }
  }

  while (genomes.length < settings.maxAgents) {
    const parent = genomes[genomes.length % Math.max(1, genomes.length)];
    genomes.push(parent ? createGenome(NeuralNetwork.clone(parent.brain), nextGenomeId, parent.lineageId) : createGenome());
  }

  resetGenomeEvaluations();
  startEvaluationRound();
  nextGenomeId = Math.max(nextGenomeId, genomes.reduce((maxId, genome) => Math.max(maxId, genome.id + 1), 1));
  updateStats();
  return true;
}

async function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.checkpoint);
  } catch {
    // Old local storage is best-effort cleanup only.
  }

  try {
    await fetchJson(PROJECT_JSON_API, { method: "DELETE" });
  } catch (error) {
    console.warn("Nao foi possivel limpar o JSON do projeto no banco.", error);
  }
}

function readSettings(persist = false) {
  const form = new FormData(ui.settings);
  const numberField = (name, fallback) => {
    const value = Number(form.get(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const next = {
    targetFood: clamp(numberField("targetFood", defaults.targetFood), 0, 400),
    minAgents: clamp(numberField("minAgents", defaults.minAgents), 1, 200),
    maxAgents: clamp(numberField("maxAgents", defaults.maxAgents), 1, 500),
    maxEnergy: clamp(numberField("maxEnergy", defaults.maxEnergy), 100, 10000),
    foodEnergy: clamp(numberField("foodEnergy", defaults.foodEnergy), 20, 5000),
    maxSpeed: clamp(numberField("maxSpeed", defaults.maxSpeed), 0.2, 20),
    idleEnergyFrames: clamp(numberField("idleEnergyFrames", defaults.idleEnergyFrames), 100, 30000),
    accelerationCostMultiplier: clamp(
      numberField("accelerationCostMultiplier", defaults.accelerationCostMultiplier),
      0,
      4
    ),
    collisionEnergyLossPercent: clamp(
      numberField("collisionEnergyLossPercent", defaults.collisionEnergyLossPercent),
      0,
      100
    ),
    memoryTau: clamp(numberField("memoryTau", defaults.memoryTau), 10, 2000),
    mutationChance: clamp(numberField("mutationChance", defaults.mutationChance), 0, 1),
    mutationStrength: clamp(numberField("mutationStrength", defaults.mutationStrength), 0, 1),
  };

  if (next.maxAgents < next.minAgents + 1) {
    next.maxAgents = next.minAgents + 1;
    document.querySelector("#maxAgents").value = String(next.maxAgents);
  }

  settings = next;
  if (genomes.length > settings.maxAgents) {
    genomes = rankedGenomesForPersistence().slice(0, settings.maxAgents);
    agents = agents.filter((agent) => genomes.some((genome) => genome.id === agent.genomeId));
  }
  while (genomes.length > 0 && genomes.length < settings.maxAgents) {
    const ranked = rankedGenomesForPersistence();
    const parent = ranked[genomes.length % ranked.length];
    const brain = parent ? NeuralNetwork.clone(parent.brain) : new NeuralNetwork();
    const mutated = Boolean(parent && Math.random() < settings.mutationChance);
    if (mutated) {
      brain.mutate(settings.mutationStrength);
    }
    genomes.push(createGenome(brain, nextGenomeId, parent && !mutated ? parent.lineageId : null));
  }

  for (const agent of agents) {
    agent.energy = Math.min(agent.energy, settings.maxEnergy);
    agent.vx = clamp(agent.vx, -settings.maxSpeed, settings.maxSpeed);
    agent.vy = clamp(agent.vy, -settings.maxSpeed, settings.maxSpeed);
  }

  if (persist) {
    saveSettings();
  }
}

function update() {
  frame += 1;

  for (const agent of agents) {
    agent.update();
  }

  handleFoodCollection();
  const deadAgents = removeDeadAgents();
  if (agents.length === 0) {
    finalizeRound();
  }
  maintainFood();
}

function draw() {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);
  drawGround();
  drawHome();
  drawFoods();
  drawWalls();
  drawAgents();
}

function drawGround() {
  ctx.fillStyle = "#151917";
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.height);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
  }
}

function drawHome() {
  ctx.fillStyle = "rgba(63, 145, 95, 0.32)";
  ctx.fillRect(WORLD.home.x, WORLD.home.y, WORLD.home.w, WORLD.home.h);
  ctx.strokeStyle = "#54b978";
  ctx.strokeRect(WORLD.home.x + 0.5, WORLD.home.y + 0.5, WORLD.home.w - 1, WORLD.home.h - 1);
}

function drawWalls() {
  ctx.fillStyle = "#757d75";
  ctx.strokeStyle = "#4c544c";
  for (const wall of walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
}

function drawFoods() {
  ctx.fillStyle = "#68da77";
  for (const food of foods) {
    ctx.fillRect(food.x, food.y, food.w, food.h);
  }
}

function drawArrow(x, y, dx, dy, color, scale, minLength = 0) {
  const magnitude = Math.hypot(dx, dy);
  if (magnitude <= 0.0001) return;

  const length = Math.max(minLength, magnitude * scale);
  const ux = dx / magnitude;
  const uy = dy / magnitude;
  const endX = x + ux * length;
  const endY = y + uy * length;
  const head = clamp(length * 0.22, 3, 8);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - ux * head - uy * head * 0.55, endY - uy * head + ux * head * 0.55);
  ctx.lineTo(endX - ux * head + uy * head * 0.55, endY - uy * head - ux * head * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawSurvivalChart() {
  const width = ui.survivalChart.width;
  const height = ui.survivalChart.height;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const values = survivalSamples.map((sample) => sample.value);
  const latest = values.length > 0 ? values[values.length - 1] : 0;

  ui.survivalAverage.textContent = latest > 0 ? `${latest}f` : "0";
  survivalCtx.clearRect(0, 0, width, height);
  survivalCtx.fillStyle = "#101412";
  survivalCtx.fillRect(0, 0, width, height);

  survivalCtx.strokeStyle = "rgba(255,255,255,0.08)";
  survivalCtx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (chartHeight / 4) * i;
    survivalCtx.beginPath();
    survivalCtx.moveTo(padding, y);
    survivalCtx.lineTo(width - padding, y);
    survivalCtx.stroke();
  }

  if (values.length === 0) {
    survivalCtx.fillStyle = "rgba(237,243,238,0.48)";
    survivalCtx.font = "12px Arial, Helvetica, sans-serif";
    survivalCtx.fillText("aguardando 10 épocas", padding, height / 2 + 4);
    return;
  }

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, maxValue);
  const range = Math.max(1, maxValue - minValue);

  survivalCtx.strokeStyle = "#64d487";
  survivalCtx.lineWidth = 2;
  survivalCtx.beginPath();

  values.forEach((value, index) => {
    const x =
      values.length === 1
        ? padding
        : padding + (index / (values.length - 1)) * chartWidth;
    const y = height - padding - ((value - minValue) / range) * chartHeight;
    if (index === 0) {
      survivalCtx.moveTo(x, y);
    } else {
      survivalCtx.lineTo(x, y);
    }
  });
  survivalCtx.stroke();

  survivalCtx.fillStyle = "#64d487";
  const lastX = values.length === 1 ? padding : width - padding;
  const lastY = height - padding - ((latest - minValue) / range) * chartHeight;
  survivalCtx.beginPath();
  survivalCtx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  survivalCtx.fill();

  survivalCtx.fillStyle = "rgba(237,243,238,0.68)";
  survivalCtx.font = "11px Arial, Helvetica, sans-serif";
  survivalCtx.fillText(`${maxValue}f`, padding, padding + 4);
  survivalCtx.fillText(`${minValue}f`, padding, height - padding);
}

function drawPopulationSurvivalChart() {
  const width = ui.survivalChart.width;
  const height = ui.survivalChart.height;
  const padding = 10;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const bestValues = survivalSamples.map((sample) => sample.best ?? sample.value ?? 0);
  const meanValues = survivalSamples.map((sample) => sample.mean ?? sample.value ?? 0);
  const medianValues = survivalSamples.map((sample) => sample.median ?? sample.value ?? 0);
  const allValues = bestValues.concat(meanValues, medianValues).filter((value) => Number.isFinite(value));
  const latestBest = bestValues.length > 0 ? bestValues[bestValues.length - 1] : 0;
  const latestMean = meanValues.length > 0 ? meanValues[meanValues.length - 1] : 0;
  const latestMedian = medianValues.length > 0 ? medianValues[medianValues.length - 1] : 0;

  ui.survivalAverage.textContent = latestBest > 0 ? `${latestBest}f` : "0";
  ui.bestSurvivalAverage.textContent = latestBest > 0 ? `${latestBest}f` : "0";
  ui.meanSurvivalAverage.textContent = latestMean > 0 ? `${latestMean}f` : "0";
  ui.medianSurvivalAverage.textContent = latestMedian > 0 ? `${latestMedian}f` : "0";

  survivalCtx.clearRect(0, 0, width, height);
  survivalCtx.fillStyle = "#101412";
  survivalCtx.fillRect(0, 0, width, height);
  survivalCtx.strokeStyle = "rgba(255,255,255,0.08)";
  survivalCtx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (chartHeight / 4) * i;
    survivalCtx.beginPath();
    survivalCtx.moveTo(padding, y);
    survivalCtx.lineTo(width - padding, y);
    survivalCtx.stroke();
  }

  if (bestValues.length === 0) {
    survivalCtx.fillStyle = "rgba(237,243,238,0.48)";
    survivalCtx.font = "12px Arial, Helvetica, sans-serif";
    survivalCtx.fillText("aguardando 10 epocas", padding, height / 2 + 4);
    return;
  }

  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, maxValue);
  const range = Math.max(1, maxValue - minValue);

  const drawSeries = (values, color, lineWidth) => {
    survivalCtx.strokeStyle = color;
    survivalCtx.lineWidth = lineWidth;
    survivalCtx.beginPath();

    values.forEach((value, index) => {
      const x =
        values.length === 1
          ? padding
          : padding + (index / (values.length - 1)) * chartWidth;
      const y = height - padding - ((value - minValue) / range) * chartHeight;
      if (index === 0) {
        survivalCtx.moveTo(x, y);
      } else {
        survivalCtx.lineTo(x, y);
      }
    });
    survivalCtx.stroke();
  };

  drawSeries(bestValues, "#64d487", 2);
  drawSeries(meanValues, "#f0b45b", 1.7);
  drawSeries(medianValues, "#75a7ff", 1.7);

  survivalCtx.fillStyle = "rgba(237,243,238,0.68)";
  survivalCtx.font = "11px Arial, Helvetica, sans-serif";
  survivalCtx.fillText(`${maxValue}f`, padding, padding + 4);
  survivalCtx.fillText(`${minValue}f`, padding, height - padding);
}

function drawAgents() {
  for (const agent of agents) {
    const energyRatio = clamp(agent.energy / settings.maxEnergy, 0, 1);
    const hue = Math.floor(205 + energyRatio * 45);
    const centerX = agent.x + agent.w / 2;
    const centerY = agent.y + agent.h / 2;

    ctx.fillStyle = agent.collisionFlash > 0 ? "#f16f5d" : `hsl(${hue}, 88%, 68%)`;
    ctx.fillRect(agent.x, agent.y, agent.w, agent.h);

    ctx.fillStyle = "#09110d";
    ctx.fillRect(agent.x + 6, agent.y + 5, 3, 3);
    ctx.fillRect(agent.x + 12, agent.y + 5, 3, 3);

    ctx.fillStyle = "rgba(20, 20, 20, 0.85)";
    ctx.fillRect(agent.x, agent.y - 7, agent.w, 4);
    ctx.fillStyle = energyRatio > 0.25 ? "#65dd85" : "#e06464";
    ctx.fillRect(agent.x, agent.y - 7, agent.w * energyRatio, 4);

    drawArrow(centerX, centerY, agent.vx, agent.vy, "rgba(255, 255, 255, 0.9)", 16, 8);
    drawArrow(centerX, centerY, agent.ax, agent.ay, "rgba(255, 199, 92, 0.95)", 2800, 0);
  }
}

function updateStats() {
  const bestTotals = currentChampionMetricTotals();

  ui.agentCount.textContent = String(agents.length);
  ui.foodCount.textContent = String(foods.length);
  ui.generationCount.textContent = String(generation);
  ui.foodRate.textContent = formatFramesPerEvent(bestTotals.frames, bestTotals.foods);
  ui.roundCount.textContent = `${evaluationRound}/${EVALUATION_ROUNDS}`;
  ui.bestWallTouchRate.textContent = formatFramesPerEvent(bestTotals.frames, bestTotals.collisions);
  ui.bestFramesPerTouch.textContent = formatFrameSample(bestTotals.frames);
  drawPopulationSurvivalChart();
}

function bestObservedAgent() {
  const observed = agents.concat(currentRoundResults);
  if (observed.length === 0) return null;
  return observed.slice().sort((a, b) => scoreAgent(b) - scoreAgent(a))[0];
}

function currentChampionMetricTotals() {
  const totals = {
    frames: championMetrics.frames,
    foods: championMetrics.foods,
    collisions: championMetrics.collisions,
  };
  if (championMetrics.lineageId === null) {
    return totals;
  }

  for (const agent of agents) {
    const genome = genomes.find((candidate) => candidate.id === agent.genomeId);
    if (genome?.lineageId !== championMetrics.lineageId) continue;
    totals.frames += agent.age;
    totals.foods += agent.foodsEaten;
    totals.collisions += agent.collisions;
  }
  return totals;
}

function formatFramesPerEvent(frames, events) {
  if (!Number.isFinite(frames) || frames <= 0) return "0";
  if (!Number.isFinite(events) || events <= 0) return "inf";
  return formatCompactNumber(frames / events);
}

function formatFrameSample(frames) {
  if (!Number.isFinite(frames) || frames <= 0) return "0f";
  return `${formatCompactNumber(frames)}f`;
}

function formatCompactNumber(value) {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function formatRate(value) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value < 0.001) return value.toExponential(1);
  return value.toFixed(3);
}

function loop() {
  if (running) {
    if (turboMode) {
      const startedAt = performance.now();
      let steps = 0;
      while (performance.now() - startedAt < 24 && steps < 5000) {
        update();
        steps += 1;
      }
    } else {
      update();
    }
  }
  draw();

  if (frame % 10 === 0 || !running || turboMode) {
    updateStats();
  }

  requestAnimationFrame(loop);
}

ui.settings.addEventListener("submit", (event) => {
  event.preventDefault();
  readSettings(true);
  maintainFood();
  updateStats();
});

ui.settings.addEventListener("change", () => {
  readSettings(true);
  maintainFood();
  updateStats();
});

ui.resetWorld.addEventListener("click", () => {
  readSettings(true);
  resetSimulation();
});

ui.clearEverything.addEventListener("click", async () => {
  const confirmed = window.confirm(
    "Isso apaga configuracoes, historico, checkpoints e todos os cerebros salvos. Deseja limpar tudo?"
  );
  if (!confirmed) return;

  await clearStorage();
  applySettingsToPanel(defaults);
  readSettings(true);
  resetSimulation();
});

ui.toggleRun.addEventListener("click", () => {
  running = !running;
  ui.toggleRun.textContent = running ? "Pausar" : "Continuar";
  updateStats();
});

ui.toggleTurbo.addEventListener("click", () => {
  turboMode = !turboMode;
  ui.toggleTurbo.classList.toggle("active", turboMode);
  ui.toggleTurbo.textContent = turboMode ? "Turbo ligado" : "Turbo";
});

window.addEventListener("beforeunload", () => {
  readSettings(false);
  saveProjectStateNow({ keepalive: true });
});

async function init() {
  readSettings(false);
  resetSimulation();
  loop();
  const restored = await restoreProjectFromDatabase();
  if (!restored) {
    queueProjectSave();
  }
}

init();
