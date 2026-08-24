"use client";

import { Gift } from "lucide-react";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import { HubSubheader } from "./hub-subheader";

export function PremiPage() {
  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Leonessa Pass"
        lead="Qui troverai merch, omaggi, esperienze e vantaggi riscattabili con i tuoi LP."
        title="Premi"
      />
      <div className={styles.content}>
        <article className={styles.infoCard}>
          <span className={styles.destinationIcon} aria-hidden="true">
            <Gift size={18} />
          </span>
          <h2>Come funzionano</h2>
          <p className={styles.emptyCopy}>
            Ogni premio indicherà il costo in LP, la disponibilità e se è ottenibile con il saldo
            attuale. Il riscatto verrà attivato quando il catalogo sarà collegato.
          </p>
          <div className={styles.rewardMeta}>
            <span className={styles.metaChip}>Costo LP</span>
            <span className={styles.metaChip}>Disponibilità</span>
            <span className={styles.metaChip}>Ottenibile</span>
          </div>
        </article>

        <EmptyState
          title="Nessun premio disponibile"
          message="Il catalogo premi non è ancora stato pubblicato."
        />
      </div>
    </PageContainer>
  );
}
