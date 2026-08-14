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

export type RankingMission = {
  id: string;
  title: string;
  description: string;
  rewardLP: number;
  progress: number;
  target: number;
  status: "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "CLAIMED";
  completedAt?: string;
};

export type RankingBadge = {
  id: string;
  name: string;
  description: string;
  rarity: "Comune" | "Raro" | "Epico" | "Leggendario";
  earnedAt?: string;
  progress?: number;
  target?: number;
};

export type RankingHistoryEntry = {
  id: string;
  amount: number;
  reason: string;
  date: string;
};

export type RankingMock = {
  userRanking: UserRankingEntry[];
  currentUser: UserRankingEntry;
  schoolRanking: SchoolRankingEntry[];
  currentSchool: SchoolRankingEntry;
  activeMissions: RankingMission[];
  completedMissions: RankingMission[];
  earnedBadges: RankingBadge[];
  lockedBadges: RankingBadge[];
  history: RankingHistoryEntry[];
  stats: {
    lpEarned: number;
    missionsCompleted: number;
    badgesEarned: number;
    eventsAttended: number;
    referralsCompleted: number;
  };
};
