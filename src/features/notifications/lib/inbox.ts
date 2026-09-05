export const INBOX_LIMIT = 12;

export type InboxNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export function sanitizeInboxLink(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || trimmed.includes(":") || /[\s<>]/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function mapInboxNotification(row: {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): InboxNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: sanitizeInboxLink(row.linkUrl),
    read: Boolean(row.readAt),
    createdAt: row.createdAt.toISOString(),
  };
}

export function parseInboxReadPayload(payload: unknown): { ids: string[]; all: boolean } {
  if (!payload || typeof payload !== "object") {
    return { ids: [], all: false };
  }
  const body = payload as { all?: unknown; ids?: unknown; id?: unknown };
  const all = body.all === true;
  const ids = [
    ...(Array.isArray(body.ids) ? body.ids : []),
    ...(typeof body.id === "string" ? [body.id] : []),
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  return { ids, all };
}
