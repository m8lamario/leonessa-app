"use client";

import { Gift } from "lucide-react";

import { PageContainer } from "@/shared/components";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";
import type { LeagueBoardData } from "@/features/leagues/types/leagues";

import { UserLeaderboard } from "./leaderboard";
import { RankingSubheader } from "./ranking-subheader";
import { LeagueCards } from "./league-cards";
import styles from "../ranking.module.css";

export function LeagueBoard({ data }: { data: LeagueBoardData }) {
  const prizeCopy = data.league.awardedPositions > 1
    ? `Prime ${data.league.awardedPositions} posizioni`
    : "1° posto";

  return (
    <PageContainer className={`${styles.ranking} ${skeletonStyles.fadeIn}`}>
      <RankingSubheader
        kicker={data.league.sponsorName}
        lead={data.league.description ?? undefined}
        title={data.league.name}
      />
      <section className={styles.panel} aria-label="Classifica lega">
        <div className={styles.boardPrize}>
          <strong>
            <Gift aria-hidden="true" size={14} /> {data.league.prizeTitle}
          </strong>
          <p className={styles.heroLead}>
            {prizeCopy}
            {data.league.prizeDescription ? ` · ${data.league.prizeDescription}` : ""}
            {data.league.conditionsText ? ` · ${data.league.conditionsText}` : ""}
          </p>
        </div>
        {data.entries.length > 0 ? (
          <UserLeaderboard
            currentUser={data.currentUser}
            entries={data.entries}
            pointsKey="score"
            pointsSuffix="pt"
          />
        ) : (
          <p className={styles.heroLead}>Nessun iscritto al momento.</p>
        )}
      </section>
      {!data.league.joined ? (
        <LeagueCards leagues={[data.league]} />
      ) : null}
    </PageContainer>
  );
}
