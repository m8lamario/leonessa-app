"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonList } from "@/shared/components/skeleton";
import { selection as hapticSelection } from "@/shared/lib/haptics";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";
import { dashboardMock } from "../mock/dashboard.mock";
import styles from "../dashboard.module.css";

type UserDashboardProps = {
  userName: string;
  userInitials: string;
  schoolName: string;
  schoolShortName: string;
};

const revealTransition = {
  duration: 0.24,
  ease: "easeOut" as const,
};

const MOCK_LOADING_DELAY = 400;

function DashboardSkeleton() {
  return (
    <main aria-busy="true" className={styles.dashboard}>
      <header className={styles.hero}>
        <div className={styles.heroTopline}>
          <Skeleton height="0.7rem" width="7rem" />
          <SkeletonAvatar size="42px" />
        </div>
        <div style={{ display: "grid", gap: "8px", marginTop: "28px" }}>
          <Skeleton height="0.9rem" width="42%" />
          <Skeleton height="3.8rem" width="68%" />
          <Skeleton height="0.9rem" width="54%" />
        </div>
        <div className={styles.heroStats} style={{ marginTop: "22px" }}>
          <div>
            <Skeleton height="0.7rem" width="62%" />
            <Skeleton height="2rem" width="44%" />
          </div>
          <div>
            <Skeleton height="0.7rem" width="62%" />
            <Skeleton height="2rem" width="58%" />
          </div>
        </div>
        <div style={{ display: "grid", gap: "8px", padding: "18px 0" }}>
          <Skeleton height="0.75rem" width="32%" />
          <Skeleton height="1.5rem" width="78%" />
          <Skeleton height="0.75rem" width="48%" />
        </div>
        <div className={styles.heroActions}>
          <Skeleton height="46px" width="100%" />
          <Skeleton height="46px" width="100%" />
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <Skeleton height="0.75rem" width="28%" />
          <Skeleton height="2.2rem" style={{ marginTop: "8px" }} width="55%" />
          <SkeletonCard lines={2} showMedia />
        </section>
        <section className={styles.section}>
          <Skeleton height="0.75rem" width="24%" />
          <Skeleton
            height="2.2rem"
            style={{ marginTop: "8px", marginBottom: "16px" }}
            width="38%"
          />
          <div className={styles.missionList}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </section>
        <section className={styles.section}>
          <Skeleton height="0.75rem" width="30%" />
          <Skeleton
            height="2.2rem"
            style={{ marginTop: "8px", marginBottom: "16px" }}
            width="58%"
          />
          <SkeletonList avatarSize="31px" items={5} />
        </section>
      </div>
    </main>
  );
}

export function UserDashboard({
  userName,
  userInitials,
  schoolName,
  schoolShortName,
}: UserDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { featuredMatch, missions, news, events, profile, school, schoolRanking } = dashboardMock;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsLoading(false), MOCK_LOADING_DELAY);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <main className={`${styles.dashboard} ${skeletonStyles.fadeIn}`}>
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
          <div>
            <span>Classifica</span>
            <strong>#{school.position}</strong>
          </div>
          <div>
            <span>Punti scuola</span>
            <strong>{school.points.toLocaleString("it-IT")}</strong>
          </div>
        </div>
        <div className={styles.heroNextMatch}>
          <span>Prossima partita</span>
          <strong>
            {featuredMatch.homeTeam} vs {featuredMatch.awayTeam}
          </strong>
          <p>{featuredMatch.schedule}</p>
        </div>
        <div className={styles.heroActions}>
          <a className={styles.primaryAction} href="#featured-match">
            Segui partita
          </a>
          <a className={styles.secondaryAction} href="#school-ranking">
            Vedi scuola
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
            <span className={styles.matchStatus}>{featuredMatch.status}</span>
          </div>
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
            {missions.map((mission) => {
              const progress = Math.round((mission.progress / mission.target) * 100);

              return (
                <article className={styles.missionCard} key={mission.title}>
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
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className={styles.progressLabel}>
                    <span>
                      {mission.progress}/{mission.target}
                    </span>
                    <span>{progress}%</span>
                  </div>
                </article>
              );
            })}
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
            <a className={styles.textAction} href="#school-ranking">
              Completa
            </a>
          </div>
          <ol className={styles.rankingList}>
            {schoolRanking.map((entry, index) => (
              <li
                className={
                  entry.name.toLocaleLowerCase("it-IT") ===
                  schoolShortName.toLocaleLowerCase("it-IT")
                    ? styles.currentSchool
                    : ""
                }
                key={entry.name}
              >
                <span className={styles.rankNumber}>0{index + 1}</span>
                <span className={styles.schoolMark} aria-hidden="true">
                  {entry.name.slice(0, 1)}
                </span>
                <span className={styles.rankingSchool}>{entry.name}</span>
                <strong>{entry.points.toLocaleString("it-IT")}</strong>
              </li>
            ))}
          </ol>
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
          <div className={styles.newsList}>
            {news.map((article) => (
              <article className={styles.newsCard} key={article.title}>
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
          <div className={styles.eventsList}>
            {events.map((event) => (
              <article className={styles.eventCard} key={event.title}>
                <time className={styles.eventDate}>{event.date}</time>
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.location}</p>
                </div>
              </article>
            ))}
          </div>
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

      <nav className={styles.bottomNavigation} aria-label="Navigazione principale">
        <Link className={styles.navActive} href="/dashboard" aria-current="page">
          <span aria-hidden="true">H</span>
          Home
        </Link>
        <a href="#featured-match" onClick={() => void hapticSelection()}>
          <span aria-hidden="true">C</span>
          Cup
        </a>
        <a href="/ranking" onClick={() => void hapticSelection()}>
          <span aria-hidden="true">R</span>
          Ranking
        </a>
        <Link href="/profile" onClick={() => void hapticSelection()}>
          <span aria-hidden="true">P</span>
          Profilo
        </Link>
      </nav>
    </main>
  );
}
