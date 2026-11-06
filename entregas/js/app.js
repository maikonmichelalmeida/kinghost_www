"use strict";
const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (c) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (c || 0) / 100,
  );
const time = (t) =>
  t
    ? new Date(t).toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const dateTime = (t) =>
  new Date(t).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
const names = {
  scheduled: "Agendado",
  accepted: "Aguardando visualização",
  seen: "Visualizado",
  running: "Em entrega",
  done: "Concluído",
  cancelled: "Cancelado",
};
let liveController = null,
  liveEpoch = 0;
let priorityId = null,
  priorityTimer,
  priorityReadyAt = 0;
let token = localStorage.getItem("unifarma.token") || "",
  state = null,
  rows = [],
  submissionId = crypto.randomUUID(),
  submitting = false,
  refreshing = false,
  refreshAgain = false,
  sessionEpoch = 0,
  mutationEpoch = 0,
  toastTimer,
  orderSignature = "",
  completedSignature = "";
const terminal = (o) => ["done", "cancelled"].includes(o.status);
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 6000);
}
async function api(route, body, signal) {
  const auth = token;
  const r = await fetch("/api/entregas" + route, {
    method: body === undefined ? "GET" : "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: "Bearer " + auth } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal || AbortSignal.timeout(90000),
  });
  const data = await r.json();
  if (!r.ok) {
    if (r.status === 401 && auth === token && route !== "/login") logoutLocal();
    throw Object.assign(
      new Error(data.error || "Não foi possível completar a ação."),
      { status: r.status },
    );
  }
  return data;
}
async function run(button, fn) {
  if (button?.disabled) return;
  if (button) button.disabled = true;
  try {
    return await fn();
  } catch (e) {
    toast(
      e.name === "TimeoutError"
        ? "A resposta demorou. Atualize os pedidos antes de tentar novamente."
        : e.message,
    );
  } finally {
    if (button?.isConnected) button.disabled = false;
  }
}
function logoutLocal() {
  stopLive();
  token = "";
  sessionEpoch++;
  state = null;
  rows = [];
  orderSignature = "";
  completedSignature = "";
  priorityId = null;
  $("draft-stops").replaceChildren();
  $("history-orders").replaceChildren();
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  localStorage.removeItem("unifarma.token");
  localStorage.removeItem("unifarma.expiresAt");
  $("app").hidden = true;
  $("login-view").hidden = false;
}
async function refresh() {
  if (!token) return;
  if (refreshing) {
    refreshAgain = true;
    return;
  }
  refreshing = true;
  const epoch = sessionEpoch,
    version = mutationEpoch;
  try {
    const fresh = await api("/state");
    if (epoch !== sessionEpoch || version !== mutationEpoch) {
      refreshAgain = !!token;
      return;
    }
    state = fresh;
    startLive();
    $("connection").hidden = true;
    renderState();
  } catch (e) {
    if (token) {
      $("connection").textContent = "Sem atualização. " + e.message;
      $("connection").hidden = false;
    }
  } finally {
    refreshing = false;
    if (refreshAgain) {
      refreshAgain = false;
      void refresh();
    }
  }
}
async function mutate(route, body) {
  mutationEpoch++;
  const data = await api(route, body);
  mutationEpoch++;
  await refresh();
  return data;
}
function orderIndices(o) {
  return o.route?.order || o.stops.map((_, i) => i);
}
function stopLines(o) {
  return orderIndices(o)
    .map((i, n) => {
      const p = o.stops[i],
        done = o.delivered?.find((d) => d.index === i);
      return `<div class="stop-line"><span class="stop-number">${done ? "✓" : n + 1}</span><div class="stop-info">${esc(p.address)}${done ? `<small>Entregue às ${time(done.at)}</small>` : ""}</div><span class="stop-price">${money(p.priceCents)}</span></div>`;
    })
    .join("");
}
const businessDay = (t) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(t);
function historyEntries(orders, todayOnly = false) {
  return orders
    .flatMap((o) =>
      o.stops.map((p, index) => {
        const delivered = o.delivered?.find((d) => d.index === index);
        return {
          orderId: o.id,
          index,
          address: p.address,
          priceCents: p.priceCents,
          createdAt: o.createdAt,
          acceptedAt: o.acceptedAt,
          seenAt: o.seenAt,
          finishedAt: delivered?.at || o.finishedAt,
          status: delivered ? "done" : o.status,
          cancelReason: o.cancelReason,
        };
      }),
    )
    .filter(
      (item) =>
        !todayOnly ||
        (["done", "cancelled"].includes(item.status) &&
          businessDay(item.finishedAt || item.createdAt) === state.day),
    );
}
function historyTable(entries) {
  entries.sort(
    (a, b) => (b.finishedAt || b.createdAt) - (a.finishedAt || a.createdAt),
  );
  if (!entries.length) return '<p class="empty">Nenhuma entrega concluída.</p>';
  return `<table class="history-table"><caption class="sr-only">Histórico por endereço de entrega</caption><thead><tr><th>Hora</th><th>Entrega</th><th>Valor</th></tr></thead><tbody>${entries
    .map((item) => {
      const key = esc(item.orderId) + "-" + item.index;
      return `<tr><td>${time(item.finishedAt || item.createdAt)}</td><td><button type="button" class="history-trigger" data-history-key="${key}" aria-expanded="false">${esc(item.address)}<small>${item.status === "done" ? "Entregue" : names[item.status] || esc(item.status)}</small></button></td><td>${money(item.priceCents)}</td></tr><tr class="history-more" data-history-detail="${key}" hidden><td colspan="3"><b>${esc(item.address)}</b><p>Pedido às ${time(item.createdAt)} · Aceite ${time(item.acceptedAt)} · Visualizado ${time(item.seenAt)}${item.finishedAt ? " · Fim " + time(item.finishedAt) : ""}</p>${item.cancelReason ? `<p>${esc(item.cancelReason)}</p>` : ""}</td></tr>`;
    })
    .join("")}</tbody></table>`;
}
function activeOrder(o, driver) {
  const button = (action, label, cls = "outline", extra = "") =>
    `<button class="${cls}" data-order="${esc(o.id)}" data-action="${action}" ${extra}>${label}</button>`;
  let actions = "";
  if (driver) {
    if (!o.seenAt) actions += button("seen", "✓ Visualizei", "primary");
    if (o.status !== "running")
      actions += button("delay", "Vou em alguns minutos");
    if (!o.route?.order) actions += button("route", "Calcular rota", "outline");
    if (["accepted", "seen"].includes(o.status) && o.route?.order)
      actions += button("start", "Iniciar no Google Maps ↗", "primary");
    if (o.status === "running") {
      const next = orderIndices(o).find(
        (i) => !o.delivered.some((d) => d.index === i),
      );
      const link = o.navigation?.[0]?.url;
      if (link)
        actions += `<a class="primary navigation" href="${esc(link)}" target="_blank" rel="noopener">${next === undefined ? "Voltar para casa" : o.navigation[0].segments > 1 ? "Abrir trecho " + o.navigation[0].segment + " de " + o.navigation[0].segments : "Abrir rota no Google Maps"} ↗</a>`;
      if (next !== undefined)
        actions += button(
          "delivered",
          "✓ Entreguei neste endereço",
          "primary",
          `data-index="${next}"`,
        );
      else actions += button("finish", "Concluir pedido", "primary");
    }
    actions += `<details><summary class="small muted">Mais opções</summary>${button("cancel", "Cancelar pedido", "plain")}</details>`;
  } else if (["accepted", "scheduled"].includes(o.status))
    actions += button("cancel", "Cancelar pedido", "plain");
  const next = orderIndices(o).find(
    (i) => !o.delivered.some((d) => d.index === i),
  );
  return `<article class="order-card"><div class="order-head"><div><span class="eyebrow">PEDIDO ATUAL</span><h3>${o.stops.length} ${o.stops.length === 1 ? "entrega" : "entregas"}</h3><span class="small muted">Pedido às ${time(o.createdAt)}</span></div><span class="badge ${o.status}">${names[o.status] || esc(o.status)}</span></div>${o.status === "scheduled" ? `<p class="notice">Abertura ${dateTime(o.scheduledFor)}</p>` : ""}${o.seenAt ? `<p class="seen-note">✓ Maikon visualizou às ${time(o.seenAt)}</p>` : ""}${o.delayUntil ? `<p class="notice">Previsão: ${time(o.delayUntil)}</p>` : ""}${!o.route?.order ? `<p class="notice">Pedido registrado. ${o.routeStatus === "calculating" ? "Calculando a rota…" : "Rota pendente."}${driver && o.routeError ? " " + esc(o.routeError) : ""}</p>` : ""}${next !== undefined ? `<div class="next-stop"><span>${!o.route?.order ? "Endereço informado" : o.status === "running" ? "Próxima entrega" : "Primeiro destino"}${o.priority === next ? " · Prioridade" : ""}</span><strong>${esc(o.stops[next].address)}</strong></div>` : ""}<div class="order-summary"><span>Total do pedido</span><strong>${money(o.totalCents)}</strong></div>${actions ? `<div class="actions">${actions}</div>` : ""}<details class="itinerary"><summary>Endereços e valores</summary>${stopLines(o)}</details></article>`;
}
function renderState() {
  const driver = state.user.role === "driver",
    av = state.availability,
    active = state.orders.filter((o) => !terminal(o)),
    completed = state.orders.filter(terminal);
  $("app").hidden = false;
  $("login-view").hidden = true;
  $("request-section").hidden = driver || (!av.open && !av.scheduledAt);
  $("settings").hidden = !driver;
  $("today").textContent = new Date(state.serverTime).toLocaleDateString(
    "pt-BR",
    { timeZone: "America/Sao_Paulo", day: "numeric", month: "long" },
  );
  $("day-total").textContent = money(state.totalCents);
  const dayStops = state.orders
    .filter((o) => o.day === state.day && o.status !== "cancelled")
    .reduce((n, o) => n + o.stops.length, 0);
  $("day-count").textContent =
    `${dayStops} ${dayStops === 1 ? "entrega" : "entregas"}`;
  const controls = driver
    ? `<div class="actions"><button class="outline" data-availability="${av.open ? "close" : "open"}">${av.open ? "Pausar" : "Abrir atendimento"}</button><button class="plain" data-schedule>Agendar</button>${av.scheduledAt ? '<button class="plain" data-availability="unschedule">Remover horário</button>' : ""}</div>`
    : "";
  const availability = `<div><span class="status ${av.open ? "" : "closed"}">${av.open ? "Maikon disponível" : av.scheduledAt ? "Abertura programada" : "Maikon ocupado"}</span><p>${av.open ? "Atendimento até 20h30" : av.scheduledAt ? dateTime(av.scheduledAt) : "Sem previsão de abertura"}</p></div>${controls}`;
  if ($("availability-card").innerHTML !== availability)
    $("availability-card").innerHTML = availability;
  const rank = (o) =>
    o.status === "running"
      ? 0
      : o.seenAt
        ? 1
        : o.status === "scheduled"
          ? 3
          : 2;
  active.sort((a, b) => rank(a) - rank(b) || a.createdAt - b.createdAt);
  const sig = JSON.stringify([active, driver]);
  if (sig !== orderSignature) {
    $("orders").innerHTML = active.length
      ? activeOrder(active[0], driver) +
        active
          .slice(1)
          .map(
            (o) =>
              `<details class="queue"><summary>Na fila · ${time(o.createdAt)} · ${money(o.totalCents)}</summary>${activeOrder(o, driver).replace("PEDIDO ATUAL", "NA FILA")}</details>`,
          )
          .join("")
      : '<p class="empty">Nenhum pedido em andamento.</p>';
    orderSignature = sig;
  }
  if (!driver) {
    const main = $("request-section").parentNode;
    if (active.length)
      main.insertBefore($("active-section"), $("request-section"));
    else main.insertBefore($("request-section"), $("active-section"));
  }
  $("active-heading").textContent = driver
    ? "Entregas para realizar"
    : "Em andamento";
  const historyOrders = state.orders.filter(
    (o) => terminal(o) || o.delivered?.length,
  );
  const entries = historyEntries(historyOrders, true);
  const cs = JSON.stringify(entries);
  if (cs !== completedSignature) {
    const open = [
      ...$("completed-orders").querySelectorAll('[aria-expanded="true"]'),
    ].map((e) => e.dataset.historyKey);
    $("completed-orders").innerHTML = historyTable(entries);
    for (const button of $("completed-orders").querySelectorAll(
      "[data-history-key]",
    ))
      if (open.includes(button.dataset.historyKey)) button.click();
    completedSignature = cs;
  }
  $("completed-count").textContent = entries.length + " entregas";
  $("sync-status").textContent = "Atualizado às " + time(state.serverTime);
  if (!$("history-day").value) $("history-day").value = state.day;
  if (driver) {
    $("base-address").textContent =
      state.settings.baseAddress || "Base não configurada.";
    if (!document.activeElement?.closest("#base-form"))
      $("base-input").value = state.settings.baseAddress || "";
    renderBudget();
  }
  if (!driver && !rows.length) {
    addRow();
  }
  updateDraftTotal();
}
function renderBudget() {
  const b = state.googleBudget;
  if (!b) {
    $("budget").textContent = "Monitoramento indisponível.";
    return;
  }
  const labels = {
    routes: "Rotas",
    autocomplete: "Sugestões",
    details: "Endereços selecionados",
    geocode: "Endereços por texto",
  };
  $("budget").innerHTML =
    `<p>${b.monitor.blocked ? "Consultas pausadas" : "Proteção ativa"}${b.monitor.reason ? " · " + esc(b.monitor.reason) : ""}</p>` +
    Object.entries(b.usage)
      .map(
        ([key, v]) =>
          `<p><b>${labels[key] || esc(key)}</b><br>Hoje ${v.day}/${v.daily} · Mês ${v.month}/${v.monthly}</p>`,
      )
      .join("");
}
function rowElement(row) {
  return document.querySelector(`[data-row="${row.id}"]`);
}
function addRow() {
  const row = {
    id: crypto.randomUUID(),
    session: crypto.randomUUID(),
    text: "",
    price: "",
    valid: false,
    sequence: 0,
  };
  rows.push(row);
  const el = document.createElement("article");
  el.className = "address-row";
  el.dataset.row = row.id;
  el.innerHTML = `<div class="row-heading"><span>Entrega ${rows.length}</span><button type="button" data-remove aria-label="Remover entrega">Remover</button></div><div class="fields"><button type="button" class="confirmed-address" title="Editar endereço" hidden></button><label class="address-label">Endereço<input class="address-input" placeholder="Rua, número e cidade" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="suggestions-${row.id}"></label><label>Valor<div class="price-wrap"><span>R$</span><input class="price-input" inputmode="decimal" placeholder="—" aria-label="Valor da entrega em reais"></div></label></div><button type="button" class="confirm">Confirmar endereço</button><p class="row-status" role="status"></p><div class="suggestions" id="suggestions-${row.id}" role="listbox" hidden></div>`;
  $("draft-stops").append(el);
  el.querySelector(".confirm").hidden = true;
  el.querySelector(".confirmed-address").onclick = () => {
    el.classList.remove("valid");
    el.querySelector(".confirmed-address").hidden = true;
    row.valid = false;
    row.phase = "editing";
    row.session = crypto.randomUUID();
    row.autoCount = 0;
    el.querySelector(".confirm").hidden = false;
    el.querySelector(".address-input").focus();
    submissionId = crypto.randomUUID();
    updateDraftTotal();
  };
  el.querySelector(".address-input").addEventListener("input", (e) => {
    row.text = e.target.value;
    row.valid = false;
    el.querySelector(".confirm").hidden = !row.text.trim();
    row.selectionId = null;
    row.sequence++;
    row.controller?.abort();
    clearTimeout(row.timer);
    el.classList.remove("valid");
    el.querySelector(".row-status").textContent = "";
    closeSuggestions(row);
    submissionId = crypto.randomUUID();
    updateDraftTotal();
    row.phase = "editing";
    if (
      row.text.trim().length >= 5 &&
      !row.autoPaused &&
      (row.autoCount || 0) < 4 &&
      row.lastQuery !== row.text.trim()
    )
      row.timer = setTimeout(() => suggest(row), 850);
  });
  el.querySelector(".address-input").addEventListener("keydown", (e) => {
    const choices = [...el.querySelectorAll("[data-choice]")];
    if (e.key === "ArrowDown" && choices.length) {
      e.preventDefault();
      choices[0].focus();
    }
    if (e.key === "Escape") closeSuggestions(row);
    if (e.key === "Enter") {
      e.preventDefault();
      void run(el.querySelector(".confirm"), () => resolveRow(row));
    }
  });
  el.querySelector(".price-input").addEventListener("input", (e) => {
    row.price = e.target.value;
    row.priceEdited = true;
    submissionId = crypto.randomUUID();
    updateDraftTotal();
  });
  el.querySelector(".confirm").onclick = (e) =>
    run(e.currentTarget, () => resolveRow(row));
  el.querySelector("[data-remove]").onclick = () => {
    clearTimeout(row.timer);
    row.controller?.abort();
    rows = rows.filter((r) => r !== row);
    el.remove();
    submissionId = crypto.randomUUID();
    if (!rows.length) addRow();
    document
      .querySelectorAll(".row-heading>span")
      .forEach((span, i) => (span.textContent = "Entrega " + (i + 1)));
    updateDraftTotal();
  };
  updateDraftTotal();
  return row;
}
function closeSuggestions(row) {
  const el = rowElement(row);
  if (!el) return;
  el.querySelector(".suggestions").hidden = true;
  el.querySelector(".address-input").setAttribute("aria-expanded", "false");
}
async function suggest(row) {
  const el = rowElement(row),
    seq = row.sequence;
  if (
    !el ||
    row.valid ||
    document.activeElement !== el.querySelector(".address-input")
  )
    return;
  row.autoCount = (row.autoCount || 0) + 1;
  row.lastQuery = row.text.trim();
  row.controller = new AbortController();
  try {
    const result = await api(
      "/autocomplete",
      {
        input: row.text,
        session: row.session,
        operationId: crypto.randomUUID(),
      },
      row.controller.signal,
    );
    if (row.sequence !== seq || !el.isConnected) return;
    const box = el.querySelector(".suggestions");
    box.innerHTML =
      result.suggestions
        .map(
          (p, i) =>
            `<button type="button" role="option" data-choice="${i}">${esc(p.label)}</button>`,
        )
        .join("") + '<div class="google-attribution">Google Maps</div>';
    box.hidden = !result.suggestions.length;
    el.querySelector(".address-input").setAttribute(
      "aria-expanded",
      String(!box.hidden),
    );
    box.querySelectorAll("button").forEach((button, i) => {
      button.onclick = () =>
        run(el.querySelector(".confirm"), () =>
          resolveRow(row, result.suggestions[i]),
        );
      button.onkeydown = (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          button.nextElementSibling?.matches("button") &&
            button.nextElementSibling.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          (
            button.previousElementSibling || el.querySelector(".address-input")
          ).focus();
        }
        if (e.key === "Escape") {
          closeSuggestions(row);
          el.querySelector(".address-input").focus();
        }
      };
    });
  } catch (e) {
    if (e.name === "AbortError") return;
    if (e.status === 429 || e.status === 503) {
      row.autoPaused = true;
      el.querySelector(".row-status").textContent =
        "Digite rua, número e cidade e toque em Confirmar.";
    }
  }
}
async function resolveRow(row, choice) {
  const el = rowElement(row);
  if (row.phase === "resolving" || row.valid) return;
  if (!row.text.trim()) throw new Error("Informe rua, número e cidade.");
  const seq = row.sequence;
  row.phase = "resolving";
  clearTimeout(row.timer);
  row.controller?.abort();
  closeSuggestions(row);
  el.querySelector(".row-status").textContent = "Confirmando endereço…";
  try {
    const p = await api("/resolve", {
      placeId: choice?.placeId,
      address: row.text,
      session: row.session,
      operationId: crypto.randomUUID(),
    });
    if (seq !== row.sequence || !el.isConnected) return;
    row.selectionId = p.selectionId;
    row.text = p.address;
    row.valid = true;
    row.manual = false;
    row.session = crypto.randomUUID();
    el.querySelector(".address-input").value = p.address;
    el.classList.add("valid");
    if (!row.priceEdited && Number.isInteger(p.suggestedCents)) {
      row.price = (p.suggestedCents / 100).toFixed(2).replace(".", ",");
      el.querySelector(".price-input").value = row.price;
    }
    el.querySelector(".row-status").textContent =
      "✓ Confirmado · Google Maps" +
      (p.suggestedCents === undefined ? " · Informe o valor." : "");
    row.phase = "ready";
    el.querySelector(".confirmed-address").textContent = row.text;
    el.querySelector(".confirmed-address").hidden = false;
    el.querySelector(".confirm").hidden = true;
    if (rows.at(-1) === row) addRow();
    submissionId = crypto.randomUUID();
    updateDraftTotal();
  } catch (e) {
    if (seq !== row.sequence || !el.isConnected) return;
    row.phase = "editing";
    el.querySelector(".row-status").textContent = e.message;
    if (
      [429, 503, 502].includes(e.status) &&
      /\d/.test(row.text) &&
      row.text.trim().length >= 8
    ) {
      row.valid = true;
      row.phase = "ready";
      el.classList.add("valid");
      el.querySelector(".confirmed-address").textContent = row.text;
      el.querySelector(".confirmed-address").hidden = false;
      el.querySelector(".confirm").hidden = true;
      row.manual = true;
      row.selectionId = null;
      el.querySelector(".row-status").textContent =
        "Consulta indisponível. Endereço escrito; informe o valor. A rota será confirmada depois.";
      if (rows.at(-1) === row) addRow();
      updateDraftTotal();
    } else throw e;
  }
}
function cents(row) {
  const value = row.price.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const n = Math.round(Number(value) * 100);
  return n <= 100000 ? n : null;
}
function updateDraftTotal() {
  const filled = rows.filter((r) => r.text.trim());
  $("draft-total").textContent = money(
    filled.reduce((n, r) => n + (cents(r) || 0), 0),
  );
  $("draft-count").textContent = filled.length
    ? filled.length + " endereços"
    : "";
  const available =
    state && (state.availability.open || state.availability.scheduledAt);
  $("submit-order").disabled =
    submitting ||
    !available ||
    !filled.length ||
    filled.some((r) => !r.valid || cents(r) === null);
  const choices = rows.filter((r) => r.valid);
  if (!choices.some((r) => r.id === priorityId) || choices.length < 2)
    priorityId = null;
  const priority = $("priority-open");
  priority.hidden = choices.length < 2;
  priority.textContent = priorityId
    ? "Prioridade: entrega " +
      (rows.findIndex((r) => r.id === priorityId) + 1) +
      " · alterar"
    : "Definir prioridade";
  $("draft-help").textContent = !available
    ? "Aguarde a abertura do atendimento."
    : filled.some((r) => !r.valid)
      ? "Confirme o endereço com número para continuar."
      : filled.some((r) => cents(r) === null)
        ? "Informe o valor de cada entrega."
        : "";
}
$("order-form").onsubmit = (e) => {
  e.preventDefault();
  if (submitting || $("submit-order").disabled) return;
  submitting = true;
  $("order-form").inert = true;
  $("order-form").setAttribute("aria-busy", "true");
  $("submit-order").firstElementChild.textContent = "Enviando…";
  updateDraftTotal();
  run(null, async () => {
    try {
      const stops = rows
        .filter((r) => r.text.trim())
        .map((r) => ({
          selectionId: r.selectionId || undefined,
          address: r.text,
          priceCents: cents(r),
        }));
      const priority = rows
        .filter((r) => r.text.trim())
        .findIndex((r) => r.id === priorityId);
      await mutate("/orders", { submissionId, stops, priority });
      priorityId = null;
      rows.forEach((r) => {
        clearTimeout(r.timer);
        r.controller?.abort();
      });
      rows = [];
      $("draft-stops").innerHTML = "";
      submissionId = crypto.randomUUID();
      addRow();
      toast("Pedido enviado.");
      $("active-section").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } finally {
      submitting = false;
      $("order-form").inert = false;
      $("order-form").removeAttribute("aria-busy");
      $("submit-order").firstElementChild.textContent = "Chamar o Maikon";
      updateDraftTotal();
    }
  });
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.historyKey) {
    const detail = b
      .closest("table")
      .querySelector(`[data-history-detail="${b.dataset.historyKey}"]`);
    detail.hidden = !detail.hidden;
    b.setAttribute("aria-expanded", String(!detail.hidden));
  }
  if (b.dataset.availability)
    void run(b, () =>
      mutate("/availability", { action: b.dataset.availability }),
    );
  if (b.hasAttribute("data-schedule")) $("schedule-dialog").showModal();
  if (b.dataset.order) {
    const action = b.dataset.action;
    const body = { action };
    if (action === "cancel") {
      body.reason = prompt("Motivo do cancelamento:");
      if (!body.reason) return;
    }
    if (action === "delay") {
      const value = prompt("Em quantos minutos você chega?", "10");
      if (value === null) return;
      body.minutes = Number(value);
    }
    if (action === "delivered") body.index = Number(b.dataset.index);
    const popup =
      action === "start" ? window.open("about:blank", "_blank") : null;
    void run(b, async () => {
      try {
        const o = await mutate(
          `/orders/${b.dataset.order}/${action === "route" ? "route" : "action"}`,
          body,
        );
        if (action === "start" && o.navigation?.[0]?.url) {
          if (popup) popup.location.replace(o.navigation[0].url);
          else toast("Rota iniciada. Toque em Abrir rota no Google Maps.");
        } else popup?.close();
      } catch (e) {
        popup?.close();
        throw e;
      }
    });
  }
});
$("login-form").onsubmit = (e) => {
  e.preventDefault();
  void run(e.submitter, async () => {
    try {
      const r = await api("/login", {
        username: $("username").value,
        password: $("password").value,
      });
      token = r.token;
      sessionEpoch++;
      localStorage.setItem("unifarma.token", token);
      localStorage.setItem("unifarma.expiresAt", r.expiresAt);
      $("password").value = "";
      $("login-error").textContent = "";
      await refresh();
    } catch (e) {
      $("login-error").textContent = e.message;
      throw e;
    }
  });
};
$("logout").onclick = (e) =>
  run(e.currentTarget, async () => {
    await api("/logout", {});
    logoutLocal();
  });
$("refresh-now").onclick = (e) => run(e.currentTarget, refresh);
$("close-schedule").onclick = () => $("schedule-dialog").close();
$("schedule-form").onsubmit = (e) => {
  e.preventDefault();
  void run(e.submitter, async () => {
    await mutate("/availability", {
      action: "schedule",
      at: $("schedule-at").value + ":00-03:00",
    });
    $("schedule-dialog").close();
  });
};
$("base-form").onsubmit = (e) => {
  e.preventDefault();
  void run(e.submitter, async () => {
    const p = await api("/resolve", {
      address: $("base-input").value,
      session: crypto.randomUUID(),
      operationId: crypto.randomUUID(),
      base: true,
    });
    await mutate("/google-base", { selectionId: p.selectionId });
    toast("Base atualizada.");
  });
};
$("history-form").onsubmit = (e) => {
  e.preventDefault();
  void run(e.submitter, async () => {
    const r = await api(
      "/history?day=" + encodeURIComponent($("history-day").value),
    );
    const total = r.orders
      .filter((o) => o.status !== "cancelled")
      .reduce((n, o) => n + o.totalCents, 0);
    $("history-orders").innerHTML = r.orders.length
      ? `<div class="draft-total"><span>Total do dia consultado</span><strong>${money(total)}</strong></div>` +
        historyTable(
          r.items?.length === r.orders.reduce((n, o) => n + o.stops.length, 0)
            ? r.items
            : historyEntries(r.orders),
        )
      : '<p class="empty">Nenhum registro neste dia.</p>';
  });
};
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refresh();
});
for (const event of ["focus", "pageshow", "online"])
  window.addEventListener(event, () => void refresh());
// One request at a time, immediate refresh after mutations and on returning from Maps.
setInterval(() => {
  if (!document.hidden) void refresh();
}, 12000);
function stopLive() {
  liveEpoch++;
  liveController?.abort();
  liveController = null;
}
function startLive() {
  if (!token || document.hidden || liveController) return;
  const epoch = liveEpoch,
    auth = token;
  const controller = new AbortController();
  liveController = controller;
  (async () => {
    try {
      const r = await fetch("/api/entregas/updates", {
        headers: { Authorization: "Bearer " + auth },
        cache: "no-store",
        signal: controller.signal,
      });
      if (
        !r.ok ||
        !r.headers.get("content-type")?.includes("text/event-stream")
      )
        throw new Error("stream unavailable");
      const reader = r.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      while (auth === token && epoch === liveEpoch) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const message = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (message.includes("event: change")) void refresh();
        }
      }
    } catch {
    } finally {
      if (epoch === liveEpoch && auth === token) {
        setTimeout(() => {
          if (epoch === liveEpoch && liveController === controller) {
            liveController = null;
            startLive();
          }
        }, 3000);
      }
    }
  })();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopLive();
  else startLive();
});
if (token) void refresh();
if (
  location.protocol !== "https:" &&
  !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
) {
  $("login-error").textContent = "Use HTTPS para entrar com segurança.";
  $("login-form button").disabled = true;
}

$("priority-open").onclick = () => {
  const candidates = rows.filter((r) => r.valid);
  if (candidates.length < 2) return;
  $("priority-select").innerHTML =
    '<option value="">Sem prioridade</option>' +
    candidates
      .map((r) => `<option value="${r.id}">${esc(r.text)}</option>`)
      .join("");
  $("priority-select").value = priorityId || "";
  priorityReadyAt = Date.now() + 3000;
  $("priority-save").disabled = true;
  $("priority-save").textContent = "Disponível em 3 s";
  $("priority-dialog").showModal();
  clearInterval(priorityTimer);
  priorityTimer = setInterval(() => {
    const left = Math.max(0, Math.ceil((priorityReadyAt - Date.now()) / 1000));
    $("priority-save").textContent = left
      ? "Disponível em " + left + " s"
      : "Aplicar prioridade";
    $("priority-save").disabled = !!left;
    if (!left) clearInterval(priorityTimer);
  }, 200);
};
$("priority-close").onclick = () => $("priority-dialog").close();
$("priority-dialog").onclose = () => clearInterval(priorityTimer);
$("priority-form").onsubmit = (e) => {
  e.preventDefault();
  if (Date.now() < priorityReadyAt) return;
  priorityId = $("priority-select").value || null;
  submissionId = crypto.randomUUID();
  $("priority-dialog").close();
  updateDraftTotal();
};
