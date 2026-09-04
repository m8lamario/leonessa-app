export const EXPLORE_CATEGORIES = [
  "scuole",
  "squadre",
  "giocatori",
  "partite",
  "classifiche",
  "partner",
] as const;

export type ExploreCategory = (typeof EXPLORE_CATEGORIES)[number];

export type ExploreMatchStatus = "LIVE" | "SCHEDULED" | "FINISHED" | "CANCELLED";

export type ExploreSchool = {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  ssp: number;
  teamId: string | null;
  isCurrentSchool: boolean;
  rank: number;
};

export type ExploreTeam = {
  id: string;
  name: string;
  schoolId: string;
  schoolName: string;
  schoolShortName: string;
  logoUrl: string | null;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  isCurrentTeam: boolean;
};

export type ExplorePlayer = {
  id: string;
  name: string;
  school: string;
  teamId: string;
  teamName: string;
  role: string;
  roleLabel: string;
  jerseyNumber: number | null;
};

export type ExploreMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  startAt: string;
  status: ExploreMatchStatus;
  venue: string | null;
};

export type ExploreSchoolTableRow = {
  rank: number;
  schoolId: string;
  name: string;
  shortName: string;
  teamId: string | null;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  matchesPlayed: number;
  isCurrentSchool: boolean;
};

export type ExploreUserRank = {
  id: string;
  rank: number;
  name: string;
  school: string;
  lp: number;
  isCurrentUser: boolean;
};

export type ExploreData = {
  schools: ExploreSchool[];
  teams: ExploreTeam[];
  players: ExplorePlayer[];
  matches: ExploreMatch[];
  schoolTable: ExploreSchoolTableRow[];
  userLeaders: ExploreUserRank[];
  partnersAvailable: boolean;
};
