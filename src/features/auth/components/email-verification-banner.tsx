"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/shared/components/ui";

import styles from "./email-verification-banner.module.css";

export type EmailVerificationBannerStatus = {
  email: string;
  sentAt: string | null;
  cooldownEndsAt: string | null;
  resendCount: number;
  resendLimit: number;
};

export function EmailVerificationBanner({
  initialStatus,
}: {
  initialStatus: EmailVerificationBannerStatus;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [now, setNow] = useState(0);
  const cooldownSeconds = useMemo(() => {
    if (!status.cooldownEndsAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((new Date(status.cooldownEndsAt).getTime() - now) / 1000));
  }, [now, status.cooldownEndsAt]);
  const resendLimitReached = status.resendCount >= status.resendLimit;

  useEffect(() => {
    const initialUpdate = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);

  function formatCountdown(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  async function sendVerificationEmail() {
    setMessage(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/email-verification", { method: "POST" });
      const body = (await response.json()) as {
        message?: string;
        status?: EmailVerificationBannerStatus;
      };

      if (body.status) {
        setStatus(body.status);
        setNow(Date.now());
      }

      setMessage(body.message ?? "Non è stato possibile inviare l'email. Riprova.");
    } catch {
      setMessage("Non è stato possibile inviare l'email. Riprova.");
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className={styles.banner} aria-label="Verifica email">
      <div>
        <strong>Verifica la tua email e ottieni 25 LP</strong>
        <p>
          {message ??
            (status.sentAt
              ? `Ti abbiamo già inviato una mail di verifica a: ${status.email}`
              : "Completa il tuo account Leonessa Cup.")}
        </p>
        {!message && cooldownSeconds > 0 && (
          <p className={styles.cooldown}>
            Potrai richiedere una nuova email tra {formatCountdown(cooldownSeconds)}
          </p>
        )}
        {!message && cooldownSeconds === 0 && resendLimitReached && (
          <p className={styles.cooldown}>
            Hai raggiunto il numero massimo di richieste. Riprova più tardi.
          </p>
        )}
      </div>
      <Button
        disabled={pending || cooldownSeconds > 0 || resendLimitReached}
        size="sm"
        type="button"
        onClick={sendVerificationEmail}
      >
        {pending ? "Invio..." : "Verifica ora"}
      </Button>
    </aside>
  );
}
