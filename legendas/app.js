let lessonData = null;
let player = null;
let currentBlockIndex = 0;
let autoPauseEnabled = true;
let autoPausedForCurrentBlock = false;
let isPlayerReady = false;
let progressAnimationId = null;
let shouldPlayOnBlockSelect = false;
let suppressTimeSyncUntil = 0;
let lastExplicitBlockIndex = 0;
let timeAnchorSeconds = 0;
let timeAnchorTimestamp = performance.now();
let lastApiSyncTimestamp = 0;
let cachedPlayerState = -1;
let currentPlaybackRate = 1;
let isScrubbingBlock = false;
let blockSeekTimer = null;
let appMode = "study";
let questionMode = "en";
let quizAnswers = {};
let quizDraftAnswers = {};
let quizItems = [];
let currentQuizItemIndex = 0;
let quizOptionOrders = {};
let resultOverlayTimer = null;
let availableLessons = [];
let currentLessonStorageId = "";
let pendingPlayerSeekSeconds = null;
let contextSaveTimer = null;
let isRestoringLessonContext = false;
let remoteUserContext = null;
let contextSavePromise = Promise.resolve();

const USER_TOKEN_KEY = "shadowing_user_token";
const LEGACY_CONTEXT_PREFIX = "shadowingLessonContext:";

const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";
const API_BASES = getApiBases();

const elements = {
  lessonSelect: document.getElementById("lessonSelect"),
  loadLessonButton: document.getElementById("loadLessonButton"),
  refreshLessonsButton: document.getElementById("refreshLessonsButton"),
  lessonTitle: document.getElementById("lessonTitle"),
  blockCounter: document.getElementById("blockCounter"),
  timeRange: document.getElementById("timeRange"),
  englishZone: document.getElementById("englishZone"),
  meaningZone: document.getElementById("meaningZone"),
  previousOriginalText: document.getElementById("previousOriginalText"),
  originalText: document.getElementById("originalText"),
  nextOriginalText: document.getElementById("nextOriginalText"),
  translationText: document.getElementById("translationText"),
  notesText: document.getElementById("notesText"),
  quizZone: document.getElementById("quizZone"),
  quizQuestionCounter: document.getElementById("quizQuestionCounter"),
  quizScore: document.getElementById("quizScore"),
  quizQuestionText: document.getElementById("quizQuestionText"),
  quizOptions: document.getElementById("quizOptions"),
  confirmQuizButton: document.getElementById("confirmQuizButton"),
  quizFeedback: document.getElementById("quizFeedback"),
  statusMessage: document.getElementById("statusMessage"),
  playerFrame: document.querySelector(".player-frame"),
  blockList: document.getElementById("blockList"),
  blockCount: document.getElementById("blockCount"),
  blockProgressRange: document.getElementById("blockProgressRange"),
  blockProgressTime: document.getElementById("blockProgressTime"),
  playPauseButton: document.getElementById("playPauseButton"),
  repeatButton: document.getElementById("repeatButton"),
  continueButton: document.getElementById("continueButton"),
  previousButton: document.getElementById("previousButton"),
  nextButton: document.getElementById("nextButton"),
  autoPauseToggle: document.getElementById("autoPauseToggle"),
  translationToggle: document.getElementById("translationToggle"),
  notesToggle: document.getElementById("notesToggle"),
  speedRange: document.getElementById("speedRange"),
  speedValue: document.getElementById("speedValue"),
  modeToggleButton: document.getElementById("modeToggleButton"),
  questionModeButton: document.getElementById("questionModeButton"),
  resultOverlay: document.getElementById("resultOverlay"),
  resultTitle: document.getElementById("resultTitle"),
  resultText: document.getElementById("resultText")
};

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  setStatus("API do YouTube pronta. Escolha uma aula para comecar.");
};

updateModeControls();
bootAuthenticatedApp();

elements.lessonSelect.addEventListener("change", () => {
  elements.loadLessonButton.disabled = !elements.lessonSelect.value;
});
elements.loadLessonButton.addEventListener("click", () => {
  if (elements.lessonSelect.value) {
    loadLessonFromDatabase(elements.lessonSelect.value);
  }
});
elements.refreshLessonsButton.addEventListener("click", loadAvailableLessons);

elements.playPauseButton.addEventListener("click", togglePlayPause);
elements.repeatButton.addEventListener("click", repeatCurrentBlock);
elements.continueButton.addEventListener("click", continueToNextBlock);
elements.previousButton.addEventListener("click", () => {
  if (appMode === "quiz") {
    moveToQuizItem(currentQuizItemIndex - 1, { play: true });
  } else {
    playBlock(currentBlockIndex - 1);
  }
});
elements.nextButton.addEventListener("click", () => {
  if (appMode === "quiz") {
    moveToQuizItem(currentQuizItemIndex + 1, { play: true });
  } else {
    playBlock(currentBlockIndex + 1);
  }
});

elements.modeToggleButton.addEventListener("click", () => {
  setAppMode(appMode === "study" ? "quiz" : "study", { autoSelect: true });
});

elements.questionModeButton.addEventListener("click", () => {
  questionMode = questionMode === "en" ? "pt" : "en";
  updateModeControls();
  if (appMode === "quiz") {
    renderQuizForCurrentBlock();
    renderBlockList();
  }
  scheduleLessonContextSave();
});

elements.confirmQuizButton.addEventListener("click", confirmQuizAnswer);

elements.resultOverlay.addEventListener("click", hideResultOverlay);

elements.autoPauseToggle.addEventListener("change", (event) => {
  autoPauseEnabled = event.target.checked;
  autoPausedForCurrentBlock = false;
  if (!autoPauseEnabled && isPlayerReady && lessonData) {
    updateCurrentBlockByTime(player.getCurrentTime());
  }
  scheduleLessonContextSave();
});

elements.translationToggle.addEventListener("change", () => {
  elements.translationText.classList.toggle("is-hidden", !elements.translationToggle.checked);
  fitCaptionToStage();
  scheduleLessonContextSave();
});

elements.notesToggle.addEventListener("change", () => {
  elements.notesText.classList.toggle("is-hidden", !elements.notesToggle.checked);
  fitCaptionToStage();
  scheduleLessonContextSave();
});

elements.blockProgressRange.addEventListener("input", () => {
  isScrubbingBlock = true;
  updateBlockProgressPreview(Number(elements.blockProgressRange.value));
  scheduleBlockProgressSeek(Number(elements.blockProgressRange.value));
});

elements.blockProgressRange.addEventListener("change", () => {
  isScrubbingBlock = false;
  seekToBlockProgress(Number(elements.blockProgressRange.value));
  scheduleLessonContextSave();
});

elements.blockProgressRange.addEventListener("blur", () => {
  isScrubbingBlock = false;
});

elements.speedRange.addEventListener("input", () => {
  setPlaybackSpeed(Number(elements.speedRange.value));
});

elements.speedRange.addEventListener("change", () => {
  setPlaybackSpeed(snapPlaybackRate(Number(elements.speedRange.value)));
  scheduleLessonContextSave();
});

window.addEventListener("resize", debounce(fitCaptionToStage, 120));
window.addEventListener("pagehide", saveLessonContextOnUnload);
setControlsEnabled(false);

async function bootAuthenticatedApp() {
  if (location.protocol === "file:") {
    document.body.classList.remove("auth-pending");
    setStatus("Abra o projeto pelo arquivo iniciar-local.bat para usar o login.", true);
    return;
  }

  const token = storageGet(USER_TOKEN_KEY);
  if (!token) {
    redirectToLogin();
    return;
  }

  try {
    await requestJson("/api/user/session", { requireAuth: true });
    await loadRemoteUserContext();
    clearLegacyLessonContext();
    document.body.classList.remove("auth-pending");
    await loadAvailableLessons();
  } catch (error) {
    if (error.status === 401) {
      storageRemove(USER_TOKEN_KEY);
      redirectToLogin();
      return;
    }
    document.body.classList.remove("auth-pending");
    setStatus(error.message || "Nao foi possivel validar sua sessao.", true);
  }
}

function redirectToLogin() {
  const pageName = location.pathname.split("/").pop() || "index.htm";
  const returnTo = ["index.htm", "index.html"].includes(pageName) ? pageName : "index.htm";
  location.replace(`login.htm?return=${encodeURIComponent(returnTo)}`);
}

async function loadRemoteUserContext() {
  const data = await requestJson("/api/user/context", { requireAuth: true });
  remoteUserContext = data.context && typeof data.context === "object" ? data.context : null;
}

async function loadAvailableLessons() {
  elements.lessonSelect.disabled = true;
  elements.loadLessonButton.disabled = true;
  setStatus("Carregando lista de aulas...");

  try {
    availableLessons = await requestJson("/api/public/lessons");
    renderLessonOptions();
    const restoredActiveLesson = await restoreActiveLessonSelection();
    if (!restoredActiveLesson) {
      setStatus(
        availableLessons.length
          ? "Escolha uma aula do banco para iniciar."
          : "Nenhuma aula encontrada no banco."
      );
    }
  } catch (error) {
    console.error(error);
    elements.lessonSelect.innerHTML = '<option value="">Erro ao carregar aulas</option>';
    setStatus(error.message || "Nao foi possivel carregar as aulas.", true);
  } finally {
    elements.lessonSelect.disabled = false;
    elements.loadLessonButton.disabled = !elements.lessonSelect.value;
  }
}

function renderLessonOptions() {
  elements.lessonSelect.innerHTML = '<option value="">Selecione uma aula</option>';
  availableLessons.forEach((lesson) => {
    const option = document.createElement("option");
    option.value = lesson.id;
    option.textContent = lesson.title || `Aula ${lesson.id}`;
    elements.lessonSelect.appendChild(option);
  });
}

async function loadLessonFromDatabase(id) {
  const nextLessonId = String(id);
  const selected = availableLessons.find((lesson) => String(lesson.id) === String(id));
  const isSwitchingLesson = Boolean(currentLessonStorageId && currentLessonStorageId !== nextLessonId);
  const contextToRestore =
    !isSwitchingLesson && String(remoteUserContext?.activeLessonId || "") === nextLessonId
      ? remoteUserContext.lessonContext
      : null;
  elements.lessonSelect.value = nextLessonId;
  setStatus(`Carregando ${selected ? selected.title : "aula"}...`);
  elements.loadLessonButton.disabled = true;

  try {
    const lesson = await requestJson(`/api/public/lessons/${encodeURIComponent(id)}`);
    if (isSwitchingLesson) {
      remoteUserContext = null;
    }
    await loadLessonText(lesson.json_content, lesson.title || `Aula ${id}`, {
      lessonId: id,
      context: contextToRestore
    });
  } catch (error) {
    console.error(error);
    setControlsEnabled(false);
    setStatus(error.message || "Nao foi possivel carregar a aula.", true);
  } finally {
    elements.loadLessonButton.disabled = !elements.lessonSelect.value;
  }
}

async function loadLessonText(text, label = "aula", options = {}) {
  const data = parseLessonText(text);
  validateLessonData(data);

  lessonData = {
    ...data,
    blocks: data.blocks
      .map(normalizeBlock)
      .sort((a, b) => a.start - b.start)
  };

  currentLessonStorageId = options.lessonId ? String(options.lessonId) : makeLessonStorageId(lessonData, label);
  currentBlockIndex = 0;
  currentQuizItemIndex = 0;
  autoPausedForCurrentBlock = false;
  autoPauseEnabled = true;
  shouldPlayOnBlockSelect = false;
  lastExplicitBlockIndex = 0;
  suppressTimeSyncUntil = 0;
  currentPlaybackRate = 1;
  appMode = "study";
  quizAnswers = {};
  quizDraftAnswers = {};
  quizOptionOrders = {};
  pendingPlayerSeekSeconds = null;
  elements.autoPauseToggle.checked = true;
  elements.translationToggle.checked = true;
  elements.notesToggle.checked = true;
  setTimeAnchor(0);
  rebuildQuizItems();
  applyLessonContext(options.context);
  setAppMode(appMode);
  setPlaybackSpeed(currentPlaybackRate);

  const videoId = extractYouTubeVideoId(lessonData.videoUrl);
  if (!videoId) {
    throw new Error("Nao consegui extrair o ID do video do YouTube.");
  }

  elements.lessonTitle.textContent = lessonData.title || label || "Aula sem titulo";
  initializeYouTubePlayer(videoId);
  renderBlockList();
  showBlock(currentBlockIndex);
  setControlsEnabled(true);
  setStatus(`Aula carregada com ${lessonData.blocks.length} blocos.`);
  await saveLessonContextNow();
}

function parseLessonText(text) {
  const normalizedText = stripBom(text.trim());

  try {
    return JSON.parse(normalizedText);
  } catch (jsonError) {
    const repaired = parsePrettyLessonFallback(normalizedText);
    if (repaired) {
      return repaired;
    }

    throw new Error(
      "JSON invalido. Verifique aspas internas nos textos ou salve o arquivo como JSON valido."
    );
  }
}

function parsePrettyLessonFallback(text) {
  const videoUrl = extractStringField(text, "videoUrl");
  const title = extractStringField(text, "title") || "";
  const blocksText = text.match(/"blocks"\s*:\s*\[([\s\S]*)\]\s*\}?$/);

  if (!videoUrl || !blocksText) {
    return null;
  }

  const blockChunks = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < blocksText[1].length; index += 1) {
    const char = blocksText[1][index];
    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        blockChunks.push(blocksText[1].slice(start, index + 1));
        start = -1;
      }
    }
  }

  const blocks = blockChunks.map(parsePrettyBlock).filter(Boolean);
  if (!blocks.length) {
    return null;
  }

  return { videoUrl, title, blocks };
}

function parsePrettyBlock(chunk) {
  const block = {};

  for (const key of ["id", "start", "end"]) {
    const value = extractNumberField(chunk, key);
    if (value !== null) {
      block[key] = value;
    }
  }

  for (const key of ["original", "translation", "notes"]) {
    const value = extractStringField(chunk, key);
    if (value !== null) {
      block[key] = value;
    }
  }

  const vocabulary = extractArrayField(chunk, "vocabulary");
  if (vocabulary) {
    block.vocabulary = vocabulary;
  }

  const quiz = extractQuizField(chunk);
  if (quiz) {
    block.quiz = quiz;
  }

  return block;
}

function extractQuizField(chunk) {
  if (!/"quiz"\s*:/.test(chunk)) {
    return null;
  }

  const questionEn = extractStringField(chunk, "questionEn");
  const questionPt = extractStringField(chunk, "questionPt");
  const options = extractQuizOptions(chunk);

  if (!questionEn || !questionPt || !options.length) {
    return null;
  }

  return {
    questionEn,
    questionPt,
    options,
    correctOptionIndex: 0
  };
}

function extractQuizOptions(chunk) {
  const optionsBody = extractArrayBody(chunk, "options");
  if (!optionsBody) {
    return [];
  }

  const optionObjectChunks = collectTopLevelObjectChunks(optionsBody);
  if (optionObjectChunks.length) {
    return optionObjectChunks
      .map((optionChunk) => {
        const en = extractStringField(optionChunk, "en");
        const pt = extractStringField(optionChunk, "pt");
        return normalizeQuizOption({ en, pt });
      })
      .filter(Boolean);
  }

  return optionsBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let value = line.replace(/,$/, "").trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return normalizeQuizOption(unescapeLooseString(value));
    })
    .filter(Boolean);
}

function extractArrayBody(text, key) {
  const keyMatch = text.match(new RegExp(`"${key}"\\s*:\\s*\\[`, "i"));
  if (!keyMatch) {
    return "";
  }

  const startIndex = keyMatch.index + keyMatch[0].lastIndexOf("[");
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex + 1, index);
      }
    }
  }

  return "";
}

function collectTopLevelObjectChunks(text) {
  const chunks = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        chunks.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return chunks;
}

function extractStringField(text, key) {
  const lineMatch = text.match(new RegExp(`"${key}"\\s*:\\s*([^\\n\\r]+)`, "i"));
  if (!lineMatch) {
    return null;
  }

  let value = lineMatch[1].trim();
  if (value.endsWith(",")) {
    value = value.slice(0, -1).trim();
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }

  return unescapeLooseString(value);
}

function extractNumberField(text, key) {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`, "i"));
  return match ? Number(match[1]) : null;
}

function extractArrayField(text, key) {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*(\\[[^\\n\\r]+\\])`, "i"));
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return match[1]
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) => unescapeLooseString(item.trim().replace(/^"|"$/g, "")))
      .filter(Boolean);
  }
}

function unescapeLooseString(value) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

function validateLessonData(data) {
  if (!data || typeof data !== "object") {
    throw new Error("O arquivo precisa conter um objeto JSON.");
  }

  if (!data.videoUrl || typeof data.videoUrl !== "string") {
    throw new Error("O JSON precisa ter o campo videoUrl.");
  }

  if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
    throw new Error("O JSON precisa ter uma lista blocks com pelo menos um bloco.");
  }

  data.blocks.forEach((block, index) => {
    const missing = ["start", "end", "original", "translation", "notes"].filter(
      (key) => block[key] === undefined || block[key] === null
    );

    if (missing.length) {
      throw new Error(`Bloco ${index + 1} esta sem: ${missing.join(", ")}.`);
    }
  });
}

function normalizeBlock(block, index = 0) {
  const numericId = Number(block.id);
  return {
    ...block,
    id: Number.isFinite(numericId) ? numericId : index + 1,
    start: Number(block.start),
    end: Number(block.end),
    original: String(block.original || ""),
    translation: String(block.translation || ""),
    notes: normalizeNotes(block.notes),
    questions: normalizeQuestions(block.questions, block.quiz, index)
  };
}

function normalizeQuestions(questions, legacyQuiz, blockIndex = 0) {
  const source = Array.isArray(questions) ? questions : legacyQuiz ? [legacyQuiz] : [];
  return source
    .map((question, questionIndex) => normalizeQuestion(question, blockIndex, questionIndex))
    .filter(Boolean);
}

function normalizeQuestion(question, blockIndex = 0, questionIndex = 0) {
  if (!question || typeof question !== "object") {
    return null;
  }

  const type = String(question.type || "multiple_choice");
  const options = Array.isArray(question.options)
    ? question.options.map(normalizeQuizOption).filter(Boolean)
    : [];
  const base = {
    id: String(question.id || `b${blockIndex + 1}q${questionIndex + 1}`),
    type,
    questionEn: String(question.questionEn || getDefaultQuestionText(type, "en")),
    questionPt: String(question.questionPt || getDefaultQuestionText(type, "pt"))
  };

  if (options.length) {
    return {
      ...base,
      kind: "choice",
      options,
      correctOptionIndex: 0
    };
  }

  const fillItems = normalizeFillItems(question.items);
  if (!fillItems.length) {
    return null;
  }

  if (type === "context_discovery") {
    const answer = String(question.answer || "").trim();
    if (!answer) {
      return null;
    }
    return {
      ...base,
      kind: "discovery",
      targetType: String(question.targetType || ""),
      answer,
      answerPt: String(question.answerPt || ""),
      items: fillItems
    };
  }

  const expectedAnswers = fillItems.flatMap((item) => item.answers);
  if (!expectedAnswers.length) {
    return null;
  }

  return {
    ...base,
    kind: "fill",
    wordsStudied: Array.isArray(question.wordsStudied) ? question.wordsStudied.map(String).filter(Boolean) : [],
    expressionsStudied: Array.isArray(question.expressionsStudied)
      ? question.expressionsStudied.map(String).filter(Boolean)
      : [],
    items: fillItems,
    expectedAnswers
  };
}

function normalizeFillItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        translation: String(item.translation || ""),
        toFill: String(item.to_fill || item.toFill || ""),
        answers: Array.isArray(item.answers)
          ? item.answers.map((answer) => String(answer || "").trim()).filter(Boolean)
          : []
      };
    })
    .filter((item) => item && item.toFill);
}

function getDefaultQuestionText(type, language) {
  const isPt = language === "pt";
  const labels = {
    expression_fill: {
      en: "Complete the expression from the block.",
      pt: "Complete a expressao estudada no bloco."
    },
    vocabulary_fill: {
      en: "Complete the vocabulary from the block.",
      pt: "Complete o vocabulario estudado no bloco."
    },
    context_discovery: {
      en: "Discover the word or expression that completes the examples.",
      pt: "Descubra a palavra ou expressao que completa os exemplos."
    }
  };
  return labels[type]?.[isPt ? "pt" : "en"] || (isPt ? "Responda a pergunta." : "Answer the question.");
}

function normalizeNotes(notes) {
  if (!notes || typeof notes === "string") {
    return String(notes || "");
  }

  if (typeof notes !== "object") {
    return String(notes);
  }

  return {
    grammar: Array.isArray(notes.grammar) ? notes.grammar.map(String).filter(Boolean) : [],
    vocabulary: Array.isArray(notes.vocabulary)
      ? notes.vocabulary.map(normalizeTermNote).filter(Boolean)
      : [],
    expressions: Array.isArray(notes.expressions)
      ? notes.expressions.map(normalizeTermNote).filter(Boolean)
      : [],
    interpretation: String(notes.interpretation || "")
  };
}

function normalizeTermNote(item) {
  if (!item || typeof item !== "object") {
    const text = String(item || "").trim();
    return text ? { term: text, meaningPt: "", comment: "" } : null;
  }

  const term = String(item.term || "").trim();
  const meaningPt = String(item.meaningPt || item.meaning || "").trim();
  const comment = String(item.comment || "").trim();
  if (!term && !meaningPt && !comment) {
    return null;
  }
  return { term, meaningPt, comment };
}

function normalizeQuizOption(option) {
  if (option && typeof option === "object") {
    const en = String(option.en || option.optionEn || option.textEn || "").trim();
    const pt = String(option.pt || option.optionPt || option.textPt || "").trim();
    const fallback = en || pt;
    if (!fallback) {
      return null;
    }
    return {
      en: en || fallback,
      pt: pt || fallback
    };
  }

  const text = String(option || "").trim();
  if (!text) {
    return null;
  }
  return {
    en: text,
    pt: text
  };
}

function extractYouTubeVideoId(videoUrl) {
  try {
    const url = new URL(videoUrl);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }
    if (url.searchParams.get("v")) {
      return url.searchParams.get("v");
    }
    const embedMatch = url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/);
    return embedMatch ? embedMatch[1] : "";
  } catch {
    const looseMatch = videoUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
    return looseMatch ? looseMatch[1] : "";
  }
}

function initializeYouTubePlayer(videoId) {
  elements.playerFrame.classList.add("has-player");

  if (!window.YT || typeof YT.Player !== "function") {
    setStatus("A API do YouTube ainda esta carregando. Tentando novamente...");
    setTimeout(() => initializeYouTubePlayer(videoId), 300);
    return;
  }

  if (player && typeof player.loadVideoById === "function") {
    isPlayerReady = true;
    player.cueVideoById(videoId);
    player.pauseVideo();
    if (currentPlaybackRate) {
      player.setPlaybackRate(currentPlaybackRate);
    }
    cachedPlayerState = YT.PlayerState.PAUSED;
    const startTime = pendingPlayerSeekSeconds !== null ? pendingPlayerSeekSeconds : 0;
    if (startTime > 0 && typeof player.seekTo === "function") {
      player.seekTo(startTime, true);
    }
    setTimeAnchor(startTime);
    updateBlockProgress(startTime);
    pendingPlayerSeekSeconds = null;
    startSyncLoop();
    setStatus("Novo video carregado. Escolha um trecho ou pressione Play.");
    return;
  }

  isPlayerReady = false;
  player = new YT.Player("player", {
    videoId,
    width: "100%",
    height: "100%",
    playerVars: {
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => {
        isPlayerReady = true;
        player.pauseVideo();
        if (currentPlaybackRate) {
          player.setPlaybackRate(currentPlaybackRate);
        }
        cachedPlayerState = YT.PlayerState.PAUSED;
        if (pendingPlayerSeekSeconds !== null) {
          player.seekTo(pendingPlayerSeekSeconds, true);
          setTimeAnchor(pendingPlayerSeekSeconds);
          updateBlockProgress(pendingPlayerSeekSeconds);
          pendingPlayerSeekSeconds = null;
        } else {
          syncTimeAnchor();
        }
        startSyncLoop();
        setStatus("Player pronto. Escolha um trecho ou pressione Play.");
      },
      onStateChange: handlePlayerStateChange
    }
  });
}

function renderBlockList() {
  elements.blockList.innerHTML = "";
  const listItems = getVisibleListItems();
  elements.blockCount.textContent = appMode === "quiz"
    ? `${listItems.length} perguntas`
    : `${listItems.length} blocos`;

  listItems.forEach((listItem) => {
    const block = lessonData.blocks[listItem.blockIndex];
    const item = document.createElement("button");
    item.type = "button";
    item.className = "block-item";
    item.dataset.index = String(listItem.blockIndex);
    item.dataset.quizIndex = String(listItem.quizItemIndex);
    item.setAttribute("role", "listitem");
    const preview = appMode === "quiz"
      ? getQuizQuestionText(listItem.question)
      : block.original;
    item.innerHTML = `
      <span class="block-meta">
        <strong class="block-number">${appMode === "quiz" ? `Pergunta ${listItem.quizItemIndex + 1}` : `Trecho ${listItem.blockIndex + 1}`}</strong>
        <span class="block-time">${formatTime(block.start)} - ${formatTime(block.end)}</span>
      </span>
      <span class="block-preview">${escapeHtml(truncate(preview, 100))}</span>
    `;
    item.addEventListener("click", () => {
      if (appMode === "quiz") {
        currentQuizItemIndex = listItem.quizItemIndex;
      }
      showBlock(listItem.blockIndex);
      lastExplicitBlockIndex = listItem.blockIndex;
      suppressTimeSyncUntil = Date.now() + 600;
      if (shouldPlayOnBlockSelect) {
        playBlock(listItem.blockIndex);
      } else if (isPlayerReady) {
        const targetTime = lessonData.blocks[listItem.blockIndex].start;
        setTimeAnchor(targetTime);
        player.seekTo(targetTime, true);
        updateBlockProgress(targetTime);
        scheduleLessonContextSave();
      }
    });
    elements.blockList.appendChild(item);
  });

  highlightCurrentBlock(currentBlockIndex);
}

function getVisibleListItems() {
  if (!lessonData) {
    return [];
  }

  if (appMode === "quiz") {
    return quizItems.map((item, index) => ({ ...item, quizItemIndex: index }));
  }

  return lessonData.blocks.map((_, index) => ({ blockIndex: index, quizItemIndex: -1 }));
}

function setAppMode(mode, options = {}) {
  appMode = mode === "quiz" ? "quiz" : "study";
  updateModeControls();

  if (!lessonData) {
    renderModeShell();
    return;
  }

  if (appMode === "quiz") {
    rebuildQuizItems({ keepCurrent: true });
    if (!quizItems.length) {
      setStatus("Nenhuma pergunta disponivel nesta aula.", true);
      appMode = "study";
      updateModeControls();
      renderModeShell();
      showBlock(currentBlockIndex);
      renderBlockList();
      return;
    }

    if (options.startAtFirst && quizItems.length) {
      currentQuizItemIndex = 0;
    } else if (options.autoSelect || !isCurrentQuizItemValid()) {
      currentQuizItemIndex = findQuizItemIndexAtOrAfterBlock(currentBlockIndex);
    }
    currentBlockIndex = quizItems[currentQuizItemIndex].blockIndex;
  }

  renderModeShell();
  renderBlockList();
  showBlock(currentBlockIndex);
  scheduleLessonContextSave();
}

function renderModeShell() {
  const isQuiz = appMode === "quiz";
  document.querySelector(".caption-stage").classList.toggle("quiz-active", isQuiz);
  elements.englishZone.classList.toggle("is-hidden", isQuiz);
  elements.meaningZone.classList.toggle("is-hidden", isQuiz);
  elements.quizZone.classList.toggle("is-hidden", !isQuiz);
  elements.questionModeButton.classList.toggle("is-hidden", !isQuiz);
  elements.autoPauseToggle.closest("label").classList.toggle("is-hidden", isQuiz);
  elements.translationToggle.classList.toggle("is-hidden", isQuiz);
  elements.translationToggle.closest("label").classList.toggle("is-hidden", isQuiz);
  elements.notesToggle.closest("label").classList.toggle("is-hidden", isQuiz);
}

function updateModeControls() {
  elements.modeToggleButton.textContent = appMode === "quiz" ? "Modo: Quiz" : "Modo: Estudo";
  elements.questionModeButton.textContent =
    questionMode === "en" ? "Pergunta: ingles" : "Pergunta: traducao";
}

function rebuildQuizItems(options = {}) {
  const previousBlockIndex = currentBlockIndex;
  const previousQuestionId = quizItems[currentQuizItemIndex]?.question?.id;

  quizItems = lessonData
    ? lessonData.blocks.flatMap((block, blockIndex) => {
        return block.questions.map((question, questionIndex) => ({
          blockIndex,
          questionIndex,
          question
        }));
      })
    : [];

  if (!quizItems.length) {
    currentQuizItemIndex = 0;
    return;
  }

  if (options.keepCurrent && previousQuestionId) {
    const sameQuestionIndex = quizItems.findIndex((item) => item.question.id === previousQuestionId);
    if (sameQuestionIndex !== -1) {
      currentQuizItemIndex = sameQuestionIndex;
      return;
    }
  }

  if (options.keepCurrent) {
    currentQuizItemIndex = findQuizItemIndexAtOrAfterBlock(previousBlockIndex);
  }
}

function isCurrentQuizItemValid() {
  return Boolean(quizItems[currentQuizItemIndex]);
}

function findQuizItemIndexAtOrAfterBlock(blockIndex) {
  if (!quizItems.length) {
    return 0;
  }

  const index = quizItems.findIndex((item) => item.blockIndex >= blockIndex);
  return index === -1 ? 0 : index;
}

function getQuizQuestionText(question) {
  if (!question) {
    return "";
  }
  return questionMode === "pt"
    ? question.questionPt || question.questionEn
    : question.questionEn || question.questionPt;
}

function getQuizOptionText(option) {
  if (!option || typeof option !== "object") {
    return String(option || "");
  }
  return questionMode === "pt" ? option.pt || option.en : option.en || option.pt;
}

function renderQuizForCurrentBlock() {
  if (!lessonData || appMode !== "quiz") {
    return;
  }

  if (!quizItems.length) {
    elements.quizQuestionCounter.textContent = "Pergunta --";
    elements.quizScore.textContent = "0 respondidas · 0%";
    elements.quizQuestionText.textContent = "Nenhuma pergunta disponivel nesta aula.";
    elements.quizOptions.innerHTML = "";
    elements.quizFeedback.textContent = "";
    elements.confirmQuizButton.disabled = true;
    requestAnimationFrame(fitQuizToStage);
    return;
  }

  const item = quizItems[currentQuizItemIndex];
  if (!item) {
    elements.quizQuestionText.textContent = "Pergunta nao encontrada.";
    elements.quizOptions.innerHTML = "";
    elements.confirmQuizButton.disabled = true;
    requestAnimationFrame(fitQuizToStage);
    return;
  }

  const block = lessonData.blocks[item.blockIndex];
  const question = item.question;
  currentBlockIndex = item.blockIndex;

  const answer = quizAnswers[getQuizAnswerKey(item)];
  elements.blockCounter.textContent = `Pergunta ${currentQuizItemIndex + 1} de ${quizItems.length}`;
  elements.timeRange.textContent = `${formatTime(block.start)} - ${formatTime(block.end)}`;
  elements.quizQuestionCounter.textContent = `Pergunta ${currentQuizItemIndex + 1} de ${quizItems.length}`;
  elements.quizQuestionText.textContent = getQuizQuestionText(question);
  elements.quizScore.textContent = formatQuizProgress(getQuizScore());
  elements.quizFeedback.textContent = answer
    ? answer.isCorrect
      ? "Resposta correta."
      : "Resposta incorreta."
    : "";
  elements.quizOptions.innerHTML = "";
  elements.quizOptions.scrollTop = 0;

  if (question.kind === "choice") {
    renderChoiceQuestion(item, question, answer);
  } else {
    renderTypedQuestion(question, answer);
  }

  requestAnimationFrame(fitQuizToStage);
}

function renderChoiceQuestion(item, question, answer) {
  elements.confirmQuizButton.disabled = true;
  const optionOrder = getQuizOptionOrder(item, question);

  optionOrder.forEach((optionIndex) => {
    const option = question.options[optionIndex];
    const label = document.createElement("label");
    label.className = "quiz-option";
    const isSelected = answer && answer.selectedOptionIndex === optionIndex;
    const isCorrect = optionIndex === question.correctOptionIndex;
    label.classList.toggle("selected", Boolean(isSelected));
    label.classList.toggle("correct", Boolean(answer && isCorrect));
    label.classList.toggle("incorrect", Boolean(answer && isSelected && !isCorrect));
    label.innerHTML = `
      <input type="radio" name="quizOption" value="${optionIndex}" ${answer ? "disabled" : ""} ${isSelected ? "checked" : ""}>
      <span>${escapeHtml(getQuizOptionText(option))}</span>
    `;
    const radio = label.querySelector("input");
    if (radio) {
      radio.addEventListener("change", () => {
        elements.quizOptions.querySelectorAll(".quiz-option").forEach((optionItem) => {
          optionItem.classList.remove("selected");
        });
        label.classList.add("selected");
        elements.confirmQuizButton.disabled = false;
      });
    }
    elements.quizOptions.appendChild(label);
  });

  if (answer) {
    elements.confirmQuizButton.disabled = true;
  }
}

function renderTypedQuestion(question, answer) {
  const item = quizItems[currentQuizItemIndex];
  const key = item ? getQuizAnswerKey(item) : "";
  const wrapper = document.createElement("div");
  wrapper.className = `quiz-typed ${answer ? (answer.isCorrect ? "correct" : "incorrect") : ""}`;

  if (question.kind === "discovery") {
    wrapper.appendChild(renderDiscoveryQuestion(question, answer, key));
  } else {
    wrapper.appendChild(renderFillQuestion(question, answer, key));
  }

  elements.quizOptions.appendChild(wrapper);
  elements.confirmQuizButton.disabled = Boolean(answer) || !hasAllTypedInputsFilled();

  wrapper.querySelectorAll(".quiz-text-input").forEach((input) => {
    input.addEventListener("input", () => {
      saveTypedDraft(key);
      elements.confirmQuizButton.disabled = !hasAllTypedInputsFilled();
      handleTypedInputProgress(input);
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== " ") {
        return;
      }

      const expected = input.dataset.expected || "";
      const expectedHasSpace = /\s/.test(expected.trim());
      const shouldAdvanceOnSpace =
        input.dataset.advanceOnSpace === "true"
          ? !expectedHasSpace || isTypedAnswerCorrect(input.value, expected)
          : isTypedAnswerCorrect(input.value, expected);

      if (shouldAdvanceOnSpace) {
        event.preventDefault();
        focusNextQuizTarget(input);
      }
    });
  });
}

function renderFillQuestion(question, answer, key) {
  const container = document.createElement("div");
  container.className = "quiz-fill-list";
  let answerCursor = 0;
  const draftAnswers = getTypedDraft(key);

  const studied = [...(question.expressionsStudied || []), ...(question.wordsStudied || [])];
  if (studied.length) {
    const pill = document.createElement("p");
    pill.className = "quiz-type-hint";
    pill.textContent = `${question.type === "vocabulary_fill" ? "Dica de vocabulario" : "Dica de expressao"}: ${studied.map(makePartialHint).join(", ")}`;
    container.appendChild(pill);
  }

  question.items.forEach((fillItem, itemIndex) => {
    const card = document.createElement("div");
    card.className = "quiz-fill-card";
    const fields = fillItem.answers.map((expected, answerIndex) => {
      const value = answer?.typedAnswers?.[answerCursor] || draftAnswers[answerCursor] || "";
      const isCorrect = answer ? isTypedAnswerCorrect(value, expected) : false;
      const inputHtml = `
        <input
          class="quiz-text-input ${answer ? (isCorrect ? "correct" : "incorrect") : ""}"
          type="text"
          autocomplete="off"
          data-answer-index="${answerCursor}"
          data-expected="${escapeHtml(expected)}"
          data-advance-on-space="true"
          value="${escapeHtml(value)}"
          placeholder="${escapeHtml(`lacuna ${answerIndex + 1}`)}"
          ${answer ? "disabled" : ""}
        >
      `;
      answerCursor += 1;
      return inputHtml;
    }).join("");

    card.innerHTML = `
      <p class="quiz-fill-translation">${escapeHtml(fillItem.translation || `Exemplo ${itemIndex + 1}`)}</p>
      <p class="quiz-fill-sentence">${escapeHtml(fillItem.toFill)}</p>
      <div class="quiz-input-row">${fields}</div>
    `;
    container.appendChild(card);
  });

  if (answer) {
    container.appendChild(renderExpectedAnswerHint(question.expectedAnswers));
  }

  return container;
}

function renderDiscoveryQuestion(question, answer, key) {
  const container = document.createElement("div");
  container.className = "quiz-discovery";
  const draftAnswers = getTypedDraft(key);

  const value = answer?.typedAnswers?.[0] || draftAnswers[0] || "";
  const isCorrect = answer ? isTypedAnswerCorrect(value, question.answer) : false;
  const inputRow = document.createElement("div");
  inputRow.className = "quiz-input-row discovery-input-row";
  inputRow.innerHTML = `
    <input
      class="quiz-text-input ${answer ? (isCorrect ? "correct" : "incorrect") : ""}"
      type="text"
      autocomplete="off"
      data-answer-index="0"
      data-expected="${escapeHtml(question.answer)}"
      value="${escapeHtml(value)}"
      placeholder="${question.targetType === "vocabulary" ? "palavra" : "expressao"} ${makePartialHint(question.answer)}"
      ${answer ? "disabled" : ""}
    >
  `;
  container.appendChild(inputRow);

  if (answer) {
    const details = question.answerPt ? [`${question.answer} = ${question.answerPt}`] : [question.answer];
    container.appendChild(renderExpectedAnswerHint(details));
  }

  question.items.forEach((fillItem, index) => {
    const card = document.createElement("div");
    card.className = "quiz-fill-card";
    card.innerHTML = `
      <p class="quiz-fill-translation">${escapeHtml(fillItem.translation || `Exemplo ${index + 1}`)}</p>
      <p class="quiz-fill-sentence">${escapeHtml(fillItem.toFill)}</p>
    `;
    container.appendChild(card);
  });

  return container;
}

function renderExpectedAnswerHint(answers) {
  const hint = document.createElement("p");
  hint.className = "quiz-answer-hint";
  hint.textContent = `Resposta: ${answers.join(" / ")}`;
  return hint;
}

function handleTypedInputProgress(input) {
  const expected = input.dataset.expected || "";
  if (!expected) {
    return;
  }

  input.classList.toggle("complete", isTypedAnswerCorrect(input.value, expected));
  if (isTypedAnswerCorrect(input.value, expected)) {
    focusNextQuizTarget(input);
  }
}

function focusNextQuizTarget(input) {
  const inputs = Array.from(elements.quizOptions.querySelectorAll(".quiz-text-input:not(:disabled)"));
  const index = inputs.indexOf(input);
  const nextInput = inputs[index + 1];
  if (nextInput) {
    nextInput.focus();
    nextInput.select();
    return;
  }
  elements.confirmQuizButton.focus();
}

function makePartialHint(value) {
  const text = String(value || "");
  const letterIndexes = Array.from(text)
    .map((char, index) => (/[A-Za-zÀ-ÿ0-9]/.test(char) ? index : -1))
    .filter((index) => index !== -1);
  const revealCount = Math.max(1, Math.floor(letterIndexes.length * 0.3));
  const revealIndexes = new Set();

  if (letterIndexes.length) {
    revealIndexes.add(letterIndexes[Math.floor(letterIndexes.length / 2)]);
  }
  for (let index = 1; revealIndexes.size < revealCount && index < letterIndexes.length; index += 2) {
    revealIndexes.add(letterIndexes[index]);
  }

  return Array.from(text)
    .map((char, index) => {
      if (!/[A-Za-zÀ-ÿ0-9]/.test(char)) {
        return char;
      }
      return revealIndexes.has(index) ? char : "_";
    })
    .join("");
}

function confirmQuizAnswer() {
  if (appMode !== "quiz" || !lessonData) {
    return;
  }

  const item = quizItems[currentQuizItemIndex];
  const question = item && item.question;
  if (!item || !question || quizAnswers[getQuizAnswerKey(item)]) {
    return;
  }

  if (question.kind !== "choice") {
    const typedAnswers = getTypedInputValues();
    if (!typedAnswers.length || typedAnswers.some((value) => !value.trim())) {
      setStatus("Preencha a resposta antes de confirmar.", true);
      return;
    }

    const key = getQuizAnswerKey(item);
    quizAnswers[key] = {
      typedAnswers,
      isCorrect: isTypedQuestionCorrect(question, typedAnswers)
    };
    delete quizDraftAnswers[key];
    saveLessonContextNow().catch((error) => console.error("Falha ao salvar resposta:", error));
    renderQuizForCurrentBlock();
    maybeShowQuizResult();
    return;
  }

  const selectedInput = elements.quizOptions.querySelector("input[name='quizOption']:checked");
  if (!selectedInput) {
    setStatus("Escolha uma resposta antes de confirmar.", true);
    return;
  }

  const selectedOptionIndex = Number(selectedInput.value);
  quizAnswers[getQuizAnswerKey(item)] = {
    selectedOptionIndex,
    isCorrect: selectedOptionIndex === question.correctOptionIndex
  };
  saveLessonContextNow().catch((error) => console.error("Falha ao salvar resposta:", error));
  renderQuizForCurrentBlock();
  maybeShowQuizResult();
}

function getTypedInputValues() {
  return Array.from(elements.quizOptions.querySelectorAll(".quiz-text-input"))
    .sort((a, b) => Number(a.dataset.answerIndex) - Number(b.dataset.answerIndex))
    .map((input) => input.value.trim());
}

function getTypedDraft(key) {
  return key && Array.isArray(quizDraftAnswers[key]) ? quizDraftAnswers[key] : [];
}

function saveTypedDraft(key) {
  if (!key || quizAnswers[key]) {
    return;
  }
  quizDraftAnswers[key] = getTypedInputValues();
  scheduleLessonContextSave(5000);
}

function hasAllTypedInputsFilled() {
  const inputs = Array.from(elements.quizOptions.querySelectorAll(".quiz-text-input"));
  return inputs.length > 0 && inputs.every((input) => input.value.trim());
}

function isTypedQuestionCorrect(question, typedAnswers) {
  if (question.kind === "discovery") {
    return isTypedAnswerCorrect(typedAnswers[0], question.answer);
  }

  return question.expectedAnswers.every((expected, index) => {
    return isTypedAnswerCorrect(typedAnswers[index], expected);
  });
}

function isTypedAnswerCorrect(value, expected) {
  return normalizeTypedAnswer(value) === normalizeTypedAnswer(expected);
}

function normalizeTypedAnswer(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQuizAnswerKey(item) {
  const block = lessonData.blocks[item.blockIndex];
  return `${block.id}:${item.question.id || item.questionIndex}`;
}

function getQuizOptionOrder(item, question) {
  const key = getQuizAnswerKey(item);
  const currentOrder = quizOptionOrders[key];
  if (Array.isArray(currentOrder) && currentOrder.length === question.options.length) {
    return currentOrder;
  }

  const order = shuffleIndexes(question.options.length);
  quizOptionOrders[key] = order;
  return order;
}

function shuffleIndexes(length) {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = getUnbiasedRandomInt(index + 1);
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
}

function getUnbiasedRandomInt(maxExclusive) {
  if (maxExclusive <= 1) {
    return 0;
  }

  if (window.crypto && typeof window.crypto.getRandomValues === "function") {
    const range = 0x100000000;
    const limit = range - (range % maxExclusive);
    const buffer = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function getQuizScore() {
  const eligibleKeys = new Set(quizItems.map((item) => getQuizAnswerKey(item)));
  const answeredKeys = Object.keys(quizAnswers).filter((key) => eligibleKeys.has(key));
  const correct = answeredKeys.filter((key) => quizAnswers[key].isCorrect).length;
  return { answered: answeredKeys.length, correct, total: quizItems.length };
}

function formatQuizProgress(score) {
  const percent = score.answered ? Math.round((score.correct / score.answered) * 100) : 0;
  return `${score.answered} respondidas · ${percent}%`;
}

function maybeShowQuizResult() {
  const score = getQuizScore();
  if (!score.total || score.answered < score.total) {
    return;
  }

  const percent = Math.round((score.correct / score.total) * 100);
  showResultOverlay(percent);
}

function showResultOverlay(percent) {
  clearTimeout(resultOverlayTimer);
  const passed = percent >= 80;
  elements.resultTitle.textContent = passed ? "Parabens!" : "Tente de novo";
  elements.resultText.textContent = passed
    ? `Voce acertou ${percent}% das perguntas. Excelente trabalho.`
    : `Voce acertou ${percent}%. Revise os trechos e tente novamente para chegar a 80%.`;
  elements.resultOverlay.classList.remove("is-hidden");
  resultOverlayTimer = setTimeout(hideResultOverlay, 5200);
}

function hideResultOverlay() {
  clearTimeout(resultOverlayTimer);
  elements.resultOverlay.classList.add("is-hidden");
}

function moveToQuizItem(index, options = {}) {
  if (!quizItems.length) {
    setStatus("Nenhuma pergunta disponivel nesta aula.", true);
    renderQuizForCurrentBlock();
    return;
  }

  const nextPosition = Number(index);

  if (nextPosition < 0 || nextPosition >= quizItems.length) {
    maybeShowQuizResult();
    setStatus("Voce chegou ao fim das perguntas.");
    return;
  }

  currentQuizItemIndex = nextPosition;
  const nextItem = quizItems[currentQuizItemIndex];
  const nextBlockIndex = nextItem.blockIndex;
  if (options.play) {
    playBlock(nextBlockIndex);
  } else {
    showBlock(nextBlockIndex);
    if (isPlayerReady) {
      setTimeAnchor(lessonData.blocks[nextBlockIndex].start);
      player.seekTo(lessonData.blocks[nextBlockIndex].start, true);
      updateBlockProgress(lessonData.blocks[nextBlockIndex].start);
    }
  }
}

async function restoreActiveLessonSelection() {
  const activeLessonId = String(remoteUserContext?.activeLessonId || "");
  if (!activeLessonId || !availableLessons.some((lesson) => String(lesson.id) === activeLessonId)) {
    return false;
  }

  elements.lessonSelect.value = activeLessonId;
  if (currentLessonStorageId === activeLessonId && lessonData) {
    elements.loadLessonButton.disabled = false;
    return true;
  }

  await loadLessonFromDatabase(activeLessonId);
  return true;
}

function makeLessonStorageId(data, label) {
  const title = String(data.title || label || "aula").trim().toLowerCase();
  const videoId = extractYouTubeVideoId(data.videoUrl || "");
  return `local:${videoId || title || "sem-video"}`;
}

function scheduleLessonContextSave(delay = 2000) {
  if (isRestoringLessonContext || !lessonData || !currentLessonStorageId) {
    return;
  }

  clearTimeout(contextSaveTimer);
  contextSaveTimer = setTimeout(() => {
    saveLessonContextNow().catch((error) => console.error("Falha ao salvar contexto:", error));
  }, delay);
}

async function saveLessonContextNow() {
  if (!lessonData || !currentLessonStorageId) {
    return;
  }

  clearTimeout(contextSaveTimer);
  const context = createRemoteUserContext();
  remoteUserContext = context;
  contextSavePromise = contextSavePromise
    .catch(() => undefined)
    .then(() =>
      requestJson("/api/user/context", {
        method: "PUT",
        body: JSON.stringify({ context }),
        requireAuth: true
      })
    );
  await contextSavePromise;
}

function saveLessonContextOnUnload() {
  if (!lessonData || !currentLessonStorageId) {
    return;
  }

  const token = storageGet(USER_TOKEN_KEY);
  if (!token) {
    return;
  }

  const apiBase = API_BASES[0] || "";
  fetch(`${apiBase}/api/user/context`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ context: createRemoteUserContext() }),
    keepalive: true
  }).catch(() => undefined);
}

function createRemoteUserContext() {
  return {
    version: 1,
    activeLessonId: currentLessonStorageId,
    lessonContext: createLessonContextSnapshot()
  };
}

function createLessonContextSnapshot() {
  const item = quizItems[currentQuizItemIndex];
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    signature: getLessonContextSignature(),
    currentBlockIndex,
    currentQuizItemIndex,
    currentQuizAnswerKey: item ? getQuizAnswerKey(item) : "",
    currentTime: getCurrentContextTime(),
    appMode,
    questionMode,
    autoPauseEnabled,
    autoPausedForCurrentBlock,
    currentPlaybackRate,
    translationVisible: elements.translationToggle.checked,
    notesVisible: elements.notesToggle.checked,
    quizAnswers,
    quizDraftAnswers,
    quizOptionOrders
  };
}

function getCurrentContextTime() {
  if (!lessonData) {
    return 0;
  }

  const block = lessonData.blocks[currentBlockIndex];
  if (!block) {
    return 0;
  }

  const currentTime = getEstimatedCurrentTime();
  if (!Number.isFinite(currentTime)) {
    return block.start;
  }
  return clamp(currentTime, block.start, block.end);
}

function getLessonContextSignature() {
  return {
    videoUrl: lessonData?.videoUrl || "",
    blockCount: lessonData?.blocks?.length || 0,
    quizCount: quizItems.length
  };
}

function applyLessonContext(context) {
  if (!context || context.version !== 1 || !isSameLessonSignature(context.signature)) {
    return;
  }

  isRestoringLessonContext = true;
  const allowedAnswerKeys = new Set(quizItems.map((item) => getQuizAnswerKey(item)));
  quizAnswers = filterObjectByKeys(context.quizAnswers, allowedAnswerKeys);
  quizDraftAnswers = filterDraftAnswers(context.quizDraftAnswers, allowedAnswerKeys);
  quizOptionOrders = filterObjectByKeys(context.quizOptionOrders, allowedAnswerKeys);
  questionMode = context.questionMode === "pt" ? "pt" : "en";
  appMode = context.appMode === "quiz" ? "quiz" : "study";
  autoPauseEnabled = context.autoPauseEnabled !== false;
  autoPausedForCurrentBlock = Boolean(context.autoPausedForCurrentBlock);
  currentPlaybackRate = clamp(Number(context.currentPlaybackRate) || 1, 0.25, 2);
  elements.autoPauseToggle.checked = autoPauseEnabled;
  elements.translationToggle.checked = context.translationVisible !== false;
  elements.notesToggle.checked = context.notesVisible !== false;

  currentBlockIndex = clampInteger(context.currentBlockIndex, 0, lessonData.blocks.length - 1);
  currentQuizItemIndex = findRestoredQuizItemIndex(context);
  if (appMode === "quiz" && quizItems[currentQuizItemIndex]) {
    currentBlockIndex = quizItems[currentQuizItemIndex].blockIndex;
  }
  lastExplicitBlockIndex = currentBlockIndex;

  const restoredBlock = lessonData.blocks[currentBlockIndex];
  const restoredTime = clamp(
    Number(context.currentTime) || restoredBlock.start,
    restoredBlock.start,
    restoredBlock.end
  );
  setTimeAnchor(restoredTime);
  pendingPlayerSeekSeconds = restoredTime;
  isRestoringLessonContext = false;
}

function isSameLessonSignature(signature) {
  const current = getLessonContextSignature();
  return Boolean(
    signature &&
      signature.videoUrl === current.videoUrl &&
      signature.blockCount === current.blockCount &&
      signature.quizCount === current.quizCount
  );
}

function findRestoredQuizItemIndex(context) {
  const key = String(context.currentQuizAnswerKey || "");
  if (key) {
    const index = quizItems.findIndex((item) => getQuizAnswerKey(item) === key);
    if (index !== -1) {
      return index;
    }
  }

  return clampInteger(context.currentQuizItemIndex, 0, Math.max(quizItems.length - 1, 0));
}

function filterObjectByKeys(value, allowedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => allowedKeys.has(key))
  );
}

function filterDraftAnswers(value, allowedKeys) {
  const filtered = filterObjectByKeys(value, allowedKeys);
  return Object.fromEntries(
    Object.entries(filtered).filter(([, draft]) => Array.isArray(draft))
  );
}

function clampInteger(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.round(clamp(number, min, max));
}

function storageGet(key) {
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function storageRemove(key) {
  try {
    if (window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Prefer keeping the app usable even if storage is unavailable.
  }
}

function clearLegacyLessonContext() {
  try {
    if (!window.localStorage) {
      return;
    }

    const keysToRemove = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (
        key &&
        (key.startsWith(LEGACY_CONTEXT_PREFIX) ||
          key === "shadowingActiveLessonId" ||
          key === "shadowingQuestionMode")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Prefer keeping the app usable even if storage is unavailable.
  }
}

function showBlock(index) {
  if (!lessonData || !lessonData.blocks[index]) {
    return;
  }

  currentBlockIndex = index;
  autoPausedForCurrentBlock = false;

  const block = lessonData.blocks[index];
  const previousBlock = lessonData.blocks[index - 1];
  const nextBlock = lessonData.blocks[index + 1];

  elements.blockCounter.textContent = `Trecho ${index + 1} de ${lessonData.blocks.length}`;
  elements.timeRange.textContent = `${formatTime(block.start)} - ${formatTime(block.end)}`;
  elements.previousOriginalText.textContent = previousBlock
    ? makeContextSnippet(previousBlock.original, "tail")
    : "";
  elements.originalText.textContent = block.original;
  elements.nextOriginalText.textContent = nextBlock ? makeContextSnippet(nextBlock.original, "head") : "";
  elements.translationText.textContent = block.translation;
  elements.notesText.innerHTML = formatNotesHtml(block.notes);

  elements.translationText.classList.toggle("is-hidden", !elements.translationToggle.checked);
  elements.notesText.classList.toggle("is-hidden", !elements.notesToggle.checked);

  highlightCurrentBlock(index);
  updateBlockProgress(block.start);
  if (appMode === "quiz") {
    renderQuizForCurrentBlock();
  }
  requestAnimationFrame(fitCaptionToStage);
  scheduleLessonContextSave();
}

function playBlock(index) {
  if (!lessonData) {
    setStatus("Carregue uma aula antes de tocar.", true);
    return;
  }

  if (index < 0 || index >= lessonData.blocks.length) {
    if (appMode === "study" && index >= lessonData.blocks.length) {
      finishStudyAndStartQuiz();
      return;
    }
    setStatus("Nao ha outro trecho nessa direcao.", true);
    return;
  }

  if (!isPlayerReady) {
    setStatus("O player ainda nao esta pronto. Tente novamente em instantes.", true);
    return;
  }

  showBlock(index);
  lastExplicitBlockIndex = index;
  suppressTimeSyncUntil = Date.now() + 320;
  shouldPlayOnBlockSelect = true;
  setTimeAnchor(lessonData.blocks[index].start);
  player.seekTo(lessonData.blocks[index].start, true);
  player.playVideo();
  cachedPlayerState = YT.PlayerState.PLAYING;
  updateBlockProgress(lessonData.blocks[index].start);
  updatePlayPauseLabel();
  scheduleLessonContextSave();
}

function repeatCurrentBlock() {
  const index = lastExplicitBlockIndex;
  playBlock(index);
}

function continueToNextBlock() {
  if (appMode === "quiz") {
    moveToQuizItem(currentQuizItemIndex + 1, { play: true });
    return;
  }

  const nextIndex = currentBlockIndex + 1;
  if (!lessonData || nextIndex >= lessonData.blocks.length) {
    finishStudyAndStartQuiz();
    return;
  }
  playBlock(nextIndex);
}

function finishStudyAndStartQuiz() {
  if (!lessonData) {
    return;
  }

  if (isPlayerReady && player && typeof player.pauseVideo === "function") {
    player.pauseVideo();
    cachedPlayerState = YT.PlayerState.PAUSED;
  }

  autoPausedForCurrentBlock = false;
  shouldPlayOnBlockSelect = false;
  setStatus("Voce chegou ao fim dos trechos. Iniciando o quiz.");
  setAppMode("quiz", { autoSelect: true, startAtFirst: true });
  updatePlayPauseLabel();
}

function updateCurrentBlockByTime(currentTime) {
  if (!lessonData || autoPauseEnabled || Date.now() < suppressTimeSyncUntil) {
    return;
  }

  const index = lessonData.blocks.findIndex(
    (block) => currentTime >= block.start && currentTime < block.end
  );

  if (index !== -1 && index !== currentBlockIndex) {
    showBlock(index);
    lastExplicitBlockIndex = index;
    updateBlockProgress(currentTime);
  }
}

function highlightCurrentBlock(index) {
  const items = elements.blockList.querySelectorAll(".block-item");
  items.forEach((item) => {
    const isActive = appMode === "quiz"
      ? Number(item.dataset.quizIndex) === currentQuizItemIndex
      : Number(item.dataset.index) === index;
    item.classList.toggle("active", isActive);
  });
}

function setPlaybackSpeed(rate) {
  const normalizedRate = Number(rate.toFixed(2));
  setTimeAnchor(getEstimatedCurrentTime());
  currentPlaybackRate = normalizedRate;

  if (isPlayerReady) {
    player.setPlaybackRate(normalizedRate);
  }

  elements.speedRange.value = String(normalizedRate);
  elements.speedValue.textContent = `${formatRate(normalizedRate)}x`;
}

function setTimeAnchor(seconds) {
  timeAnchorSeconds = Number(seconds) || 0;
  timeAnchorTimestamp = performance.now();
}

function syncTimeAnchor() {
  if (!isPlayerReady || !player || typeof player.getCurrentTime !== "function") {
    return timeAnchorSeconds;
  }

  const currentTime = player.getCurrentTime();
  setTimeAnchor(currentTime);
  lastApiSyncTimestamp = performance.now();
  updateBlockProgress(currentTime);
  return currentTime;
}

function getEstimatedCurrentTime() {
  if (isCachedPlaying()) {
    const elapsedSeconds = (performance.now() - timeAnchorTimestamp) / 1000;
    return timeAnchorSeconds + elapsedSeconds * currentPlaybackRate;
  }

  return timeAnchorSeconds;
}

function handlePlayerStateChange(event) {
  cachedPlayerState = event.data;
  syncTimeAnchor();
  updatePlayPauseLabel();
}

function updateBlockProgress(currentTime) {
  if (!lessonData || !elements.blockProgressRange) {
    return;
  }

  const block = lessonData.blocks[currentBlockIndex];
  if (!block) {
    updateBlockProgressPreview(0, 0);
    return;
  }

  const duration = getBlockDuration(block);
  const elapsed = clamp(Number(currentTime) - block.start, 0, duration);
  const percent = duration > 0 ? (elapsed / duration) * 100 : 0;

  if (!isScrubbingBlock) {
    elements.blockProgressRange.value = String(percent);
  }
  updateBlockProgressPreview(percent, elapsed);
}

function updateBlockProgressPreview(percent, explicitElapsed = null) {
  if (!lessonData) {
    elements.blockProgressTime.textContent = "00:00 / 00:00";
    elements.blockProgressRange.style.setProperty("--progress-fill", "0%");
    return;
  }

  const block = lessonData.blocks[currentBlockIndex];
  const duration = block ? getBlockDuration(block) : 0;
  const safePercent = clamp(Number(percent) || 0, 0, 100);
  const elapsed = explicitElapsed === null ? (duration * safePercent) / 100 : explicitElapsed;

  elements.blockProgressRange.style.setProperty("--progress-fill", `${safePercent}%`);
  elements.blockProgressTime.textContent = `${formatTime(Math.round(elapsed))} / ${formatTime(
    Math.round(duration)
  )}`;
}

function scheduleBlockProgressSeek(percent) {
  clearTimeout(blockSeekTimer);
  blockSeekTimer = setTimeout(() => seekToBlockProgress(percent), 90);
}

function seekToBlockProgress(percent) {
  if (!lessonData || !isPlayerReady) {
    return;
  }

  const block = lessonData.blocks[currentBlockIndex];
  if (!block) {
    return;
  }

  const duration = getBlockDuration(block);
  const targetTime = block.start + (duration * clamp(Number(percent) || 0, 0, 100)) / 100;
  const shouldResumeAfterAutoPause = isAutoPauseActive() && autoPausedForCurrentBlock;

  autoPausedForCurrentBlock = false;
  suppressTimeSyncUntil = Date.now() + 220;
  lastExplicitBlockIndex = currentBlockIndex;
  setTimeAnchor(targetTime);
  player.seekTo(targetTime, true);
  if (shouldResumeAfterAutoPause) {
    player.playVideo();
    cachedPlayerState = YT.PlayerState.PLAYING;
  }
  updateBlockProgress(targetTime);
  scheduleLessonContextSave();
}

function getBlockDuration(block) {
  return Math.max(0.01, Number(block.end) - Number(block.start));
}

function snapPlaybackRate(rate) {
  const friendlyRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const closest = friendlyRates.reduce((best, candidate) => {
    return Math.abs(candidate - rate) < Math.abs(best - rate) ? candidate : best;
  }, friendlyRates[0]);

  const snapRadius = closest === 1 ? 0.09 : closest === 0.75 ? 0.07 : 0.045;
  return Math.abs(closest - rate) <= snapRadius ? closest : Number(rate.toFixed(2));
}

function formatRate(rate) {
  return Number.isInteger(rate) ? String(rate) : String(rate).replace(/0$/, "");
}

function isCachedPlaying() {
  return window.YT && cachedPlayerState === YT.PlayerState.PLAYING;
}

function isAutoPauseActive() {
  return appMode === "quiz" || autoPauseEnabled;
}

function togglePlayPause() {
  if (!lessonData) {
    setStatus("Carregue uma aula antes de tocar.", true);
    return;
  }

  if (!isPlayerReady) {
    setStatus("O player ainda nao esta pronto.", true);
    return;
  }

  const state = player.getPlayerState();
  cachedPlayerState = state;
  syncTimeAnchor();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    cachedPlayerState = YT.PlayerState.PAUSED;
    scheduleLessonContextSave();
  } else {
    playFromCurrentButtonState();
  }
  updatePlayPauseLabel();
}

function playFromCurrentButtonState() {
  const block = lessonData.blocks[currentBlockIndex];
  const currentTime = getEstimatedCurrentTime();

  lastExplicitBlockIndex = currentBlockIndex;
  shouldPlayOnBlockSelect = true;

  if (!isAutoPauseActive()) {
    player.playVideo();
    cachedPlayerState = YT.PlayerState.PLAYING;
    return;
  }

  if (autoPausedForCurrentBlock || currentTime >= block.end) {
    repeatCurrentBlock();
    return;
  }

  if (currentTime >= block.start && currentTime < block.end) {
    player.playVideo();
    cachedPlayerState = YT.PlayerState.PLAYING;
    return;
  }

  playBlock(currentBlockIndex);
}

function startSyncLoop() {
  if (progressAnimationId) {
    cancelAnimationFrame(progressAnimationId);
  }

  const tick = () => {
    progressAnimationId = requestAnimationFrame(tick);

    if (!lessonData || !isPlayerReady) {
      return;
    }

    const now = performance.now();
    let currentTime = getEstimatedCurrentTime();
    const block = lessonData.blocks[currentBlockIndex];
    const lastBlock = lessonData.blocks[lessonData.blocks.length - 1];

    if (Date.now() < suppressTimeSyncUntil) {
      updateBlockProgress(currentTime);
      return;
    }

    if (appMode === "study" && block === lastBlock && currentTime >= lastBlock.end) {
      finishStudyAndStartQuiz();
      return;
    }

    if (isAutoPauseActive() && block && currentTime >= block.end) {
      if (!autoPausedForCurrentBlock || isCachedPlaying()) {
        player.pauseVideo();
        if (typeof player.seekTo === "function") {
          player.seekTo(block.end, true);
        }
        cachedPlayerState = YT.PlayerState.PAUSED;
        setTimeAnchor(block.end);
        autoPausedForCurrentBlock = true;
        lastExplicitBlockIndex = currentBlockIndex;
        setStatus("Trecho pausado. Repita ou continue para o proximo.");
        scheduleLessonContextSave();
      }
      updateBlockProgress(block.end);
      updatePlayPauseLabel();
      return;
    }

    if (!isAutoPauseActive()) {
      updateCurrentBlockByTime(currentTime);
      currentTime = getEstimatedCurrentTime();
    }

    if (block && currentTime < block.start - 0.4) {
      autoPausedForCurrentBlock = false;
    }

    if (isCachedPlaying() && now - lastApiSyncTimestamp > 1000 && !isScrubbingBlock) {
      currentTime = syncTimeAnchor();
    }

    updateBlockProgress(currentTime);
  };

  progressAnimationId = requestAnimationFrame(tick);
}

function updatePlayPauseLabel() {
  if (!isPlayerReady || !player) {
    elements.playPauseButton.textContent = "Play";
    return;
  }

  elements.playPauseButton.textContent = isCachedPlaying() ? "Pause" : "Play";
}

function fitCaptionToStage() {
  if (appMode === "quiz") {
    fitQuizToStage();
    return;
  }

  fitEnglishToStage();
  fitMeaningToStage();
}

function fitQuizToStage() {
  const zone = elements.quizZone;
  const question = elements.quizQuestionText;
  const options = elements.quizOptions;
  if (!zone || !question || !options || zone.classList.contains("is-hidden")) {
    return;
  }

  resetQuizFitStyles(zone, question, options);

  const optionItems = Array.from(options.querySelectorAll(".quiz-option"));
  const firstOption = optionItems[0];
  const actions = zone.querySelector(".quiz-actions");
  const zoneStyles = getComputedStyle(zone);
  const optionsStyles = getComputedStyle(options);
  const optionStyles = getComputedStyle(firstOption || options);
  const actionsStyles = getComputedStyle(actions || zone);
  const metaStyles = getComputedStyle(elements.quizQuestionCounter);

  let questionSize = Number.parseFloat(getComputedStyle(question).fontSize);
  let optionSize = Number.parseFloat(optionStyles.fontSize);
  let metaSize = Number.parseFloat(metaStyles.fontSize);
  let zoneGap = Number.parseFloat(zoneStyles.rowGap);
  let zonePadding = Number.parseFloat(zoneStyles.paddingTop);
  let optionGap = Number.parseFloat(optionsStyles.rowGap);
  let optionPadY = Number.parseFloat(optionStyles.paddingTop) || 0;
  let footerPad = Number.parseFloat(actionsStyles.paddingTop) || 0;

  const isCompact = window.matchMedia("(max-width: 620px)").matches;
  const minQuestionSize = isCompact ? 12.5 : 13.5;
  const minOptionSize = isCompact ? 11.5 : 12.5;
  const minMetaSize = isCompact ? 11 : 11.5;
  const minZoneGap = isCompact ? 3 : 4;
  const minZonePadding = isCompact ? 6 : 7;
  const minOptionGap = 3;
  const minOptionPadY = 2;
  const minFooterPad = 2;
  let attempts = 0;

  const applyQuizFit = () => {
    zone.style.setProperty("--quiz-gap", `${zoneGap}px`);
    zone.style.setProperty("--quiz-padding", `${zonePadding}px`);
    zone.style.setProperty("--quiz-meta-size", `${metaSize}px`);
    zone.style.setProperty("--quiz-footer-pad", `${footerPad}px`);
    question.style.setProperty("--quiz-question-size", `${questionSize}px`);
    options.style.setProperty("--quiz-option-size", `${optionSize}px`);
    options.style.setProperty("--quiz-option-gap", `${optionGap}px`);
    options.style.setProperty("--quiz-option-pad-y", `${optionPadY}px`);
  };

  applyQuizFit();

  while (attempts < 100 && hasQuizOverflow(zone, question, options, optionItems)) {
    const optionsOverflow = options.scrollHeight > options.clientHeight + 1 ||
      optionItems.some((item) => item.scrollHeight > item.clientHeight + 1);
    const questionOverflow = question.scrollWidth > question.clientWidth + 1;

    if (optionsOverflow && optionSize > minOptionSize) {
      optionSize -= 0.75;
    } else if (optionsOverflow && optionPadY > minOptionPadY) {
      optionPadY -= 0.75;
    } else if (optionsOverflow && optionGap > minOptionGap) {
      optionGap -= 0.75;
    } else if (questionOverflow && questionSize > minQuestionSize) {
      questionSize -= 0.9;
    } else if (zoneGap > minZoneGap) {
      zoneGap -= 0.75;
    } else if (zonePadding > minZonePadding) {
      zonePadding -= 0.75;
    } else if (footerPad > minFooterPad) {
      footerPad -= 0.75;
    } else if (metaSize > minMetaSize) {
      metaSize -= 0.5;
    } else if (questionSize > minQuestionSize) {
      questionSize -= 0.9;
    } else if (optionSize > minOptionSize) {
      optionSize -= 0.75;
    } else {
      break;
    }

    applyQuizFit();
    attempts += 1;
  }
}

function resetQuizFitStyles(zone, question, options) {
  [
    "--quiz-gap",
    "--quiz-padding",
    "--quiz-meta-size",
    "--quiz-footer-pad"
  ].forEach((property) => zone.style.removeProperty(property));
  question.style.removeProperty("--quiz-question-size");
  [
    "--quiz-option-size",
    "--quiz-option-gap",
    "--quiz-option-pad-y"
  ].forEach((property) => options.style.removeProperty(property));
}

function hasQuizOverflow(zone, question, options, optionItems) {
  const optionsStyles = getComputedStyle(options);
  const optionsCanScrollY = ["auto", "scroll"].includes(optionsStyles.overflowY);
  return (
    zone.scrollHeight > zone.clientHeight + 1 ||
    zone.scrollWidth > zone.clientWidth + 1 ||
    question.scrollWidth > question.clientWidth + 1 ||
    (!optionsCanScrollY && options.scrollHeight > options.clientHeight + 1) ||
    options.scrollWidth > options.clientWidth + 1 ||
    optionItems.some((item) => item.scrollHeight > item.clientHeight + 1 ||
      item.scrollWidth > item.clientWidth + 1)
  );
}

function fitEnglishToStage() {
  const stage = elements.englishZone;
  const line = document.getElementById("englishLine");
  const original = elements.originalText;
  if (!stage || !line || !original) {
    return;
  }

  line.style.removeProperty("--caption-size");

  const styles = getComputedStyle(line);
  let size = Number.parseFloat(styles.fontSize);
  const minSize = window.matchMedia("(max-width: 620px)").matches ? 16 : 22;
  const spareRatio = 0.92;
  let attempts = 0;

  while (
    attempts < 60 &&
    size > minSize &&
    (stage.scrollHeight > stage.clientHeight + 1 ||
      stage.scrollWidth > stage.clientWidth + 1 ||
      line.scrollHeight > stage.clientHeight * spareRatio ||
      line.scrollWidth > stage.clientWidth + 1)
  ) {
    size -= 3;
    line.style.setProperty("--caption-size", `${size}px`);
    attempts += 1;
  }
}

function fitMeaningToStage() {
  const translation = elements.translationText;
  const notes = elements.notesText;
  if (!translation || !notes) {
    return;
  }

  translation.style.removeProperty("--translation-size");
  notes.style.removeProperty("--notes-size");

  let translationSize = Number.parseFloat(getComputedStyle(translation).fontSize);
  let notesSize = Number.parseFloat(getComputedStyle(notes).fontSize);
  const minTranslationSize = window.matchMedia("(max-width: 620px)").matches ? 12 : 13;
  const minNotesSize = window.matchMedia("(max-width: 620px)").matches ? 12 : 13;
  let attempts = 0;

  while (
    attempts < 42 &&
    translationSize > minTranslationSize &&
    (translation.scrollHeight > translation.clientHeight + 1 ||
      translation.scrollWidth > translation.clientWidth + 1)
  ) {
    translationSize -= 1.5;
    translation.style.setProperty("--translation-size", `${translationSize}px`);
    attempts += 1;
  }

  attempts = 0;
  while (
    attempts < 12 &&
    notesSize > minNotesSize &&
    notes.scrollWidth > notes.clientWidth + 1
  ) {
    notesSize -= 1;
    notes.style.setProperty("--notes-size", `${notesSize}px`);

    attempts += 1;
  }
}

function makeContextSnippet(text, direction) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const limit = 3;

  if (words.length <= limit) {
    return words.join(" ");
  }

  if (direction === "tail") {
    return words.slice(-limit).join(" ");
  }

  return words.slice(0, limit).join(" ");
}

function formatNotesHtml(notes) {
  if (!notes || typeof notes === "string") {
    return escapeHtml(notes || "Sem explicacao para este trecho.");
  }

  const sections = [];
  if (notes.interpretation) {
    sections.push(`<p>${escapeHtml(notes.interpretation)}</p>`);
  }
  if (notes.grammar && notes.grammar.length) {
    sections.push(formatNoteList("Gramatica", notes.grammar));
  }
  if (notes.vocabulary && notes.vocabulary.length) {
    sections.push(formatTermList("Vocabulario", notes.vocabulary));
  }
  if (notes.expressions && notes.expressions.length) {
    sections.push(formatTermList("Expressoes", notes.expressions));
  }

  return sections.length ? sections.join("") : "Sem explicacao para este trecho.";
}

function formatNoteList(title, items) {
  return `
    <section class="note-section">
      <strong>${escapeHtml(title)}</strong>
      <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function formatTermList(title, items) {
  return `
    <section class="note-section">
      <strong>${escapeHtml(title)}</strong>
      <ul>${items.map(formatTermItem).join("")}</ul>
    </section>
  `;
}

function formatTermItem(item) {
  const label = [item.term, item.meaningPt].filter(Boolean).join(" = ");
  const comment = item.comment ? `: ${item.comment}` : "";
  return `<li>${escapeHtml(`${label}${comment}`)}</li>`;
}

function setControlsEnabled(enabled) {
  [
    elements.playPauseButton,
    elements.repeatButton,
    elements.continueButton,
    elements.previousButton,
    elements.nextButton,
    elements.blockProgressRange
  ].forEach((button) => {
    button.disabled = !enabled;
  });
}

async function requestJson(url, options = {}) {
  let lastError = null;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = storageGet(USER_TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const { requireAuth, ...fetchOptions } = options;

  for (let index = 0; index < API_BASES.length; index += 1) {
    const apiBase = API_BASES[index];
    try {
      const response = await fetch(`${apiBase}${url}`, {
        ...fetchOptions,
        headers
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return data;
      }

      const error = new Error(data.error || "Nao foi possivel conversar com o banco.");
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

  throw lastError || new Error("Nao foi possivel conversar com o banco.");
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
  if (isLocalPage && location.port !== "21106") {
    return [
      "http://127.0.0.1:21106",
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

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("error", isError);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function truncate(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function debounce(callback, wait) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), wait);
  };
}
