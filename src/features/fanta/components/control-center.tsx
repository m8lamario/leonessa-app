"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react/no-unescaped-entities */

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FlaskConical, RefreshCw, ShieldAlert } from "lucide-react";
import { PageContainer } from "@/shared/components";
import styles from "./control-center.module.css";

type Data = {
  sandbox: boolean;
  competition: { id: string; name: string } | null;
  counts: Record<string, number>;
  lastScoring: string | Date | null;
  health: Record<string, boolean>;
  anomalies: Array<{ area: string; message: string; recordId?: string }>;
};

export function FantaControlCenter({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [eventType, setEventType] = useState("GOAL");
  const [playerId, setPlayerId] = useState("");
  const [minute, setMinute] = useState("10");
  const [events, setEvents] = useState<any[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [diff, setDiff] = useState<any>(null);
  const [closeBreakdown, setCloseBreakdown] = useState<any>(null);

  useEffect(() => {
    void loadMatches();
  }, []);
  useEffect(() => {
    if (selectedMatchId) void loadEvents();
  }, [selectedMatchId]);

  async function loadMatches() {
    const response = await fetch("/api/admin/fanta/matches");
    if (response.ok) {
      const payload = await response.json();
      setMatches(payload.matches);
      if (!selectedMatchId && payload.matches[0]) setSelectedMatchId(payload.matches[0].id);
    }
  }

  async function loadEvents(id = selectedMatchId) {
    if (!id) return;
    const response = await fetch(`/api/admin/fanta/events?matchId=${id}`);
    if (response.ok) setEvents((await response.json()).events);
  }

  async function createEvent() {
    const response = await fetch("/api/admin/fanta/events", {
      method: editingEventId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: editingEventId,
        matchId: selectedMatchId,
        type: eventType,
        playerId,
        minute: Number(minute),
      }),
    });
    if (!response.ok) {
      setMessage((await response.json()).message ?? "Errore evento");
      return;
    }
    await loadEvents();
    setEditingEventId(null);
    setMessage(
      editingEventId ? "Evento modificato nel DB Sandbox." : "Evento salvato nel DB Sandbox.",
    );
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("Eliminare questo evento?")) return;
    await fetch(`/api/admin/fanta/events?eventId=${id}`, { method: "DELETE" });
    await loadEvents();
    setMessage("Evento eliminato.");
  }

  async function recalculate() {
    const response = await fetch("/api/admin/fanta/recalculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatchId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message ?? "Ricalcolo fallito");
      return;
    }
    setDiff(payload);
    setBreakdown(await (await fetch(`/api/admin/fanta/scoring/${selectedMatchId}`)).json());
    setMessage("Ricalcolo completato: stats, score, team e ranking aggiornati.");
    await refresh();
  }

  async function closeDay() {
    const response = await fetch("/api/admin/fanta/close-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatchId }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.message ?? "Chiusura giornata fallita");
      return;
    }
    setCloseBreakdown(payload);
    setMessage("Giornata chiusa: valori LP e storico aggiornati.");
  }

  async function resetScenario() {
    if (!window.confirm("Ripristinare lo scenario Sandbox corrente?")) return;
    await fetch("/api/admin/fanta/scenario-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatchId }),
    });
    await loadEvents();
    setBreakdown(null);
    setDiff(null);
    setMessage("Scenario ripristinato: dati production intatti.");
  }

  async function refresh() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/fanta");
      if (response.ok) setData(await response.json());
      else setMessage((await response.json()).message ?? "Errore");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Debug & tracciabilità</p>
          <h1>Fanta Control Center</h1>
          <p className={styles.sub}>
            Strumento tecnico per verificare il flusso Scoring → Team → Market.
          </p>
        </div>
        <span className={styles.sandbox}>
          <FlaskConical size={15} /> SANDBOX MODE
        </span>
      </header>
      {message && <p className={styles.error}>{message}</p>}
      <section className={styles.health}>
        <h2>System health</h2>
        <div className={styles.healthGrid}>
          {Object.entries(data.health).map(([key, ok]) => (
            <div className={ok ? styles.ok : styles.bad} key={key}>
              {ok ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />} {key}{" "}
              <b>{ok ? "OK" : "ANOMALIA"}</b>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Overview</h2>
          <button className={styles.refresh} disabled={busy} onClick={refresh} type="button">
            <RefreshCw size={16} /> Aggiorna
          </button>
        </div>
        <div className={styles.metrics}>
          {Object.entries(data.counts).map(([key, value]) => (
            <div className={styles.metric} key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Pipeline</h2>
        </div>
        <div className={styles.pipeline}>
          {[
            "Partita Sandbox",
            "Eventi",
            "Scoring Engine",
            "Player Stats",
            "Fantasy Scores",
            "Fantasy Teams",
            "Ranking",
            "Market",
            "Social",
          ].map((item, index) => (
            <span key={item}>
              {item}
              {index < 8 && " ↓"}
            </span>
          ))}
        </div>
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Anomalie</h2>
          <span>{data.anomalies.length}</span>
        </div>
        {data.anomalies.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircle2 size={18} /> Nessuna anomalia rilevata
          </div>
        ) : (
          <div className={styles.anomalies}>
            {data.anomalies.map((a, index) => (
              <div className={styles.anomaly} key={`${a.area}-${index}`}>
                <AlertTriangle size={16} />
                <b>{a.area}</b>
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className={styles.section}>
        <div className={styles.heading}>
          <h2>Event Editor</h2>
          <button className={styles.refresh} onClick={() => void loadMatches()} type="button">
            <RefreshCw size={16} /> Partite
          </button>
        </div>
        <select
          className={styles.select}
          value={selectedMatchId}
          onChange={(event) => setSelectedMatchId(event.target.value)}
        >
          <option value="">Seleziona una partita Sandbox</option>
          {matches.map((match) => (
            <option key={match.id} value={match.id}>
              {match.homeTeam.name} {match.homeScore} - {match.awayScore} {match.awayTeam.name}
            </option>
          ))}
        </select>
        {selectedMatchId && (
          <>
            <div className={styles.eventForm}>
              <select
                className={styles.select}
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
              >
                <option value="GOAL">Gol</option>
                <option value="ASSIST">Assist</option>
                <option value="YELLOW_CARD">Ammonizione</option>
                <option value="RED_CARD">Espulsione</option>
                <option value="OWN_GOAL">↩ Autogol</option>
              </select>
              <select
                className={styles.select}
                value={playerId}
                onChange={(event) => setPlayerId(event.target.value)}
              >
                <option value="">Giocatore</option>
                {[
                  ...(matches.find((match) => match.id === selectedMatchId)?.homeTeam.members ??
                    []),
                  ...(matches.find((match) => match.id === selectedMatchId)?.awayTeam.members ??
                    []),
                ].map((player: any) => (
                  <option key={player.id} value={player.id}>
                    {[player.user.name, player.user.surname].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
              <input
                className={styles.input}
                type="number"
                min="0"
                max="120"
                value={minute}
                onChange={(event) => setMinute(event.target.value)}
              />
              <button className={styles.refresh} onClick={() => void createEvent()} type="button">
                Salva evento
              </button>
            </div>
            <div className={styles.scenarios}>
              <b>Simulation Center</b>
              {["GOAL", "ASSIST", "YELLOW_CARD", "RED_CARD", "OWN_GOAL"].map((scenario) => (
                <button
                  key={scenario}
                  className={styles.scenario}
                  disabled={!playerId}
                  onClick={() => {
                    setEventType(scenario);
                    void createEvent();
                  }}
                  type="button"
                >
                  {scenario}
                </button>
              ))}
            </div>
            <div className={styles.events}>
              {events.map((event) => (
                <div className={styles.eventRow} key={event.id}>
                  <span>
                    {event.minute}' {event.type}
                  </span>
                  <button
                    className={styles.edit}
                    onClick={() => {
                      setEditingEventId(event.id);
                      setEventType(event.type);
                      setPlayerId(event.playerId ?? "");
                      setMinute(String(event.minute));
                    }}
                    type="button"
                  >
                    Modifica
                  </button>
                  <b>
                    {event.player
                      ? [event.player.user.name, event.player.user.surname]
                          .filter(Boolean)
                          .join(" ")
                      : "-"}
                  </b>
                  <button
                    className={styles.delete}
                    onClick={() => void deleteEvent(event.id)}
                    type="button"
                  >
                    Elimina
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.actionRow}>
              <button className={styles.refresh} onClick={() => void recalculate()} type="button">
                Ricalcola scoring
              </button>
              <button className={styles.closeDay} onClick={() => void closeDay()} type="button">
                Chiudi/Ricalcola giornata
              </button>
              <button className={styles.reset} onClick={() => void resetScenario()} type="button">
                Reset scenario
              </button>
            </div>
          </>
        )}
      </section>
      {closeBreakdown && (
        <section className={styles.section}>
          <h2>Variazioni valore giornata</h2>
          <div className={styles.breakdown}>
            {closeBreakdown.breakdown
              ?.filter((item: any) => item.delta !== 0)
              .map((item: any) => (
                <div className={styles.breakdownRow} key={item.playerId}>
                  <b>
                    {item.name?.name} {item.name?.surname}
                  </b>
                  <span>
                    Precedente {item.oldValue} LP · Prestazione {item.points} · Variazione{" "}
                    {item.delta > 0 ? "+" : ""}
                    {item.delta} LP
                  </span>
                  <strong>{item.newValue} LP</strong>
                </div>
              ))}
          </div>
        </section>
      )}
      {diff && (
        <section className={styles.section}>
          <h2>Difference Viewer</h2>
          <div className={styles.diff}>
            <pre>{JSON.stringify(diff, null, 2)}</pre>
          </div>
        </section>
      )}
      {breakdown && (
        <section className={styles.section}>
          <h2>Scoring Inspector</h2>
          {breakdown.substitutions?.length > 0 && (
            <div className={styles.breakdown}>
              <h3>Sostituzioni registrate</h3>
              {breakdown.substitutions.map((sub: any) => (
                <div className={styles.breakdownRow} key={sub.id}>
                  <b>{sub.fantasyTeamName}</b>
                  <span>
                    #{sub.sequence} {sub.playerOutName} → {sub.playerInName} ({sub.reason})
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.breakdown}>
            {breakdown.players?.map((player: any) => (
              <div className={styles.breakdownRow} key={player.playerId}>
                <b>{player.name}</b>
                <span>
                  Eventi {player.eventPoints} + risultato {player.resultPoints} + clean sheet{" "}
                  {player.cleanSheet} × capitano {player.captainCount ? "1.5" : "1"}
                  {player.lineup?.length
                    ? ` · lineup ${player.lineup
                        .map(
                          (entry: any) =>
                            `${entry.status}${entry.isCaptain ? " C" : ""}${
                              entry.benchOrder != null ? `#${entry.benchOrder}` : ""
                            }`,
                        )
                        .join(", ")}`
                    : ""}
                </span>
                <strong>{player.finalPoints}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      <p className={styles.footer}>
        Ultimo scoring:{" "}
        {data.lastScoring ? new Date(data.lastScoring).toLocaleString("it-IT") : "mai"}
      </p>
    </PageContainer>
  );
}
