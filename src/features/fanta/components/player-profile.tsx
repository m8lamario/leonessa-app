"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Crown, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { PageContainer } from "@/shared/components";
import type { PlayerProfileDto } from "../server/player-profile-service";
import styles from "./player-profile.module.css";

type PlayerProfileProps = {
  profile: PlayerProfileDto;
  myProfile: PlayerProfileDto | null;
};

export function PlayerProfileView({ profile, myProfile }: PlayerProfileProps) {
  const isMe = Boolean(profile.isCurrentUser);
  const hasHistory = profile.market.valueHistory.length > 0;

  const valuePoints = useMemo(() => {
    if (!hasHistory) {
      return [
        { label: "Iniziale", value: profile.market.initialValue },
        { label: "Attuale", value: profile.fantasyValue },
      ];
    }
    const points = profile.market.valueHistory.map((entry) => ({
      label: new Date(entry.createdAt).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
      }),
      value: entry.newValue,
    }));
    points.unshift({ label: "Inizio", value: profile.market.initialValue });
    return points;
  }, [profile, hasHistory]);

  const maxValue = Math.max(
    ...valuePoints.map((point) => point.value),
    profile.market.initialValue,
    1,
  );

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.backButton} href="/fanta">
          <ArrowLeft aria-hidden="true" size={18} /> Fanta
        </Link>
        {isMe && (
          <Link className={styles.mineTag} href="/fanta">
            La tua scheda atleta
          </Link>
        )}
      </header>

      <section className={styles.hero} aria-label="Profilo giocatore">
        <div className={styles.avatarWrap}>
          {profile.avatarUrl ? (
            <Image
              className={styles.avatar}
              src={profile.avatarUrl}
              alt=""
              width={76}
              height={76}
              unoptimized
            />
          ) : (
            <span className={styles.avatarInitials}>{profile.avatarText}</span>
          )}
          {profile.isVerifiedPlayer && (
            <span className={styles.verifiedBadge} aria-label="Giocatore verificato">
              <BadgeCheck aria-hidden="true" size={18} />
            </span>
          )}
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>
            {profile.school} · {profile.roleLabel}
            {profile.jerseyNumber != null ? ` · N°${profile.jerseyNumber}` : ""}
          </p>
          <h1>{profile.name}</h1>
          <p className={styles.schoolLine}>{profile.schoolName}</p>
          {profile.schoolYear && <p className={styles.meta}>Classe {profile.schoolYear}</p>}
          {profile.isVerifiedPlayer && (
            <span className={styles.verifiedTag}>
              <BadgeCheck aria-hidden="true" size={14} /> Giocatore Verificato
            </span>
          )}
        </div>
      </section>

      <section className={styles.badgeRow} aria-label="Badge">
        {profile.badges.map((badge) => (
          <span className={styles.badge} key={badge.key}>
            {badge.emoji} {badge.label}
          </span>
        ))}
        {profile.isRookie && <span className={styles.badge}>🆕 Rookie</span>}
      </section>

      <section className={styles.statsCard} aria-label="Statistiche principali">
        <Stat label="Gol" value={profile.stats.goals} emoji="⚽" />
        <Stat label="Assist" value={profile.stats.assists} emoji="🎯" />
        <Stat label="Presenze" value={profile.stats.matches} emoji="🏃" />
        <Stat
          label="Punti Fantasy"
          value={profile.stats.totalPoints.toLocaleString("it-IT")}
          emoji="⭐"
        />
      </section>

      <section className={styles.section} aria-label="Valore fantasy">
        <div className={styles.valueCard}>
          <div>
            <p className={styles.kicker}>Valore fantasy</p>
            <strong className={styles.valueNow}>{profile.fantasyValue} LP</strong>
          </div>
          <div className={styles.valueDelta}>
            {profile.fantasyValue > profile.market.initialValue ? (
              <span className={styles.up}>
                <TrendingUp aria-hidden="true" size={16} /> +
                {profile.fantasyValue - profile.market.initialValue}
              </span>
            ) : profile.fantasyValue < profile.market.initialValue ? (
              <span className={styles.down}>
                <TrendingDown aria-hidden="true" size={16} />{" "}
                {profile.fantasyValue - profile.market.initialValue}
              </span>
            ) : (
              <span className={styles.flat}>0</span>
            )}
          </div>
        </div>

        <div className={styles.chart} aria-label="Andamento valore">
          {valuePoints.map((point, index) => (
            <div className={styles.chartColumn} key={`${point.label}-${index}`}>
              <div className={styles.chartBarTrack}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
                />
              </div>
              <span>{point.value}</span>
              <small>{point.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-label="Popolarità">
        <div className={styles.popularityCard}>
          <div>
            <strong>{profile.market.ownedCount}</strong>
            <span>scelto da {profile.market.ownedCount} utenti</span>
          </div>
          <div>
            <strong>{profile.market.ownedPercentage.toFixed(0)}%</strong>
            <span>degli utenti fantasy</span>
          </div>
          {profile.positionRank != null && (
            <div>
              <strong>#{profile.positionRank}</strong>
              <span>per punti fantasy</span>
            </div>
          )}
          {profile.captainCount > 0 && (
            <div>
              <strong>{profile.captainCount}</strong>
              <span>volte capitano</span>
            </div>
          )}
        </div>
      </section>

      {profile.recentMatches.length > 0 && (
        <section className={styles.section} aria-label="Ultime partite">
          <h2>Ultime partite</h2>
          <div className={styles.matchList}>
            {profile.recentMatches.map((match) => (
              <article className={styles.matchCard} key={match.id}>
                <span className={styles.matchOpponent}>{match.opponent}</span>
                <span className={styles.matchResult}>{match.result}</span>
                <b className={match.playerPoints >= 0 ? styles.matchUp : styles.matchDown}>
                  {match.playerPoints >= 0 ? "+" : ""}
                  {match.playerPoints}
                </b>
              </article>
            ))}
          </div>
        </section>
      )}

      {profile.performance.length > 0 && (
        <section className={styles.section} aria-label="Storico prestazioni">
          <h2>Storico prestazioni</h2>
          <div className={styles.perfList}>
            {profile.performance.slice(0, 8).map((item, index) => (
              <div className={styles.perfCard} key={`${item.matchday}-${index}`}>
                <span>{item.matchday}</span>
                <b className={item.points >= 0 ? styles.matchUp : styles.matchDown}>
                  {item.points >= 0 ? "+" : ""}
                  {item.points} punti
                </b>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section} aria-label="Statistiche torneo">
        <h2>Statistiche Leonessa</h2>
        <div className={styles.leonessaStats}>
          <span>
            Gol <b>{profile.stats.goals}</b>
          </span>
          <span>
            Assist <b>{profile.stats.assists}</b>
          </span>
          <span>
            Presenze <b>{profile.stats.matches}</b>
          </span>
          <span>
            Ammonizioni <b>{profile.stats.yellowCards}</b>
          </span>
          <span>
            Espulsioni <b>{profile.stats.redCards}</b>
          </span>
          {profile.stats.cleanSheets > 0 && (
            <span>
              Clean Sheet <b>{profile.stats.cleanSheets}</b>
            </span>
          )}
        </div>
      </section>

      {myProfile && myProfile.id === profile.id && (
        <section className={styles.section} aria-label="Dashboard atleta">
          <h2>La tua dashboard</h2>
          <p className={styles.dashboardNote}>
            <Crown aria-hidden="true" size={15} /> Questa è la tua scheda di giocatore: condividila
            per farti scoprire nel Fanta.
          </p>
        </section>
      )}
    </PageContainer>
  );
}

function Stat({ label, value, emoji }: { label: string; value: number | string; emoji: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statIcon}>{emoji}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}
