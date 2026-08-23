export const ACHIEVEMENTS = {
  FOUNDER: {
    code: "FOUNDER",
    icon: "flag",
    title: "Fondatore",
    description: "Hai creato la tua prima squadra fantasy",
  },
  TALENT_SCOUT: {
    code: "TALENT_SCOUT",
    icon: "goal",
    title: "Talent Scout",
    description: "Uno dei tuoi giocatori segna il primo gol",
  },
  COMPETITIVE: {
    code: "COMPETITIVE",
    icon: "medal",
    title: "Competitivo",
    description: "Entri nella Top 3",
  },
  KING: {
    code: "KING",
    icon: "crown",
    title: "Re della Leonessa",
    description: "Raggiungi la posizione #1",
  },
  TRADER: {
    code: "TRADER",
    icon: "gem",
    title: "Occhio Lungo",
    description: "Un tuo giocatore aumenta di almeno 20 LP",
  },
  TOP10: {
    code: "TOP10",
    icon: "flame",
    title: "Top 10",
    description: "Sei tra i primi 10",
  },
} as const;

export type AchievementCode = (typeof ACHIEVEMENTS)[keyof typeof ACHIEVEMENTS]["code"];
