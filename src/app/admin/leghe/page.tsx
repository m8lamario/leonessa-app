import { redirect } from "next/navigation";

import { requireRoleForPage } from "@/features/auth/server/guards";
import { LeaguesControlCenter } from "@/features/leagues";
import { listAdminLeagues, listPartners } from "@/features/leagues/server";

export const dynamic = "force-dynamic";

export default async function LeaguesControlCenterPage() {
  const user = await requireRoleForPage("ADMIN");
  if (!user) redirect("/login");

  const [partners, leagues] = await Promise.all([listPartners(), listAdminLeagues()]);

  return <LeaguesControlCenter initialLeagues={leagues} initialPartners={partners} />;
}
