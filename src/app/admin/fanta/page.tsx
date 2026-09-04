import { notFound, redirect } from "next/navigation";
import { requireRoleForPage } from "@/features/auth/server/guards";
import { getControlOverview } from "@/features/fanta/server";
import { isSandboxMode } from "@/lib/sandbox";
import { FantaControlCenter } from "@/features/fanta/components";

export const dynamic = "force-dynamic";

export default async function FantaControlCenterPage() {
  if (!isSandboxMode()) notFound();
  const user = await requireRoleForPage("ADMIN");
  if (!user) redirect("/login");
  return <FantaControlCenter initialData={await getControlOverview()} />;
}
