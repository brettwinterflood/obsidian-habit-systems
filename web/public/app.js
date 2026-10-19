const $ = (sel) => document.querySelector(sel);

function showError(msg) {
  const el = $("#error");
  if (!msg) {
    el.hidden = true;
    return;
  }
  el.textContent = msg;
  el.hidden = false;
}

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { Accept: "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function statusSymbol(status) {
  if (status === "success") return "✓";
  if (status === "fail") return "✗";
  if (status === "todo") return "−";
  return "";
}

async function loadToday() {
  const data = await api("/api/habits/today");
  $("#today-label").textContent = data.date;
  const panel = $("#panel-checkin");
  if (!data.items?.length) {
    panel.innerHTML = `<p class="empty">No habits found in Habits.md blocks.</p>`;
    return;
  }
  const list = document.createElement("div");
  list.className = "habit-list";
  for (const item of data.items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `habit-row${item.status === "success" ? " done" : ""}`;
    const streak = data.streaks?.[item.habit] ?? 0;
    btn.innerHTML = `
      <span class="mark">${item.status === "success" ? "✓" : ""}</span>
      <span class="habit-meta">
        <span class="habit-name">${escapeHtml(item.habit)}</span>
        <span class="streak">${streak ? `${streak} day streak` : "Tap to log today"}</span>
      </span>`;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api("/api/habits/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habit: item.habit }),
        });
        await loadToday();
        showError("");
      } catch (e) {
        showError(e.message);
      } finally {
        btn.disabled = false;
      }
    });
    list.appendChild(btn);
  }
  panel.replaceChildren(list);
}

async function loadHistory() {
  const data = await api("/api/habits/history?days=14");
  const panel = $("#panel-history");
  if (!data.habits?.length) {
    panel.innerHTML = `<p class="empty">No history.</p>`;
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "history-grid";
  const table = document.createElement("table");
  const head = document.createElement("tr");
  head.innerHTML = `<th>Habit</th>${data.dates
    .map((d) => `<th>${d.slice(5)}</th>`)
    .join("")}`;
  table.appendChild(head);
  for (let h = 0; h < data.habits.length; h++) {
    const tr = document.createElement("tr");
    const habit = data.habits[h];
    tr.innerHTML = `<th title="${escapeAttr(habit)}">${escapeHtml(habit)}</th>`;
    for (let d = 0; d < data.dates.length; d++) {
      const row = data.data[d];
      const cell = row[h + 1];
      const td = document.createElement("td");
      td.textContent = statusSymbol(cell?.status);
      td.className = `cell-${cell?.status || "neutral"}`;
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
  wrap.appendChild(table);
  panel.replaceChildren(wrap);
}

async function loadGoals() {
  const data = await api("/api/goals");
  const panel = $("#panel-goals");
  const goals = data.goals || [];
  if (!goals.length) {
    panel.innerHTML = `<p class="empty">No goals matched Goals.base filters.</p>`;
    return;
  }
  const list = document.createElement("div");
  list.className = "goals-list";
  for (const g of goals) {
    const card = document.createElement("article");
    card.className = "goal-card";
    const habits =
      g.habits?.length
        ? g.habits.map((h) => escapeHtml(h)).join(", ")
        : "—";
    card.innerHTML = `
      <p class="goal-rank">rank ${g.rank}${g.status ? ` · ${escapeHtml(g.status)}` : ""}</p>
      <h3>${escapeHtml(g.currentGoal)}</h3>
      <p class="goal-habits">Habits: ${habits}</p>`;
    list.appendChild(card);
  }
  panel.replaceChildren(list);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      const name = tab.dataset.tab;
      for (const panel of document.querySelectorAll(".panel")) {
        const on = panel.id === `panel-${name}`;
        panel.classList.toggle("active", on);
        panel.hidden = !on;
      }
      showError("");
      try {
        if (name === "checkin") await loadToday();
        if (name === "history") await loadHistory();
        if (name === "goals") await loadGoals();
      } catch (e) {
        showError(e.message);
      }
    });
  });
}

async function init() {
  setupTabs();
  try {
    await loadToday();
  } catch (e) {
    showError(e.message);
  }
}

init();
