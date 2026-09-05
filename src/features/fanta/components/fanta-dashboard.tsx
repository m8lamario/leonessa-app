import Link from "next/link";
import { ArrowUpRight, Goal, Store } from "lucide-react";

import { PageContainer } from "@/shared/components";
import { FantaIcon } from "./fanta-icons";
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
  discoveries: Array<{
    id: string;
    icon: string;
    label: string;
    name: string;
    school: string;
    value: number;
  }>;
};

type FantaDashboardProps = { dashboard: DashboardData | null; lineup: LineupExperienceData | null };

export function FantaDashboard({ dashboard, lineup }: FantaDashboardProps) {
  if (!dashboard) {
    return <EmptyDashboard />;
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Stagione 2026</p>
          <h1>{dashboard.team.name}</h1>
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

      {dashboard.upcomingMatches.length ? (
        <section className={styles.nextMatch} aria-labelledby="next-match-title">
          <p className={styles.kicker}>Prossima giornata</p>
          <h2 id="next-match-title">Calendario</h2>
          <div className={styles.matchChips}>
            {dashboard.upcomingMatches.slice(0, 3).map((match) => (
              <span key={match.id}>
                {match.home} <b>vs</b> {match.away}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.marketCard} id="market" aria-labelledby="market-title">
        <div>
          <p className={styles.kicker}>Mercato</p>
          <h2 id="market-title">Gestisci la rosa</h2>
          <p>Compra, vendi e conferma la formazione.</p>
        </div>
        <Link className={styles.marketButton} href="/fanta/market">
          <Store aria-hidden="true" size={18} /> Vai al mercato
        </Link>
      </section>

      <section className={styles.section} aria-labelledby="social-title">
        <Link className={styles.socialLink} href={"/fanta/social" as never}>
          <span className={styles.socialEmoji}>
            <FantaIcon name="award" size={18} />
          </span>
          <div>
            <strong id="social-title">Rivalità Fanta</strong>
            <small>Podio, achievement e Hall of Fame</small>
          </div>
          <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </section>
    </PageContainer>
  );
}

function EmptyDashboard() {
  return (
    <PageContainer className={styles.page}>
      <section className={styles.emptyHero} aria-labelledby="fanta-empty-title">
        <p className={styles.kicker}>
          <Goal aria-hidden="true" size={14} /> Fanta Leonessa
        </p>
        <h1 id="fanta-empty-title">La tua squadra. La tua Cup.</h1>
        <p>Entra in campo, scegli la tua formazione e sfida gli studenti di Brescia.</p>
        <Link className={styles.primaryAction} href={"/fanta/team" as never}>
          Crea la tua squadra
        </Link>
      </section>
    </PageContainer>
  );
}
