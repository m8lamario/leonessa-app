"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChartNoAxesColumn, Clock, Gift, Handshake, Trophy, Users } from "lucide-react";

import { formatLeagueRange, formatPoints, formatRemaining } from "@/features/leagues/lib/format";
import type { LeagueCard } from "@/features/leagues/types/leagues";
import { EmptyState } from "@/shared/components";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import styles from "../ranking.module.css";

function SponsorMark({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <span className={styles.sponsorMark}>
        <Image alt="" height={36} src={src} unoptimized width={36} />
      </span>
    );
  }

  return (
    <span className={styles.sponsorMark} aria-hidden="true">
      <Handshake size={16} strokeWidth={2.2} />
      <span className={styles.visuallyHidden}>{name}</span>
    </span>
  );
}

function statusLabel(status: LeagueCard["displayStatus"]) {
  if (status === "live") return "In corso";
  if (status === "upcoming") return "In arrivo";
  return "Terminata";
}

export function LeagueCards({ leagues }: { leagues: LeagueCard[] }) {
  const router = useRouter();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function join(leagueId: string) {
    setJoiningId(leagueId);
    setMessage(null);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/join`, { method: "POST" });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? "Iscrizione non riuscita.");
      }
      void hapticSuccess();
      router.refresh();
    } catch (error) {
      void hapticError();
      setMessage(error instanceof Error ? error.message : "Iscrizione non riuscita.");
    } finally {
      setJoiningId(null);
    }
  }

  if (leagues.length === 0) {
    return (
      <EmptyState
        message="Le competizioni sponsor compariranno qui quando un partner pubblicherà una lega."
        title="Nessuna lega attiva"
      />
    );
  }

  return (
    <div className={styles.leagueStack}>
      {message ? <p className={styles.inlineError}>{message}</p> : null}
      {leagues.map((league) => (
        <article className={styles.leagueCard} key={league.id}>
          <header className={styles.leagueHead}>
            <SponsorMark name={league.sponsorName} src={league.imageUrl} />
            <div className={styles.entryCopy}>
              <small>{league.sponsorName}</small>
              <strong>{league.name}</strong>
            </div>
            <span className={styles.status}>{statusLabel(league.displayStatus)}</span>
          </header>

          {league.joined ? (
            <dl className={styles.leagueMeta}>
              <div>
                <dt>
                  <Trophy aria-hidden="true" size={13} />
                  Posizione
                </dt>
                <dd>#{league.rank ?? "—"}</dd>
              </div>
              <div>
                <dt>
                  <ChartNoAxesColumn aria-hidden="true" size={13} />
                  Punteggio
                </dt>
                <dd>{formatPoints(league.score ?? 0)}</dd>
              </div>
              <div>
                <dt>
                  <Clock aria-hidden="true" size={13} />
                  Tempo
                </dt>
                <dd>{formatRemaining(league.remainingMs, league.displayStatus === "ended")}</dd>
              </div>
            </dl>
          ) : (
            <dl className={styles.leagueMeta}>
              <div>
                <dt>
                  <Gift aria-hidden="true" size={13} />
                  Premio
                </dt>
                <dd>{league.prizeTitle}</dd>
              </div>
              <div>
                <dt>
                  <Clock aria-hidden="true" size={13} />
                  Durata
                </dt>
                <dd>{formatLeagueRange(league.startAt, league.endAt)}</dd>
              </div>
              <div>
                <dt>
                  <Users aria-hidden="true" size={13} />
                  Iscritti
                </dt>
                <dd>{league.participantCount}</dd>
              </div>
            </dl>
          )}

          {league.joined ? (
            <Link className={styles.primaryAction} href={`/ranking/leghe/${league.id}` as Route}>
              Vedi classifica
            </Link>
          ) : (
            <button
              className={styles.primaryAction}
              disabled={!league.canJoin || joiningId === league.id}
              onClick={() => void join(league.id)}
              type="button"
            >
              {joiningId === league.id ? "Iscrizione..." : "Partecipa"}
            </button>
          )}
          {!league.joined && league.joinBlockedReason ? (
            <p className={styles.cardHint}>{league.joinBlockedReason}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
