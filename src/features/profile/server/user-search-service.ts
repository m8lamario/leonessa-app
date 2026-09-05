import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getLevelForLP } from "@/features/rewards/levels";
import { AppError } from "@/utils/errors";

import { formatUserInitials, formatUserName } from "../lib/identity";
import {
  getUserSearchIssue,
  getUserSearchTokens,
  USER_SEARCH_LIMIT,
  USER_SEARCH_MESSAGES,
} from "../lib/user-search";

export type UserSearchResult = {
  id: string;
  name: string;
  initials: string;
  school: string;
  level: number;
  ranking: number | null;
  isCurrentUser: boolean;
};

export async function searchPublicUsers(input: {
  query: string;
  viewerId: string;
  limit?: number;
}): Promise<UserSearchResult[]> {
  const issue = getUserSearchIssue(input.query);
  if (issue) {
    throw new AppError("BAD_REQUEST", USER_SEARCH_MESSAGES[issue], 400);
  }

  const tokens = getUserSearchTokens(input.query);
  const limit = Math.min(Math.max(input.limit ?? USER_SEARCH_LIMIT, 1), USER_SEARCH_LIMIT);

  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      AND: tokens.map((token) => ({
        OR: [
          { name: { contains: token, mode: Prisma.QueryMode.insensitive } },
          { surname: { contains: token, mode: Prisma.QueryMode.insensitive } },
        ],
      })),
    },
    select: {
      id: true,
      name: true,
      surname: true,
      school: { select: { shortName: true, name: true } },
      lpBalance: { select: { balance: true } },
    },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
    take: limit,
  });

  const balances = users.map((user) => user.lpBalance?.balance ?? 0);
  const uniqueBalances = [...new Set(balances)];
  const higherCounts =
    uniqueBalances.length === 0
      ? new Map<number, number>()
      : new Map(
          await Promise.all(
            uniqueBalances.map(async (balance) => {
              const count = await prisma.userLPBalance.count({
                where: { balance: { gt: balance }, user: { deletedAt: null } },
              });
              return [balance, count] as const;
            }),
          ),
        );

  return users.map((user) => {
    const lp = user.lpBalance?.balance ?? 0;
    return {
      id: user.id,
      name: formatUserName(user),
      initials: formatUserInitials(user),
      school: user.school?.shortName ?? user.school?.name ?? "—",
      level: getLevelForLP(lp),
      ranking: (higherCounts.get(lp) ?? 0) + 1,
      isCurrentUser: user.id === input.viewerId,
    };
  });
}
