import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getAllRewardConfigs, updateRewardConfig } from "@/features/rewards/server";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const [configs, history] = await Promise.all([
      getAllRewardConfigs(),
      prisma.economyConfigHistory.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: {
            select: { id: true, name: true, surname: true, email: true },
          },
          config: {
            select: { key: true, title: true },
          },
        },
      }),
    ]);

    return NextResponse.json({ configs, history });
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

    if (!body.key || typeof body.rewardLp !== "number") {
      return NextResponse.json({ message: "Dati non validi." }, { status: 400 });
    }

    const updated = await updateRewardConfig(admin.id, {
      key: body.key,
      title: body.title,
      description: body.description,
      category: body.category,
      rewardLp: body.rewardLp,
      enabled: body.enabled ?? true,
      reason: body.reason,
    });

    return NextResponse.json({ config: updated });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore durante l'aggiornamento";
    return NextResponse.json({ message }, { status: 400 });
  }
}
