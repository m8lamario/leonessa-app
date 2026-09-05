import "server-only";

import type { TeamApplicationKind, TeamApplicationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { formatUserName } from "../lib/identity";
import type {
  AccountPageData,
  ApplicationStatus,
  CandidaturePageData,
  ProfileApplication,
} from "../types/profile";

const LEONESSA_CUP_SLUG = "leonessa-cup";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Rome",
});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
}

function mapApplicationStatus(status: TeamApplicationStatus): ApplicationStatus {
  if (status === "APPROVED") return "Accettata";
  if (status === "REJECTED") return "Rifiutata";
  return "In revisione";
}

function mapApplicationKind(kind: TeamApplicationKind): ProfileApplication["kind"] {
  return kind === "PLAYER" ? "player" : "team-staff";
}

function applicationTitle(kind: TeamApplicationKind) {
  return kind === "PLAYER" ? "Diventa Giocatore" : "Staff Squadra";
}

async function findSchoolTeamId(schoolId: string | null) {
  if (!schoolId) return null;

  const competition = await prisma.competition.findUnique({
    where: { slug: LEONESSA_CUP_SLUG },
    select: { id: true },
  });

  if (!competition) return null;

  const schoolTeam = await prisma.team.findFirst({
    where: { competitionId: competition.id, schoolId, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return schoolTeam?.id ?? null;
}

export async function getAccountPageData(input: {
  userId: string;
  email: string;
  name: string | null;
  surname: string | null;
  role: string;
  schoolName: string | null;
}): Promise<AccountPageData> {
  const transactions = await prisma.pointTransaction.findMany({
    where: { userId: input.userId },
    select: { id: true, amount: true, reason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return {
    userId: input.userId,
    email: input.email,
    name: formatUserName({ name: input.name, surname: input.surname }),
    role: input.role,
    schoolName: input.schoolName,
    history: transactions.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      reason: entry.reason,
      date: formatDate(entry.createdAt),
    })),
  };
}

export async function getCandidaturePageData(input: {
  userId: string;
  schoolId: string | null;
}): Promise<CandidaturePageData> {
  const [schoolTeamId, applications] = await Promise.all([
    findSchoolTeamId(input.schoolId),
    prisma.teamApplication.findMany({
      where: { userId: input.userId },
      select: { id: true, kind: true, status: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  return {
    schoolTeamId,
    applications: applications.map((application) => ({
      id: application.id,
      kind: mapApplicationKind(application.kind),
      title: applicationTitle(application.kind),
      status: mapApplicationStatus(application.status),
      submittedAt: formatDate(application.submittedAt),
    })),
  };
}
