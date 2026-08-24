import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PremiPage } from "@/features/altro";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Premi | Leonessa",
};

export default async function AltroPremiPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  return <PremiPage />;
}
