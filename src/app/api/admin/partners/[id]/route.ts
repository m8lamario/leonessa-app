import { NextResponse } from "next/server";

import { requireRole } from "@/features/auth/server/guards";
import { updatePartner } from "@/features/leagues/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json();
    const partner = await updatePartner({ ...body, id });
    return NextResponse.json({ partner });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore aggiornamento partner";
    return NextResponse.json({ message }, { status: 400 });
  }
}
