"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { DashboardPrediction } from "../types";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import styles from "../../dashboard/dashboard.module.css";

type MatchPredictionCardProps = {
  prediction: DashboardPrediction;
};

export function MatchPredictionCard({ prediction }: MatchPredictionCardProps) {
  const router = useRouter();
  const [choice, setChoice] = useState(prediction.choice);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(nextChoice: "HOME" | "AWAY") {
    if (!prediction.editable || pending) return;
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: prediction.matchId, choice: nextChoice }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(body.message ?? "Non è stato possibile salvare il pronostico.");
        void hapticError();
        return;
      }
      setChoice(nextChoice);
      void hapticSuccess();
      router.refresh();
    } catch {
      setMessage("Non è stato possibile salvare il pronostico. Riprova.");
      void hapticError();
    } finally {
      setPending(false);
    }
  }

  const statusLabel =
    prediction.status === "SETTLED_CORRECT"
      ? "Pronostico corretto"
      : prediction.status === "SETTLED_WRONG"
        ? "Pronostico errato"
        : prediction.status === "VOID"
          ? "Annullato"
          : prediction.editable
            ? "Aperto"
            : "Chiuso";

  return (
    <article className={styles.matchCard}>
      <div className={styles.teamScore}>
        <strong>{prediction.homeTeam}</strong>
        <span>VS</span>
        <strong>{prediction.awayTeam}</strong>
      </div>
      <dl className={styles.matchDetails}>
        <div>
          <dt>Quando</dt>
          <dd>{prediction.schedule}</dd>
        </div>
        <div>
          <dt>Stato</dt>
          <dd>{statusLabel}</dd>
        </div>
      </dl>
      {prediction.editable ? (
        <div className={styles.predictionActions}>
          <button
            className={choice === "HOME" ? styles.predictionChoiceActive : styles.predictionChoice}
            disabled={pending}
            onClick={() => void submit("HOME")}
            type="button"
          >
            {prediction.homeTeam}
          </button>
          <button
            className={choice === "AWAY" ? styles.predictionChoiceActive : styles.predictionChoice}
            disabled={pending}
            onClick={() => void submit("AWAY")}
            type="button"
          >
            {prediction.awayTeam}
          </button>
        </div>
      ) : choice ? (
        <p className={styles.predictionLocked}>
          Hai scelto {choice === "HOME" ? prediction.homeTeam : prediction.awayTeam}.
        </p>
      ) : (
        <p className={styles.emptyState}>Il pronostico per questa partita è chiuso.</p>
      )}
      <p className={styles.predictionReward}>
        Corretto +{prediction.correctRewardLp} LP · Errato -{prediction.incorrectPenaltyLp} LP
      </p>
      {prediction.split ? (
        <p className={styles.predictionSplit}>
          {prediction.split.homePercent}% ha scelto {prediction.homeTeam} su {prediction.split.total}{" "}
          pronostici
        </p>
      ) : null}
      {message ? <p className={styles.emptyState}>{message}</p> : null}
    </article>
  );
}
