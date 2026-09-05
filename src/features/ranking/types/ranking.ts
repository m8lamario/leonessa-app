export type UserRankingEntry = {
  id: string;
  rank: number;
  name: string;
  school: string;
  initials: string;
  level: number;
  lp: number;
  isCurrentUser?: boolean;
};

export type SchoolRankingEntry = {
  id: string;
  rank: number;
  name: string;
  shortName: string;
  ssp: number;
  isCurrentSchool?: boolean;
};

export type RankingData = {
  userRanking: UserRankingEntry[];
  currentUser: UserRankingEntry;
  schoolRanking: SchoolRankingEntry[];
  currentSchool: SchoolRankingEntry;
};
