export type ApplicationKind = "player" | "team-staff" | "leonessa-staff";
export type ApplicationStatus = "In revisione" | "Accettata" | "Rifiutata";

export type ProfileApplication = {
  id: string;
  kind: ApplicationKind;
  title: string;
  submittedAt: string;
  status: ApplicationStatus;
};

export type ProfileMock = {
  schoolName: string;
  schoolRank: number;
  level: number;
  totalLp: number;
  featuredBadge: string;
  stats: Array<{ label: string; value: string; detail?: string }>;
  applications: ProfileApplication[];
};

export type ProfileBadge = {
  id: string;
  name: string;
  description: string;
  earnedAt: string | null;
};

export type ProfileIdentity = {
  schoolName: string | null;
  schoolRank: number | null;
  level: number;
  totalLp: number;
  featuredBadge: string | null;
  badges: ProfileBadge[];
  stats: Array<{ label: string; value: string; detail?: string }>;
  rankingPosition: number | null;
  fantaPosition: number | null;
  fantaPoints: number | null;
  predictionPercent: number | null;
  missionsCompleted: number;
  eventsAttended: number;
  referralsCompleted: number;
  levelProgressPercent: number;
  bio: string | null;
};

export type LpMovement = {
  id: string;
  amount: number;
  reason: string;
  date: string;
};

export type AccountPageData = {
  userId: string;
  email: string;
  name: string;
  role: string;
  schoolName: string | null;
  history: LpMovement[];
};

export type CandidaturePageData = {
  schoolTeamId: string | null;
  applications: ProfileApplication[];
};

export type ProfileHighlight = {
  id: string;
  title: string;
  detail: string | null;
  occurredAt: string;
};

export type UserShowcase = {
  id: string;
  name: string;
  initials: string;
  image: string | null;
  bio: string | null;
  schoolName: string | null;
  schoolRank: number | null;
  level: number;
  levelProgressPercent: number;
  currentLP: number;
  nextLevelLP: number | null;
  totalLp: number;
  rankingPosition: number;
  fantaPoints: number | null;
  fantaPosition: number | null;
  badges: ProfileBadge[];
  badgeCount: number;
  missionsCompleted: number;
  eventsAttended: number;
  referralsCompleted: number;
  predictionPercent: number | null;
  predictionSettled: number;
  followerCount: number;
  followingCount: number;
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    unlockedAt: string;
  }>;
  recentActivity: ProfileHighlight[];
};
