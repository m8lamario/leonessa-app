import { NextResponse } from "next/server";

import { requireRole } from "@/features/auth/server/guards";
import { getAdminLeagueDetail, updateLeague } from "@/features/leagues/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const league = await getAdminLeagueDetail(id);
    return NextResponse.json({ league });
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
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const league = await updateLeague({ ...body, id });
    return NextResponse.json({ league });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore aggiornamento lega";
    return NextResponse.json({ message }, { status: 400 });
  }
}
