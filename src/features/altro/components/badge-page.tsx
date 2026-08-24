"use client";

import { Lock, Medal } from "lucide-react";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import type { HubBadge } from "../types";
import { HubSubheader } from "./hub-subheader";

type BadgePageProps = {
  earned: HubBadge[];
  locked: HubBadge[];
};

function BadgeCard({ badge, earned = false }: { badge: HubBadge; earned?: boolean }) {
  return (
    <article className={`${styles.badgeCard} ${earned ? "" : styles.locked}`}>
      <span className={earned ? styles.badgeIcon : styles.badgeIconLocked} aria-hidden="true">
        {earned ? <Medal size={20} /> : <Lock size={18} />}
      </span>
      <div>
        <div className={styles.cardTopline}>
          <span className={styles.status}>{earned ? "Ottenuto" : "Bloccato"}</span>
          {earned && badge.earnedAt ? <small className={styles.meta}>{badge.earnedAt}</small> : null}
        </div>
        <h3>{badge.name}</h3>
        <p>{badge.description}</p>
      </div>
    </article>
  );
}

export function BadgePage({ earned, locked }: BadgePageProps) {
  const isEmpty = earned.length === 0 && locked.length === 0;

  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Collezione"
        lead="I badge del tuo account, distinti tra ottenuti e ancora da sbloccare."
        title="Badge & Trofei"
      />
      <div className={styles.content}>
        {isEmpty ? (
          <EmptyState
            title="Nessun badge disponibile"
            message="La collezione apparirà qui quando i badge saranno pubblicati."
          />
        ) : (
          <>
            <section aria-labelledby="earned-badges-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.kicker}>Ottenuti</p>
                  <h2 id="earned-badges-title">In bacheca</h2>
                </div>
              </div>
              {earned.length === 0 ? (
                <EmptyState
                  title="Nessun badge ottenuto"
                  message="I badge sbloccati compariranno in questa sezione."
                />
              ) : (
                <div className={styles.cardList}>
                  {earned.map((badge) => (
                    <BadgeCard earned badge={badge} key={badge.id} />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="locked-badges-title">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.kicker}>Da sbloccare</p>
                  <h2 id="locked-badges-title">Bloccati</h2>
                </div>
              </div>
              {locked.length === 0 ? (
                <EmptyState title="Tutto sbloccato" message="Hai ottenuto tutti i badge disponibili." />
              ) : (
                <div className={styles.cardList}>
                  {locked.map((badge) => (
                    <BadgeCard badge={badge} key={badge.id} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
