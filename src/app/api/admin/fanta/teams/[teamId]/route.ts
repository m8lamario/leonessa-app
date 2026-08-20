import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getTeamInspector } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    await requireRole("ADMIN");
    return NextResponse.json(await getTeamInspector((await params).teamId));
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
