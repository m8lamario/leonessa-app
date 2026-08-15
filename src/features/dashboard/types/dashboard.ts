export type DashboardMission = {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number | null;
  status: string;
};

export type DashboardRankingEntry = {
  id: string;
  schoolId: string;
  name: string;
  points: number;
  isCurrentSchool: boolean;
};

export type DashboardNewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  visual: "draw" | "sponsor";
};

export type DashboardEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
};

export type DashboardFeaturedMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  schedule: string;
  venue: string;
  status: string;
};

export type DashboardData = {
  school: {
    position: number | null;
    points: number;
  };
  featuredMatch: DashboardFeaturedMatch | null;
  missions: DashboardMission[];
  schoolRanking: DashboardRankingEntry[];
  news: DashboardNewsArticle[];
  events: DashboardEvent[];
  profile: {
    level: number;
    totalLp: number;
  };
};
