export const dashboardMock = {
  school: {
    position: 2,
    points: 1250,
  },
  featuredMatch: {
    label: "Match della settimana",
    homeTeam: "Castelli",
    awayTeam: "Copernico",
    schedule: "Sabato 16:00",
    venue: "Centro Sportivo San Filippo",
    status: "UPCOMING",
  },
  missions: [
    {
      title: "Segui una partita",
      description: "Resta aggiornato fino al fischio finale.",
      reward: 25,
      progress: 0,
      target: 1,
      status: "Disponibile",
    },
    {
      title: "Tre giorni in campo",
      description: "Apri Leonessa Cup per 3 giorni consecutivi.",
      reward: 50,
      progress: 2,
      target: 3,
      status: "In corso",
    },
    {
      title: "Porta la tua curva",
      description: "Invita un amico a seguire la Leonessa Cup.",
      reward: 100,
      progress: 0,
      target: 1,
      status: "Disponibile",
    },
  ],
  schoolRanking: [
    { name: "Copernico", points: 1380 },
    { name: "Castelli", points: 1250 },
    { name: "Lunardi", points: 1130 },
    { name: "Abba Ballini", points: 1040 },
    { name: "Tartaglia", points: 980 },
  ],
  news: [
    {
      title: "Sorteggi ufficiali pubblicati",
      excerpt: "Il calendario della Leonessa Cup è pronto: scopri le sfide della prima giornata.",
      date: "Oggi",
      category: "Cup",
      visual: "draw",
    },
    {
      title: "Nuovo sponsor annunciato",
      excerpt: "Una nuova energia entra in campo al fianco delle scuole di Brescia.",
      date: "Ieri",
      category: "Community",
      visual: "sponsor",
    },
  ],
  events: [
    {
      title: "Leonessa Cup Opening Day",
      date: "14 Set",
      location: "Centro Sportivo San Filippo",
    },
    {
      title: "Final Four",
      date: "7 Giu",
      location: "PalaLeonessa",
    },
  ],
  profile: {
    level: 4,
    totalLp: 1250,
  },
} as const;
