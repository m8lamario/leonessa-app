"use client";

import {
  CalendarDays,
  ExternalLink,
  Heart,
  Shield,
  Target,
  Trophy,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import { Avatar, EmptyState, ErrorState, PageContainer } from "@/shared/components";
import { Skeleton } from "@/shared/components/skeleton";

import { useTeam, useTeamApplication } from "../hooks";
import type { TeamMatch, TeamMember, TeamPageData } from "../types";
import styles from "../team.module.css";

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- ESL-synced logos can originate from different hosts.
    return <img alt={`Logo ${name}`} className={styles.teamLogo} src={logoUrl} />;
  }

  return (
    <span aria-label={`Logo ${name}`} className={styles.teamLogoFallback} role="img">
      <Shield aria-hidden="true" size={36} strokeWidth={1.8} />
    </span>
  );
}

function TeamPageSkeleton() {
  return (
    <PageContainer aria-busy="true" className={styles.teamPage}>
      <section className={styles.hero}>
        <div className={styles.heroIdentity}>
          <Skeleton height="84px" variant="circle" width="84px" />
          <div className={styles.heroCopy}>
            <Skeleton height="0.75rem" width="36%" />
            <Skeleton height="3rem" style={{ marginTop: "10px" }} width="72%" />
            <Skeleton height="0.9rem" style={{ marginTop: "8px" }} width="52%" />
          </div>
        </div>
        <Skeleton height="100px" style={{ marginTop: "24px" }} width="100%" />
      </section>
      <section className={styles.skeletonSection}>
        <Skeleton height="2.2rem" width="45%" />
        <Skeleton height="220px" style={{ marginTop: "16px" }} width="100%" />
      </section>
      <section className={styles.skeletonSection}>
        <Skeleton height="2.2rem" width="52%" />
        <Skeleton height="170px" style={{ marginTop: "16px" }} width="100%" />
      </section>
    </PageContainer>
  );
}

function CommunityList({
  emptyMessage,
  members,
  title,
}: {
  emptyMessage: string;
  members: TeamMember[];
  title: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleMembers = isExpanded ? members : members.slice(0, 5);

  return (
    <section aria-label={title} className={styles.communityGroup}>
      <h3>{title}</h3>
      {members.length === 0 ? (
        <p className={styles.emptyCopy}>{emptyMessage}</p>
      ) : (
        <>
          <ul className={styles.memberList}>
            {visibleMembers.map((member) => (
              <li key={member.id}>
                <Avatar label={member.name} size="sm" />
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.role}</small>
                </span>
              </li>
            ))}
          </ul>
          {members.length > 5 && (
            <button
              className={styles.textAction}
              onClick={() => setIsExpanded((current) => !current)}
              type="button"
            >
              {isExpanded ? "Mostra meno" : `Mostra tutti (${members.length})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: TeamMatch }) {
  const isCompleted = match.outcome !== null;

  return (
    <article className={styles.matchCard}>
      <div className={styles.matchTeams}>
        <strong>{match.homeTeam}</strong>
        <span>{isCompleted ? `${match.homeScore} - ${match.awayScore}` : "VS"}</span>
        <strong>{match.awayTeam}</strong>
      </div>
      <div className={styles.matchMeta}>
        {isCompleted && match.outcome ? (
          <span className={styles[`outcome${match.outcome}`]}>{match.outcome}</span>
        ) : (
          <time dateTime={match.kickoff}>{dateTimeFormatter.format(new Date(match.kickoff))}</time>
        )}
      </div>
    </article>
  );
}

function CommunityCta({
  applicationError,
  isApplying,
  name: teamName,
  onApply,
  viewer,
}: Pick<TeamPageData, "viewer" | "name"> & {
  applicationError: Error | null;
  isApplying: boolean;
  onApply: (kind: "player" | "staff") => void;
}) {
  if (viewer.membership) {
    const label = viewer.membership === "player" ? "giocatore" : "membro dello staff";

    return (
      <section className={`${styles.cta} ${styles.ctaActive}`}>
        <UserRoundCheck aria-hidden="true" size={28} />
        <div>
          <p className={styles.kicker}>La tua squadra</p>
          <h2>Fai già parte di {teamName}</h2>
          <p>Sei registrato come {label} della squadra.</p>
        </div>
      </section>
    );
  }

  if (viewer.application) {
    const applicationStatus = {
      pending: {
        title: "Candidatura in revisione",
        message: `La tua candidatura come ${viewer.application.kind === "player" ? "giocatore" : "staff"} è in revisione.`,
      },
      approved: {
        title: "Candidatura approvata",
        message:
          "La tua candidatura è stata approvata. Il profilo squadra verrà aggiornato a breve.",
      },
      rejected: {
        title: "Candidatura non approvata",
        message:
          "La tua candidatura non è stata approvata. Puoi contattare lo staff per maggiori informazioni.",
      },
    }[viewer.application.status];

    return (
      <section className={styles.cta}>
        <UserRoundCheck aria-hidden="true" size={28} />
        <div>
          <p className={styles.kicker}>Community Leonessa</p>
          <h2>{applicationStatus.title}</h2>
          <p>{applicationStatus.message}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.cta}>
      <UsersRound aria-hidden="true" size={28} />
      <div>
        <p className={styles.kicker}>Community Leonessa</p>
        <h2>{viewer.attendsSchool ? "Entra nella tua squadra" : "Entra nella community"}</h2>
        <p>Porta la tua passione in campo o aiuta la squadra dietro le quinte.</p>
        <div className={styles.ctaActions}>
          <button disabled={isApplying} onClick={() => onApply("player")} type="button">
            Candidati come giocatore
          </button>
          <button disabled={isApplying} onClick={() => onApply("staff")} type="button">
            Candidati come staff
          </button>
        </div>
        {applicationError && <p className={styles.applicationError}>{applicationError.message}</p>}
      </div>
    </section>
  );
}

function TeamContent({
  applicationError,
  isApplying,
  onApply,
  team,
}: {
  applicationError: Error | null;
  isApplying: boolean;
  onApply: (kind: "player" | "staff") => void;
  team: TeamPageData;
}) {
  return (
    <PageContainer className={styles.teamPage}>
      <header className={styles.hero}>
        <div className={styles.heroIdentity}>
          <TeamLogo logoUrl={team.logoUrl} name={team.name} />
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Leonessa Cup</p>
            <h1>{team.name}</h1>
            <p>{team.school.name}</p>
          </div>
        </div>
        <div className={styles.heroRanking}>
          <div>
            <span>Posizione attuale</span>
            <strong>{team.ranking.position ? `#${team.ranking.position}` : "—"}</strong>
          </div>
          <div>
            <span>Punti ranking</span>
            <strong>{team.ranking.points.toLocaleString("it-IT")}</strong>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section aria-labelledby="team-statistics-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Sul campo</p>
              <h2 id="team-statistics-title">Statistiche squadra</h2>
            </div>
            <Target aria-hidden="true" size={24} />
          </div>
          <dl className={styles.statsGrid}>
            <div>
              <dt>Partite</dt>
              <dd>{team.ranking.matchesPlayed}</dd>
            </div>
            <div>
              <dt>Vittorie</dt>
              <dd>{team.ranking.wins}</dd>
            </div>
            <div>
              <dt>Pareggi</dt>
              <dd>{team.ranking.draws}</dd>
            </div>
            <div>
              <dt>Sconfitte</dt>
              <dd>{team.ranking.losses}</dd>
            </div>
            <div>
              <dt>Gol fatti</dt>
              <dd>{team.statistics.goalsFor}</dd>
            </div>
            <div>
              <dt>Gol subiti</dt>
              <dd>{team.statistics.goalsAgainst}</dd>
            </div>
            <div className={styles.goalDifference}>
              <dt>Differenza reti</dt>
              <dd>
                {team.statistics.goalDifference > 0 ? "+" : ""}
                {team.statistics.goalDifference}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="community-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Le persone della squadra</p>
              <h2 id="community-title">Community Leonessa</h2>
            </div>
            <UsersRound aria-hidden="true" size={24} />
          </div>
          <div className={styles.communityCard}>
            <CommunityList
              emptyMessage="Non ci sono ancora giocatori registrati."
              members={team.community.players}
              title="Giocatori registrati"
            />
            <CommunityList
              emptyMessage="Lo staff della squadra verrà comunicato a breve."
              members={team.community.staff}
              title="Staff squadra"
            />
            <div className={styles.supporterTotal}>
              <Heart aria-hidden="true" size={24} />
              <div>
                <strong>{team.community.supportersCount.toLocaleString("it-IT")}</strong>
                <span>Supporter registrati</span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="supporters-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>La tifoseria</p>
              <h2 id="supporters-title">Top supporters</h2>
            </div>
            <Trophy aria-hidden="true" size={24} />
          </div>
          {team.topSupporters.length === 0 ? (
            <p className={styles.emptyCopy}>La classifica dei supporter arriverà con i primi LP.</p>
          ) : (
            <ol className={styles.supporterList}>
              {team.topSupporters.map((supporter, index) => (
                <li key={supporter.id}>
                  <span className={styles.supporterRank}>{index + 1}</span>
                  <Avatar label={supporter.name} size="sm" />
                  <strong>{supporter.name}</strong>
                  <span>{supporter.lp.toLocaleString("it-IT")} LP</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="completed-matches-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Il percorso recente</p>
              <h2 id="completed-matches-title">Ultime partite</h2>
            </div>
            <Trophy aria-hidden="true" size={24} />
          </div>
          {team.completedMatches.length === 0 ? (
            <p className={styles.emptyCopy}>Nessuna partita conclusa.</p>
          ) : (
            <div className={styles.matchList}>
              {team.completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="upcoming-matches-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Prossimo appuntamento</p>
              <h2 id="upcoming-matches-title">Prossime partite</h2>
            </div>
            <CalendarDays aria-hidden="true" size={24} />
          </div>
          {team.upcomingMatches.length === 0 ? (
            <p className={styles.emptyCopy}>Nessuna partita in programma.</p>
          ) : (
            <div className={styles.matchList}>
              {team.upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>

        <CommunityCta
          applicationError={applicationError}
          isApplying={isApplying}
          name={team.name}
          onApply={onApply}
          viewer={team.viewer}
        />

        <section aria-label="Approfondimenti sul sito ufficiale" className={styles.ialLinks}>
          <a href="https://estudentsleague.com/" rel="noreferrer" target="_blank">
            Visualizza classifica completa
            <ExternalLink aria-hidden="true" size={16} />
          </a>
          <a href="https://estudentsleague.com/" rel="noreferrer" target="_blank">
            Visualizza calendario completo
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        </section>
      </div>
    </PageContainer>
  );
}

export function TeamPageClient({
  initialData,
  teamId,
}: {
  initialData?: TeamPageData | null;
  teamId: string;
}) {
  const teamQuery = useTeam(teamId, initialData);
  const applicationMutation = useTeamApplication(teamId);

  if (teamQuery.isPending) {
    return <TeamPageSkeleton />;
  }

  if (teamQuery.isError) {
    return (
      <PageContainer className={styles.teamPage}>
        <ErrorState message={teamQuery.error.message} onRetry={() => void teamQuery.refetch()} />
      </PageContainer>
    );
  }

  if (!teamQuery.data) {
    return (
      <PageContainer className={styles.teamPage}>
        <EmptyState message="La squadra richiesta non è disponibile." title="Squadra non trovata" />
      </PageContainer>
    );
  }

  return (
    <TeamContent
      applicationError={applicationMutation.error}
      isApplying={applicationMutation.isPending}
      onApply={applicationMutation.mutate}
      team={teamQuery.data}
    />
  );
}
