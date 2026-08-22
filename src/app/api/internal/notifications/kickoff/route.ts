import { NextResponse } from "next/server";

import { requireAnyRole } from "@/features/auth/server/guards";
import { dispatchDueMatchStartNotifications } from "@/features/notifications/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }
  throw error;
}

/** Manual/operator trigger for kickoff push dispatch (also runs on the server interval). */
export async function POST() {
  try {
    await requireAnyRole(["ADMIN", "ORGANIZER"]);
    return NextResponse.json({ result: await dispatchDueMatchStartNotifications() });
  } catch (error) {
    return errorResponse(error);
  }
}
