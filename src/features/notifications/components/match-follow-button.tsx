"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState, useTransition } from "react";

import { ensurePushPermissionAndRegister } from "../lib/push-client";
import styles from "./match-follow-button.module.css";

export type MatchFollowButtonProps = {
  matchId: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED" | string;
  startAt?: string | null;
  initialFollowing?: boolean;
  className?: string;
  compact?: boolean;
};

type Notice = { kind: "info" | "error"; text: string } | null;

function useKickoffPassed(startAt: string | null | undefined, status: string) {
  const statusStarted =
    status === "LIVE" || status === "FINISHED" || status === "CANCELLED";

  return useSyncExternalStore(
    (onStoreChange) => {
      if (statusStarted || !startAt) {
        return () => undefined;
      }
      const delay = new Date(startAt).getTime() - Date.now();
      if (delay <= 0) {
        return () => undefined;
      }
      const timer = window.setTimeout(onStoreChange, delay);
      return () => window.clearTimeout(timer);
    },
    () => {
      if (statusStarted) return true;
      if (!startAt) return false;
      return new Date(startAt).getTime() <= Date.now();
    },
    () => statusStarted,
  );
}

export function MatchFollowButton({
  matchId,
  status,
  startAt,
  initialFollowing = false,
  className,
  compact = false,
}: MatchFollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();
  const started = useKickoffPassed(startAt, status);

  if (status === "LIVE" || (started && status !== "SCHEDULED")) {
    return (
      <Link
        className={[styles.liveAction, className].filter(Boolean).join(" ")}
        href={`/live/${matchId}` as never}
      >
        🔴 Vedi Live
      </Link>
    );
  }

  if (started) {
    return (
      <Link
        className={[styles.liveAction, className].filter(Boolean).join(" ")}
        href={`/live/${matchId}` as never}
      >
        🔴 LIVE
      </Link>
    );
  }

  async function toggleFollow() {
    setNotice(null);
    const method = following ? "DELETE" : "POST";
    try {
      const response = await fetch(`/api/matches/${matchId}/follow`, { method });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({
          kind: "error",
          text:
            typeof payload.message === "string"
              ? payload.message
              : "Operazione non riuscita. Riprova.",
        });
        return;
      }

      const nextFollowing = Boolean(payload.result?.following ?? !following);
      setFollowing(nextFollowing);

      if (nextFollowing && method === "POST") {
        const push = await ensurePushPermissionAndRegister();
        if (push.status === "prompt_needed") {
          setNotice({
            kind: "info",
            text: "Vuoi ricevere aggiornamenti sulle partite che segui?",
          });
        } else if (push.status === "denied") {
          setNotice({
            kind: "info",
            text: "Partita seguita comunque.\nLe notifiche push sono disattivate.",
          });
        } else if (push.status === "error") {
          setNotice({
            kind: "info",
            text: "Partita seguita. Errore registrazione device: puoi riprovare dalle impostazioni.",
          });
        }
      }

      startTransition(() => router.refresh());
    } catch {
      setNotice({ kind: "error", text: "Errore di rete. Riprova." });
    }
  }

  async function enableNotifications() {
    const push = await ensurePushPermissionAndRegister({ requestPermission: true });
    if (push.status === "registered") {
      setNotice({ kind: "info", text: "Notifiche abilitate." });
    } else if (push.status === "denied") {
      setNotice({
        kind: "info",
        text: "Partita seguita comunque.\nLe notifiche push sono disattivate.",
      });
    } else if (push.status === "error") {
      setNotice({ kind: "error", text: push.message ?? "Errore registrazione device." });
    }
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(" ")}>
      <button
        className={[following ? styles.followed : styles.follow, compact ? styles.compact : undefined]
          .filter(Boolean)
          .join(" ")}
        disabled={pending}
        onClick={() => void toggleFollow()}
        type="button"
      >
        {following ? "✓ Partita seguita" : "Segui partita"}
      </button>
      {notice && (
        <div className={notice.kind === "error" ? styles.noticeError : styles.notice} role="status">
          <p>{notice.text}</p>
          {notice.text.includes("Vuoi ricevere aggiornamenti") && (
            <button className={styles.enablePush} onClick={() => void enableNotifications()} type="button">
              Abilita notifiche
            </button>
          )}
        </div>
      )}
    </div>
  );
}
