const TOKEN_KEY = "shadowing_factory_token";
const COPY_LIMIT_KEY = "shadowing_factory_vocabulary_copy_limit";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const elements = {
  refreshButton: document.getElementById("refreshButton"),
  logoutButton: document.getElementById("logoutButton"),
  copyLimitInput: document.getElementById("copyLimitInput"),
  copyButton: document.getElementById("copyButton"),
  pendingWordsOutput: document.getElementById("pendingWordsOutput"),
  queueSummary: document.getElementById("queueSummary"),
  copyStatus: document.getElementById("copyStatus"),
  processedJsonInput: document.getElementById("processedJsonInput"),
  processButton: document.getElementById("processButton"),
  processingStatus: document.getElementById("processingStatus"),
  processingErrors: document.getElementById("processingErrors")
};

let pendingWords = [];

elements.refreshButton.addEventListener("click", loadPendingWords);
elements.copyButton.addEventListener("click", copyPendingWords);
elements.processButton.addEventListener("click", processVocabularyJson);
elements.copyLimitInput.addEventListener("input", saveCopyLimit);
elements.copyLimitInput.addEventListener("change", normalizeCopyLimit);
elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  location.replace("index.htm?return=palavra.htm");
});

restoreCopyLimit();
boot();

async function boot() {
  if (!getToken()) {
    redirectToLogin();
    return;
  }

  try {
    await requestJson("/api/session");
    await loadPendingWords();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      redirectToLogin();
      return;
    }
    setStatus(error.message, true);
  }
}

async function loadPendingWords() {
  try {
    elements.refreshButton.disabled = true;
    elements.queueSummary.textContent = "Carregando fila...";
    const data = await requestJson("/api/vocabulary/pending");
    applyPendingWords(data.items);
    setStatus(pendingWords.length ? "Fila pronta para copiar." : "A fila esta vazia.");
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      redirectToLogin();
      return;
    }
    setStatus(error.message, true);
    elements.queueSummary.textContent = "Nao foi possivel carregar a fila.";
  } finally {
    elements.refreshButton.disabled = false;
  }
}

async function processVocabularyJson() {
  const jsonContent = elements.processedJsonInput.value.trim();
  if (!jsonContent) {
    setProcessingStatus("Cole o JSON antes de processar.", true);
    return;
  }

  try {
    elements.processButton.disabled = true;
    elements.processButton.textContent = "Processando...";
    elements.processingErrors.replaceChildren();
    setProcessingStatus("Validando e atualizando o vocabulario...");
    const result = await requestJson("/api/vocabulary/process", {
      method: "POST",
      body: JSON.stringify({ jsonContent })
    });

    applyPendingWords(result.pendingItems);
    renderProcessingErrors(result.errors);
    const processed = result.processed || {};
    const total = Number(processed.valid || 0) +
      Number(processed.derivatives || 0) +
      Number(processed.invalid || 0);
    const errorCount = Array.isArray(result.errors) ? result.errors.length : 0;
    setProcessingStatus(
      `${total} item(ns) processado(s): ${processed.valid || 0} valido(s), ` +
      `${processed.derivatives || 0} derivado(s), ${processed.invalid || 0} invalido(s). ` +
      `${errorCount} erro(s).`,
      errorCount > 0
    );
    if (!errorCount) {
      elements.processedJsonInput.value = "";
    }
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      redirectToLogin();
      return;
    }
    setProcessingStatus(error.message, true);
  } finally {
    elements.processButton.disabled = false;
    elements.processButton.textContent = "Processar JSON";
  }
}

function applyPendingWords(items) {
  pendingWords = Array.isArray(items) ? items : [];
  elements.pendingWordsOutput.value = pendingWords.map((item) => item.writing).join("\n");
  elements.queueSummary.textContent = `${pendingWords.length} ${pendingWords.length === 1 ? "item" : "itens"}, mais antigos primeiro`;
  elements.copyButton.disabled = pendingWords.length === 0;
}

function renderProcessingErrors(errors) {
  elements.processingErrors.replaceChildren();
  (Array.isArray(errors) ? errors : []).forEach((error) => {
    const item = document.createElement("div");
    item.className = "processing-error-item";
    const writing = document.createElement("strong");
    writing.textContent = error.writing || "Item desconhecido";
    const message = document.createElement("span");
    message.textContent = error.message || "Erro nao informado.";
    item.append(writing, message);
    elements.processingErrors.append(item);
  });
}

async function copyPendingWords() {
  const limit = normalizeCopyLimit();
  const selectedWords = pendingWords.slice(0, limit).map((item) => item.writing);
  if (!selectedWords.length) {
    setStatus("Nao ha palavras para copiar.", true);
    return;
  }

  const text = selectedWords.join("\n");
  try {
    await writeClipboard(text);
    setStatus(`${selectedWords.length} ${selectedWords.length === 1 ? "item copiado" : "itens copiados"}.`);
  } catch {
    setStatus("O navegador nao permitiu copiar o texto.", true);
  }
}

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.append(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  if (!copied) {
    throw new Error("Falha ao copiar.");
  }
}

function restoreCopyLimit() {
  const saved = Number(localStorage.getItem(COPY_LIMIT_KEY));
  elements.copyLimitInput.value = String(Number.isInteger(saved) && saved > 0 ? Math.min(saved, 1000) : 20);
}

function saveCopyLimit() {
  const value = Number(elements.copyLimitInput.value);
  if (Number.isInteger(value) && value > 0) {
    localStorage.setItem(COPY_LIMIT_KEY, String(Math.min(value, 1000)));
  }
}

function normalizeCopyLimit() {
  const value = Number(elements.copyLimitInput.value);
  const normalized = Number.isFinite(value) ? Math.min(1000, Math.max(1, Math.floor(value))) : 20;
  elements.copyLimitInput.value = String(normalized);
  localStorage.setItem(COPY_LIMIT_KEY, String(normalized));
  return normalized;
}

async function requestJson(url, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError = null;
  for (let index = 0; index < API_BASES.length; index += 1) {
    try {
      const response = await fetch(`${API_BASES[index]}${url}`, {
        headers,
        method: options.method || "GET",
        body: options.body
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return data;
      }

      const error = new Error(data.error || "Nao foi possivel concluir a operacao.");
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
  if (index >= API_BASES.length - 1) {
    return false;
  }
  if (!error || !Number.isFinite(error.status)) {
    return true;
  }
  return [404, 502, 503, 504].includes(error.status) && !error.hasApiMessage;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function redirectToLogin() {
  location.replace("index.htm?return=palavra.htm");
}

function setStatus(message, isError = false) {
  elements.copyStatus.textContent = message;
  elements.copyStatus.classList.toggle("error", isError);
}

function setProcessingStatus(message, isError = false) {
  elements.processingStatus.textContent = message;
  elements.processingStatus.classList.toggle("error", isError);
}
