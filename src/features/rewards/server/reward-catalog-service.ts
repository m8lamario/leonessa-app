import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { spendLPInTransaction, getLPBalance } from "@/features/rewards/server/reward-engine";
import { AppError } from "@/utils/errors";

export type CreateRewardInput = {
  name: string;
  description: string;
  category?: string;
  costLp: number;
  imageUrl?: string | null;
  stock?: number | null;
  active?: boolean;
  conditions?: string | null;
  maxPerUser?: number | null;
  displayOrder?: number;
};

export type UpdateRewardInput = Partial<CreateRewardInput> & {
  id: string;
};

export type RedeemRewardInput = {
  userId: string;
  rewardId: string;
  idempotencyKey?: string;
};

function generateClaimCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "LEO-";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}

export async function getRewardsCatalog(options?: {
  includeInactive?: boolean;
  category?: string;
}) {
  const where: Prisma.RewardWhereInput = {
    deletedAt: null,
  };

  if (!options?.includeInactive) {
    where.active = true;
  }

  if (options?.category) {
    where.category = options.category;
  }

  return prisma.reward.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { costLp: "asc" }, { createdAt: "asc" }],
  });
}

export async function getRewardById(id: string) {
  return prisma.reward.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function getUserRewardCatalog(userId: string) {
  const [rewards, userBalance, redemptions] = await Promise.all([
    getRewardsCatalog({ includeInactive: false }),
    getLPBalance(userId),
    prisma.rewardRedemption.findMany({
      where: { userId, status: { not: "CANCELLED" } },
      select: { rewardId: true },
    }),
  ]);

  const userRedemptionCount = new Map<string, number>();
  for (const r of redemptions) {
    userRedemptionCount.set(r.rewardId, (userRedemptionCount.get(r.rewardId) ?? 0) + 1);
  }

  return {
    balance: userBalance,
    rewards: rewards.map((reward) => {
      const redeemedCount = userRedemptionCount.get(reward.id) ?? 0;
      const isOutOfStock = reward.stock !== null && reward.stock <= 0;
      const reachedMaxPerUser =
        reward.maxPerUser !== null && redeemedCount >= reward.maxPerUser;
      const canAfford = userBalance >= reward.costLp;
      const canRedeem = reward.active && !isOutOfStock && !reachedMaxPerUser && canAfford;

      return {
        ...reward,
        userRedeemedCount: redeemedCount,
        isOutOfStock,
        reachedMaxPerUser,
        canAfford,
        canRedeem,
      };
    }),
  };
}

export async function getUserRedemptions(userId: string) {
  return prisma.rewardRedemption.findMany({
    where: { userId },
    include: {
      reward: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          imageUrl: true,
          conditions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllRedemptions(options?: {
  limit?: number;
  rewardId?: string;
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
}) {
  return prisma.rewardRedemption.findMany({
    where: {
      rewardId: options?.rewardId,
      status: options?.status,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
        },
      },
      reward: {
        select: {
          id: true,
          name: true,
          category: true,
          costLp: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}

export async function createReward(actorId: string | null, input: CreateRewardInput) {
  if (!input.name.trim()) {
    throw new TypeError("Il nome del premio è obbligatorio.");
  }
  if (!Number.isInteger(input.costLp) || input.costLp <= 0) {
    throw new RangeError("Il costo in LP deve essere un intero maggiore di zero.");
  }
  if (input.stock !== null && input.stock !== undefined && input.stock < 0) {
    throw new RangeError("Lo stock non può essere negativo.");
  }
  if (input.maxPerUser !== null && input.maxPerUser !== undefined && input.maxPerUser <= 0) {
    throw new RangeError("Il limite per utente deve essere maggiore di zero.");
  }

  const reward = await prisma.reward.create({
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      category: input.category?.trim().toLowerCase() || "merchandise",
      costLp: input.costLp,
      imageUrl: input.imageUrl ?? null,
      stock: input.stock ?? null,
      active: input.active ?? true,
      conditions: input.conditions ?? null,
      maxPerUser: input.maxPerUser ?? null,
      displayOrder: input.displayOrder ?? 0,
    },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "CREATE",
        entityType: "Reward",
        entityId: reward.id,
        metadata: {
          name: reward.name,
          costLp: reward.costLp,
          stock: reward.stock,
        },
      },
    });
  }

  return reward;
}

export async function updateReward(actorId: string | null, input: UpdateRewardInput) {
  const existing = await prisma.reward.findUnique({
    where: { id: input.id },
  });
  if (!existing || existing.deletedAt) {
    throw new AppError("NOT_FOUND", "Premio non trovato.", 404);
  }

  if (input.costLp !== undefined && (!Number.isInteger(input.costLp) || input.costLp <= 0)) {
    throw new RangeError("Il costo in LP deve essere un intero maggiore di zero.");
  }
  if (input.stock !== undefined && input.stock !== null && input.stock < 0) {
    throw new RangeError("Lo stock non può essere negativo.");
  }
  if (input.maxPerUser !== undefined && input.maxPerUser !== null && input.maxPerUser <= 0) {
    throw new RangeError("Il limite per utente deve essere maggiore di zero.");
  }

  const updated = await prisma.reward.update({
    where: { id: input.id },
    data: {
      name: input.name !== undefined ? input.name.trim() : undefined,
      description: input.description !== undefined ? input.description.trim() : undefined,
      category: input.category !== undefined ? input.category.trim().toLowerCase() : undefined,
      costLp: input.costLp !== undefined ? input.costLp : undefined,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl : undefined,
      stock: input.stock !== undefined ? input.stock : undefined,
      active: input.active !== undefined ? input.active : undefined,
      conditions: input.conditions !== undefined ? input.conditions : undefined,
      maxPerUser: input.maxPerUser !== undefined ? input.maxPerUser : undefined,
      displayOrder: input.displayOrder !== undefined ? input.displayOrder : undefined,
    },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "Reward",
        entityId: updated.id,
        metadata: {
          oldCostLp: existing.costLp,
          newCostLp: updated.costLp,
          oldStock: existing.stock,
          newStock: updated.stock,
          oldActive: existing.active,
          newActive: updated.active,
        },
      },
    });
  }

  return updated;
}

export async function deleteReward(actorId: string | null, rewardId: string) {
  const existing = await prisma.reward.findUnique({
    where: { id: rewardId },
  });
  if (!existing || existing.deletedAt) {
    throw new AppError("NOT_FOUND", "Premio non trovato.", 404);
  }

  const deleted = await prisma.reward.update({
    where: { id: rewardId },
    data: {
      deletedAt: new Date(),
      active: false,
    },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "DELETE",
        entityType: "Reward",
        entityId: deleted.id,
        metadata: {
          name: existing.name,
        },
      },
    });
  }

  return deleted;
}

export async function redeemReward(input: RedeemRewardInput) {
  if (!input.userId.trim()) {
    throw new TypeError("È necessario specificare un utente.");
  }
  if (!input.rewardId.trim()) {
    throw new TypeError("È necessario specificare un premio.");
  }

  const idempotencyKey = input.idempotencyKey?.trim() || `redeem:${input.userId}:${input.rewardId}:${Date.now()}`;

  return prisma.$transaction(
    async (tx) => {
      const existingRedemption = await tx.rewardRedemption.findUnique({
        where: { idempotencyKey },
        include: {
          reward: {
            select: { id: true, name: true, description: true, category: true, imageUrl: true },
          },
        },
      });

      if (existingRedemption) {
        return {
          redemption: existingRedemption,
          applied: false,
          remainingBalance: await getLPBalance(input.userId),
        };
      }

      const reward = await tx.reward.findUnique({
        where: { id: input.rewardId },
      });

      if (!reward || reward.deletedAt) {
        throw new AppError("NOT_FOUND", "Premio non trovato.", 404);
      }

      if (!reward.active) {
        throw new AppError("BAD_REQUEST", "Questo premio non è al momento disponibile.", 400);
      }

      if (reward.stock !== null && reward.stock <= 0) {
        throw new AppError("BAD_REQUEST", "Premio esaurito.", 400);
      }

      if (reward.maxPerUser !== null) {
        const userCount = await tx.rewardRedemption.count({
          where: {
            userId: input.userId,
            rewardId: reward.id,
            status: { not: "CANCELLED" },
          },
        });
        if (userCount >= reward.maxPerUser) {
          throw new AppError(
            "BAD_REQUEST",
            `Hai già raggiunto il limite massimo di ${reward.maxPerUser} riscatti per questo premio.`,
            400,
          );
        }
      }

      const spendResult = await spendLPInTransaction(tx, {
        userId: input.userId,
        amount: reward.costLp,
        sourceType: "REWARD_REDEMPTION",
        sourceId: reward.id,
        reason: `Riscatto premio: ${reward.name}`,
        idempotencyKey: `spend:${idempotencyKey}`,
      });

      let updatedStock = reward.stock;
      if (reward.stock !== null) {
        const res = await tx.reward.update({
          where: { id: reward.id },
          data: {
            stock: { decrement: 1 },
          },
          select: { stock: true },
        });
        updatedStock = res.stock;
      }

      const claimCode = generateClaimCode();

      const redemption = await tx.rewardRedemption.create({
        data: {
          userId: input.userId,
          rewardId: reward.id,
          costLp: reward.costLp,
          status: "COMPLETED",
          code: claimCode,
          idempotencyKey,
          metadata: {
            rewardName: reward.name,
            rewardCategory: reward.category,
            remainingStock: updatedStock,
            transactionId: spendResult.pointTransaction.id,
          },
        },
        include: {
          reward: {
            select: { id: true, name: true, description: true, category: true, imageUrl: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: input.userId,
          action: "REWARD_REDEMPTION",
          entityType: "RewardRedemption",
          entityId: redemption.id,
          metadata: {
            rewardId: reward.id,
            rewardName: reward.name,
            costLp: reward.costLp,
            code: claimCode,
          },
        },
      });

      return {
        redemption,
        applied: true,
        remainingBalance: spendResult.lpBalance,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
