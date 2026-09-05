import type { MatchPredictionChoice } from "./lib/prediction-domain";

export type DashboardPrediction = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  schedule: string;
  venue: string;
  startAt: string;
  matchStatus: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";
  following: boolean;
  editable: boolean;
  choice: MatchPredictionChoice | null;
  status: "NONE" | "OPEN" | "LOCKED" | "SETTLED_CORRECT" | "SETTLED_WRONG" | "VOID";
  correctRewardLp: number;
  incorrectPenaltyLp: number;
  split: { total: number; homePercent: number; awayPercent: number } | null;
};
