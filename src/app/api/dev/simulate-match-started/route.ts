import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import {
  getPushDebugSnapshot,
  simulateMatchStartedPush,
} from "@/features/notifications/server";
import { AppError } from "@/utils/errors";
import { guardAdminSandbox } from "../sandbox-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await guardAdminSandbox();
  if (denied) return denied;

  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as { matchId?: unknown };
    const matchId = typeof body.matchId === "string" ? body.matchId : undefined;
    return NextResponse.json({
      result: await simulateMatchStartedPush(user.id, matchId),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  const denied = await guardAdminSandbox();
  if (denied) return denied;

  try {
    const user = await requireUser();
    return NextResponse.json({ result: await getPushDebugSnapshot(user.id) });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
