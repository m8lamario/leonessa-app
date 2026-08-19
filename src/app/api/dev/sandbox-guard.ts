import { NextResponse } from "next/server";

import { requireAnyRole } from "@/features/auth/server/guards";
import { isSandboxMode } from "@/lib/sandbox";

export async function guardAdminSandbox() {
  if (!isSandboxMode()) {
    return NextResponse.json(
      { message: "Sandbox mode is disabled. Set APP_SANDBOX_MODE=true." },
      { status: 403 },
    );
  }

  try {
    await requireAnyRole(["ADMIN", "ORGANIZER"]);
    return null;
  } catch {
    return NextResponse.json({ message: "Permessi insufficienti." }, { status: 403 });
  }
}
