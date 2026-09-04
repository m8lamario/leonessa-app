import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccreditiPage } from "@/features/altro";
import { isOnboardingComplete, requireUserForPage } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accrediti | Leonessa",
};

export default async function AltroAccreditiPage() {
  const user = await requireUserForPage();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return <AccreditiPage />;
}
