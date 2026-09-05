import "server-only";

import { getLevelForLP } from "@/features/rewards/levels";
import { prisma } from "@/lib/prisma";
import type { RankingData, SchoolRankingEntry, UserRankingEntry } from "../types/ranking";

export async function getRankingData(userId: string): Promise<RankingData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      schoolId: true,
      school: { select: { id: true, name: true, shortName: true } },
      lpBalance: { select: { balance: true } },
    },
  });

  const userName = [user?.name, user?.surname].filter(Boolean).join(" ") || "Tifoso";
  const userInitials =
    [user?.name, user?.surname]
      .filter(Boolean)
      .map((val) => val?.slice(0, 1).toUpperCase())
      .join("") || "T";
  const userLp = user?.lpBalance?.balance ?? 0;
  const userLevel = getLevelForLP(userLp);
  const schoolName = user?.school?.name ?? "Nessuna scuola";
  const schoolShortName = user?.school?.shortName ?? "—";

  const [topUsersWithBalance, higherLpCount] = await Promise.all([
    prisma.userLPBalance.findMany({
      where: { user: { deletedAt: null } },
      orderBy: [{ balance: "desc" }, { createdAt: "asc" }],
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            surname: true,
            school: { select: { shortName: true, name: true } },
          },
        },
      },
    }),
    prisma.userLPBalance.count({
      where: {
        balance: { gt: userLp },
        user: { deletedAt: null },
      },
    }),
  ]);

  const userRanking: UserRankingEntry[] = topUsersWithBalance.map((item, index) => {
    const itemInitials =
      [item.user.name, item.user.surname]
        .filter(Boolean)
        .map((val) => val?.slice(0, 1).toUpperCase())
        .join("") || "U";
    const fullName = [item.user.name, item.user.surname].filter(Boolean).join(" ") || "Utente";

    return {
      id: item.user.id,
      rank: index + 1,
      name: fullName,
      school: item.user.school?.shortName ?? item.user.school?.name ?? "—",
      initials: itemInitials,
      level: getLevelForLP(item.balance),
      lp: item.balance,
      isCurrentUser: item.user.id === userId,
    };
  });

  const currentUser: UserRankingEntry = {
    id: userId,
    rank: higherLpCount + 1,
    name: userName,
    school: schoolShortName,
    initials: userInitials,
    level: userLevel,
    lp: userLp,
    isCurrentUser: true,
  };

  const schoolsWithSupport = await prisma.school.findMany({
    where: { deletedAt: null },
    include: {
      supportBalance: true,
    },
    orderBy: [{ supportBalance: { points: "desc" } }, { name: "asc" }],
  });

  const schoolRanking: SchoolRankingEntry[] = schoolsWithSupport.map((sch, index) => ({
    id: sch.id,
    rank: index + 1,
    name: sch.name,
    shortName: sch.shortName,
    ssp: sch.supportBalance?.points ?? 0,
    isCurrentSchool: sch.id === user?.schoolId,
  }));

  const userSchoolIndex = schoolRanking.findIndex((s) => s.isCurrentSchool);
  const currentSchool: SchoolRankingEntry =
    userSchoolIndex >= 0
      ? schoolRanking[userSchoolIndex]
      : {
          id: user?.schoolId ?? "none",
          rank: schoolRanking.length + 1,
          name: schoolName,
          shortName: schoolShortName,
          ssp: 0,
          isCurrentSchool: true,
        };

  return {
    userRanking,
    currentUser,
    schoolRanking,
    currentSchool,
  };
}
