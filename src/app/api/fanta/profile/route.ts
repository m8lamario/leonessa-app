import { NextResponse } from "next/server";

import { getMyPlayerProfile } from "@/features/fanta/server";
import { requireUser } from "@/features/auth/server/guards";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getMyPlayerProfile(user.id);
    return NextResponse.json({ profile });
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
