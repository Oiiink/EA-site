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
  totalSubTimeAdded: 0,
  totalBitTimeAdded: 0,
  activity: [],
  chat: [],
  timeHistory: [],

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

  if (type === "sub") {
    state.totalSubs += amount;
    state.totalSubTimeAdded += seconds;
  } else {
    state.totalBits += amount;
    state.totalBitTimeAdded += seconds;
  }

  state.timeHistory.unshift({
    id: Date.now() + Math.random(),
    type,
    user,
    amount,
    seconds,
    timestamp: Date.now()
  });
  state.timeHistory = state.timeHistory.slice(0, 20);

  addActivity(type, user, amount, seconds);
  addToLeaderboard(type, user, amount);

  saveState();
  render();
  showTimerAdd(seconds);
}

function renderActivity() {
  const feed = $("#activityFeed");
  const donationItems = state.activity.map(item => ({
    ...item,
    feedType: "donation"
  }));

  const chatItems = (state.chat || []).map(item => ({
    ...item,
    feedType: "chat"
  }));

  const combined = [...donationItems, ...chatItems]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 45);

  if (!combined.length) {
    feed.innerHTML = `
      <div class="activity-item">
        <div class="activity-avatar">♥</div>
        <div class="activity-content">
          <div class="activity-user">Waiting for activity…</div>
          <span class="activity-text">Subs, Bits and chat messages will appear here.</span>
        </div>
      </div>
    `;
    return;
  }

  feed.innerHTML = combined.map(item => {
    if (item.feedType === "chat") {
      return `
        <div class="activity-item chat-message">
          <div class="activity-avatar">💬</div>
          <div class="activity-content">
            <div class="activity-user">
              ${escapeHtml(item.user)}
              ${item.mod ? '<span class="chat-badge">MOD</span>' : ''}
              ${item.vip ? '<span class="chat-badge">VIP</span>' : ''}
            </div>
            <span class="activity-text">${escapeHtml(item.message)}</span>
          </div>
          <div class="activity-time">${relativeTime(item.timestamp)}</div>
        </div>
      `;
    }

    const avatar = item.type === "sub" ? "🎁" : "◆";
    const amountText = item.type === "sub"
      ? item.amount === 1 ? "1 Sub" : `${item.amount} Gifted Subs`
      : `${formatNumber(item.amount)} Bits`;

    const isBig = (item.type === "bits" && item.amount >= 1000) || (item.type === "sub" && item.amount >= 5);
    const timeAddedText = formatAddedTime(item.seconds);

    return `
      <div class="activity-item ${item.type}${isBig ? " big-donation" : ""}">
        <div class="activity-avatar">${avatar}</div>
        <div class="activity-content">
          <div class="activity-user">${escapeHtml(item.user)}</div>
          <span class="activity-text">${escapeHtml(item.text)} • <strong>${amountText}</strong></span>
          <span class="donation-time">+ <strong>${timeAddedText}</strong> added to timer</span>
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

let podiumType = "subs";
let podiumPage = 0;
let podiumInterval = null;

function formatAddedTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(sec)}s`;
  return `${sec}s`;
}

function renderTimeAdded() {
  const sub = state.totalSubTimeAdded || 0;
  const bits = state.totalBitTimeAdded || 0;

  $("#subTimeAdded").textContent = formatAddedTime(sub);
  $("#bitTimeAdded").textContent = formatAddedTime(bits);
  $("#totalTimeAdded").textContent = formatAddedTime(sub + bits);
  $("#timeAddedCount").textContent = `${(state.timeHistory || []).length} events`;

  const history = $("#timeHistory");
  if (!state.timeHistory?.length) {
    history.innerHTML = `<div class="time-history-empty">No support events yet. Use Simulation below to add some.</div>`;
    return;
  }

  history.innerHTML = state.timeHistory.slice(0, 8).map(item => `
    <div class="time-history-row">
      <div class="time-history-icon">${item.type === "sub" ? "🎁" : "💜"}</div>
      <div>
        <div class="time-history-user">${escapeHtml(item.user)}</div>
        <div class="time-history-detail">${item.type === "sub" ? `${item.amount} gifted sub${item.amount === 1 ? "" : "s"}` : `${formatNumber(item.amount)} Bits`}</div>
      </div>
      <div class="time-history-detail">${relativeTime(item.timestamp)}</div>
      <div class="time-history-added ${item.type === "bits" ? "bits" : ""}">+${formatAddedTime(item.seconds)}</div>
    </div>
  `).join("");
}

function renderRoadmap() {
  const roadmap = $("#roadmap");
  roadmap.innerHTML = CONFIG.goals.map((goal, index) => {
    const reached = state.totalSubs >= goal.amount;
    const previous = index === 0 ? 0 : CONFIG.goals[index - 1].amount;
    const current = state.totalSubs >= previous && state.totalSubs < goal.amount;
    return `
      <div class="roadmap-step ${reached ? "reached" : ""} ${current ? "current" : ""}">
        <div class="roadmap-node">${reached ? "✓" : goal.icon}</div>
        <div class="roadmap-amount">${goal.amount} GIFTED</div>
        <div class="roadmap-name">${escapeHtml(goal.name)}</div>
        <div class="roadmap-status">${reached ? "Unlocked" : current ? "Next Goal" : "Locked"}</div>
      </div>
    `;
  }).join("");
}

function renderPodium() {
  const data = mergeLeaderboard(2026, podiumType).slice(0, 3);
  const ordered = [data[1], data[0], data[2]];
  const classes = ["second", "first", "third"];

  $("#podiumTitle").textContent = podiumType === "bits" ? "Bits" : "Gifted Subs";

  $("#podium").innerHTML = [0, 1, 2].map((i) => {
    const item = ordered[i];
    if (!item) {
      return `
        <div class="podium-place ${classes[i]}">
          <div class="podium-avatar">?</div>
          <div class="podium-name">Waiting...</div>
          <div class="podium-amount">0</div>
          <div class="podium-block"><div class="podium-rank">#${i === 0 ? 2 : i === 1 ? 1 : 3}</div></div>
        </div>`;
    }

    const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
    return `
      <div class="podium-place ${classes[i]}">
        ${rank === 1 ? '<div class="podium-crown">♛</div>' : ""}
        <div class="podium-avatar">${escapeHtml(item.name.slice(0, 1).toUpperCase())}</div>
        <div class="podium-name">${escapeHtml(item.name)}</div>
        <div class="podium-amount">${formatNumber(item.amount)} ${podiumType === "bits" ? "Bits" : "Subs"}</div>
        <div class="podium-block"><div class="podium-rank">#${rank}</div></div>
      </div>`;
  }).join("");

  $("#podiumDots").innerHTML = `
    <span class="podium-dot ${podiumType === "subs" ? "active" : ""}"></span>
    <span class="podium-dot ${podiumType === "bits" ? "active" : ""}"></span>
  `;
}

function updateStreamStatus() {
  // GitHub Pages cannot safely query Twitch's authenticated Helix API directly.
  // The UI is ready for a backend later. For now, the embedded player is the source of truth.
  const online = true;
  $("#streamStatusTitle").textContent = online ? "OiiinkYT" : "OiiinkYT";
  $("#streamStatusText").textContent = online
    ? "Twitch player ready • live status follows Twitch"
    : "Currently offline";
}

function render() {
  updateTimer();
  updateGoal();
  updatePerks();
  renderActivity();
  renderLeaderboard();
  renderSupporterTicker();
  renderTimeAdded();
  renderRoadmap();
  renderPodium();
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

const FAKE_CHAT_MESSAGES = [
  ["MaceMain", "W stream", false, false],
  ["OiiinkFan", "BRO THE TIMER 💀", false, false],
  ["LeonePlayer", "25 gifted incoming", false, true],
  ["EventKing", "when is the event??", false, false],
  ["RandomViewer", "WOOOOOO", false, false],
  ["MinecraftGuy", "that was actually crazy", false, false],
  ["SubEnjoyer", "KEEP THE TIMER GOING", false, false],
  ["RedstonePro", "facecam soon 👀", false, false],
  ["OiiinkFan", "LETS GOOOO", true, false],
  ["MaceMain", "this subathon is cooked", false, false],
  ["EventKing", "NO WAYYYYY", false, false],
  ["LeonePlayer", "W stream W chat", false, false],
  ["RandomViewer", "bro is never ending the stream", false, false],
  ["SubEnjoyer", "1 more goal!!!", false, false],
  ["MinecraftGuy", "LMAO", false, false]
];

function addFakeChatMessage() {
  if (!state.chat) state.chat = [];

  const item = FAKE_CHAT_MESSAGES[Math.floor(Math.random() * FAKE_CHAT_MESSAGES.length)];

  state.chat.unshift({
    id: Date.now() + Math.random(),
    user: item[0],
    message: item[1],
    mod: item[2],
    vip: item[3],
    timestamp: Date.now()
  });

  state.chat = state.chat.slice(0, 35);
  saveState();
  renderActivity();

  // Keep the feed feeling like Twitch chat by scrolling to the newest message.
  const feed = $("#activityFeed");
  if (feed) feed.scrollTop = 0;
}


function setupEvents() {
  $$(".podium-type").forEach(btn => {
    btn.addEventListener("click", () => {
      podiumType = btn.dataset.podium;
      $$(".podium-type").forEach(x => x.classList.toggle("active", x === btn));
      podiumPage = 0;
      renderPodium();
    });
  });

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
      totalSubTimeAdded: 0,
      totalBitTimeAdded: 0,
      activity: [],
      chat: [],
      timeHistory: [],

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
updateStreamStatus();

podiumInterval = setInterval(() => {
  podiumType = podiumType === "subs" ? "bits" : "subs";
  $$(".podium-type").forEach(x => x.classList.toggle("active", x.dataset.podium === podiumType));
  renderPodium();
}, 7000);

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

// Simulated Twitch chat: new fake chat messages appear automatically.
setInterval(addFakeChatMessage, 4200);

setInterval(saveState, 10000);
