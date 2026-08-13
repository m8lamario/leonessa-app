import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { isOnboardingComplete, requireUser } from "@/features/auth/server/guards";
import styles from "@/features/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profilo | Leonessa",
};

export default async function ProfilePage() {
  const user = await requireUser();

  if (!isOnboardingComplete(user)) {
    redirect("/onboarding");
  }

  const primaryRole = user.roles.find((role) => role.isPrimary)?.role ?? "USER";

  return (
    <main className={styles.page}>
      <section className={styles.profileContent}>
        <div className={styles.profilePanel}>
          <p className={styles.eyebrow}>Profilo Leonessa</p>
          <h1>
            {user.name} {user.surname}
          </h1>
          <p>{user.email}</p>
          <p className={styles.role}>Ruolo: {primaryRole}</p>
        </div>
        <LogoutButton />
      </section>
    </main>
  );
}
