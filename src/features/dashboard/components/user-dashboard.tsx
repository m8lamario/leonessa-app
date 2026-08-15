"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

import { PageContainer } from "@/shared/components";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";
import type { DashboardData } from "../types";
import styles from "../dashboard.module.css";

type UserDashboardProps = {
  userName: string;
  userInitials: string;
  schoolName: string;
  schoolShortName: string;
  data: DashboardData;
};

const revealTransition = {
  duration: 0.24,
  ease: "easeOut" as const,
};

export function UserDashboard({
  userName,
  userInitials,
  schoolName,
  schoolShortName,
  data,
}: UserDashboardProps) {
  const [showFullRanking, setShowFullRanking] = useState(false);
  const { featuredMatch, missions, news, events, profile, school, schoolRanking } = data;
  const visibleSchoolRanking = showFullRanking ? schoolRanking : schoolRanking.slice(0, 5);

  return (
    <PageContainer className={`${styles.dashboard} ${skeletonStyles.fadeIn}`}>
      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
      >
        <div className={styles.heroTopline}>
          <p className={styles.kicker}>Leonessa Cup</p>
          <Link className={styles.avatar} href="/profile" aria-label="Apri il tuo profilo">
            {userInitials}
          </Link>
        </div>
        <p className={styles.greeting}>Bentornato, {userName}</p>
        <h1>{schoolShortName}</h1>
        <p className={styles.schoolName}>{schoolName}</p>
        <div className={styles.heroStats}>
          <div className={styles.accountPoints}>
            <span>I tuoi LP</span>
            <strong>{profile.totalLp.toLocaleString("it-IT")}</strong>
            <small>Livello {profile.level}</small>
          </div>
          <div className={styles.schoolPoints}>
            <span>Punti scuola</span>
            <strong>{school.points.toLocaleString("it-IT")}</strong>
            <small>
              {school.position ? `Posizione #${school.position}` : "Posizione non disponibile"}
            </small>
          </div>
        </div>
        <div className={styles.heroNextMatch}>
          <span>Prossima partita</span>
          {featuredMatch ? (
            <>
              <strong>
                {featuredMatch.homeTeam} vs {featuredMatch.awayTeam}
              </strong>
              <p>{featuredMatch.schedule}</p>
            </>
          ) : (
            <p>Nessuna partita in programma.</p>
          )}
        </div>
        <div className={styles.heroActions}>
          <a className={styles.primaryAction} href="#featured-match">
            Segui partita
          </a>
          <a
            className={styles.secondaryAction}
            href={school.teamId ? `/team/${school.teamId}` : "#school-ranking"}
          >
            {school.teamId ? "Vedi squadra" : "Vedi scuola"}
          </a>
        </div>
      </motion.header>

      <div className={styles.content}>
        <motion.section
          id="featured-match"
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.06 }}
          aria-labelledby="featured-match-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>In evidenza</p>
              <h2 id="featured-match-title">Match della settimana</h2>
            </div>
            {featuredMatch && <span className={styles.matchStatus}>{featuredMatch.status}</span>}
          </div>
          {featuredMatch ? (
            <article className={styles.matchCard}>
              <div className={styles.teamScore}>
                <strong>{featuredMatch.homeTeam}</strong>
                <span>VS</span>
                <strong>{featuredMatch.awayTeam}</strong>
              </div>
              <dl className={styles.matchDetails}>
                <div>
                  <dt>Quando</dt>
                  <dd>{featuredMatch.schedule}</dd>
                </div>
                <div>
                  <dt>Dove</dt>
                  <dd>{featuredMatch.venue}</dd>
                </div>
              </dl>
              <a className={styles.fullAction} href="#missions">
                Segui partita
              </a>
            </article>
          ) : (
            <article className={styles.matchCard}>
              <p className={styles.emptyState}>Il calendario non contiene partite disponibili.</p>
            </article>
          )}
        </motion.section>

        <motion.section
          id="missions"
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.12 }}
          aria-labelledby="missions-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Guadagna LP</p>
              <h2 id="missions-title">Missioni</h2>
            </div>
            <span className={styles.sectionCount}>{missions.length}</span>
          </div>
          <div className={styles.missionList}>
            {missions.length === 0 ? (
              <p className={styles.emptyState}>Non hai ancora missioni attive.</p>
            ) : (
              missions.map((mission) => {
                const progress = mission.target
                  ? Math.min(100, Math.round((mission.progress / mission.target) * 100))
                  : mission.progress > 0
                    ? 100
                    : 0;

                return (
                  <article className={styles.missionCard} key={mission.id}>
                    <div className={styles.missionTopline}>
                      <span>{mission.status}</span>
                      <strong>+{mission.reward} LP</strong>
                    </div>
                    <h3>{mission.title}</h3>
                    <p>{mission.description}</p>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-label={`Progresso missione ${mission.title}`}
                      aria-valuemin={0}
                      aria-valuemax={mission.target ?? 1}
                      aria-valuenow={
                        mission.target
                          ? Math.min(mission.progress, mission.target)
                          : progress > 0
                            ? 1
                            : 0
                      }
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className={styles.progressLabel}>
                      <span>
                        {mission.target
                          ? `${mission.progress}/${mission.target}`
                          : mission.progress > 0
                            ? `Progresso ${mission.progress}`
                            : mission.status}
                      </span>
                      <span>{progress}%</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </motion.section>

        <motion.section
          id="school-ranking"
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.18 }}
          aria-labelledby="ranking-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>La corsa alla Cup</p>
              <h2 id="ranking-title">Classifica scuole</h2>
            </div>
            {schoolRanking.length > 5 && (
              <button
                className={styles.textAction}
                onClick={() => setShowFullRanking((current) => !current)}
                type="button"
              >
                {showFullRanking ? "Mostra prime 5" : "Vedi tutte"}
              </button>
            )}
          </div>
          {schoolRanking.length === 0 ? (
            <p className={styles.emptyState}>
              La classifica sarà disponibile dopo i primi risultati.
            </p>
          ) : (
            <ol className={styles.rankingList}>
              {visibleSchoolRanking.map((entry, index) => (
                <li className={entry.isCurrentSchool ? styles.currentSchool : ""} key={entry.id}>
                  <span className={styles.rankNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.schoolMark} aria-hidden="true">
                    {entry.name.slice(0, 1)}
                  </span>
                  <span className={styles.rankingSchool}>{entry.name}</span>
                  <strong>{entry.points.toLocaleString("it-IT")}</strong>
                </li>
              ))}
            </ol>
          )}
        </motion.section>

        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.24 }}
          aria-labelledby="news-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Dentro la Cup</p>
              <h2 id="news-title">News</h2>
            </div>
          </div>
          {news.length === 0 ? (
            <p className={styles.emptyState}>Non ci sono ancora news pubblicate.</p>
          ) : (
            <div className={styles.newsList}>
              {news.map((article) => (
                <article className={styles.newsCard} key={article.id}>
                  <div
                    className={`${styles.newsVisual} ${styles[`visual${article.visual}`]}`}
                    aria-hidden="true"
                  >
                    <span>LC</span>
                  </div>
                  <div>
                    <div className={styles.newsMeta}>
                      <span>{article.category}</span>
                      <time>{article.date}</time>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                    <a href="#news-title">Leggi tutto</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.3 }}
          aria-labelledby="events-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Fuori dal campo</p>
              <h2 id="events-title">Eventi</h2>
            </div>
          </div>
          {events.length === 0 ? (
            <p className={styles.emptyState}>Non ci sono eventi in programma.</p>
          ) : (
            <div className={styles.eventsList}>
              {events.map((event) => (
                <article className={styles.eventCard} key={event.id}>
                  <time className={styles.eventDate}>{event.date}</time>
                  <div>
                    <h3>{event.title}</h3>
                    <p>{event.location}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          className={`${styles.section} ${styles.profileSection}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.36 }}
          aria-labelledby="quick-profile-title"
        >
          <div className={styles.quickProfile}>
            <div className={styles.avatarLarge} aria-hidden="true">
              {userInitials}
            </div>
            <div>
              <p className={styles.kicker}>Il tuo percorso</p>
              <h2 id="quick-profile-title">{userName}</h2>
              <p>{schoolName}</p>
            </div>
            <Link className={styles.profileLink} href="/profile">
              Profilo
            </Link>
          </div>
          <div className={styles.profileStats}>
            <div>
              <span>Livello</span>
              <strong>{profile.level}</strong>
            </div>
            <div>
              <span>LP totali</span>
              <strong>{profile.totalLp.toLocaleString("it-IT")}</strong>
            </div>
          </div>
        </motion.section>
      </div>
    </PageContainer>
  );
}
