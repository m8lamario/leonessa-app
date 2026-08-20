import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getPlayerInspector } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ playerId: string }> }) {
  try {
    await requireRole("ADMIN");
    return NextResponse.json(await getPlayerInspector((await params).playerId));
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
