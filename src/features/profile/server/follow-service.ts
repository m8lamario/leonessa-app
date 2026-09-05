import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { assertCanFollowUser } from "../lib/follow-domain";

async function requireActiveUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  });
  if (!user) {
    throw new AppError("NOT_FOUND", "Profilo non trovato.", 404);
  }
  return user;
}

export async function getFollowState(viewerId: string, profileId: string) {
  await requireActiveUser(profileId);

  const [followingRow, followerCount, followingCount] = await Promise.all([
    viewerId === profileId
      ? Promise.resolve(null)
      : prisma.userFollow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: profileId } },
          select: { id: true },
        }),
    prisma.userFollow.count({ where: { followingId: profileId, follower: { deletedAt: null } } }),
    prisma.userFollow.count({ where: { followerId: profileId, following: { deletedAt: null } } }),
  ]);

  return {
    profileId,
    following: Boolean(followingRow),
    followerCount,
    followingCount,
    canFollow: viewerId !== profileId,
  };
}

export async function listFollowedUserIds(userId: string) {
  const rows = await prisma.userFollow.findMany({
    where: { followerId: userId, following: { deletedAt: null } },
    select: { followingId: true },
  });
  return rows.map((row) => row.followingId);
}

export async function followUser(followerId: string, followingId: string) {
  const allowed = assertCanFollowUser(followerId, followingId);
  if (!allowed.ok) {
    throw new AppError("BAD_REQUEST", allowed.message, 400);
  }

  await requireActiveUser(followingId);

  const existing = await prisma.userFollow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
    select: { id: true },
  });
  if (existing) {
    return { following: true, created: false, profileId: followingId };
  }

  const [followerBalance, followingBalance] = await Promise.all([
    prisma.userLPBalance.findUnique({ where: { userId: followerId }, select: { balance: true } }),
    prisma.userLPBalance.findUnique({ where: { userId: followingId }, select: { balance: true } }),
  ]);

  try {
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId,
        isAhead: (followingBalance?.balance ?? 0) > (followerBalance?.balance ?? 0),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { following: true, created: false, profileId: followingId };
    }
    throw error;
  }

  return { following: true, created: true, profileId: followingId };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const allowed = assertCanFollowUser(followerId, followingId);
  if (!allowed.ok) {
    throw new AppError("BAD_REQUEST", allowed.message, 400);
  }

  await requireActiveUser(followingId);

  const deleted = await prisma.userFollow.deleteMany({
    where: { followerId, followingId },
  });

  return { following: false, removed: deleted.count > 0, profileId: followingId };
}
