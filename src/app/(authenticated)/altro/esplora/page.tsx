import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EsploraPage } from "@/features/altro";
import { isExploreCategory } from "@/features/altro/lib/explore-filters";
import { getExploreData } from "@/features/altro/server";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Esplora | Leonessa",
};

type AltroEsploraPageProps = {
  searchParams: Promise<{ categoria?: string }>;
};

export default async function AltroEsploraPage({ searchParams }: AltroEsploraPageProps) {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  const [{ categoria }, data] = await Promise.all([
    searchParams,
    getExploreData(user.id, user.schoolId),
  ]);

  return (
    <EsploraPage
      data={data}
      initialCategory={isExploreCategory(categoria) ? categoria : null}
    />
  );
}
