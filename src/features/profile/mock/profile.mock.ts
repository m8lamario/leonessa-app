import type { ProfileMock } from "../types/profile";

export const profileMock: ProfileMock = {
  schoolName: "ITIS Benedetto Castelli",
  schoolRank: 2,
  level: 4,
  totalLp: 1250,
  featuredBadge: "Tifoso Fedele",
  stats: [
    { label: "Ranking", value: "#87", detail: "su 2.140 utenti" },
    { label: "Missioni", value: "14", detail: "completate" },
    { label: "Badge", value: "8", detail: "ottenuti" },
    { label: "Eventi", value: "5", detail: "partecipati" },
  ],
  applications: [
    {
      id: "player-castelli",
      kind: "player",
      title: "Giocatore Castelli",
      status: "In revisione",
      submittedAt: "12/02/2027",
    },
    {
      id: "leonessa-staff",
      kind: "leonessa-staff",
      title: "Staff Leonessa",
      status: "Accettata",
      submittedAt: "20/02/2027",
    },
  ],
};
