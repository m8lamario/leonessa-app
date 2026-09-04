import "server-only";

import { getLevelForLP, getLevelProgress } from "@/features/rewards/levels";
import { prisma } from "@/lib/prisma";
import type {
  RankingBadge,
  RankingHistoryEntry,
  RankingMission,
  RankingMock,
  SchoolRankingEntry,
  UserRankingEntry,
} from "../types/ranking";

const LEONESSA_CUP_SLUGS = ["leonessa-cup", "leonessa-cup-2026", "leonessa-cup-sandbox"];

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Rome",
});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
}

export async function getRankingData(userId: string): Promise<RankingMock> {
  // 1. Fetch current user with school and LP balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      schoolId: true,
      school: { select: { id: true, name: true, shortName: true } },
      lpBalance: { select: { balance: true, lifetimeEarned: true } },
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

  // 2. Resolve competition for missions & badges
  const competition = await prisma.competition.findFirst({
    where: { slug: { in: LEONESSA_CUP_SLUGS }, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  const competitionId = competition?.id ?? null;
  const compFilter = competitionId
    ? { OR: [{ competitionId }, { competitionId: null }] }
    : { competitionId: null };

  // 3. User Ranking (Top 10 users by balance) and Current User rank calculation
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

  const currentUserRank = higherLpCount + 1;

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
    rank: currentUserRank,
    name: userName,
    school: schoolShortName,
    initials: userInitials,
    level: userLevel,
    lp: userLp,
    isCurrentUser: true,
  };

  // 4. School Ranking (based on SchoolSupportBalance points)
  const schoolsWithSupport = await prisma.school.findMany({
    where: { deletedAt: null },
    include: {
      supportBalance: true,
    },
    orderBy: [
      { supportBalance: { points: "desc" } },
      { name: "asc" },
    ],
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

  // 5. Missions & Badges for current user
  const [userMissions, catalogBadges, userBadges, userTransactions, eventAttendanceCount, referralCount] =
    await Promise.all([
      prisma.userMission.findMany({
        where: {
          userId,
          mission: { deletedAt: null, ...compFilter },
        },
        include: {
          mission: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.badge.findMany({
        where: { deletedAt: null, active: true, ...compFilter },
        orderBy: { createdAt: "asc" },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      }),
      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.eventAttendance.count({ where: { userId } }),
      prisma.referral.count({ where: { referrerId: userId, status: "COMPLETED" } }),
    ]);

  const activeMissions: RankingMission[] = [];
  const completedMissions: RankingMission[] = [];

  for (const um of userMissions) {
    const isDone = um.status === "COMPLETED" || um.status === "CLAIMED";
    const missionItem: RankingMission = {
      id: um.missionId,
      title: um.mission.title,
      description: um.mission.description,
      rewardLP: um.mission.rewardPoints,
      progress: um.progress,
      target: 100,
      status: um.status,
      completedAt: um.completedAt ? formatDate(um.completedAt) : undefined,
    };

    if (isDone) {
      completedMissions.push(missionItem);
    } else {
      activeMissions.push(missionItem);
    }
  }

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badgeId));
  const earnedBadges: RankingBadge[] = userBadges.map((ub) => ({
    id: ub.badgeId,
    name: ub.badge.name,
    description: ub.badge.description,
    rarity: "Comune",
    earnedAt: formatDate(ub.earnedAt),
  }));

  const lockedBadges: RankingBadge[] = catalogBadges
    .filter((b) => !earnedBadgeIds.has(b.id))
    .map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      rarity: "Raro",
    }));

  const history: RankingHistoryEntry[] = userTransactions.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    reason: tx.reason,
    date: formatDate(tx.createdAt),
  }));

  const stats = {
    lpEarned: user?.lpBalance?.lifetimeEarned ?? userLp,
    missionsCompleted: completedMissions.length,
    badgesEarned: earnedBadges.length,
    eventsAttended: eventAttendanceCount,
    referralsCompleted: referralCount,
  };

  return {
    userRanking,
    currentUser,
    schoolRanking,
    currentSchool,
    activeMissions,
    completedMissions,
    earnedBadges,
    lockedBadges,
    history,
    stats,
  };
}
