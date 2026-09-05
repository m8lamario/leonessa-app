import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { submitMatchPrediction } from "@/features/predictions/server";
import { AppError } from "@/utils/errors";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "JSON non valido." },
        { status: 400 },
      );
    }

    const body = payload as { matchId?: unknown; choice?: unknown };
    if (typeof body.matchId !== "string" || !body.matchId.trim()) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Partita non valida." },
        { status: 400 },
      );
    }

    const prediction = await submitMatchPrediction({
      userId: user.id,
      matchId: body.matchId,
      choice: body.choice,
    });

    return NextResponse.json({ prediction });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
