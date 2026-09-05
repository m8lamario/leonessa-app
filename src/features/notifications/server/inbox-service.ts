import "server-only";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

import { INBOX_LIMIT, mapInboxNotification } from "../lib/inbox";

export async function getInboxUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function listInboxNotifications(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      linkUrl: true,
      readAt: true,
      createdAt: true,
    },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: INBOX_LIMIT,
  });

  return rows.map(mapInboxNotification);
}

export async function markInboxRead(userId: string, input: { ids: string[]; all: boolean }) {
  if (!input.all && input.ids.length === 0) {
    throw new AppError("BAD_REQUEST", "Nessuna notifica da aggiornare.", 400);
  }

  const result = await prisma.notification.updateMany({
    where: input.all
      ? { userId, readAt: null }
      : { userId, id: { in: input.ids }, readAt: null },
    data: { readAt: new Date() },
  });

  return {
    updated: result.count,
    unreadCount: await getInboxUnreadCount(userId),
  };
}
