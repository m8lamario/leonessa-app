"use client";

import Link from "next/link";
import { useState } from "react";

import { createRankingMock } from "../mock/ranking.mock";
import type {
  RankingBadge,
  RankingMission,
  SchoolRankingEntry,
  UserRankingEntry,
} from "../types/ranking";
import styles from "../ranking.module.css";

type RankingTab = "leaderboards" | "missions" | "badges" | "progression";
type LeaderboardTab = "users" | "schools";

type RankingDashboardProps = {
  userName: string;
  userInitials: string;
  schoolName: string;
  schoolShortName: string;
};

const rankingTabs: Array<{ id: RankingTab; label: string }> = [
  { id: "leaderboards", label: "Classifiche" },
  { id: "missions", label: "Missioni" },
  { id: "badges", label: "Badge" },
  { id: "progression", label: "Progressione" },
];

const missionStatusLabels = {
  AVAILABLE: "Disponibile",
  IN_PROGRESS: "In corso",
  COMPLETED: "Completata",
  CLAIMED: "Riscossa",
} as const;

function formatPoints(points: number) {
  return points.toLocaleString("it-IT");
}

function ProgressBar({
  label,
  progress,
  target,
}: {
  label: string;
  progress: number;
  target: number;
}) {
  const progressPercent = Math.min(100, Math.round((progress / target) * 100));

  return (
    <>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>
      <div className={styles.progressLabel}>
        <span>
          {progress}/{target}
        </span>
        <span>{progressPercent}%</span>
      </div>
    </>
  );
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

function MissionCard({
  mission,
  completed = false,
}: {
  mission: RankingMission;
  completed?: boolean;
}) {
  const progress = Math.min(100, Math.round((mission.progress / mission.target) * 100));

  return (
    <article className={styles.missionCard}>
      <div className={styles.cardTopline}>
        <span className={styles.status}>{missionStatusLabels[mission.status]}</span>
        <strong>+{mission.rewardLP} LP</strong>
      </div>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      {completed ? (
        <small className={styles.completedDate}>Completata il {mission.completedAt}</small>
      ) : (
        <>
          <ProgressBar
            label={`Progresso missione ${mission.title}`}
            progress={mission.progress}
            target={mission.target}
          />
          <span className={styles.visuallyHidden}>{progress}% completata</span>
        </>
      )}
    </article>
  );
}

function BadgeCard({ badge, earned = false }: { badge: RankingBadge; earned?: boolean }) {
  return (
    <article className={`${styles.badgeCard} ${earned ? "" : styles.lockedBadge}`}>
      <div className={styles.badgeIcon} aria-hidden="true">
        {earned ? "B" : "?"}
      </div>
      <div>
        <div className={styles.cardTopline}>
          <span className={styles.rarity}>{badge.rarity}</span>
          {earned && <small>Ottenuto il {badge.earnedAt}</small>}
        </div>
        <h3>{badge.name}</h3>
        <p>{badge.description}</p>
        {!earned && badge.progress !== undefined && badge.target !== undefined && (
          <ProgressBar
            label={`Progresso badge ${badge.name}`}
            progress={badge.progress}
            target={badge.target}
          />
        )}
      </div>
    </article>
  );
}

export function RankingDashboard({
  userName,
  userInitials,
  schoolName,
  schoolShortName,
}: RankingDashboardProps) {
  const [activeTab, setActiveTab] = useState<RankingTab>("leaderboards");
  const [activeLeaderboard, setActiveLeaderboard] = useState<LeaderboardTab>("users");
  const ranking = createRankingMock({ userName, userInitials, schoolName, schoolShortName });
  const nextLevelLP = 1750;
  const lpToNextLevel = nextLevelLP - ranking.currentUser.lp;

  return (
    <main className={styles.ranking}>
      <header className={styles.hero}>
        <p className={styles.kicker}>Leonessa Cup</p>
        <h1>Ranking</h1>
        <p>Segui la tua crescita, sostieni {schoolShortName} e scopri il tuo prossimo traguardo.</p>
      </header>

      <nav className={styles.tabs} aria-label="Sezioni ranking" role="tablist">
        {rankingTabs.map((tab) => (
          <button
            aria-controls={`ranking-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? styles.tabActive : undefined}
            id={`ranking-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        aria-labelledby={`ranking-tab-${activeTab}`}
        className={styles.panel}
        id={`ranking-panel-${activeTab}`}
        role="tabpanel"
      >
        {activeTab === "leaderboards" && (
          <>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Partecipazione</p>
                <h2>Classifiche</h2>
              </div>
            </div>
            <div className={styles.segmentedControl} aria-label="Tipo classifica">
              <button
                aria-pressed={activeLeaderboard === "users"}
                className={activeLeaderboard === "users" ? styles.segmentActive : undefined}
                onClick={() => setActiveLeaderboard("users")}
                type="button"
              >
                Utenti
              </button>
              <button
                aria-pressed={activeLeaderboard === "schools"}
                className={activeLeaderboard === "schools" ? styles.segmentActive : undefined}
                onClick={() => setActiveLeaderboard("schools")}
                type="button"
              >
                Scuole
              </button>
            </div>
            {activeLeaderboard === "users" ? (
              <UserLeaderboard entries={ranking.userRanking} currentUser={ranking.currentUser} />
            ) : (
              <SchoolLeaderboard
                entries={ranking.schoolRanking}
                currentSchool={ranking.currentSchool}
              />
            )}
          </>
        )}

        {activeTab === "missions" && (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Guadagna LP</p>
                <h2>Missioni attive</h2>
              </div>
            </div>
            <div className={styles.cardList}>
              {ranking.activeMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Il tuo percorso</p>
                <h2>Completate</h2>
              </div>
            </div>
            <div className={styles.cardList}>
              {ranking.completedMissions.map((mission) => (
                <MissionCard completed key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "badges" && (
          <div className={styles.sectionStack}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>I tuoi traguardi</p>
                <h2>Badge ottenuti</h2>
              </div>
            </div>
            <div className={styles.cardList}>
              {ranking.earnedBadges.map((badge) => (
                <BadgeCard earned badge={badge} key={badge.id} />
              ))}
            </div>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Prossimi obiettivi</p>
                <h2>Da sbloccare</h2>
              </div>
            </div>
            <div className={styles.cardList}>
              {ranking.lockedBadges.map((badge) => (
                <BadgeCard badge={badge} key={badge.id} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "progression" && (
          <div className={styles.sectionStack}>
            <article className={styles.levelCard}>
              <p className={styles.kicker}>Il tuo livello</p>
              <div>
                <strong>Livello {ranking.currentUser.level}</strong>
                <span>{formatPoints(ranking.currentUser.lp)} LP</span>
              </div>
              <ProgressBar
                label="Progresso verso il prossimo livello"
                progress={ranking.currentUser.lp - 1000}
                target={nextLevelLP - 1000}
              />
              <p>
                Ancora {formatPoints(lpToNextLevel)} LP per raggiungere il livello{" "}
                {ranking.currentUser.level + 1}.
              </p>
            </article>

            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Attivita recente</p>
                <h2>Storico LP</h2>
              </div>
            </div>
            <ol className={styles.historyList}>
              {ranking.history.map((entry) => (
                <li key={entry.id}>
                  <strong>+{entry.amount} LP</strong>
                  <span>{entry.reason}</span>
                  <time>{entry.date}</time>
                </li>
              ))}
            </ol>

            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>In numeri</p>
                <h2>Statistiche</h2>
              </div>
            </div>
            <dl className={styles.statsGrid}>
              <div>
                <dt>LP guadagnati</dt>
                <dd>{formatPoints(ranking.stats.lpEarned)}</dd>
              </div>
              <div>
                <dt>Missioni</dt>
                <dd>{ranking.stats.missionsCompleted}</dd>
              </div>
              <div>
                <dt>Badge</dt>
                <dd>{ranking.stats.badgesEarned}</dd>
              </div>
              <div>
                <dt>Eventi</dt>
                <dd>{ranking.stats.eventsAttended}</dd>
              </div>
              <div>
                <dt>Referral</dt>
                <dd>{ranking.stats.referralsCompleted}</dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <nav className={styles.bottomNavigation} aria-label="Navigazione principale">
        <Link href="/">
          <span aria-hidden="true">H</span>
          Home
        </Link>
        <Link href="/">
          <span aria-hidden="true">C</span>
          Cup
        </Link>
        <a className={styles.navActive} href="/ranking" aria-current="page">
          <span aria-hidden="true">R</span>
          Ranking
        </a>
        <Link href="/profile">
          <span aria-hidden="true">P</span>
          Profilo
        </Link>
      </nav>
    </main>
  );
}
