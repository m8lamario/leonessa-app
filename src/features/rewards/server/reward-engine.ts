import { Prisma, type PointSourceType, type PointType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getLevelProgress, type LevelProgress } from "@/features/rewards/levels";
import { AppError } from "@/utils/errors";

type TransactionClient = Prisma.TransactionClient;

export type AwardPointsInput = {
  userId: string;
  amount: number;
  type: PointType;
  sourceType: PointSourceType;
  sourceId?: string;
  competitionId?: string;
  schoolId?: string;
  reason: string;
  idempotencyKey: string;
};

export type AwardPointsResult = {
  applied: boolean;
  transaction: {
    id: string;
    amount: number;
    type: PointType;
    sourceType: PointSourceType;
    sourceId: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
  };
  lpBalance: number | null;
  sspBalance: number | null;
  level: LevelProgress | null;
};

export type UserLPProfile = {
  balance: number;
  level: LevelProgress;
};

function validateAwardInput(input: AwardPointsInput) {
  if (!input.userId.trim()) {
    throw new TypeError("È necessario specificare un utente.");
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new RangeError("La quantità di punti deve essere un intero maggiore di zero.");
  }

  if (!input.reason.trim()) {
    throw new TypeError("È necessario specificare il motivo dell'assegnazione.");
  }

  if (!input.idempotencyKey.trim()) {
    throw new TypeError("È necessaria una chiave di idempotenza.");
  }

  if (input.type === "SSP" && !input.schoolId) {
    throw new TypeError("Gli SSP richiedono una scuola di destinazione.");
  }

  if (input.type !== "SSP" && input.schoolId) {
    throw new TypeError("La scuola è ammessa solo per assegnazioni SSP.");
  }

  if (input.type === "SP") {
    throw new TypeError("Il Reward Engine LP MVP non gestisce i punti staff.");
  }
}

async function getExistingAward(transaction: TransactionClient, idempotencyKey: string) {
  return transaction.pointTransaction.findUnique({
    where: { idempotencyKey },
    select: {
      id: true,
      userId: true,
      schoolId: true,
      amount: true,
      type: true,
      sourceType: true,
      sourceId: true,
      competitionId: true,
      reason: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });
}

function assertSameAward(
  existing: {
    userId: string;
    schoolId: string | null;
    competitionId: string | null;
    amount: number;
    type: PointType;
    sourceType: PointSourceType;
    sourceId: string | null;
    reason: string;
  },
  input: AwardPointsInput,
) {
  if (
    existing.userId !== input.userId ||
    existing.schoolId !== (input.schoolId ?? null) ||
    existing.competitionId !== (input.competitionId ?? null) ||
    existing.amount !== input.amount ||
    existing.type !== input.type ||
    existing.sourceType !== input.sourceType ||
    existing.sourceId !== (input.sourceId ?? null) ||
    existing.reason !== input.reason
  ) {
    throw new AppError(
      "CONFLICT",
      "La chiave di idempotenza è già associata a un'assegnazione diversa.",
      409,
    );
  }
}

async function createLPBalance(transaction: TransactionClient, userId: string) {
  return transaction.userLPBalance.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

async function createSSPBalance(transaction: TransactionClient, schoolId: string) {
  return transaction.schoolSupportBalance.upsert({
    where: { schoolId },
    create: { schoolId },
    update: {},
  });
}

async function awardPointsInTransaction(transaction: TransactionClient, input: AwardPointsInput) {
  const existing = await getExistingAward(transaction, input.idempotencyKey);

  if (existing) {
    assertSameAward(existing, input);
    return { existing, applied: false };
  }

  const pointTransaction = await transaction.pointTransaction.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId,
      competitionId: input.competitionId,
      amount: input.amount,
      type: input.type,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
    },
    select: {
      id: true,
      userId: true,
      schoolId: true,
      amount: true,
      type: true,
      sourceType: true,
      sourceId: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });

  if (input.type === "LP") {
    const balance = await createLPBalance(transaction, input.userId);
    const updatedBalance = await transaction.userLPBalance.update({
      where: { id: balance.id },
      data: {
        balance: { increment: input.amount },
        lifetimeEarned: { increment: input.amount },
      },
    });

    return {
      pointTransaction,
      lpBalance: updatedBalance.balance,
      sspBalance: null,
    };
  }

  if (!input.schoolId) {
    throw new TypeError("Gli SSP richiedono una scuola di destinazione.");
  }

  const balance = await createSSPBalance(transaction, input.schoolId);
  const updatedBalance = await transaction.schoolSupportBalance.update({
    where: { id: balance.id },
    data: {
      points: { increment: input.amount },
      lifetimeEarned: { increment: input.amount },
    },
  });

  return {
    pointTransaction,
    lpBalance: null,
    sspBalance: updatedBalance.points,
  };
}

export async function awardLPInTransaction(
  transaction: TransactionClient,
  input: Omit<AwardPointsInput, "type" | "schoolId">,
) {
  const award = { ...input, type: "LP" as const };
  validateAwardInput(award);

  return awardPointsInTransaction(transaction, award);
}

function toAwardResult(result: {
  applied: boolean;
  pointTransaction: {
    id: string;
    amount: number;
    type: PointType;
    sourceType: PointSourceType;
    sourceId: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
  };
  lpBalance: number | null;
  sspBalance: number | null;
}): AwardPointsResult {
  return {
    applied: result.applied,
    transaction: result.pointTransaction,
    lpBalance: result.lpBalance,
    sspBalance: result.sspBalance,
    level: result.lpBalance === null ? null : getLevelProgress(result.lpBalance),
  };
}

export async function awardPoints(input: AwardPointsInput): Promise<AwardPointsResult> {
  validateAwardInput(input);

  try {
    const result = await prisma.$transaction(
      async (transaction) => {
        const awarded = await awardPointsInTransaction(transaction, input);

        if (!awarded.existing) {
          return toAwardResult({
            applied: true,
            pointTransaction: awarded.pointTransaction,
            lpBalance: awarded.lpBalance,
            sspBalance: awarded.sspBalance,
          });
        }

        const existingLPBalance =
          awarded.existing.type === "LP"
            ? await transaction.userLPBalance.findUnique({
                where: { userId: awarded.existing.userId },
                select: { balance: true },
              })
            : null;
        const existingSSPBalance =
          awarded.existing.type === "SSP" && awarded.existing.schoolId
            ? await transaction.schoolSupportBalance.findUnique({
                where: { schoolId: awarded.existing.schoolId },
                select: { points: true },
              })
            : null;

        return toAwardResult({
          applied: false,
          pointTransaction: awarded.existing,
          lpBalance: existingLPBalance?.balance ?? null,
          sspBalance: existingSSPBalance?.points ?? null,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return result;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      input.idempotencyKey
    ) {
      const existing = await prisma.pointTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        select: {
          id: true,
          userId: true,
          schoolId: true,
          amount: true,
          type: true,
          sourceType: true,
          sourceId: true,
          competitionId: true,
          reason: true,
          idempotencyKey: true,
          createdAt: true,
        },
      });

      if (existing) {
        assertSameAward(existing, input);
        const lpBalance =
          existing.type === "LP"
            ? await prisma.userLPBalance.findUnique({
                where: { userId: existing.userId },
                select: { balance: true },
              })
            : null;
        const sspBalance =
          existing.type === "SSP" && existing.schoolId
            ? await prisma.schoolSupportBalance.findUnique({
                where: { schoolId: existing.schoolId },
                select: { points: true },
              })
            : null;

        return toAwardResult({
          applied: false,
          pointTransaction: existing,
          lpBalance: lpBalance?.balance ?? null,
          sspBalance: sspBalance?.points ?? null,
        });
      }
    }

    throw error;
  }
}

export function awardLP(
  input: Omit<AwardPointsInput, "type" | "schoolId">,
): Promise<AwardPointsResult> {
  return awardPoints({ ...input, type: "LP" });
}

export function awardSSP(
  input: Omit<AwardPointsInput, "type"> & { schoolId: string },
): Promise<AwardPointsResult> {
  return awardPoints({ ...input, type: "SSP" });
}

export type SpendLPInput = {
  userId: string;
  amount: number;
  sourceType: PointSourceType;
  sourceId?: string;
  reason: string;
  idempotencyKey: string;
};

export type SpendLPResult = {
  applied: boolean;
  transaction: {
    id: string;
    amount: number;
    type: PointType;
    sourceType: PointSourceType;
    sourceId: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
  };
  lpBalance: number;
  level: LevelProgress;
};

function validateSpendInput(input: SpendLPInput) {
  if (!input.userId.trim()) {
    throw new TypeError("È necessario specificare un utente.");
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new RangeError("La quantità di punti da spendere deve essere un intero maggiore di zero.");
  }

  if (!input.reason.trim()) {
    throw new TypeError("È necessario specificare il motivo della spesa.");
  }

  if (!input.idempotencyKey.trim()) {
    throw new TypeError("È necessaria una chiave di idempotenza.");
  }
}

export async function spendLPInTransaction(
  transaction: TransactionClient,
  input: SpendLPInput,
): Promise<{
  applied: boolean;
  pointTransaction: {
    id: string;
    amount: number;
    type: PointType;
    sourceType: PointSourceType;
    sourceId: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
  };
  lpBalance: number;
}> {
  validateSpendInput(input);

  const existing = await transaction.pointTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: {
      id: true,
      userId: true,
      schoolId: true,
      amount: true,
      type: true,
      sourceType: true,
      sourceId: true,
      competitionId: true,
      reason: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });

  if (existing) {
    if (
      existing.userId !== input.userId ||
      existing.amount !== -input.amount ||
      existing.type !== "LP" ||
      existing.sourceType !== input.sourceType ||
      existing.sourceId !== (input.sourceId ?? null) ||
      existing.reason !== input.reason
    ) {
      throw new AppError(
        "CONFLICT",
        "La chiave di idempotenza è già associata a una spesa diversa.",
        409,
      );
    }

    const currentBalanceRecord = await transaction.userLPBalance.findUnique({
      where: { userId: input.userId },
      select: { balance: true },
    });

    return {
      applied: false,
      pointTransaction: existing,
      lpBalance: currentBalanceRecord?.balance ?? 0,
    };
  }

  const currentBalance = await transaction.userLPBalance.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, balance: 0, lifetimeEarned: 0 },
    update: {},
  });

  if (currentBalance.balance < input.amount) {
    throw new AppError("BAD_REQUEST", "Saldo LP insufficiente.", 400);
  }

  const pointTransaction = await transaction.pointTransaction.create({
    data: {
      userId: input.userId,
      amount: -input.amount,
      type: "LP",
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
    },
    select: {
      id: true,
      userId: true,
      schoolId: true,
      amount: true,
      type: true,
      sourceType: true,
      sourceId: true,
      idempotencyKey: true,
      createdAt: true,
    },
  });

  const updatedBalance = await transaction.userLPBalance.update({
    where: { id: currentBalance.id },
    data: {
      balance: { decrement: input.amount },
    },
    select: { balance: true },
  });

  return {
    applied: true,
    pointTransaction,
    lpBalance: updatedBalance.balance,
  };
}

export async function spendLP(input: SpendLPInput): Promise<SpendLPResult> {
  validateSpendInput(input);

  const result = await prisma.$transaction(
    async (tx) => {
      const spent = await spendLPInTransaction(tx, input);
      return {
        applied: spent.applied,
        transaction: spent.pointTransaction,
        lpBalance: spent.lpBalance,
        level: getLevelProgress(spent.lpBalance),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return result;
}

export async function getLPBalance(userId: string): Promise<number> {
  if (!userId.trim()) {
    throw new TypeError("È necessario specificare un utente.");
  }
  const balance = await prisma.userLPBalance.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return balance?.balance ?? 0;
}

export async function getUserLPProfile(userId: string): Promise<UserLPProfile> {
  if (!userId.trim()) {
    throw new TypeError("È necessario specificare un utente.");
  }

  const balance = await prisma.userLPBalance.findUnique({
    where: { userId },
    select: { balance: true },
  });
  const currentLP = balance?.balance ?? 0;

  return {
    balance: currentLP,
    level: getLevelProgress(currentLP),
  };
}

export async function getSchoolSupportPoints(schoolId: string): Promise<number> {
  if (!schoolId.trim()) {
    throw new TypeError("È necessario specificare una scuola.");
  }

  const balance = await prisma.schoolSupportBalance.findUnique({
    where: { schoolId },
    select: { points: true },
  });

  return balance?.points ?? 0;
}
