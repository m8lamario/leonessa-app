export const ACHIEVEMENTS = {
  FOUNDER: {
    code: "FOUNDER",
    emoji: "🏁",
    title: "Fondatore",
    description: "Hai creato la tua prima squadra fantasy",
  },
  TALENT_SCOUT: {
    code: "TALENT_SCOUT",
    emoji: "⚽",
    title: "Talent Scout",
    description: "Uno dei tuoi giocatori segna il primo gol",
  },
  COMPETITIVE: {
    code: "COMPETITIVE",
    emoji: "🥉",
    title: "Competitivo",
    description: "Entri nella Top 3",
  },
  KING: {
    code: "KING",
    emoji: "👑",
    title: "Re della Leonessa",
    description: "Raggiungi la posizione #1",
  },
  TRADER: {
    code: "TRADER",
    emoji: "💎",
    title: "Occhio Lungo",
    description: "Un tuo giocatore aumenta di almeno 20 LP",
  },
  TOP10: {
    code: "TOP10",
    emoji: "🔥",
    title: "Top 10",
    description: "Sei tra i primi 10",
  },
} as const;

export type AchievementCode = (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS]["code"];
