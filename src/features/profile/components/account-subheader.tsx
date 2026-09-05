import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Route } from "next";

import styles from "../profile.module.css";

type AccountSubheaderProps = {
  title: string;
  kicker?: string;
  lead?: string;
};

export function AccountSubheader({ title, kicker, lead }: AccountSubheaderProps) {
  return (
    <header className={styles.subHero}>
      <Link className={styles.backLink} href={"/profile" as Route}>
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.2} />
        Account
      </Link>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className={styles.heroLead}>{lead}</p> : null}
    </header>
  );
}
