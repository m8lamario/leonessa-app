import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";
import { PublicProfileView } from "@/features/profile/components/public-profile";
import { formatUserName } from "@/features/profile/lib/identity";
import {
  buildProfileComparison,
  getFollowState,
  getUserShowcase,
} from "@/features/profile/server";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const profile = await getUserShowcase(userId);
  return {
    title: profile ? `${profile.name} | Leonessa` : "Profilo | Leonessa",
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const viewer = await requireUserForPage();
  if (!isOnboardingComplete(viewer)) {
    redirect("/onboarding");
  }

  const { userId } = await params;
  const [profile, yours] = await Promise.all([
    getUserShowcase(userId),
    getUserShowcase(viewer.id),
  ]);

  if (!profile) {
    notFound();
  }

  const follow = await getFollowState(viewer.id, profile.id);

  const isOwnProfile = viewer.id === profile.id;
  const comparison =
    !isOwnProfile && yours ? buildProfileComparison(yours, profile) : null;

  return (
    <PublicProfileView
      comparison={comparison}
      follow={follow}
      isOwnProfile={isOwnProfile}
      profile={profile}
      viewerName={formatUserName(viewer)}
    />
  );
}
