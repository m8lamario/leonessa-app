"use client";

import { Handshake } from "lucide-react";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import { HubSubheader } from "./hub-subheader";

export function PartnerPage() {
  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Vantaggi"
        lead="Partner Leonessa, offerte, omaggi e condizioni di utilizzo."
        title="Partner & Vantaggi"
      />
      <div className={styles.content}>
        <article className={styles.infoCard}>
          <span className={styles.destinationIcon} aria-hidden="true">
            <Handshake size={18} />
          </span>
          <h2>Cosa vedrai</h2>
          <p className={styles.emptyCopy}>
            Ogni partner potrà mostrare logo, descrizione, offerta, eventuale sconto o omaggio e le
            relative condizioni. Nessuna offerta è attiva in questo momento.
          </p>
          <div className={styles.rewardMeta}>
            <span className={styles.metaChip}>Sconto</span>
            <span className={styles.metaChip}>Omaggio</span>
            <span className={styles.metaChip}>Coupon</span>
          </div>
        </article>

        <EmptyState
          title="Nessun partner disponibile"
          message="I vantaggi dei partner compariranno qui quando saranno pubblicati."
        />
      </div>
    </PageContainer>
  );
}
