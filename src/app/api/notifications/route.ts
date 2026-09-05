import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import {
  getInboxUnreadCount,
  listInboxNotifications,
} from "@/features/notifications/server/inbox-service";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const [notifications, unreadCount] = await Promise.all([
      listInboxNotifications(user.id),
      getInboxUnreadCount(user.id),
    ]);
    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
