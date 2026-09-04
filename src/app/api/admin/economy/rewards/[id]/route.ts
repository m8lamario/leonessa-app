import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { deleteReward, getRewardById, updateReward } from "@/features/rewards/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const reward = await getRewardById(id);
    if (!reward) {
      return NextResponse.json({ message: "Premio non trovato." }, { status: 404 });
    }
    return NextResponse.json({ reward });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore interno del server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();

    const updated = await updateReward(admin.id, {
      id,
      name: body.name,
      description: body.description,
      category: body.category,
      costLp: body.costLp !== undefined ? Number(body.costLp) : undefined,
      imageUrl: body.imageUrl,
      stock: body.stock === null || body.stock === "" ? null : body.stock !== undefined ? Number(body.stock) : undefined,
      active: body.active,
      conditions: body.conditions,
      maxPerUser: body.maxPerUser === null || body.maxPerUser === "" ? null : body.maxPerUser !== undefined ? Number(body.maxPerUser) : undefined,
      displayOrder: body.displayOrder !== undefined ? Number(body.displayOrder) : undefined,
    });

    return NextResponse.json({ reward: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore aggiornamento premio";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;
    await deleteReward(admin.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore eliminazione premio";
    return NextResponse.json({ message }, { status: 400 });
  }
}
