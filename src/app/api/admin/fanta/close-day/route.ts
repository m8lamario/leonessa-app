import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { closeSandboxMatchday } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    await requireRole("ADMIN");
    const { matchId } = await request.json();
    return NextResponse.json(await closeSandboxMatchday(matchId));
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
