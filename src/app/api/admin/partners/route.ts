import { NextResponse } from "next/server";

import { requireRole } from "@/features/auth/server/guards";
import { createPartner, listPartners } from "@/features/leagues/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const partners = await listPartners();
    return NextResponse.json({ partners });
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
    await requireRole("ADMIN");
    const body = await request.json();
    const partner = await createPartner(body);
    return NextResponse.json({ partner });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Errore creazione partner";
    return NextResponse.json({ message }, { status: 400 });
  }
}
