const USER_TOKEN_KEY = "shadowing_user_token";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const elements = {
  trainingPanel: document.getElementById("trainingPanel"),
  emptyPanel: document.getElementById("emptyPanel"),
  stateTitle: document.getElementById("stateTitle"),
  stateMessage: document.getElementById("stateMessage"),
  exerciseCounter: document.getElementById("exerciseCounter"),
  levelBadge: document.getElementById("levelBadge"),
  wordCounter: document.getElementById("wordCounter"),
  progressFill: document.getElementById("progressFill"),
  exerciseContent: document.getElementById("exerciseContent"),
  exerciseKind: document.getElementById("exerciseKind"),
  promptText: document.getElementById("promptText"),
  translationText: document.getElementById("translationText"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  submitButton: document.getElementById("submitButton"),
  statusText: document.getElementById("statusText"),
  refreshButton: document.getElementById("refreshButton"),
  feedbackToast: document.getElementById("feedbackToast"),
  feedbackTitle: document.getElementById("feedbackTitle"),
  feedbackTyped: document.getElementById("feedbackTyped"),
  feedbackCorrect: document.getElementById("feedbackCorrect"),
  feedbackPoints: document.getElementById("feedbackPoints"),
  feedbackScore: document.getElementById("feedbackScore"),
  feedbackMessage: document.getElementById("feedbackMessage"),
  feedbackContinueButton: document.getElementById("feedbackContinueButton"),
  settingsForm: document.getElementById("settingsForm"),
  wordsPerDayInput: document.getElementById("wordsPerDayInput"),
  saveSettingsButton: document.getElementById("saveSettingsButton")
};

let training = null;
let submitting = false;
let meaningFitFrame = 0;

elements.answerForm.addEventListener("submit", submitAnswer);
elements.answerInput.addEventListener("input", updateSubmitState);
elements.refreshButton.addEventListener("click", loadTraining);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.feedbackContinueButton.addEventListener("click", continueAfterFeedback);
window.addEventListener("resize", scheduleMeaningFit);
boot();

async function boot() {
  if (!getToken()) {
    redirectToLogin();
    return;
  }
  try {
    await requestJson("/api/user/session");
    await loadSettings();
    await loadTraining();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(USER_TOKEN_KEY);
      redirectToLogin();
      return;
    }
    showState("Nao foi possivel abrir o treino", error.message);
  } finally {
    document.body.classList.remove("is-loading");
  }
}

async function loadTraining() {
  setStatus("Carregando contexto...");
  elements.refreshButton.disabled = true;
  try {
    const data = await requestJson("/api/user/vocabulary-training");
    training = data.training;
    renderTraining();
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(USER_TOKEN_KEY);
      redirectToLogin();
      return;
    }
    showState("Falha ao carregar", error.message);
  } finally {
    elements.refreshButton.disabled = false;
  }
}

async function loadSettings() {
  const data = await requestJson("/api/user/vocabulary-settings");
  elements.wordsPerDayInput.value = String(data.wordsPerDay || 5);
}

async function saveSettings(event) {
  event.preventDefault();
  const wordsPerDay = Number(elements.wordsPerDayInput.value);
  if (!Number.isInteger(wordsPerDay) || wordsPerDay < 1 || wordsPerDay > 50) {
    setStatus("Escolha entre 1 e 50 palavras por nivel.", true);
    elements.wordsPerDayInput.focus();
    return;
  }

  elements.saveSettingsButton.disabled = true;
  setStatus("Salvando preferencia...");
  try {
    await requestJson("/api/user/vocabulary-settings", {
      method: "PUT",
      body: JSON.stringify({ wordsPerDay })
    });
    setStatus("Preferencia salva. O treino foi remontado.");
    await loadTraining();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    elements.saveSettingsButton.disabled = false;
  }
}

function renderTraining() {
  if (!training || training.status === "empty") {
    showState("Nenhuma revisao disponivel", "As palavras precisam estar processadas e dentro do periodo de revisao.");
    return;
  }
  if (training.status === "completed") {
    const gains = (training.exercises || []).filter((item) => item.answered).reduce((sum, item) => sum + Number(item.delta || 0), 0);
    showState("Treino concluido", `Voce respondeu ${training.answeredExercises || 0} exercicios e somou ${formatSigned(gains)} pontos neste treino.`);
    return;
  }

  const exercise = training.exercises?.[training.currentIndex];
  if (!exercise) {
    showState("Treino concluido", "Todas as atividades deste treino foram respondidas.");
    return;
  }

  elements.emptyPanel.classList.add("is-hidden");
  elements.trainingPanel.classList.remove("is-hidden");
  const answered = Number(training.answeredExercises || 0);
  const total = Math.max(1, Number(training.totalExercises || training.exercises.length));
  elements.exerciseCounter.textContent = `Exercicio ${Math.min(answered + 1, total)} de ${total}`;
  elements.levelBadge.textContent = `Nivel ${Number(exercise.level)}`;
  elements.wordCounter.textContent = `${training.words?.length || 0} palavra(s)`;
  elements.progressFill.style.width = `${Math.min(100, answered / total * 100)}%`;
  elements.exerciseKind.textContent = exercise.type === "meaning" ? "Descubra pela definicao" : "Complete a frase em ingles";
  elements.exerciseContent.classList.toggle("is-meaning", exercise.type === "meaning");
  elements.promptText.classList.toggle("is-meaning", exercise.type === "meaning");
  elements.promptText.style.fontSize = "";
  renderPromptParts(exercise.promptParts, exercise.prompt);
  elements.promptText.title = exercise.type === "meaning" ? exercise.prompt : "";
  elements.translationText.textContent = exercise.translation || "";
  elements.answerInput.value = "";
  elements.answerInput.disabled = false;
  elements.submitButton.disabled = true;
  setStatus("A pontuacao considera cada caractere da resposta.");
  requestAnimationFrame(() => {
    if (exercise.type === "meaning") fitMeaningPrompt();
    elements.answerInput.focus();
  });
}

function renderPromptParts(parts, fallbackText) {
  elements.promptText.replaceChildren();
  const safeParts = Array.isArray(parts) && parts.length ? parts : [{ type: "text", text: fallbackText || "" }];
  safeParts.forEach((part) => {
    if (part?.type === "slot" && Array.isArray(part.characters)) {
      const slot = document.createElement("span");
      slot.className = "prompt-answer-slot";
      slot.setAttribute("aria-label", `lacuna de ${part.expectedLength || part.characters.length} caracteres`);
      part.characters.forEach((item) => {
        const character = document.createElement("span");
        character.className = item?.hint
          ? "prompt-slot-character prompt-hint-character"
          : "prompt-slot-character";
        character.textContent = String(item?.text || "_");
        slot.append(character);
      });
      elements.promptText.append(slot);
      return;
    }
    if (!part?.hint) {
      elements.promptText.append(document.createTextNode(String(part?.text || "")));
      return;
    }
    const character = document.createElement("span");
    character.className = "prompt-hint-character";
    character.textContent = String(part.text || "");
    elements.promptText.append(character);
  });
}

function scheduleMeaningFit() {
  cancelAnimationFrame(meaningFitFrame);
  meaningFitFrame = requestAnimationFrame(fitMeaningPrompt);
}

function fitMeaningPrompt() {
  const prompt = elements.promptText;
  if (!prompt.classList.contains("is-meaning") || !prompt.clientWidth || !prompt.clientHeight) return;

  let minimum = 9;
  let maximum = 24;
  let best = minimum;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const size = (minimum + maximum) / 2;
    prompt.style.fontSize = `${size}px`;
    const fits = prompt.scrollHeight <= prompt.clientHeight + 1 &&
      prompt.scrollWidth <= prompt.clientWidth + 1;
    if (fits) {
      best = size;
      minimum = size;
    } else {
      maximum = size;
    }
  }
  prompt.style.fontSize = `${best}px`;
}

async function submitAnswer(event) {
  event.preventDefault();
  const exercise = training?.exercises?.[training.currentIndex];
  const answer = elements.answerInput.value.trim();
  if (!exercise || !answer || submitting) return;

  submitting = true;
  elements.answerInput.disabled = true;
  elements.submitButton.disabled = true;
  setStatus("Conferindo resposta...");
  try {
    const data = await requestJson("/api/user/vocabulary-training/answer", {
      method: "POST",
      body: JSON.stringify({ exerciseId: exercise.id, answer })
    });
    showDetailedFeedback(data.result);
    training = data.training;
  } catch (error) {
    setStatus(error.message, true);
    elements.answerInput.disabled = false;
    updateSubmitState();
    elements.answerInput.focus();
  } finally {
    submitting = false;
  }
}

function showDetailedFeedback(result) {
  const accuracy = Math.round(Number(result.accuracy || 0) * 100);
  elements.feedbackTitle.textContent = accuracy === 100 ? "Resposta correta" : `Precisao de ${accuracy}%`;
  elements.feedbackTyped.textContent = result.response || "(vazio)";
  elements.feedbackCorrect.textContent = result.correctAnswer || "--";
  elements.feedbackPoints.textContent = `${formatSigned(result.delta)} pontos`;
  elements.feedbackScore.textContent = result.graduated
    ? "Palavra concluida"
    : `${result.wordScore} no nivel ${result.wordLevel}`;
  elements.feedbackMessage.textContent = result.graduated
    ? "Esta palavra saiu da sua lista de revisao."
    : result.promoted
      ? `A palavra subiu para o nivel ${result.wordLevel}.`
      : `Score atualizado de ${result.writing}.`;
  elements.feedbackToast.classList.toggle("is-wrong", accuracy < 50);
  elements.feedbackToast.classList.add("is-visible");
  requestAnimationFrame(() => elements.feedbackContinueButton.focus());
}

function continueAfterFeedback() {
  elements.feedbackToast.classList.remove("is-visible");
  renderTraining();
}

function showState(title, message) {
  elements.trainingPanel.classList.add("is-hidden");
  elements.emptyPanel.classList.remove("is-hidden");
  elements.stateTitle.textContent = title;
  elements.stateMessage.textContent = message;
}

function updateSubmitState() {
  elements.submitButton.disabled = submitting || !elements.answerInput.value.trim();
}

function setStatus(message, isError = false) {
  elements.statusText.textContent = message || "";
  elements.statusText.classList.toggle("error", isError);
}

function formatSigned(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${number}` : String(number);
}

async function requestJson(url, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let lastError = null;
  for (let index = 0; index < API_BASES.length; index += 1) {
    try {
      const response = await fetch(`${API_BASES[index]}${url}`, { method: options.method || "GET", body: options.body, headers });
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
  throw lastError || new Error("Nao foi possivel conversar com o servidor.");
}

function getApiBases() {
  const localHosts = ["localhost", "127.0.0.1", ""];
  const isLocalPage = location.protocol === "file:" || localHosts.includes(location.hostname);
  if (isLocalPage && location.port !== REMOTE_API_PORT) return [`http://127.0.0.1:${REMOTE_API_PORT}`, `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`];
  if (location.hostname === REMOTE_API_HOST && location.port !== REMOTE_API_PORT) return [`http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`, ""];
  return [""];
}

function shouldTryNextApiBase(error, index) {
  if (index >= API_BASES.length - 1) return false;
  if (!error || !Number.isFinite(error.status)) return true;
  return [404, 502, 503, 504].includes(error.status) && !error.hasApiMessage;
}

function getToken() { return localStorage.getItem(USER_TOKEN_KEY); }
function redirectToLogin() { location.replace(`login.htm?return=${encodeURIComponent("fixar.htm")}`); }
