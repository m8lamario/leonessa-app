import { NextResponse } from "next/server";
import { requireUser } from "@/features/auth/server/guards";
import { redeemReward } from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    let body: { idempotencyKey?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const result = await redeemReward({
      userId: user.id,
      rewardId: id,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore interno durante il riscatto";
    return NextResponse.json({ message }, { status: 400 });
  }
}
