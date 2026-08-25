export const MISSION_STATUS_LABELS = {
  AVAILABLE: "Disponibile",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completata",
  CLAIMED: "Riscossa",
} as const;

export type MissionStatusKey = keyof typeof MISSION_STATUS_LABELS;

export type HubMission = {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  status: MissionStatusKey;
  statusLabel: string;
  completedAt: string | null;
};

export type HubBadge = {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  earnedAt: string | null;
};

export type HubPass = {
  lp: number;
  lifetimeEarned: number;
  level: number;
  progressPercent: number;
  progressLP: number;
  nextLevelLP: number | null;
  isMaxLevel: boolean;
  badgeCount: number;
  featuredBadges: Array<{ id: string; name: string }>;
};

export type HubExplore = {
  teamId: string | null;
};

export type HubReferral = {
  total: number;
  pending: number;
  completed: number;
};

export type HubData = {
  pass: HubPass;
  missions: {
    active: HubMission[];
    completed: HubMission[];
  };
  badges: {
    earned: HubBadge[];
    locked: HubBadge[];
  };
  explore: HubExplore;
  referral: HubReferral;
};

export type HubDestinationId =
  "accrediti" | "premi" | "partner" | "missioni" | "badge" | "esplora" | "referral";
