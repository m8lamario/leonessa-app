import { redirect } from "next/navigation";

import { getAuthSession } from "@/features/auth/server/guards";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getAuthSession();

  redirect(session?.user?.id ? "/dashboard" : "/login");
}
