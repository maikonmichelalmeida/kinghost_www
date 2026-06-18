(() => {
  const NAME_PARTICLES = new Set(["da", "das", "de", "del", "di", "do", "dos", "du", "e"]);
  const TITLE_ARTICLES = new Set(["a", "as", "o", "os", "um", "uma", "uns", "umas"]);

  function stripFinalPunctuation(value) {
    return value.replace(/[.;,:/\\-]+$/g, "");
  }

  function cleanSpaces(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  function normalizeText(value) {
    return stripFinalPunctuation(cleanSpaces(value));
  }

  function normalizeTitle(value) {
    return cleanSpaces(value)
      .replace(/([([{])\s+/g, "$1")
      .replace(/\s+([)\]}])/g, "$1")
      .replace(/([,;:]){2,}/g, "$1")
      .replace(/([.!?]){2,}/g, "$1");
  }

  function removeDiacritics(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function capitalizeToken(token) {
    if (!token) return token;
    const lower = token.toLocaleLowerCase("pt-BR");
    if (NAME_PARTICLES.has(removeDiacritics(lower))) return lower;

    return lower
      .split("-")
      .map((part) => part ? part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1) : part)
      .join("-");
  }

  function normalizeName(value) {
    return normalizeText(value)
      .split(" ")
      .filter(Boolean)
      .map(capitalizeToken)
      .join(" ");
  }

  function stripAcademicTitles(name) {
    return String(name || "")
      .replace(/\bprof(?:\.?\s*ª|a|essor|essora)?\.?\s+/gi, "")
      .replace(/\bdr(?:a|ª)?\.?\s+/gi, "")
      .replace(/\bme\.?\s+/gi, "")
      .replace(/\bma\.?\s+/gi, "")
      .replace(/\bmsc\.?\s+/gi, "")
      .replace(/\bms\.?\s+/gi, "")
      .replace(/\besp\.?\s+/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeResponsibilityName(value) {
    return normalizeName(stripAcademicTitles(value));
  }

  function normalizeSubject(value) {
    const text = normalizeText(value);
    if (!text) return "";
    return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
  }

  function nameTokens(name) {
    return normalizeName(name).split(" ").filter(Boolean);
  }

  function meaningfulNameTokens(name) {
    return nameTokens(name).filter((token) => !NAME_PARTICLES.has(removeDiacritics(token).toLocaleLowerCase("pt-BR")));
  }

  function surnameOptions(name) {
    const tokens = nameTokens(name);
    const options = [];

    tokens.forEach((token, index) => {
      const key = removeDiacritics(token).toLocaleLowerCase("pt-BR");
      if (index > 0 && !NAME_PARTICLES.has(key)) {
        options.push({ label: token, value: token, index });
      }
    });

    return options;
  }

  function invertNameBySurname(name, surname) {
    const normalized = normalizeName(name);
    const tokens = nameTokens(normalized);
    const selected = removeDiacritics(surname).toLocaleLowerCase("pt-BR");
    const index = tokens.findIndex((token) => removeDiacritics(token).toLocaleLowerCase("pt-BR") === selected);

    if (index < 0) return normalized;

    const chosen = tokens.slice(index).join(" ");
    const before = tokens.slice(0, index).join(" ");
    return before ? `${chosen}, ${before}` : chosen;
  }

  function firstSignificantTitleLetter(title) {
    const words = normalizeTitle(title)
      .split(" ")
      .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
      .filter(Boolean);

    const chosen = words.find((word) => !TITLE_ARTICLES.has(removeDiacritics(word).toLocaleLowerCase("pt-BR"))) || words[0] || "";
    return removeDiacritics(chosen).charAt(0).toLocaleLowerCase("pt-BR");
  }

  function isSingleWordName(name) {
    return meaningfulNameTokens(name).length < 2;
  }

  globalThis.UERGSNormalizers = {
    cleanSpaces,
    firstSignificantTitleLetter,
    invertNameBySurname,
    isSingleWordName,
    meaningfulNameTokens,
    nameTokens,
    normalizeName,
    normalizeResponsibilityName,
    normalizeSubject,
    normalizeText,
    normalizeTitle,
    removeDiacritics,
    stripAcademicTitles,
    stripFinalPunctuation,
    surnameOptions
  };
})();
