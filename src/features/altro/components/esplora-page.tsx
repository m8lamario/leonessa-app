"use client";

import Link from "next/link";
import {
  Building2,
  ChartNoAxesColumn,
  Compass,
  Handshake,
  Trophy,
  Users,
} from "lucide-react";
import type { Route } from "next";

import { PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import type { HubExplore } from "../types";
import { HubSubheader } from "./hub-subheader";

type EsploraPageProps = {
  explore: HubExplore;
};

export function EsploraPage({ explore }: EsploraPageProps) {
  const destinations = [
    {
      href: "/ranking" as Route,
      title: "Scuole",
      description: "Classifica e istituti della Cup.",
      icon: Building2,
    },
    {
      href: (explore.teamId ? `/team/${explore.teamId}` : "/ranking") as Route,
      title: "Squadre",
      description: explore.teamId
        ? "Apri la squadra della tua scuola."
        : "La squadra della tua scuola non è ancora disponibile.",
      icon: Users,
    },
    {
      href: "/fanta" as Route,
      title: "Giocatori",
      description: "Scopri i giocatori nel Fanta.",
      icon: Trophy,
    },
    {
      href: "/dashboard" as Route,
      title: "Partite",
      description: "Calendario e match in evidenza.",
      icon: Compass,
    },
    {
      href: "/ranking" as Route,
      title: "Classifiche",
      description: "Ranking utenti e scuole.",
      icon: ChartNoAxesColumn,
    },
    {
      href: "/altro/partner" as Route,
      title: "Partner",
      description: "Vantaggi e offerte Leonessa.",
      icon: Handshake,
    },
  ];

  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Piattaforma"
        lead="Scorciatoie verso le sezioni già disponibili nell'app."
        title="Esplora"
      />
      <div className={styles.content}>
        <div className={styles.grid}>
          {destinations.map((destination) => {
            const Icon = destination.icon;
            return (
              <Link className={styles.destination} href={destination.href} key={destination.title}>
                <span className={styles.destinationIcon}>
                  <Icon aria-hidden="true" size={18} />
                </span>
                <h3>{destination.title}</h3>
                <p>{destination.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
