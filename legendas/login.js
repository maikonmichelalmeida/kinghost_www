const USER_TOKEN_KEY = "shadowing_user_token";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const elements = {
  form: document.getElementById("loginForm"),
  nickInput: document.getElementById("nickInput"),
  passwordInput: document.getElementById("passwordInput"),
  togglePasswordButton: document.getElementById("togglePasswordButton"),
  submitButton: document.getElementById("submitButton"),
  status: document.getElementById("loginStatus")
};

window.lucide?.createIcons();
elements.form.addEventListener("submit", handleLogin);
elements.togglePasswordButton.addEventListener("click", togglePasswordVisibility);
boot();

async function boot() {
  if (location.protocol === "file:") {
    setStatus("Abra pelo arquivo iniciar-local.bat para usar o login local.", true);
    setFormEnabled(false);
    return;
  }

  const token = getToken();
  if (token) {
    try {
      setStatus("Validando sessao...");
      await requestJson("/api/user/session", { token });
      redirectToApp();
      return;
    } catch {
      localStorage.removeItem(USER_TOKEN_KEY);
    }
  }

  setStatus("");
  elements.nickInput.focus();
}

async function handleLogin(event) {
  event.preventDefault();
  const nick = elements.nickInput.value.trim();
  const password = elements.passwordInput.value;
  if (!nick || !password) {
    setStatus("Preencha usuario e senha.", true);
    (!nick ? elements.nickInput : elements.passwordInput).focus();
    return;
  }

  setLoading(true);
  setStatus("Entrando...");
  try {
    const data = await requestJson("/api/user/login", {
      method: "POST",
      body: JSON.stringify({ nick, password })
    });
    localStorage.setItem(USER_TOKEN_KEY, data.token);
    elements.passwordInput.value = "";
    setStatus("Acesso liberado.");
    redirectToApp();
  } catch (error) {
    setStatus(error.message || "Nao foi possivel entrar.", true);
    elements.passwordInput.select();
  } finally {
    setLoading(false);
  }
}

function togglePasswordVisibility() {
  const showing = elements.passwordInput.type === "text";
  elements.passwordInput.type = showing ? "password" : "text";
  elements.togglePasswordButton.setAttribute("aria-pressed", String(!showing));
  elements.togglePasswordButton.setAttribute("aria-label", showing ? "Mostrar senha" : "Ocultar senha");
  elements.togglePasswordButton.title = showing ? "Mostrar senha" : "Ocultar senha";
  elements.togglePasswordButton.innerHTML = `<i data-lucide="${showing ? "eye" : "eye-off"}" aria-hidden="true"></i>`;
  window.lucide?.createIcons();
  elements.passwordInput.focus();
}

function setLoading(loading) {
  elements.submitButton.disabled = loading;
  elements.submitButton.setAttribute("aria-busy", String(loading));
  elements.nickInput.disabled = loading;
  elements.passwordInput.disabled = loading;
  elements.togglePasswordButton.disabled = loading;
}

function setFormEnabled(enabled) {
  elements.submitButton.disabled = !enabled;
  elements.nickInput.disabled = !enabled;
  elements.passwordInput.disabled = !enabled;
  elements.togglePasswordButton.disabled = !enabled;
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

function redirectToApp() {
  const returnTarget = new URLSearchParams(location.search).get("return");
  const safeTarget = ["index.htm", "index.html", "fixar.htm"].includes(returnTarget) ? returnTarget : "index.htm";
  location.replace(safeTarget);
}

function getToken() {
  try {
    return localStorage.getItem(USER_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  let lastError = null;
  const headers = { "Content-Type": "application/json" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  for (let index = 0; index < API_BASES.length; index += 1) {
    try {
      const response = await fetch(`${API_BASES[index]}${url}`, {
        method: options.method || "GET",
        body: options.body,
        headers
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return data;
      }

      const error = new Error(data.error || "Nao foi possivel concluir o login.");
      error.status = response.status;
      error.hasApiMessage = Boolean(data.error);
      if (!shouldTryNextApiBase(error, index)) {
        throw error;
      }
      lastError = error;
    } catch (error) {
      if (!shouldTryNextApiBase(error, index)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error("Nao foi possivel concluir o login.");
}

function getApiBases() {
  const localHosts = ["localhost", "127.0.0.1", ""];
  const isLocalPage = location.protocol === "file:" || localHosts.includes(location.hostname);
  if (location.port === "8087") {
    return [
      `http://${REMOTE_API_HOST}`,
      `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`
    ];
  }
  if (isLocalPage && location.port !== REMOTE_API_PORT) {
    return [
      `http://127.0.0.1:${REMOTE_API_PORT}`,
      `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`,
      `http://${REMOTE_API_HOST}`
    ];
  }
  if (location.hostname === REMOTE_API_HOST && location.port !== REMOTE_API_PORT) {
    return [`http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`, ""];
  }
  return [""];
}

function shouldTryNextApiBase(error, index) {
  if (index >= API_BASES.length - 1) {
    return false;
  }
  if (!error || !Number.isFinite(error.status)) {
    return true;
  }
  return [404, 502, 503, 504].includes(error.status) && !error.hasApiMessage;
}
//uergs 2024
