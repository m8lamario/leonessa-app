"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Circle,
  Crown,
  LockKeyhole,
  Plus,
  Search,
  Store,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { PageContainer } from "@/shared/components";
import { networkErrorMessage, readApiErrorMessage } from "../lib/market-feedback";
import {
  BUDGET_INSUFFICIENT_LABEL,
  canAffordNetTransfer,
  evaluateSellToVacancy,
  getRealTransferCost,
  getTransferFee,
  getTransfersUsed,
} from "../lib/transfer-cost";
import { FantaIcon } from "./fanta-icons";
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

type SquadPlayer = {
  id: string;
  playerId: string;
  name: string;
  school: string;
  role: string;
  status: "STARTER" | "BENCH";
  benchOrder: number | null;
  isCaptain: boolean;
  value: number;
};

type Vacancy = {
  id: string;
  role: string;
  status: "STARTER" | "BENCH";
  benchOrder: number | null;
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
    squad: SquadPlayer[];
    vacancies: Vacancy[];
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

type BuyModalState = {
  playerId: string;
  role: string;
  name: string;
};

const roleLabels: Record<string, string> = {
  PORTIERE: "POR",
  DIFENSORE: "DIF",
  CENTROCAMPISTA: "CEN",
  ATTACCANTE: "ATT",
};

const ROLE_FILTERS = ["ALL", "PORTIERE", "DIFENSORE", "CENTROCAMPISTA", "ATTACCANTE"] as const;

function readFocusRoleFromUrl(): string {
  if (typeof window === "undefined") return "ALL";
  const role = new URLSearchParams(window.location.search).get("role");
  if (role && ROLE_FILTERS.includes(role as (typeof ROLE_FILTERS)[number])) return role;
  return "ALL";
}

function initialRole(market: MarketData): string {
  const fromUrl = readFocusRoleFromUrl();
  if (fromUrl !== "ALL") return fromUrl;
  return market.team?.vacancies[0]?.role ?? "ALL";
}

export function MarketDashboard({ market }: MarketDashboardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState(() => initialRole(market));
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [buyModal, setBuyModal] = useState<BuyModalState | null>(null);
  const browseRef = useRef<HTMLElement | null>(null);
  const didAutoFocus = useRef(false);

  const isOpen = market.status.open;
  const vacancies = market.team?.vacancies ?? [];
  const openVacancy = vacancies[0] ?? null;

  const pool = useMemo(() => {
    const q = query.trim().toLowerCase();
    return market.pool.filter((player) => {
      if (role !== "ALL" && player.role !== role) return false;
      if (!q) return true;
      return player.name.toLowerCase().includes(q) || player.school.toLowerCase().includes(q);
    });
  }, [market.pool, query, role]);

  useEffect(() => {
    if (didAutoFocus.current) return;
    const shouldFocus =
      readFocusRoleFromUrl() !== "ALL" ||
      window.location.hash === "#browse" ||
      Boolean(openVacancy);
    if (!shouldFocus) return;
    didAutoFocus.current = true;
    requestAnimationFrame(() => {
      browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [openVacancy]);

  useEffect(() => {
    if (!buyModal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setBuyModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [buyModal, busy]);

  if (!market.team) return null;

  const team = market.team;
  const transfersUsed = getTransfersUsed(team.freeTransfers, team.paidTransfers);
  const nextFee = getTransferFee(transfersUsed);
  const squadForSale = team.squad.map((player) => ({
    playerId: player.playerId,
    role: player.role,
    status: player.status,
    value: player.value,
  }));
  const marketForSale = market.pool.map((player) => ({
    id: player.id,
    role: player.role,
    fantasyValue: player.fantasyValue,
  }));

  const starters = team.squad
    .filter((player) => player.status === "STARTER")
    .sort((a, b) => a.role.localeCompare(b.role));
  const starterVacancies = vacancies.filter((vacancy) => vacancy.status === "STARTER");
  const bench = team.squad
    .filter((player) => player.status === "BENCH")
    .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99));
  const benchVacancies = vacancies.filter((vacancy) => vacancy.status === "BENCH");

  function focusBrowse(nextRole: string) {
    setRole(nextRole);
    requestAnimationFrame(() => {
      browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function postJson(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(readApiErrorMessage(payload));
    }
    return payload;
  }

  async function refreshMarket(successNotice: string) {
    setNotice({ kind: "success", text: successNotice });
    router.refresh();
  }

  async function setCaptain(playerId: string) {
    if (!isOpen) return;
    setBusy(true);
    setNotice(null);
    try {
      await postJson("/api/fanta/market/captain", { playerId, replacementPlayerId: "" });
      await refreshMarket("Capitano aggiornato.");
    } catch (error) {
      setNotice({ kind: "error", text: networkErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function sellToVacancy(player: SquadPlayer) {
    if (!isOpen) return;
    const decision = evaluateSellToVacancy({
      selling: {
        playerId: player.playerId,
        role: player.role,
        status: player.status,
        value: player.value,
      },
      squad: squadForSale,
      marketPlayers: marketForSale,
      budgetLp: team.budgetLp,
      transfersUsed,
    });
    if (!decision.allowed) {
      setNotice({ kind: "error", text: decision.message });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await postJson("/api/fanta/formation", { action: "sell", playerId: player.playerId });
      focusBrowse(player.role);
      await refreshMarket("Giocatore venduto. Scegli un sostituto.");
    } catch (error) {
      setNotice({ kind: "error", text: networkErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function buyIntoVacancy(playerId: string, vacancyId: string) {
    if (!isOpen) return;
    setBusy(true);
    setNotice(null);
    try {
      await postJson("/api/fanta/formation", {
        action: "buy-vacancy",
        playerId,
        vacancyId,
      });
      setRole("ALL");
      await refreshMarket("Acquisto completato.");
    } catch (error) {
      setNotice({ kind: "error", text: networkErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function buyWithReplacement(playerId: string, replacementPlayerId: string) {
    if (!isOpen) return;
    setBusy(true);
    setNotice(null);
    try {
      await postJson("/api/fanta/market/buy", { playerId, replacementPlayerId });
      setBuyModal(null);
      await refreshMarket("Sostituzione completata.");
    } catch (error) {
      setNotice({ kind: "error", text: networkErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  function isPlayerAffordable(player: PlayerDto) {
    const cost = getRealTransferCost(player.fantasyValue, transfersUsed).total;
    if (openVacancy) {
      if (openVacancy.role !== player.role) return true;
      return team.budgetLp >= cost;
    }
    const sameRole = team.squad.filter((member) => member.role === player.role);
    if (sameRole.length === 0) return false;
    return sameRole.some((member) =>
      canAffordNetTransfer(team.budgetLp, player.fantasyValue, member.value, transfersUsed),
    );
  }

  function handleBuyClick(player: PlayerDto) {
    if (!isOpen || busy || player.owned) return;

    if (!isPlayerAffordable(player)) {
      setNotice({ kind: "error", text: BUDGET_INSUFFICIENT_LABEL });
      return;
    }

    if (openVacancy) {
      if (openVacancy.role !== player.role) {
        setNotice({
          kind: "error",
          text: `Hai uno slot ${roleLabels[openVacancy.role] ?? openVacancy.role} vuoto: completa quello prima.`,
        });
        focusBrowse(openVacancy.role);
        return;
      }
      void buyIntoVacancy(player.id, openVacancy.id);
      return;
    }

    setBuyModal({
      playerId: player.id,
      role: player.role,
      name: player.name,
    });
  }

  const modalCandidates = buyModal
    ? team.squad.filter((player) => player.role === buyModal.role)
    : [];
  const modalBuyCost = buyModal
    ? getRealTransferCost(
        market.pool.find((player) => player.id === buyModal.playerId)?.fantasyValue ?? 0,
        transfersUsed,
      )
    : null;

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Mercato</p>
          <h1>Mercato</h1>
        </div>
      </header>

      <MarketStatusCard status={market.status} />

      {notice && (
        <p className={notice.kind === "error" ? styles.noticeError : styles.notice} role="status">
          {notice.text}
        </p>
      )}

      <section className={styles.walletCard} aria-label="Risorse disponibili">
        <div className={styles.walletMain}>
          <p className={styles.kicker}>A tua disposizione</p>
          <strong className={styles.budget}>
            {team.budgetLp.toLocaleString("it-IT")} LP
          </strong>
          <small>
            {team.freeTransfers} / 2 cambi gratuiti · {team.paidTransfers} a pagamento
            {nextFee > 0 ? " · prossimo cambio +10 LP" : ""}
          </small>
        </div>
        <div className={styles.walletPoints}>
          <span>Punti totali</span>
          <b>{team.totalPoints.toLocaleString("it-IT")}</b>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="squad-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>La tua rosa</p>
            <h2 id="squad-title">Titolari</h2>
          </div>
          <span>
            {starters.length}/11
            {starterVacancies.length > 0 ? ` · ${starterVacancies.length} vuoti` : ""}
          </span>
        </div>
        <div className={styles.squadList}>
          {starters.map((player) => (
            <SquadCard
              key={player.id}
              busy={busy}
              isOpen={isOpen}
              player={player}
              onCaptain={() => void setCaptain(player.playerId)}
              onSell={() => void sellToVacancy(player)}
            />
          ))}
          {starterVacancies.map((vacancy) => (
            <EmptySlotCard
              key={vacancy.id}
              role={vacancy.role}
              onAdd={() => focusBrowse(vacancy.role)}
            />
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="bench-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Panchina</p>
            <h2 id="bench-title">Riserve</h2>
          </div>
          <span>
            {bench.length}/4
            {benchVacancies.length > 0 ? ` · ${benchVacancies.length} vuoti` : ""}
          </span>
        </div>
        <div className={styles.squadList}>
          {bench.map((player) => (
            <SquadCard
              key={player.id}
              busy={busy}
              isOpen={isOpen}
              player={player}
              showCaptain={false}
              onSell={() => void sellToVacancy(player)}
            />
          ))}
          {benchVacancies.map((vacancy) => (
            <EmptySlotCard
              key={vacancy.id}
              role={vacancy.role}
              onAdd={() => focusBrowse(vacancy.role)}
            />
          ))}
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="browse-title"
        id="browse"
        ref={browseRef}
      >
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Acquista</p>
            <h2 id="browse-title">Giocatori</h2>
          </div>
          <Store aria-hidden="true" size={20} />
        </div>

        {openVacancy && (
          <p className={styles.vacancyHint} role="status">
            Slot {roleLabels[openVacancy.role] ?? openVacancy.role} da riempire · filtro già
            impostato
          </p>
        )}

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
            {ROLE_FILTERS.map((r) => (
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
          {pool.map((player) => {
            const cost = getRealTransferCost(player.fantasyValue, transfersUsed);
            const unaffordable = !player.owned && !isPlayerAffordable(player);
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isOpen={isOpen}
                busy={busy}
                cost={cost.total}
                fee={cost.fee}
                unaffordable={unaffordable}
                onBuy={() => handleBuyClick(player)}
              />
            );
          })}
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

      {buyModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => !busy && setBuyModal(null)}
          role="presentation"
        >
          <div
            aria-labelledby="buy-modal-title"
            aria-modal="true"
            className={styles.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <button
              aria-label="Chiudi"
              className={styles.modalClose}
              disabled={busy}
              onClick={() => setBuyModal(null)}
              type="button"
            >
              <X size={18} />
            </button>
            <h2 id="buy-modal-title">Rosa completa</h2>
            <p className={styles.modalCopy}>
              Per acquistare <strong>{buyModal.name}</strong> devi prima scegliere quale giocatore
              vendere.
              {modalBuyCost && modalBuyCost.fee > 0
                ? ` Costo reale: ${modalBuyCost.total} LP (valore ${modalBuyCost.playerValue} + commissione ${modalBuyCost.fee}).`
                : modalBuyCost
                  ? ` Costo: ${modalBuyCost.total} LP.`
                  : ""}
            </p>
            <p className={styles.modalRole}>
              Ruolo: {roleLabels[buyModal.role] ?? buyModal.role}
            </p>
            <div className={styles.modalOptions}>
              {modalCandidates.map((player) => {
                const canSwap =
                  !modalBuyCost ||
                  canAffordNetTransfer(
                    team.budgetLp,
                    modalBuyCost.playerValue,
                    player.value,
                    transfersUsed,
                  );
                return (
                  <button
                    className={styles.modalOption}
                    disabled={busy || !canSwap}
                    key={player.id}
                    onClick={() => {
                      if (!canSwap) {
                        setNotice({ kind: "error", text: BUDGET_INSUFFICIENT_LABEL });
                        return;
                      }
                      void buyWithReplacement(buyModal.playerId, player.playerId);
                    }}
                    type="button"
                  >
                    <span className={styles.squadRole}>
                      {roleLabels[player.role] ?? player.role}
                    </span>
                    <div className={styles.modalOptionMain}>
                      <strong>{player.name}</strong>
                      <small>
                        {player.school} · {player.value} LP
                        {player.status === "BENCH" ? " · Riserva" : ""}
                        {player.isCaptain ? " · Capitano" : ""}
                        {!canSwap ? ` · ${BUDGET_INSUFFICIENT_LABEL}` : ""}
                      </small>
                    </div>
                    <span className={styles.modalSelectLabel}>
                      {canSwap ? "Seleziona" : BUDGET_INSUFFICIENT_LABEL}
                    </span>
                  </button>
                );
              })}
              {modalCandidates.length === 0 && (
                <p className={styles.emptyPool}>Nessun giocatore dello stesso ruolo in rosa.</p>
              )}
            </div>
            <button
              className={styles.modalCancel}
              disabled={busy}
              onClick={() => setBuyModal(null)}
              type="button"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function SquadCard({
  player,
  isOpen,
  busy,
  onSell,
  onCaptain,
  showCaptain = true,
}: {
  player: SquadPlayer;
  isOpen: boolean;
  busy: boolean;
  onSell: () => void;
  onCaptain?: () => void;
  showCaptain?: boolean;
}) {
  return (
    <article className={styles.squadCard}>
      <div className={styles.squadBody}>
        <div className={styles.squadIdentity}>
          <span className={styles.squadRole}>{roleLabels[player.role] ?? player.role}</span>
          <div className={styles.squadText}>
            <strong>
              {player.name}
              {player.isCaptain && (
                <Crown aria-label="Capitano" className={styles.crownInline} size={13} />
              )}
            </strong>
            <small>
              {player.school} · {player.value} LP
            </small>
          </div>
        </div>
        {isOpen && (
          <div className={styles.squadActions}>
            <button className={styles.sellButton} disabled={busy} onClick={onSell} type="button">
              Vendi
            </button>
            {showCaptain &&
              (player.isCaptain ? (
                <span className={styles.captainTag}>
                  <Crown size={12} /> Cap.
                </span>
              ) : (
                <button
                  className={styles.captainButton}
                  disabled={busy}
                  onClick={onCaptain}
                  type="button"
                >
                  Capitano
                </button>
              ))}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptySlotCard({ role, onAdd }: { role: string; onAdd: () => void }) {
  return (
    <button className={styles.emptySlotCard} onClick={onAdd} type="button">
      <span className={styles.squadRole}>{roleLabels[role] ?? role}</span>
      <span className={styles.emptySlotMain}>
        <Plus aria-hidden="true" size={18} />
        <strong>Aggiungi giocatore</strong>
      </span>
    </button>
  );
}

function MarketStatusCard({ status }: { status: MarketWindow }) {
  const open = status.open;
  return (
    <section className={open ? styles.statusOpen : styles.statusClosed} aria-label="Stato mercato">
      {open ? (
        <span className={styles.statusLight}>
          <Circle aria-hidden="true" fill="currentColor" size={10} />
        </span>
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
            : "Formazione e mercato bloccati fino a fine giornata"}
        </small>
      </div>
    </section>
  );
}

function PlayerCard({
  player,
  isOpen,
  busy,
  cost,
  fee,
  unaffordable,
  onBuy,
}: {
  player: PlayerDto;
  isOpen: boolean;
  busy: boolean;
  cost: number;
  fee: number;
  unaffordable: boolean;
  onBuy: () => void;
}) {
  const badgeIcons: Record<string, string> = {
    trending: "trending-up",
    falling: "trending-down",
    deal: "gem",
    top: "flame",
  };
  return (
    <article
      className={
        player.owned
          ? styles.playerOwned
          : unaffordable
            ? styles.playerUnaffordable
            : styles.playerCard
      }
    >
      <span className={styles.poolRole}>{roleLabels[player.role] ?? player.role}</span>
      <div className={styles.playerMain}>
        <Link className={styles.playerLink} href={`/player/${player.id}` as never}>
          {player.name}
        </Link>
        <small>
          {player.school} · {player.fantasyValue} LP
          {fee > 0 ? ` + ${fee} comm.` : ""}
          {player.change !== 0 && (
            <span className={player.change > 0 ? styles.positive : styles.negative}>
              {" "}
              {player.change > 0 ? "+" : ""}
              {player.change}
            </span>
          )}
          {player.badge && (
            <>
              {" · "}
              <FantaIcon
                className={styles.badgeIcon}
                name={badgeIcons[player.badge] ?? "star"}
                size={12}
              />
            </>
          )}
        </small>
        {unaffordable && <small className={styles.unaffordableReason}>{BUDGET_INSUFFICIENT_LABEL}</small>}
      </div>
      <div className={styles.playerChange}>
        {player.change !== 0 &&
          (player.change > 0 ? (
            <ArrowUpRight aria-hidden="true" size={14} />
          ) : (
            <ArrowDownRight aria-hidden="true" size={14} />
          ))}
      </div>
      {player.owned ? (
        <span className={styles.ownedTag}>In rosa</span>
      ) : (
        <button
          className={styles.buyButton}
          disabled={!isOpen || busy || unaffordable}
          onClick={onBuy}
          type="button"
        >
          {unaffordable ? BUDGET_INSUFFICIENT_LABEL : `${cost} LP`}
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
