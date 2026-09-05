"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Bell, CheckCheck, Trophy, UserRound } from "lucide-react";
import type { Route } from "next";

import type { InboxNotification } from "@/features/notifications/lib/inbox";
import styles from "./NotificationBell.module.css";

type NotificationBellProps = {
  initialUnreadCount: number;
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "adesso";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}g`;
}

export function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<InboxNotification[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function loadInbox() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/notifications", { credentials: "same-origin" });
      const body = (await response.json()) as {
        notifications?: InboxNotification[];
        unreadCount?: number;
        message?: string;
      };
      if (!response.ok) {
        setError(body.message ?? "Notifiche non disponibili.");
        setStatus("error");
        return;
      }
      setItems(body.notifications ?? []);
      if (typeof body.unreadCount === "number") setUnreadCount(body.unreadCount);
      setStatus("ready");
    } catch {
      setError("Errore di rete. Riprova.");
      setStatus("error");
    }
  }

  async function markRead(payload: { id?: string; all?: boolean }) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { result?: { unreadCount?: number }; message?: string };
    if (!response.ok) {
      throw new Error(body.message ?? "Aggiornamento non riuscito.");
    }
    if (typeof body.result?.unreadCount === "number") {
      setUnreadCount(body.result.unreadCount);
    }
    setItems((current) =>
      current
        ? current.map((item) =>
            payload.all || item.id === payload.id ? { ...item, read: true } : item,
          )
        : current,
    );
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadInbox();
    }
  }

  async function openItem(item: InboxNotification) {
    if (!item.read) {
      try {
        await markRead({ id: item.id });
      } catch {
        setError("Impossibile aggiornare la notifica.");
      }
    }
    setOpen(false);
    if (item.href) {
      router.push(item.href as Route);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={
          unreadCount > 0 ? `Notifiche, ${unreadCount} non lette` : "Notifiche"
        }
        className={styles.trigger}
        onClick={() => void toggleOpen()}
        type="button"
      >
        <Bell aria-hidden="true" size={16} strokeWidth={2.2} />
        {unreadCount > 0 ? <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>
      {open ? (
        <div className={styles.panel} id={panelId} role="region" aria-label="Notifiche">
          <div className={styles.panelHead}>
            <strong>Notifiche</strong>
            {items && unreadCount > 0 ? (
              <button
                className={styles.markAll}
                onClick={() => void markRead({ all: true }).catch(() => setError("Impossibile aggiornare."))}
                type="button"
              >
                <CheckCheck aria-hidden="true" size={14} />
                Segna come lette
              </button>
            ) : null}
          </div>
          {status === "loading" || status === "idle" ? (
            <p className={styles.state}>Caricamento...</p>
          ) : null}
          {status === "error" ? (
            <p className={styles.state} role="alert">
              {error}
            </p>
          ) : null}
          {status === "ready" && items?.length === 0 ? (
            <p className={styles.state}>Nessuna notifica per ora.</p>
          ) : null}
          {status === "ready" && items && items.length > 0 ? (
            <ul className={styles.list}>
              {items.map((item) => {
                const Icon = item.type === "SOCIAL" ? UserRound : Trophy;
                return (
                  <li key={item.id}>
                    <button
                      className={item.read ? styles.item : styles.itemUnread}
                      onClick={() => void openItem(item)}
                      type="button"
                    >
                      <span className={styles.itemIcon}>
                        <Icon aria-hidden="true" size={15} />
                      </span>
                      <span className={styles.itemCopy}>
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                      </span>
                      <time dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
