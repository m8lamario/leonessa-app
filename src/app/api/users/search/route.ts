import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { searchPublicUsers } from "@/features/profile/server/user-search-service";
import { AppError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const users = await searchPublicUsers({ query, viewerId: user.id });
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }
}
