import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PartnerPage } from "@/features/altro";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partner | Leonessa",
};

export default async function AltroPartnerPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return <PartnerPage />;
}
