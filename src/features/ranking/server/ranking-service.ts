import "server-only";

import { LEONESSA_CUP_SLUG } from "@/features/cup/server";
import { getPublishedLeagues } from "@/features/leagues/server";
import { formatUserInitials, formatUserName } from "@/features/profile/lib/identity";
import { getLevelForLP } from "@/features/rewards/levels";
import { prisma } from "@/lib/prisma";

import type { RankingData, SchoolRankingEntry, UserRankingEntry } from "../types/ranking";

const USER_RANKING_LIMIT = 50;

function toUserEntry(
  user: {
    id: string;
    name: string | null;
    surname: string | null;
    image: string | null;
    school: { shortName: string; name: string } | null;
  },
  rank: number,
  lp: number,
  currentUserId: string,
): UserRankingEntry {
  return {
    id: user.id,
    rank,
    name: formatUserName(user),
    school: user.school?.shortName ?? user.school?.name ?? "—",
    initials: formatUserInitials(user),
    image: user.image,
    level: getLevelForLP(lp),
    lp,
    isCurrentUser: user.id === currentUserId,
  };
}

export async function getRankingData(userId: string): Promise<RankingData> {
  const [user, topUsersWithBalance, leagues, competition] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        image: true,
        schoolId: true,
        school: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        lpBalance: { select: { balance: true } },
      },
    }),
    prisma.userLPBalance.findMany({
      where: { user: { deletedAt: null } },
      orderBy: [{ balance: "desc" }, { createdAt: "asc" }],
      take: USER_RANKING_LIMIT,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            image: true,
            school: { select: { shortName: true, name: true } },
          },
        },
      },
    }),
    getPublishedLeagues(userId),
    prisma.competition.findUnique({
      where: { slug: LEONESSA_CUP_SLUG },
      select: { id: true },
    }),
  ]);

  const userLp = user?.lpBalance?.balance ?? 0;
  const higherLpCount = await prisma.userLPBalance.count({
    where: {
      balance: { gt: userLp },
      user: { deletedAt: null },
    },
  });

  const userRanking: UserRankingEntry[] = topUsersWithBalance.map((item, index) =>
    toUserEntry(item.user, index + 1, item.balance, userId),
  );

  const currentUser: UserRankingEntry = user
    ? toUserEntry(user, higherLpCount + 1, userLp, userId)
    : {
        id: userId,
        rank: higherLpCount + 1,
        name: "Tifoso",
        school: "—",
        initials: "T",
        image: null,
        level: getLevelForLP(userLp),
        lp: userLp,
        isCurrentUser: true,
      };

  const [schoolsWithSupport, teams] = await Promise.all([
    prisma.school.findMany({
      where: { deletedAt: null },
      include: { supportBalance: true },
      orderBy: [{ supportBalance: { points: "desc" } }, { name: "asc" }],
    }),
    competition
      ? prisma.team.findMany({
          where: { competitionId: competition.id, deletedAt: null },
          select: { id: true, schoolId: true },
        })
      : Promise.resolve([]),
  ]);

  const teamBySchoolId = new Map(teams.map((team) => [team.schoolId, team.id]));

  const schoolRanking: SchoolRankingEntry[] = schoolsWithSupport.map((sch, index) => ({
    id: sch.id,
    rank: index + 1,
    name: sch.name,
    shortName: sch.shortName,
    logoUrl: sch.logoUrl,
    teamId: teamBySchoolId.get(sch.id) ?? null,
    ssp: sch.supportBalance?.points ?? 0,
    isCurrentSchool: sch.id === user?.schoolId,
  }));

  const userSchoolIndex = schoolRanking.findIndex((school) => school.isCurrentSchool);
  const currentSchool: SchoolRankingEntry =
    userSchoolIndex >= 0
      ? schoolRanking[userSchoolIndex]
      : {
          id: user?.schoolId ?? "none",
          rank: schoolRanking.length + 1,
          name: user?.school?.name ?? "Nessuna scuola",
          shortName: user?.school?.shortName ?? "—",
          logoUrl: user?.school?.logoUrl ?? null,
          teamId: user?.schoolId ? (teamBySchoolId.get(user.schoolId) ?? null) : null,
          ssp: 0,
          isCurrentSchool: true,
        };

  return {
    userRanking,
    currentUser,
    schoolRanking,
    currentSchool,
    leagues,
  };
}
