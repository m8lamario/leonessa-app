import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import {
  createMatchEvent,
  deleteMatchEvent,
  getMatchEvents,
  updateMatchEvent,
} from "@/features/fanta/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";
async function guard() {
  await requireRole("ADMIN");
}
function error(error: unknown) {
  if (error instanceof AppError)
    return NextResponse.json({ message: error.message }, { status: error.status });
  throw error;
}

export async function GET(request: Request) {
  try {
    await guard();
    const id = new URL(request.url).searchParams.get("matchId") ?? "";
    return NextResponse.json({ events: await getMatchEvents(id) });
  } catch (e) {
    return error(e);
  }
}
export async function POST(request: Request) {
  try {
    await guard();
    return NextResponse.json(
      { event: await createMatchEvent(await request.json()) },
      { status: 201 },
    );
  } catch (e) {
    return error(e);
  }
}
export async function PATCH(request: Request) {
  try {
    await guard();
    const body = await request.json();
    return NextResponse.json({ event: await updateMatchEvent(body.eventId, body) });
  } catch (e) {
    return error(e);
  }
}
export async function DELETE(request: Request) {
  try {
    await guard();
    const id = new URL(request.url).searchParams.get("eventId") ?? "";
    return NextResponse.json({ event: await deleteMatchEvent(id) });
  } catch (e) {
    return error(e);
  }
}
