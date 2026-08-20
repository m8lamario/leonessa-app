"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  LockKeyhole,
  Search,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { PageContainer } from "@/shared/components";
import styles from "./market-dashboard.module.css";

type MarketWindow = {
  open: boolean;
  closesAt: string | null;
  nextKickoff: string | null;
};

type PlayerDto = {
  id: string;
  name: string;
  school: string;
  role: string;
  fantasyValue: number;
  change: number;
  trend: "up" | "down" | "flat";
  owned: boolean;
  badge: "trending" | "falling" | "deal" | "top" | null;
};

type MarketData = {
  status: MarketWindow;
  team: {
    id: string;
    name: string;
    budgetLp: number;
    totalPoints: number;
    freeTransfers: number;
    paidTransfers: number;
    squad: Array<{
      id: string;
      playerId: string;
      name: string;
      school: string;
      role: string;
      isCaptain: boolean;
      value: number;
    }>;
  } | null;
  pool: PlayerDto[];
  trending: { rising: PlayerDto[]; falling: PlayerDto[] };
  history: Array<{
    playerId: string;
    name: string;
    school: string;
    oldValue: number;
    newValue: number;
    createdAt: string;
  }>;
};

type MarketDashboardProps = { market: MarketData };

const roleLabels: Record<string, string> = {
  PORTIERE: "POR",
  DIFENSORE: "DIF",
  CENTROCAMPISTA: "CEN",
  ATTACCANTE: "ATT",
};

export function MarketDashboard({ market }: MarketDashboardProps) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("ALL");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replacementRequest, setReplacementRequest] = useState<{
    action: "buy" | "sell";
    playerId: string;
    role: string;
    name: string;
  } | null>(null);

  const isOpen = market.status.open;

  const pool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return market.pool.filter((player) => {
      if (role !== "ALL" && player.role !== role) return false;
      if (!q) return true;
      return player.name.toLowerCase().includes(q) || player.school.toLowerCase().includes(q);
    });
  }, [market.pool, query, role]);

  if (!market.team) return null;

  async function act(path: "buy" | "sell" | "captain", playerId: string, replacementPlayerId = "") {
    if (!isOpen) return;
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/fanta/market/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, replacementPlayerId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setNotice(body.message ?? "Operazione non riuscita.");
        return;
      }
      setNotice(path === "captain" ? "Capitano aggiornato." : "Sostituzione completata.");
      setReplacementRequest(null);
      window.location.reload();
    } catch {
      setNotice("Errore di rete. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Mercato</p>
          <h1>Mercato</h1>
        </div>
        <div className={styles.headerStat}>
          <span>Budget</span>
          <strong>{market.team.budgetLp} LP</strong>
        </div>
      </header>

      <MarketStatusCard status={market.status} />

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {replacementRequest && (
        <section className={styles.replacementCard} aria-label="Scegli il giocatore da sostituire">
          <div>
            <p className={styles.kicker}>Sostituzione obbligatoria</p>
            <h2>
              {replacementRequest.action === "buy" ? "Chi vuoi sostituire?" : "Chi vuoi inserire?"}
            </h2>
            <p>Ruolo: {roleLabels[replacementRequest.role] ?? replacementRequest.role}</p>
          </div>
          <div className={styles.replacementOptions}>
            {(replacementRequest.action === "buy"
              ? market.team.squad.filter((player) => player.role === replacementRequest.role)
              : market.pool.filter(
                  (player) => player.role === replacementRequest.role && !player.owned,
                )
            ).map((player) => {
              const id = "playerId" in player ? player.playerId : player.id;
              return (
                <button
                  className={styles.replacementOption}
                  disabled={busy}
                  key={id}
                  onClick={() =>
                    void act(replacementRequest.action, replacementRequest.playerId, id)
                  }
                  type="button"
                >
                  <strong>{player.name}</strong>
                  <small>
                    {player.school} · {"value" in player ? player.value : player.fantasyValue} LP
                  </small>
                </button>
              );
            })}
          </div>
          <button
            className={styles.cancelReplacement}
            onClick={() => setReplacementRequest(null)}
            type="button"
          >
            Annulla
          </button>
        </section>
      )}

      <section className={styles.walletCard} aria-label="Risorse disponibili">
        <div className={styles.walletMain}>
          <p className={styles.kicker}>A tua disposizione</p>
          <strong className={styles.budget}>
            {market.team.budgetLp.toLocaleString("it-IT")} LP
          </strong>
          <small>
            {market.team.freeTransfers} / 2 cambi gratuiti · {market.team.paidTransfers} a pagamento
          </small>
        </div>
        <div className={styles.walletPoints}>
          <span>Punti totali</span>
          <b>{market.team.totalPoints.toLocaleString("it-IT")}</b>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="squad-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>La tua rosa</p>
            <h2 id="squad-title">Titolari</h2>
          </div>
          <span>{market.team.squad.length}/11</span>
        </div>
        <div className={styles.squadGrid}>
          {market.team.squad.map((player) => (
            <article className={styles.squadCard} key={player.id}>
              <div className={styles.squadTop}>
                <span className={styles.squadRole}>{roleLabels[player.role] ?? player.role}</span>
                {player.isCaptain && (
                  <Crown aria-label="Capitano" className={styles.crown} size={15} />
                )}
              </div>
              <strong>{player.name}</strong>
              <small>
                {player.school} · {player.value} LP
              </small>
              {isOpen && (
                <div className={styles.squadActions}>
                  <button
                    className={styles.sellButton}
                    disabled={busy}
                    onClick={() =>
                      setReplacementRequest({
                        action: "sell",
                        playerId: player.playerId,
                        role: player.role,
                        name: player.name,
                      })
                    }
                    type="button"
                  >
                    Vendi
                  </button>
                  {player.isCaptain ? (
                    <span className={styles.captainTag}>
                      <Crown size={12} /> Capitano
                    </span>
                  ) : (
                    <button
                      className={styles.captainButton}
                      disabled={busy}
                      onClick={() => act("captain", player.playerId)}
                      type="button"
                    >
                      Capitano
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="browse-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Acquista</p>
            <h2 id="browse-title">Giocatori</h2>
          </div>
          <Store aria-hidden="true" size={20} />
        </div>

        <div className={styles.controls}>
          <label className={styles.searchField}>
            <Search aria-hidden="true" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca giocatore o scuola"
            />
          </label>
          <div className={styles.roleFilter}>
            {["ALL", "PORTIERE", "DIFENSORE", "CENTROCAMPISTA", "ATTACCANTE"].map((r) => (
              <button
                className={role === r ? styles.roleActive : undefined}
                key={r}
                onClick={() => setRole(r)}
                type="button"
              >
                {r === "ALL" ? "Tutti" : roleLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.playerList}>
          {pool.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isOpen={isOpen}
              busy={busy}
              onBuy={() =>
                setReplacementRequest({
                  action: "buy",
                  playerId: player.id,
                  role: player.role,
                  name: player.name,
                })
              }
            />
          ))}
          {pool.length === 0 && <p className={styles.emptyPool}>Nessun giocatore trovato.</p>}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trending-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Trending</p>
            <h2 id="trending-title">Da tenere d&apos;occhio</h2>
          </div>
        </div>
        <div className={styles.trendRow}>
          <div className={styles.trendCol}>
            <span className={styles.trendHead}>
              <TrendingUp aria-hidden="true" size={14} /> In crescita
            </span>
            {market.trending.rising.map((player) => (
              <PlayerMini key={player.id} player={player} />
            ))}
          </div>
          <div className={styles.trendCol}>
            <span className={styles.trendHead}>
              <TrendingDown aria-hidden="true" size={14} /> In calo
            </span>
            {market.trending.falling.map((player) => (
              <PlayerMini key={player.id} player={player} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="history-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Storico</p>
            <h2 id="history-title">Variazioni valore</h2>
          </div>
        </div>
        <div className={styles.historyList}>
          {market.history.map((entry) => {
            const gained = entry.newValue > entry.oldValue;
            return (
              <article className={styles.historyCard} key={`${entry.playerId}-${entry.createdAt}`}>
                <div>
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.school} · {new Date(entry.createdAt).toLocaleDateString("it-IT")}
                  </small>
                </div>
                <b className={gained ? styles.positive : styles.negative}>
                  {gained ? "+" : ""}
                  {entry.newValue - entry.oldValue} LP
                </b>
                <span>
                  {entry.oldValue} → {entry.newValue}
                </span>
              </article>
            );
          })}
        </div>
      </section>
    </PageContainer>
  );
}

function MarketStatusCard({ status }: { status: MarketWindow }) {
  const open = status.open;
  return (
    <section className={open ? styles.statusOpen : styles.statusClosed} aria-label="Stato mercato">
      {open ? (
        <span className={styles.statusLight}>🟢</span>
      ) : (
        <LockKeyhole aria-hidden="true" size={16} />
      )}
      <div>
        <strong>{open ? "Mercato aperto" : "Mercato chiuso"}</strong>
        <small>
          {open
            ? status.closesAt
              ? `Chiude ${new Date(status.closesAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
              : "Aperto fino al prossimo turno"
            : "Riapre al termine della giornata"}
        </small>
      </div>
    </section>
  );
}

function PlayerCard({
  player,
  isOpen,
  busy,
  onBuy,
}: {
  player: PlayerDto;
  isOpen: boolean;
  busy: boolean;
  onBuy: () => void;
}) {
  const badgeLabel: Record<string, string> = {
    trending: "📈 In crescita",
    falling: "📉 In calo",
    deal: "💎 Affare",
    top: "🔥 Molto acquistato",
  };
  return (
    <article className={player.owned ? styles.playerOwned : styles.playerCard}>
      <div className={styles.playerHead}>
        <span className={styles.avatar}>{player.name.slice(0, 1)}</span>
        <div className={styles.playerMain}>
          <Link className={styles.playerLink} href={`/player/${player.id}` as never}>
            {player.name}
          </Link>
          <small>
            {player.school} · {roleLabels[player.role] ?? player.role}
          </small>
        </div>
      </div>
      <div className={styles.playerChange}>
        {player.change !== 0 && (
          <>
            {player.change > 0 ? (
              <ArrowUpRight aria-hidden="true" size={14} />
            ) : (
              <ArrowDownRight aria-hidden="true" size={14} />
            )}
            <b className={player.change > 0 ? styles.positive : styles.negative}>
              {player.change > 0 ? "+" : ""}
              {player.change}
            </b>
          </>
        )}
      </div>
      {player.badge && <span className={styles.dealBadge}>{badgeLabel[player.badge]}</span>}
      {player.owned ? (
        <span className={styles.ownedTag}>In rosa</span>
      ) : (
        <button
          className={styles.buyButton}
          disabled={!isOpen || busy}
          onClick={onBuy}
          type="button"
        >
          {player.fantasyValue} LP · Acquista
        </button>
      )}
    </article>
  );
}

function PlayerMini({ player }: { player: PlayerDto }) {
  return (
    <div className={styles.mini}>
      <div>
        <strong>{player.name}</strong>
        <small>
          {player.school} · {player.fantasyValue} LP
        </small>
      </div>
      {player.change > 0 && <b className={styles.positive}>+{player.change}</b>}
      {player.change < 0 && <b className={styles.negative}>{player.change}</b>}
    </div>
  );
}
