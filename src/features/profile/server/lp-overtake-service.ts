import "server-only";

import type { Prisma } from "@prisma/client";

import { profilePathForUser } from "@/features/notifications/lib/deep-link";
import { formatUserName } from "@/features/profile/lib/identity";
import {
  buildLpOvertakeCopy,
  buildLpOvertakeIdempotencyKey,
  detectLpOvertake,
} from "@/features/profile/lib/lp-overtake";
import { recordSocialNotificationInTransaction } from "@/features/notifications/server/social-notification-service";

type TransactionClient = Prisma.TransactionClient;

async function applyOvertakeChange(
  transaction: TransactionClient,
  input: {
    followId: string;
    viewerId: string;
    overtakerId: string;
    overtakerName: string;
    followerLp: number;
    followingLp: number;
    wasAhead: boolean;
    overtakeCount: number;
  },
) {
  const change = detectLpOvertake({
    followerLp: input.followerLp,
    followingLp: input.followingLp,
    wasAhead: input.wasAhead,
  });

  if (change === "unchanged") return;

  if (change === "reset") {
    await transaction.userFollow.update({
      where: { id: input.followId },
      data: { isAhead: false },
    });
    return;
  }

  const overtakeCount = input.overtakeCount + 1;
  await transaction.userFollow.update({
    where: { id: input.followId },
    data: { isAhead: true, overtakeCount, lastOvertakeAt: new Date() },
  });

  const copy = buildLpOvertakeCopy({
    overtakerName: input.overtakerName,
    overtakerLp: input.followingLp,
    viewerLp: input.followerLp,
  });

  await recordSocialNotificationInTransaction(transaction, {
    userId: input.viewerId,
    eventType: "LP_OVERTAKE",
    title: copy.title,
    body: copy.body,
    linkUrl: profilePathForUser(input.overtakerId),
    idempotencyKey: buildLpOvertakeIdempotencyKey({
      viewerId: input.viewerId,
      overtakerId: input.overtakerId,
      overtakeCount,
    }),
  });
}

export async function syncLpOvertakesInTransaction(
  transaction: TransactionClient,
  input: { changedUserId: string; previousBalance: number; nextBalance: number },
) {
  if (input.previousBalance === input.nextBalance) return;

  const changedUser = await transaction.user.findUnique({
    where: { id: input.changedUserId },
    select: { name: true, surname: true, deletedAt: true },
  });
  if (!changedUser || changedUser.deletedAt) return;

  const changedName = formatUserName(changedUser);

  const [followedByRows, followingRows] = await Promise.all([
    transaction.userFollow.findMany({
      where: { followingId: input.changedUserId, follower: { deletedAt: null } },
      select: {
        id: true,
        isAhead: true,
        overtakeCount: true,
        followerId: true,
        follower: { select: { lpBalance: { select: { balance: true } } } },
      },
    }),
    transaction.userFollow.findMany({
      where: { followerId: input.changedUserId, following: { deletedAt: null } },
      select: {
        id: true,
        isAhead: true,
        overtakeCount: true,
        followingId: true,
        following: {
          select: {
            name: true,
            surname: true,
            lpBalance: { select: { balance: true } },
          },
        },
      },
    }),
  ]);

  for (const row of followedByRows) {
    await applyOvertakeChange(transaction, {
      followId: row.id,
      viewerId: row.followerId,
      overtakerId: input.changedUserId,
      overtakerName: changedName,
      followerLp: row.follower.lpBalance?.balance ?? 0,
      followingLp: input.nextBalance,
      wasAhead: row.isAhead,
      overtakeCount: row.overtakeCount,
    });
  }

  for (const row of followingRows) {
    await applyOvertakeChange(transaction, {
      followId: row.id,
      viewerId: input.changedUserId,
      overtakerId: row.followingId,
      overtakerName: formatUserName(row.following),
      followerLp: input.nextBalance,
      followingLp: row.following.lpBalance?.balance ?? 0,
      wasAhead: row.isAhead,
      overtakeCount: row.overtakeCount,
    });
  }
}
