import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { getTeamPageData } from "@/features/team/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const user = await requireUser();
  const { teamId } = await params;
  const team = await getTeamPageData(teamId, user.id);

  if (!team) {
    return NextResponse.json({ message: "Squadra non trovata." }, { status: 404 });
  }

  return NextResponse.json({ team });
}
