import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { createReward, getRewardsCatalog } from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const rewards = await getRewardsCatalog({ includeInactive: true });
    return NextResponse.json({ rewards });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore interno del server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await request.json();

    const reward = await createReward(admin.id, {
      name: body.name,
      description: body.description,
      category: body.category,
      costLp: body.costLp,
      imageUrl: body.imageUrl,
      stock: body.stock !== undefined && body.stock !== "" ? Number(body.stock) : null,
      active: body.active ?? true,
      conditions: body.conditions,
      maxPerUser: body.maxPerUser !== undefined && body.maxPerUser !== "" ? Number(body.maxPerUser) : null,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : 0,
    });

    return NextResponse.json({ reward });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore creazione premio";
    return NextResponse.json({ message }, { status: 400 });
  }
}
