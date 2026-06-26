const TOKEN_KEY = "shadowing_factory_token";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

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
  pointUpInput: document.getElementById("pointUpInput")
};

let pollingTimer = null;
let saveTimer = null;
let isSaving = false;

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

boot();

async function boot() {
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
  const config = data.config || {};
  setInputValue(elements.tempoLeituraInput, config.tempoLeitura, forceInputs);
  setInputValue(elements.pointDownInput, config.pointDown, forceInputs);
  setInputValue(elements.pointUpInput, config.pointUp, forceInputs);
  renderTemperature(data.temperature, data.temperatureUpdatedAt, config);
}

function setInputValue(input, value, force) {
  if (value === undefined || value === null) return;
  if (!force && document.activeElement === input) return;
  input.value = String(value);
}

function renderTemperature(value, updatedAt, config) {
  const temperature = Number(value);
  const hasTemperature = Number.isFinite(temperature);
  elements.temperatureValue.textContent = hasTemperature ? temperature.toFixed(1) : "--.-";
  elements.lastReading.textContent = hasTemperature
    ? `Ultima leitura: ${formatDate(updatedAt)}`
    : "Nenhuma leitura recebida ainda.";

  const pointDown = Number(config.pointDown);
  const pointUp = Number(config.pointUp);
  elements.rangeBadge.className = "range-badge";

  if (!hasTemperature) {
    elements.rangeLabel.textContent = "Aguardando leitura";
    elements.rangeBadge.textContent = "sem dados";
    elements.rangeBadge.classList.add("range-waiting");
    return;
  }
  if (temperature < pointDown) {
    elements.rangeLabel.textContent = "Abaixo do limite";
    elements.rangeBadge.textContent = "frio";
    elements.rangeBadge.classList.add("range-cold");
    return;
  }
  if (temperature > pointUp) {
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
  const pointDown = Number(elements.pointDownInput.value);
  const pointUp = Number(elements.pointUpInput.value);

  if (!Number.isFinite(tempoLeitura) || tempoLeitura < 1) {
    setStatus("Tempo de leitura precisa ser pelo menos 1 segundo.", true);
    return null;
  }
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
