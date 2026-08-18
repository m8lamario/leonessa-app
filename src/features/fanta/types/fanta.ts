export type FantasyRole = "PORTIERE" | "DIFENSORE" | "CENTROCAMPISTA" | "ATTACCANTE";

export type FantasyTeamPlayer = {
  id: string;
  fantasyTeamId: string;
  playerId: string;
  role: FantasyRole | string;
  purchaseCost: number;
  isCaptain: boolean;
  createdAt: Date;
};

export type FantasyPlayer = {
  id: string;
  name: string;
  school: string;
  role: FantasyRole;
  fantasyValue: number;
  badges: string[];
};

export type FantasyTeam = {
  id: string;
  userId: string;
  name: string;
  budgetLp: number;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
  players: FantasyTeamPlayer[];
};

export type FantasyTeamSummary = Omit<FantasyTeam, "players"> & {
  players: Pick<FantasyTeamPlayer, "id" | "playerId" | "role" | "isCaptain">[];
};
