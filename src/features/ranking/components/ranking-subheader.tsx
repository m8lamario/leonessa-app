import Link from "next/link";
import type { Route } from "next";
import { ChevronLeft } from "lucide-react";

import styles from "../ranking.module.css";

type RankingSubheaderProps = {
  title: string;
  kicker?: string;
  lead?: string;
};

export function RankingSubheader({ title, kicker, lead }: RankingSubheaderProps) {
  return (
    <header className={styles.subHero}>
      <Link className={styles.backLink} href={"/ranking?tab=leghe" as Route}>
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.2} />
        Ranking
      </Link>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className={styles.heroLead}>{lead}</p> : null}
    </header>
  );
}
