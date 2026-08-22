"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Logo } from "@/shared/components/common/Logo/Logo";

import styles from "./AppTopNav.module.css";

export type AppTopNavProps = {
  userInitials: string;
};

export function AppTopNav({ userInitials }: AppTopNavProps) {
  const pathname = usePathname();
  const notificationsHref = pathname === "/dashboard" ? "#news-title" : "/dashboard#news-title";

  return (
    <header className={styles.nav}>
      <Logo />
      <div className={styles.actions}>
        <Link
          aria-label="Visualizza aggiornamenti"
          className={styles.notificationLink}
          href={notificationsHref}
        >
          <Bell aria-hidden="true" size={21} strokeWidth={2} />
        </Link>
        <Link className={styles.avatar} href="/profile" aria-label="Apri il tuo profilo">
          {userInitials}
        </Link>
      </div>
    </header>
  );
}
