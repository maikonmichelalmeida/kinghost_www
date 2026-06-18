(() => {
  const {
    invertNameBySurname,
    normalizeName,
    normalizeResponsibilityName,
    normalizeSubject,
    normalizeText,
    normalizeTitle,
    removeDiacritics,
    stripAcademicTitles
  } = globalThis.UERGSNormalizers;
  const { buildCutterCode } = globalThis.UERGSCutter;
  const { formatISBN, validateISBN13 } = globalThis.UERGSValidation;

  function pagesLabel(pages, illustrated) {
    const cleanPages = String(pages || "").trim();
    return illustrated ? `${cleanPages} f.; il.` : `${cleanPages} f.`;
  }

  function personEntry(name) {
    const normalized = normalizeResponsibilityName(name);
    if (!normalized) return "";
    const tokens = normalized.split(" ");
    const surname = tokens[tokens.length - 1];
    return invertNameBySurname(normalized, surname);
  }

  function stripResponsibilityTitles(name) {
    return String(name || "")
      .replace(/\bprof(?:a|ª|essor|essora)?\.?\s*/gi, "")
      .replace(/\bdr(?:a|ª)?\.?\s*/gi, "")
      .replace(/\bme\.\s*/gi, "")
      .replace(/\bmsc\.\s*/gi, "")
      .replace(/\bms\.\s*/gi, "")
      .replace(/\besp\.\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function subjectsLine(subjects, advisor, coadvisor) {
    const cleanSubjects = subjects.map(normalizeSubject).filter(Boolean).slice(0, 5);
    const entries = cleanSubjects.map((subject, index) => `${index + 1}. ${subject}.`);
    const responsibilities = [];
    const advisorEntry = personEntry(advisor);
    const coadvisorEntry = personEntry(coadvisor);

    if (advisorEntry) responsibilities.push(advisorEntry);
    if (coadvisorEntry) responsibilities.push(coadvisorEntry);
    responsibilities.push("Título");

    responsibilities.forEach((entry, index) => {
      entries.push(`${roman(index + 1)}. ${entry}.`);
    });

    return entries.join(" ");
  }

  function roman(number) {
    return ["I", "II", "III", "IV", "V"][number - 1] || String(number);
  }

  function buildCatalogData(values) {
    const author = normalizeName(values.authorName);
    const surname = values.cutterSurname || "";
    const authorEntry = surname ? invertNameBySurname(author, surname) : author;
    const title = normalizeTitle(values.title);
    const advisor = normalizeResponsibilityName(values.advisor);
    const coadvisor = normalizeResponsibilityName(values.coadvisor);
    const advisorDegree = normalizeDegree(values.advisorDegree);
    const coadvisorDegree = normalizeDegree(values.coadvisorDegree);
    const advisorProfessorTitle = normalizeProfessorTitleChoice(values.advisorProfessorTitle);
    const coadvisorProfessorTitle = normalizeProfessorTitleChoice(values.coadvisorProfessorTitle);
    const cutterCode = buildCutterCode({ surname, title });
    const year = String(values.year || "").trim();
    const unit = normalizeText(values.unit);
    const course = normalizeText(values.course);
    const coursePhrase = formatCoursePhrase(course);
    const documentType = normalizeText(values.documentType);
    const subjects = values.subjects.map(normalizeSubject);
    const isbnState = validateISBN13(values.isbn);
    const isbnLine = isbnState.valid && !isbnState.empty ? formatISBN(values.isbn) : "";

    return {
      cutterCode,
      author,
      authorEntry,
      title,
      titleLine: `${title || "Título"} / ${author || "Autor(a)"}. - ${unit || "Unidade"}, ${year || "Ano"}.`,
      pagesLine: pagesLabel(values.pages, values.illustrated),
      isbnLine,
      advisorLine: `${responsibilityLabel("advisor", advisorDegree)}: ${formatResponsibility(advisorDegree, advisor, advisorProfessorTitle)}.`,
      coadvisorLine: coadvisor ? `${responsibilityLabel("coadvisor", coadvisorDegree)}: ${formatResponsibility(coadvisorDegree, coadvisor, coadvisorProfessorTitle)}.` : "",
      documentLine: `${documentType || "Monografia (Graduação)"} - Universidade Estadual do Rio Grande do Sul, ${coursePhrase || "Curso"}, Unidade em ${unit || "Unidade"}, ${year || "Ano"}.`,
      subjectsLine: subjectsLine(subjects, advisor, coadvisor)
    };
  }

  function formatCoursePhrase(course) {
    if (!course) return "";
    const comparable = removeDiacritics(course).toLocaleLowerCase("pt-BR");
    const alreadyQualified = ["curso", "graduacao", "programa", "mestrado", "doutorado", "especializacao", "pos-graduacao"]
      .some((prefix) => comparable.startsWith(prefix));
    if (alreadyQualified) {
      return course;
    }
    return `Curso de ${course}`;
  }

  function normalizeDegree(value) {
    return ["Dr.", "Dra.", "Me.", "Ma."].includes(value) ? value : "";
  }

  function normalizeProfessorTitleChoice(value) {
    return value === "no" ? "no" : "yes";
  }

  function formatResponsibility(degree, name, professorTitleChoice = "yes") {
    const cleanName = name || "-";
    const parts = [];
    if (professorTitleChoice === "yes") {
      parts.push(professorPrefix(degree));
    }
    if (degree) {
      parts.push(degree);
    }
    parts.push(cleanName);
    return parts.filter(Boolean).join(" ");
  }

  function professorPrefix(degree) {
    if (["Dra.", "Ma."].includes(degree)) return "Prof.ª";
    if (["Dr.", "Me."].includes(degree)) return "Prof.";
    return "";
  }

  function responsibilityLabel(role, degree) {
    const labels = {
      advisor: {
        "Dr.": "Orientador",
        "Dra.": "Orientadora",
        "Me.": "Orientador",
        "Ma.": "Orientadora"
      },
      coadvisor: {
        "Dr.": "Coorientador",
        "Dra.": "Coorientadora",
        "Me.": "Coorientador",
        "Ma.": "Coorientadora"
      }
    };
    return labels[role]?.[degree] || labels[role]?.["Me."] || "Orientador";
  }

  globalThis.UERGSCatalog = {
    buildCatalogData,
    formatCoursePhrase,
    pagesLabel,
    personEntry,
    stripResponsibilityTitles,
    subjectsLine
  };
})();
