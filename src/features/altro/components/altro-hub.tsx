"use client";

import Link from "next/link";
import { m } from "framer-motion";
import {
  ChevronRight,
  CircleHelp,
  Compass,
  FileText,
  Gift,
  Handshake,
  Info,
  LifeBuoy,
  Mail,
  QrCode,
  Target,
  UserPlus,
  UserRoundSearch,
} from "lucide-react";
import type { Route } from "next";

import { PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import type { HubData } from "../types";

type AltroHubProps = {
  data: HubData;
};

const reveal = { duration: 0.24, ease: "easeOut" as const };

const featured = [
  {
    href: "/altro/esplora" as Route,
    title: "Esplora",
    description: "Scuole, squadre, partite e classifiche.",
    icon: Compass,
  },
  {
    href: "/altro/esplora?categoria=persone" as Route,
    title: "Trova amici",
    description: "Cerca persone nella Leonessa e apri i profili.",
    icon: UserRoundSearch,
  },
];

const playLinks = [
  {
    href: "/altro/missioni" as Route,
    title: "Missioni",
    description: "Obiettivi attivi e ricompense.",
    icon: Target,
  },
  {
    href: "/altro/accrediti" as Route,
    title: "Accrediti",
    description: "Scansiona il QR e ricevi LP.",
    icon: QrCode,
  },
  {
    href: "/altro/referral" as Route,
    title: "Porta un amico",
    description: "Invita amici e segui i tuoi inviti.",
    icon: UserPlus,
  },
];

const benefitLinks = [
  {
    href: "/altro/premi" as Route,
    title: "Premi",
    description: "Merch, omaggi e vantaggi.",
    icon: Gift,
  },
  {
    href: "/altro/partner" as Route,
    title: "Partner",
    description: "Sconti e offerte Leonessa.",
    icon: Handshake,
  },
];

const supportLinks = [
  {
    href: "/altro/regolamento" as Route,
    title: "Regolamento",
    description: "Come funziona la Cup",
    icon: FileText,
  },
  {
    href: "/altro/faq" as Route,
    title: "FAQ",
    description: "Domande frequenti",
    icon: CircleHelp,
  },
  {
    href: "/altro/assistenza" as Route,
    title: "Assistenza",
    description: "Aiuto e segnalazioni",
    icon: LifeBuoy,
  },
  {
    href: "/altro/contatti" as Route,
    title: "Contatti",
    description: "Parla con Leonessa",
    icon: Mail,
  },
  {
    href: "/altro/info" as Route,
    title: "Informazioni",
    description: "Chi siamo",
    icon: Info,
  },
];

export function AltroHub({ data }: AltroHubProps) {
  return (
    <PageContainer className={styles.page}>
      <div className={styles.content}>
        <m.section
          aria-labelledby="discover-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.04 }}
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Persone e Cup</p>
              <h2 id="discover-title">Esplora la Leonessa</h2>
            </div>
          </div>
          <div className={styles.grid}>
            {featured.map((item) => {
              const Icon = item.icon;
              return (
                <Link className={`${styles.destination} ${styles.featuredDestination}`} href={item.href} key={item.href}>
                  <span className={styles.destinationIcon}>
                    <Icon aria-hidden="true" size={18} strokeWidth={2} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </Link>
              );
            })}
          </div>
        </m.section>

        <m.section
          aria-labelledby="play-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.08 }}
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Gioca</p>
              <h2 id="play-title">Guadagna LP</h2>
            </div>
          </div>
          <div className={styles.supportList}>
            {playLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link className={styles.supportItem} href={item.href} key={item.href}>
                  <span className={styles.supportIcon}>
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className={styles.supportCopy}>
                    <strong>{item.title}</strong>
                    <p>
                      {item.href === "/altro/referral" && data.referral.total > 0
                        ? data.referral.completed > 0
                          ? `${data.referral.completed} inviti completati`
                          : `${data.referral.pending} inviti in attesa`
                        : item.description}
                    </p>
                  </span>
                  <ChevronRight aria-hidden="true" className={styles.chevron} size={18} />
                </Link>
              );
            })}
          </div>
        </m.section>

        <section aria-labelledby="benefits-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Vantaggi</p>
              <h2 id="benefits-title">Premi e partner</h2>
            </div>
          </div>
          <div className={styles.supportList}>
            {benefitLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link className={styles.supportItem} href={item.href} key={item.href}>
                  <span className={styles.supportIcon}>
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className={styles.supportCopy}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </span>
                  <ChevronRight aria-hidden="true" className={styles.chevron} size={18} />
                </Link>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="support-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Supporto</p>
              <h2 id="support-title">Informazioni</h2>
            </div>
          </div>
          <div className={styles.supportList}>
            {supportLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link className={styles.supportItem} href={item.href} key={item.href}>
                  <span className={styles.supportIcon}>
                    <Icon aria-hidden="true" size={18} />
                  </span>
                  <span className={styles.supportCopy}>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </span>
                  <ChevronRight aria-hidden="true" className={styles.chevron} size={18} />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
