"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import { HubSubheader } from "./hub-subheader";

export function AccreditiPage() {
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Leonessa Pass"
        lead="Scansiona il QR del tuo biglietto o accredito per ricevere LP e registrare la partecipazione."
        title="Accrediti"
      />
      <div className={styles.content}>
        <article className={styles.scanCard}>
          <p className={styles.kicker}>Scanner</p>
          <h2>Scansiona il QR</h2>
          <p className={styles.emptyCopy}>
            Quando lo scanner sarà collegato potrai inquadrare il QR del biglietto e accreditare i
            Leonessa Point.
          </p>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() =>
              setScanMessage("Lo scanner QR sarà disponibile a breve. Nessun accredito è stato registrato.")
            }
          >
            <QrCode aria-hidden="true" size={18} />
            Scansiona QR
          </button>
          {scanMessage ? <p className={styles.scanHint}>{scanMessage}</p> : null}
        </article>

        <section aria-labelledby="used-credits-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Storico</p>
              <h2 id="used-credits-title">Accrediti utilizzati</h2>
            </div>
          </div>
          <EmptyState
            title="Nessun accredito utilizzato"
            message="Gli accrediti già scansionati compariranno qui."
          />
        </section>
      </div>
    </PageContainer>
  );
}
