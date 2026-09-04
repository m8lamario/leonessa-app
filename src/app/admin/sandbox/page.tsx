import { notFound, redirect } from "next/navigation";

import { isOnboardingComplete, requireAnyRoleForPage } from "@/features/auth/server/guards";
import { isSandboxMode } from "@/lib/sandbox";
import { SandboxPanel } from "@/features/sandbox";

export const dynamic = "force-dynamic";

export default async function AdminSandboxPage() {
  if (!isSandboxMode()) {
    notFound();
  }

  const user = await requireAnyRoleForPage(["ADMIN", "ORGANIZER"]);
  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  return <SandboxPanel />;
}
