(() => {
  const {
    invertNameBySurname,
    normalizeName,
    normalizeResponsibilityName,
    normalizeSubject,
    normalizeText,
    normalizeTitle,
    surnameOptions
  } = globalThis.UERGSNormalizers;
  const { buildCatalogData } = globalThis.UERGSCatalog;
  const { createCatalogLayout, generateCatalogPdf } = globalThis.UERGSPdf;
  const { formatISBN, validateValues } = globalThis.UERGSValidation;

  const form = document.querySelector("#catalog-form");
  const statusCard = document.querySelector("#status-card");
  const statusText = document.querySelector("#status-text");
  const downloadButton = document.querySelector("#download-pdf");
  const surnameSelect = document.querySelector("#cutterSurname");
  const authorEntry = document.querySelector("#authorEntry");
  const currentYear = new Date().getFullYear();
  const progressText = document.querySelector("#progress-text");
  const progressDetail = document.querySelector("#progress-detail");
  const progressBar = document.querySelector("#progress-bar");
  const healthAuthor = document.querySelector("#health-author");
  const healthTitle = document.querySelector("#health-title");
  const healthSubjects = document.querySelector("#health-subjects");
  const PAGE_HEIGHT_MM = 297;
  const PAGE_BOTTOM_MARGIN_MM = 8;
  const FOOTER_HEIGHT_MM = 12;

  const preview = {
    cutterCode: document.querySelector("#cutterCode"),
    svg: document.querySelector("#preview-svg")
  };
  preview.card = document.querySelector("#preview-card");

  const normalizers = {
    authorName: normalizeName,
    title: normalizeTitle,
    advisor: normalizeResponsibilityName,
    coadvisor: normalizeResponsibilityName,
    subject1: normalizeSubject,
    subject2: normalizeSubject,
    subject3: normalizeSubject,
    subject4: normalizeSubject,
    subject5: normalizeSubject
  };

  const sample = {
    authorName: "Amanda Rodrigues Padilha",
    title: "Vai e vem: o instante e uma dança-tecnologia",
    documentType: "Monografia (Graduação)",
    year: "2023",
    pages: "51",
    illustrated: false,
    unit: "Montenegro",
    course: "Dança (Licenciatura)",
    advisorDegree: "Ma.",
    advisorProfessorTitle: "yes",
    advisor: "Sílvia da Silva Lopes",
    coadvisorDegree: "",
    coadvisorProfessorTitle: "yes",
    coadvisor: "",
    subject1: "Dispositivo",
    subject2: "Processo de criação",
    subject3: "Dança-tecnologia",
    subject4: "Dança",
    subject5: ""
  };

  form.addEventListener("input", (event) => {
    if (event.target.id === "isbn") {
      event.target.value = formatISBN(event.target.value);
    } else if (event.target.matches("input[type='text']")) {
      event.target.value = normalizeTypingText(event.target.value, event.target.id === "title");
    }
    if (event.target.id === "authorName") {
      refreshSurnameOptions(true);
    }
    update();
  });

  form.addEventListener("change", update);

  document.querySelectorAll("[data-year-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(button.dataset.yearStep);
      const yearField = form.elements.year;
      const current = Number(yearField.value) || currentYear;
      yearField.value = clampYear(current + step);
      update(true);
    });
  });

  form.addEventListener("focusout", (event) => {
    const normalize = normalizers[event.target.id];
    if (normalize) {
      event.target.value = normalize(event.target.value);
    }
    if (event.target.id === "authorName") {
      refreshSurnameOptions(true);
    }
    update();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    update(true);
    const values = getValues();
    const validation = validateValues(values);
    if (!validation.valid) {
      focusFirstInvalid(validation);
      return;
    }
    const data = buildCatalogData(values);
    const layout = createCatalogLayout(data);
    if (!layoutFitsPage(layout)) {
      statusCard.classList.remove("valid");
      statusText.textContent = "Texto longo demais para caber no PDF; reduza título, nomes ou assuntos.";
      return;
    }

    try {
      generateCatalogPdf(data);
    } catch (error) {
      statusCard.classList.remove("valid");
      statusText.textContent = error.message;
    }
  });

  document.querySelector("#fill-sample").addEventListener("click", () => {
    Object.entries(sample).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field instanceof RadioNodeList) {
        field.value = value;
      } else if (field && field.type === "checkbox") {
        field.checked = Boolean(value);
      } else if (field) {
        field.value = value;
      }
    });
    form.elements.isbn.value = "";
    refreshSurnameOptions(true);
    update(true);
  });

  document.querySelector("#clear-form").addEventListener("click", () => {
    form.reset();
    form.elements.year.value = currentYear;
    form.elements.advisorProfessorTitle.value = "yes";
    form.elements.coadvisorProfessorTitle.value = "yes";
    surnameSelect.innerHTML = "";
    surnameSelect.disabled = true;
    update();
  });

  function getValues() {
    return {
      authorName: form.elements.authorName.value,
      cutterSurname: form.elements.cutterSurname.value,
      title: form.elements.title.value,
      documentType: form.elements.documentType.value,
      year: form.elements.year.value,
      pages: form.elements.pages.value,
      isbn: form.elements.isbn.value,
      illustrated: form.elements.illustrated.checked,
      unit: form.elements.unit.value,
      course: form.elements.course.value,
      advisorDegree: form.elements.advisorDegree.value,
      advisorProfessorTitle: form.elements.advisorProfessorTitle.value,
      advisor: form.elements.advisor.value,
      coadvisorDegree: form.elements.coadvisorDegree.value,
      coadvisorProfessorTitle: form.elements.coadvisorProfessorTitle.value,
      coadvisor: form.elements.coadvisor.value,
      subjects: [1, 2, 3, 4, 5].map((number) => form.elements[`subject${number}`].value)
    };
  }

  function normalizeTypingText(value, keepTitlePunctuation = false) {
    const clean = String(value || "")
      .replace(/^\s+/, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1");

    return keepTitlePunctuation
      ? clean
      : clean.replace(/[.;,:/\\-]+\s*$/g, "");
  }

  function refreshSurnameOptions(forceLast = false) {
    const current = surnameSelect.value;
    const options = surnameOptions(form.elements.authorName.value);
    surnameSelect.innerHTML = "";

    if (!options.length) {
      surnameSelect.disabled = true;
      surnameSelect.append(new Option("Informe nome e sobrenome", ""));
      return;
    }

    options.forEach((option) => surnameSelect.append(new Option(option.label, option.value)));
    surnameSelect.disabled = false;
    const lastValue = options[options.length - 1].value;
    surnameSelect.value = !forceLast && options.some((option) => option.value === current)
      ? current
      : lastValue;
  }

  function update(showUntouched = false) {
    const values = getValues();
    syncDegreeRequirements(values);
    const validation = validateValues(values);
    const data = buildCatalogData(values);
    const layout = createCatalogLayout(data);
    const fitsPage = layoutFitsPage(layout);

    renderValidation(validation, showUntouched);
    renderDerived(values);
    renderPreview(data, layout);
    renderHealth(values, validation);
    renderStatus(validation, fitsPage);
  }

  function syncDegreeRequirements(values) {
    const hasCoadvisor = Boolean(normalizeResponsibilityName(values.coadvisor));
    form.elements.advisorDegree.required = true;
    form.elements.advisorDegree.setAttribute("aria-required", "true");
    form.elements.coadvisorDegree.required = hasCoadvisor;
    form.elements.coadvisorDegree.setAttribute("aria-required", hasCoadvisor ? "true" : "false");
  }

  function renderValidation(validation, showUntouched) {
    Object.entries(validation.fields).forEach(([field, state]) => {
      const container = document.querySelector(`[data-field="${field}"]`);
      const message = document.querySelector(`#${field}-message`);
      const input = form.elements[field];
      const relatedValue = relatedResponsibilityValue(field);
      const touched = showUntouched || field.endsWith("ProfessorTitle") || Boolean(relatedValue) || (input && (input.value || document.activeElement === input));
      const pendingQuietly = Boolean(state.pending && !showUntouched);
      const showWarning = Boolean(touched && state.warning && pendingQuietly);
      const showInvalid = Boolean(touched && !state.valid && !pendingQuietly);

      if (container) {
        container.classList.toggle("valid", Boolean(touched && state.valid && !state.warning && !state.empty));
        container.classList.toggle("invalid", showInvalid);
        container.classList.toggle("warning", showWarning);
      }
      if (message) {
        message.textContent = touched
          ? showUntouched && state.pending
            ? state.errorMessage || state.message
            : state.message
          : "";
      }
    });

    const subjectsMessage = document.querySelector("#subjects-message");
    subjectsMessage.textContent = validation.fields.subjects.message;
    subjectsMessage.classList.toggle("invalid", !validation.fields.subjects.valid);
  }

  function relatedResponsibilityValue(field) {
    const related = {
      advisorDegree: "advisor",
      advisor: "advisorDegree",
      coadvisorDegree: "coadvisor",
      coadvisor: "coadvisorDegree",
      coadvisorProfessorTitle: "coadvisor"
    }[field];
    return related ? form.elements[related].value : "";
  }

  function renderDerived(values) {
    const author = normalizeName(values.authorName);
    const surname = values.cutterSurname;
    authorEntry.value = author && surname ? `${invertNameBySurname(author, surname)}.` : "-";
  }

  function renderPreview(data, layout) {
    preview.cutterCode.textContent = data.cutterCode || "-";
    renderSvgPreview(layout);
  }

  function renderSvgPreview(layout) {
    const svg = preview.svg;
    const width = layout.card.width;
    const height = layout.cardHeight;

    svg.replaceChildren();
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", `${width}mm`);
    svg.setAttribute("height", `${height}mm`);
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

    layout.operations.forEach((operation) => {
      svg.appendChild(createSvgText(layout, operation));
    });
  }

  function createSvgText(layout, operation) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const text = document.createElementNS(svgNamespace, "text");
    text.setAttribute("x", roundMm(operation.x - layout.card.x));
    text.setAttribute("y", roundMm(operation.y - layout.card.y));
    text.setAttribute("fill", "#111");
    text.setAttribute("font-family", "Helvetica, Arial, sans-serif");
    text.setAttribute("font-size", "3.5278");
    text.setAttribute("font-weight", operation.bold ? "700" : "400");
    text.textContent = operation.text;
    return text;
  }

  function roundMm(value) {
    return String(Math.round(value * 1000) / 1000);
  }

  function renderStatus(validation, fitsPage) {
    const valid = validation.valid && fitsPage;
    statusCard.classList.toggle("valid", valid);
    statusText.textContent = valid
      ? "Ficha pronta para gerar PDF"
      : fitsPage
        ? "Preencha os campos obrigatórios"
        : "Texto longo demais para caber no PDF; reduza título, nomes ou assuntos.";
    downloadButton.disabled = !valid;
  }

  function layoutFitsPage(layout) {
    return layout.footerY + FOOTER_HEIGHT_MM <= PAGE_HEIGHT_MM - PAGE_BOTTOM_MARGIN_MM;
  }

  function renderHealth(values, validation) {
    const fieldStates = Object.entries(validation.fields)
      .filter(([field]) => !field.startsWith("subject") || field === "subjects");
    const validCount = fieldStates.filter(([, state]) => state.valid).length;
    const percent = Math.round((validCount / fieldStates.length) * 100);
    const subjectsCount = values.subjects.map(normalizeText).filter(Boolean).length;

    progressText.textContent = `${percent}% completo`;
    progressDetail.textContent = validation.valid ? "Dados prontos para o PDF" : `${fieldStates.length - validCount} pendências restantes`;
    progressBar.style.width = `${percent}%`;
    healthAuthor.textContent = validation.fields.authorName.valid && validation.fields.cutterSurname.valid
      ? "Autoria pronta"
      : "Autoria pendente";
    healthTitle.textContent = validation.fields.title.valid
      ? "Título válido"
      : "Título pendente";
    healthSubjects.textContent = `${Math.min(subjectsCount, 5)}/3 assuntos mínimos`;
  }

  function clampYear(year) {
    return Math.min(currentYear + 1, Math.max(1900, year));
  }

  function focusFirstInvalid(validation) {
    const firstInvalid = Object.entries(validation.fields).find(([, state]) => !state.valid);
    if (!firstInvalid) return;
    const field = form.elements[firstInvalid[0]];
    if (field && typeof field.focus === "function") field.focus();
  }

  form.elements.year.max = currentYear + 1;
  form.elements.year.value = currentYear;
  refreshSurnameOptions();
  update();
})();
