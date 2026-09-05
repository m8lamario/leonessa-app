import type { LeagueConditions } from "../lib/enrollment";

export type LeagueDisplayStatus = "upcoming" | "live" | "ended";

export type LeagueCard = {
  id: string;
  name: string;
  description: string | null;
  sponsorName: string;
  sponsorLogoUrl: string | null;
  imageUrl: string | null;
  prizeTitle: string;
  prizeDescription: string | null;
  awardedPositions: number;
  conditionsText: string | null;
  startAt: string;
  endAt: string;
  displayStatus: LeagueDisplayStatus;
  enrollmentOpen: boolean;
  participantCount: number;
  joined: boolean;
  rank: number | null;
  score: number | null;
  remainingMs: number;
  canJoin: boolean;
  joinBlockedReason: string | null;
};

export type LeagueBoardEntry = {
  id: string;
  rank: number;
  name: string;
  school: string;
  initials: string;
  image: string | null;
  score: number;
  isCurrentUser?: boolean;
};

export type LeagueBoardData = {
  league: LeagueCard;
  entries: LeagueBoardEntry[];
  currentUser: LeagueBoardEntry | null;
};

export type AdminPartner = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
};

export type AdminLeague = {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrollmentOpen: boolean;
  scoringRule: "LP_EARNED_DURING_LEAGUE";
  prizeTitle: string;
  prizeDescription: string | null;
  awardedPositions: number;
  conditionsText: string | null;
  conditions: LeagueConditions;
  participantCount: number;
  createdAt: string;
};

export type AdminLeagueDetail = AdminLeague & {
  participants: Array<{
    userId: string;
    name: string;
    email: string;
    joinedAt: string;
    rank: number;
    score: number;
  }>;
};

export type CreatePartnerInput = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  active?: boolean;
};

export type UpdatePartnerInput = CreatePartnerInput & {
  id: string;
};

export type CreateLeagueInput = {
  partnerId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  startAt: string;
  endAt: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrollmentOpen?: boolean;
  prizeTitle: string;
  prizeDescription?: string | null;
  awardedPositions?: number;
  conditionsText?: string | null;
  conditions?: LeagueConditions | null;
};

export type UpdateLeagueInput = CreateLeagueInput & {
  id: string;
};
