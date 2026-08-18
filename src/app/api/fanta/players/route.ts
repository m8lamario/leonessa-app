import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { getAvailableFantasyPlayers } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ players: await getAvailableFantasyPlayers() });
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
