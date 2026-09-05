import "server-only";

import type { Prisma } from "@prisma/client";

import { DELIVERY_STATUS, SOCIAL_LP_OVERTAKE_TYPE } from "../constants";

type TransactionClient = Prisma.TransactionClient;

export type ImplementedSocialEventType = typeof SOCIAL_LP_OVERTAKE_TYPE;

export type SocialNotificationInput = {
  userId: string;
  eventType: ImplementedSocialEventType;
  title: string;
  body: string;
  linkUrl: string;
  idempotencyKey: string;
};

export async function recordSocialNotificationInTransaction(
  transaction: TransactionClient,
  input: SocialNotificationInput,
) {
  const existing = await transaction.notificationDelivery.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (existing) return { created: false };

  await transaction.notificationDelivery.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      userId: input.userId,
      notificationType: input.eventType,
      status: DELIVERY_STATUS.SKIPPED,
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
      sentAt: new Date(),
      error: "Notifica social in-app",
    },
  });

  await transaction.notification.create({
    data: {
      userId: input.userId,
      type: "SOCIAL",
      title: input.title,
      body: input.body,
      linkUrl: input.linkUrl,
      sentAt: new Date(),
    },
  });

  return { created: true };
}
