const STORAGE_KEY = "oiiink-subathon-state-v2";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const BASE_SECONDS =
  CONFIG.startingTime.days * 86400 +
  CONFIG.startingTime.hours * 3600 +
  CONFIG.startingTime.minutes * 60 +
  CONFIG.startingTime.seconds;

let state = {
  timeRemaining: BASE_SECONDS,
  totalSubs: 0,
  totalBits: 0,
  activity: [],
  customLeaderboard: {
    2026: { subs: [], bits: [] },
    2025: { subs: [], bits: [] }
  }
};

let selectedYear = 2026;
let selectedType = "subs";

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;

    state = {
      ...state,
      ...saved,
      customLeaderboard: {
        ...state.customLeaderboard,
        ...(saved.customLeaderboard || {}),
        2025: {
          ...state.customLeaderboard[2025],
          ...(saved.customLeaderboard?.[2025] || {})
        },
        2026: {
          ...state.customLeaderboard[2026],
          ...(saved.customLeaderboard?.[2026] || {})
        }
      }
    };
  } catch (e) {
    console.warn("Could not load Subathon state:", e);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

function formatClock(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${pad(m)}m`;
  }

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function updateTimer() {
  const total = Math.max(0, state.timeRemaining);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  $("#days").textContent = pad(d);
  $("#hours").textContent = pad(h);
  $("#minutes").textContent = pad(m);
  $("#seconds").textContent = pad(s);
  $("#subathonTimer").textContent = formatClock(total);
}

function goalInfo() {
  const goal = CONFIG.goals.find(g => state.totalSubs < g.amount);

  if (!goal) {
    return {
      goal: null,
      previous: CONFIG.goals.at(-1)?.amount || 0,
      percentage: 100,
      needed: 0,
      level: CONFIG.goals.length + 1
    };
  }

  const index = CONFIG.goals.indexOf(goal);
  const previous = index === 0 ? 0 : CONFIG.goals[index - 1].amount;
  const range = goal.amount - previous;
  const current = state.totalSubs - previous;

  return {
    goal,
    previous,
    percentage: Math.min(100, Math.max(0, Math.round(current / range * 100))),
    needed: goal.amount - state.totalSubs,
    level: index + 1
  };
}

function updateGoal() {
  const info = goalInfo();

  if (!info.goal) {
    $("#goalTitle").textContent = "All Sub Goals Complete";
    $("#goalDescription").textContent = "Every perk unlocked";
    $("#goalCount").textContent = `${state.totalSubs} / ${CONFIG.goals.at(-1).amount}`;
    $("#goalProgress").style.width = "100%";
    $("#goalNeeded").textContent = "0";
    $("#goalName").textContent = "All perks unlocked";

    $("#subathonLevel").textContent = "MAX LEVEL";
    $("#subathonPercent").textContent = "100%";
    $("#subathonProgress").style.width = "100%";
    $("#subathonNeeded").textContent = "0";
    $("#subathonGoalName").textContent = "All perks unlocked";
    return;
  }

  $("#goalTitle").textContent = "Next Sub Goal";
  $("#goalDescription").textContent = info.goal.description;
  $("#goalCount").textContent = `${state.totalSubs} / ${info.goal.amount}`;
  $("#goalProgress").style.width = `${info.percentage}%`;
  $("#goalNeeded").textContent = info.needed;
  $("#goalName").textContent = info.goal.name;

  $("#subathonLevel").textContent = `LEVEL ${info.level}`;
  $("#subathonPercent").textContent = `${info.percentage}%`;
  $("#subathonProgress").style.width = `${info.percentage}%`;
  $("#subathonNeeded").textContent = info.needed;
  $("#subathonGoalName").textContent = info.goal.name;
}

function updatePerks() {
  CONFIG.goals.forEach(goal => {
    const card = $(`.perk-card[data-goal="${goal.amount}"]`);
    const status = $(`#perkStatus${goal.amount}`);
    if (!card || !status) return;

    const unlocked = state.totalSubs >= goal.amount;
    card.classList.toggle("unlocked", unlocked);
    status.textContent = unlocked
      ? "Unlocked"
      : `${goal.amount - state.totalSubs} more gifted`;
  });
}

function showTimerAdd(seconds) {
  const el = $("#timerAdd");
  const sign = seconds >= 0 ? "+" : "-";
  const amount = Math.abs(seconds);

  let text;
  if (amount >= 3600) text = `${sign}${Math.floor(amount / 3600)}h`;
  else if (amount >= 60) text = `${sign}${Math.floor(amount / 60)}m`;
  else text = `${sign}${amount}s`;

  el.textContent = text;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");

  const timer = $("#timerDisplay");
  timer.classList.remove("bump");
  void timer.offsetWidth;
  timer.classList.add("bump");

  spawnParticles();
}

function spawnParticles() {
  const effects = $("#effects");

  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "timer-particle";
    p.style.left = `${45 + Math.random() * 10}%`;
    p.style.top = `${35 + Math.random() * 25}%`;
    p.style.setProperty("--x", `${(Math.random() - .5) * 280}px`);
    p.style.setProperty("--y", `${-70 - Math.random() * 190}px`);
    p.style.animationDelay = `${Math.random() * 120}ms`;
    effects.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

function addActivity(type, user, amount, secondsAdded) {
  const text = type === "sub"
    ? amount === 1
      ? "subscribed"
      : `gifted ${amount} subs`
    : `cheered ${formatNumber(amount)} Bits`;

  state.activity.unshift({
    id: Date.now() + Math.random(),
    type,
    user,
    amount,
    text,
    timestamp: Date.now()
  });

  state.activity = state.activity.slice(0, 40);
}

function addToLeaderboard(type, user, amount) {
  const list = state.customLeaderboard[selectedYear][type];
  const existing = list.find(x => x.name.toLowerCase() === user.toLowerCase());

  if (existing) existing.amount += amount;
  else list.push({ name: user, amount });

  list.sort((a, b) => b.amount - a.amount);
  state.customLeaderboard[selectedYear][type] = list.slice(0, 25);
}

function simulate(type, amount, user) {
  const seconds = type === "sub"
    ? CONFIG.secondsPerSub * amount
    : CONFIG.secondsPerBit * amount;

  state.timeRemaining += seconds;

  if (type === "sub") state.totalSubs += amount;
  else state.totalBits += amount;

  addActivity(type, user, amount, seconds);
  addToLeaderboard(type, user, amount);

  saveState();
  render();
  showTimerAdd(seconds);
}

function renderActivity() {
  const feed = $("#activityFeed");

  if (!state.activity.length) {
    feed.innerHTML = `
      <div class="activity-item">
        <div class="activity-avatar">♥</div>
        <div class="activity-content">
          <div class="activity-user">Waiting for support…</div>
          <span class="activity-text">New subs and Bits will appear here.</span>
        </div>
      </div>
    `;
    return;
  }

  feed.innerHTML = state.activity.map(item => {
    const avatar = item.type === "sub" ? "🎁" : "◆";
    const amountText = item.type === "sub"
      ? item.amount === 1 ? "1 Sub" : `${item.amount} Gifted Subs`
      : `${formatNumber(item.amount)} Bits`;

    return `
      <div class="activity-item ${item.type}">
        <div class="activity-avatar">${avatar}</div>
        <div class="activity-content">
          <div class="activity-user">${escapeHtml(item.user)}</div>
          <span class="activity-text">${escapeHtml(item.text)} • <strong>${amountText}</strong></span>
        </div>
        <div class="activity-time">${relativeTime(item.timestamp)}</div>
      </div>
    `;
  }).join("");
}

function renderLeaderboard() {
  const configured = CONFIG.leaderboard[selectedYear]?.[selectedType] || [];
  const custom = state.customLeaderboard[selectedYear]?.[selectedType] || [];

  const combined = [...configured.map(x => ({...x})), ...custom];

  const merged = [];
  for (const entry of combined) {
    const existing = merged.find(x => x.name.toLowerCase() === entry.name.toLowerCase());
    if (existing) existing.amount += Number(entry.amount);
    else merged.push({ name: entry.name, amount: Number(entry.amount) });
  }

  merged.sort((a, b) => b.amount - a.amount);
  const top = merged.slice(0, 10);

  $("#leaderboardRows").innerHTML = top.length
    ? top.map((entry, i) => `
      <div class="leader-row">
        <div class="leader-rank">${i + 1}</div>
        <div class="leader-user">
          <div class="leader-avatar">${escapeHtml(entry.name.slice(0, 1).toUpperCase())}</div>
          <div class="leader-name">${escapeHtml(entry.name)}</div>
        </div>
        <div class="leader-amount ${selectedType === "bits" ? "bits" : ""}">
          ${formatNumber(entry.amount)} ${selectedType === "bits" ? "Bits" : "Subs"}
        </div>
      </div>
    `).join("")
    : `<div class="leader-row"><div></div><div class="leader-name">No data yet</div><div></div></div>`;
}

function renderSupporterTicker() {
  const subs = mergeLeaderboard(2026, "subs").slice(0, 3);
  const bits = mergeLeaderboard(2026, "bits").slice(0, 3);

  const items = [
    ...subs.map((x, i) => ({...x, type: "subs", rank: i + 1})),
    ...bits.map((x, i) => ({...x, type: "bits", rank: i + 1}))
  ];

  if (!items.length) return;

  const html = [...items, ...items].map(x => `
    <span class="supporter-item ${x.type === "bits" ? "bits" : ""}">
      <span class="supporter-rank">#${x.rank}</span>
      <span class="supporter-name">${escapeHtml(x.name)}</span>
      <span class="supporter-value">${formatNumber(x.amount)} ${x.type === "bits" ? "Bits" : "Subs"}</span>
      <span class="supporter-separator">◆</span>
    </span>
  `).join("");

  $("#supporterTrack").innerHTML = html;
}

function mergeLeaderboard(year, type) {
  const configured = CONFIG.leaderboard[year]?.[type] || [];
  const custom = state.customLeaderboard[year]?.[type] || [];
  const merged = [];

  for (const item of [...configured, ...custom]) {
    const found = merged.find(x => x.name.toLowerCase() === item.name.toLowerCase());
    if (found) found.amount += Number(item.amount);
    else merged.push({name: item.name, amount: Number(item.amount)});
  }

  return merged.sort((a, b) => b.amount - a.amount);
}

function render() {
  updateTimer();
  updateGoal();
  updatePerks();
  renderActivity();
  renderLeaderboard();
  renderSupporterTicker();
}

function relativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function randomName() {
  const names = [
    "OiiinkFan",
    "SubEnjoyer",
    "LeonePlayer",
    "MaceMain",
    "EventKing",
    "RandomViewer",
    "MinecraftGuy"
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function setupEvents() {
  $$(".year-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedYear = Number(btn.dataset.year);
      $$(".year-tab").forEach(x => x.classList.toggle("active", x === btn));
      renderLeaderboard();
      renderSupporterTicker();
    });
  });

  $$(".type-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedType = btn.dataset.type;
      $$(".type-tab").forEach(x => x.classList.toggle("active", x === btn));
      renderLeaderboard();
    });
  });

  $$("[data-sim]").forEach(btn => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.sim;
      const user = randomName();

      if (kind === "sub") simulate("sub", 1, user);
      if (kind === "gift5") simulate("sub", 5, user);
      if (kind === "gift10") simulate("sub", 10, user);
      if (kind === "bits100") simulate("bits", 100, user);
      if (kind === "bits1000") simulate("bits", 1000, user);
    });
  });

  $("#resetSimulation").addEventListener("click", () => {
    if (!confirm("Reset the simulated timer, activity and simulated leaderboard?")) return;

    state = {
      timeRemaining: BASE_SECONDS,
      totalSubs: 0,
      totalBits: 0,
      activity: [],
      customLeaderboard: {
        2026: { subs: [], bits: [] },
        2025: { subs: [], bits: [] }
      }
    };

    saveState();
    render();
  });

  $("#subathonDropdown").addEventListener("click", () => {
    $("#subathonCard").classList.toggle("expanded");
  });

  $("#activityDropdown").addEventListener("click", () => {
    $("#activityPanel").classList.toggle("collapsed");
  });
}

loadState();
setupEvents();
render();

setInterval(() => {
  if (state.timeRemaining > 0) {
    state.timeRemaining--;
    updateTimer();
    updateGoal();
  }
}, 1000);

setInterval(() => {
  renderActivity();
}, 15000);

setInterval(saveState, 10000);
