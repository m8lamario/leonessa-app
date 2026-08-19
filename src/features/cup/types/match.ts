import type { Competition } from "./competition";
import type { MatchStatus } from "./match-status";
import type { Team } from "./team";

export type MatchEvent = {
  id: string;
  playerEslId: string | null;
  playerFirstName: string | null;
  playerLastName: string | null;
  teamEslId: string;
  minute: number;
  type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD" | "OWN_GOAL";
};

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
  events: MatchEvent[];
  venue: MatchVenue | null;
};
