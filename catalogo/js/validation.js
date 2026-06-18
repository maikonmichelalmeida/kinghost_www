(() => {
  const {
    firstSignificantTitleLetter,
    isSingleWordName,
    normalizeName,
    normalizeResponsibilityName,
    normalizeText,
    normalizeTitle,
    removeDiacritics
  } = globalThis.UERGSNormalizers;
  const CURRENT_YEAR = new Date().getFullYear();

  function result(valid, message = "") {
    return { valid, message };
  }

  function cleanISBN(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 13);
  }

  function formatISBN(value) {
    const digits = cleanISBN(value);

    if (!digits) return "";

    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 5);
    const p3 = digits.slice(5, 9);
    const p4 = digits.slice(9, 12);
    const p5 = digits.slice(12, 13);

    let formatted = `ISBN ${p1}`;

    if (p2) formatted += `-${p2}`;
    if (p3) formatted += `-${p3}`;
    if (p4) formatted += `-${p4}`;
    if (p5) formatted += `-${p5}`;

    return formatted;
  }

  function validateISBN13(value) {
    const digits = cleanISBN(value);
    const prefix = digits.slice(0, 3);
    const hasUnexpectedPrefix = digits.length >= 3 && prefix !== "978" && prefix !== "979";
    const lengthErrorMessage = "ISBN inválido. Verifique se há 13 dígitos e se o último dígito está correto.";

    if (!digits) {
      return { valid: true, empty: true, pending: false, warning: false, message: "" };
    }

    if (digits.length !== 13) {
      return {
        valid: false,
        empty: false,
        pending: true,
        warning: hasUnexpectedPrefix,
        message: hasUnexpectedPrefix ? "Certifique-se de que os três primeiros números estejam corretos." : "",
        errorMessage: lengthErrorMessage
      };
    }

    let sum = 0;
    for (let index = 0; index < 12; index += 1) {
      sum += Number(digits[index]) * (index % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    const lastDigit = Number(digits[12]);

    if (checkDigit !== lastDigit) {
      return {
        valid: false,
        empty: false,
        pending: false,
        warning: false,
        message: lengthErrorMessage
      };
    }

    return {
      valid: true,
      empty: false,
      pending: false,
      warning: false,
      message: ""
    };
  }

  function validateValues(values) {
    const subjects = values.subjects.map(normalizeText).filter(Boolean);
    const year = Number(values.year);
    const pages = Number(values.pages);
    const cleanAuthor = normalizeName(values.authorName);
    const cleanAdvisor = normalizeResponsibilityName(values.advisor);
    const cleanCoadvisor = normalizeResponsibilityName(values.coadvisor);

    const fields = {
      authorName: validateName(values.authorName, "Informe nome e sobrenome."),
      cutterSurname: values.cutterSurname ? result(true, "Sobrenome selecionado.") : result(false, "Selecione o sobrenome usado no Cutter."),
      title: validateTitle(values.title),
      documentType: values.documentType ? result(true, "") : result(false, "Selecione o tipo de documento."),
      year: Number.isInteger(year) && year >= 1900 && year <= CURRENT_YEAR + 1
        ? result(true, "")
        : result(false, `Use um ano entre 1900 e ${CURRENT_YEAR + 1}.`),
      pages: Number.isInteger(pages) && pages > 0 && pages < 10000
        ? result(true, "")
        : result(false, "Informe um número de folhas válido."),
      isbn: validateISBN13(values.isbn),
      unit: values.unit ? result(true, "") : result(false, "Selecione a unidade."),
      course: values.course ? result(true, "") : result(false, "Selecione o curso ou programa."),
      advisorDegree: validateDegree(values.advisorDegree, "Selecione a titulação da orientação."),
      advisorProfessorTitle: validateProfessorTitleChoice(values.advisorProfessorTitle, "Escolha se deseja incluir Prof./Prof.ª na orientação."),
      advisor: validatePersonRole(cleanAdvisor, cleanAuthor, "", "Informe nome e sobrenome da orientação."),
      coadvisorDegree: cleanCoadvisor ? validateDegree(values.coadvisorDegree, "Selecione a titulação da coorientação.") : result(true, "Opcional."),
      coadvisorProfessorTitle: cleanCoadvisor ? validateProfessorTitleChoice(values.coadvisorProfessorTitle, "Escolha se deseja incluir Prof./Prof.ª na coorientação.") : result(true, "Opcional."),
      coadvisor: cleanCoadvisor || values.coadvisorDegree
        ? validatePersonRole(cleanCoadvisor, cleanAuthor, cleanAdvisor, "Use nome e sobrenome da coorientação.")
        : result(true, ""),
      subjects: validateSubjectSet(subjects)
    };

    values.subjects.forEach((subject, index) => {
      fields[`subject${index + 1}`] = validateSubject(subject, index, subjects);
    });

    return {
      valid: Object.values(fields).every((field) => field.valid),
      fields
    };
  }

  function validateName(value, emptyMessage) {
    const clean = normalizeName(value);
    if (!clean) return result(false, emptyMessage);
    if (isSingleWordName(clean)) return result(false, "Não use nome único; informe nome e sobrenome.");
    return result(true, "");
  }

  function validatePersonRole(name, author, otherResponsible, emptyMessage) {
    const base = validateName(name, emptyMessage);
    if (!base.valid) return base;
    if (samePerson(name, author)) return result(false, "Não use o mesmo nome do(a) autor(a).");
    if (otherResponsible && samePerson(name, otherResponsible)) return result(false, "Não repita o nome da orientação.");
    return result(true, "");
  }

  function validateDegree(value, emptyMessage) {
    return ["Dr.", "Dra.", "Me.", "Ma."].includes(value)
      ? result(true, "")
      : result(false, emptyMessage);
  }

  function validateProfessorTitleChoice(value, emptyMessage) {
    return ["yes", "no"].includes(value)
      ? result(true, "")
      : result(false, emptyMessage);
  }

  function validateTitle(value) {
    const clean = normalizeTitle(value);
    if (!clean) return result(false, "Informe o título do trabalho.");
    if (!firstSignificantTitleLetter(clean)) return result(false, "Inclua uma palavra significativa no título.");
    if (clean.length < 3) return result(false, "O título está curto demais.");
    return result(true, "");
  }

  function validateSubjectSet(subjects) {
    if (subjects.length < 3 || subjects.length > 5) {
      return result(false, "Informe no mínimo 3 e no máximo 5 assuntos.");
    }
    if (hasDuplicates(subjects)) {
      return result(false, "Remova assuntos repetidos.");
    }
    return result(true, `${subjects.length} assuntos informados.`);
  }

  function validateSubject(value, index, subjects) {
    const clean = normalizeText(value);
    if (index < 3 && !clean) return result(false, "Obrigatório.");
    if (!clean && subjects.length >= 3) return result(true, "Opcional.");
    if (clean.length < 2) return result(false, "Muito curto.");
    if (subjects.filter((subject) => comparable(subject) === comparable(clean)).length > 1) {
      return result(false, "Repetido.");
    }
    return result(true, "");
  }

  function comparable(value) {
    return removeDiacritics(normalizeText(value)).toLocaleLowerCase("pt-BR");
  }

  function samePerson(first, second) {
    return Boolean(first && second && comparable(first) === comparable(second));
  }

  function hasDuplicates(values) {
    const seen = new Set();
    return values.some((value) => {
      const key = comparable(value);
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }

  globalThis.UERGSValidation = {
    cleanISBN,
    formatISBN,
    validateISBN13,
    validateValues
  };
})();
