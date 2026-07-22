const TOKEN_KEY = "shadowing_factory_token";
const SMART_CONTROL_KEY = "shadowing_factory_pid_control_v1";
const LEGACY_SMART_CONTROL_KEYS = [
  "shadowing_factory_time_control_v1",
  "shadowing_factory_smart_control_v8",
  "shadowing_factory_smart_control_v7",
  "shadowing_factory_smart_control_v6",
  "shadowing_factory_smart_control_v5",
  "shadowing_factory_smart_control_v4",
  "shadowing_factory_smart_control_v3",
  "shadowing_factory_smart_control_v2",
  "shadowing_factory_smart_control_v1"
];
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const MAX_CHART_SAMPLES = 300;
const TREND_WINDOW_MS = 120000;
const PHASE_REGRESSION_WINDOW_MS = 180000;
const REVERSAL_WINDOW_MS = 55000;
const DEAD_TREND = 0.003;
const REVERSAL_MIN_SECONDS = 8;
const REVERSAL_MIN_SAMPLES = 5;
const SMOOTHING_GAIN = 0.25;
const SMART_MIN_GAP_RATIO = 0.12;
const SMART_RATE_GAIN = 0.25;
const FORCE_SETPOINT_OFFSET = 0.8;
const MAX_REVERSAL_EVENTS = 80;
const PID_WINDOW_SECONDS = 60;
const PID_MIN_SWITCH_SECONDS = 8;
const PID_FILTER_GAIN = 0.22;
const PID_KP = 0.95;
const PID_KI = 0.006;
const PID_KD = 0.18;

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
let reversalEvents = [];
let manualRelayOn = null;

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
  if (smartState.enabled) {
    syncSmartTargetsFromInputs();
    resetSmartLearning();
  }
  saveSmartState();
  renderSmartControls(latestConfig);
  scheduleSettingsSave();
});

[
  elements.smartDownInput,
  elements.smartUpInput
].forEach((input) => {
  input.addEventListener("input", () => {
    const oldDown = smartState.smartDown;
    const oldUp = smartState.smartUp;
    syncSmartTargetsFromInputs();
    if (Math.abs((smartState.smartDown || 0) - (oldDown || 0)) > 0.01 ||
        Math.abs((smartState.smartUp || 0) - (oldUp || 0)) > 0.01) {
      resetSmartLearning();
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
  let relayForSample = inferManualRelay(latestTemperature, remoteConfig, data);

  if (smartState.enabled) {
    renderConfig = updateSmartControl(latestTemperature, latestTemperatureUpdatedAt, remoteConfig, data);
    if (renderConfig) {
      relayForSample = smartState.phase === "heating";
      setInputValue(elements.pointDownInput, renderConfig.pointDown, true);
      setInputValue(elements.pointUpInput, renderConfig.pointUp, true);
      maybeScheduleSmartSave(remoteConfig, renderConfig);
    } else {
      renderConfig = remoteConfig;
    }
  } else {
    setInputValue(elements.pointDownInput, remoteConfig.pointDown, forceInputs);
    setInputValue(elements.pointUpInput, remoteConfig.pointUp, forceInputs);
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

  const pointDown = smartState.enabled && Number.isFinite(smartState.smartDown)
    ? Number(smartState.smartDown)
    : Number(config.pointDown);
  const pointUp = smartState.enabled && Number.isFinite(smartState.smartUp)
    ? Number(smartState.smartUp)
    : Number(config.pointUp);
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
    ensureSmartDefaults({ tempoLeitura }, false);
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
    resetSmartLearning();
    saveSmartState();
  }

  if (Number.isFinite(smartState.smartDown) && Number.isFinite(smartState.smartUp)) {
    if (!Number.isFinite(smartState.pidIntegral) || !Number.isFinite(smartState.pidWindowStart)) {
      resetSmartLearning();
      saveSmartState();
    }
  }

  setInputValue(elements.smartDownInput, smartState.smartDown, forceInputs);
  setInputValue(elements.smartUpInput, smartState.smartUp, forceInputs);
}

function syncSmartTargetsFromInputs() {
  const inputDown = Number(elements.smartDownInput.value);
  const inputUp = Number(elements.smartUpInput.value);
  if (Number.isFinite(inputDown)) smartState.smartDown = inputDown;
  if (Number.isFinite(inputUp)) smartState.smartUp = inputUp;
  const fallbackDown = Number(elements.pointDownInput.value);
  const fallbackUp = Number(elements.pointUpInput.value);
  if (!Number.isFinite(smartState.smartDown) && Number.isFinite(fallbackDown)) {
    smartState.smartDown = fallbackDown;
  }
  if (!Number.isFinite(smartState.smartUp) && Number.isFinite(fallbackUp)) {
    smartState.smartUp = fallbackUp;
  }
}

function resetSmartLearning() {
  const limits = getSmartLimits();
  if (!limits) return;
  const now = Date.now();
  smartState.pidIntegral = 0;
  smartState.pidLastError = null;
  smartState.pidLastTime = null;
  smartState.pidOutput = 0;
  smartState.dutyCycle = 0;
  smartState.pidWindowStart = now;
  smartState.lastRelaySwitchAt = now;
  smartState.forcedRelayOn = null;
  smartState.filteredTemperature = null;
  smartState.modeReason = "iniciando PID";
  smartState.heatingRate = null;
  smartState.coolingRate = null;
  smartState.upperDelay = estimateInitialDelay();
  smartState.lowerDelay = estimateInitialDelay();
  smartState.phase = null;
  smartState.lastTemperature = null;
  smartState.lastTimestamp = null;
  smartState.smoothTemperature = null;
  smartState.relayChangedAt = null;
  smartState.lastTrendSign = null;
  smartState.lastReversalAt = null;
  smartState.upperCycle = null;
  smartState.lowerCycle = null;
  smartState.lastUpperError = null;
  smartState.lastLowerError = null;
}

function updateSmartControl(temperature, updatedAt, remoteConfig, data) {
  if (!Number.isFinite(temperature)) return computeSmartConfig(temperature, remoteConfig);
  const timeMs = getSampleTime(updatedAt);
  updateTrendAndRates(temperature, timeMs);

  updatePidRelayState(temperature, timeMs);

  const configAfter = computeSmartConfig(temperature, remoteConfig);
  saveSmartState();
  return configAfter;
}

function updatePidRelayState(temperature, timeMs) {
  const limits = getSmartLimits();
  if (!limits) return;

  const filtered = Number.isFinite(smartState.filteredTemperature)
    ? smartState.filteredTemperature * (1 - PID_FILTER_GAIN) + temperature * PID_FILTER_GAIN
    : temperature;
  smartState.filteredTemperature = filtered;

  if (!Number.isFinite(smartState.pidWindowStart)) smartState.pidWindowStart = timeMs;
  if (!Number.isFinite(smartState.lastRelaySwitchAt)) smartState.lastRelaySwitchAt = timeMs;

  if (temperature >= smartState.smartUp) {
    setPidRelay(false, timeMs, "trava alta");
    smartState.pidIntegral = Math.min(smartState.pidIntegral || 0, 0);
    smartState.pidOutput = 0;
    smartState.dutyCycle = 0;
    smartState.pidWindowStart = timeMs;
    return;
  }
  if (temperature <= smartState.smartDown) {
    setPidRelay(true, timeMs, "trava baixa");
    smartState.pidIntegral = Math.max(smartState.pidIntegral || 0, 0);
    smartState.pidOutput = 1;
    smartState.dutyCycle = 1;
    smartState.pidWindowStart = timeMs;
    return;
  }

  const target = getSmartCenter();
  const error = target - filtered;
  const dt = Number.isFinite(smartState.pidLastTime)
    ? Math.max((timeMs - smartState.pidLastTime) / 1000, 0.25)
    : getReadingInterval();
  const derivative = Number.isFinite(smartState.pidLastError)
    ? (error - smartState.pidLastError) / dt
    : 0;
  const maxIntegral = limits.span * PID_WINDOW_SECONDS * 2;
  smartState.pidIntegral = clamp((smartState.pidIntegral || 0) + error * dt, -maxIntegral, maxIntegral);
  smartState.pidLastError = error;
  smartState.pidLastTime = timeMs;

  const normalized = (
    PID_KP * error +
    PID_KI * smartState.pidIntegral +
    PID_KD * derivative * PID_WINDOW_SECONDS
  ) / Math.max(limits.span, 0.1);
  const output = clamp(0.5 + normalized, 0, 1);
  smartState.pidOutput = output;
  smartState.dutyCycle = output;

  let elapsed = (timeMs - smartState.pidWindowStart) / 1000;
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed >= PID_WINDOW_SECONDS) {
    smartState.pidWindowStart = timeMs;
    elapsed = 0;
  }

  const desiredRelayOn = elapsed < output * PID_WINDOW_SECONDS;
  const canSwitch = (timeMs - smartState.lastRelaySwitchAt) / 1000 >= PID_MIN_SWITCH_SECONDS;
  if (smartState.forcedRelayOn === null || desiredRelayOn === smartState.forcedRelayOn || canSwitch) {
    setPidRelay(desiredRelayOn, timeMs, "PID por janela");
  }
}

function setPidRelay(relayOn, timeMs, reason) {
  const next = Boolean(relayOn);
  if (smartState.forcedRelayOn !== next) {
    smartState.lastRelaySwitchAt = timeMs;
  }
  smartState.forcedRelayOn = next;
  smartState.phase = next ? "heating" : "cooling";
  smartState.modeReason = reason;
  smartState.relayChangedAt = timeMs;
}

function updateTrendAndRates(temperature, timeMs) {
  smartState.smoothTemperature = smoothValue(smartState.smoothTemperature, temperature, SMOOTHING_GAIN);
  if (Number.isFinite(smartState.lastTemperature) && Number.isFinite(smartState.lastTimestamp)) {
    const dt = Math.max((timeMs - smartState.lastTimestamp) / 1000, 0.25);
    const currentSmooth = Number.isFinite(smartState.smoothTemperature) ? smartState.smoothTemperature : temperature;
    const instantTrend = (currentSmooth - smartState.lastTemperature) / dt;
    smartState.trend = smoothValue(smartState.trend, instantTrend, 0.28);
    const phaseSlope = computePhaseSlope(smartState.phase);
    detectTrendReversal(temperature, timeMs);
    if (smartState.phase === "heating" && phaseSlope > DEAD_TREND) {
      smartState.heatingRate = smoothValue(smartState.heatingRate, phaseSlope, SMART_RATE_GAIN);
    }
    if (smartState.phase === "cooling" && phaseSlope < -DEAD_TREND) {
      smartState.coolingRate = smoothValue(smartState.coolingRate, Math.abs(phaseSlope), SMART_RATE_GAIN);
    }
  }
  smartState.lastTemperature = Number.isFinite(smartState.smoothTemperature) ? smartState.smoothTemperature : temperature;
  smartState.lastTimestamp = timeMs;
}

function computeSmartConfig(temperature, fallbackConfig = {}) {
  const limits = getSmartLimits();
  if (!limits) {
    setStatus("No modo inteligente, o alvo baixo precisa ser menor que o alvo alto.", true);
    return null;
  }

  const phase = smartState.phase || (Number.isFinite(temperature) && temperature <= getSmartCenter() ? "heating" : "cooling");
  const minGap = limits.minGap;
  let pointDown;
  let pointUp;

  if (smartState.forcedRelayOn !== false && phase === "heating") {
    pointDown = smartState.smartUp + FORCE_SETPOINT_OFFSET;
    pointUp = pointDown + minGap;
  } else {
    pointUp = smartState.smartDown - FORCE_SETPOINT_OFFSET;
    pointDown = pointUp - minGap;
  }

  return {
    tempoLeitura: fallbackConfig.tempoLeitura,
    pointDown: roundTo(pointDown, 1),
    pointUp: roundTo(pointUp, 1)
  };
}

function detectTrendReversal(temperature, timeMs) {
  const trend = computeRecentSlope(REVERSAL_WINDOW_MS);
  if (trend.sampleCount < REVERSAL_MIN_SAMPLES || Math.abs(trend.slope) < DEAD_TREND) return;

  const nextSign = trend.slope > 0 ? 1 : -1;
  const lastSign = smartState.lastTrendSign;
  const canMark = !Number.isFinite(smartState.lastReversalAt) ||
    (timeMs - smartState.lastReversalAt) / 1000 >= REVERSAL_MIN_SECONDS;
  if (lastSign !== null && lastSign !== nextSign && canMark) {
    addReversalEvent(timeMs, temperature, nextSign > 0 ? "lower" : "upper");
    smartState.lastReversalAt = timeMs;
  }
  smartState.lastTrendSign = nextSign;
}

function addReversalEvent(time, temperature, type) {
  if (!Number.isFinite(time) || !Number.isFinite(temperature)) return;
  reversalEvents.push({ time, temperature, type });
  if (reversalEvents.length > MAX_REVERSAL_EVENTS) {
    reversalEvents = reversalEvents.slice(-MAX_REVERSAL_EVENTS);
  }
}

function getSmartLimits() {
  if (!Number.isFinite(smartState.smartDown) ||
      !Number.isFinite(smartState.smartUp) ||
      smartState.smartDown >= smartState.smartUp) {
    return null;
  }
  const span = smartState.smartUp - smartState.smartDown;
  return {
    span,
    minGap: Math.max(0.4, span * SMART_MIN_GAP_RATIO)
  };
}

function getSmartBounds(limits = getSmartLimits()) {
  const span = limits ? limits.span : 1;
  return {
    low: smartState.smartDown - span,
    high: smartState.smartUp + span
  };
}

function getSmartCenter() {
  if (!Number.isFinite(smartState.smartDown) || !Number.isFinite(smartState.smartUp)) return 0;
  return (smartState.smartDown + smartState.smartUp) / 2;
}

function estimateInitialDelay(config = {}) {
  return clamp(getReadingInterval(config) * 6, 10, 90);
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

  const phase = smartState.phase || "heating";
  const pointDown = Number.isFinite(config.pointDown) ? `${Number(config.pointDown).toFixed(1)} C` : "--";
  const pointUp = Number.isFinite(config.pointUp) ? `${Number(config.pointUp).toFixed(1)} C` : "--";
  const target = getSmartCenter();
  const filtered = Number.isFinite(smartState.filteredTemperature) ? smartState.filteredTemperature : latestTemperature;
  const error = Number.isFinite(filtered) ? target - filtered : null;
  const duty = Number.isFinite(smartState.dutyCycle) ? smartState.dutyCycle * 100 : null;
  elements.smartStatus.textContent =
    `PID ${phase === "heating" ? "ligado" : "desligado"} (${smartState.modeReason || "janela"}). ` +
    `point_down ${pointDown}, point_up ${pointUp}. ` +
    `smart ${formatNumber(smartState.smartDown)}-${formatNumber(smartState.smartUp)} C, ` +
    `duty ${formatNumber(duty)}%, erro ${formatNumber(error)} C, integral ${formatNumber(smartState.pidIntegral)}.`;
}

function pushTemperatureSample(temperature, updatedAt, relayOn) {
  if (!Number.isFinite(temperature)) return;
  const time = getSampleTime(updatedAt);
  const last = temperatureSamples[temperatureSamples.length - 1];
  if (last && last.time === time && last.temperature === temperature) return;
  const previousSmooth = last && Number.isFinite(last.smoothTemperature)
    ? last.smoothTemperature
    : temperature;
  const smoothTemperature = previousSmooth * (1 - SMOOTHING_GAIN) + temperature * SMOOTHING_GAIN;
  temperatureSamples.push({
    time,
    temperature,
    smoothTemperature,
    relayOn,
    phase: smartState.enabled ? smartState.phase : null
  });
  if (temperatureSamples.length > MAX_CHART_SAMPLES) {
    temperatureSamples = temperatureSamples.slice(-MAX_CHART_SAMPLES);
  }
}

function computeSampleTrend() {
  return computeRecentSlope(TREND_WINDOW_MS).slope;
}

function computePhaseSlope(phase) {
  if (!phase || temperatureSamples.length < 3) return smartState.trend || 0;
  const newest = temperatureSamples[temperatureSamples.length - 1].time;
  const samples = temperatureSamples.filter((sample) =>
    sample.phase === phase &&
    newest - sample.time <= PHASE_REGRESSION_WINDOW_MS
  );
  return linearRegressionSlope(samples).slope;
}

function computeRecentSlope(windowMs) {
  if (temperatureSamples.length < 3) {
    return { slope: smartState.trend || 0, sampleCount: temperatureSamples.length };
  }
  const newest = temperatureSamples[temperatureSamples.length - 1].time;
  const samples = temperatureSamples.filter((sample) => newest - sample.time <= windowMs);
  return linearRegressionSlope(samples);
}

function linearRegressionSlope(samples) {
  if (samples.length < 3) {
    return { slope: smartState.trend || 0, sampleCount: samples.length };
  }
  const firstTime = samples[0].time;
  const xs = samples.map((sample) => (sample.time - firstTime) / 1000);
  const ys = samples.map((sample) =>
    Number.isFinite(sample.smoothTemperature) ? sample.smoothTemperature : sample.temperature
  );
  const avgX = average(xs);
  const avgY = average(ys);
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < samples.length; index += 1) {
    numerator += (xs[index] - avgX) * (ys[index] - avgY);
    denominator += (xs[index] - avgX) ** 2;
  }
  return {
    slope: denominator > 0 ? numerator / denominator : smartState.trend || 0,
    sampleCount: samples.length
  };
}

function inferManualRelay(temperature, config, data) {
  const remoteRelay = readRemoteRelayState(data);
  if (remoteRelay !== null) {
    manualRelayOn = remoteRelay;
    return remoteRelay;
  }
  if (!Number.isFinite(temperature)) return manualRelayOn;
  if (Number.isFinite(config.pointDown) && temperature <= config.pointDown) manualRelayOn = true;
  if (Number.isFinite(config.pointUp) && temperature >= config.pointUp) manualRelayOn = false;
  return manualRelayOn;
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
  reversalEvents.forEach((event) => {
    if (Number.isFinite(event.temperature)) values.push(event.temperature);
  });
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
    ${buildTemperaturePaths(temperatureSamples, xScale, yScale)}
    ${buildReversalDots(xScale, yScale, timeMin, timeMax)}
    ${temperatureSamples.length === 1 ? `<circle class="temperature-dot ${getRelayClass(temperatureSamples[0].relayOn)}" cx="${xScale(temperatureSamples[0].time)}" cy="${yScale(temperatureSamples[0].temperature)}" r="4"></circle>` : ""}
  `;
}

function buildReversalDots(xScale, yScale, timeMin, timeMax) {
  return reversalEvents
    .filter((event) => event.time >= timeMin && event.time <= timeMax)
    .map((event) =>
      `<circle class="reversal-dot ${event.type}" cx="${xScale(event.time).toFixed(2)}" cy="${yScale(event.temperature).toFixed(2)}" r="4.5"></circle>`
    )
    .join("");
}

function buildTemperaturePaths(samples, xScale, yScale) {
  const segments = [];
  let current = null;
  samples.forEach((sample, index) => {
    const relayClass = getRelayClass(sample.relayOn);
    if (!current || current.relayClass !== relayClass) {
      if (current && current.points.length > 1) segments.push(current);
      current = {
        relayClass,
        points: index > 0 ? [samples[index - 1], sample] : [sample]
      };
      return;
    }
    current.points.push(sample);
  });
  if (current) segments.push(current);

  return segments.map((segment) => {
    const path = segment.points
      .map((sample, index) => `${index === 0 ? "M" : "L"} ${xScale(sample.time).toFixed(2)} ${yScale(sample.temperature).toFixed(2)}`)
      .join(" ");
    return `<path class="temperature-path ${segment.relayClass}" d="${path}"></path>`;
  }).join("");
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

function formatNumber(value) {
  if (!Number.isFinite(value)) return "--";
  return Number(value).toFixed(2);
}

function getSampleTime(value) {
  const time = value ? new Date(value).getTime() : Date.now();
  return Number.isFinite(time) ? time : Date.now();
}

function parseFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseStoredNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function loadSmartState() {
  const emptyState = {
    enabled: false,
    smartDown: null,
    smartUp: null,
    phase: null,
    pidIntegral: null,
    pidLastError: null,
    pidLastTime: null,
    pidOutput: null,
    dutyCycle: null,
    pidWindowStart: null,
    lastRelaySwitchAt: null,
    forcedRelayOn: null,
    filteredTemperature: null,
    modeReason: null,
    upperCoast: null,
    lowerCoast: null,
    upperDelay: null,
    lowerDelay: null,
    heatingRate: null,
    coolingRate: null,
    trend: null,
    lastTemperature: null,
    lastTimestamp: null,
    relayChangedAt: null,
    upperCycle: null,
    lowerCycle: null,
    lastUpperError: null,
    lastLowerError: null
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
      smartDown: parseFiniteNumber(parsed.smartDown ?? parsed.targetDown),
      smartUp: parseFiniteNumber(parsed.smartUp ?? parsed.targetUp),
      phase: normalizePhase(parsed.phase),
      pidIntegral: isLegacy ? null : parseStoredNumber(parsed.pidIntegral),
      pidLastError: isLegacy ? null : parseStoredNumber(parsed.pidLastError),
      pidLastTime: isLegacy ? null : parseStoredNumber(parsed.pidLastTime),
      pidOutput: isLegacy ? null : parseStoredNumber(parsed.pidOutput),
      dutyCycle: isLegacy ? null : parseStoredNumber(parsed.dutyCycle),
      pidWindowStart: isLegacy ? null : parseStoredNumber(parsed.pidWindowStart),
      lastRelaySwitchAt: isLegacy ? null : parseStoredNumber(parsed.lastRelaySwitchAt),
      forcedRelayOn: isLegacy ? null : normalizeRelayValue(parsed.forcedRelayOn),
      filteredTemperature: isLegacy ? null : parseStoredNumber(parsed.filteredTemperature),
      modeReason: isLegacy || typeof parsed.modeReason !== "string" ? null : parsed.modeReason,
      upperCoast: isLegacy ? null : parseStoredNumber(parsed.upperCoast),
      lowerCoast: isLegacy ? null : parseStoredNumber(parsed.lowerCoast),
      upperDelay: isLegacy ? null : parseStoredNumber(parsed.upperDelay),
      lowerDelay: isLegacy ? null : parseStoredNumber(parsed.lowerDelay),
      heatingRate: isLegacy ? null : parseStoredNumber(parsed.heatingRate),
      coolingRate: isLegacy ? null : parseStoredNumber(parsed.coolingRate),
      trend: null,
      lastTemperature: null,
      lastTimestamp: null,
      relayChangedAt: null,
      upperCycle: null,
      lowerCycle: null,
      lastUpperError: isLegacy ? null : parseStoredNumber(parsed.lastUpperError),
      lastLowerError: isLegacy ? null : parseStoredNumber(parsed.lastLowerError)
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
    phase: smartState.phase,
    pidIntegral: smartState.pidIntegral,
    pidLastError: smartState.pidLastError,
    pidLastTime: smartState.pidLastTime,
    pidOutput: smartState.pidOutput,
    dutyCycle: smartState.dutyCycle,
    pidWindowStart: smartState.pidWindowStart,
    lastRelaySwitchAt: smartState.lastRelaySwitchAt,
    forcedRelayOn: smartState.forcedRelayOn,
    filteredTemperature: smartState.filteredTemperature,
    modeReason: smartState.modeReason,
    upperCoast: smartState.upperCoast,
    lowerCoast: smartState.lowerCoast,
    upperDelay: smartState.upperDelay,
    lowerDelay: smartState.lowerDelay,
    heatingRate: smartState.heatingRate,
    coolingRate: smartState.coolingRate,
    lastUpperError: smartState.lastUpperError,
    lastLowerError: smartState.lastLowerError
  }));
}

function normalizePhase(value) {
  if (value === "heating" || value === "cooling") return value;
  return null;
}
