import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/features/auth/server/guards";
import { prisma } from "@/lib/prisma";

const teamApplicationSchema = z.object({
  kind: z.enum(["PLAYER", "STAFF"]),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const user = await requireUser();
  const { teamId } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Richiesta non valida." }, { status: 400 });
  }

  const parsedBody = teamApplicationSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "Tipo candidatura non valido." }, { status: 400 });
  }

  const team = await prisma.team.findFirst({
    where: { id: teamId, deletedAt: null },
    select: { id: true, schoolId: true },
  });

  if (!team) {
    return NextResponse.json({ message: "Squadra non trovata." }, { status: 404 });
  }

  if (user.schoolId !== team.schoolId) {
    return NextResponse.json(
      { message: "Puoi candidarti solo per la squadra della tua scuola." },
      { status: 403 },
    );
  }

  const application = await prisma.teamApplication.upsert({
    where: {
      teamId_userId_kind: {
        teamId: team.id,
        userId: user.id,
        kind: parsedBody.data.kind,
      },
    },
    create: {
      teamId: team.id,
      userId: user.id,
      kind: parsedBody.data.kind,
    },
    update: {},
    select: {
      kind: true,
      status: true,
    },
  });

  return NextResponse.json({
    application: {
      kind: application.kind === "PLAYER" ? "player" : "staff",
      status: application.status.toLowerCase(),
    },
  });
}
