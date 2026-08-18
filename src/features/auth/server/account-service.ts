import { createHash, randomBytes } from "node:crypto";

import { EmailVerificationDeliveryKind, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { awardLPInTransaction } from "@/features/rewards/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { sendPasswordResetEmail, sendVerificationEmail } from "./account-email";

const EMAIL_VERIFICATION_PREFIX = "email-verification:";
const PASSWORD_RESET_PREFIX = "password-reset:";
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const EMAIL_VERIFICATION_COOLDOWN_MS = 2 * 60 * 1000;
const EMAIL_VERIFICATION_RESEND_LIMIT = 3;
const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

export type EmailVerificationStatus = {
  email: string;
  sentAt: Date | null;
  cooldownEndsAt: Date | null;
  resendCount: number;
  resendLimit: number;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenIdentifier(prefix: string, email: string) {
  return `${prefix}${email.toLowerCase()}`;
}

async function createToken(prefix: string, email: string, ttlMs: number) {
  const identifier = tokenIdentifier(prefix, email);
  const token = randomBytes(32).toString("hex");

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

function toEmailVerificationStatus(
  email: string,
  latestDelivery: { createdAt: Date } | null,
  resendCount: number,
): EmailVerificationStatus {
  const sentAt = latestDelivery?.createdAt ?? null;
  const cooldownEndsAt =
    sentAt && sentAt.getTime() + EMAIL_VERIFICATION_COOLDOWN_MS > Date.now()
      ? new Date(sentAt.getTime() + EMAIL_VERIFICATION_COOLDOWN_MS)
      : null;

  return {
    email,
    sentAt,
    cooldownEndsAt,
    resendCount,
    resendLimit: EMAIL_VERIFICATION_RESEND_LIMIT,
  };
}

export async function getEmailVerificationStatus(userId: string): Promise<EmailVerificationStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new AppError("UNAUTHORIZED", "Utente non disponibile.", 401);
  }

  const resendWindowStart = new Date(Date.now() - EMAIL_VERIFICATION_RESEND_WINDOW_MS);
  const [latestDelivery, resendCount] = await Promise.all([
    prisma.emailVerificationDelivery.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.emailVerificationDelivery.count({
      where: {
        userId,
        kind: "RESEND",
        createdAt: { gte: resendWindowStart },
      },
    }),
  ]);

  return toEmailVerificationStatus(user.email, latestDelivery, resendCount);
}

async function deliverEmailVerification(userId: string, kind: EmailVerificationDeliveryKind) {
  const now = new Date();
  const resendWindowStart = new Date(now.getTime() - EMAIL_VERIFICATION_RESEND_WINDOW_MS);
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const delivery = await prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, emailVerified: true, deletedAt: true },
      });

      if (!user || user.deletedAt) {
        throw new AppError("UNAUTHORIZED", "Utente non disponibile.", 401);
      }

      if (user.emailVerified) {
        return { alreadyVerified: true as const, email: user.email };
      }

      const [latestDelivery, resendCount] = await Promise.all([
        transaction.emailVerificationDelivery.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
        transaction.emailVerificationDelivery.count({
          where: {
            userId,
            kind: "RESEND",
            createdAt: { gte: resendWindowStart },
          },
        }),
      ]);

      if (kind === "RESEND" && resendCount >= EMAIL_VERIFICATION_RESEND_LIMIT) {
        throw new AppError(
          "RATE_LIMITED",
          "Hai raggiunto il numero massimo di richieste. Riprova più tardi.",
          429,
        );
      }

      const status = toEmailVerificationStatus(user.email, latestDelivery, resendCount);
      if (kind === "RESEND" && status.cooldownEndsAt) {
        throw new AppError(
          "RATE_LIMITED",
          `Potrai richiedere una nuova email tra ${Math.ceil(
            (status.cooldownEndsAt.getTime() - now.getTime()) / 1000,
          )} secondi.`,
          429,
        );
      }

      const identifier = tokenIdentifier(EMAIL_VERIFICATION_PREFIX, user.email);
      await transaction.verificationToken.deleteMany({ where: { identifier } });
      await transaction.verificationToken.create({
        data: {
          identifier,
          token: tokenHash,
          expires: new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS),
        },
      });
      const createdDelivery = await transaction.emailVerificationDelivery.create({
        data: { userId, kind },
        select: { id: true, createdAt: true },
      });
      await transaction.auditLog.create({
        data: {
          actorId: user.id,
          action: "CREATE",
          entityType: "EmailVerificationDelivery",
          entityId: createdDelivery.id,
          metadata: {
            event: kind === "INITIAL" ? "EMAIL_VERIFICATION_SENT" : "EMAIL_VERIFICATION_RESENT",
          },
        },
      });

      return {
        alreadyVerified: false as const,
        email: user.email,
        delivery: createdDelivery,
        resendCount: kind === "RESEND" ? resendCount + 1 : resendCount,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (delivery.alreadyVerified) {
    return {
      alreadyVerified: true,
      status: await getEmailVerificationStatus(userId),
    };
  }

  try {
    await sendVerificationEmail(delivery.email, token);
  } catch (error) {
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { token: tokenHash } }),
      prisma.emailVerificationDelivery.delete({ where: { id: delivery.delivery.id } }),
    ]);
    throw error;
  }

  return {
    alreadyVerified: false,
    status: toEmailVerificationStatus(delivery.email, delivery.delivery, delivery.resendCount),
  };
}

export function sendInitialEmailVerification(userId: string) {
  return deliverEmailVerification(userId, "INITIAL");
}

export function resendEmailVerification(userId: string) {
  return deliverEmailVerification(userId, "RESEND");
}

export async function verifyEmail(token: string) {
  const tokenHash = hashToken(token);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verificationToken || !verificationToken.identifier.startsWith(EMAIL_VERIFICATION_PREFIX)) {
    return "invalid" as const;
  }

  if (verificationToken.expires <= new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
    return "expired" as const;
  }

  const email = verificationToken.identifier.slice(EMAIL_VERIFICATION_PREFIX.length);

  return prisma.$transaction(async (transaction) => {
    await transaction.verificationToken.delete({ where: { token: tokenHash } });

    const user = await transaction.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return "invalid" as const;
    }

    if (user.emailVerified) {
      return "already-verified" as const;
    }

    const mission = await transaction.mission.upsert({
      where: { slug: "verify-email" },
      create: {
        slug: "verify-email",
        title: "Verifica il tuo account",
        description: "Verifica la tua email per completare il profilo Leonessa.",
        rewardPoints: 25,
      },
      update: {
        title: "Verifica il tuo account",
        description: "Verifica la tua email per completare il profilo Leonessa.",
        rewardPoints: 25,
        active: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    await transaction.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await transaction.userMission.upsert({
      where: {
        userId_missionId: {
          userId: user.id,
          missionId: mission.id,
        },
      },
      create: {
        userId: user.id,
        missionId: mission.id,
        status: "CLAIMED",
        progress: 100,
        completedAt: new Date(),
        claimedAt: new Date(),
      },
      update: {
        status: "CLAIMED",
        progress: 100,
        completedAt: new Date(),
        claimedAt: new Date(),
      },
    });
    await awardLPInTransaction(transaction, {
      userId: user.id,
      amount: 25,
      sourceType: "MISSION",
      sourceId: mission.id,
      reason: "EMAIL_VERIFIED",
      idempotencyKey: `email-verified:${user.id}`,
    });
    await transaction.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        metadata: { event: "EMAIL_VERIFIED" },
      },
    });

    return "verified" as const;
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return;
  }

  const token = await createToken(PASSWORD_RESET_PREFIX, user.email, PASSWORD_RESET_TTL_MS);
  await sendPasswordResetEmail(user.email, token);
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE",
      entityType: "PasswordReset",
      entityId: user.id,
      metadata: { event: "PASSWORD_RESET_REQUESTED" },
    },
  });
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const resetToken = await prisma.verificationToken.findUnique({ where: { token: tokenHash } });

  if (!resetToken || !resetToken.identifier.startsWith(PASSWORD_RESET_PREFIX)) {
    return "invalid" as const;
  }

  if (resetToken.expires <= new Date()) {
    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
    return "expired" as const;
  }

  const email = resetToken.identifier.slice(PASSWORD_RESET_PREFIX.length);
  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (transaction) => {
    await transaction.verificationToken.delete({ where: { token: tokenHash } });

    const user = await transaction.user.findUnique({
      where: { email },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return "invalid" as const;
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await transaction.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        metadata: { event: "PASSWORD_RESET_COMPLETED" },
      },
    });

    return "reset" as const;
  });
}

export async function changePassword(userId: string, currentPassword: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new AppError("UNAUTHORIZED", "Utente non disponibile.", 401);
  }

  if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError("BAD_REQUEST", "La password attuale non è corretta.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "UPDATE",
        entityType: "User",
        entityId: user.id,
        metadata: { event: "PASSWORD_CHANGED" },
      },
    }),
  ]);
}
