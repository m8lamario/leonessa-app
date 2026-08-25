import "server-only";

import { Prisma, type ReferralStatus } from "@prisma/client";

import { env } from "@/env";
import { awardLPInTransaction } from "@/features/rewards/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import {
  buildReferralLink,
  generateReferralCode,
  getReferralAttributionIssue,
  getReferralCompletionOutcome,
  getReferralRewardKeys,
  isSameDeviceReferral,
  normalizeReferralCode,
  type ReferralCompletionEvent,
} from "../lib/referral-domain";
import {
  getReferralProgramConfig,
  isReferralProgramConfigured,
  type ReferralProgramConfig,
} from "./referral-config";

const MAX_CODE_ATTEMPTS = 5;
const MAX_TRANSACTION_ATTEMPTS = 3;

type TransactionClient = Prisma.TransactionClient;

export type ReferralDashboardData = {
  code: string;
  link: string;
  program: {
    configured: boolean;
    completionEvent: ReferralCompletionEvent | null;
    referrerRewardLp: number | null;
    inviteeRewardLp: number | null;
  };
  invitations: Array<{
    id: string;
    invitedName: string;
    status: ReferralStatus;
    rewardLp: number | null;
    blockReason: "SAME_DEVICE" | null;
    createdAtLabel: string;
  }>;
  summary: {
    total: number;
    pending: number;
    completed: number;
    blocked: number;
  };
};

export type AttributeReferralInput = {
  referredUserId: string;
  referredEmail: string;
  code: string;
  deviceHash: string;
};

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Rome",
});

function formatDate(date: Date) {
  return dateFormatter.format(date).replace(".", "");
}

function invitedName(user: { name: string | null; surname: string | null }) {
  const firstName = user.name?.trim();
  const surnameInitial = user.surname?.trim().slice(0, 1).toUpperCase();

  if (!firstName) return "Nuovo membro";
  return surnameInitial ? `${firstName} ${surnameInitial}.` : firstName;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function ensureReferralCode(userId: string) {
  const existing = await prisma.referralCode.findUnique({
    where: { userId },
    select: { id: true, code: true },
  });
  if (existing) return existing;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.referralCode.create({
        data: { userId, code: generateReferralCode() },
        select: { id: true, code: true },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      const createdByConcurrentRequest = await prisma.referralCode.findUnique({
        where: { userId },
        select: { id: true, code: true },
      });
      if (createdByConcurrentRequest) return createdByConcurrentRequest;
    }
  }

  throw new AppError(
    "SERVICE_UNAVAILABLE",
    "Non è stato possibile generare il codice referral. Riprova.",
    503,
  );
}

export async function getReferralDashboard(userId: string): Promise<ReferralDashboardData> {
  const referralCode = await ensureReferralCode(userId);
  const config = getReferralProgramConfig();
  const invitations = await prisma.referral.findMany({
    where: { referrerId: userId },
    select: {
      id: true,
      status: true,
      blockReason: true,
      createdAt: true,
      referredUser: { select: { name: true, surname: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const rewards =
    invitations.length === 0
      ? []
      : await prisma.pointTransaction.findMany({
          where: {
            userId,
            sourceType: "REFERRAL",
            sourceId: { in: invitations.map(({ id }) => id) },
          },
          select: { sourceId: true, amount: true },
        });
  const rewardByReferralId = new Map(
    rewards.flatMap((reward) =>
      reward.sourceId ? [[reward.sourceId, reward.amount] as const] : [],
    ),
  );

  const statusCount = (status: ReferralStatus) =>
    invitations.filter((invitation) => invitation.status === status).length;

  return {
    code: referralCode.code,
    link: buildReferralLink(env.NEXT_PUBLIC_APP_URL, referralCode.code),
    program: {
      configured: isReferralProgramConfigured(config),
      completionEvent: config.completionEvent,
      referrerRewardLp: config.referrerRewardLp,
      inviteeRewardLp: config.inviteeRewardLp,
    },
    invitations: invitations.map((invitation) => ({
      id: invitation.id,
      invitedName: invitedName(invitation.referredUser),
      status: invitation.status,
      rewardLp: rewardByReferralId.get(invitation.id) ?? null,
      blockReason: invitation.blockReason,
      createdAtLabel: formatDate(invitation.createdAt),
    })),
    summary: {
      total: invitations.length,
      pending: statusCount("PENDING"),
      completed: statusCount("COMPLETED"),
      blocked: statusCount("BLOCKED"),
    },
  };
}

export async function attributeReferralInTransaction(
  transaction: TransactionClient,
  input: AttributeReferralInput,
) {
  const code = normalizeReferralCode(input.code);
  if (!code) {
    throw new AppError("BAD_REQUEST", "Codice referral non valido.", 400);
  }

  const referralCode = await transaction.referralCode.findUnique({
    where: { code },
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          email: true,
          referralDevices: {
            where: { deviceHash: input.deviceHash },
            select: { deviceHash: true },
          },
        },
      },
    },
  });

  const existingReferral = referralCode
    ? await transaction.referral.findUnique({
        where: { referredUserId: input.referredUserId },
        select: { id: true },
      })
    : null;
  const attributionIssue = getReferralAttributionIssue({
    codeOwnerId: referralCode?.userId ?? null,
    codeOwnerEmail: referralCode?.user.email ?? null,
    referredUserId: input.referredUserId,
    referredEmail: input.referredEmail,
    hasExistingReferral: Boolean(existingReferral),
  });
  if (attributionIssue === "INVALID_CODE") {
    throw new AppError("BAD_REQUEST", "Il codice referral non esiste.", 400);
  }
  if (attributionIssue === "SELF_REFERRAL") {
    throw new AppError("BAD_REQUEST", "Non puoi utilizzare il tuo codice referral.", 400);
  }
  if (attributionIssue === "ALREADY_ATTRIBUTED") {
    throw new AppError("CONFLICT", "Questo account ha già un referrer.", 409);
  }
  if (!referralCode) {
    throw new AppError("BAD_REQUEST", "Il codice referral non esiste.", 400);
  }

  const sameDevice = isSameDeviceReferral({
    referredDeviceHash: input.deviceHash,
    referrerDeviceHashes: new Set(
      referralCode.user.referralDevices.map(({ deviceHash }) => deviceHash),
    ),
  });
  const referral = await transaction.referral.create({
    data: {
      referralCodeId: referralCode.id,
      referrerId: referralCode.userId,
      referredUserId: input.referredUserId,
      status: sameDevice ? "BLOCKED" : "PENDING",
      blockReason: sameDevice ? "SAME_DEVICE" : null,
      referrerDeviceHash: sameDevice ? input.deviceHash : null,
      referredDeviceHash: input.deviceHash,
    },
    select: { id: true, status: true, blockReason: true },
  });
  await transaction.referralDevice.upsert({
    where: {
      userId_deviceHash: {
        userId: input.referredUserId,
        deviceHash: input.deviceHash,
      },
    },
    create: {
      userId: input.referredUserId,
      deviceHash: input.deviceHash,
    },
    update: {},
  });

  await transaction.auditLog.create({
    data: {
      actorId: input.referredUserId,
      action: "CREATE",
      entityType: "Referral",
      entityId: referral.id,
      metadata: {
        event: "REFERRAL_ATTRIBUTED",
        status: referral.status,
        blockReason: referral.blockReason,
      },
    },
  });

  return referral;
}

export async function recordReferralDevice(userId: string, deviceHash: string) {
  await prisma.referralDevice.upsert({
    where: { userId_deviceHash: { userId, deviceHash } },
    create: { userId, deviceHash },
    update: {},
  });

  const receivedReferral = await prisma.referral.findUnique({
    where: { referredUserId: userId },
    select: {
      id: true,
      status: true,
      blockReason: true,
      referrerId: true,
    },
  });
  if (!receivedReferral || receivedReferral.status === "COMPLETED") {
    return { changed: false, status: receivedReferral?.status ?? null };
  }

  const isKnownReferrerDevice = Boolean(
    await prisma.referralDevice.findUnique({
      where: {
        userId_deviceHash: {
          userId: receivedReferral.referrerId,
          deviceHash,
        },
      },
      select: { id: true },
    }),
  );

  if (isKnownReferrerDevice && receivedReferral.status !== "BLOCKED") {
    await prisma.referral.update({
      where: { id: receivedReferral.id },
      data: {
        status: "BLOCKED",
        blockReason: "SAME_DEVICE",
        referrerDeviceHash: deviceHash,
        referredDeviceHash: deviceHash,
      },
    });
    return { changed: true, status: "BLOCKED" as const };
  }

  if (
    !isKnownReferrerDevice &&
    receivedReferral.status === "BLOCKED" &&
    receivedReferral.blockReason === "SAME_DEVICE"
  ) {
    await prisma.referral.update({
      where: { id: receivedReferral.id },
      data: {
        status: "PENDING",
        blockReason: null,
        referredDeviceHash: deviceHash,
      },
    });
    return { changed: true, status: "PENDING" as const };
  }

  return { changed: false, status: receivedReferral.status };
}

export async function completeReferralForEvent(
  referredUserId: string,
  event: ReferralCompletionEvent,
  config: ReferralProgramConfig = getReferralProgramConfig(),
) {
  if (config.completionEvent !== event) {
    return { outcome: "EVENT_NOT_CONFIGURED" as const };
  }
  if (!isReferralProgramConfigured(config)) {
    return { outcome: "REWARDS_NOT_CONFIGURED" as const };
  }

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (transaction) => {
          const referral = await transaction.referral.findUnique({
            where: { referredUserId },
            select: {
              id: true,
              referrerId: true,
              referredUserId: true,
              status: true,
              blockReason: true,
            },
          });
          if (!referral) return { outcome: "NO_REFERRAL" as const };
          const completionOutcome = getReferralCompletionOutcome(referral.status);
          if (completionOutcome === "BLOCKED") {
            return { outcome: "BLOCKED" as const, blockReason: referral.blockReason };
          }

          const rewardKeys = getReferralRewardKeys(referral.id);
          await awardLPInTransaction(transaction, {
            userId: referral.referrerId,
            amount: config.referrerRewardLp!,
            sourceType: "REFERRAL",
            sourceId: referral.id,
            reason: "REFERRAL_COMPLETED_REFERRER",
            idempotencyKey: rewardKeys.referrer,
          });
          await awardLPInTransaction(transaction, {
            userId: referral.referredUserId,
            amount: config.inviteeRewardLp!,
            sourceType: "REFERRAL",
            sourceId: referral.id,
            reason: "REFERRAL_COMPLETED_INVITEE",
            idempotencyKey: rewardKeys.invitee,
          });

          if (referral.status !== "COMPLETED") {
            const completedAt = new Date();
            await transaction.referral.update({
              where: { id: referral.id },
              data: { status: "COMPLETED", completedAt },
            });
            await transaction.auditLog.create({
              data: {
                actorId: referral.referredUserId,
                action: "UPDATE",
                entityType: "Referral",
                entityId: referral.id,
                metadata: { event: "REFERRAL_COMPLETED", completionEvent: event },
              },
            });
          }

          return {
            outcome:
              completionOutcome === "ALREADY_COMPLETED"
                ? ("ALREADY_COMPLETED" as const)
                : ("COMPLETED" as const),
            referralId: referral.id,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isRetryableTransactionError(error) || attempt === MAX_TRANSACTION_ATTEMPTS - 1) {
        throw error;
      }
    }
  }

  throw new AppError("SERVICE_UNAVAILABLE", "Completamento referral non disponibile.", 503);
}
