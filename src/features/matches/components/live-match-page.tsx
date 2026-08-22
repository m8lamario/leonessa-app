"use client";

import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";

import { PageContainer } from "@/shared/components";
import type { LiveMatchView } from "../server/live-service";
import styles from "./live-match-page.module.css";

const statusLabel: Record<LiveMatchView["status"], string> = {
  SCHEDULED: "In programma",
  LIVE: "LIVE",
  FINISHED: "Terminata",
  CANCELLED: "Cancellata",
};

export function LiveMatchPage({ match }: { match: LiveMatchView }) {
  const isLive = match.status === "LIVE";

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/dashboard">
          <ArrowLeft size={18} aria-hidden="true" /> Dashboard
        </Link>
        <span className={isLive ? styles.liveBadge : styles.statusBadge}>
          {isLive && <Radio size={14} aria-hidden="true" />}
          {statusLabel[match.status]}
        </span>
      </header>

      <section className={styles.scoreboard} aria-label="Risultato">
        <div className={styles.team}>
          <strong>{match.homeTeam}</strong>
          <b>{match.homeScore}</b>
        </div>
        <span className={styles.vs}>–</span>
        <div className={styles.team}>
          <strong>{match.awayTeam}</strong>
          <b>{match.awayScore}</b>
        </div>
      </section>

      <dl className={styles.meta}>
        <div>
          <dt>Quando</dt>
          <dd>{match.schedule}</dd>
        </div>
        <div>
          <dt>Dove</dt>
          <dd>{match.venue}</dd>
        </div>
      </dl>

      <section className={styles.events} aria-labelledby="events-title">
        <h2 id="events-title">Cronaca</h2>
        {match.events.length === 0 ? (
          <p className={styles.empty}>Nessun evento ancora.</p>
        ) : (
          <ul>
            {match.events.map((event) => (
              <li key={event.id}>
                <span>{event.minute}&apos;</span>
                <strong>{event.type.replaceAll("_", " ")}</strong>
                {event.playerName ? <em>{event.playerName}</em> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
