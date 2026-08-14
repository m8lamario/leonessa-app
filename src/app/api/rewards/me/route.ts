import { NextResponse } from "next/server";

import { getSchoolSupportPoints, getUserLPProfile } from "@/features/rewards/server";
import { requireUser } from "@/features/auth/server/guards";
import { AppError } from "@/utils/errors";

export async function GET() {
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

  const profile = await getUserLPProfile(user.id);
  const schoolSupportPoints = user.schoolId ? await getSchoolSupportPoints(user.schoolId) : null;

  return NextResponse.json({
    lp: profile,
    schoolSupportPoints,
  });
}
