(function () {
  function buildToc() {
    var toc = document.querySelector("[data-toc]");
    var content = document.querySelector("[data-content]");
    if (!toc || !content) return;

    var headings = content.querySelectorAll("h2[id], h3[id]");
    if (!headings.length) {
      toc.hidden = true;
      return;
    }

    var list = document.createElement("div");
    headings.forEach(function (heading) {
      var link = document.createElement("a");
      link.href = "#" + heading.id;
      link.textContent = heading.textContent;
      if (heading.tagName.toLowerCase() === "h3") {
        link.style.paddingLeft = "14px";
      }
      list.appendChild(link);
    });
    toc.appendChild(list);
  }

  function markExternalMdLinks() {
    var links = document.querySelectorAll("a[data-md-source]");
    links.forEach(function (link) {
      link.title = "Arquivo Markdown de origem";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildToc();
    markExternalMdLinks();
  });
})();

