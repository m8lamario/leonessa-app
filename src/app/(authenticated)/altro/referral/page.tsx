import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import { ReferralPage } from "@/features/referral/components/referral-page";
import { getReferralDashboard } from "@/features/referral/server/referral-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Porta un amico | Leonessa",
};

export default async function AltroReferralPage() {
  const user = await requireUser();
  if (!isOnboardingComplete(user)) redirect("/onboarding");

  const data = await getReferralDashboard(user.id);
  return <ReferralPage data={data} />;
}
