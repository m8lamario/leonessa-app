import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/features/auth/server/guards";
import { REFERRAL_DEVICE_COOKIE } from "@/features/referral/lib/referral-domain";
import {
  createReferralDeviceToken,
  hashReferralDeviceToken,
  REFERRAL_DEVICE_MAX_AGE_SECONDS,
} from "@/features/referral/server/referral-device";
import {
  completeReferralForEvent,
  recordReferralDevice,
} from "@/features/referral/server/referral-service";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const existingToken = request.cookies.get(REFERRAL_DEVICE_COOKIE)?.value;
  const token = existingToken ?? createReferralDeviceToken();
  const deviceHash = hashReferralDeviceToken(token);
  const session = await getAuthSession();
  let referralStatus: "PENDING" | "COMPLETED" | "BLOCKED" | null = null;

  if (session?.user?.id) {
    const deviceResult = await recordReferralDevice(session.user.id, deviceHash);
    referralStatus = deviceResult.status;

    if (deviceResult.changed && deviceResult.status === "PENDING") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true },
      });
      if (user?.emailVerified) {
        await completeReferralForEvent(session.user.id, "EMAIL_VERIFIED");
      }
    }
  }

  const response = NextResponse.json({ deviceReady: true, referralStatus });
  if (!existingToken) {
    // Secure only on HTTPS. Production builds on http://localhost would otherwise
    // get a cookie the browser refuses to store, breaking referral attribution.
    const secure = request.nextUrl.protocol === "https:";
    response.cookies.set({
      name: REFERRAL_DEVICE_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: REFERRAL_DEVICE_MAX_AGE_SECONDS,
    });
  }

  return response;
}
