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
  Medal,
  QrCode,
  Sparkles,
  Target,
} from "lucide-react";
import type { Route } from "next";

import { PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import type { HubData, HubDestinationId } from "../types";
import { HubProgress } from "./hub-progress";

type AltroHubProps = {
  data: HubData;
};

const reveal = { duration: 0.24, ease: "easeOut" as const };

const destinations: Array<{
  id: HubDestinationId;
  href: Route;
  title: string;
  description: string;
  icon: typeof QrCode;
}> = [
  {
    id: "accrediti",
    href: "/altro/accrediti" as Route,
    title: "Accrediti",
    description: "Scansiona il QR e ricevi LP.",
    icon: QrCode,
  },
  {
    id: "premi",
    href: "/altro/premi" as Route,
    title: "Premi",
    description: "Merch, omaggi e vantaggi.",
    icon: Gift,
  },
  {
    id: "partner",
    href: "/altro/partner" as Route,
    title: "Partner",
    description: "Sconti e offerte Leonessa.",
    icon: Handshake,
  },
  {
    id: "missioni",
    href: "/altro/missioni" as Route,
    title: "Missioni",
    description: "Obiettivi attivi e ricompense.",
    icon: Target,
  },
  {
    id: "badge",
    href: "/altro/badge" as Route,
    title: "Badge",
    description: "Collezione e trofei.",
    icon: Medal,
  },
  {
    id: "esplora",
    href: "/altro/esplora" as Route,
    title: "Esplora",
    description: "Scuole, squadre e partite.",
    icon: Compass,
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

function formatLp(value: number) {
  return value.toLocaleString("it-IT");
}

export function AltroHub({ data }: AltroHubProps) {
  const { pass } = data;
  const remainingLp =
    pass.nextLevelLP === null ? null : Math.max(0, pass.nextLevelLP - pass.lp);

  return (
    <PageContainer className={styles.page}>
      <m.header
        className={styles.hero}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reveal}
      >
        <p className={styles.kicker}>Leonessa</p>
        <h1>Altro</h1>
        <p className={styles.heroLead}>
          Pass, accrediti, premi e tutto ciò che ruota intorno alla tua esperienza Leonessa.
        </p>
      </m.header>

      <div className={styles.content}>
        <m.section
          aria-labelledby="pass-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.06 }}
        >
          <article className={styles.pass}>
            <div className={styles.passTopline}>
              <p className={styles.kicker} id="pass-title">
                Leonessa Pass
              </p>
              <Sparkles aria-hidden="true" size={18} />
            </div>
            <div className={styles.passStats}>
              <div>
                <span className={styles.statLabel}>LP disponibili</span>
                <strong className={styles.lpValue}>{formatLp(pass.lp)}</strong>
              </div>
              <div>
                <span className={styles.statLabel}>Livello</span>
                <strong className={styles.levelValue}>{pass.level}</strong>
              </div>
            </div>
            <HubProgress
              label="Progresso verso il prossimo livello"
              percent={pass.progressPercent}
              currentLabel={
                pass.isMaxLevel
                  ? "Livello massimo"
                  : `${formatLp(pass.progressLP)} LP in questo livello`
              }
              remainingLabel={
                remainingLp === null ? undefined : `${formatLp(remainingLp)} LP al prossimo`
              }
            />
            <div className={styles.passMeta}>
              <span className={styles.chip}>
                <Medal aria-hidden="true" size={14} />
                {pass.badgeCount} badge
              </span>
              {pass.featuredBadges.map((badge) => (
                <span className={styles.chip} key={badge.id}>
                  {badge.name}
                </span>
              ))}
            </div>
            <p className={styles.perkLine}>Nessun vantaggio attivo al momento.</p>
          </article>
        </m.section>

        <m.section
          aria-labelledby="hub-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.12 }}
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Servizi</p>
              <h2 id="hub-title">Scopri</h2>
            </div>
          </div>
          <div className={styles.grid}>
            {destinations.map((destination) => {
              const Icon = destination.icon;
              return (
                <Link className={styles.destination} href={destination.href} key={destination.id}>
                  <span className={styles.destinationIcon}>
                    <Icon aria-hidden="true" size={18} strokeWidth={2} />
                  </span>
                  <h3>{destination.title}</h3>
                  <p>{destination.description}</p>
                </Link>
              );
            })}
          </div>
        </m.section>

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
