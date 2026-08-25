import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendInitialEmailVerification } from "@/features/auth/server/account-service";
import { registrationSchema } from "@/features/auth/validation";
import {
  generateReferralCode,
  REFERRAL_DEVICE_COOKIE,
} from "@/features/referral/lib/referral-domain";
import { hashReferralDeviceToken } from "@/features/referral/server/referral-device";
import { attributeReferralInTransaction } from "@/features/referral/server/referral-service";
import { AppError } from "@/utils/errors";

export async function POST(request: NextRequest) {
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

  const { name, surname, email, password, schoolId, instagram, referralCode } = result.data;
  const referralDeviceToken = request.cookies.get(REFERRAL_DEVICE_COOKIE)?.value;
  if (referralCode && !referralDeviceToken) {
    return NextResponse.json(
      {
        code: "BAD_REQUEST",
        message: "Impossibile verificare il dispositivo. Riapri il link invito e riprova.",
      },
      { status: 400 },
    );
  }
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

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.$transaction(
      async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            name,
            surname,
            email: normalizedEmail,
            passwordHash,
            schoolId,
            instagram: instagram || null,
            roles: {
              create: {
                role: "USER",
                isPrimary: true,
              },
            },
            referralCode: {
              create: { code: generateReferralCode() },
            },
          },
          select: { id: true },
        });

        if (referralCode && referralDeviceToken) {
          await attributeReferralInTransaction(transaction, {
            referredUserId: createdUser.id,
            referredEmail: normalizedEmail,
            code: referralCode,
            deviceHash: hashReferralDeviceToken(referralDeviceToken),
          });
        }

        return createdUser;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    try {
      await sendInitialEmailVerification(user.id);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { id: user.id, verificationEmailSent: false, verificationMessage: error.message },
          { status: 201 },
        );
      }

      throw error;
    }

    return NextResponse.json({ id: user.id, verificationEmailSent: true }, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      if (!existingUser) {
        return NextResponse.json(
          { code: "SERVICE_UNAVAILABLE", message: "Registrazione non disponibile. Riprova." },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { code: "CONFLICT", message: "Esiste già un account con questa email." },
        { status: 409 },
      );
    }

    throw error;
  }
}
