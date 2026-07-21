const TOKEN_KEY = "shadowing_factory_token";
const SMART_CONTROL_KEY = "shadowing_factory_smart_control_v4";
const LEGACY_SMART_CONTROL_KEYS = [
  "shadowing_factory_smart_control_v3",
  "shadowing_factory_smart_control_v2",
  "shadowing_factory_smart_control_v1"
];
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
const SMART_DELAY_GAIN = 0.25;
const SMART_FLOAT_SPAN_RATIO = 1;

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

  let renderConfig = remoteConfig;
  let relayForSample = null;
  if (smartState.enabled) {
    relayForSample = learnSmartControl(latestTemperature, latestTemperatureUpdatedAt, remoteConfig, data);
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
    relayForSample = updateRelayObservation(
      latestTemperature,
      getSampleTime(latestTemperatureUpdatedAt),
      remoteConfig,
      data,
      false
    );
  }

  pushTemperatureSample(latestTemperature, latestTemperatureUpdatedAt, relayForSample);
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
  if (hasSmartTargets) {
    ensureSmartProfiles();
    if (!Number.isFinite(smartState.heatDelaySeconds)) smartState.heatDelaySeconds = estimateInitialDelay(config);
    if (!Number.isFinite(smartState.coolDelaySeconds)) smartState.coolDelaySeconds = estimateInitialDelay(config);
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
  setConservativeSmartProfiles(limits);
  smartState.tauSeconds = estimateInitialTau();
  smartState.hotCycles = 0;
  smartState.coldCycles = 0;
  smartState.hotTracking = false;
  smartState.coldTracking = false;
  smartState.hotPeak = null;
  smartState.coldValley = null;
  smartState.hotLastPeak = null;
  smartState.coldLastValley = null;
  smartState.relayOn = null;
  smartState.relayChangedAt = null;
  smartState.relayOnSeconds = 0;
  smartState.relayOffSeconds = 0;
  smartState.pendingHeatSince = null;
  smartState.pendingCoolSince = null;
  smartState.heatDelaySeconds = estimateInitialDelay();
  smartState.coolDelaySeconds = estimateInitialDelay();
  smartState.heatRateCPerSecond = null;
  smartState.coolRateCPerSecond = null;
}

function ensureSmartProfiles() {
  const limits = getSmartLimits();
  if (!limits) return;
  if (!Number.isFinite(smartState.heatCutoffPoint) || !Number.isFinite(smartState.coolCutinPoint)) {
    setConservativeSmartProfiles(limits);
  }
  clampSmartProfiles(limits);
}

function setConservativeSmartProfiles(limits) {
  const center = (smartState.smartDown + smartState.smartUp) / 2;
  smartState.coolCutinPoint = center - limits.minGap / 2;
  smartState.heatCutoffPoint = center + limits.minGap / 2;
}

function clampSmartProfiles(limits = getSmartLimits()) {
  if (!limits) return;
  const bounds = getSmartFloatBounds(limits);
  smartState.coolCutinPoint = clamp(smartState.coolCutinPoint, bounds.low, bounds.high);
  smartState.heatCutoffPoint = clamp(smartState.heatCutoffPoint, bounds.low, bounds.high);
}

function learnSmartControl(temperature, updatedAt, config, data) {
  if (!Number.isFinite(temperature)) return null;
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
  if (!limits) return null;
  const controlConfig = computeSmartConfig(temperature, config, { silent: true });
  const pointDown = controlConfig ? controlConfig.pointDown : smartState.smartDown + smartState.diffDown;
  const pointUp = controlConfig ? controlConfig.pointUp : smartState.smartUp - smartState.diffUp;
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  const relayOn = updateRelayObservation(
    temperature,
    timeMs,
    { ...config, pointDown, pointUp },
    data,
    true
  );

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
    smartState.heatCutoffPoint -= overshoot * SMART_ERROR_GAIN + limits.span * 0.03;
    smartState.hotLastPeak = Math.max(smartState.hotLastPeak || temperature, temperature);
    smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) + overshoot * 4, 12, 420);
  }

  if (temperature < smartState.smartDown) {
    const undershoot = smartState.smartDown - temperature;
    smartState.coolCutinPoint += undershoot * SMART_ERROR_GAIN + limits.span * 0.03;
    smartState.coldLastValley = Math.min(smartState.coldLastValley || temperature, temperature);
    smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) + undershoot * 4, 12, 420);
  }

  clampSmartProfiles(limits);
  smartState.diffDown = Math.max(0, smartState.coolCutinPoint - smartState.smartDown);
  smartState.diffUp = Math.max(0, smartState.smartUp - smartState.heatCutoffPoint);
  smartState.tauSeconds = clamp((smartState.tauSeconds || estimateInitialTau()) * 0.999, 12, 420);
  saveSmartState();
  return relayOn;
}

function finishHotCycle(peak, limits) {
  smartState.hotTracking = false;
  smartState.hotPeak = null;
  if (!Number.isFinite(peak)) return;

  smartState.hotCycles = (smartState.hotCycles || 0) + 1;
  smartState.hotLastPeak = peak;
  const error = peak - smartState.smartUp;
  if (error > 0) {
    smartState.heatCutoffPoint -= error * SMART_ERROR_GAIN + limits.span * 0.04;
    clampSmartProfiles(limits);
    return;
  }

  if (smartState.hotCycles >= SMART_RELAX_AFTER_CYCLES) {
    const missedTarget = Math.abs(error);
    const maxRelax = limits.span * SMART_MAX_RELAX_RATIO;
    smartState.heatCutoffPoint += Math.min(missedTarget * SMART_RELAX_GAIN, maxRelax);
    clampSmartProfiles(limits);
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
    smartState.coolCutinPoint += error * SMART_ERROR_GAIN + limits.span * 0.04;
    clampSmartProfiles(limits);
    return;
  }

  if (smartState.coldCycles >= SMART_RELAX_AFTER_CYCLES) {
    const missedTarget = Math.abs(error);
    const maxRelax = limits.span * SMART_MAX_RELAX_RATIO;
    smartState.coolCutinPoint -= Math.min(missedTarget * SMART_RELAX_GAIN, maxRelax);
    clampSmartProfiles(limits);
  }
}

function updateRelayObservation(temperature, timeMs, config, data, learnDelays) {
  const relayOn = inferRelayState(temperature, config, data);
  if (relayOn === null) return null;

  if (smartState.relayOn !== relayOn || !Number.isFinite(smartState.relayChangedAt)) {
    smartState.relayOn = relayOn;
    smartState.relayChangedAt = timeMs;
    if (relayOn) {
      smartState.pendingHeatSince = timeMs;
      smartState.pendingCoolSince = null;
    } else {
      smartState.pendingCoolSince = timeMs;
      smartState.pendingHeatSince = null;
    }
  }

  const elapsedSeconds = Math.max((timeMs - smartState.relayChangedAt) / 1000, 0);
  smartState.relayOnSeconds = relayOn ? elapsedSeconds : 0;
  smartState.relayOffSeconds = relayOn ? 0 : elapsedSeconds;

  if (learnDelays) {
    learnDelayAndRates(timeMs, relayOn);
  }

  return relayOn;
}

function inferRelayState(temperature, config, data) {
  const remoteRelay = readRemoteRelayState(data);
  if (remoteRelay !== null) return remoteRelay;
  if (!Number.isFinite(temperature)) return smartState.relayOn === null ? null : Boolean(smartState.relayOn);

  const pointDown = Number(config.pointDown);
  const pointUp = Number(config.pointUp);
  if (Number.isFinite(pointDown) && temperature <= pointDown) return true;
  if (Number.isFinite(pointUp) && temperature >= pointUp) return false;
  if (smartState.relayOn !== null) return Boolean(smartState.relayOn);
  return false;
}

function readRemoteRelayState(data) {
  if (!data || typeof data !== "object") return null;
  const candidates = [
    data.relayOn,
    data.releLigado,
    data.resistenciaLigada,
    data.heaterOn,
    data.relay,
    data.rele,
    data.resistencia,
    data.outputOn,
    data.status && data.status.relayOn,
    data.status && data.status.releLigado,
    data.status && data.status.resistenciaLigada,
    data.state && data.state.relayOn,
    data.state && data.state.releLigado,
    data.state && data.state.resistenciaLigada
  ];
  for (const value of candidates) {
    const normalized = normalizeRelayValue(value);
    if (normalized !== null) return normalized;
  }
  return null;
}

function normalizeRelayValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value > 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "on", "true", "ligado", "ligada", "sim"].includes(normalized)) return true;
    if (["0", "off", "false", "desligado", "desligada", "nao", "não"].includes(normalized)) return false;
  }
  return null;
}

function learnDelayAndRates(timeMs, relayOn) {
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  if (relayOn && trend >= SMART_TREND_DEADBAND) {
    if (Number.isFinite(smartState.pendingHeatSince)) {
      const delay = clamp((timeMs - smartState.pendingHeatSince) / 1000, 0, 420);
      smartState.heatDelaySeconds = smoothValue(smartState.heatDelaySeconds, delay, SMART_DELAY_GAIN);
      smartState.pendingHeatSince = null;
    }
    smartState.heatRateCPerSecond = smoothValue(smartState.heatRateCPerSecond, trend, 0.18);
  }

  if (!relayOn && trend <= -SMART_TREND_DEADBAND) {
    if (Number.isFinite(smartState.pendingCoolSince)) {
      const delay = clamp((timeMs - smartState.pendingCoolSince) / 1000, 0, 420);
      smartState.coolDelaySeconds = smoothValue(smartState.coolDelaySeconds, delay, SMART_DELAY_GAIN);
      smartState.pendingCoolSince = null;
    }
    smartState.coolRateCPerSecond = smoothValue(smartState.coolRateCPerSecond, Math.abs(trend), 0.18);
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
  ensureSmartProfiles();

  const projection = Number.isFinite(temperature)
    ? estimateExponentialProjection(fallbackConfig)
    : { rise: 0, drop: 0 };
  const bounds = getSmartFloatBounds(limits);
  const isRelayOn = smartState.relayOn !== false;
  let pointDown;
  let pointUp;

  if (isRelayOn) {
    pointUp = smartState.heatCutoffPoint - projection.rise * SMART_PREDICTION_WEIGHT;
    pointUp = clamp(pointUp, bounds.low + limits.minGap, bounds.high);
    pointDown = Math.min(smartState.coolCutinPoint, pointUp - limits.minGap);
    pointDown = clamp(pointDown, bounds.low, pointUp - limits.minGap);
  } else {
    pointDown = smartState.coolCutinPoint + projection.drop * SMART_PREDICTION_WEIGHT;
    pointDown = clamp(pointDown, bounds.low, bounds.high - limits.minGap);
    pointUp = Math.max(smartState.heatCutoffPoint, pointDown + limits.minGap);
    pointUp = clamp(pointUp, pointDown + limits.minGap, bounds.high);
  }

  if (pointDown >= pointUp) {
    pointDown = clamp(pointUp - limits.minGap, bounds.low, bounds.high - limits.minGap);
    pointUp = clamp(pointDown + limits.minGap, bounds.low + limits.minGap, bounds.high);
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

function getSmartFloatBounds(limits = getSmartLimits()) {
  const span = limits ? limits.span : 1;
  return {
    low: smartState.smartDown - span * SMART_FLOAT_SPAN_RATIO,
    high: smartState.smartUp + span * SMART_FLOAT_SPAN_RATIO
  };
}

function estimateExponentialProjection(config = {}) {
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  const tau = clamp(smartState.tauSeconds || estimateInitialTau(config), 12, 420);
  const interval = getReadingInterval(config);
  const horizon = clamp(interval * 3, 6, 180);
  const baseDelta = trend * tau * (1 - Math.exp(-horizon / tau));
  const timeDelta = estimateRelayTimeDelta(horizon);
  const delta = baseDelta + timeDelta;
  return {
    delta,
    rise: Math.max(0, delta),
    drop: Math.max(0, -delta)
  };
}

function estimateRelayTimeDelta(horizon) {
  if (smartState.relayOn === null) return 0;

  const heatDelay = clamp(smartState.heatDelaySeconds || estimateInitialDelay(), 0, 420);
  const coolDelay = clamp(smartState.coolDelaySeconds || estimateInitialDelay(), 0, 420);
  const heatRate = clamp(smartState.heatRateCPerSecond || Math.max(smartState.trendCPerSecond || 0, 0.018), 0.004, 2);
  const coolRate = clamp(smartState.coolRateCPerSecond || Math.max(-(smartState.trendCPerSecond || 0), 0.012), 0.003, 2);

  if (smartState.relayOn) {
    const onSeconds = clamp(smartState.relayOnSeconds || 0, 0, 3600);
    const activeHeatingSeconds = Math.max(0, horizon - Math.max(heatDelay - onSeconds, 0));
    return heatRate * activeHeatingSeconds * 0.75;
  }

  const offSeconds = clamp(smartState.relayOffSeconds || 0, 0, 3600);
  const remainingStoredHeat = Math.max(coolDelay - offSeconds, 0);
  const delayedRiseSeconds = Math.min(horizon, remainingStoredHeat);
  const coolingSeconds = Math.max(0, horizon - delayedRiseSeconds);
  return heatRate * delayedRiseSeconds * 0.65 - coolRate * coolingSeconds * 0.45;
}

function estimateInitialTau(config = {}) {
  return clamp(getReadingInterval(config) * 8, 24, 240);
}

function estimateInitialDelay(config = {}) {
  return clamp(getReadingInterval(config) * 8, 12, 90);
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
  const pointDown = Number.isFinite(config.pointDown) ? `${Number(config.pointDown).toFixed(1)} C` : "--";
  const pointUp = Number.isFinite(config.pointUp) ? `${Number(config.pointUp).toFixed(1)} C` : "--";
  const trend = Number.isFinite(smartState.trendCPerSecond) ? smartState.trendCPerSecond : 0;
  const hotCycles = smartState.hotCycles || 0;
  const coldCycles = smartState.coldCycles || 0;
  const relayText = smartState.relayOn === null ? "rele --" : `rele ${smartState.relayOn ? "ligado" : "desligado"}`;
  const delayText = `delay aquece/resfria ${formatSeconds(smartState.heatDelaySeconds)} / ${formatSeconds(smartState.coolDelaySeconds)}`;
  const heatCutoff = Number.isFinite(smartState.heatCutoffPoint) ? `${smartState.heatCutoffPoint.toFixed(1)} C` : "--";
  const coolCutin = Number.isFinite(smartState.coolCutinPoint) ? `${smartState.coolCutinPoint.toFixed(1)} C` : "--";
  elements.smartStatus.textContent =
    `point_down ${pointDown}, point_up ${pointUp}. ` +
    `perfil ligado corta em ${heatCutoff}, perfil desligado religa em ${coolCutin}. ` +
    `tendencia ${trend.toFixed(3)} C/s, previsao ${projection.delta.toFixed(2)} C, ` +
    `${relayText}, ${delayText}, ciclos up/down ${hotCycles}/${coldCycles}.`;
}

function pushTemperatureSample(temperature, updatedAt, relayOn) {
  if (!Number.isFinite(temperature)) return;
  const time = getSampleTime(updatedAt);
  const last = temperatureSamples[temperatureSamples.length - 1];
  if (last && last.time === time && last.temperature === temperature) return;
  temperatureSamples.push({ time, temperature, relayOn });
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
  const temperaturePaths = buildTemperaturePaths(temperatureSamples, xScale, yScale);
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
    ${temperaturePaths}
    ${temperatureSamples.length === 1 ? `<circle class="temperature-dot ${getRelayClass(temperatureSamples[0].relayOn)}" cx="${xScale(temperatureSamples[0].time)}" cy="${yScale(temperatureSamples[0].temperature)}" r="4"></circle>` : ""}
  `;
}

function buildTemperaturePaths(samples, xScale, yScale) {
  const segments = [];
  let current = null;

  samples.forEach((sample, index) => {
    const relayClass = getRelayClass(sample.relayOn);
    if (!current || current.relayClass !== relayClass) {
      if (current && current.points.length > 1) segments.push(current);
      const points = index > 0
        ? [samples[index - 1], sample]
        : [sample];
      current = { relayClass, points };
      return;
    }
    current.points.push(sample);
  });

  if (current) segments.push(current);

  return segments
    .map((segment) => {
      const path = segment.points
        .map((sample, index) => `${index === 0 ? "M" : "L"} ${xScale(sample.time).toFixed(2)} ${yScale(sample.temperature).toFixed(2)}`)
        .join(" ");
      return `<path class="temperature-path ${segment.relayClass}" d="${path}"></path>`;
    })
    .join("");
}

function getRelayClass(relayOn) {
  if (relayOn === true) return "relay-on";
  if (relayOn === false) return "relay-off";
  return "relay-unknown";
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

function formatSeconds(value) {
  if (!Number.isFinite(value)) return "--s";
  return `${Math.round(value)}s`;
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

function smoothValue(current, next, gain) {
  if (!Number.isFinite(next)) return current;
  if (!Number.isFinite(current)) return next;
  return current * (1 - gain) + next * gain;
}

function loadSmartState() {
  const emptyState = {
    enabled: false,
    smartDown: null,
    smartUp: null,
    diffDown: null,
    diffUp: null,
    heatCutoffPoint: null,
    coolCutinPoint: null,
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
    relayOn: null,
    relayChangedAt: null,
    relayOnSeconds: 0,
    relayOffSeconds: 0,
    pendingHeatSince: null,
    pendingCoolSince: null,
    heatDelaySeconds: null,
    coolDelaySeconds: null,
    heatRateCPerSecond: null,
    coolRateCPerSecond: null,
    lastTemperature: null,
    lastTimestamp: null
  };

  try {
    const stored = localStorage.getItem(SMART_CONTROL_KEY);
    const legacyStored = LEGACY_SMART_CONTROL_KEYS
      .map((key) => localStorage.getItem(key))
      .find((value) => Boolean(value));
    const parsed = JSON.parse(stored || legacyStored || "{}");
    const isLegacy = !stored && Boolean(legacyStored);
    return {
      enabled: Boolean(parsed.enabled),
      smartDown: parseFiniteNumber(parsed.smartDown),
      smartUp: parseFiniteNumber(parsed.smartUp),
      diffDown: isLegacy ? null : parseFiniteNumber(parsed.diffDown),
      diffUp: isLegacy ? null : parseFiniteNumber(parsed.diffUp),
      heatCutoffPoint: isLegacy ? null : parseFiniteNumber(parsed.heatCutoffPoint),
      coolCutinPoint: isLegacy ? null : parseFiniteNumber(parsed.coolCutinPoint),
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
      relayOn: normalizeRelayValue(parsed.relayOn),
      relayChangedAt: null,
      relayOnSeconds: 0,
      relayOffSeconds: 0,
      pendingHeatSince: null,
      pendingCoolSince: null,
      heatDelaySeconds: isLegacy ? null : parseFiniteNumber(parsed.heatDelaySeconds),
      coolDelaySeconds: isLegacy ? null : parseFiniteNumber(parsed.coolDelaySeconds),
      heatRateCPerSecond: isLegacy ? null : parseFiniteNumber(parsed.heatRateCPerSecond),
      coolRateCPerSecond: isLegacy ? null : parseFiniteNumber(parsed.coolRateCPerSecond),
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
    heatCutoffPoint: smartState.heatCutoffPoint,
    coolCutinPoint: smartState.coolCutinPoint,
    trendCPerSecond: smartState.trendCPerSecond,
    tauSeconds: smartState.tauSeconds,
    hotCycles: smartState.hotCycles || 0,
    coldCycles: smartState.coldCycles || 0,
    hotLastPeak: smartState.hotLastPeak,
    coldLastValley: smartState.coldLastValley,
    relayOn: smartState.relayOn,
    heatDelaySeconds: smartState.heatDelaySeconds,
    coolDelaySeconds: smartState.coolDelaySeconds,
    heatRateCPerSecond: smartState.heatRateCPerSecond,
    coolRateCPerSecond: smartState.coolRateCPerSecond
  }));
}
