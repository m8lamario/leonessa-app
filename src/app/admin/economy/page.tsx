import { redirect } from "next/navigation";
import { requireRoleForPage } from "@/features/auth/server/guards";
import { getAllRewardConfigs, getRewardsCatalog, getAllRedemptions } from "@/features/rewards/server";
import { prisma } from "@/lib/prisma";
import { EconomyControlCenter } from "@/features/economy";

export const dynamic = "force-dynamic";

export default async function EconomyControlCenterPage() {
  const user = await requireRoleForPage("ADMIN");
  if (!user) redirect("/login");

  const [configs, history, rewards, redemptions] = await Promise.all([
    getAllRewardConfigs(),
    prisma.economyConfigHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: {
          select: { name: true, surname: true, email: true },
        },
        config: {
          select: { key: true, title: true },
        },
      },
    }),
    getRewardsCatalog({ includeInactive: true }),
    getAllRedemptions({ limit: 50 }),
  ]);

  const serializedHistory = history.map((h) => ({
    ...h,
    createdAt: h.createdAt.toISOString(),
  }));

  const serializedRedemptions = redemptions.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <EconomyControlCenter
      initialData={{
        configs,
        history: serializedHistory,
        rewards,
        redemptions: serializedRedemptions,
      }}
    />
  );
}
