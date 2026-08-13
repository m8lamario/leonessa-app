import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/features/auth/validation";

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

  const result = registrationSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: "Controlla i dati inseriti.",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, surname, email, password } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        surname,
        email: email.toLowerCase(),
        passwordHash,
        roles: {
          create: {
            role: "USER",
            isPrimary: false,
          },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { code: "CONFLICT", message: "Esiste già un account con questa email." },
        { status: 409 },
      );
    }

    throw error;
  }
}
