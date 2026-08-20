import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { recalculateSandbox } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireRole("ADMIN");
    const { matchId } = await request.json();
    return NextResponse.json(await recalculateSandbox(matchId));
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
