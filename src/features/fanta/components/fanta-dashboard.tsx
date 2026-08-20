import Link from "next/link";
import { ArrowUpRight, Store, Trophy } from "lucide-react";

import { PageContainer } from "@/shared/components";
import styles from "./fanta-dashboard.module.css";
import { LineupExperience, type LineupExperienceData } from "./lineup-experience";

type RosterPlayer = {
  id: string;
  name: string;
  school: string;
  role: string;
  status: "STARTER" | "BENCH";
  benchOrder: number | null;
  isCaptain: boolean;
  totalPoints: number;
  matchPoints: number;
  goals: number;
  assists: number;
};

type DashboardData = {
  team: { id: string; name: string; budgetLp: number; totalPoints: number };
  position: number;
  lastMatchPoints: number;
  roster: RosterPlayer[];
  starters: RosterPlayer[];
  bench: RosterPlayer[];
  ranking: Array<{ position: number; name: string; points: number; isCurrent: boolean }>;
  upcomingMatches: Array<{ id: string; home: string; away: string; startAt: string }>;
  discoveries: Array<{ id: string; label: string; name: string; school: string; value: number }>;
};

type FantaDashboardProps = { dashboard: DashboardData | null; lineup: LineupExperienceData | null };

export function FantaDashboard({ dashboard, lineup }: FantaDashboardProps) {
  if (!dashboard) {
    return <EmptyDashboard />;
  }

  const starters =
    dashboard.starters ?? dashboard.roster.filter((player) => player.status === "STARTER");
  const bench = dashboard.bench ?? dashboard.roster.filter((player) => player.status === "BENCH");
  const involvedPlayers = starters.length + bench.length;

  return (
    <PageContainer className={styles.page}>
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Stagione 2026</p>
          <h1>{dashboard.team.name}</h1>
        </div>
        <div className={styles.headerStat}>
          <span>Budget</span>
          <strong>{dashboard.team.budgetLp} LP</strong>
        </div>
      </header>

      <section className={styles.heroCard} aria-label="Riepilogo squadra">
        <div className={styles.heroCopy}>
          <span className={styles.heroLabel}>Posizione attuale</span>
          <strong className={styles.position}>#{dashboard.position}</strong>
          <p>
            <ArrowUpRight aria-hidden="true" size={16} /> La corsa è appena iniziata
          </p>
        </div>
        <dl className={styles.heroStats}>
          <div>
            <dt>Punti totali</dt>
            <dd>{dashboard.team.totalPoints.toLocaleString("it-IT")}</dd>
          </div>
          <div>
            <dt>Ultima giornata</dt>
            <dd>+{dashboard.lastMatchPoints}</dd>
          </div>
        </dl>
      </section>

      {lineup && <LineupExperience lineup={lineup} />}

      <section className={styles.section} aria-labelledby="performance-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Ultima giornata</p>
            <h2 id="performance-title">Prestazioni</h2>
          </div>
          <span>Dati reali</span>
        </div>
        <div className={styles.performanceList}>
          {starters.slice(0, 5).map((player) => (
            <article className={styles.performanceCard} key={player.id}>
              <div>
                <strong>{player.name}</strong>
                <small>
                  {player.school}
                  {player.goals ? ` · ⚽ ${player.goals} gol` : ""}
                  {player.assists ? ` · 🎯 ${player.assists} assist` : ""}
                </small>
              </div>
              <b>+{player.matchPoints}</b>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.nextMatch} aria-labelledby="next-match-title">
        <p className={styles.kicker}>Prossima giornata Leonessa Cup</p>
        <h2 id="next-match-title">{involvedPlayers} giocatori in rosa</h2>
        {dashboard.upcomingMatches.length ? (
          <>
            <p>Inizio al prossimo fischio d&apos;inizio.</p>
            <div className={styles.matchChips}>
              {dashboard.upcomingMatches.map((match) => (
                <span key={match.id}>
                  {match.home} <b>vs</b> {match.away}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p>Il calendario della prossima giornata sarà disponibile a breve.</p>
        )}
      </section>

      <section className={styles.marketCard} id="market" aria-labelledby="market-title">
        <div>
          <p className={styles.kicker}>Mercato</p>
          <h2 id="market-title">{dashboard.team.budgetLp} LP disponibili</h2>
          <p>Gestisci rosa e formazione nel mercato.</p>
        </div>
        <Link className={styles.marketButton} href="/fanta/market">
          <Store aria-hidden="true" size={18} /> Vai al mercato
        </Link>
      </section>

      <section className={styles.section} id="ranking" aria-labelledby="ranking-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Competizione</p>
            <h2 id="ranking-title">Classifica rapida</h2>
          </div>
          <Trophy aria-hidden="true" size={22} />
        </div>
        <ol className={styles.rankingList}>
          {dashboard.ranking.map((item) => (
            <li
              className={item.isCurrent ? styles.currentRank : undefined}
              key={`${item.position}-${item.name}`}
            >
              <span>#{item.position}</span>
              <strong>{item.name}</strong>
              <b>{item.points.toLocaleString("it-IT")}</b>
            </li>
          ))}
          {!dashboard.ranking.some((item) => item.isCurrent) && (
            <li className={styles.currentRank}>
              <span>#{dashboard.position}</span>
              <strong>Tu</strong>
              <b>{dashboard.team.totalPoints.toLocaleString("it-IT")}</b>
            </li>
          )}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="social-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Community</p>
            <h2 id="social-title">Cosa succede intorno a te</h2>
          </div>
        </div>
        <Link className={styles.socialLink} href={"/fanta/social" as never}>
          <span className={styles.socialEmoji}>🏅</span>
          <div>
            <strong>Feed & rivalità</strong>
            <small>Attività, podio, achievement e Hall of Fame</small>
          </div>
          <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </section>

      <section className={styles.section} aria-labelledby="discover-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Scopri</p>
            <h2 id="discover-title">Giocatori da seguire</h2>
          </div>
        </div>
        <div className={styles.discoveryGrid}>
          {dashboard.discoveries.map((player) => (
            <article className={styles.discoveryCard} key={player.id}>
              <span>{player.label}</span>
              <strong>{player.name}</strong>
              <small>
                {player.school} · {player.value} LP
              </small>
            </article>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function EmptyDashboard() {
  return (
    <PageContainer className={styles.page}>
      <section className={styles.emptyHero} aria-labelledby="fanta-empty-title">
        <p className={styles.kicker}>⚽ Fanta Leonessa</p>
        <h1 id="fanta-empty-title">La tua squadra. La tua Cup.</h1>
        <p>Entra in campo, scegli la tua formazione e sfida gli studenti di Brescia.</p>
        <Link className={styles.primaryAction} href={"/fanta/team" as never}>
          Crea la tua squadra
        </Link>
      </section>
    </PageContainer>
  );
}
