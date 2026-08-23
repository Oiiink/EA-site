const STORAGE_KEY = "oiiink-subathon-state-v3";

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
  timeHistory: [],
  hourlyEvents: [],
  eventLog: [],

  customLeaderboard: {
    2026: { subs: [], bits: [] },
    2025: { subs: [], bits: [] }
  }
};

let selectedYear = 2026;
let selectedType = "subs";

let podiumType = "subs";
let podiumInterval = null;

let roadmapFilter = "all";

/* ---------------- ROADMAP INCENTIVES ---------------- */

const ROADMAP_INCENTIVES = [
  /* SHORT CHALLENGES */

  {
    amount: 10,
    category: "short",
    icon: "📹",
    name: "Face Cam",
    description: "Face Cam during the day only."
  },

  {
    amount: 25,
    category: "short",
    icon: "🎤",
    name: "Host an Event on LeoneMC",
    description: "Oiiink hosts an event on LeoneMC."
  },

  {
    amount: 35,
    category: "short",
    icon: "🧠",
    name: "IQ Test",
    description: "Take an IQ test live on stream."
  },

  {
    amount: 50,
    category: "short",
    icon: "❓",
    name: "TBD",
    description: "This challenge will be announced later."
  },

  {
    amount: 75,
    category: "short",
    icon: "⛏️",
    name: "Beat Minecraft Within 25 Minutes",
    description: "Beat Minecraft with a 25-minute time limit."
  },

  {
    amount: 100,
    category: "short",
    icon: "😴",
    name: "Sleeping Face Cam",
    description: "Sleeping Face Cam. Viewers will be able to play loud sounds."
  },

  {
    amount: 125,
    category: "short",
    icon: "😂",
    name: "Try Not to Laugh",
    description: "$5 for every laugh."
  },

  {
    amount: 150,
    category: "short",
    icon: "🍕",
    name: "Order & Eat a Pizza",
    description: "Stream chooses up to 7 toppings."
  },

  {
    amount: 175,
    category: "short",
    icon: "🎱",
    name: "Marbles on Stream",
    description: "Marbles on Stream with a giveaway for exclusive Oiiink Subathon 2026 merch."
  },

  {
    amount: 200,
    category: "short",
    icon: "🌶️",
    name: "One Chip Challenge",
    description: "Take on the One Chip Challenge."
  },

  {
    amount: 250,
    category: "short",
    icon: "💬",
    name: "Change Discord Display Name",
    description: "Change Oiiink's Discord display name for a day."
  },

  {
    amount: 300,
    category: "short",
    icon: "📅",
    name: "Daily Streams for October",
    description: "Stream every day throughout October."
  },


  /* LONG CHALLENGES */

  {
    amount: 50,
    category: "long",
    icon: "⚔️",
    name: "Play Hoplite Until I Win",
    description: "Play Hoplite until Oiiink gets a win — Teams."
  },

  {
    amount: 100,
    category: "long",
    icon: "🏛️",
    name: "Mine an Entire Trial Chamber",
    description: "Mine every block inside an entire Trial Chamber."
  },

  {
    amount: 200,
    category: "long",
    icon: "🎯",
    name: "Draft Out Until I Win",
    description: "Keep playing Draft Out until Oiiink wins."
  },

  {
    amount: 300,
    category: "long",
    icon: "🔢",
    name: "Count to 10,000",
    description: "Count to 10,000. Donations can remove, add, or reset the count."
  },

  {
    amount: 500,
    category: "long",
    icon: "🏆",
    name: "All Advancements Multiplayer",
    description: "Complete every Minecraft advancement with other players."
  },

  {
    amount: 750,
    category: "long",
    icon: "🏆",
    name: "All Advancements Solo",
    description: "Complete every Minecraft advancement completely solo."
  },

  {
    amount: 800,
    category: "long",
    icon: "🎮",
    name: "24 Hours of Valorant",
    description: "Play Valorant for 24 hours — over 100 Swiftplays or 50 Unrated/Ranked games."
  },

  {
    amount: 1000,
    category: "long",
    icon: "🚗",
    name: "Reach GC in Rocket League",
    description: "Reach Grand Champion in Rocket League."
  },


  /* USER INCENTIVES */

  {
    amount: 25,
    category: "user",
    icon: "🎮",
    name: "Choose a Game",
    description: "I'll purchase any Steam/Epic Games game you want under $10 USD and play it for 1 hour. No NSFW."
  },

  {
    amount: 35,
    category: "user",
    icon: "👕",
    name: "Oiiink 2026 Subathon Merch",
    description: "Receive exclusive Oiiink 2026 Subathon merch.",
    link: "https://shop.oiiink.art"
  },

  {
    amount: 50,
    category: "user",
    icon: "🖼️",
    name: "Discord PFP",
    description: "Change Oiiink's Discord profile picture to whatever you want for one week. No NSFW."
  },

  {
    amount: 75,
    category: "user",
    icon: "❓",
    name: "TBD",
    description: "This user incentive will be announced later."
  },

  {
    amount: 100,
    category: "user",
    icon: "👥",
    name: "Friend Request",
    description: "Receive a friend request from Oiiink."
  }
];

const ROADMAP_CATEGORY_NAMES = {
  all: "All Incentives",
  short: "Short Challenges",
  long: "Long Challenges",
  user: "User Incentives"
};

const ROADMAP_CATEGORY_LABELS = {
  short: "SHORT CHALLENGE",
  long: "LONG CHALLENGE",
  user: "USER INCENTIVE"
};


/* ---------------- STATE ---------------- */

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
  } catch (error) {
    console.warn("Could not load Subathon state:", error);
  }
}

function normalizeState() {
  state.activity ||= [];
  state.timeHistory ||= [];
  state.hourlyEvents ||= [];
  state.eventLog ||= [];

  state.totalSubs ||= 0;
  state.totalBits ||= 0;
  state.totalSubTimeAdded ||= 0;
  state.totalBitTimeAdded ||= 0;

  state.customLeaderboard ||= {
    2026: { subs: [], bits: [] },
    2025: { subs: [], bits: [] }
  };

  state.customLeaderboard[2025] ||= {
    subs: [],
    bits: []
  };

  state.customLeaderboard[2026] ||= {
    subs: [],
    bits: []
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

loadState();
normalizeState();


/* ---------------- FORMATTING ---------------- */

function pad(number) {
  return String(
    Math.max(0, Math.floor(number))
  ).padStart(2, "0");
}

function formatNumber(number) {
  return Number(number || 0).toLocaleString();
}

function formatClock(seconds) {
  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const days = Math.floor(
    seconds / 86400
  );

  const hours = Math.floor(
    (seconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  }

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function formatAddedTime(seconds) {
  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${pad(secs)}s`;
  }

  return `${secs}s`;
}

function relativeTime(timestamp) {
  const seconds =
    Math.floor(
      (Date.now() - timestamp) / 1000
    );

  if (seconds < 10) return "now";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m`;

  return `${Math.floor(seconds / 3600)}h`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ---------------- TIMER ---------------- */

function updateTimer() {
  const total =
    Math.max(
      0,
      state.timeRemaining
    );

  const days =
    Math.floor(total / 86400);

  const hours =
    Math.floor(
      (total % 86400) / 3600
    );

  const minutes =
    Math.floor(
      (total % 3600) / 60
    );

  const seconds =
    total % 60;

  if ($("#days"))
    $("#days").textContent =
      pad(days);

  if ($("#hours"))
    $("#hours").textContent =
      pad(hours);

  if ($("#minutes"))
    $("#minutes").textContent =
      pad(minutes);

  if ($("#seconds"))
    $("#seconds").textContent =
      pad(seconds);

  if ($("#subathonTimer")) {
    $("#subathonTimer").textContent =
      formatClock(total);
  }
}


/* ---------------- GOALS ---------------- */

function goalInfo() {
  const goal =
    CONFIG.goals.find(
      goal =>
        state.totalSubs <
        goal.amount
    );

  if (!goal) {
    return {
      goal: null,
      previous:
        CONFIG.goals.at(-1)?.amount || 0,
      percentage: 100,
      needed: 0,
      level: CONFIG.goals.length
    };
  }

  const index =
    CONFIG.goals.indexOf(goal);

  const previous =
    index === 0
      ? 0
      : CONFIG.goals[index - 1].amount;

  const range =
    goal.amount - previous;

  const current =
    state.totalSubs - previous;

  return {
    goal,
    previous,

    percentage: Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (current / range) * 100
        )
      )
    ),

    needed:
      goal.amount -
      state.totalSubs,

    level:
      index + 1
  };
}

function updateGoal() {
  const info =
    goalInfo();

  if (!info.goal) {
    if ($("#goalTitle"))
      $("#goalTitle").textContent =
        "All Sub Goals Complete";

    if ($("#goalDescription"))
      $("#goalDescription").textContent =
        "Every milestone has been reached.";

    if ($("#goalCount"))
      $("#goalCount").textContent =
        `${state.totalSubs} / ${CONFIG.goals.at(-1).amount}`;

    if ($("#goalProgress"))
      $("#goalProgress").style.width =
        "100%";

    if ($("#goalNeeded"))
      $("#goalNeeded").textContent =
        "0";

    if ($("#goalName"))
      $("#goalName").textContent =
        "All Goals Complete";

    if ($("#subathonLevel"))
      $("#subathonLevel").textContent =
        "MAX LEVEL";

    if ($("#subathonPercent"))
      $("#subathonPercent").textContent =
        "100%";

    if ($("#subathonProgress"))
      $("#subathonProgress").style.width =
        "100%";

    if ($("#subathonNeeded"))
      $("#subathonNeeded").textContent =
        "0";

    if ($("#subathonGoalName"))
      $("#subathonGoalName").textContent =
        "All Goals Complete";

    if ($("#subathonReward"))
      $("#subathonReward").textContent =
        "All Goals Complete";

    return;
  }

  if ($("#goalTitle"))
    $("#goalTitle").textContent =
      "Next Sub Goal";

  if ($("#goalDescription"))
    $("#goalDescription").textContent =
      info.goal.description;

  if ($("#goalCount"))
    $("#goalCount").textContent =
      `${state.totalSubs} / ${info.goal.amount}`;

  if ($("#goalProgress"))
    $("#goalProgress").style.width =
      `${info.percentage}%`;

  if ($("#goalNeeded"))
    $("#goalNeeded").textContent =
      info.needed;

  if ($("#goalName"))
    $("#goalName").textContent =
      info.goal.name;

  if ($("#subathonLevel"))
    $("#subathonLevel").textContent =
      `LEVEL ${info.level}`;

  if ($("#subathonPercent"))
    $("#subathonPercent").textContent =
      `${info.percentage}%`;

  if ($("#subathonProgress"))
    $("#subathonProgress").style.width =
      `${info.percentage}%`;

  if ($("#subathonNeeded"))
    $("#subathonNeeded").textContent =
      info.needed;

  if ($("#subathonGoalName"))
    $("#subathonGoalName").textContent =
      info.goal.name;

  if ($("#subathonReward"))
    $("#subathonReward").textContent =
      info.goal.name;

  if ($("#subathonCount"))
    $("#subathonCount").textContent =
      `${state.totalSubs} / ${info.goal.amount} gifted`;
}


/* ---------------- ROADMAP ---------------- */

function renderRoadmap() {
  const roadmap =
    $("#roadmapList");

  if (!roadmap) return;

  const incentives =
    ROADMAP_INCENTIVES.filter(item => {
      return (
        roadmapFilter === "all" ||
        item.category === roadmapFilter
      );
    });

  roadmap.innerHTML =
    incentives
      .map(item => {
        const reached =
          state.totalSubs >=
          item.amount;

        const categoryLabel =
          ROADMAP_CATEGORY_LABELS[
            item.category
          ];

        return `
          <div class="
            roadmap-step
            roadmap-${item.category}
            ${reached ? "reached" : ""}
          ">

            <div class="roadmap-node">
              ${
                reached
                  ? "✓"
                  : escapeHtml(item.icon)
              }
            </div>

            <div class="roadmap-card">

              <div class="roadmap-card-top">

                <div class="roadmap-amount">
                  ${item.amount} GIFTED
                </div>

                <div class="roadmap-category">
                  ${categoryLabel}
                </div>

              </div>

              <div class="roadmap-name">
                ${escapeHtml(item.name)}
              </div>

              <div class="roadmap-description">
                ${escapeHtml(item.description)}
              </div>

              ${
                item.link
                  ? `
                    <a
                      class="roadmap-link"
                      href="${escapeHtml(item.link)}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Merch
                    </a>
                  `
                  : ""
              }

              <div class="roadmap-status">
                ${
                  reached
                    ? item.category === "user"
                      ? "Milestone Reached"
                      : "Unlocked"
                    : `Locked • ${formatNumber(
                        item.amount -
                        state.totalSubs
                      )} more gifted`
                }
              </div>

            </div>

          </div>
        `;
      })
      .join("");

  updateRoadmapFilterButtons();
}

function updateRoadmapFilterButtons() {
  $$(".roadmap-filter").forEach(
    button => {
      button.classList.toggle(
        "active",
        button.dataset.roadmapFilter ===
          roadmapFilter
      );
    }
  );
}


/* ---------------- ACTIVITY ---------------- */

function renderActivity() {
  const feed =
    $("#activityFeed");

  if (!feed) return;

  const items =
    [...state.activity]
      .sort(
        (a, b) =>
          b.timestamp -
          a.timestamp
      )
      .slice(0, 45);

  if (!items.length) {
    feed.innerHTML = `
      <div class="activity-item">
        <div class="activity-avatar">♥</div>

        <div class="activity-content">
          <div class="activity-user">
            Waiting for activity…
          </div>

          <span class="activity-text">
            Subs and Bits will appear here.
          </span>
        </div>
      </div>
    `;

    return;
  }

  feed.innerHTML =
    items.map(item => {
      const avatar =
        item.type === "sub"
          ? "🎁"
          : "💜";

      const amountText =
        item.type === "sub"
          ? item.amount === 1
            ? "1 Sub"
            : `${item.amount} Gifted Subs`
          : `${formatNumber(item.amount)} Bits`;

      const isBig =
        (
          item.type === "bits" &&
          item.amount >= 1000
        ) ||
        (
          item.type === "sub" &&
          item.amount >= 5
        );

      return `
        <div class="
          activity-item
          ${item.type}
          ${isBig ? "big-donation" : ""}
        ">

          <div class="activity-avatar">
            ${avatar}
          </div>

          <div class="activity-content">

            <div class="activity-user">
              ${escapeHtml(item.user)}
            </div>

            <span class="activity-text">
              ${escapeHtml(item.text)}
              •
              <strong>${amountText}</strong>
            </span>

            <span class="donation-time">
              +
              <strong>
                ${formatAddedTime(item.seconds)}
              </strong>
              added to timer
            </span>

          </div>

          <div class="activity-time">
            ${relativeTime(item.timestamp)}
          </div>

        </div>
      `;
    }).join("");
}


/* ---------------- LEADERBOARD ---------------- */

function mergeLeaderboard(
  year,
  type
) {
  const configured =
    CONFIG.leaderboard?.[year]?.[type] ||
    [];

  const custom =
    state.customLeaderboard?.[year]?.[type] ||
    [];

  const merged = [];

  for (const item of [
    ...configured,
    ...custom
  ]) {
    const existing =
      merged.find(
        x =>
          x.name.toLowerCase() ===
          item.name.toLowerCase()
      );

    if (existing) {
      existing.amount +=
        Number(item.amount);
    } else {
      merged.push({
        name: item.name,
        amount:
          Number(item.amount)
      });
    }
  }

  return merged.sort(
    (a, b) =>
      b.amount - a.amount
  );
}

function renderLeaderboard() {
  const rows =
    $("#leaderboardRows");

  if (!rows) return;

  const leaderboard =
    mergeLeaderboard(
      selectedYear,
      selectedType
    ).slice(0, 10);

  if (!leaderboard.length) {
    rows.innerHTML = `
      <div class="leader-row">
        <div></div>

        <div class="leader-name">
          No data yet
        </div>

        <div></div>
      </div>
    `;

    return;
  }

  rows.innerHTML =
    leaderboard
      .map(
        (entry, index) => `
          <div class="leader-row">

            <div class="leader-rank">
              ${index + 1}
            </div>

            <div class="leader-user">

              <div class="leader-avatar">
                ${escapeHtml(
                  entry.name
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>

              <div class="leader-name">
                ${escapeHtml(
                  entry.name
                )}
              </div>

            </div>

            <div class="
              leader-amount
              ${
                selectedType === "bits"
                  ? "bits"
                  : ""
              }
            ">
              ${formatNumber(
                entry.amount
              )}
              ${
                selectedType === "bits"
                  ? "Bits"
                  : "Subs"
              }
            </div>

          </div>
        `
      )
      .join("");
}


/* ---------------- PODIUM ---------------- */

function renderPodium() {
  const podium =
    $("#podium");

  const title =
    $("#podiumTitle");

  const dots =
    $("#podiumDots");

  if (
    !podium ||
    !title ||
    !dots
  ) {
    return;
  }

  const leaderboard =
    mergeLeaderboard(
      2026,
      podiumType
    ).slice(0, 3);

  title.textContent =
    podiumType === "bits"
      ? "Bits"
      : "Gifted Subs";

  const positions = [
    {
      rank: 2,
      item: leaderboard[1],
      className: "second"
    },

    {
      rank: 1,
      item: leaderboard[0],
      className: "first"
    },

    {
      rank: 3,
      item: leaderboard[2],
      className: "third"
    }
  ];

  podium.innerHTML =
    positions
      .map(position => {
        const item =
          position.item;

        if (!item) {
          return `
            <div class="
              podium-place
              ${position.className}
            ">

              ${
                position.rank === 1
                  ? `<div class="podium-crown">♛</div>`
                  : ""
              }

              <div class="podium-avatar">
                —
              </div>

              <div class="podium-name">
                Waiting...
              </div>

              <div class="podium-amount">
                0
                ${
                  podiumType === "bits"
                    ? "Bits"
                    : "Subs"
                }
              </div>

              <div class="podium-block">
                <div class="podium-rank">
                  #${position.rank}
                </div>
              </div>

            </div>
          `;
        }

        return `
          <div class="
            podium-place
            ${position.className}
          ">

            ${
              position.rank === 1
                ? `<div class="podium-crown">♛</div>`
                : ""
            }

            <div class="podium-avatar">
              ${escapeHtml(
                item.name
                  .slice(0, 1)
                  .toUpperCase()
              )}
            </div>

            <div class="podium-name">
              ${escapeHtml(
                item.name
              )}
            </div>

            <div class="podium-amount">
              ${formatNumber(
                item.amount
              )}
              ${
                podiumType === "bits"
                  ? "Bits"
                  : "Subs"
              }
            </div>

            <div class="podium-block">
              <div class="podium-rank">
                #${position.rank}
              </div>
            </div>

          </div>
        `;
      })
      .join("");

  dots.innerHTML = `
    <span class="
      podium-dot
      ${podiumType === "subs" ? "active" : ""}
    "></span>

    <span class="
      podium-dot
      ${podiumType === "bits" ? "active" : ""}
    "></span>
  `;
}


/* ---------------- TIME ADDED ---------------- */

function renderTimeAdded() {
  const sub =
    state.totalSubTimeAdded || 0;

  const bits =
    state.totalBitTimeAdded || 0;

  if ($("#subTimeAdded"))
    $("#subTimeAdded").textContent =
      formatAddedTime(sub);

  if ($("#bitTimeAdded"))
    $("#bitTimeAdded").textContent =
      formatAddedTime(bits);

  if ($("#totalTimeAdded"))
    $("#totalTimeAdded").textContent =
      formatAddedTime(
        sub + bits
      );

  if ($("#timeAddedCount"))
    $("#timeAddedCount").textContent =
      `${state.timeHistory.length} events`;

  const history =
    $("#timeHistory");

  if (!history) return;

  if (!state.timeHistory.length) {
    history.innerHTML = `
      <div class="time-history-empty">
        No support events yet.
      </div>
    `;

    return;
  }

  history.innerHTML =
    state.timeHistory
      .slice(0, 8)
      .map(
        item => `
          <div class="time-history-row">

            <div class="time-history-icon">
              ${
                item.type === "sub"
                  ? "🎁"
                  : "💜"
              }
            </div>

            <div>

              <div class="time-history-user">
                ${escapeHtml(
                  item.user
                )}
              </div>

              <div class="time-history-detail">
                ${
                  item.type === "sub"
                    ? `${item.amount} gifted sub${
                        item.amount === 1
                          ? ""
                          : "s"
                      }`
                    : `${formatNumber(
                        item.amount
                      )} Bits`
                }
              </div>

            </div>

            <div class="time-history-detail">
              ${relativeTime(
                item.timestamp
              )}
            </div>

            <div class="
              time-history-added
              ${
                item.type === "bits"
                  ? "bits"
                  : ""
              }
            ">
              +${formatAddedTime(
                item.seconds
              )}
            </div>

          </div>
        `
      )
      .join("");
}


/* ---------------- STREAM STATUS ---------------- */

function updateStreamStatus() {
  if (!$("#streamStatusText"))
    return;

  $("#streamStatusTitle").textContent =
    "OiiinkYT";

  $("#streamStatusText").textContent =
    "Twitch player ready";
}


/* ---------------- STATS ---------------- */

function renderExtraStats() {
  const events =
    state.hourlyEvents || [];

  const recent =
    events.filter(event => {
      const age =
        Date.now() -
        event.timestamp;

      return age <= 3600000;
    });

  const totalRecentTime =
    recent.reduce(
      (sum, event) =>
        sum +
        Number(
          event.seconds || 0
        ),
      0
    );

  const grouped = {};

  for (const event of recent) {
    grouped[event.user] =
      (grouped[event.user] || 0) +
      Number(
        event.seconds || 0
      );
  }

  const supporter =
    Object.entries(grouped)
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  if ($("#hourSupporter")) {
    $("#hourSupporter").textContent =
      supporter
        ? supporter[0]
        : "Nobody yet";
  }

  if ($("#hourSupporterValue")) {
    $("#hourSupporterValue").textContent =
      supporter
        ? `+${formatAddedTime(
            supporter[1]
          )} added this hour.`
        : "Be the first to add time this hour.";
  }

  if ($("#cookingValue")) {
    $("#cookingValue").textContent =
      `${formatAddedTime(
        totalRecentTime
      )} added`;
  }

  if ($("#cookingText")) {
    $("#cookingText").textContent =
      recent.length >= 5
        ? "🔥 Chat is cooking right now."
        : "No recent donation spike.";
  }

  if ($("#communitySubs")) {
    $("#communitySubs").textContent =
      `${formatNumber(
        state.totalSubs
      )} Subs`;
  }

  if ($("#communityBits")) {
    $("#communityBits").textContent =
      `${formatNumber(
        state.totalBits
      )} Bits`;
  }

  renderDonationChart();
}

function renderDonationChart() {
  const chart =
    $("#donationChart");

  if (!chart) return;

  const events =
    state.timeHistory
      .slice(0, 16)
      .reverse();

  if (!events.length) {
    chart.innerHTML =
      `<div class="chart-empty">
        Support activity will appear here.
      </div>`;

    return;
  }

  const max =
    Math.max(
      ...events.map(
        e =>
          Number(
            e.seconds || 0
          )
      ),
      1
    );

  chart.innerHTML =
    events
      .map(event => {
        const height =
          Math.max(
            8,
            (event.seconds / max) *
              100
          );

        return `
          <div
            class="chart-bar ${
              event.type === "bits"
                ? "bits"
                : ""
            }"
            style="height:${height}%"
            title="${escapeHtml(
              event.user
            )} +${formatAddedTime(
              event.seconds
            )}"
          ></div>
        `;
      })
      .join("");
}


/* ---------------- EVENT LOG ---------------- */

function renderEventLog() {
  const log =
    $("#eventLog");

  if (!log) return;

  const items =
    state.eventLog.slice(0, 12);

  if (!items.length) {
    log.innerHTML =
      `<div class="event-empty">
        No events yet.
      </div>`;

    return;
  }

  log.innerHTML =
    items
      .map(item => {
        if (item.type === "goal") {
          return `
            <div class="event-row goal-event">

              <span>🎯</span>

              <div>

                <strong>
                  ${escapeHtml(
                    item.goal
                  )}
                </strong>

                <small>
                  Goal unlocked at
                  ${item.amount}
                  gifted subs
                </small>

              </div>

              <time>
                ${relativeTime(
                  item.timestamp
                )}
              </time>

            </div>
          `;
        }

        return `
          <div class="event-row">

            <span>
              ${
                item.type === "sub"
                  ? "🎁"
                  : "💜"
              }
            </span>

            <div>

              <strong>
                ${escapeHtml(
                  item.user
                )}
              </strong>

              <small>
                ${
                  item.type === "sub"
                    ? `${item.amount} gifted sub${
                        item.amount === 1
                          ? ""
                          : "s"
                      }`
                    : `${formatNumber(
                        item.amount
                      )} Bits`
                }
                • +${formatAddedTime(
                  item.seconds
                )}
              </small>

            </div>

            <time>
              ${relativeTime(
                item.timestamp
              )}
            </time>

          </div>
        `;
      })
      .join("");
}


/* ---------------- URGENCY ---------------- */

function updateUrgency() {
  const alert =
    $("#subathonAlert");

  if (!alert) return;

  const title =
    $("#alertTitle");

  const text =
    $("#alertText");

  const time =
    state.timeRemaining;

  alert.classList.toggle(
    "urgent",
    time <= 600 &&
    time > 60
  );

  alert.classList.toggle(
    "critical",
    time <= 60 &&
    time > 0
  );

  if (
    time <= 60 &&
    time > 0
  ) {
    title.textContent =
      "⚠️ SAVE THE SUBATHON";

    text.textContent =
      `${formatClock(
        time
      )} remaining — every support event matters.`;

    return;
  }

  if (
    time <= 600 &&
    time > 0
  ) {
    title.textContent =
      "⚠️ SUBATHON ENDING SOON";

    text.textContent =
      `${formatClock(
        time
      )} remaining — keep it alive!`;

    return;
  }

  const info =
    goalInfo();

  title.textContent =
    info.goal
      ? `🔥 ${info.needed} MORE TO ${info.goal.name.toUpperCase()}`
      : "🎉 ALL GOALS COMPLETE";

  text.textContent =
    info.goal
      ? "The community controls how long we go."
      : "You reached every Subathon milestone.";
}


/* ---------------- TIMER EFFECT ---------------- */

function showTimerAdd(seconds) {
  const el =
    $("#timerAdd");

  if (!el) return;

  const sign =
    seconds >= 0
      ? "+"
      : "-";

  const amount =
    Math.abs(seconds);

  let text;

  if (amount >= 3600) {
    text =
      `${sign}${Math.floor(
        amount / 3600
      )}h`;
  } else if (amount >= 60) {
    text =
      `${sign}${Math.floor(
        amount / 60
      )}m`;
  } else {
    text =
      `${sign}${amount}s`;
  }

  el.textContent = text;

  el.classList.remove("show");

  void el.offsetWidth;

  el.classList.add("show");

  const timer =
    $("#timerDisplay");

  if (timer) {
    timer.classList.remove(
      "bump"
    );

    void timer.offsetWidth;

    timer.classList.add(
      "bump"
    );
  }

  spawnParticles();
}

function spawnParticles() {
  const effects =
    $("#effects");

  if (!effects) return;

  for (
    let i = 0;
    i < 18;
    i++
  ) {
    const particle =
      document.createElement(
        "div"
      );

    particle.className =
      "timer-particle";

    particle.style.left =
      `${45 + Math.random() * 10}%`;

    particle.style.top =
      `${35 + Math.random() * 25}%`;

    particle.style.setProperty(
      "--x",
      `${(Math.random() - 0.5) * 280}px`
    );

    particle.style.setProperty(
      "--y",
      `${-70 - Math.random() * 190}px`
    );

    particle.style.animationDelay =
      `${Math.random() * 120}ms`;

    effects.appendChild(
      particle
    );

    setTimeout(
      () =>
        particle.remove(),
      1200
    );
  }
}


/* ---------------- SIMULATION ---------------- */

function randomName() {
  const names = [
    "OiiinkFan",
    "SubEnjoyer",
    "LeonePlayer",
    "MaceMain",
    "EventKing",
    "MinecraftGuy"
  ];

  return names[
    Math.floor(
      Math.random() *
        names.length
    )
  ];
}

function getSecondsForDonation(
  type,
  amount
) {
  if (type === "sub") {
    return amount * 300;
  }

  return Math.floor(
    (amount / 100) * 100
  );
}

function simulate(
  type,
  amount,
  user
) {
  const seconds =
    getSecondsForDonation(
      type,
      amount
    );

  state.timeRemaining +=
    seconds;

  if (type === "sub") {
    state.totalSubs +=
      amount;

    state.totalSubTimeAdded +=
      seconds;
  } else {
    state.totalBits +=
      amount;

    state.totalBitTimeAdded +=
      seconds;
  }

  const activity = {
    id:
      Date.now() +
      Math.random(),

    type,
    user,
    amount,
    seconds,
    timestamp: Date.now(),

    text:
      type === "sub"
        ? amount === 1
          ? "gifted a sub"
          : "gifted subs"
        : "cheered"
  };

  state.activity.unshift(
    activity
  );

  state.activity =
    state.activity.slice(
      0,
      50
    );

  state.timeHistory.unshift({
    ...activity
  });

  state.timeHistory =
    state.timeHistory.slice(
      0,
      20
    );

  state.hourlyEvents.push({
    user,
    seconds,
    timestamp:
      Date.now()
  });

  state.hourlyEvents =
    state.hourlyEvents.slice(
      -100
    );

  const year = 2026;

  const leaderboard =
    state.customLeaderboard[
      year
    ][type];

  const existing =
    leaderboard.find(
      x =>
        x.name.toLowerCase() ===
        user.toLowerCase()
    );

  if (existing) {
    existing.amount +=
      amount;
  } else {
    leaderboard.push({
      name: user,
      amount
    });
  }

  const previousGoal =
    goalInfo();

  saveState();
  render();

  showTimerAdd(
    seconds
  );

  const newGoal =
    goalInfo();

  if (
    previousGoal.goal &&
    newGoal.goal &&
    previousGoal.goal.amount !==
      newGoal.goal.amount
  ) {
    showGoalCelebration(
      previousGoal.goal
    );
  }
}

function showGoalCelebration(
  goal
) {
  const card =
    $("#subathonCard");

  if (card) {
    card.classList.remove(
      "goal-hit"
    );

    void card.offsetWidth;

    card.classList.add(
      "goal-hit"
    );
  }

  const effects =
    $("#effects");

  if (!effects) return;

  const node =
    document.createElement(
      "div"
    );

  node.className =
    "goal-celebration";

  node.innerHTML = `
    <span>🎉</span>
    <strong>GOAL UNLOCKED</strong>
    <b>${escapeHtml(
      goal.name
    )}</b>
  `;

  effects.appendChild(
    node
  );

  setTimeout(
    () => node.remove(),
    3500
  );
}


/* ---------------- EVENTS ---------------- */

function setupEvents() {

  $$(".activity-tab").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          setFeedMode(
            button.dataset.feed
          );
        }
      );
    }
  );


  $$(".podium-type").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          podiumType =
            button.dataset.podium;

          $$(".podium-type").forEach(
            other => {
              other.classList.toggle(
                "active",
                other === button
              );
            }
          );

          renderPodium();
        }
      );
    }
  );


  $$(".year-tab").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          selectedYear =
            Number(
              button.dataset.year
            );

          $$(".year-tab").forEach(
            other => {
              other.classList.toggle(
                "active",
                other === button
              );
            }
          );

          renderLeaderboard();
        }
      );
    }
  );


  $$(".type-tab").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          selectedType =
            button.dataset.type;

          $$(".type-tab").forEach(
            other => {
              other.classList.toggle(
                "active",
                other === button
              );
            }
          );

          renderLeaderboard();
        }
      );
    }
  );


  /* ROADMAP FILTERS */

  $$(".roadmap-filter").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          roadmapFilter =
            button.dataset.roadmapFilter;

          updateRoadmapFilterButtons();
          renderRoadmap();
        }
      );
    }
  );


  /* SIMULATION */

  $$("[data-sim]").forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          const kind =
            button.dataset.sim;

          const user =
            randomName();

          if (kind === "sub")
            simulate(
              "sub",
              1,
              user
            );

          if (kind === "gift5")
            simulate(
              "sub",
              5,
              user
            );

          if (kind === "gift10")
            simulate(
              "sub",
              10,
              user
            );

          if (kind === "bits100")
            simulate(
              "bits",
              100,
              user
            );

          if (kind === "bits1000")
            simulate(
              "bits",
              1000,
              user
            );

          if (kind === "bits5000")
            simulate(
              "bits",
              5000,
              user
            );

          if (kind === "bits10000")
            simulate(
              "bits",
              10000,
              user
            );

          if (kind === "goal") {
            const info =
              goalInfo();

            if (info.goal) {
              simulate(
                "sub",
                info.needed,
                user
              );
            }
          }
        }
      );
    }
  );


  /* RESET */

  const reset =
    $("#resetSimulation");

  if (reset) {
    reset.addEventListener(
      "click",
      () => {
        if (
          !confirm(
            "Reset the simulated Subathon?"
          )
        ) {
          return;
        }

        state = {
          timeRemaining:
            BASE_SECONDS,

          totalSubs: 0,
          totalBits: 0,

          totalSubTimeAdded: 0,
          totalBitTimeAdded: 0,

          activity: [],
          timeHistory: [],
          hourlyEvents: [],
          eventLog: [],

          customLeaderboard: {
            2026: {
              subs: [],
              bits: []
            },

            2025: {
              subs: [],
              bits: []
            }
          }
        };

        saveState();
        render();
      }
    );
  }


  /* SUBATHON DROPDOWN */

  const subathonDropdown =
    $("#subathonDropdown");

  if (subathonDropdown) {
    subathonDropdown.addEventListener(
      "click",
      () => {
        $("#subathonCard")
          ?.classList.toggle(
            "expanded"
          );
      }
    );
  }


  /* ACTIVITY DROPDOWN */

  const activityDropdown =
    $("#activityDropdown");

  if (activityDropdown) {
    activityDropdown.addEventListener(
      "click",
      () => {
        $("#activityPanel")
          ?.classList.toggle(
            "collapsed"
          );
      }
    );
  }
}


/* ---------------- FEED MODE ---------------- */

function setFeedMode(mode) {
  $$(".activity-tab").forEach(
    button => {
      button.classList.toggle(
        "active",
        button.dataset.feed ===
          mode
      );
    }
  );

  $("#activityFeed")
    ?.classList.toggle(
      "active",
      mode === "activity"
    );

  $("#twitchChatPanel")
    ?.classList.toggle(
      "active",
      mode === "chat"
    );

  if ($("#activityTitle")) {
    $("#activityTitle").textContent =
      mode === "chat"
        ? "Twitch Chat"
        : "Live Activity";
  }
}


/* ---------------- MAIN RENDER ---------------- */

function render() {
  updateTimer();
  updateGoal();

  renderActivity();
  renderLeaderboard();
  renderTimeAdded();
  renderRoadmap();
  renderPodium();
  renderExtraStats();
  renderEventLog();
  updateUrgency();
}


/* ---------------- INITIALIZE ---------------- */

setupEvents();
render();
updateStreamStatus();


/*
  Rotate Top Supporters every 5 seconds.
*/

podiumInterval =
  setInterval(() => {
    podiumType =
      podiumType === "subs"
        ? "bits"
        : "subs";

    $$(".podium-type").forEach(
      button => {
        button.classList.toggle(
          "active",
          button.dataset.podium ===
            podiumType
        );
      }
    );

    renderPodium();
  }, 5000);


/* Timer countdown */

setInterval(() => {
  if (
    state.timeRemaining > 0
  ) {
    state.timeRemaining--;

    updateTimer();
    updateGoal();
    updateUrgency();
  }
}, 1000);


/* Refresh relative timestamps */

setInterval(() => {
  renderActivity();
  renderTimeAdded();
  renderExtraStats();
  renderEventLog();
  updateUrgency();
}, 5000);


/* Save state */

setInterval(
  saveState,
  10000
);
