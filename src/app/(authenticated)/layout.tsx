import { requireUserForPage } from "@/features/auth/server/guards";
import { ReferralDeviceBootstrap } from "@/features/referral/components/referral-device-bootstrap";
import { getUserLPProfile } from "@/features/rewards/server";
import { AppTopNav, BottomNavigation, ScreenLayout } from "@/shared/components";

import styles from "./authenticated-layout.module.css";

function buildUserInitials(name?: string | null, surname?: string | null) {
  return (
    [name, surname]
      .filter(Boolean)
      .map((value) => value?.slice(0, 1).toUpperCase())
      .join("") || "LC"
  );
}

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUserForPage();
  const lpProfile = await getUserLPProfile(user.id);

  return (
    <ScreenLayout>
      <ReferralDeviceBootstrap />
      <AppTopNav
        lpBalance={lpProfile.balance}
        userInitials={buildUserInitials(user.name, user.surname)}
      />
      <div className={styles.content}>{children}</div>
      <BottomNavigation />
    </ScreenLayout>
  );
}
