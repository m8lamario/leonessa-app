import type { LeagueCard } from "@/features/leagues/types/leagues";

export type RankingTab = "generale" | "scuole" | "leghe";

export type UserRankingEntry = {
  id: string;
  rank: number;
  name: string;
  school: string;
  initials: string;
  image: string | null;
  level: number;
  lp: number;
  isCurrentUser?: boolean;
};

export type SchoolRankingEntry = {
  id: string;
  rank: number;
  name: string;
  shortName: string;
  logoUrl: string | null;
  teamId: string | null;
  ssp: number;
  isCurrentSchool?: boolean;
};

export type RankingData = {
  userRanking: UserRankingEntry[];
  currentUser: UserRankingEntry;
  schoolRanking: SchoolRankingEntry[];
  currentSchool: SchoolRankingEntry;
  leagues: LeagueCard[];
};
