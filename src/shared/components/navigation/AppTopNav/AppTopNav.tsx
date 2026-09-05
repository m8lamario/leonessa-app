import { Coins } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

import { Logo } from "@/shared/components/common/Logo/Logo";

import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";
import styles from "./AppTopNav.module.css";

export type AppTopNavProps = {
  userId: string;
  userInitials: string;
  lpBalance: number;
  unreadCount: number;
};

function formatLp(value: number) {
  return value.toLocaleString("it-IT");
}

export function AppTopNav({ userId, userInitials, lpBalance, unreadCount }: AppTopNavProps) {
  const formattedLp = formatLp(lpBalance);

  return (
    <header className={styles.nav}>
      <Logo />
      <div className={styles.actions}>
        <Link
          aria-label={`Saldo ${formattedLp} LP`}
          className={styles.lpBalance}
          href={"/altro/premi" as Route}
        >
          <Coins aria-hidden="true" size={16} strokeWidth={2} />
          <span className={styles.lpAmount}>{formattedLp}</span>
          <span className={styles.lpUnit}>LP</span>
        </Link>
        <NotificationBell initialUnreadCount={unreadCount} />
        <AccountMenu userId={userId} userInitials={userInitials} />
      </div>
    </header>
  );
}
