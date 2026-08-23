export type FantasyRole = "PORTIERE" | "DIFENSORE" | "CENTROCAMPISTA" | "ATTACCANTE";

export type FantasyLineupStatus = "STARTER" | "BENCH";

export type FantasyTeamPlayer = {
  id: string;
  fantasyTeamId: string;
  playerId: string;
  role: FantasyRole | string;
  status: FantasyLineupStatus;
  benchOrder: number | null;
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
  jerseyNumber?: number | null;
  photoUrl?: string | null;
  totalPoints?: number | null;
  matches?: number | null;
  goals?: number | null;
  assists?: number | null;
  preferredFoot?: string | null;
  secondaryRole?: string | null;
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
  players: Pick<
    FantasyTeamPlayer,
    "id" | "playerId" | "role" | "status" | "benchOrder" | "isCaptain"
  >[];
};
