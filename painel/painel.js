const TOKEN_KEY = "shadowing_factory_token";
const SMART_CONTROL_KEY = "shadowing_factory_smart_control_v2";
const LEGACY_SMART_CONTROL_KEY = "shadowing_factory_smart_control_v1";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();
const MAX_CHART_SAMPLES = 240;
const SMART_SAFE_GAP_RATIO = 0.1;
const SMART_START_DIFF_RATIO = 1;
const SMART_ERROR_GAIN = 0.75;
const SMART_RELAX_GAIN = 0.08;
const SMART_PREDICTION_WEIGHT = 0.9;
const SMART_RELAX_AFTER_CYCLES = 2;
const SMART_MAX_RELAX_RATIO = 0.035;
const SMART_TREND_DEADBAND = 0.004;

const elements = {
  loginView: document.getElementById("loginView"),
  panelView: document.getElementById("panelView"),
  loginForm: document.getElementById("loginForm"),
  passwordInput: document.getElementById("passwordInput"),
  loginStatus: document.getElementById("loginStatus"),
  statusMessage: document.getElementById("statusMessage"),
  logoutButton: document.getElementById("logoutButton"),
  refreshButton: document.getElementById("refreshButton"),
  temperatureValue: document.getElementById("temperatureValue"),
  lastReading: document.getElementById("lastReading"),
  rangeLabel: document.getElementById("rangeLabel"),
  rangeBadge: document.getElementById("rangeBadge"),
  tempoLeituraInput: document.getElementById("tempoLeituraInput"),
  pointDownInput: document.getElementById("pointDownInput"),
  pointUpInput: document.getElementById("pointUpInput"),
  smartModeInput: document.getElementById("smartModeInput"),
  smartModeText: document.getElementById("smartModeText"),
  smartStatus: document.getElementById("smartStatus"),
  smartDownInput: document.getElementById("smartDownInput"),
  smartUpInput: document.getElementById("smartUpInput"),
  temperatureChart: document.getElementById("temperatureChart")
};

let pollingTimer = null;
let saveTimer = null;
let isSaving = false;
let latestConfig = {};
let latestTemperature = null;
let latestTemperatureUpdatedAt = null;
let smartState = loadSmartState();
let temperatureSamples = [];

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await login();
});

elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  stopPolling();
  showLogin("Sessao encerrada.");
});

elements.refreshButton.addEventListener("click", () => loadState(true));

[
  elements.tempoLeituraInput,
  elements.pointDownInput,
  elements.pointUpInput
].forEach((input) => {
  input.addEventListener("input", scheduleSettingsSave);
  input.addEventListener("change", () => saveSettingsNow());
});

elements.smartModeInput.addEventListener("change", () => {
  smartState.enabled = elements.smartModeInput.checked;
  syncSmartTargetsFromInputs();
  if (smartState.enabled) resetSmartDiffs();
  saveSmartState();
  renderSmartControls(latestConfig);
  scheduleSettingsSave();
});

[
  elements.smartDownInput,
  elements.smartUpInput
].forEach((input) => {
  input.addEventListener("input", () => {
    const previousDown = smartState.smartDown;
    const previousUp = smartState.smartUp;
    syncSmartTargetsFromInputs();
    if (Math.abs((smartState.smartDown || 0) - (previousDown || 0)) > 0.01 ||
        Math.abs((smartState.smartUp || 0) - (previousUp || 0)) > 0.01) {
      resetSmartDiffs();
    }
    saveSmartState();
    renderSmartControls(latestConfig);
    scheduleSettingsSave();
  });
  input.addEventListener("change", () => saveSettingsNow());
});

boot();

async function boot() {
  renderSmartControls(latestConfig);
  renderTemperatureChart(latestConfig);

  const token = getToken();
  if (!token) {
    showLogin("");
    return;
  }

  try {
    await requestJson("/api/session");
    showPanel();
    await loadState(true);
    startPolling();
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    showLogin("Entre novamente.");
  }
}

async function login() {
  const password = elements.passwordInput.value;
  if (!password) {
    setLoginStatus("Digite a chave.", true);
    return;
  }

  try {
    setLoginStatus("Validando...");
    const data = await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify({ password }),
      skipAuth: true
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    elements.passwordInput.value = "";
    showPanel();
    await loadState(true);
    startPolling();
  } catch (error) {
    setLoginStatus(error.message, true);
  }
}

async function loadState(forceInputs = false) {
  try {
    const data = await requestJson("/api/painel/state");
    applyState(data, forceInputs);
    setStatus(isSaving ? "Salvando ajustes..." : "Painel sincronizado.");
  } catch (error) {
    handleRequestError(error);
  }
}

function applyState(data, forceInputs) {
  const remoteConfig = normalizeConfig(data.config || {});
  latestTemperature = parseFiniteNumber(data.temperature);
  latestTemperatureUpdatedAt = data.temperatureUpdatedAt;

  setInputValue(elements.tempoLeituraInput, remoteConfig.tempoLeitura, forceInputs);
  ensureSmartDefaults(remoteConfig, forceInputs);
  pushTemperatureSample(latestTemperature, latestTemperatureUpdatedAt);

  let renderConfig = remoteConfig;
  if (smartState.enabled) {
    learnSmartControl(latestTemperature, latestTemperatureUpdatedAt, remoteConfig);
    const smartConfig = computeSmartConfig(latestTemperature, remoteConfig);
    if (smartConfig) {
      renderConfig = smartConfig;
      setInputValue(elements.pointDownInput, renderConfig.pointDown, true);
      setInputValue(elements.pointUpInput, renderConfig.pointUp, true);
      maybeScheduleSmartSave(remoteConfig, renderConfig);
    }
  } else {
    setInputValue(elements.pointDownInput, remoteConfig.pointDown, forceInputs);
    setInputValue(elements.pointUpInput, remoteConfig.pointUp, forceInputs);
  }

  latestConfig = renderConfig;
  renderSmartControls(renderConfig);
  renderTemperature(latestTemperature, latestTemperatureUpdatedAt, renderConfig);
  renderTemperatureChart(renderConfig);
}

function normalizeConfig(config) {
  return {
    tempoLeitura: parseFiniteNumber(config.tempoLeitura),
    pointDown: parseFiniteNumber(config.pointDown),
    pointUp: parseFiniteNumber(config.pointUp)
  };
}

function setInputValue(input, value, force) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return;
  if (!force && document.activeElement === input) return;
  input.value = String(roundTo(value, 2));
}

function renderTemperature(value, updatedAt, config) {
  const hasTemperature = Number.isFinite(value);
  elements.temperatureValue.textContent = hasTemperature ? value.toFixed(1) : "--.-";
  elements.lastReading.textContent = hasTemperature
    ? `Ultima leitura: ${formatDate(updatedAt)}`
    : "Nenhuma leitura recebida ainda.";

  const pointDown = Number(config.pointDown);
  const pointUp = Number(config.pointUp);
  elements.rangeBadge.className = "range-badge";

  if (!hasTemperature || !Number.isFinite(pointDown) || !Number.isFinite(pointUp)) {
    elements.rangeLabel.textContent = "Aguardando leitura";
    elements.rangeBadge.textContent = "sem dados";
    elements.rangeBadge.classList.add("range-waiting");
    return;
  }
  if (value < pointDown) {
    elements.rangeLabel.textContent = "Abaixo do limite";
    elements.rangeBadge.textContent = "frio";
    elements.rangeBadge.classList.add("range-cold");
    return;
  }
  if (value > pointUp) {
    elements.rangeLabel.textContent = "Acima do limite";
    elements.rangeBadge.textContent = "quente";
    elements.rangeBadge.classList.add("range-hot");
    return;
  }

  elements.rangeLabel.textContent = "Faixa ideal";
  elements.rangeBadge.textContent = "estavel";
  elements.rangeBadge.classList.add("range-ok");
}

function scheduleSettingsSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettingsNow, 450);
}

async function saveSettingsNow() {
  clearTimeout(saveTimer);
  const payload = readSettingsPayload();
  if (!payload) return;

  try {
    isSaving = true;
    setStatus("Salvando ajustes...");
    await requestJson("/api/painel/settings", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    await loadState(false);
  } catch (error) {
    handleRequestError(error);
  } finally {
    isSaving = false;
  }
}

function readSettingsPayload() {
  const tempoLeitura = Number.parseInt(elements.tempoLeituraInput.value, 10);
  if (!Number.isFinite(tempoLeitura) || tempoLeitura < 1) {
    setStatus("Tempo de leitura precisa ser pelo menos 1 segundo.", true);
    return null;
  }

  if (smartState.enabled) {
    syncSmartTargetsFromInputs();
    const smartConfig = computeSmartConfig(latestTemperature, { tempoLeitura });
    if (!smartConfig) return null;
    setInputValue(elements.pointDownInput, smartConfig.pointDown, true);
    setInputValue(elements.pointUpInput, smartConfig.pointUp, true);
    saveSmartState();
    return {
      tempoLeitura,
      pointDown: smartConfig.pointDown,
      pointUp: smartConfig.pointUp
    };
  }

  const pointDown = Number(elements.pointDownInput.value);
  const pointUp = Number(elements.pointUpInput.value);
  if (!Number.isFinite(pointDown) || !Number.isFinite(pointUp)) {
    setStatus("Preencha os dois pontos de temperatura.", true);
    return null;
  }
  if (pointDown >= pointUp) {
    setStatus("point_down precisa ser menor que point_up.", true);
    return null;
  }

  return { tempoLeitura, pointDown, pointUp };
}

function ensureSmartDefaults(config, forceInputs) {
  const hasSmartTargets = Number.isFinite(smartState.smartDown) && Number.isFinite(smartState.smartUp);
  if (!hasSmartTargets && Number.isFinite(config.pointDown) && Number.isFinite(config.pointUp)) {
    smartState.smartDown = config.pointDown;
    smartState.smartUp = config.pointUp;
    resetSmartDiffs();
    saveSmartState();
  }
  if (hasSmartTargets && (!Number.isFinite(smartState.diffDown) || !Number.isFinite(smartState.diffUp))) {
    resetSmartDiffs();
    saveSmartState();
  }

  setInputValue(elements.smartDownInput, smartState.smartDown, forceInputs);
  setInputValue(elements.smartUpInput, smartState.smartUp, forceInputs);
}

function syncSmartTargetsFromInputs() {
  const smartDown = Number(elements.smartDownInput.value);
  const smartUp = Number(elements.smartUpInput.value);
  if (Number.isFinite(smartDown)) smartState.smartDown = smartDown;
  if (Number.isFinite(smartUp)) smartState.smartUp = smartUp;
}

function resetSmartDiffs() {
  const limits = getSmartLimits();
  if (!limits) return;
  smartState.diffDown = limits.maxDiff * SMART_START_DIFF_RATIO;
  smartState.diffUp = limits.maxDiff * SMART_START_DIFF_RATIO;
  smartState.tauSeconds = estimateInitialTau();
  smartState.hotCycles = 0;
  smartState.coldCycles = 0;
  smartState.hotTracking = false;
  smartState.coldTracking = false;
  smartState.hotPeak = null;
  smartState.coldValley = null;
  smartState.hotLastPeak = null;
  smartState.coldLastValley = null;
}

function learnSmartControl(temperature, updatedAt, config) {
  if (!Number.isFinite(temperature)) return;
  const timeMs = getSampleTime(updatedAt);

  if (Number.isFinite(smartState.lastTemperature) && Number.isFinite(smartState.lastTimestamp)) {
    const dt = Math.max((timeMs - smartState.lastTimestamp) / 1000, 0.25);
    const instantTrend = (temperature - smartState.lastTemperature) / dt;
    smartState.trendCPerSecond = Number.isFinite(smartState.trendCPerSecond)
      ? smartState.trendCPerSecond * 0.75 + instantTrend * 0.25
      : instantTrend;
  }

  smartState.lastTemperature = temperature;
  smartState.lastTimestamp = timeMs;

  const limits = getSmartLimits();
  if (!limits) return;
  const controlConfig = computeSmartConfig(temperature, config, { silent: true });
  const pointDown = controlConfig ? controlConfig.pointDown : smartState.smartDown + smartState.diffDown;
  const pointUp = controlConfig ? controlConfig.pointUp : smartState.smartUp - smartState.diffUp;
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;

  if (trend >= SMART_TREND_DEADBAND && temperature >= pointUp) {
    smartState.hotTracking = true;
    smartState.hotPeak = Number.isFinite(smartState.hotPeak)
      ? Math.max(smartState.hotPeak, temperature)
      : temperature;
  } else if (smartState.hotTracking) {
    smartState.hotPeak = Number.isFinite(smartState.hotPeak)
      ? Math.max(smartState.hotPeak, temperature)
      : temperature;
    if (trend <= -SMART_TREND_DEADBAND || temperature <= pointUp) {
      finishHotCycle(smartState.hotPeak, limits);
    }
  }

  if (trend <= -SMART_TREND_DEADBAND && temperature <= pointDown) {
    smartState.coldTracking = true;
    smartState.coldValley = Number.isFinite(smartState.coldValley)
      ? Math.min(smartState.coldValley, temperature)
      : temperature;
  } else if (smartState.coldTracking) {
    smartState.coldValley = Number.isFinite(smartState.coldValley)
      ? Math.min(smartState.coldValley, temperature)
      : temperature;
    if (trend >= SMART_TREND_DEADBAND || temperature >= pointDown) {
      finishColdCycle(smartState.coldValley, limits);
    }
  }

  if (temperature > smartState.smartUp) {
    const overshoot = temperature - smartState.smartUp;
    smartState.diffUp += overshoot * SMART_ERROR_GAIN + limits.maxDiff * 0.04;
    smartState.hotLastPeak = Math.max(smartState.hotLastPeak || temperature, temperature);
    smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) + overshoot * 4, 12, 420);
  }

  if (temperature < smartState.smartDown) {
    const undershoot = smartState.smartDown - temperature;
    smartState.diffDown += undershoot * SMART_ERROR_GAIN + limits.maxDiff * 0.04;
    smartState.coldLastValley = Math.min(smartState.coldLastValley || temperature, temperature);
    smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) + undershoot * 4, 12, 420);
  }

  smartState.diffDown = clamp(smartState.diffDown, 0, limits.maxDiff);
  smartState.diffUp = clamp(smartState.diffUp, 0, limits.maxDiff);
  smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) * 0.999, 12, 420);
  saveSmartState();
}

function finishHotCycle(peak, limits) {
  smartState.hotTracking = false;
  smartState.hotPeak = null;
  if (!Number.isFinite(peak)) return;

  smartState.hotCycles = (smartState.hotCycles || 0) + 1;
  smartState.hotLastPeak = peak;
  const error = peak - smartState.smartUp;
  if (error > 0) {
    smartState.diffUp += error * SMART_ERROR_GAIN + limits.maxDiff * 0.06;
    return;
  }

  if (smartState.hotCycles >= SMART_RELAX_AFTER_CYCLES) {
    const missedTarget = Math.abs(error);
    const maxRelax = limits.maxDiff * SMART_MAX_RELAX_RATIO;
    smartState.diffUp -= Math.min(missedTarget * SMART_RELAX_GAIN, maxRelax);
  }
}

function finishColdCycle(valley, limits) {
  smartState.coldTracking = false;
  smartState.coldValley = null;
  if (!Number.isFinite(valley)) return;

  smartState.coldCycles = (smartState.coldCycles || 0) + 1;
  smartState.coldLastValley = valley;
  const error = smartState.smartDown - valley;
  if (error > 0) {
    smartState.diffDown += error * SMART_ERROR_GAIN + limits.maxDiff * 0.06;
    return;
  }

  if (smartState.coldCycles >= SMART_RELAX_AFTER_CYCLES) {
    const missedTarget = Math.abs(error);
    const maxRelax = limits.maxDiff * SMART_MAX_RELAX_RATIO;
    smartState.diffDown -= Math.min(missedTarget * SMART_RELAX_GAIN, maxRelax);
  }
}

function computeSmartConfig(temperature, fallbackConfig = {}, options = {}) {
  const limits = getSmartLimits();
  if (!limits) {
    if (!options.silent) {
      setStatus("No modo inteligente, smart_down precisa ser menor que smart_up.", true);
    }
    return null;
  }

  if (!Number.isFinite(smartState.diffDown) || !Number.isFinite(smartState.diffUp)) {
    resetSmartDiffs();
  }

  const projection = Number.isFinite(temperature)
    ? estimateExponentialProjection(fallbackConfig)
    : { rise: 0, drop: 0 };
  const storedDiffDown = (smartState.coldCycles || 0) === 0
    ? limits.maxDiff
    : smartState.diffDown;
  const storedDiffUp = (smartState.hotCycles || 0) === 0
    ? limits.maxDiff
    : smartState.diffUp;
  const diffDown = clamp(storedDiffDown + projection.drop * SMART_PREDICTION_WEIGHT, 0, limits.maxDiff);
  const diffUp = clamp(storedDiffUp + projection.rise * SMART_PREDICTION_WEIGHT, 0, limits.maxDiff);
  let pointDown = smartState.smartDown + diffDown;
  let pointUp = smartState.smartUp - diffUp;

  if (pointDown >= pointUp) {
    const center = (smartState.smartDown + smartState.smartUp) / 2;
    pointDown = center - limits.minGap / 2;
    pointUp = center + limits.minGap / 2;
  }

  return {
    tempoLeitura: fallbackConfig.tempoLeitura,
    pointDown: roundTo(pointDown, 1),
    pointUp: roundTo(pointUp, 1)
  };
}

function getSmartLimits() {
  if (!Number.isFinite(smartState.smartDown) ||
      !Number.isFinite(smartState.smartUp) ||
      smartState.smartDown >= smartState.smartUp) {
    return null;
  }
  const span = smartState.smartUp - smartState.smartDown;
  const minGap = Math.max(0.4, span * SMART_SAFE_GAP_RATIO);
  return {
    span,
    minGap,
    maxDiff: Math.max(0, (span - minGap) / 2)
  };
}

function estimateExponentialProjection(config = {}) {
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  const tau = clamp(smartState.tauSeconds || estimateInitialTau(config), 12, 420);
  const interval = getReadingInterval(config);
  const horizon = clamp(interval * 3, 6, 180);
  const delta = trend * tau * (1 - Math.exp(-horizon / tau));
  return {
    delta,
    rise: Math.max(0, delta),
    drop: Math.max(0, -delta)
  };
}

function estimateInitialTau(config = {}) {
  return clamp(getReadingInterval(config) * 8, 24, 240);
}

function getReadingInterval(config = {}) {
  const fromInput = Number.parseInt(elements.tempoLeituraInput.value, 10);
  const fromConfig = Number(config.tempoLeitura);
  if (Number.isFinite(fromInput) && fromInput > 0) return fromInput;
  if (Number.isFinite(fromConfig) && fromConfig > 0) return fromConfig;
  return 2.5;
}

function maybeScheduleSmartSave(remoteConfig, smartConfig) {
  if (!smartConfig || isSaving) return;
  const changed = Math.abs((remoteConfig.pointDown || 0) - smartConfig.pointDown) >= 0.05 ||
    Math.abs((remoteConfig.pointUp || 0) - smartConfig.pointUp) >= 0.05;
  if (changed) scheduleSettingsSave();
}

function renderSmartControls(config = {}) {
  elements.smartModeInput.checked = Boolean(smartState.enabled);
  elements.smartModeText.textContent = smartState.enabled ? "ativado" : "desativado";
  document.querySelectorAll(".manual-setting").forEach((node) => {
    node.classList.toggle("is-hidden", smartState.enabled);
  });
  document.querySelectorAll(".smart-setting").forEach((node) => {
    node.classList.toggle("is-hidden", !smartState.enabled);
  });

  if (!smartState.enabled) {
    elements.smartStatus.textContent = "Usando point_down e point_up manuais.";
    return;
  }

  const projection = estimateExponentialProjection(config);
  const diffDown = Number.isFinite(smartState.diffDown) ? smartState.diffDown : 0;
  const diffUp = Number.isFinite(smartState.diffUp) ? smartState.diffUp : 0;
  const pointDown = Number.isFinite(config.pointDown) ? `${Number(config.pointDown).toFixed(1)} C` : "--";
  const pointUp = Number.isFinite(config.pointUp) ? `${Number(config.pointUp).toFixed(1)} C` : "--";
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  const hotCycles = smartState.hotCycles || 0;
  const coldCycles = smartState.coldCycles || 0;
  elements.smartStatus.textContent =
    `point_down ${pointDown}, point_up ${pointUp}. ` +
    `diff_down ${diffDown.toFixed(2)}, diff_up ${diffUp.toFixed(2)}, ` +
    `tendencia ${trend.toFixed(3)} C/s, previsao ${projection.delta.toFixed(2)} C, ` +
    `ciclos up/down ${hotCycles}/${coldCycles}.`;
}

function pushTemperatureSample(temperature, updatedAt) {
  if (!Number.isFinite(temperature)) return;
  const time = getSampleTime(updatedAt);
  const last = temperatureSamples[temperatureSamples.length - 1];
  if (last && last.time === time && last.temperature === temperature) return;
  temperatureSamples.push({ time, temperature });
  if (temperatureSamples.length > MAX_CHART_SAMPLES) {
    temperatureSamples = temperatureSamples.slice(-MAX_CHART_SAMPLES);
  }
}

function renderTemperatureChart(config = {}) {
  if (!elements.temperatureChart) return;
  const svg = elements.temperatureChart;
  const width = 920;
  const height = 260;
  const padding = { left: 58, right: 18, top: 20, bottom: 36 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (temperatureSamples.length === 0) {
    svg.innerHTML = `
      <title id="chartTitle">Grafico da temperatura no tempo</title>
      <desc id="chartDesc">Ainda nao ha amostras de temperatura para desenhar.</desc>
      <text class="chart-empty" x="${width / 2}" y="${height / 2}" text-anchor="middle">Aguardando amostras</text>
    `;
    return;
  }

  const timeMin = temperatureSamples[0].time;
  const timeMax = temperatureSamples[temperatureSamples.length - 1].time || timeMin + 1;
  const values = temperatureSamples.map((sample) => sample.temperature);
  [
    config.pointDown,
    config.pointUp,
    smartState.enabled ? smartState.smartDown : null,
    smartState.enabled ? smartState.smartUp : null
  ].forEach((value) => {
    if (Number.isFinite(value)) values.push(value);
  });
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const yPadding = Math.max((yMax - yMin) * 0.12, 0.5);
  yMin -= yPadding;
  yMax += yPadding;

  const xScale = (time) => padding.left + ((time - timeMin) / Math.max(timeMax - timeMin, 1)) * plotWidth;
  const yScale = (value) => padding.top + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;
  const path = temperatureSamples
    .map((sample, index) => `${index === 0 ? "M" : "L"} ${xScale(sample.time).toFixed(2)} ${yScale(sample.temperature).toFixed(2)}`)
    .join(" ");
  const yTicks = createTicks(yMin, yMax, 5);
  const xTicks = createTimeTicks(timeMin, timeMax, 4);
  const lines = [];

  if (smartState.enabled) {
    lines.push(limitLine(yScale, smartState.smartDown, "smart-limit", "smart down"));
    lines.push(limitLine(yScale, smartState.smartUp, "smart-limit", "smart up"));
  }
  lines.push(limitLine(yScale, config.pointDown, "control-limit", "point down"));
  lines.push(limitLine(yScale, config.pointUp, "control-limit", "point up"));

  svg.innerHTML = `
    <title id="chartTitle">Grafico da temperatura no tempo</title>
    <desc id="chartDesc">A linha mostra as amostras coletadas de temperatura e os limites do controle.</desc>
    <g class="chart-grid">
      ${yTicks.map((tick) => `<line x1="${padding.left}" x2="${width - padding.right}" y1="${yScale(tick).toFixed(2)}" y2="${yScale(tick).toFixed(2)}"></line>`).join("")}
    </g>
    <g class="chart-axis">
      ${yTicks.map((tick) => `<text x="${padding.left - 10}" y="${yScale(tick).toFixed(2)}" text-anchor="end" dominant-baseline="middle">${tick.toFixed(1)}</text>`).join("")}
      ${xTicks.map((tick) => `<text x="${xScale(tick).toFixed(2)}" y="${height - 10}" text-anchor="middle">${formatChartTime(tick)}</text>`).join("")}
    </g>
    <g class="chart-limits">${lines.join("")}</g>
    <path class="temperature-path" d="${path}"></path>
    ${temperatureSamples.length === 1 ? `<circle class="temperature-dot" cx="${xScale(temperatureSamples[0].time)}" cy="${yScale(temperatureSamples[0].temperature)}" r="4"></circle>` : ""}
  `;
}

function limitLine(yScale, value, className, label) {
  if (!Number.isFinite(value)) return "";
  const y = yScale(value).toFixed(2);
  return `
    <line class="${className}" x1="58" x2="902" y1="${y}" y2="${y}"></line>
    <text class="${className}-label" x="896" y="${Number(y) - 5}" text-anchor="end">${label} ${Number(value).toFixed(1)} C</text>
  `;
}

function createTicks(min, max, count) {
  const ticks = [];
  for (let index = 0; index < count; index += 1) {
    ticks.push(min + ((max - min) * index) / (count - 1));
  }
  return ticks;
}

function createTimeTicks(min, max, count) {
  if (min === max) return [min];
  const ticks = [];
  for (let index = 0; index < count; index += 1) {
    ticks.push(min + ((max - min) * index) / (count - 1));
  }
  return ticks;
}

function startPolling() {
  stopPolling();
  pollingTimer = setInterval(() => loadState(false), 2500);
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

async function requestJson(url, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token && !options.skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;
  for (let index = 0; index < API_BASES.length; index += 1) {
    const apiBase = API_BASES[index];
    try {
      const response = await fetch(`${apiBase}${url}`, {
        headers,
        method: options.method || "GET",
        body: options.body
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return data;

      const error = new Error(data.error || "Nao foi possivel concluir a operacao.");
      error.status = response.status;
      error.hasApiMessage = Boolean(data.error);
      if (!shouldTryNextApiBase(error, index)) throw error;
      lastError = error;
    } catch (error) {
      if (!shouldTryNextApiBase(error, index)) throw error;
      lastError = error;
    }
  }

  throw lastError || new Error("Nao foi possivel concluir a operacao.");
}

function getApiBases() {
  const localHosts = ["localhost", "127.0.0.1", ""];
  const isLocalPage = location.protocol === "file:" || localHosts.includes(location.hostname);
  if (isLocalPage && location.port !== REMOTE_API_PORT) {
    return [`http://127.0.0.1:${REMOTE_API_PORT}`];
  }
  if (location.hostname === REMOTE_API_HOST && location.port !== REMOTE_API_PORT) {
    return [`http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`, ""];
  }
  return [""];
}

function shouldTryNextApiBase(error, index) {
  if (index >= API_BASES.length - 1) return false;
  if (!error || !Number.isFinite(error.status)) return true;
  return [404, 502, 503, 504].includes(error.status) && !error.hasApiMessage;
}

function handleRequestError(error) {
  if (error.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    stopPolling();
    showLogin("Entre novamente.");
    return;
  }
  setStatus(error.message || "Falha de comunicacao.", true);
}

function showLogin(message) {
  elements.panelView.classList.add("is-hidden");
  elements.loginView.classList.remove("is-hidden");
  setLoginStatus(message || "");
  setTimeout(() => elements.passwordInput.focus(), 50);
}

function showPanel() {
  elements.loginView.classList.add("is-hidden");
  elements.panelView.classList.remove("is-hidden");
  setStatus("Conectado.");
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("error", isError);
}

function setLoginStatus(message, isError = false) {
  elements.loginStatus.textContent = message;
  elements.loginStatus.classList.toggle("error", isError);
}

function formatDate(value) {
  if (!value) return "sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  });
}

function formatChartTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function getSampleTime(value) {
  const time = value ? new Date(value).getTime() : Date.now();
  return Number.isFinite(time) ? time : Date.now();
}

function parseFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseStoredCount(value) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function roundTo(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function loadSmartState() {
  const emptyState = {
    enabled: false,
    smartDown: null,
    smartUp: null,
    diffDown: null,
    diffUp: null,
    trendCPerSecond: null,
    tauSeconds: null,
    hotCycles: 0,
    coldCycles: 0,
    hotTracking: false,
    coldTracking: false,
    hotPeak: null,
    coldValley: null,
    hotLastPeak: null,
    coldLastValley: null,
    lastTemperature: null,
    lastTimestamp: null
  };

  try {
    const stored = localStorage.getItem(SMART_CONTROL_KEY);
    const legacyStored = localStorage.getItem(LEGACY_SMART_CONTROL_KEY);
    const parsed = JSON.parse(stored || legacyStored || "{}");
    const isLegacy = !stored && Boolean(legacyStored);
    return {
      enabled: Boolean(parsed.enabled),
      smartDown: parseFiniteNumber(parsed.smartDown),
      smartUp: parseFiniteNumber(parsed.smartUp),
      diffDown: isLegacy ? null : parseFiniteNumber(parsed.diffDown),
      diffUp: isLegacy ? null : parseFiniteNumber(parsed.diffUp),
      trendCPerSecond: parseFiniteNumber(parsed.trendCPerSecond),
      tauSeconds: parseFiniteNumber(parsed.tauSeconds),
      hotCycles: isLegacy ? 0 : parseStoredCount(parsed.hotCycles),
      coldCycles: isLegacy ? 0 : parseStoredCount(parsed.coldCycles),
      hotTracking: false,
      coldTracking: false,
      hotPeak: null,
      coldValley: null,
      hotLastPeak: isLegacy ? null : parseFiniteNumber(parsed.hotLastPeak),
      coldLastValley: isLegacy ? null : parseFiniteNumber(parsed.coldLastValley),
      lastTemperature: null,
      lastTimestamp: null
    };
  } catch {
    return emptyState;
  }
}

function saveSmartState() {
  localStorage.setItem(SMART_CONTROL_KEY, JSON.stringify({
    enabled: smartState.enabled,
    smartDown: smartState.smartDown,
    smartUp: smartState.smartUp,
    diffDown: smartState.diffDown,
    diffUp: smartState.diffUp,
    trendCPerSecond: smartState.trendCPerSecond,
    tauSeconds: smartState.tauSeconds,
    hotCycles: smartState.hotCycles || 0,
    coldCycles: smartState.coldCycles || 0,
    hotLastPeak: smartState.hotLastPeak,
    coldLastValley: smartState.coldLastValley
  }));
}
