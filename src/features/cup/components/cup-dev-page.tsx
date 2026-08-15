"use client";

import { useCompletedMatches, useLeonessaTeams, useUpcomingMatches } from "../hooks";
import styles from "./cup-dev-page.module.css";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatKickoff(kickoff: string) {
  return dateFormatter.format(new Date(kickoff));
}

function MatchList({
  matches,
  emptyMessage,
}: {
  matches: ReturnType<typeof useUpcomingMatches>["data"];
  emptyMessage: string;
}) {
  if (!matches?.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <ol className={styles.matchList}>
      {matches.slice(0, 5).map((match) => (
        <li key={match.id} className={styles.match}>
          <div>
            <strong>
              {match.homeTeam.shortName} <span>vs</span> {match.awayTeam.shortName}
            </strong>
            <small>
              {match.homeTeam.name} · {match.awayTeam.name}
            </small>
          </div>
          <div className={styles.matchMeta}>
            <time dateTime={match.kickoff}>{formatKickoff(match.kickoff)}</time>
            <span>
              {match.status === "live"
                ? "In corso"
                : match.homeScore !== null && match.awayScore !== null
                  ? `${match.homeScore} - ${match.awayScore}`
                  : "Programmato"}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CupDevPage() {
  const teamsQuery = useLeonessaTeams();
  const upcomingQuery = useUpcomingMatches();
  const completedQuery = useCompletedMatches();
  const isLoading = teamsQuery.isPending || upcomingQuery.isPending || completedQuery.isPending;
  const error = teamsQuery.error ?? upcomingQuery.error ?? completedQuery.error;

  if (isLoading) {
    return (
      <main className={styles.page} aria-busy="true">
        <p className={styles.kicker}>Leonessa Cup · Dev</p>
        <h1>Caricamento dati ESL</h1>
        <p className={styles.state}>Recupero e normalizzazione delle partite...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page} role="alert">
        <p className={styles.kicker}>Leonessa Cup · Dev</p>
        <h1>Dati non disponibili</h1>
        <p className={styles.state}>{error.message}</p>
        <button
          className={styles.retryButton}
          onClick={() => void upcomingQuery.refetch()}
          type="button"
        >
          Riprova
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Leonessa Cup · Dev</p>
        <h1>ESL data layer</h1>
        <p className={styles.state}>Pagina temporanea per verificare il contratto dati interno.</p>
      </header>

      <section className={styles.stats} aria-label="Riepilogo Leonessa Cup">
        <div>
          <span>Squadre</span>
          <strong>{teamsQuery.data?.length ?? 0}</strong>
        </div>
        <div>
          <span>Partite</span>
          <strong>{(upcomingQuery.data?.length ?? 0) + (completedQuery.data?.length ?? 0)}</strong>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="upcoming-heading">
        <div className={styles.heading}>
          <p className={styles.kicker}>Calendario</p>
          <h2 id="upcoming-heading">Prossime 5 partite</h2>
        </div>
        <MatchList matches={upcomingQuery.data} emptyMessage="Nessuna partita in programma." />
      </section>

      <section className={styles.panel} aria-labelledby="completed-heading">
        <div className={styles.heading}>
          <p className={styles.kicker}>Archivio</p>
          <h2 id="completed-heading">Ultime 5 partite</h2>
        </div>
        <MatchList matches={completedQuery.data} emptyMessage="Nessuna partita conclusa." />
      </section>
    </main>
  );
}
