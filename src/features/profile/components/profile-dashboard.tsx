"use client";

import { m } from "framer-motion";
import { Award } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { type FormEvent, useState } from "react";

import { PageContainer } from "@/shared/components";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import styles from "../profile.module.css";
import type { AccountPageData } from "../types/profile";

type ProfileDashboardProps = {
  account: AccountPageData;
};

const reveal = { duration: 0.24, ease: "easeOut" as const };

const roleLabels: Record<string, string> = {
  USER: "Supporter",
  PLAYER: "Giocatore",
  TEAM_STAFF: "Staff Squadra",
  LEONESSA_STAFF: "Staff Leonessa",
  STAFF: "Staff Leonessa",
  REPRESENTATIVE: "Rappresentante",
  SCHOOL_REP: "Rappresentante",
  SPONSOR: "Sponsor",
  ORGANIZER: "Organizzatore",
  ADMIN: "Organizzatore",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ProfileDashboard({ account }: ProfileDashboardProps) {
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);
  const roleLabel = roleLabels[account.role] ?? "Supporter";

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          password: formData.get("password"),
          passwordConfirmation: formData.get("passwordConfirmation"),
        }),
      });
      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        setPasswordError(body.message ?? "Non è stato possibile aggiornare la password.");
        return;
      }

      event.currentTarget.reset();
      setPasswordMessage(body.message ?? "Password aggiornata correttamente.");
      void hapticSuccess();
    } catch {
      setPasswordError("Non è stato possibile aggiornare la password. Riprova.");
      void hapticError();
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <PageContainer className={styles.profile}>
      <m.header
        className={styles.hero}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reveal}
      >
        <p className={styles.kicker}>Account</p>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(account.name)}
          </div>
          <div className={styles.identityCopy}>
            <h1>{account.name}</h1>
            <p className={styles.meta}>{account.schoolName ?? "Scuola non assegnata"}</p>
            <span className={styles.roleBadge}>
              <Award aria-hidden="true" size={15} strokeWidth={2.2} />
              {roleLabel}
            </span>
          </div>
        </div>
        <Link className={styles.profileAccountLink} href={`/u/${account.userId}` as Route}>
          Apri la tua vetrina
        </Link>
      </m.header>

      <div className={styles.content}>
        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.04 }}
          aria-labelledby="info-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Anagrafica</p>
              <h2 id="info-title">Informazioni personali</h2>
            </div>
          </div>
          <article className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.infoRow}>
              <span>Nome</span>
              <strong>{account.name}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Email</span>
              <strong>{account.email}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Scuola</span>
              <strong>{account.schoolName ?? "Non assegnata"}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Ruolo</span>
              <strong>{roleLabel}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Password</span>
              <button
                className={styles.textButton}
                type="button"
                aria-expanded={passwordFormOpen}
                onClick={() => {
                  setPasswordFormOpen((current) => !current);
                  setPasswordError(null);
                  setPasswordMessage(null);
                }}
              >
                {passwordFormOpen ? "Chiudi" : "Aggiorna"}
              </button>
            </div>
            {passwordFormOpen ? (
              <m.form
                animate={{ opacity: 1, y: 0 }}
                className={styles.passwordForm}
                initial={{ opacity: 0, y: -8 }}
                onSubmit={changePassword}
                transition={reveal}
              >
                <label className={styles.formLabel}>
                  Password attuale
                  <input
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label className={styles.formLabel}>
                  Nuova password
                  <input name="password" type="password" autoComplete="new-password" required />
                </label>
                <label className={styles.formLabel}>
                  Conferma nuova password
                  <input
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </label>
                {passwordError ? <p className={styles.formError}>{passwordError}</p> : null}
                {passwordMessage ? <p className={styles.formSuccess}>{passwordMessage}</p> : null}
                <button className={styles.submitButton} disabled={passwordPending} type="submit">
                  {passwordPending ? "Aggiornamento..." : "Aggiorna password"}
                </button>
              </m.form>
            ) : null}
          </article>
        </m.section>

        <section className={styles.section} aria-labelledby="history-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Saldo</p>
              <h2 id="history-title">Movimenti LP</h2>
            </div>
          </div>
          {account.history.length === 0 ? (
            <p className={styles.emptyState}>Nessun movimento recente registrato.</p>
          ) : (
            <ol className={styles.historyList}>
              {account.history.map((entry) => (
                <li key={entry.id}>
                  <strong className={entry.amount >= 0 ? styles.historyGain : styles.historyLoss}>
                    {entry.amount >= 0 ? `+${entry.amount}` : entry.amount} LP
                  </strong>
                  <span>{entry.reason}</span>
                  <time>{entry.date}</time>
                </li>
              ))}
            </ol>
          )}
        </section>

        <nav className={styles.accountNav} aria-label="Altre sezioni account">
          <Link className={styles.textButton} href={"/profile/candidature" as Route}>
            Candidature
          </Link>
          <Link className={styles.textButton} href={"/profile/impostazioni" as Route}>
            Impostazioni
          </Link>
        </nav>
      </div>
    </PageContainer>
  );
}
