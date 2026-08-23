const CONFIG = {
  twitchChannel: "oiiinkyt",
  twitchUrl: "https://twitch.tv/oiiinkyt",

  // Change these whenever you want.
  startingTime: {
    days: 1,
    hours: 2,
    minutes: 30,
    seconds: 0
  },

  // Timer rewards.
  secondsPerSub: 300, // 5 minutes
  secondsPerBit: 1,   // 1 Bit = 1 second

  goals: [
    {
      amount: 10,
      name: "Face Cam",
      description: "Face Cam (only during the day)",
      icon: "📸"
    },
    {
      amount: 25,
      name: "Host an Event on LeoneMC",
      description: "Host an Event on LeoneMC",
      icon: "🎮"
    },
    {
      amount: 35,
      name: "IQ Test",
      description: "IQ Test",
      icon: "🧠"
    }
  ],

  // Example leaderboard data. Replace these with your real totals later.
  leaderboard: {
    2026: {
      subs: [
        { name: "OiiinkFan", amount: 8 },
        { name: "SubEnjoyer", amount: 5 },
        { name: "EventKing", amount: 3 },
        { name: "MinecraftGuy", amount: 2 },
        { name: "RedstonePro", amount: 1 }
      ],
      bits: [
        { name: "BitEnjoyer", amount: 1200 },
        { name: "OiiinkFan", amount: 850 },
        { name: "CheerLord", amount: 500 },
        { name: "MinecraftGuy", amount: 250 },
        { name: "EventKing", amount: 100 }
      ]
    },

    2025: {
      subs: [
        { name: "PastSupporter", amount: 25 },
        { name: "OldGifter", amount: 15 },
        { name: "EventFan", amount: 10 },
        { name: "LeonePlayer", amount: 5 },
        { name: "MaceMain", amount: 3 }
      ],
      bits: [
        { name: "PastCheerer", amount: 5000 },
        { name: "BitMachine", amount: 2500 },
        { name: "OldSupporter", amount: 1200 },
        { name: "CheerFan", amount: 700 },
        { name: "LeonePlayer", amount: 300 }
      ]
    }
  }
};
