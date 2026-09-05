"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { Medal } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/shared/components";
import { formatPoints } from "@/features/leagues/lib/format";

import type { SchoolRankingEntry } from "../types/ranking";
import styles from "../ranking.module.css";

export function RankAvatar({
  image,
  initials,
  name,
}: {
  image: string | null;
  initials: string;
  name: string;
}) {
  if (image) {
    return (
      <span className={styles.avatar}>
        <Image alt={name} height={40} src={image} unoptimized width={40} />
      </span>
    );
  }

  return (
    <span className={styles.avatar} aria-hidden="true">
      {initials}
    </span>
  );
}

export function SchoolMark({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (logoUrl) {
    return (
      <span className={styles.schoolMark}>
        <Image alt="" height={36} src={logoUrl} unoptimized width={36} />
      </span>
    );
  }

  return (
    <span className={styles.schoolMark} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

function podiumClass(rank: number) {
  if (rank === 1) return `${styles.podiumRow} ${styles.podiumGold}`;
  if (rank === 2) return `${styles.podiumRow} ${styles.podiumSilver}`;
  if (rank === 3) return `${styles.podiumRow} ${styles.podiumBronze}`;
  return styles.leaderboardRow;
}

export function StickyRank({
  label,
  rank,
  detail,
}: {
  label: string;
  rank: number;
  detail: string;
}) {
  return (
    <aside className={styles.stickyRank} aria-label={label}>
      <span className={styles.stickyLabel}>{label}</span>
      <strong>#{rank}</strong>
      <span>{detail}</span>
    </aside>
  );
}

export function RankList({
  podium,
  rest,
}: {
  podium: ReactNode;
  rest: ReactNode;
}) {
  return (
    <>
      {podium ? <ol className={styles.podium}>{podium}</ol> : null}
      {rest ? <ol className={styles.leaderboardList}>{rest}</ol> : null}
    </>
  );
}

export type LeaderboardPerson = {
  id: string;
  rank: number;
  name: string;
  school: string;
  initials: string;
  image: string | null;
  level?: number;
  lp?: number;
  score?: number;
  isCurrentUser?: boolean;
};

export function UserLeaderboard({
  entries,
  currentUser,
  pointsKey = "lp",
  pointsSuffix = "LP",
}: {
  entries: LeaderboardPerson[];
  currentUser: { rank: number; level?: number; lp?: number; score?: number } | null;
  pointsKey?: "lp" | "score";
  pointsSuffix?: string;
}) {
  if (entries.length === 0) {
    return <EmptyState message="I Leonessa Point compariranno dopo le prime attività." title="Nessuna classifica" />;
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const pointsOf = (entry: LeaderboardPerson) =>
    pointsKey === "score" ? (entry.score ?? 0) : (entry.lp ?? 0);

  return (
    <>
      <RankList
        podium={podium.map((entry) => (
          <li className={entry.isCurrentUser ? styles.currentEntry : undefined} key={entry.id}>
            <Link className={podiumClass(entry.rank)} href={`/u/${entry.id}` as Route}>
              <span className={styles.medalWrap}>
                <Medal aria-hidden="true" size={14} strokeWidth={2.2} />
                <span className={styles.rank}>{entry.rank}</span>
              </span>
              <RankAvatar image={entry.image} initials={entry.initials} name={entry.name} />
              <span className={styles.entryCopy}>
                <strong>{entry.name}</strong>
                <small>
                  {entry.school}
                  {entry.level ? ` · Liv. ${entry.level}` : ""}
                </small>
              </span>
              <strong className={styles.points}>
                {formatPoints(pointsOf(entry))} {pointsSuffix}
              </strong>
            </Link>
          </li>
        ))}
        rest={rest.map((entry) => (
          <li className={entry.isCurrentUser ? styles.currentEntry : undefined} key={entry.id}>
            <Link className={styles.leaderboardRow} href={`/u/${entry.id}` as Route}>
              <span className={styles.rank}>{entry.rank}</span>
              <RankAvatar image={entry.image} initials={entry.initials} name={entry.name} />
              <span className={styles.entryCopy}>
                <strong>{entry.name}</strong>
                <small>
                  {entry.school}
                  {entry.level ? ` · Liv. ${entry.level}` : ""}
                </small>
              </span>
              <strong className={styles.points}>
                {formatPoints(pointsOf(entry))} {pointsSuffix}
              </strong>
            </Link>
          </li>
        ))}
      />
      {currentUser ? (
        <StickyRank
          detail={
            pointsKey === "score"
              ? `${formatPoints(currentUser.score ?? 0)} ${pointsSuffix}`
              : `Livello ${currentUser.level ?? 1} · ${formatPoints(currentUser.lp ?? 0)} LP`
          }
          label="La tua posizione"
          rank={currentUser.rank}
        />
      ) : null}
    </>
  );
}

export function SchoolLeaderboard({
  entries,
  currentSchool,
}: {
  entries: SchoolRankingEntry[];
  currentSchool: SchoolRankingEntry;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        message="I punti scuola compariranno con le prime attività dei tifosi."
        title="Nessuna classifica scuole"
      />
    );
  }

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <RankList
        podium={podium.map((entry) => {
          const inner = (
            <>
              <span className={styles.medalWrap}>
                <Medal aria-hidden="true" size={14} strokeWidth={2.2} />
                <span className={styles.rank}>{entry.rank}</span>
              </span>
              <SchoolMark logoUrl={entry.logoUrl} name={entry.shortName} />
              <span className={styles.entryCopy}>
                <strong>{entry.name}</strong>
                <small>{entry.shortName}</small>
              </span>
              <strong className={styles.points}>{formatPoints(entry.ssp)} SSP</strong>
            </>
          );

          return (
            <li
              className={entry.isCurrentSchool ? styles.currentEntry : undefined}
              key={entry.id}
            >
              {entry.teamId ? (
                <Link className={podiumClass(entry.rank)} href={`/team/${entry.teamId}` as Route}>
                  {inner}
                </Link>
              ) : (
                <div className={podiumClass(entry.rank)}>{inner}</div>
              )}
            </li>
          );
        })}
        rest={rest.map((entry) => {
          const inner = (
            <>
              <span className={styles.rank}>{entry.rank}</span>
              <SchoolMark logoUrl={entry.logoUrl} name={entry.shortName} />
              <span className={styles.entryCopy}>
                <strong>{entry.name}</strong>
                <small>{entry.shortName}</small>
              </span>
              <strong className={styles.points}>{formatPoints(entry.ssp)} SSP</strong>
            </>
          );

          return (
            <li className={entry.isCurrentSchool ? styles.currentEntry : undefined} key={entry.id}>
              {entry.teamId ? (
                <Link className={styles.leaderboardRow} href={`/team/${entry.teamId}` as Route}>
                  {inner}
                </Link>
              ) : (
                <div className={styles.leaderboardRow}>{inner}</div>
              )}
            </li>
          );
        })}
      />
      <StickyRank
        detail={`${currentSchool.name} · ${formatPoints(currentSchool.ssp)} SSP`}
        label="La tua scuola"
        rank={currentSchool.rank}
      />
    </>
  );
}
