export const REWARD_VALUES = {
  dailyLogin: 10,
  streak: {
    threeDays: 25,
    sevenDays: 75,
    fourteenDays: 150,
    thirtyDays: 500,
  },
  schoolSupport: {
    win: 100,
    draw: 50,
    loss: 10,
    roundQualified: 200,
    finalReached: 300,
    tournamentWin: 1000,
  },
  events: {
    attendance: 50,
    finalAttendance: 150,
    specialAttendance: 100,
  },
  referral: {
    inviter: 100,
    invitee: 50,
  },
  prediction: {
    correct: 5,
    incorrect: 5,
  },
} as const;
