"use client";

import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { PageContainer } from "@/shared/components";
import { selection as hapticSelection } from "@/shared/lib/haptics";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";
import type { RankingData, SchoolRankingEntry, UserRankingEntry } from "../types/ranking";
import styles from "../ranking.module.css";

type LeaderboardTab = "users" | "schools";

type RankingDashboardProps = {
  initialData: RankingData;
};

function formatPoints(points: number) {
  return points.toLocaleString("it-IT");
}

function UserLeaderboard({
  entries,
  currentUser,
}: {
  entries: UserRankingEntry[];
  currentUser: UserRankingEntry;
}) {
  return (
    <>
      <ol className={styles.leaderboardList}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link className={styles.leaderboardRow} href={`/u/${entry.id}` as Route}>
              <span className={styles.rank}>{entry.rank}</span>
              <span className={styles.avatar} aria-hidden="true">
                {entry.initials}
              </span>
              <span className={styles.entryCopy}>
                <strong>{entry.name}</strong>
                <small>
                  {entry.school} · Livello {entry.level}
                </small>
              </span>
              <strong className={styles.points}>{formatPoints(entry.lp)} LP</strong>
            </Link>
          </li>
        ))}
      </ol>
      <aside className={styles.personalRank} aria-label="La tua posizione">
        <p>La tua posizione</p>
        <div>
          <strong>#{currentUser.rank}</strong>
          <span>
            Livello {currentUser.level} · {formatPoints(currentUser.lp)} LP
          </span>
        </div>
      </aside>
    </>
  );
}

function SchoolLeaderboard({
  entries,
  currentSchool,
}: {
  entries: SchoolRankingEntry[];
  currentSchool: SchoolRankingEntry;
}) {
  return (
    <>
      <ol className={styles.leaderboardList}>
        {entries.map((entry) => (
          <li className={entry.isCurrentSchool ? styles.currentEntry : undefined} key={entry.id}>
            <span className={styles.rank}>{entry.rank}</span>
            <span className={styles.schoolMark} aria-hidden="true">
              {entry.shortName.slice(0, 1)}
            </span>
            <span className={styles.entryCopy}>
              <strong>{entry.name}</strong>
              <small>{entry.shortName}</small>
            </span>
            <strong className={styles.points}>{formatPoints(entry.ssp)} SSP</strong>
          </li>
        ))}
      </ol>
      <aside className={styles.personalRank} aria-label="La tua scuola">
        <p>La tua scuola</p>
        <div>
          <strong>#{currentSchool.rank}</strong>
          <span>
            {currentSchool.name} · {formatPoints(currentSchool.ssp)} SSP
          </span>
        </div>
      </aside>
    </>
  );
}

export function RankingDashboard({ initialData }: RankingDashboardProps) {
  const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardTab>("users");
  const ranking = initialData;

  return (
    <PageContainer className={`${styles.ranking} ${skeletonStyles.fadeIn}`}>
      <header className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>Competizione</p>
          <h1>Ranking</h1>
        </div>
      </header>

      <section className={styles.panel} aria-label="Classifiche">
        <div className={styles.segmentedControl} aria-label="Tipo classifica">
          <button
            aria-pressed={activeLeaderboard === "users"}
            className={activeLeaderboard === "users" ? styles.segmentActive : undefined}
            onClick={() => {
              if (activeLeaderboard !== "users") {
                setActiveLeaderboard("users");
                void hapticSelection();
              }
            }}
            type="button"
          >
            Utenti
          </button>
          <button
            aria-pressed={activeLeaderboard === "schools"}
            className={activeLeaderboard === "schools" ? styles.segmentActive : undefined}
            onClick={() => {
              if (activeLeaderboard !== "schools") {
                setActiveLeaderboard("schools");
                void hapticSelection();
              }
            }}
            type="button"
          >
            Scuole
          </button>
        </div>
        <AnimatePresence initial={false} mode="wait">
          <m.div
            key={activeLeaderboard}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeLeaderboard === "users" ? (
              <UserLeaderboard entries={ranking.userRanking} currentUser={ranking.currentUser} />
            ) : (
              <SchoolLeaderboard
                entries={ranking.schoolRanking}
                currentSchool={ranking.currentSchool}
              />
            )}
          </m.div>
        </AnimatePresence>
      </section>
    </PageContainer>
  );
}
