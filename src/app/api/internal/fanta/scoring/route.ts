import { NextResponse } from "next/server";

import { requireAnyRole } from "@/features/auth/server/guards";
import { getFantasyScoringStatus, syncFantasyScoring } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

async function requireScoringOperator() {
  await requireAnyRole(["ADMIN", "ORGANIZER"]);
}

function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }

  throw error;
}

export async function GET() {
  try {
    await requireScoringOperator();
    return NextResponse.json(await getFantasyScoringStatus());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  try {
    await requireScoringOperator();
    return NextResponse.json({ result: await syncFantasyScoring() });
  } catch (error) {
    return errorResponse(error);
  }
}
