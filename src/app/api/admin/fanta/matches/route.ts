import { NextResponse } from "next/server";
import { requireRole } from "@/features/auth/server/guards";
import { getSandboxMatches } from "@/features/fanta/server";
export const dynamic = "force-dynamic";
export async function GET() {
  await requireRole("ADMIN");
  return NextResponse.json({ matches: await getSandboxMatches() });
}
