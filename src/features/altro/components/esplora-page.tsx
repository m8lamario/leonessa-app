"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  Handshake,
  Search,
  Shirt,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

import { EmptyState, PageContainer } from "@/shared/components";

import hubStyles from "../altro.module.css";
import styles from "../esplora.module.css";
import {
  defaultExploreCategory,
  filterByQuery,
  groupMatches,
  shouldShowSearch,
} from "../lib/explore-filters";
import type {
  ExploreCategory,
  ExploreData,
  ExploreMatch,
  ExploreMatchStatus,
  ExplorePlayer,
  ExploreSchool,
  ExploreTeam,
} from "../types/explore";
import { HubSubheader } from "./hub-subheader";

type EsploraPageProps = {
  data: ExploreData;
};

const CATEGORIES: Array<{
  id: ExploreCategory;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "scuole", label: "Scuole", icon: Building2 },
  { id: "squadre", label: "Squadre", icon: Users },
  { id: "giocatori", label: "Giocatori", icon: Shirt },
  { id: "partite", label: "Partite", icon: CalendarDays },
  { id: "classifiche", label: "Classifiche", icon: ChartNoAxesColumn },
  { id: "partner", label: "Partner", icon: Handshake },
];

const ROLE_FILTERS = ["ALL", "PORTIERE", "DIFENSORE", "CENTROCAMPISTA", "ATTACCANTE"] as const;

const ROLE_FILTER_LABELS: Record<(typeof ROLE_FILTERS)[number], string> = {
  ALL: "Tutti",
  PORTIERE: "Portiere",
  DIFENSORE: "Difensore",
  CENTROCAMPISTA: "Centrocampista",
  ATTACCANTE: "Attaccante",
};

const MATCH_FILTERS: Array<{ id: "ALL" | ExploreMatchStatus; label: string }> = [
  { id: "ALL", label: "Tutte" },
  { id: "LIVE", label: "Live" },
  { id: "SCHEDULED", label: "Prossime" },
  { id: "FINISHED", label: "Giocate" },
];

const MATCH_STATUS_LABELS: Record<ExploreMatchStatus, string> = {
  LIVE: "In corso",
  SCHEDULED: "In programma",
  FINISHED: "Terminata",
  CANCELLED: "Annullata",
};

const matchDateFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

function formatMatchDate(iso: string) {
  return matchDateFormatter.format(new Date(iso)).replace(".", "");
}

function formatNumber(value: number) {
  return value.toLocaleString("it-IT");
}

function SchoolMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <span className={styles.mark}>
        <Image alt="" height={36} src={logoUrl} unoptimized width={36} />
      </span>
    );
  }

  return (
    <span className={styles.mark} aria-hidden="true">
      {name.slice(0, 1)}
    </span>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label className={styles.searchField}>
      <Search aria-hidden="true" size={16} />
      <input
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

function SchoolsPanel({ schools }: { schools: ExploreSchool[] }) {
  const [query, setQuery] = useState("");
  const visible = filterByQuery(schools, query, (school) => `${school.name} ${school.shortName}`);

  return (
    <section className={styles.panel} aria-labelledby="explore-scuole-title">
      <p className={styles.panelLead} id="explore-scuole-title">
        Istituti della Leonessa Cup, con punti tifoso e collegamento alla squadra.
      </p>
      {shouldShowSearch(schools.length) ? (
        <SearchField
          label="Cerca scuola"
          onChange={setQuery}
          placeholder="Cerca scuola"
          value={query}
        />
      ) : null}
      {visible.length === 0 ? (
        <EmptyState
          title="Nessuna scuola trovata"
          message={schools.length === 0 ? "Le scuole compariranno quando la Cup sarà sincronizzata." : "Prova un altro nome."}
        />
      ) : (
        <ol className={styles.directory}>
          {visible.map((school) => {
            const href = (school.teamId ? `/team/${school.teamId}` : "/ranking") as Route;
            return (
              <li key={school.id}>
                <Link
                  className={school.isCurrentSchool ? styles.directoryItemCurrent : styles.directoryItem}
                  href={href}
                >
                  <span className={styles.rank}>{String(school.rank).padStart(2, "0")}</span>
                  <SchoolMark logoUrl={school.logoUrl} name={school.shortName} />
                  <span className={styles.itemCopy}>
                    <strong>{school.shortName}</strong>
                    <span>{school.name}</span>
                  </span>
                  <strong className={styles.points}>{formatNumber(school.ssp)}</strong>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function TeamsPanel({ teams }: { teams: ExploreTeam[] }) {
  const [query, setQuery] = useState("");
  const visible = filterByQuery(teams, query, (team) => `${team.name} ${team.schoolName} ${team.schoolShortName}`);

  return (
    <section className={styles.panel} aria-labelledby="explore-squadre-title">
      <p className={styles.panelLead} id="explore-squadre-title">
        Squadre iscritte alla competizione. Apri la scheda per rosa e risultati.
      </p>
      {shouldShowSearch(teams.length) ? (
        <SearchField
          label="Cerca squadra"
          onChange={setQuery}
          placeholder="Cerca squadra o scuola"
          value={query}
        />
      ) : null}
      {visible.length === 0 ? (
        <EmptyState
          title="Nessuna squadra trovata"
          message={teams.length === 0 ? "Le squadre compariranno dopo la sincronizzazione della Cup." : "Prova un altro nome."}
        />
      ) : (
        <div className={styles.teamGrid}>
          {visible.map((team) => (
            <Link
              className={`${hubStyles.card} ${styles.teamCard} ${team.isCurrentTeam ? styles.teamCardCurrent : ""}`}
              href={`/team/${team.id}` as Route}
              key={team.id}
            >
              <div className={styles.teamTopline}>
                <SchoolMark logoUrl={team.logoUrl} name={team.schoolShortName} />
                <strong className={styles.points}>{formatNumber(team.points)} PT</strong>
              </div>
              <h3>{team.name}</h3>
              <p className={styles.record}>
                {team.schoolShortName}
                {team.matchesPlayed > 0
                  ? ` · ${team.wins}-${team.draws}-${team.losses}`
                  : " · Nessuna gara ancora"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PlayersPanel({ players }: { players: ExplorePlayer[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<(typeof ROLE_FILTERS)[number]>("ALL");
  const visible = useMemo(() => {
    const byRole = role === "ALL" ? players : players.filter((player) => player.role === role);
    return filterByQuery(byRole, query, (player) => `${player.name} ${player.school} ${player.teamName}`);
  }, [players, query, role]);

  return (
    <section className={styles.panel} aria-labelledby="explore-giocatori-title">
      <p className={styles.panelLead} id="explore-giocatori-title">
        Rosa reale della Cup. Cerca per nome, scuola o squadra.
      </p>
      <SearchField
        label="Cerca giocatore"
        onChange={setQuery}
        placeholder="Cerca giocatore, scuola o squadra"
        value={query}
      />
      <div className={styles.chips} role="tablist" aria-label="Filtro ruolo">
        {ROLE_FILTERS.map((item) => (
          <button
            className={role === item ? styles.chipActive : styles.chip}
            key={item}
            onClick={() => setRole(item)}
            type="button"
          >
            {ROLE_FILTER_LABELS[item]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title="Nessun giocatore trovato"
          message={players.length === 0 ? "I giocatori compariranno quando le rose saranno disponibili." : "Prova un altro filtro."}
        />
      ) : (
        <div className={styles.playerList}>
          {visible.map((player) => (
            <Link className={`${hubStyles.card} ${styles.playerRow}`} href={`/player/${player.id}`} key={player.id}>
              <span className={styles.jersey}>{player.jerseyNumber ?? "—"}</span>
              <span className={styles.itemCopy}>
                <strong>{player.name}</strong>
                <span>
                  {player.school} · {player.teamName}
                </span>
              </span>
              <span className={styles.meta}>{player.roleLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: ExploreMatch }) {
  const scored = match.homeScore !== null && match.awayScore !== null;
  return (
    <Link
      className={`${hubStyles.card} ${match.status === "LIVE" ? styles.matchCardLive : styles.matchCard}`}
      href={`/live/${match.id}` as Route}
    >
      <div className={styles.matchMeta}>
        <span className={match.status === "LIVE" ? styles.liveBadge : undefined}>
          {MATCH_STATUS_LABELS[match.status]}
        </span>
        <time dateTime={match.startAt}>{formatMatchDate(match.startAt)}</time>
      </div>
      <div className={styles.matchScore}>
        <strong>{match.homeTeam}</strong>
        <span>{scored ? `${match.homeScore} - ${match.awayScore}` : "VS"}</span>
        <strong>{match.awayTeam}</strong>
      </div>
      {match.venue ? <p className={styles.meta}>{match.venue}</p> : null}
    </Link>
  );
}

function MatchesPanel({ matches }: { matches: ExploreMatch[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | ExploreMatchStatus>("ALL");
  const filtered = useMemo(() => {
    const byStatus = status === "ALL" ? matches : matches.filter((match) => match.status === status);
    return filterByQuery(byStatus, query, (match) => `${match.homeTeam} ${match.awayTeam} ${match.venue ?? ""}`);
  }, [matches, query, status]);
  const grouped = groupMatches(filtered);
  const sections = [
    { id: "live", title: "In corso", items: grouped.live },
    { id: "upcoming", title: "Prossime", items: grouped.upcoming },
    { id: "finished", title: "Giocate", items: grouped.finished },
    { id: "cancelled", title: "Annullate", items: grouped.cancelled },
  ].filter((section) => section.items.length > 0);

  return (
    <section className={styles.panel} aria-labelledby="explore-partite-title">
      <p className={styles.panelLead} id="explore-partite-title">
        Calendario della Cup. Le partite live e finite aprono il dettaglio.
      </p>
      <SearchField
        label="Cerca partita"
        onChange={setQuery}
        placeholder="Cerca squadra o campo"
        value={query}
      />
      <div className={styles.chips} aria-label="Filtro stato">
        {MATCH_FILTERS.map((item) => (
          <button
            className={status === item.id ? styles.chipActive : styles.chip}
            key={item.id}
            onClick={() => setStatus(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {sections.length === 0 ? (
        <EmptyState
          title="Nessuna partita trovata"
          message={matches.length === 0 ? "Il calendario comparirà dopo la sincronizzazione della Cup." : "Prova un altro filtro."}
        />
      ) : (
        sections.map((section) => (
          <div className={styles.matchGroup} key={section.id}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            {section.items.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

function RankingsPanel({ data }: { data: ExploreData }) {
  return (
    <section className={styles.panel} aria-labelledby="explore-classifiche-title">
      <p className={styles.panelLead} id="explore-classifiche-title">
        Classifica ufficiale della Cup e top 10 LP. Il ranking completo è nella sezione Ranking.
      </p>

      {data.schoolTable.length === 0 ? (
        <EmptyState
          title="Classifica non disponibile"
          message="La classifica scuole si aggiorna dopo le prime partite."
        />
      ) : (
        <div className={styles.table} role="list">
          {data.schoolTable.map((row) => {
            const href = (row.teamId ? `/team/${row.teamId}` : "/ranking") as Route;
            return (
              <Link
                className={row.isCurrentSchool ? styles.tableRowCurrent : styles.tableRow}
                href={href}
                key={row.schoolId}
              >
                <span className={styles.rank}>{String(row.rank).padStart(2, "0")}</span>
                <span className={styles.itemCopy}>
                  <strong>{row.shortName}</strong>
                  <span>
                    {row.wins}-{row.draws}-{row.losses} · {row.matchesPlayed} gare
                  </span>
                </span>
                <strong className={styles.points}>{formatNumber(row.points)}</strong>
              </Link>
            );
          })}
        </div>
      )}

      <h3 className={styles.sectionTitle}>Top LP</h3>
      {data.userLeaders.length === 0 ? (
        <EmptyState title="Nessun ranking utenti" message="I Leonessa Point compariranno dopo le prime attività." />
      ) : (
        <div className={styles.lpList}>
          {data.userLeaders.map((entry) => (
            <div className={entry.isCurrentUser ? styles.lpRowCurrent : styles.lpRow} key={entry.id}>
              <span className={styles.rank}>{String(entry.rank).padStart(2, "0")}</span>
              <span className={styles.itemCopy}>
                <strong>{entry.name}</strong>
                <span>{entry.school}</span>
              </span>
              <strong className={styles.points}>{formatNumber(entry.lp)} LP</strong>
            </div>
          ))}
        </div>
      )}

      <Link className={styles.linkRow} href="/ranking">
        Apri Ranking completo
      </Link>
    </section>
  );
}

function PartnerPanel() {
  return (
    <section className={styles.panel} aria-labelledby="explore-partner-title">
      <article className={`${hubStyles.infoCard} ${styles.infoCard}`}>
        <span className={styles.infoIcon} aria-hidden="true">
          <Handshake size={18} />
        </span>
        <h2 id="explore-partner-title">Partner Leonessa</h2>
        <p className={hubStyles.emptyCopy}>
          I vantaggi dei partner (offerte, sconti, omaggi) non hanno ancora una fonte dati nel
          sistema. Non mostriamo schede inventate: compariranno qui quando saranno pubblicati.
        </p>
        <Link className={styles.linkRow} href={"/altro/partner" as Route}>
          Apri Partner & Vantaggi
        </Link>
      </article>
      <EmptyState
        title="Nessun partner disponibile"
        message="La sezione è predisposta. Manca il catalogo partner nel database."
      />
    </section>
  );
}

export function EsploraPage({ data }: EsploraPageProps) {
  const [category, setCategory] = useState<ExploreCategory>(() =>
    defaultExploreCategory(data.matches.some((match) => match.status === "LIVE")),
  );

  const counts: Record<ExploreCategory, number> = {
    scuole: data.schools.length,
    squadre: data.teams.length,
    giocatori: data.players.length,
    partite: data.matches.length,
    classifiche: data.schoolTable.length,
    partner: data.partnersAvailable ? 1 : 0,
  };

  return (
    <PageContainer className={hubStyles.page}>
      <HubSubheader
        kicker="Piattaforma"
        lead="Scuole, squadre, giocatori, partite e classifiche della Leonessa Cup."
        title="Esplora"
      />
      <div className={styles.shell}>
        <nav className={styles.tabs} aria-label="Categorie Esplora">
          {CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                aria-pressed={active}
                className={active ? styles.tabActive : styles.tab}
                key={item.id}
                onClick={() => setCategory(item.id)}
                type="button"
              >
                <Icon aria-hidden="true" size={15} />
                {item.label}
                <span className={styles.tabCount}>{counts[item.id]}</span>
              </button>
            );
          })}
        </nav>

        {category === "scuole" ? <SchoolsPanel schools={data.schools} /> : null}
        {category === "squadre" ? <TeamsPanel teams={data.teams} /> : null}
        {category === "giocatori" ? <PlayersPanel players={data.players} /> : null}
        {category === "partite" ? <MatchesPanel matches={data.matches} /> : null}
        {category === "classifiche" ? <RankingsPanel data={data} /> : null}
        {category === "partner" ? <PartnerPanel /> : null}
      </div>
    </PageContainer>
  );
}
