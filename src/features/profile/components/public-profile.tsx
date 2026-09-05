"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Award, ChartNoAxesColumn, Medal, Swords, Trophy } from "lucide-react";

import { PageContainer } from "@/shared/components";
import type { CompareRow } from "../lib/identity";
import { buildShowcaseStats } from "../lib/showcase";
import type { UserShowcase } from "../types/profile";
import { FollowButton } from "./follow-button";
import styles from "../profile.module.css";

type PublicProfileViewProps = {
  profile: UserShowcase;
  isOwnProfile: boolean;
  comparison: CompareRow[] | null;
  viewerName: string;
  follow: {
    following: boolean;
    followerCount: number;
    followingCount: number;
    canFollow: boolean;
  };
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "adesso";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

function ShowcaseAvatar({ image, initials, name }: { image: string | null; initials: string; name: string }) {
  if (image) {
    return (
      <div className={styles.showcaseAvatar}>
        <Image alt={name} height={72} src={image} unoptimized width={72} />
      </div>
    );
  }

  return (
    <div className={styles.showcaseAvatar} aria-hidden="true">
      {initials}
    </div>
  );
}

export function PublicProfileView({
  profile,
  isOwnProfile,
  comparison,
  viewerName,
  follow,
}: PublicProfileViewProps) {
  const [showCompare, setShowCompare] = useState(Boolean(comparison) && !isOwnProfile);
  const [followerCount, setFollowerCount] = useState(follow.followerCount);
  const stats = buildShowcaseStats(profile);
  const competitionStats = stats.filter((stat) =>
    ["Ranking LP", "Fanta", "Pronostici"].includes(stat.label),
  );
  const featuredBadge = profile.badges[0] ?? null;

  return (
    <PageContainer className={styles.showcase}>
      <header className={styles.showcaseHero}>
        <p className={styles.kicker}>{isOwnProfile ? "La tua vetrina" : "Profilo pubblico"}</p>
        <div className={styles.showcaseIdentity}>
          <ShowcaseAvatar image={profile.image} initials={profile.initials} name={profile.name} />
          <div className={styles.showcaseCopy}>
            <h1>{profile.name}</h1>
            <p className={styles.meta}>
              {profile.schoolName ?? "Scuola non assegnata"}
              {profile.schoolRank ? ` · #${profile.schoolRank} scuola` : ""}
            </p>
            {profile.bio ? <p className={styles.showcaseBio}>{profile.bio}</p> : null}
            {featuredBadge ? (
              <p className={styles.showcaseFeatured}>
                <Medal aria-hidden="true" size={14} />
                {featuredBadge.name}
              </p>
            ) : null}
            <p className={styles.showcaseSocialCounts}>
              {followerCount.toLocaleString("it-IT")} follower ·{" "}
              {follow.followingCount.toLocaleString("it-IT")} seguiti
            </p>
          </div>
        </div>
        {isOwnProfile ? (
          <Link className={styles.profileAccountLink} href="/profile">
            Gestisci account
          </Link>
        ) : follow.canFollow ? (
          <FollowButton
            initialFollowerCount={follow.followerCount}
            initialFollowing={follow.following}
            onStateChange={(state) => setFollowerCount(state.followerCount)}
            profileId={profile.id}
          />
        ) : null}
      </header>

      <section className={styles.showcaseSection} aria-labelledby="progress-title">
        <div className={styles.showcaseHeading}>
          <p className={styles.kicker}>Progressione</p>
          <h2 id="progress-title">Livello {profile.level}</h2>
        </div>
        <div className={styles.progressPanel}>
          <div className={styles.progressTrack} aria-hidden="true">
            <span style={{ width: `${profile.levelProgressPercent}%` }} />
          </div>
          <p className={styles.progressLabel}>
            {profile.nextLevelLP
              ? `${profile.currentLP.toLocaleString("it-IT")} / ${profile.nextLevelLP.toLocaleString("it-IT")} LP`
              : "Livello massimo"}
          </p>
          <dl className={styles.progressStats}>
            <div>
              <dt>LP</dt>
              <dd>{profile.totalLp.toLocaleString("it-IT")}</dd>
            </div>
            <div>
              <dt>Missioni</dt>
              <dd>{profile.missionsCompleted}</dd>
            </div>
            <div>
              <dt>Badge</dt>
              <dd>{profile.badgeCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={styles.showcaseSection} aria-labelledby="compete-title">
        <div className={styles.showcaseHeading}>
          <div>
            <p className={styles.kicker}>Competizione</p>
            <h2 id="compete-title">Come si posiziona</h2>
          </div>
          {!isOwnProfile && comparison ? (
            <button
              className={styles.textButton}
              onClick={() => setShowCompare((current) => !current)}
              type="button"
            >
              {showCompare ? "Chiudi confronto" : "Confronta"}
            </button>
          ) : null}
        </div>
        <div className={styles.competeGrid}>
          {competitionStats.map((stat) => (
            <article className={styles.competeCard} key={stat.label}>
              <span className={styles.statLabel}>{stat.label}</span>
              <strong>{stat.value}</strong>
              <p>{stat.detail}</p>
            </article>
          ))}
        </div>
        {showCompare && comparison ? (
          <div className={styles.compareTable} role="table" aria-label="Confronto statistiche">
            <div className={styles.compareHead} role="row">
              <span />
              <strong>{viewerName}</strong>
              <strong>{profile.name}</strong>
            </div>
            {comparison.map((row) => (
              <div className={styles.compareRow} key={row.label} role="row">
                <span>{row.label}</span>
                <strong className={row.highlight === "yours" ? styles.compareWin : undefined}>
                  {row.yours}
                </strong>
                <strong className={row.highlight === "theirs" ? styles.compareWin : undefined}>
                  {row.theirs}
                </strong>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.showcaseSection} aria-labelledby="trophies-title">
        <div className={styles.showcaseHeading}>
          <p className={styles.kicker}>Trofei</p>
          <h2 id="trophies-title">Badge e achievement</h2>
        </div>
        {profile.badges.length === 0 && profile.achievements.length === 0 ? (
          <p className={styles.emptyState}>Nessun trofeo ottenuto per ora.</p>
        ) : (
          <div className={styles.trophyBoard}>
            {profile.badges.length > 0 ? (
              <div className={styles.trophyMosaic}>
                {profile.badges.map((badge) => (
                  <span className={styles.trophyChip} key={badge.id} title={badge.description}>
                    <Medal aria-hidden="true" size={14} />
                    {badge.name}
                  </span>
                ))}
              </div>
            ) : null}
            {profile.achievements.length > 0 ? (
              <div className={styles.achievementList}>
                {profile.achievements.slice(0, 6).map((achievement) => (
                  <article className={styles.achievementRow} key={achievement.code}>
                    <span className={styles.trophyIcon}>
                      <Award aria-hidden="true" size={16} />
                    </span>
                    <div>
                      <strong>{achievement.title}</strong>
                      <p>{achievement.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.showcaseSection} aria-labelledby="activity-title">
        <div className={styles.showcaseHeading}>
          <p className={styles.kicker}>Attività</p>
          <h2 id="activity-title">Conquiste recenti</h2>
        </div>
        {profile.recentActivity.length === 0 ? (
          <p className={styles.emptyState}>Ancora nessuna attività pubblica recente.</p>
        ) : (
          <div className={styles.showcaseActivity}>
            {profile.recentActivity.map((item) => (
              <article className={styles.showcaseActivityRow} key={item.id}>
                <span className={styles.trophyIcon}>
                  {item.id.startsWith("badge") ? (
                    <Medal aria-hidden="true" size={14} />
                  ) : item.id.startsWith("achievement") ? (
                    <Trophy aria-hidden="true" size={14} />
                  ) : item.id.startsWith("mission") ? (
                    <Swords aria-hidden="true" size={14} />
                  ) : (
                    <ChartNoAxesColumn aria-hidden="true" size={14} />
                  )}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  {item.detail ? <p>{item.detail}</p> : null}
                </div>
                <time dateTime={item.occurredAt}>{timeAgo(item.occurredAt)}</time>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
