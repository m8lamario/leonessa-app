import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getScoringInspector } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    await requireRole("ADMIN");
    return NextResponse.json(await getScoringInspector((await params).matchId));
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
