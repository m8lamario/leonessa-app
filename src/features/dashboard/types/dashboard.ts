import type { DashboardPrediction } from "@/features/predictions/types";

export type DashboardMission = {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number | null;
  status: string;
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

export type DashboardFantaCta = {
  kind: "CREATE" | "COMPLETE_LINEUP" | "MARKET_OPEN" | "MATCH_SOON" | "READY";
  title: string;
  description: string;
  href: "/fanta" | "/fanta/market" | "/fanta/team";
  points: number | null;
  position: number | null;
};

export type DashboardTodayAction = {
  id: string;
  title: string;
  description: string;
  href: string;
};

export type DashboardActivity = {
  id: string;
  kind: "community" | "badge" | "mission" | "achievement" | "fanta_score" | "overtake";
  title: string;
  detail: string | null;
  occurredAt: string;
  icon: string;
  actorUserId: string | null;
  href: string | null;
  fromFollowed: boolean;
};

export type DashboardPersonal = {
  name: string;
  initials: string;
  schoolName: string;
  level: number;
  rankingPosition: number;
  schoolPosition: number | null;
  schoolPoints: number;
  schoolTeamId: string | null;
};

export type DashboardData = {
  personal: DashboardPersonal;
  fanta: DashboardFantaCta;
  prediction: DashboardPrediction | null;
  todayActions: DashboardTodayAction[];
  activity: DashboardActivity[];
  school: {
    name: string;
    position: number | null;
    points: number;
    teamId: string | null;
  };
  news: DashboardNewsArticle[];
  events: DashboardEvent[];
  followingAnyone: boolean;
};
