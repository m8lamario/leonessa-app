"use client";

import { useState } from "react";
import { FlaskConical, RefreshCw, RotateCcw } from "lucide-react";

import { PageContainer } from "@/shared/components";
import styles from "./sandbox-panel.module.css";

type Action = {
  key: string;
  label: string;
  emoji: string;
  endpoint: string;
};

const ACTIONS: Action[] = [
  {
    key: "matchday",
    label: "Simula giornata",
    emoji: "⚽",
    endpoint: "/api/dev/simulate-matchday",
  },
  { key: "market", label: "Simula mercato", emoji: "💎", endpoint: "/api/dev/simulate-market" },
  {
    key: "notification",
    label: "Simula notifica",
    emoji: "🔔",
    endpoint: "/api/dev/simulate-notification",
  },
  {
    key: "match-started",
    label: "Simula Match Started",
    emoji: "🔴",
    endpoint: "/api/dev/simulate-match-started",
  },
  {
    key: "achievement",
    label: "Simula achievement",
    emoji: "🏅",
    endpoint: "/api/dev/simulate-achievement",
  },
  { key: "event", label: "Genera news / evento", emoji: "📰", endpoint: "/api/dev/simulate-event" },
];

export function SandboxPanel() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action.key);
    try {
      const response = await fetch(action.endpoint, { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setLog((prev) => [`❌ ${action.label}: ${body.message ?? "errore"}`, ...prev].slice(0, 30));
      } else {
        const detail = JSON.stringify(body.result ?? {});
        setLog((prev) => [`✅ ${action.label} → ${detail}`, ...prev].slice(0, 30));
      }
    } catch {
      setLog((prev) => [`❌ ${action.label}: errore di rete`, ...prev].slice(0, 30));
    } finally {
      setBusy(null);
    }
  }

  async function loadPushDebug() {
    setBusy("push-debug");
    try {
      const response = await fetch("/api/dev/simulate-match-started", { method: "GET" });
      const body = await response.json();
      if (!response.ok) {
        setLog((prev) => [`❌ Push debug: ${body.message ?? "errore"}`, ...prev].slice(0, 30));
      } else {
        setLog((prev) => [`✅ Push debug → ${JSON.stringify(body.result ?? {})}`, ...prev].slice(0, 30));
      }
    } catch {
      setLog((prev) => [`❌ Push debug: errore di rete`, ...prev].slice(0, 30));
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    setBusy("reset");
    try {
      const response = await fetch("/api/dev/reset", { method: "POST" });
      const body = await response.json();
      setLog((prev) =>
        [
          (response.ok ? "✅ " : "❌ ") + "Reset: " + JSON.stringify(body.result ?? body.message),
          ...prev,
        ].slice(0, 30),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Ambiente di test interno</p>
          <h1>Sandbox</h1>
          <p className={styles.subtitle}>
            Simula intere feature senza dipendere da ESL o dati reali.
          </p>
        </div>
        <span className={styles.badge}>
          <FlaskConical aria-hidden="true" size={14} /> Sandbox
        </span>
      </header>

      <section className={styles.section} aria-label="Simulazioni">
        <div className={styles.grid}>
          {ACTIONS.map((action) => (
            <button
              className={styles.actionCard}
              key={action.key}
              disabled={busy !== null}
              onClick={() => run(action)}
              type="button"
            >
              <span className={styles.actionEmoji}>{action.emoji}</span>
              <strong>{action.label}</strong>
              {busy === action.key ? (
                <em>Esecuzione…</em>
              ) : (
                <RefreshCw aria-hidden="true" size={14} />
              )}
            </button>
          ))}
          <button
            className={styles.actionCard}
            disabled={busy !== null}
            onClick={() => void loadPushDebug()}
            type="button"
          >
            <span className={styles.actionEmoji}>📱</span>
            <strong>Debug push / follow</strong>
            {busy === "push-debug" ? <em>Esecuzione…</em> : <RefreshCw aria-hidden="true" size={14} />}
          </button>
        </div>
      </section>

      <section className={styles.section} aria-label="Log simulazioni">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>Output</p>
            <h2>Log</h2>
          </div>
          <span>{log.length} eventi</span>
        </div>
        <div className={styles.logBox}>
          {log.length === 0 && <p className={styles.emptyLog}>Nessuna simulazione eseguita.</p>}
          {log.map((line, index) => (
            <code key={index} className={styles.logLine}>
              {line}
            </code>
          ))}
        </div>
      </section>

      <button className={styles.resetButton} disabled={busy !== null} onClick={reset} type="button">
        <RotateCcw aria-hidden="true" size={16} /> Reset Sandbox
      </button>
    </PageContainer>
  );
}
