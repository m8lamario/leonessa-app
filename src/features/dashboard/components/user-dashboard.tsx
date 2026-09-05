"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useEffect } from "react";
import {
  CalendarDays,
  ChartNoAxesColumn,
  ChevronRight,
  Swords,
  Target,
  Trophy,
  UserRoundSearch,
  Users,
} from "lucide-react";

import {
  EmailVerificationBanner,
  type EmailVerificationBannerStatus,
} from "@/features/auth/components/email-verification-banner";
import { FantaIcon } from "@/features/fanta/components/fanta-icons";
import { MatchPredictionCard } from "@/features/predictions/components/match-prediction-card";
import { PageContainer } from "@/shared/components";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";
import type { DashboardData, DashboardTodayAction } from "../types";
import styles from "../dashboard.module.css";

type UserDashboardProps = {
  data: DashboardData;
  verificationStatus: EmailVerificationBannerStatus | null;
};

const revealTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

function actionIcon(action: DashboardTodayAction) {
  if (action.id === "prediction") return Swords;
  if (action.id === "fanta") return Trophy;
  if (action.id.startsWith("mission")) return Target;
  if (action.id.startsWith("event")) return CalendarDays;
  if (action.id === "referral") return Users;
  return ChevronRight;
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

function fantaCtaLabel(kind: DashboardData["fanta"]["kind"]) {
  if (kind === "CREATE") return "Crea squadra";
  if (kind === "COMPLETE_LINEUP") return "Apri formazione";
  if (kind === "MARKET_OPEN") return "Apri mercato";
  return "Apri Fanta";
}

export function UserDashboard({ data, verificationStatus }: UserDashboardProps) {
  const router = useRouter();
  const { personal, fanta, prediction, todayActions, activity, followingAnyone, school, news, events } =
    data;
  const hasSecondary = news.length > 0 || events.length > 0;
  const friendsHref = "/altro/esplora?categoria=persone" as Route;
  const showcaseHref = `/u/${personal.userId}` as Route;

  useEffect(() => {
    router.prefetch("/ranking");
    router.prefetch("/profile");
    router.prefetch("/fanta");
    router.prefetch("/fanta/market");
    router.prefetch(friendsHref);
    router.prefetch(showcaseHref);
    if (school.teamId) {
      router.prefetch(`/team/${school.teamId}`);
    }
  }, [router, school.teamId, friendsHref, showcaseHref]);

  return (
    <PageContainer className={`${styles.dashboard} ${skeletonStyles.fadeIn}`}>
      {verificationStatus && <EmailVerificationBanner initialStatus={verificationStatus} />}

      <m.header
        className={styles.identity}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={revealTransition}
      >
        <Link className={styles.identityLink} href={showcaseHref}>
          <div className={styles.avatar} aria-hidden="true">
            {personal.initials}
          </div>
          <div className={styles.identityCopy}>
            <p className={styles.greeting}>Bentornato</p>
            <h1>{personal.name}</h1>
            <p className={styles.schoolName}>{personal.schoolName}</p>
            <p className={styles.statusLine}>
              Livello {personal.level} · Ranking #{personal.rankingPosition}
            </p>
          </div>
          <ChevronRight aria-hidden="true" className={styles.identityChevron} size={18} />
        </Link>
      </m.header>

      <div className={styles.content}>
        <m.section
          className={styles.featuredSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.04 }}
          aria-labelledby="fanta-cta-title"
        >
          <article className={styles.featuredCard}>
            <p className={styles.kicker}>Fanta Leonessa</p>
            <h2 id="fanta-cta-title">{fanta.title}</h2>
            <p className={styles.featuredCopy}>{fanta.description}</p>
            {(fanta.position || fanta.points != null) && (
              <div className={styles.featuredMeta}>
                {fanta.position ? <span>#{fanta.position} in classifica</span> : null}
                {fanta.points != null ? <span>{fanta.points.toLocaleString("it-IT")} pt</span> : null}
              </div>
            )}
            <Link className={styles.featuredCta} href={fanta.href}>
              {fantaCtaLabel(fanta.kind)}
              <ChevronRight aria-hidden="true" size={18} />
            </Link>
          </article>
        </m.section>

        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.07 }}
          aria-labelledby="today-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Priorità</p>
              <h2 id="today-title">Cosa puoi fare oggi</h2>
            </div>
          </div>
          {todayActions.length === 0 ? (
            <p className={styles.emptyState}>Al momento non ci sono azioni disponibili.</p>
          ) : (
            <div className={styles.actionList}>
              {todayActions.map((action) => {
                const Icon = actionIcon(action);
                return (
                  <Link className={styles.actionRow} href={action.href as Route} key={action.id}>
                    <span className={styles.rowIcon}>
                      <Icon aria-hidden="true" size={18} />
                    </span>
                    <span className={styles.rowCopy}>
                      <strong>{action.title}</strong>
                      <span>{action.description}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className={styles.chevron} size={18} />
                  </Link>
                );
              })}
            </div>
          )}
        </m.section>

        {prediction ? (
          <m.section
            id="prediction"
            className={styles.section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.09 }}
            aria-labelledby="prediction-title"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Match della settimana</p>
                <h2 id="prediction-title">Chi vincerà?</h2>
              </div>
              <Swords aria-hidden="true" className={styles.headingIcon} size={18} />
            </div>
            <MatchPredictionCard prediction={prediction} />
          </m.section>
        ) : null}

        {!followingAnyone ? (
          <m.section
            className={styles.section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...revealTransition, delay: 0.11 }}
            aria-labelledby="friends-title"
          >
            <article className={styles.friendsCard}>
              <span className={styles.rowIcon}>
                <UserRoundSearch aria-hidden="true" size={18} />
              </span>
              <div className={styles.rowCopy}>
                <p className={styles.kicker}>Amici</p>
                <h2 id="friends-title">Trova i tuoi amici</h2>
                <p>Cerca i tuoi amici nella Leonessa e confronta i tuoi progressi.</p>
              </div>
              <Link className={styles.friendsCta} href={friendsHref}>
                Cerca amici
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            </article>
          </m.section>
        ) : null}

        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: 0.13 }}
          aria-labelledby="activity-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Social</p>
              <h2 id="activity-title">Attività nella Leonessa</h2>
            </div>
            {followingAnyone ? (
              <Link className={styles.sectionCta} href={friendsHref}>
                Cerca amici
                <ChevronRight aria-hidden="true" size={16} />
              </Link>
            ) : null}
          </div>
          {activity.length === 0 ? (
            <div className={styles.emptyBlock}>
              <p className={styles.emptyState}>
                {followingAnyone
                  ? "I profili che segui non hanno ancora attività recenti."
                  : "Segui i tuoi amici per vedere qui i loro progressi nella Leonessa."}
              </p>
            </div>
          ) : (
            <div className={styles.activityList}>
              {activity.map((item) => {
                const content = (
                  <>
                    <span className={styles.rowIcon}>
                      <FantaIcon name={item.icon} size={16} />
                    </span>
                    <div className={styles.rowCopy}>
                      {item.fromFollowed ? <span className={styles.followedKicker}>Seguito</span> : null}
                      <strong>{item.title}</strong>
                      {item.detail ? <span>{item.detail}</span> : null}
                    </div>
                    <time className={styles.activityTime} dateTime={item.occurredAt}>
                      {timeAgo(item.occurredAt)}
                    </time>
                  </>
                );
                const rowClass = item.fromFollowed
                  ? `${styles.activityRow} ${styles.activityRowFollowed}`
                  : styles.activityRow;
                return item.href ? (
                  <Link className={rowClass} href={item.href as Route} key={item.id}>
                    {content}
                  </Link>
                ) : (
                  <article className={rowClass} key={item.id}>
                    {content}
                  </article>
                );
              })}
            </div>
          )}
        </m.section>

        <section className={styles.secondaryCluster} aria-label="Aggiornamenti">
          <article className={styles.quietCard}>
            <div className={styles.quietHeading}>
              <p className={styles.kicker}>La tua scuola</p>
              <ChartNoAxesColumn aria-hidden="true" size={16} />
            </div>
            <h2 className={styles.quietTitle}>{school.name}</h2>
            <div className={styles.schoolBar}>
              <div>
                <span>Posizione</span>
                <strong>{school.position ? `#${school.position}` : "—"}</strong>
              </div>
              <div>
                <span>Punti Cup</span>
                <strong>{school.points.toLocaleString("it-IT")}</strong>
              </div>
              <Link className={styles.textAction} href="/ranking">
                Classifica
              </Link>
            </div>
          </article>

          {hasSecondary ? (
            <section className={styles.quietCard} aria-labelledby="feed-title">
              <p className={styles.kicker}>Nella Leonessa</p>
              <h2 className={styles.quietTitle} id="feed-title">
                News e eventi
              </h2>
              <div className={styles.feedList}>
                {events.map((event) => (
                  <article className={styles.feedRow} key={event.id}>
                    <span>Evento</span>
                    <strong>{event.title}</strong>
                    <p>
                      {event.date} · {event.location}
                    </p>
                  </article>
                ))}
                {news.map((article) => (
                  <article className={styles.feedRow} key={article.id}>
                    <span>{article.category}</span>
                    <strong>{article.title}</strong>
                    <p>{article.date}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </PageContainer>
  );
}
