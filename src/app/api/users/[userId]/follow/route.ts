import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { followUser, getFollowState, unfollowUser } from "@/features/profile/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };

function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
  }
  throw error;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { userId } = await context.params;
    return NextResponse.json({ result: await getFollowState(user.id, userId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { userId } = await context.params;
    const followed = await followUser(user.id, userId);
    const state = await getFollowState(user.id, userId);
    return NextResponse.json({ result: { ...state, created: followed.created } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { userId } = await context.params;
    const unfollowed = await unfollowUser(user.id, userId);
    const state = await getFollowState(user.id, userId);
    return NextResponse.json({ result: { ...state, removed: unfollowed.removed } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
