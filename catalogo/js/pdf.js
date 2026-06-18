(() => {
  const CARD = {
    x: 42.5,
    y: 70,
    width: 125,
    minHeight: 75
  };
  const HANGING_INDENT_MM = 6;

  function generateCatalogPdf(data) {
    const jsPDF = globalThis.jspdf?.jsPDF;
    if (!jsPDF) {
      throw new Error("A biblioteca de PDF não foi carregada.");
    }

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    doc.setProperties({
      title: "Ficha Catalográfica UERGS",
      subject: "Catalogação de Publicação na Fonte",
      author: data.author || "UERGS"
    });

    drawCatalog(doc, data);
    doc.save(filenameFor(data));
  }

  function createCatalogLayout(data) {
    const jsPDF = globalThis.jspdf?.jsPDF;
    if (!jsPDF) {
      throw new Error("A biblioteca de PDF não foi carregada.");
    }

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    return buildCatalogLayout(doc, data);
  }

  function drawCatalog(doc, data) {
    const layout = buildCatalogLayout(doc, data);

    doc.setTextColor(17, 17, 17);
    doc.setFontSize(12);
    doc.text("Catalogação de Publicação na Fonte", CARD.x + CARD.width / 2, layout.headingY, { align: "center" });

    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.35);
    doc.rect(CARD.x, CARD.y, CARD.width, layout.cardHeight, "S");

    doc.setFontSize(10);
    layout.operations.forEach((operation) => {
      doc.setFont("helvetica", operation.bold ? "bold" : "normal");
      doc.text(operation.text, operation.x, operation.y);
    });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    doc.setFontSize(9.5);
    const footer = "Ficha catalográfica elaborada pelo Sistema de Geração Automática de Ficha Catalográfica da UERGS com os dados fornecidos pelo(a) autor(a).";
    const footerLines = doc.splitTextToSize(footer, CARD.width - 14);
    doc.text(footerLines, CARD.x + CARD.width / 2, layout.footerY, { align: "center" });
  }

  function buildCatalogLayout(doc, data) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 17, 17);
    doc.setFontSize(10);

    const charWidth = doc.getTextWidth("0000") / 4;
    const codeX = CARD.x + 2.4;
    const baseX = codeX + charWidth * 6;
    const paragraphX = baseX + HANGING_INDENT_MM;
    const rightX = CARD.x + CARD.width - 5;
    const authorX = baseX;
    let y = CARD.y + 5.2;
    const operations = [];

    operations.push({ type: "text", text: data.cutterCode || "-", x: codeX, y, bold: false });
    operations.push({ type: "text", text: `${data.authorEntry || "Autor(a)"}.`, x: authorX, y, bold: false });
    y += 5.7;

    y = queueParagraph(doc, operations, data.titleLine, paragraphX, baseX, y, rightX);
    y += 6.5;
    y = queueParagraph(doc, operations, data.pagesLine, paragraphX, baseX, y, rightX);
    if (data.isbnLine) {
      queueParagraph(doc, operations, data.isbnLine, paragraphX, baseX, y + 4.7, rightX);
    }
    y += 14.1;
    y = queueParagraph(doc, operations, data.advisorLine, paragraphX, baseX, y, rightX);
    if (data.coadvisorLine) {
      y += 5;
      y = queueParagraph(doc, operations, data.coadvisorLine, paragraphX, baseX, y, rightX);
    }
    y += 8.5;
    y = queueParagraph(doc, operations, data.documentLine, paragraphX, baseX, y, rightX);
    y += 8.5;
    y = queueParagraph(doc, operations, data.subjectsLine, paragraphX, baseX, y, rightX);

    const cardHeight = Math.max(CARD.minHeight, y - CARD.y + 10);

    return {
      card: { ...CARD },
      cardHeight,
      headingY: CARD.y - 5,
      footerY: CARD.y + cardHeight + 5,
      operations
    };
  }

  function queueParagraph(doc, operations, text, firstX, restX, y, rightX) {
    const lines = wrapHanging(doc, text || "-", firstX, restX, rightX);
    lines.forEach((line, index) => {
      operations.push({
        type: "text",
        text: line,
        x: index === 0 ? firstX : restX,
        y: y + index * 4.7,
        bold: false
      });
    });
    return y + (lines.length - 1) * 4.7;
  }

  function wrapHanging(doc, text, firstX, restX, rightX) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    let lineIndex = 0;

    words.forEach((word) => {
      const x = lineIndex === 0 ? firstX : restX;
      const maxWidth = rightX - x;
      const test = current ? `${current} ${word}` : word;
      if (doc.getTextWidth(test) <= maxWidth || !current) {
        if (doc.getTextWidth(test) <= maxWidth) {
          current = test;
          return;
        }

        const pieces = splitLongWord(doc, word, maxWidth);
        current = pieces.shift() || word;
        pieces.forEach((piece) => {
          lines.push(current);
          lineIndex += 1;
          current = piece;
        });
        return;
      }

      lines.push(current);
      lineIndex += 1;
      const nextX = lineIndex === 0 ? firstX : restX;
      const nextMaxWidth = rightX - nextX;
      const pieces = splitLongWord(doc, word, nextMaxWidth);
      current = pieces.shift() || word;
      pieces.forEach((piece) => {
        lines.push(current);
        lineIndex += 1;
        current = piece;
      });
    });

    if (current) lines.push(current);
    return lines;
  }

  function splitLongWord(doc, word, maxWidth) {
    if (doc.getTextWidth(word) <= maxWidth) return [word];

    const pieces = [];
    let current = "";

    Array.from(word).forEach((char) => {
      const test = current + char;
      if (doc.getTextWidth(test) <= maxWidth || !current) {
        current = test;
        return;
      }

      pieces.push(current);
      current = char;
    });

    if (current) pieces.push(current);
    return pieces;
  }

  function filenameFor(data) {
    const author = (data.author || "autor").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return `ficha-catalografica-${author.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
  }

  globalThis.UERGSPdf = {
    createCatalogLayout,
    drawCatalog,
    generateCatalogPdf
  };
})();
