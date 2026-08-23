"use client";

import {
  Award,
  Flame,
  Medal,
  Swords,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { PageContainer } from "@/shared/components";
import { FantaIcon } from "./fanta-icons";
import styles from "./social-dashboard.module.css";

type ActivityDto = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  icon: string;
};

type AchievementDto = {
  code: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
};

type RivalDto = {
  userId: string;
  teamName: string;
  userName: string;
  points: number;
  delta: number;
};

type SocialData = {
  activity: ActivityDto[];
  topPerformers: Array<{ name: string; points: number }>;
  mvp: { name: string; school: string; points: number } | null;
  rival: RivalDto | null;
  achievements: AchievementDto[];
  weeklyDuel: { opponent: string; myPoints: number; rivalPoints: number } | null;
  hallOfFame: {
    bestMatchday: { teamName: string; points: number } | null;
    topGoals: { playerName: string; goals: number } | null;
    biggestGrowth: { playerName: string; growth: number } | null;
    topWins: { userName: string; points: number } | null;
  };
  topScorers: Array<{ name: string; goals: number }>;
  bestBuyers: Array<{ name: string; value: number }>;
};

type SocialDashboardProps = { social: SocialData };

const podiumIcons = ["medal", "medal", "medal"] as const;

export function SocialDashboard({ social }: SocialDashboardProps) {
  const unlockedCount = social.achievements.filter((a) => a.unlocked).length;

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Community</p>
          <h1>Social</h1>
        </div>
        <div className={styles.headerStat}>
          <span>Achievement</span>
          <strong>
            {unlockedCount}/{social.achievements.length}
          </strong>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="feed-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Cosa hanno fatto gli altri</p>
            <h2 id="feed-title">Attività</h2>
          </div>
          <Flame aria-hidden="true" size={20} />
        </div>
        <div className={styles.activityList}>
          {social.activity.length === 0 && (
            <p className={styles.emptyState}>
              Nessuna attività recente. La community sta per scaldarsi{" "}
              <FantaIcon className={styles.inlineIcon} name="flame" size={14} />
            </p>
          )}
          {social.activity.map((activity) => (
            <article className={styles.activityCard} key={activity.id}>
              <span className={styles.activityEmoji}>
                <FantaIcon name={activity.icon} size={18} />
              </span>
              <div>
                <p>{activity.title}</p>
                {activity.description && <small>{activity.description}</small>}
              </div>
              <time>{timeAgo(activity.createdAt)}</time>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="podium-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Top performer</p>
            <h2 id="podium-title">Podio della giornata</h2>
          </div>
          <Trophy aria-hidden="true" size={20} />
        </div>
        <div className={styles.podiumList}>
          {social.topPerformers.map((team, index) => (
            <article className={styles.podiumRow} key={team.name}>
              <span className={styles.podiumMedal}>
                <FantaIcon name={podiumIcons[index] ?? "award"} size={18} />
              </span>
              <span className={styles.podiumName}>{team.name}</span>
              <b>+{team.points}</b>
            </article>
          ))}
          {social.topPerformers.length === 0 && (
            <p className={styles.emptyState}>Il podio si popolerà alla prima giornata.</p>
          )}
        </div>
      </section>

      {social.mvp && (
        <section className={styles.section} aria-labelledby="mvp-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Star della giornata</p>
              <h2 id="mvp-title">MVP Fantasy</h2>
            </div>
            <Medal aria-hidden="true" size={20} />
          </div>
          <article className={styles.mvpCard}>
            <span className={styles.mvpIcon}>
              <FantaIcon name="star" size={18} />
            </span>
            <div>
              <strong>{social.mvp.name}</strong>
              <small>{social.mvp.school}</small>
            </div>
            <b>+{social.mvp.points}</b>
          </article>
        </section>
      )}

      {social.weeklyDuel && (
        <section className={styles.section} aria-labelledby="duel-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Duello settimanale</p>
              <h2 id="duel-title">Tu vs {social.weeklyDuel.opponent}</h2>
            </div>
            <Swords aria-hidden="true" size={20} />
          </div>
          <div className={styles.duelCard}>
            <div className={styles.duelSide}>
              <span>Tu</span>
              <b>{social.weeklyDuel.myPoints}</b>
            </div>
            <span className={styles.vs}>VS</span>
            <div className={styles.duelSide + " " + styles.duelAway}>
              <span>{social.weeklyDuel.opponent}</span>
              <b>{social.weeklyDuel.rivalPoints}</b>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="achievements-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>I tuoi traguardi</p>
            <h2 id="achievements-title">Achievement</h2>
          </div>
          <Award aria-hidden="true" size={20} />
        </div>
        <div className={styles.achievementGrid}>
          {social.achievements.map((achievement) => (
            <article
              className={
                achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked
              }
              key={achievement.code}
            >
              <span>
                <FantaIcon name={achievement.icon} size={20} />
              </span>
              <strong>{achievement.title}</strong>
              <small>{achievement.description}</small>
              {!achievement.unlocked && <em>Bloccato</em>}
            </article>
          ))}
        </div>
      </section>

      {social.rival && (
        <section className={styles.section} aria-labelledby="rival-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>La tua rivalità</p>
              <h2 id="rival-title">{social.rival.teamName}</h2>
            </div>
            <Target aria-hidden="true" size={20} />
          </div>
          <article className={styles.rivalCard}>
            <div>
              <span>{social.rival.userName}</span>
              <strong>{social.rival.points} punti</strong>
            </div>
            <b className={social.rival.delta >= 0 ? styles.deltaUp : styles.deltaDown}>
              {social.rival.delta >= 0 ? "+" : ""}
              {social.rival.delta} punti
            </b>
          </article>
        </section>
      )}

      <section className={styles.section} aria-labelledby="hof-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Leggende</p>
            <h2 id="hof-title">Hall of Fame</h2>
          </div>
          <Trophy aria-hidden="true" size={20} />
        </div>
        <div className={styles.hofList}>
          {social.hallOfFame.bestMatchday && (
            <div className={styles.hofRow}>
              <span className={styles.hofLabel}>
                <FantaIcon name="trophy" size={14} /> Miglior punteggio giornata
              </span>
              <b>
                {social.hallOfFame.bestMatchday.teamName} · {social.hallOfFame.bestMatchday.points}
              </b>
            </div>
          )}
          {social.hallOfFame.topGoals && (
            <div className={styles.hofRow}>
              <span className={styles.hofLabel}>
                <FantaIcon name="goal" size={14} /> Maggior numero di gol
              </span>
              <b>
                {social.hallOfFame.topGoals.playerName} · {social.hallOfFame.topGoals.goals}
              </b>
            </div>
          )}
          {social.hallOfFame.biggestGrowth && (
            <div className={styles.hofRow}>
              <span className={styles.hofLabel}>
                <FantaIcon name="trending-up" size={14} /> Maggior crescita valore
              </span>
              <b>
                {social.hallOfFame.biggestGrowth.playerName} · +
                {social.hallOfFame.biggestGrowth.growth} LP
              </b>
            </div>
          )}
          {social.hallOfFame.topWins && (
            <div className={styles.hofRow}>
              <span className={styles.hofLabel}>
                <FantaIcon name="crown" size={14} /> Utente più vincente
              </span>
              <b>
                {social.hallOfFame.topWins.userName} · {social.hallOfFame.topWins.points}
              </b>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trends-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Trend settimanali</p>
            <h2 id="trends-title">In evidenza</h2>
          </div>
          <TrendingUp aria-hidden="true" size={20} />
        </div>
        <div className={styles.trendGrid}>
          <TrendBlock title="Top marcatori">
            {social.topScorers.map((scorer) => (
              <TrendItem key={scorer.name} left={scorer.name} right={`${scorer.goals} gol`} />
            ))}
          </TrendBlock>
          <TrendBlock title="Più acquistati">
            {social.bestBuyers.map((buyer) => (
              <TrendItem key={buyer.name} left={buyer.name} right={`${buyer.value} volte`} />
            ))}
          </TrendBlock>
        </div>
      </section>
    </PageContainer>
  );
}

function TrendBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.trendBlock}>
      <h3>{title}</h3>
      <div className={styles.trendItems}>{children}</div>
    </div>
  );
}

function TrendItem({ left, right }: { left: string; right: string }) {
  return (
    <div className={styles.trendItem}>
      <span>{left}</span>
      <b>{right}</b>
    </div>
  );
}

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
