export type TeamMember = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

export type TeamSupporter = {
  id: string;
  name: string;
  image: string | null;
  lp: number;
};

export type TeamMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  homeScore: number | null;
  awayScore: number | null;
  outcome: "Vittoria" | "Pareggio" | "Sconfitta" | null;
};

export type TeamApplication = {
  kind: "player" | "staff";
  status: "pending" | "approved" | "rejected";
};

export type TeamPageData = {
  id: string;
  name: string;
  logoUrl: string | null;
  school: {
    id: string;
    name: string;
    shortName: string;
  };
  ranking: {
    position: number | null;
    points: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
  };
  statistics: {
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  };
  community: {
    players: TeamMember[];
    staff: TeamMember[];
    supportersCount: number;
  };
  topSupporters: TeamSupporter[];
  completedMatches: TeamMatch[];
  upcomingMatches: TeamMatch[];
  viewer: {
    membership: "player" | "staff" | null;
    attendsSchool: boolean;
    application: TeamApplication | null;
  };
};
