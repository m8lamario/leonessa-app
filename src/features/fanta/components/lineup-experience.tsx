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
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";

import * as haptics from "@/shared/lib/haptics/haptics";
import { networkErrorMessage, readApiErrorMessage } from "../lib/market-feedback";
import { evaluateSellToVacancy, getTransfersUsed } from "../lib/transfer-cost";
import { validateEditableLineup } from "../lib/lineup-validation";
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
    freeTransfers?: number;
    paidTransfers?: number;
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
  const [noticeKind, setNoticeKind] = useState<"success" | "error">("success");
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);
  const [swapStarter, setSwapStarter] = useState<LineupPlayer | null>(null);
  const [drag, setDrag] = useState<{
    benchPlayerId: string;
    role: string;
    hoverId: string | null;
    hoverValid: boolean | null;
  } | null>(null);
  const pointerStart = useRef<{ id: string; x: number; y: number } | null>(null);
  const didDrag = useRef(false);
  const ghostRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragSize = useRef({ width: 84, height: 88 });

  const team = lineup.team;
  const players = team?.squad ?? noPlayers;
  const vacancies = team?.vacancies ?? noVacancies;
  const transfersUsed = getTransfersUsed(team?.freeTransfers ?? 0, team?.paidTransfers ?? 0);
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
  const draggingPlayer = drag
    ? (bench.find((player) => player.playerId === drag.benchPlayerId) ?? null)
    : null;
  const draggingIndex = draggingPlayer
    ? bench.findIndex((player) => player.playerId === draggingPlayer.playerId)
    : -1;
  const lineupCheck = validateEditableLineup(
    players.map((player) => ({
      role: player.role,
      status: player.status,
      isCaptain: player.isCaptain,
    })),
    vacancies.map((vacancy) => ({ role: vacancy.role, status: vacancy.status })),
  );
  const isValid = lineupCheck.valid;
  const isOpen = lineup.status.open;
  const confirmed = Boolean(lineup.lineup.confirmedAt);

  useLayoutEffect(() => {
    if (!drag || !ghostRef.current) return;
    const ghost = ghostRef.current;
    ghost.style.width = `${dragSize.current.width}px`;
    ghost.style.height = `${dragSize.current.height}px`;
    ghost.style.transform = `translate3d(${lastPointer.current.x - dragOffset.current.x}px, ${lastPointer.current.y - dragOffset.current.y}px, 0)`;
  }, [drag?.benchPlayerId]);

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
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNoticeKind("error");
        setNotice(readApiErrorMessage(payload));
        void haptics.error();
        return;
      }

      setSelected(null);
      setSwapStarter(null);
      setNoticeKind("success");
      setNotice(successMessage);
      void haptics.success();
      router.refresh();
    } catch (error) {
      setNoticeKind("error");
      setNotice(networkErrorMessage(error));
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

  function goToMarketBuy(role: string) {
    router.push(`/fanta/market?role=${encodeURIComponent(role)}#browse` as never);
  }

  function resolveDropTarget(clientX: number, clientY: number) {
    const target = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>("[data-drop-id]");
    if (!target) return null;
    return {
      id: target.dataset.dropId ?? "",
      role: target.dataset.dropRole ?? "",
      kind: (target.dataset.dropKind ?? "") as "starter" | "vacancy" | "",
    };
  }

  function moveGhost(clientX: number, clientY: number) {
    lastPointer.current = { x: clientX, y: clientY };
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.width = `${dragSize.current.width}px`;
    ghost.style.height = `${dragSize.current.height}px`;
    ghost.style.transform = `translate3d(${clientX - dragOffset.current.x}px, ${clientY - dragOffset.current.y}px, 0)`;
  }

  function handleBenchPointerDown(event: PointerEvent<HTMLDivElement>, player: LineupPlayer) {
    if (!isOpen || busy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    dragSize.current = { width: rect.width, height: rect.height };
    lastPointer.current = { x: event.clientX, y: event.clientY };
    pointerStart.current = { id: player.playerId, x: event.clientX, y: event.clientY };
    didDrag.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBenchPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) return;

    const benchPlayer = bench.find((player) => player.playerId === start.id);
    if (!benchPlayer) return;

    const drop = resolveDropTarget(event.clientX, event.clientY);
    const hoverValid = drop ? drop.role === benchPlayer.role : null;
    const hoverId = drop?.id ?? null;
    lastPointer.current = { x: event.clientX, y: event.clientY };

    if (!didDrag.current) {
      didDrag.current = true;
      setDrag({
        benchPlayerId: benchPlayer.playerId,
        role: benchPlayer.role,
        hoverId,
        hoverValid,
      });
      void haptics.selection();
      return;
    }

    moveGhost(event.clientX, event.clientY);
    setDrag((current) => {
      if (!current) return current;
      if (current.hoverId === hoverId && current.hoverValid === hoverValid) return current;
      return { ...current, hoverId, hoverValid };
    });
  }

  function handleBenchPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    setDrag(null);
    if (!start || !didDrag.current) return;

    const benchPlayer = bench.find((player) => player.playerId === start.id);
    const drop = resolveDropTarget(event.clientX, event.clientY);
    if (!benchPlayer || !drop) {
      setNotice("Trascina la riserva su un titolare dello stesso ruolo.");
      void haptics.warning();
      return;
    }

    if (drop.role !== benchPlayer.role) {
      setNotice("Puoi scambiare solo giocatori con lo stesso ruolo.");
      void haptics.error();
      return;
    }

    if (drop.kind === "starter") {
      swap(drop.id, benchPlayer.playerId);
      return;
    }

    if (drop.kind === "vacancy") {
      void request(
        {
          action: "promote-bench",
          benchPlayerId: benchPlayer.playerId,
          vacancyId: drop.id,
        },
        `${benchPlayer.name} entra tra i titolari.`,
      );
    }
  }

  function handleBenchPointerCancel() {
    pointerStart.current = null;
    setDrag(null);
  }

  function dropClass(dropId: string, dropRole: string) {
    if (!drag) return undefined;
    if (drag.hoverId === dropId) {
      return drag.hoverValid ? styles.dropValid : styles.dropInvalid;
    }
    return dropRole === drag.role ? styles.dropCompatible : styles.dropIncompatible;
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
        <p className={noticeKind === "error" ? styles.noticeError : styles.notice} role="status">
          {notice}
        </p>
      )}

      <LayoutGroup>
        <div
          className={drag ? `${styles.pitch} ${styles.pitchDragging}` : styles.pitch}
          aria-label="Formazione 4-3-3"
        >
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
                        className={[styles.playerCard, dropClass(player.playerId, player.role)]
                          .filter(Boolean)
                          .join(" ")}
                        data-drop-id={player.playerId}
                        data-drop-kind="starter"
                        data-drop-role={player.role}
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
                        dropClassName={dropClass(vacancy.id, vacancy.role)}
                        dropId={vacancy.id}
                        dropKind="vacancy"
                        key={vacancy.id}
                        onClick={() => goToMarketBuy(vacancy.role)}
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
                  drag?.benchPlayerId === player.playerId
                    ? styles.benchCardPlaceholder
                    : styles.benchCard
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
                onPointerCancel={handleBenchPointerCancel}
                onPointerDown={(event) => handleBenchPointerDown(event, player)}
                onPointerMove={handleBenchPointerMove}
                onPointerUp={handleBenchPointerUp}
                role="button"
                tabIndex={busy ? -1 : 0}
              >
                <span className={styles.benchNumber}>R{index + 1}</span>
                <span className={styles.benchName}>{player.name}</span>
                <small>{roleLabels[player.role] ?? player.role}</small>
                <b>{player.totalPoints}</b>
                {isOpen && drag?.benchPlayerId !== player.playerId && (
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
                  onClick={() => goToMarketBuy(vacancy.role)}
                  role={vacancy.role}
                />
              ))}
          </div>
          {isOpen && (
            <p className={drag?.hoverValid === false ? styles.dragHintInvalid : styles.dragHint}>
              {drag
                ? drag.hoverValid === false
                  ? "Ruolo non compatibile"
                  : "Rilascia sullo slot compatibile"
                : "Trascina una riserva su un titolare dello stesso ruolo."}
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
                  ? `${starters.length} titolari + ${bench.length} riserve`
                  : (lineupCheck.message ?? "Completa 11 titolari e almeno 1 riserva.")}
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
                onClick={() => {
                  if (!team) return;
                  const decision = evaluateSellToVacancy({
                    selling: {
                      playerId: selected.playerId,
                      role: selected.role,
                      status: selected.status,
                      value: selected.value,
                    },
                    squad: players.map((player) => ({
                      playerId: player.playerId,
                      role: player.role,
                      status: player.status,
                      value: player.value,
                    })),
                    marketPlayers: lineup.pool.map((player) => ({
                      id: player.id,
                      role: player.role,
                      fantasyValue: player.fantasyValue,
                    })),
                    budgetLp: team.budgetLp,
                    transfersUsed,
                  });
                  if (!decision.allowed) {
                    setNoticeKind("error");
                    setNotice(decision.message);
                    void haptics.error();
                    return;
                  }
                  void request(
                    { action: "sell", playerId: selected.playerId },
                    `${selected.name} è stato venduto: completa lo slot.`,
                  );
                }}
                type="button"
              >
                <X size={17} /> Vendi
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {draggingPlayer && (
        <div
          aria-hidden="true"
          className={
            drag?.hoverValid === false
              ? styles.dragGhostInvalid
              : drag?.hoverValid
                ? styles.dragGhostValid
                : styles.dragGhost
          }
          ref={ghostRef}
        >
          <span className={styles.benchNumber}>
            {draggingIndex >= 0 ? `R${draggingIndex + 1}` : "R"}
          </span>
          <span className={styles.benchName}>{draggingPlayer.name}</span>
          <small>{roleLabels[draggingPlayer.role] ?? draggingPlayer.role}</small>
          <b>{draggingPlayer.totalPoints}</b>
        </div>
      )}
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
  dropId,
  dropKind,
  dropClassName,
  onClick,
}: {
  role: string;
  disabled: boolean;
  compact?: boolean;
  dropId?: string;
  dropKind?: "starter" | "vacancy";
  dropClassName?: string;
  onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <m.button
      className={[compact ? styles.emptyBenchSlot : styles.emptySlot, dropClassName]
        .filter(Boolean)
        .join(" ")}
      data-drop-id={dropId}
      data-drop-kind={dropKind}
      data-drop-role={role}
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
