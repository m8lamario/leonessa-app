"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, m, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Crown,
  LockKeyhole,
  Plus,
  RefreshCw,
  Shield,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type PointerEvent } from "react";

import * as haptics from "@/shared/lib/haptics/haptics";
import type { FantasyRole } from "../types";
import styles from "./lineup-experience.module.css";

type LineupStatus = {
  open: boolean;
  closesAt: string | null;
  nextKickoff: string | null;
};

export type LineupPlayer = {
  id: string;
  playerId: string;
  name: string;
  school: string;
  role: string;
  status: "STARTER" | "BENCH";
  benchOrder: number | null;
  isCaptain: boolean;
  value: number;
  totalPoints: number;
};

export type LineupVacancy = {
  id: string;
  role: string;
  status: "STARTER" | "BENCH";
  benchOrder: number | null;
};

export type LineupExperienceData = {
  status: LineupStatus;
  lineup: { round: number; confirmedAt: string | null };
  team: {
    id: string;
    name: string;
    budgetLp: number;
    squad: LineupPlayer[];
    vacancies: LineupVacancy[];
  } | null;
  pool: Array<{
    id: string;
    name: string;
    school: string;
    role: string;
    fantasyValue: number;
    owned: boolean;
  }>;
};

type SelectedPlayer = LineupPlayer;

const formation: Array<{ role: FantasyRole; count: number }> = [
  { role: "ATTACCANTE", count: 3 },
  { role: "CENTROCAMPISTA", count: 3 },
  { role: "DIFENSORE", count: 4 },
  { role: "PORTIERE", count: 1 },
];

const roleLabels: Record<string, string> = {
  PORTIERE: "POR",
  DIFENSORE: "DIF",
  CENTROCAMPISTA: "CEN",
  ATTACCANTE: "ATT",
};

const noPlayers: LineupPlayer[] = [];
const noVacancies: LineupVacancy[] = [];

export function LineupExperience({ lineup }: { lineup: LineupExperienceData }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);
  const [swapStarter, setSwapStarter] = useState<LineupPlayer | null>(null);
  const [activeVacancy, setActiveVacancy] = useState<LineupVacancy | null>(null);
  const [draggingBenchId, setDraggingBenchId] = useState<string | null>(null);
  const pointerStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const team = lineup.team;
  const players = team?.squad ?? noPlayers;
  const vacancies = team?.vacancies ?? noVacancies;
  const starters = useMemo(
    () => players.filter((player) => player.status === "STARTER"),
    [players],
  );
  const bench = useMemo(
    () =>
      players
        .filter((player) => player.status === "BENCH")
        .sort((a, b) => (a.benchOrder ?? 99) - (b.benchOrder ?? 99)),
    [players],
  );
  const captain = starters.find((player) => player.isCaptain);
  const isValid =
    starters.length === 11 && bench.length === 4 && vacancies.length === 0 && Boolean(captain);
  const isOpen = lineup.status.open;
  const confirmed = Boolean(lineup.lineup.confirmedAt);

  async function request(
    body: Record<string, string | string[]>,
    successMessage: string,
    endpoint = "/api/fanta/formation",
  ) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setNotice(payload.message ?? "Operazione non riuscita. Riprova.");
        void haptics.error();
        return;
      }

      setSelected(null);
      setSwapStarter(null);
      setActiveVacancy(null);
      setNotice(successMessage);
      void haptics.success();
      router.refresh();
    } catch {
      setNotice("Errore di rete. Riprova.");
      void haptics.error();
    } finally {
      setBusy(false);
    }
  }

  function swap(starterPlayerId: string, benchPlayerId: string) {
    void request({ action: "swap", starterPlayerId, benchPlayerId }, "Formazione aggiornata.");
  }

  function reorderBench(playerId: string, direction: -1 | 1) {
    const currentIndex = bench.findIndex((player) => player.playerId === playerId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= bench.length) return;

    const ordered = bench.map((player) => player.playerId);
    const [moved] = ordered.splice(currentIndex, 1);
    ordered.splice(targetIndex, 0, moved!);
    void request(
      { action: "reorder-bench", orderedBenchPlayerIds: ordered },
      "Ordine panchina aggiornato.",
    );
  }

  function handleBenchPointerDown(event: PointerEvent<HTMLDivElement>, playerId: string) {
    if (!isOpen || busy) return;
    pointerStart.current = { id: playerId, x: event.clientX, y: event.clientY };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBenchPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return;
    didDrag.current = true;
    setDraggingBenchId(start.id);
  }

  function handleBenchPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    setDraggingBenchId(null);
    if (!start || !didDrag.current) return;

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-starter-player-id]");
    const starterPlayerId = target?.dataset.starterPlayerId;
    const benchPlayer = bench.find((player) => player.playerId === start.id);
    const starter = starters.find((player) => player.playerId === starterPlayerId);
    if (starter && benchPlayer && starter.role === benchPlayer.role) {
      swap(starter.playerId, benchPlayer.playerId);
    } else {
      setNotice("Puoi scambiare solo giocatori con lo stesso ruolo.");
      void haptics.warning();
    }
  }

  if (!team) return null;

  return (
    <section className={styles.experience} aria-labelledby="lineup-title">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fanta Leonessa · Giornata {lineup.lineup.round}</p>
          <h2 id="lineup-title">La tua formazione</h2>
        </div>
        <div className={styles.budget}>
          <span>Budget</span>
          <strong>{team.budgetLp} LP</strong>
        </div>
      </header>

      <div className={isOpen ? styles.statusOpen : styles.statusClosed}>
        {isOpen ? (
          <CheckCircle2 aria-hidden="true" size={18} />
        ) : (
          <LockKeyhole aria-hidden="true" size={18} />
        )}
        <div>
          <strong>
            {isOpen ? (isValid ? "Formazione valida" : "Rosa incompleta") : "Formazione bloccata"}
          </strong>
          <small>
            {isOpen
              ? lineup.status.closesAt
                ? `Chiude ${new Date(lineup.status.closesAt).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Mercato aperto fino al prossimo turno"
              : "Mercato e formazione si riapriranno a fine giornata."}
          </small>
        </div>
      </div>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      <LayoutGroup>
        <div className={styles.pitch} aria-label="Formazione 4-3-3">
          <div className={styles.formationLabel}>4-3-3</div>
          {formation.map(({ role, count }) => {
            const rolePlayers = starters.filter((player) => player.role === role);
            const vacancy = vacancies.find(
              (item) => item.role === role && item.status === "STARTER",
            );
            return (
              <div className={styles.pitchRow} key={role}>
                {Array.from({ length: count }, (_, index) => {
                  const player = rolePlayers[index];
                  if (player) {
                    return (
                      <m.button
                        className={styles.playerCard}
                        data-starter-player-id={player.playerId}
                        disabled={busy}
                        key={player.id}
                        layout={!reduceMotion}
                        onClick={() => {
                          if (didDrag.current) {
                            didDrag.current = false;
                            return;
                          }
                          setSelected(player);
                        }}
                        type="button"
                      >
                        <PlayerCardContent player={player} />
                      </m.button>
                    );
                  }
                  if (vacancy && index === rolePlayers.length) {
                    return (
                      <EmptySlot
                        disabled={!isOpen || busy}
                        key={vacancy.id}
                        onClick={() => setActiveVacancy(vacancy)}
                        role={vacancy.role}
                      />
                    );
                  }
                  return (
                    <div
                      aria-hidden="true"
                      className={styles.unavailableSlot}
                      key={`${role}-${index}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        <section className={styles.benchSection} aria-labelledby="bench-title">
          <div className={styles.benchHeading}>
            <div>
              <p className={styles.kicker}>Panchina</p>
              <h3 id="bench-title">Riserve</h3>
            </div>
            <span>{bench.length}/4</span>
          </div>
          <div className={styles.bench}>
            {bench.map((player, index) => (
              <m.div
                className={
                  draggingBenchId === player.playerId ? styles.benchCardDragging : styles.benchCard
                }
                key={player.id}
                layout={!reduceMotion}
                onClick={() => {
                  if (didDrag.current) {
                    didDrag.current = false;
                    return;
                  }
                  setSelected(player);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(player);
                  }
                }}
                onPointerDown={(event) => handleBenchPointerDown(event, player.playerId)}
                onPointerMove={handleBenchPointerMove}
                onPointerUp={handleBenchPointerUp}
                role="button"
                tabIndex={busy ? -1 : 0}
              >
                <span className={styles.benchNumber}>R{index + 1}</span>
                <span className={styles.benchName}>{player.name}</span>
                <small>{roleLabels[player.role] ?? player.role}</small>
                <b>{player.totalPoints}</b>
                {isOpen && (
                  <span className={styles.benchOrderActions} aria-label="Cambia priorità riserva">
                    <button
                      aria-label="Alza priorità"
                      onClick={(event) => {
                        event.stopPropagation();
                        reorderBench(player.playerId, -1);
                      }}
                      type="button"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      aria-label="Abbassa priorità"
                      onClick={(event) => {
                        event.stopPropagation();
                        reorderBench(player.playerId, 1);
                      }}
                      type="button"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </span>
                )}
              </m.div>
            ))}
            {vacancies
              .filter((vacancy) => vacancy.status === "BENCH")
              .map((vacancy) => (
                <EmptySlot
                  compact
                  disabled={!isOpen || busy}
                  key={vacancy.id}
                  onClick={() => setActiveVacancy(vacancy)}
                  role={vacancy.role}
                />
              ))}
          </div>
          {isOpen && (
            <p className={styles.dragHint}>
              Trascina una riserva su un titolare dello stesso ruolo.
            </p>
          )}
        </section>
      </LayoutGroup>

      {swapStarter && (
        <section className={styles.selectionPanel} aria-label="Sostituisci titolare">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>Sostituisci</p>
              <h3>Chi entra al posto di {swapStarter.name}?</h3>
            </div>
            <button onClick={() => setSwapStarter(null)} type="button">
              <X size={18} />
            </button>
          </div>
          <div className={styles.choiceList}>
            {bench
              .filter((player) => player.role === swapStarter.role)
              .map((player) => (
                <button
                  disabled={busy}
                  key={player.id}
                  onClick={() => swap(swapStarter.playerId, player.playerId)}
                  type="button"
                >
                  <span>
                    <b>{player.name}</b>
                    <small>
                      {player.school} · {roleLabels[player.role]}
                    </small>
                  </span>
                  <strong>Entra</strong>
                </button>
              ))}
          </div>
        </section>
      )}

      {activeVacancy && (
        <section className={styles.selectionPanel} aria-label="Completa lo slot vuoto">
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>Slot {roleLabels[activeVacancy.role]}</p>
              <h3>Completa la formazione</h3>
            </div>
            <button onClick={() => setActiveVacancy(null)} type="button">
              <X size={18} />
            </button>
          </div>
          {activeVacancy.status === "STARTER" &&
            bench
              .filter((player) => player.role === activeVacancy.role)
              .map((player) => (
                <button
                  className={styles.promoteReserve}
                  disabled={busy || !isOpen}
                  key={player.id}
                  onClick={() =>
                    void request(
                      {
                        action: "promote-bench",
                        benchPlayerId: player.playerId,
                        vacancyId: activeVacancy.id,
                      },
                      `${player.name} entra tra i titolari.`,
                    )
                  }
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={16} />
                  Usa la riserva {player.name}
                </button>
              ))}
          <p className={styles.poolTitle}>
            <ShoppingBag aria-hidden="true" size={15} /> Mercato · {team.budgetLp} LP disponibili
          </p>
          <div className={styles.choiceList}>
            {lineup.pool
              .filter((player) => player.role === activeVacancy.role && !player.owned)
              .map((player) => (
                <button
                  disabled={busy || !isOpen || player.fantasyValue > team.budgetLp}
                  key={player.id}
                  onClick={() =>
                    void request(
                      { action: "buy-vacancy", playerId: player.id, vacancyId: activeVacancy.id },
                      `${player.name} è entrato in rosa.`,
                    )
                  }
                  type="button"
                >
                  <span>
                    <b>{player.name}</b>
                    <small>
                      {player.school} · {roleLabels[player.role]}
                    </small>
                  </span>
                  <strong>{player.fantasyValue} LP</strong>
                </button>
              ))}
          </div>
        </section>
      )}

      <footer className={styles.confirmation}>
        <div>
          {confirmed ? (
            <Shield aria-hidden="true" size={19} />
          ) : (
            <CheckCircle2 aria-hidden="true" size={19} />
          )}
          <span>
            <strong>
              {confirmed
                ? "Formazione confermata"
                : isValid
                  ? "Formazione valida"
                  : "Completa la rosa"}
            </strong>
            <small>
              {confirmed
                ? "Pronta per la giornata."
                : isValid
                  ? "11 titolari + 4 riserve"
                  : "Non puoi confermare con slot vuoti."}
            </small>
          </span>
        </div>
        <button
          disabled={busy || !isOpen || !isValid}
          onClick={() =>
            void request({ action: "confirm" }, "Formazione confermata per la giornata.")
          }
          type="button"
        >
          {confirmed ? "Confermata" : "Conferma formazione"}
        </button>
      </footer>

      <AnimatePresence>
        {selected && (
          <m.div
            animate={{ opacity: 1, y: 0 }}
            className={styles.actionSheet}
            exit={{ opacity: 0, y: 22 }}
            initial={{ opacity: 0, y: 22 }}
            role="dialog"
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
          >
            <div className={styles.actionSheetHeader}>
              <div>
                <span className={styles.avatar}>{selected.name.slice(0, 1)}</span>
                <div>
                  <strong>{selected.name}</strong>
                  <small>
                    {selected.school} · {roleLabels[selected.role]}
                  </small>
                </div>
              </div>
              <button
                aria-label="Chiudi azioni giocatore"
                onClick={() => setSelected(null)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.actionGrid}>
              <Link href={`/player/${selected.playerId}` as never}>
                <UserRound size={17} /> Profilo
              </Link>
              {selected.status === "STARTER" && (
                <button
                  disabled={!isOpen || busy}
                  onClick={() => {
                    setSwapStarter(selected);
                    setSelected(null);
                  }}
                  type="button"
                >
                  <RefreshCw size={17} /> Sostituisci
                </button>
              )}
              {selected.status === "STARTER" && !selected.isCaptain && (
                <button
                  disabled={!isOpen || busy}
                  onClick={() =>
                    void request(
                      { playerId: selected.playerId },
                      `${selected.name} è il nuovo capitano.`,
                      "/api/fanta/market/captain",
                    )
                  }
                  type="button"
                >
                  <Crown size={17} /> Capitano
                </button>
              )}
              <button
                className={styles.sellAction}
                disabled={!isOpen || busy}
                onClick={() =>
                  void request(
                    { action: "sell", playerId: selected.playerId },
                    `${selected.name} è stato venduto: completa lo slot.`,
                  )
                }
                type="button"
              >
                <X size={17} /> Vendi
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PlayerCardContent({ player }: { player: LineupPlayer }) {
  return (
    <>
      <span className={styles.avatar}>{player.name.slice(0, 1)}</span>
      {player.isCaptain && (
        <span className={styles.captainBadge} aria-label="Capitano">
          C
        </span>
      )}
      <strong>{player.name}</strong>
      <small>{roleLabels[player.role] ?? player.role}</small>
      <span className={styles.cardStats}>
        <b>{player.totalPoints} pt</b>
        <i>{player.value} LP</i>
      </span>
    </>
  );
}

function EmptySlot({
  role,
  disabled,
  compact = false,
  onClick,
}: {
  role: string;
  disabled: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.button
      className={compact ? styles.emptyBenchSlot : styles.emptySlot}
      disabled={disabled}
      layout={!reduceMotion}
      onClick={onClick}
      type="button"
    >
      <Plus aria-hidden="true" size={compact ? 16 : 20} />
      <span>{compact ? roleLabels[role] : "Aggiungi giocatore"}</span>
    </m.button>
  );
}
