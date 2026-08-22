import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import {
  followMatch,
  getMatchFollowState,
  unfollowMatch,
} from "@/features/notifications/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ matchId: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }
  throw error;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { matchId } = await context.params;
    return NextResponse.json({ result: await getMatchFollowState(user.id, matchId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { matchId } = await context.params;
    return NextResponse.json({ result: await followMatch(user.id, matchId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { matchId } = await context.params;
    return NextResponse.json({ result: await unfollowMatch(user.id, matchId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
