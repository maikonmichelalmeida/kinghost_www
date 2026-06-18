(() => {
  const { firstSignificantTitleLetter, normalizeName, removeDiacritics } = globalThis.UERGSNormalizers;

  function cutterTable() {
    return globalThis.lista || {};
  }

  function comparable(value) {
    return removeDiacritics(normalizeName(value)).toLocaleLowerCase("pt-BR");
  }

  function findCutterNumber(surname) {
    const normalizedSurname = comparable(surname);
    let bestKey = "";
    let bestLength = 0;

    Object.keys(cutterTable()).forEach((key) => {
      const normalizedKey = comparable(key);
      if (normalizedSurname.startsWith(normalizedKey) && normalizedKey.length > bestLength) {
        bestKey = key;
        bestLength = normalizedKey.length;
      }
    });

    if (!bestKey) return "";
    return String(cutterTable()[bestKey]);
  }

  function buildCutterCode({ surname, title }) {
    const normalizedSurname = comparable(surname);
    const firstLetter = normalizedSurname.charAt(0).toLocaleUpperCase("pt-BR");
    const number = findCutterNumber(surname);
    const titleLetter = firstSignificantTitleLetter(title);

    if (!firstLetter || !number || !titleLetter) return "";
    return `${firstLetter}${number}${titleLetter}`;
  }

  globalThis.UERGSCutter = {
    buildCutterCode,
    findCutterNumber
  };
})();
