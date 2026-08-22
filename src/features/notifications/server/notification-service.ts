import "server-only";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

import { DELIVERY_STATUS, MATCH_START_NOTIFICATION_TYPE } from "../constants";
import { liveDeepLinkForMatch, livePathForMatch } from "../lib/deep-link";
import { buildMatchStartIdempotencyKeyForDevice } from "../lib/idempotency";
import { disablePushDeviceById, listEnabledDevicesForUsers } from "./device-service";
import { isPushProviderConfigured, sendPushToToken } from "./fcm";

export type MatchStartPayload = {
  matchId: string;
  startAt: Date;
  homeTeam: string;
  awayTeam: string;
};

function buildMatchStartCopy(match: MatchStartPayload) {
  const versus = `${match.homeTeam} vs ${match.awayTeam}`;
  return {
    title: "⚽ Partita iniziata",
    body: `${versus}\n\nLa partita è iniziata.`,
    shortBody: `${versus} è iniziata`,
    linkUrl: livePathForMatch(match.matchId),
    deepLink: liveDeepLinkForMatch(match.matchId),
  };
}

async function recordInAppNotification(userId: string, title: string, body: string, linkUrl: string) {
  await prisma.notification.create({
    data: {
      userId,
      type: "MATCH",
      title,
      body,
      linkUrl,
      sentAt: new Date(),
    },
  });
}

async function findDeliveryByKey(idempotencyKey: string) {
  return prisma.notificationDelivery.findUnique({
    where: { idempotencyKey },
    select: { id: true },
  });
}

/**
 * Sends MATCH_START push to all enabled devices of the given users.
 * Idempotent per device + kickoff minute.
 */
export async function notifyMatchStarted(
  match: MatchStartPayload,
  userIds: string[],
  options?: { dryRun?: boolean },
) {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) {
    return { sent: 0, failed: 0, skipped: 0, dryRun: 0 };
  }

  const copy = buildMatchStartCopy(match);
  const devices = await listEnabledDevicesForUsers(uniqueUserIds);
  const dryRun = options?.dryRun ?? !isPushProviderConfigured();

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let dryRunCount = 0;

  const notifiedUsers = new Set<string>();

  for (const device of devices) {
    const idempotencyKey = buildMatchStartIdempotencyKeyForDevice(
      match.matchId,
      match.startAt,
      device.id,
    );

    const existing = await findDeliveryByKey(idempotencyKey);
    if (existing) {
      skipped += 1;
      notifiedUsers.add(device.userId);
      continue;
    }

    await prisma.notificationDelivery.create({
      data: {
        idempotencyKey,
        userId: device.userId,
        deviceId: device.id,
        matchId: match.matchId,
        notificationType: MATCH_START_NOTIFICATION_TYPE,
        status: dryRun ? DELIVERY_STATUS.DRY_RUN : DELIVERY_STATUS.SENT,
        title: copy.title,
        body: copy.body,
        linkUrl: copy.linkUrl,
        sentAt: new Date(),
      },
    });

    if (dryRun) {
      dryRunCount += 1;
      if (!notifiedUsers.has(device.userId)) {
        await recordInAppNotification(device.userId, copy.title, copy.body, copy.linkUrl);
        notifiedUsers.add(device.userId);
      }
      continue;
    }

    const result = await sendPushToToken({
      token: device.token,
      title: copy.title,
      body: copy.shortBody,
      data: {
        type: MATCH_START_NOTIFICATION_TYPE,
        matchId: match.matchId,
        linkUrl: copy.linkUrl,
        deepLink: copy.deepLink,
      },
    });

    if (!result.ok) {
      failed += 1;
      await prisma.notificationDelivery.update({
        where: { idempotencyKey },
        data: {
          status: DELIVERY_STATUS.FAILED,
          error: `${result.errorCode}: ${result.errorMessage}`,
        },
      });
      if (result.invalidToken) {
        await disablePushDeviceById(device.id);
      }
      continue;
    }

    sent += 1;
    if (!notifiedUsers.has(device.userId)) {
      await recordInAppNotification(device.userId, copy.title, copy.body, copy.linkUrl);
      notifiedUsers.add(device.userId);
    }
  }

  // Users following without devices still get in-app notification once.
  for (const userId of uniqueUserIds) {
    if (notifiedUsers.has(userId)) continue;
    const idempotencyKey = `${buildMatchStartIdempotencyKeyForDevice(match.matchId, match.startAt, "in-app")}:${userId}`;
    const existing = await findDeliveryByKey(idempotencyKey);
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.notificationDelivery.create({
      data: {
        idempotencyKey,
        userId,
        matchId: match.matchId,
        notificationType: MATCH_START_NOTIFICATION_TYPE,
        status: DELIVERY_STATUS.SKIPPED,
        title: copy.title,
        body: copy.body,
        linkUrl: copy.linkUrl,
        error: "Nessun dispositivo push abilitato",
        sentAt: new Date(),
      },
    });
    await recordInAppNotification(userId, copy.title, copy.body, copy.linkUrl);
    skipped += 1;
  }

  logger.info(
    { matchId: match.matchId, sent, failed, skipped, dryRun: dryRunCount },
    "Match start notifications processed",
  );

  return { sent, failed, skipped, dryRun: dryRunCount };
}
