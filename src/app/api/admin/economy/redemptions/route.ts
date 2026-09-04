import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getAllRedemptions } from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;
    const rewardId = searchParams.get("rewardId") || undefined;
    const status = (searchParams.get("status") as "PENDING" | "COMPLETED" | "CANCELLED") || undefined;

    const redemptions = await getAllRedemptions({ limit, rewardId, status });
    return NextResponse.json({ redemptions });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore interno del server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
