import { NextResponse } from "next/server";
import { requireUser } from "@/features/auth/server/guards";
import { getUserRedemptions } from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const redemptions = await getUserRedemptions(user.id);
    return NextResponse.json({ redemptions });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore interno del server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
