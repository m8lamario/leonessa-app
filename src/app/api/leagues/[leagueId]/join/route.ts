import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { joinLeague } from "@/features/leagues/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ leagueId: string }> },
) {
  try {
    const user = await requireUser();
    const { leagueId } = await params;
    const result = await joinLeague(user.id, leagueId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore iscrizione";
    return NextResponse.json({ message }, { status: 500 });
  }
}
