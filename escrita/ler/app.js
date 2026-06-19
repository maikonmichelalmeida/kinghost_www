const READING_TITLE = "As a Man Thinketh - Part 001";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";

let currentReading = null;
let currentBlockIndex = 0;
let typingBox = null;

const elements = {
  practice: document.querySelector("[data-practice]"),
  blockPosition: document.querySelector("[data-block-position]"),
  blockTitle: document.querySelector("[data-block-title]"),
  portuguese: document.querySelector("[data-portuguese]"),
  smartInput: document.querySelector("[data-smart-input]"),
  typingShell: document.querySelector("[data-typing-shell]"),
  progressBar: document.querySelector("[data-progress-bar]"),
  stallMeter: document.querySelector("[data-stall-meter]"),
  stallBar: document.querySelector("[data-stall-bar]"),
  assistMessage: document.querySelector("[data-assist-message]"),
  prev: document.querySelector("[data-prev]"),
  next: document.querySelector("[data-next]"),
  showAnswer: document.querySelector("[data-show-answer]"),
  answerPanel: document.querySelector("[data-answer-panel]"),
  answerText: document.querySelector("[data-answer-text]"),
  loadError: document.querySelector("[data-load-error]")
};

elements.prev.addEventListener("click", () => navigateBlock(-1));
elements.next.addEventListener("click", () => navigateBlock(1));
elements.showAnswer.addEventListener("click", showCurrentAnswer);

loadReading();

async function loadReading() {
  try {
    const response = await fetch(`${getApiBase()}/api/public/leitura?titulo=${encodeURIComponent(READING_TITLE)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const reading = payload.content || JSON.parse(payload.json_content);
    currentReading = reading;
    currentBlockIndex = 0;
    window.currentReading = reading;
    window.currentReadingRecord = payload;

    renderReading();
    renderCurrentBlock();
  } catch (error) {
    console.error(error);
    elements.loadError.hidden = false;
    elements.loadError.textContent = String(error.message || error);
  }
}

function getApiBase() {
  const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  if (location.protocol === "file:" || (isLocal && location.port !== REMOTE_API_PORT)) {
    return `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`;
  }
  if (location.hostname === REMOTE_API_HOST && location.port !== REMOTE_API_PORT) {
    return `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`;
  }
  return "";
}

function renderReading() {
  elements.practice.hidden = false;
  elements.loadError.hidden = true;
}

function renderCurrentBlock() {
  const blocks = getBlocks();
  const block = blocks[currentBlockIndex];
  if (!block) return;

  elements.blockPosition.textContent = `Bloco ${currentBlockIndex + 1} de ${blocks.length}`;
  elements.blockTitle.textContent = currentReading.title || "";
  elements.portuguese.textContent = block.pt_br || block.traduzido || "";
  elements.answerPanel.hidden = true;
  elements.answerText.textContent = "";
  elements.prev.disabled = currentBlockIndex === 0;
  elements.next.disabled = currentBlockIndex === blocks.length - 1;

  if (!typingBox) {
    typingBox = new SmartTypingBox({
      input: elements.smartInput,
      shell: elements.typingShell,
      progressBar: elements.progressBar,
      stallMeter: elements.stallMeter,
      stallBar: elements.stallBar,
      message: elements.assistMessage
    });
    window.smartTypingBox = typingBox;
  }

  typingBox.setTarget(block.en || block.English || "");
  elements.smartInput.focus();
}

function navigateBlock(direction) {
  const blocks = getBlocks();
  const nextIndex = currentBlockIndex + direction;
  if (nextIndex < 0 || nextIndex >= blocks.length) return;
  currentBlockIndex = nextIndex;
  renderCurrentBlock();
}

function showCurrentAnswer() {
  const target = getCurrentTarget();
  if (!target) return;
  elements.answerText.textContent = target;
  elements.answerPanel.hidden = false;
}

function getBlocks() {
  return currentReading && Array.isArray(currentReading.blocks) ? currentReading.blocks : [];
}

function getCurrentTarget() {
  const block = getBlocks()[currentBlockIndex];
  return block ? (block.en || block.English || "") : "";
}

class SmartTypingBox {
  constructor(nodes) {
    this.nodes = nodes;
    this.target = "";
    this.targetChars = [];
    this.tokens = [];
    this.stallTimer = null;
    this.hintLevel = 0;
    this.hintSeed = 1;
    this.revealedHintOffsets = new Set();
    this.lastProgressAt = Date.now();
    this.lastKeyAt = Date.now();
    this.keyIntervals = [];

    this.nodes.input.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.nodes.input.addEventListener("paste", (event) => this.handlePaste(event));
    this.nodes.input.addEventListener("click", () => this.nodes.input.focus());
  }

  setTarget(target) {
    this.target = target;
    this.targetChars = toComparableChars(target);
    this.tokens = [];
    this.hintLevel = 0;
    this.hintSeed = 1 + Math.floor(Math.random() * 100000);
    this.revealedHintOffsets.clear();
    this.lastProgressAt = Date.now();
    this.lastKeyAt = Date.now();
    this.keyIntervals = [];
    this.clearStallTimer();
    this.render();
    this.setMessage("", "");
    this.scheduleStallHint();
  }

  handleKeydown(event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      showCurrentAnswer();
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === "Backspace") {
      event.preventDefault();
      this.backspace();
      return;
    }

    if (["Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      this.typeText(event.key);
    }
  }

  handlePaste(event) {
    event.preventDefault();
    const text = event.clipboardData ? event.clipboardData.getData("text") : "";
    this.typeText(text);
  }

  typeText(text) {
    for (const char of Array.from(text)) {
      this.typeChar(char);
    }
    this.render();
  }

  typeChar(rawChar) {
    const now = Date.now();
    if (this.lastKeyAt) {
      this.keyIntervals.push(now - this.lastKeyAt);
      this.keyIntervals = this.keyIntervals.slice(-10);
    }
    this.lastKeyAt = now;

    const char = normalizeGlyph(rawChar);
    if (isIgnoredPunctuation(char)) {
      this.resetHint();
      this.setMessage("Pontuacao ignorada.", "good");
      this.scheduleStallHint();
      return;
    }

    const comparable = /\s/.test(char) ? " " : char.toLowerCase();
    if (comparable === " " && this.lastComparable() === " ") return;
    if (this.tokens.length >= this.targetChars.length) return;

    this.resetHint();
    this.lastProgressAt = now;

    const currentIndex = this.tokens.length;
    const expected = this.targetChars[currentIndex];
    if (!expected) return;

    if (expected.comparable === comparable) {
      this.addToken(expected.char, "fresh");
      const nextProgress = this.progress();
      this.setMessage(nextProgress >= 100 ? "Completo. Ficou redondo." : getEncouragement(nextProgress), "good");
      this.scheduleNormalize(this.tokens.length - 1, 720);
      this.scheduleStallHint();
      return;
    }

    const lookaheadIndex = this.findGentleAhead(comparable, currentIndex);
    if (lookaheadIndex !== -1) {
      for (let index = currentIndex; index < lookaheadIndex; index += 1) {
        this.addToken(this.targetChars[index].char, "repair");
        this.scheduleNormalize(this.tokens.length - 1, 1250);
      }
      this.addToken(this.targetChars[lookaheadIndex].char, "fresh");
      this.scheduleNormalize(this.tokens.length - 1, 720);
      this.setMessage("Completei o pequeno trecho que faltou. Continue.", "good");
      this.scheduleStallHint();
      return;
    }

    const tokenIndex = this.tokens.length;
    this.addToken(char, "wrong", expected.char);
    this.setMessage("Corrigindo esse escorregao no proprio texto.", "typo");
    window.setTimeout(() => this.repairToken(tokenIndex), 580);
    window.setTimeout(() => this.normalizeToken(tokenIndex), 1550);
    this.scheduleStallHint();
  }

  backspace() {
    this.resetHint();
    this.tokens.pop();
    this.lastProgressAt = Date.now();
    this.setMessage(this.tokens.length ? "Voltou um passo." : "", "");
    this.render();
    this.scheduleStallHint();
  }

  addToken(char, state, repairChar = "") {
    this.tokens.push({
      char,
      state,
      repairChar,
      id: Date.now() + Math.random()
    });
  }

  repairToken(index) {
    const token = this.tokens[index];
    if (!token || token.state !== "wrong") return;
    token.char = token.repairChar;
    token.state = "repair";
    token.repairChar = "";
    this.render();
  }

  normalizeToken(index) {
    const token = this.tokens[index];
    if (!token) return;
    token.state = "normal";
    token.repairChar = "";
    this.render();
  }

  scheduleNormalize(index, delay) {
    window.setTimeout(() => this.normalizeToken(index), delay);
  }

  findGentleAhead(comparable, currentIndex) {
    if (comparable === " ") return -1;

    const start = currentIndex + 1;
    const end = Math.min(this.targetChars.length, start + 4);
    for (let index = start; index < end; index += 1) {
      if (this.targetChars[index].comparable !== comparable) continue;

      const skipped = this.targetChars.slice(currentIndex, index);
      const skippedLetters = skipped.filter((item) => item.comparable !== " ").length;
      const crossesWord = skipped.some((item) => item.comparable === " ");

      if (skippedLetters <= 1 || (!crossesWord && skippedLetters <= 2)) return index;
    }

    return -1;
  }

  lastComparable() {
    if (!this.tokens.length) return "";
    const char = this.tokens[this.tokens.length - 1].char;
    return char === " " ? " " : char.toLowerCase();
  }

  resetHint() {
    this.clearStallTimer();
    this.hintLevel = 0;
    this.revealedHintOffsets.clear();
  }

  scheduleStallHint() {
    this.clearStallTimer();
    if (this.tokens.length >= this.targetChars.length) return;

    const avg = this.keyIntervals.length
      ? this.keyIntervals.reduce((sum, value) => sum + value, 0) / this.keyIntervals.length
      : 420;
    const firstDelay = Math.max(1900, Math.min(3400, avg * 5.6));
    const nextDelay = 2300 + Math.min(2400, this.hintLevel * 360);
    const delay = this.hintLevel ? nextDelay : firstDelay;

    this.stallTimer = window.setTimeout(() => {
      this.hintLevel = Math.min(12, this.hintLevel + 1);
      this.expandHint();
      this.render();
      this.setMessage(this.hintLevel < 5 ? "A continuacao esta surgindo devagar." : "A pista ficou um pouco mais forte.", "hint");
      this.scheduleStallHint();
    }, delay);
  }

  clearStallTimer() {
    if (this.stallTimer) {
      window.clearTimeout(this.stallTimer);
      this.stallTimer = null;
    }
  }

  expandHint() {
    const start = this.tokens.length;
    const previewLength = Math.min(42, this.targetChars.length - start);
    if (previewLength <= 0) return;

    const aggression = Math.min(1, this.hintLevel / 12);
    const targetAdds = Math.max(1, Math.round(1 + aggression * 4));
    let additions = 0;
    let attempts = 0;

    while (additions < targetAdds && attempts < previewLength * 5) {
      attempts += 1;
      const offset = chooseWeightedHintOffset(
        this.targetChars.slice(start, start + previewLength),
        this.hintSeed + this.hintLevel * 7919 + attempts * 3571
      );
      if (offset === -1 || this.revealedHintOffsets.has(offset)) continue;

      const distanceBias = Math.exp(-offset / 8);
      const probability = Math.min(0.96, 0.2 + aggression * (0.35 + distanceBias * 0.65));
      const random = seededRandom(this.hintSeed + this.hintLevel * 104729 + offset * 65537 + attempts);
      if (random <= probability || attempts > previewLength * 3) {
        this.revealedHintOffsets.add(offset);
        additions += 1;
        this.revealNearbySpace(offset, previewLength);
      }
    }
  }

  revealNearbySpace(offset, previewLength) {
    const start = this.tokens.length;
    for (const neighbor of [offset - 1, offset + 1]) {
      if (neighbor < 0 || neighbor >= previewLength) continue;
      const item = this.targetChars[start + neighbor];
      if (item && item.comparable === " ") this.revealedHintOffsets.add(neighbor);
    }
  }

  render() {
    this.nodes.input.innerHTML = this.tokens.map((token) => renderToken(token)).join("")
      + '<span class="typing-caret" aria-hidden="true"></span>'
      + this.renderHint();
    this.nodes.progressBar.style.width = `${this.progress()}%`;
    this.nodes.stallMeter.classList.toggle("is-visible", this.hintLevel > 0);
    this.nodes.stallBar.style.width = `${Math.min(100, Math.round((this.hintLevel / 12) * 100))}%`;

    this.nodes.shell.classList.toggle("is-good", this.tokens.length > 0 && this.errorRatio() <= 0.08 && this.tokens.length < this.targetChars.length);
    this.nodes.shell.classList.toggle("is-typo", this.errorRatio() > 0.2);
    this.nodes.shell.classList.toggle("is-complete", this.tokens.length >= this.targetChars.length && this.errorRatio() <= 0.08);
  }

  renderHint() {
    if (!this.hintLevel || this.tokens.length >= this.targetChars.length) return "";

    const start = this.tokens.length;
    const preview = this.targetChars.slice(start, Math.min(this.targetChars.length, start + 42));
    const aggression = Math.min(1, this.hintLevel / 12);

    return preview.map((item, offset) => {
      const visible = this.revealedHintOffsets.has(offset);
      const className = visible
        ? `inline-hint${aggression > 0.58 ? " is-strong" : ""}`
        : "inline-hint is-hidden";
      return charSpan(item.char, className);
    }).join("");
  }

  progress() {
    if (!this.targetChars.length) return 0;
    return Math.min(100, Math.round((this.tokens.length / this.targetChars.length) * 100));
  }

  errorRatio() {
    if (!this.tokens.length) return 0;
    const errors = this.tokens.filter((token) => token.state === "wrong").length;
    return errors / this.tokens.length;
  }

  setMessage(text, kind) {
    this.nodes.message.textContent = text;
    this.nodes.message.className = kind ? `assist-message is-${kind}` : "assist-message";
  }
}

function renderToken(token) {
  if (token.state === "wrong") return charSpan(token.char, "char-wrong");
  if (token.state === "repair") return charSpan(token.char, "char-repair");
  if (token.state === "fresh") return charSpan(token.char, "char-fresh");
  return charSpan(token.char, "char-ok");
}

function toComparableChars(text) {
  const chars = [];
  let lastWasSpace = true;

  for (const rawChar of normalizeGlyphs(String(text || ""))) {
    if (isIgnoredPunctuation(rawChar)) continue;

    if (/\s/.test(rawChar)) {
      if (!lastWasSpace) {
        chars.push({ char: " ", comparable: " " });
        lastWasSpace = true;
      }
      continue;
    }

    chars.push({ char: rawChar, comparable: rawChar.toLowerCase() });
    lastWasSpace = false;
  }

  while (chars.length && chars[chars.length - 1].comparable === " ") chars.pop();
  return chars;
}

function normalizeGlyphs(text) {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-");
}

function normalizeGlyph(char) {
  return normalizeGlyphs(char)[0] || "";
}

function isIgnoredPunctuation(char) {
  return /[.,;:!?'"()[\]{}<>/\\|@#$%^&*_+=~`-]/.test(char);
}

function charSpan(char, className) {
  const classes = [className];
  if (char === " ") classes.push("char-space");
  return `<span class="${classes.join(" ")}">${escapeHtml(char)}</span>`;
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function chooseWeightedHintOffset(chars, seed) {
  const candidates = chars
    .map((item, offset) => ({
      item,
      offset,
      weight: item.comparable === " " ? 0 : Math.exp(-offset / 7)
    }))
    .filter((candidate) => candidate.weight > 0);
  if (!candidates.length) return -1;

  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = seededRandom(seed) * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate.offset;
  }
  return candidates[0].offset;
}

function getEncouragement(progress) {
  if (progress > 85) return "Esta chegando.";
  if (progress > 45) return "Boa sequencia.";
  return "Caminho certo.";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
