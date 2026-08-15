import type { Competition } from "./competition";
import type { MatchStatus } from "./match-status";
import type { Team } from "./team";

export type MatchVenue = {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Match = {
  id: string;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  kickoff: string;
  status: MatchStatus;
  stage: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  scoreText: string | null;
  isLive: boolean;
  venue: MatchVenue | null;
};
