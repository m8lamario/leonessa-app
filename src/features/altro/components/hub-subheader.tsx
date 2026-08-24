import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Route } from "next";

import styles from "../altro.module.css";

type HubSubheaderProps = {
  title: string;
  kicker?: string;
  lead?: string;
};

export function HubSubheader({ title, kicker, lead }: HubSubheaderProps) {
  return (
    <header className={styles.hero}>
      <Link className={styles.backLink} href={"/altro" as Route}>
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.2} />
        Altro
      </Link>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className={styles.heroLead}>{lead}</p> : null}
    </header>
  );
}
