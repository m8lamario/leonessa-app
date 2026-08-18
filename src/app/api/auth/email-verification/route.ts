import { NextResponse } from "next/server";

import { resendEmailVerification } from "@/features/auth/server/account-service";
import { requireSession } from "@/features/auth/server/guards";
import { AppError } from "@/utils/errors";

export async function POST() {
  try {
    const session = await requireSession();
    const result = await resendEmailVerification(session.user.id);

    return NextResponse.json({
      message: result.alreadyVerified
        ? "La tua email è già verificata."
        : "Ti abbiamo inviato un'email di verifica.",
      status: result.status,
    });
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
