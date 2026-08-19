import { NextResponse } from "next/server";

import { simulateMatchday } from "@/features/sandbox/server/sandbox-service";
import { guardAdminSandbox } from "../sandbox-guard";

export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await guardAdminSandbox();
  if (denied) return denied;

  try {
    return NextResponse.json({ result: await simulateMatchday() });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
