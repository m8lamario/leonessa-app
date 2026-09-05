import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { markInboxRead } from "@/features/notifications/server/inbox-service";
import { parseInboxReadPayload } from "@/features/notifications/lib/inbox";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ code: "BAD_REQUEST", message: "JSON non valido." }, { status: 400 });
    }

    const result = await markInboxRead(user.id, parseInboxReadPayload(payload));
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
