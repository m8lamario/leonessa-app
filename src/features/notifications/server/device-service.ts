import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { PUSH_PLATFORMS, type PushPlatform } from "../constants";

function assertPlatform(platform: string): PushPlatform {
  if (!PUSH_PLATFORMS.includes(platform as PushPlatform)) {
    throw new AppError("BAD_REQUEST", "Piattaforma push non valida.", 400);
  }
  return platform as PushPlatform;
}

export async function registerPushDevice(input: {
  userId: string;
  token: string;
  platform: string;
}) {
  const token = input.token.trim();
  if (!token) {
    throw new AppError("BAD_REQUEST", "Token push non disponibile.", 400);
  }
  const platform = assertPlatform(input.platform.trim().toLowerCase());
  const now = new Date();

  const existing = await prisma.pushDevice.findUnique({ where: { token } });
  if (existing) {
    return prisma.pushDevice.update({
      where: { token },
      data: {
        userId: input.userId,
        platform,
        enabled: true,
        revokedAt: null,
        lastSeenAt: now,
      },
    });
  }

  return prisma.pushDevice.create({
    data: {
      userId: input.userId,
      token,
      platform,
      enabled: true,
      lastSeenAt: now,
    },
  });
}

export async function disablePushDevice(userId: string, token: string) {
  const device = await prisma.pushDevice.findUnique({ where: { token } });
  if (!device || device.userId !== userId) {
    throw new AppError("NOT_FOUND", "Dispositivo non trovato.", 404);
  }

  return prisma.pushDevice.update({
    where: { token },
    data: {
      enabled: false,
      revokedAt: new Date(),
    },
  });
}

export async function disablePushDeviceById(deviceId: string) {
  return prisma.pushDevice.update({
    where: { id: deviceId },
    data: {
      enabled: false,
      revokedAt: new Date(),
    },
  });
}

export async function listEnabledDevicesForUsers(userIds: string[]) {
  if (userIds.length === 0) return [];
  return prisma.pushDevice.findMany({
    where: {
      userId: { in: userIds },
      enabled: true,
      revokedAt: null,
    },
  });
}
