"use client";

import { useEffect, useState } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { Skeleton, SkeletonAvatar } from "@/shared/components/skeleton";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";

import styles from "../../auth/auth.module.css";

type ProfileDashboardProps = {
  email: string;
  name: string;
  role: string;
};

const MOCK_LOADING_DELAY = 400;

function ProfileSkeleton() {
  return (
    <main aria-busy="true" className={styles.page}>
      <section className={styles.profileContent}>
        <div className={styles.profilePanel}>
          <SkeletonAvatar size="4.5rem" />
          <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
            <Skeleton height="0.8rem" width="38%" />
            <Skeleton height="2.2rem" width="76%" />
            <Skeleton height="0.9rem" width="58%" />
            <Skeleton height="0.9rem" width="42%" />
          </div>
        </div>
        <Skeleton height="3rem" variant="card" width="100%" />
      </section>
    </main>
  );
}

export function ProfileDashboard({ email, name, role }: ProfileDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsLoading(false), MOCK_LOADING_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <main className={`${styles.page} ${skeletonStyles.fadeIn}`}>
      <section className={styles.profileContent}>
        <div className={styles.profilePanel}>
          <p className={styles.eyebrow}>Profilo Leonessa</p>
          <h1>{name}</h1>
          <p>{email}</p>
          <p className={styles.role}>Ruolo: {role}</p>
        </div>
        <LogoutButton />
      </section>
    </main>
  );
}
