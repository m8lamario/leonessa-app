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
};
