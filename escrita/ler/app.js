const READING_TITLE = "As a Man Thinketh - Part 001";
const REMOTE_API_HOST = "uergs2024.kinghost.net";
const REMOTE_API_PORT = "21106";

const elements = {
  dot: document.querySelector("[data-status-dot]"),
  status: document.querySelector("[data-status-text]"),
  title: document.querySelector("[data-title]"),
  part: document.querySelector("[data-part]"),
  blocks: document.querySelector("[data-blocks]"),
  source: document.querySelector("[data-source]"),
  preview: document.querySelector("[data-json-preview]")
};

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
    window.currentReading = reading;
    window.currentReadingRecord = payload;

    renderReading(reading);
    setStatus("Recebido do banco", "ready");
  } catch (error) {
    console.error(error);
    setStatus("Nao foi possivel carregar", "error");
    elements.preview.textContent = String(error.message || error);
  }
}

function getApiBase() {
  const isLocal = location.hostname === "127.0.0.1" || location.hostname === "localhost";
  if (isLocal && location.port !== REMOTE_API_PORT) {
    return `http://127.0.0.1:${REMOTE_API_PORT}`;
  }
  if (location.hostname === REMOTE_API_HOST && location.port !== REMOTE_API_PORT) {
    return `http://${REMOTE_API_HOST}:${REMOTE_API_PORT}`;
  }
  return "";
}

function renderReading(reading) {
  const source = reading.source || {};
  const sourceLabel = typeof source === "string"
    ? source
    : [source.book_title, source.author].filter(Boolean).join(" - ");

  elements.title.textContent = reading.title || "Leitura";
  elements.part.textContent = reading.part ?? "-";
  elements.blocks.textContent = Array.isArray(reading.blocks) ? String(reading.blocks.length) : "0";
  elements.source.textContent = sourceLabel || "-";
  elements.preview.textContent = JSON.stringify(reading, null, 2);
}

function setStatus(text, state) {
  elements.status.textContent = text;
  elements.dot.classList.toggle("is-ready", state === "ready");
  elements.dot.classList.toggle("is-error", state === "error");
}
