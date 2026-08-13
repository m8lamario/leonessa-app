import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/features/auth/server/guards";
import { onboardingSchema } from "@/features/auth/validation";
import { AppError } from "@/utils/errors";

export async function POST(request: Request) {
  let user;

  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }

    throw error;
  }

  const payload: unknown = await request.json();
  const result = onboardingSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: "Controlla i dati dell'onboarding.",
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, surname, schoolId, primaryRole, instagram } = result.data;
  const school = await prisma.school.findFirst({
    where: { id: schoolId, deletedAt: null },
    select: { id: true },
  });

  if (!school) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "La scuola selezionata non è disponibile." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: user.id },
      data: { name, surname, schoolId, instagram: instagram || null },
    });

    await transaction.userRole.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { isPrimary: false },
    });

    const existingRole = await transaction.userRole.findFirst({
      where: { userId: user.id, role: primaryRole, revokedAt: null },
      select: { id: true },
    });

    if (existingRole) {
      await transaction.userRole.update({
        where: { id: existingRole.id },
        data: { isPrimary: true },
      });
    } else {
      await transaction.userRole.create({
        data: {
          userId: user.id,
          role: primaryRole,
          isPrimary: true,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
