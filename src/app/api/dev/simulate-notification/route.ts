import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { simulateNotification } from "@/features/sandbox/server/sandbox-service";
import { guardAdminSandbox } from "../sandbox-guard";

export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await guardAdminSandbox();
  if (denied) return denied;

  try {
    const user = await requireUser();
    return NextResponse.json({ result: await simulateNotification(user.id) });
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
