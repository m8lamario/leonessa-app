import { NextResponse } from "next/server";
import { z } from "zod";

import { requestPasswordReset, resetPassword } from "@/features/auth/server/account-service";
import { passwordResetSchema } from "@/features/auth/validation";
import { AppError } from "@/utils/errors";

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Inserisci un indirizzo email valido."),
});

export async function POST(request: Request) {
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

  const result = passwordResetRequestSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Inserisci un indirizzo email valido." },
      { status: 400 },
    );
  }

  try {
    await requestPasswordReset(result.data.email);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }

    throw error;
  }

  return NextResponse.json(
    {
      message:
        "Se esiste un account associato a questa email, riceverai un link per reimpostare la password.",
    },
    { status: 202 },
  );
}

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

  const result = passwordResetSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: result.error.issues[0]?.message ?? "Controlla i dati inseriti.",
      },
      { status: 400 },
    );
  }

  const resetResult = await resetPassword(result.data.token, result.data.password);

  if (resetResult === "invalid") {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Il link di recupero non è valido." },
      { status: 400 },
    );
  }

  if (resetResult === "expired") {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Il link di recupero è scaduto. Richiedine uno nuovo." },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: "Password aggiornata correttamente." });
}
