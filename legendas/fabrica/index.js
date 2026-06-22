const TOKEN_KEY = "shadowing_factory_token";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const elements = {
  loginView: document.getElementById("loginView"),
  factoryView: document.getElementById("factoryView"),
  loginForm: document.getElementById("loginForm"),
  passwordInput: document.getElementById("passwordInput"),
  loginStatus: document.getElementById("loginStatus"),
  logoutButton: document.getElementById("logoutButton"),
  lessonSelect: document.getElementById("lessonSelect"),
  jsonInput: document.getElementById("jsonInput"),
  statusMessage: document.getElementById("statusMessage"),
  newButton: document.getElementById("newButton"),
  loadButton: document.getElementById("loadButton"),
  deleteButton: document.getElementById("deleteButton"),
  saveButton: document.getElementById("saveButton"),
  updateButton: document.getElementById("updateButton"),
  currentLessonLabel: document.getElementById("currentLessonLabel")
};

let currentLessonId = "";

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await login();
});

elements.logoutButton.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  currentLessonId = "";
  showLogin("Sessao encerrada.");
});

elements.lessonSelect.addEventListener("change", () => {
  const hasSelection = Boolean(elements.lessonSelect.value);
  elements.loadButton.disabled = !hasSelection;
  elements.deleteButton.disabled = !hasSelection;
});

elements.newButton.addEventListener("click", () => {
  currentLessonId = "";
  elements.lessonSelect.value = "";
  elements.jsonInput.value = "";
  updateEditorState();
  setStatus("Cole o JSON e salve como nova aula.");
});

elements.loadButton.addEventListener("click", () => {
  const id = elements.lessonSelect.value;
  if (id) {
    loadLesson(id);
  }
});

elements.saveButton.addEventListener("click", () => saveLesson());
elements.updateButton.addEventListener("click", () => {
  if (currentLessonId) {
    updateLesson(currentLessonId);
  }
});

elements.deleteButton.addEventListener("click", () => {
  const id = elements.lessonSelect.value;
  const label = elements.lessonSelect.selectedOptions[0]?.textContent || "esta aula";
  if (id && window.confirm(`Excluir ${label}?`)) {
    deleteLesson(id);
  }
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
    if (redirectToRequestedPage()) {
      return;
    }
    showFactory();
    await loadLessons();
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
    if (redirectToRequestedPage()) {
      return;
    }
    showFactory();
    await loadLessons();
  } catch (error) {
    setLoginStatus(error.message, true);
  }
}

async function loadLessons() {
  try {
    setStatus("Carregando aulas...");
    const lessons = await requestJson("/api/lessons");
    elements.lessonSelect.innerHTML = '<option value="">Selecione uma aula</option>';
    lessons.forEach((lesson) => {
      const option = document.createElement("option");
      option.value = lesson.id;
      option.textContent = `${lesson.title} (${formatDate(lesson.updated_at || lesson.created_at)})`;
      elements.lessonSelect.appendChild(option);
    });
    elements.loadButton.disabled = true;
    elements.deleteButton.disabled = true;
    setStatus(`${lessons.length} aula(s) encontradas.`);
  } catch (error) {
    handleRequestError(error);
  }
}

async function loadLesson(id) {
  try {
    setStatus("Carregando JSON da aula...");
    const lesson = await requestJson(`/api/lessons/${encodeURIComponent(id)}`);
    currentLessonId = String(lesson.id);
    elements.jsonInput.value = lesson.json_content || "";
    updateEditorState(lesson.title);
    setStatus("Aula carregada para edicao.");
  } catch (error) {
    handleRequestError(error);
  }
}

async function saveLesson() {
  const jsonContent = elements.jsonInput.value.trim();
  if (!jsonContent) {
    setStatus("Cole o JSON antes de salvar.", true);
    return;
  }

  try {
    setStatus("Salvando nova aula...");
    const lesson = await requestJson("/api/lessons", {
      method: "POST",
      body: JSON.stringify({ jsonContent })
    });
    currentLessonId = String(lesson.id);
    await loadLessons();
    elements.lessonSelect.value = currentLessonId;
    updateEditorState(lesson.title);
    setStatus("Nova aula salva no banco.");
  } catch (error) {
    handleRequestError(error);
  }
}

async function updateLesson(id) {
  const jsonContent = elements.jsonInput.value.trim();
  if (!jsonContent) {
    setStatus("Cole o JSON antes de atualizar.", true);
    return;
  }

  try {
    setStatus("Atualizando aula...");
    const lesson = await requestJson(`/api/lessons/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ jsonContent })
    });
    await loadLessons();
    elements.lessonSelect.value = String(lesson.id);
    updateEditorState(lesson.title);
    setStatus("Aula atualizada no banco.");
  } catch (error) {
    handleRequestError(error);
  }
}

async function deleteLesson(id) {
  try {
    setStatus("Excluindo aula...");
    await requestJson(`/api/lessons/${encodeURIComponent(id)}`, { method: "DELETE" });
    currentLessonId = "";
    elements.jsonInput.value = "";
    updateEditorState();
    await loadLessons();
    setStatus("Aula excluida.");
  } catch (error) {
    handleRequestError(error);
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
  if (isLocalPage && location.port !== "21106") {
    return ["http://127.0.0.1:21106"];
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

function handleRequestError(error) {
  if (error.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    showLogin("Entre novamente.");
    return;
  }
  setStatus(error.message, true);
}

function showLogin(message) {
  elements.factoryView.classList.add("is-hidden");
  elements.loginView.classList.remove("is-hidden");
  setLoginStatus(message || "");
  setTimeout(() => elements.passwordInput.focus(), 50);
}

function showFactory() {
  elements.loginView.classList.add("is-hidden");
  elements.factoryView.classList.remove("is-hidden");
  updateEditorState();
  setStatus("Conectado.");
}

function updateEditorState(title = "") {
  const hasCurrent = Boolean(currentLessonId);
  elements.updateButton.disabled = !hasCurrent;
  elements.saveButton.textContent = hasCurrent ? "Salvar como copia nova" : "Salvar como nova aula";
  elements.currentLessonLabel.textContent = hasCurrent
    ? `Editando: ${title || `aula ${currentLessonId}`}`
    : "Nenhuma aula selecionada";
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function redirectToRequestedPage() {
  const requestedPage = new URLSearchParams(location.search).get("return");
  if (requestedPage === "palavra.htm") {
    location.replace("palavra.htm");
    return true;
  }
  return false;
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
  if (!value) {
    return "sem data";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}
