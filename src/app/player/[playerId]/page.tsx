import { notFound } from "next/navigation";

import { getMyPlayerProfile, getPlayerProfile } from "@/features/fanta/server";
import { PlayerProfileView } from "@/features/fanta/components";
import { getAuthSession } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  const profile = await getPlayerProfile(playerId);
  if (!profile) return { title: "Giocatore" };
  return {
    title: `${profile.name} · Leonessa Cup`,
    description: `Profilo di ${profile.name} (${profile.roleLabel}, ${profile.schoolName}). Valore fantasy ${profile.fantasyValue} LP.`,
    openGraph: {
      title: `${profile.name} · Leonessa Cup`,
      description: `${profile.roleLabel} · ${profile.schoolName} · ${profile.fantasyValue} LP`,
    },
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;

  const session = await getAuthSession().catch(() => null);
  const viewerId = session?.user?.id ?? null;

  const [profile, mine] = await Promise.all([
    getPlayerProfile(playerId, viewerId),
    viewerId ? getMyPlayerProfile(viewerId).catch(() => null) : Promise.resolve(null),
  ]);

  if (!profile) {
    notFound();
  }

  return <PlayerProfileView profile={profile} myProfile={mine} />;
}
