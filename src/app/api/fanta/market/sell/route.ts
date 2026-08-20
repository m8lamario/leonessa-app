import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { sellPlayer } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const replacementPlayerId = typeof body.replacementPlayerId === "string" ? body.replacementPlayerId : "";
    return NextResponse.json({ result: await sellPlayer(user.id, playerId, replacementPlayerId) });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
