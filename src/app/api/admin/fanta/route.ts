import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getControlOverview } from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return NextResponse.json(await getControlOverview());
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ message: error.message }, { status: error.status });
    throw error;
  }
}
