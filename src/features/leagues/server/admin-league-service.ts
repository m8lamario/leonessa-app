import "server-only";

import { Prisma, type SponsorLeagueStatus } from "@prisma/client";

import { formatUserName } from "@/features/profile/lib/identity";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { parseConditions, slugifyName, type LeagueConditions } from "../lib/enrollment";
import { rankMembers, scoreMembersByRule } from "../lib/scoring";
import type {
  AdminLeague,
  AdminLeagueDetail,
  AdminPartner,
  CreateLeagueInput,
  CreatePartnerInput,
  UpdateLeagueInput,
  UpdatePartnerInput,
} from "../types/leagues";

function requireText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("BAD_REQUEST", `${label} obbligatorio.`, 400);
  }
  return value.trim();
}

function optionalText(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "Valore testuale non valido.", 400);
  }
  return value.trim() || null;
}

function requireDate(value: unknown, label: string) {
  const date = typeof value === "string" || value instanceof Date ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new AppError("BAD_REQUEST", `${label} non valida.`, 400);
  }
  return date;
}

function parseStatus(value: unknown): SponsorLeagueStatus {
  if (value == null || value === "") return "DRAFT";
  if (value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED") return value;
  throw new AppError("BAD_REQUEST", "Stato lega non valido.", 400);
}

async function uniquePartnerSlug(name: string, excludeId?: string) {
  const base = slugifyName(name);
  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.partner.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function serializePartner(partner: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: Date;
}): AdminPartner {
  return {
    id: partner.id,
    name: partner.name,
    slug: partner.slug,
    description: partner.description,
    logoUrl: partner.logoUrl,
    active: partner.active,
    createdAt: partner.createdAt.toISOString(),
  };
}

function serializeLeague(league: {
  id: string;
  partnerId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  startAt: Date;
  endAt: Date;
  status: SponsorLeagueStatus;
  enrollmentOpen: boolean;
  scoringRule: "LP_EARNED_DURING_LEAGUE";
  prizeTitle: string;
  prizeDescription: string | null;
  awardedPositions: number;
  conditionsText: string | null;
  conditions: Prisma.JsonValue | null;
  createdAt: Date;
  partner: { name: string };
  _count: { members: number };
}): AdminLeague {
  return {
    id: league.id,
    partnerId: league.partnerId,
    partnerName: league.partner.name,
    name: league.name,
    description: league.description,
    imageUrl: league.imageUrl,
    startAt: league.startAt.toISOString(),
    endAt: league.endAt.toISOString(),
    status: league.status,
    enrollmentOpen: league.enrollmentOpen,
    scoringRule: league.scoringRule,
    prizeTitle: league.prizeTitle,
    prizeDescription: league.prizeDescription,
    awardedPositions: league.awardedPositions,
    conditionsText: league.conditionsText,
    conditions: parseConditions(league.conditions),
    participantCount: league._count.members,
    createdAt: league.createdAt.toISOString(),
  };
}

const leagueInclude = {
  partner: { select: { name: true } },
  _count: { select: { members: true } },
} satisfies Prisma.SponsorLeagueInclude;

export async function listPartners(): Promise<AdminPartner[]> {
  const partners = await prisma.partner.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return partners.map(serializePartner);
}

export async function createPartner(input: CreatePartnerInput): Promise<AdminPartner> {
  const name = requireText(input.name, "Nome partner");
  const partner = await prisma.partner.create({
    data: {
      name,
      slug: await uniquePartnerSlug(name),
      description: optionalText(input.description),
      logoUrl: optionalText(input.logoUrl),
      active: input.active ?? true,
    },
  });
  return serializePartner(partner);
}

export async function updatePartner(input: UpdatePartnerInput): Promise<AdminPartner> {
  const existing = await prisma.partner.findFirst({
    where: { id: input.id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Partner non trovato.", 404);
  }

  const name = requireText(input.name, "Nome partner");
  const partner = await prisma.partner.update({
    where: { id: input.id },
    data: {
      name,
      slug: name === existing.name ? existing.slug : await uniquePartnerSlug(name, input.id),
      description: optionalText(input.description),
      logoUrl: optionalText(input.logoUrl),
      active: input.active ?? existing.active,
    },
  });
  return serializePartner(partner);
}

export async function listAdminLeagues(): Promise<AdminLeague[]> {
  const leagues = await prisma.sponsorLeague.findMany({
    where: { deletedAt: null },
    include: leagueInclude,
    orderBy: [{ startAt: "desc" }, { name: "asc" }],
  });
  return leagues.map(serializeLeague);
}

function validateLeagueDates(startAt: Date, endAt: Date) {
  if (endAt <= startAt) {
    throw new AppError("BAD_REQUEST", "La data di fine deve essere successiva all'inizio.", 400);
  }
}

function leagueData(input: CreateLeagueInput) {
  const startAt = requireDate(input.startAt, "Data inizio");
  const endAt = requireDate(input.endAt, "Data fine");
  validateLeagueDates(startAt, endAt);

  const awardedPositions = input.awardedPositions ?? 1;
  if (!Number.isInteger(awardedPositions) || awardedPositions < 1) {
    throw new AppError("BAD_REQUEST", "Le posizioni premiate devono essere almeno 1.", 400);
  }

  const conditions: LeagueConditions = parseConditions(input.conditions);

  return {
    partnerId: requireText(input.partnerId, "Sponsor"),
    name: requireText(input.name, "Nome lega"),
    description: optionalText(input.description),
    imageUrl: optionalText(input.imageUrl),
    startAt,
    endAt,
    status: parseStatus(input.status),
    enrollmentOpen: Boolean(input.enrollmentOpen),
    prizeTitle: requireText(input.prizeTitle, "Premio"),
    prizeDescription: optionalText(input.prizeDescription),
    awardedPositions,
    conditionsText: optionalText(input.conditionsText),
    conditions: Object.keys(conditions).length > 0 ? (conditions as Prisma.InputJsonValue) : Prisma.DbNull,
  };
}

export async function createLeague(adminId: string, input: CreateLeagueInput): Promise<AdminLeague> {
  const data = leagueData(input);
  const partner = await prisma.partner.findFirst({
    where: { id: data.partnerId, deletedAt: null },
    select: { id: true },
  });
  if (!partner) {
    throw new AppError("BAD_REQUEST", "Sponsor non valido.", 400);
  }

  const league = await prisma.sponsorLeague.create({
    data: { ...data, createdById: adminId },
    include: leagueInclude,
  });
  return serializeLeague(league);
}

export async function updateLeague(input: UpdateLeagueInput): Promise<AdminLeague> {
  const existing = await prisma.sponsorLeague.findFirst({
    where: { id: input.id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Lega non trovata.", 404);
  }

  const data = leagueData(input);
  const partner = await prisma.partner.findFirst({
    where: { id: data.partnerId, deletedAt: null },
    select: { id: true },
  });
  if (!partner) {
    throw new AppError("BAD_REQUEST", "Sponsor non valido.", 400);
  }

  const league = await prisma.sponsorLeague.update({
    where: { id: input.id },
    data,
    include: leagueInclude,
  });
  return serializeLeague(league);
}

export async function getAdminLeagueDetail(leagueId: string): Promise<AdminLeagueDetail> {
  const league = await prisma.sponsorLeague.findFirst({
    where: { id: leagueId, deletedAt: null },
    include: {
      ...leagueInclude,
      members: {
        select: {
          userId: true,
          joinedAt: true,
          user: { select: { name: true, surname: true, email: true } },
        },
      },
    },
  });

  if (!league) {
    throw new AppError("NOT_FOUND", "Lega non trovata.", 404);
  }

  let ranked: Array<{ userId: string; joinedAt: Date; score: number; rank: number }> = [];
  if (league.members.length > 0) {
    const from = league.members.reduce((earliest, member) => {
      const start = league.startAt > member.joinedAt ? league.startAt : member.joinedAt;
      return start < earliest ? start : earliest;
    }, league.endAt);

    const transactions = await prisma.pointTransaction.findMany({
      where: {
        userId: { in: league.members.map((member) => member.userId) },
        type: "LP",
        amount: { gt: 0 },
        createdAt: { gte: from, lte: league.endAt },
      },
      select: { userId: true, amount: true, type: true, createdAt: true },
    });

    ranked = rankMembers(
      scoreMembersByRule(
        league.scoringRule,
        league.members,
        { startAt: league.startAt, endAt: league.endAt },
        transactions,
      ),
    );
  }

  const byId = new Map(league.members.map((member) => [member.userId, member]));

  return {
    ...serializeLeague(league),
    participants: ranked.map((entry) => {
      const member = byId.get(entry.userId);
      return {
        userId: entry.userId,
        name: formatUserName(member?.user ?? {}),
        email: member?.user.email ?? "",
        joinedAt: entry.joinedAt.toISOString(),
        rank: entry.rank,
        score: entry.score,
      };
    }),
  };
}
