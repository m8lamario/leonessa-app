import { NextResponse } from "next/server";

import { createFantasyTeam, getFantasyTeamByUserId, hasFantasyTeam } from "@/features/fanta/server";
import { requireUser } from "@/features/auth/server/guards";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const team = await createFantasyTeam(user.id, {
      name: typeof body.name === "string" ? body.name : "",
      starterIds: Array.isArray(body.starterIds) ? body.starterIds : [],
      benchIds: Array.isArray(body.benchIds) ? body.benchIds : [],
      captainId: typeof body.captainId === "string" ? body.captainId : "",
    });

    return NextResponse.json({ team }, { status: 201 });
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

export async function GET() {
  try {
    const user = await requireUser();
    const teamExists = await hasFantasyTeam(user.id);

    if (!teamExists) {
      return NextResponse.json({ hasTeam: false });
    }

    return NextResponse.json({
      hasTeam: true,
      team: await getFantasyTeamByUserId(user.id),
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
