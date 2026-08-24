import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AltroHub } from "@/features/altro";
import { getHubData } from "@/features/altro/server";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Altro | Leonessa",
};

export default async function AltroPage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const data = await getHubData(user.id, user.schoolId);

  return <AltroHub data={data} />;
}
