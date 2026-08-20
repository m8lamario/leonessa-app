import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { buyPlayerIntoVacancy, sellPlayerToVacancy } from "@/features/fanta/server/market-service";
import {
  confirmFormation,
  promoteBenchToVacancy,
  reorderBench,
  swapStarterWithBench,
} from "@/features/fanta/server/formation-service";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "swap") {
      const team = await swapStarterWithBench(
        user.id,
        typeof body.starterPlayerId === "string" ? body.starterPlayerId : "",
        typeof body.benchPlayerId === "string" ? body.benchPlayerId : "",
      );
      return NextResponse.json({ team });
    }

    if (action === "reorder-bench") {
      const team = await reorderBench(
        user.id,
        Array.isArray(body.orderedBenchPlayerIds) ? body.orderedBenchPlayerIds : [],
      );
      return NextResponse.json({ team });
    }

    if (action === "sell") {
      const result = await sellPlayerToVacancy(
        user.id,
        typeof body.playerId === "string" ? body.playerId : "",
      );
      return NextResponse.json({ result });
    }

    if (action === "buy-vacancy") {
      const result = await buyPlayerIntoVacancy(
        user.id,
        typeof body.playerId === "string" ? body.playerId : "",
        typeof body.vacancyId === "string" ? body.vacancyId : "",
      );
      return NextResponse.json({ result });
    }

    if (action === "promote-bench") {
      const team = await promoteBenchToVacancy(
        user.id,
        typeof body.benchPlayerId === "string" ? body.benchPlayerId : "",
        typeof body.vacancyId === "string" ? body.vacancyId : "",
      );
      return NextResponse.json({ team });
    }

    if (action === "confirm") {
      const confirmation = await confirmFormation(user.id);
      return NextResponse.json({ confirmation });
    }

    throw new AppError("BAD_REQUEST", "Azione formazione non valida.", 400);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
