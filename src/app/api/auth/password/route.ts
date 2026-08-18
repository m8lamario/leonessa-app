import { NextResponse } from "next/server";

import { changePassword } from "@/features/auth/server/account-service";
import { requireSession } from "@/features/auth/server/guards";
import { passwordChangeSchema } from "@/features/auth/validation";
import { AppError } from "@/utils/errors";

export async function PUT(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "JSON non valido." },
        { status: 400 },
      );
    }

    throw error;
  }

  const result = passwordChangeSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: result.error.issues[0]?.message ?? "Controlla i dati inseriti.",
      },
      { status: 400 },
    );
  }

  try {
    const session = await requireSession();
    await changePassword(session.user.id, result.data.currentPassword, result.data.password);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }

    throw error;
  }

  return NextResponse.json({ message: "Password aggiornata correttamente." });
}
