"use client";

import { signOut } from "next-auth/react";
import { m } from "framer-motion";
import { Award, ClipboardList, Medal, Rocket, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { type FormEvent, useState } from "react";

import { PageContainer } from "@/shared/components";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import styles from "../profile.module.css";
import type { ApplicationKind, ApplicationStatus, ProfileApplication, ProfileIdentity } from "../types/profile";

type ProfileDashboardProps = {
  email: string;
  name: string;
  role: string;
  identity: ProfileIdentity;
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

const opportunities: Array<{
  kind: ApplicationKind;
  icon: LucideIcon;
  title: string;
  description: string;
  premium?: boolean;
}> = [
  {
    kind: "player",
    icon: Medal,
    title: "Diventa Giocatore",
    description: "Rappresenta il tuo istituto: candidati alla squadra della tua scuola.",
  },
  {
    kind: "team-staff",
    icon: ClipboardList,
    title: "Staff Squadra",
    description: "Aiuta il tuo team durante la stagione Leonessa.",
  },
  {
    kind: "leonessa-staff",
    icon: Rocket,
    title: "Entra nello Staff Leonessa",
    description: "Costruiamo la Leonessa Cup insieme: porta energia, idee e passione.",
    premium: true,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusClass(status: ApplicationStatus) {
  if (status === "Accettata") return styles.accepted;
  if (status === "Rifiutata") return styles.rejected;
  return styles.review;
}

export function ProfileDashboard({ email, name, role, identity }: ProfileDashboardProps) {
  const [openForm, setOpenForm] = useState<ApplicationKind | null>(null);
  const [applications, setApplications] = useState<ProfileApplication[]>([]);
  const [notifications, setNotifications] = useState({
    push: true,
    news: true,
    events: false,
    ranking: true,
    missions: true,
  });
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);
  const roleLabel = roleLabels[role] ?? "Supporter";

  function submitApplication(
    event: FormEvent<HTMLFormElement>,
    opportunity: (typeof opportunities)[number],
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setApplications((current) => [
      {
        id: `${opportunity.kind}-${Date.now()}`,
        kind: opportunity.kind,
        title: opportunity.title,
        status: "In revisione",
        submittedAt: "Oggi",
      },
      ...current,
    ]);
    form.reset();
    setOpenForm(null);
    void hapticSuccess();
  }

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
        <div className={styles.topline}>
          <p className={styles.kicker}>La tua identità Leonessa</p>
          {identity.featuredBadge ? (
            <span aria-label="Badge in evidenza" className={styles.featuredBadge}>
              <Medal aria-hidden="true" size={15} strokeWidth={2.2} />
              {identity.featuredBadge}
            </span>
          ) : null}
        </div>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(name)}
          </div>
          <div className={styles.identityCopy}>
            <h1>{name}</h1>
            <p className={styles.meta}>{identity.schoolName ?? "Scuola non assegnata"}</p>
            {identity.bio ? <p className={styles.meta}>{identity.bio}</p> : null}
            <span className={styles.roleBadge}>
              <Award aria-hidden="true" size={15} strokeWidth={2.2} />
              {roleLabel}
            </span>
          </div>
        </div>
        <div className={styles.levelGrid}>
          <div>
            <span className={styles.statLabel}>Livello</span>
            <strong className={styles.statValue}>{identity.level}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Ranking</span>
            <strong className={styles.statValue}>
              {identity.rankingPosition ? `#${identity.rankingPosition}` : "—"}
            </strong>
          </div>
          <div>
            <span className={styles.statLabel}>LP</span>
            <strong className={styles.statValue}>
              {identity.totalLp.toLocaleString("it-IT")}
            </strong>
          </div>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Progresso livello"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={identity.levelProgressPercent}
        >
          <span style={{ width: `${identity.levelProgressPercent}%` }} />
        </div>
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
              <p className={styles.kicker}>Account</p>
              <h2 id="info-title">Informazioni personali</h2>
            </div>
          </div>
          <article className={`${styles.card} ${styles.infoCard}`}>
            <div className={styles.infoRow}>
              <span>Nome</span>
              <strong>{name}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Scuola</span>
              <strong>{identity.schoolName ?? "Non assegnata"}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Ruolo</span>
              <strong>{roleLabel}</strong>
            </div>
          </article>
        </m.section>

        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.08 }}
          aria-labelledby="badges-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Collezione</p>
              <h2 id="badges-title">I miei badge</h2>
            </div>
            <Link className={styles.textLink} href={"/altro/badge" as Route}>
              Vedi tutti
            </Link>
          </div>
          {identity.badges.length === 0 ? (
            <p className={styles.emptyState}>Non hai ancora ottenuto badge.</p>
          ) : (
            <div className={styles.badgeList}>
              {identity.badges.map((badge) => (
                <article className={`${styles.card} ${styles.badgeItem}`} key={badge.id}>
                  <Medal aria-hidden="true" size={18} />
                  <div>
                    <strong>{badge.name}</strong>
                    <p>{badge.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </m.section>

        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.12 }}
          aria-labelledby="showcase-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Il tuo percorso</p>
              <h2 id="showcase-title">Le mie statistiche</h2>
            </div>
          </div>
          <div className={styles.statsGrid}>
            {identity.stats.map((stat) => (
              <article className={`${styles.card} ${styles.statCard}`} key={stat.label}>
                <span className={styles.statLabel}>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.detail}</p>
              </article>
            ))}
          </div>
          {identity.schoolName ? (
            <article className={`${styles.card} ${styles.schoolCard}`}>
              <span className={styles.kicker}>La tua scuola</span>
              <strong>{identity.schoolName}</strong>
              <span>
                {identity.schoolRank
                  ? `#${identity.schoolRank} nel Ranking Scuole`
                  : "Posizione non disponibile"}
              </span>
            </article>
          ) : null}
        </m.section>

        <m.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.12 }}
          aria-labelledby="opportunities-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Scendi in campo</p>
              <h2 id="opportunities-title">Opportunità Leonessa</h2>
            </div>
          </div>
          <div className={styles.opportunities}>
            {opportunities.map((opportunity) => {
              const isOpen = openForm === opportunity.kind;
              return (
                <article
                  className={`${styles.card} ${styles.opportunity} ${opportunity.premium ? styles.premiumCard : ""}`}
                  key={opportunity.kind}
                >
                  <opportunity.icon aria-hidden="true" size={28} strokeWidth={1.8} />
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.description}</p>
                  <button
                    className={styles.actionButton}
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenForm(isOpen ? null : opportunity.kind)}
                  >
                    {isOpen ? "Chiudi candidatura" : "Candidati"}
                  </button>
                  {isOpen && (
                    <m.form
                      animate={{ opacity: 1, scale: 1 }}
                      className={styles.applicationForm}
                      initial={{ opacity: 0, scale: 0.98 }}
                      onInvalid={() => void hapticError()}
                      onSubmit={(event) => submitApplication(event, opportunity)}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                          Nome
                          <input
                            aria-label="Nome"
                            defaultValue={name.split(" ")[0]}
                            name="firstName"
                            required
                          />
                        </label>
                        <label className={styles.formLabel}>
                          Cognome
                          <input
                            aria-label="Cognome"
                            defaultValue={name.split(" ").slice(1).join(" ")}
                            name="lastName"
                            required
                          />
                        </label>
                      </div>
                      {opportunity.kind === "player" && (
                        <label className={styles.formLabel}>
                          Classe
                          <input name="classroom" placeholder="Es. 4B" required />
                        </label>
                      )}
                      <label className={styles.formLabel}>
                        Numero WhatsApp
                        <input
                          inputMode="tel"
                          name="whatsapp"
                          placeholder="333 123 4567"
                          required
                          type="tel"
                        />
                      </label>
                      <label className={styles.formLabel}>
                        Motivazione
                        <textarea
                          name="motivation"
                          placeholder="Raccontaci perché vuoi partecipare"
                          required
                        />
                      </label>
                      <button className={styles.submitButton} type="submit">
                        Invia candidatura
                      </button>
                    </m.form>
                  )}
                </article>
              );
            })}
          </div>
        </m.section>

        <section
          className={styles.section}
          aria-labelledby="applications-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Sempre con te</p>
              <h2 id="applications-title">Le mie candidature</h2>
            </div>
            <span className={styles.count}>{applications.length}</span>
          </div>
          <div className={styles.applicationList}>
            {applications.length === 0 ? (
              <p className={styles.emptyState}>Non hai ancora inviato candidature.</p>
            ) : (
              applications.map((application) => (
              <article className={`${styles.card} ${styles.application}`} key={application.id}>
                <div className={styles.applicationHeader}>
                  <h3>{application.title}</h3>
                  <span className={`${styles.status} ${statusClass(application.status)}`}>
                    {application.status}
                  </span>
                </div>
                <p className={styles.applicationDate}>Inviata il {application.submittedAt}</p>
              </article>
              ))
            )}
          </div>
        </section>

        <section
          className={styles.settings}
          aria-labelledby="settings-title"
        >
          <p className={styles.kicker}>In secondo piano</p>
          <h2 id="settings-title">Impostazioni</h2>
          <p className={styles.settingsIntro}>Gestisci il tuo account e come vuoi vivere la Cup.</p>
          <div className={styles.settingGroup}>
            <h3>Account</h3>
            <div className={styles.settingRow}>
              <span>{email}</span>
              <button className={styles.textButton} type="button">
                Modifica
              </button>
            </div>
            <div className={styles.settingRow}>
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
            {passwordFormOpen && (
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
                {passwordError && <p className={styles.formError}>{passwordError}</p>}
                {passwordMessage && <p className={styles.formSuccess}>{passwordMessage}</p>}
                <button className={styles.submitButton} disabled={passwordPending} type="submit">
                  {passwordPending ? "Aggiornamento..." : "Aggiorna password"}
                </button>
              </m.form>
            )}
          </div>
          <div className={styles.settingGroup}>
            <h3>Notifiche</h3>
            {(
              [
                ["push", "Push notifications"],
                ["news", "News Leonessa"],
                ["events", "Eventi"],
                ["ranking", "Ranking"],
                ["missions", "Missioni"],
              ] as const
            ).map(([key, label]) => (
              <div className={styles.settingRow} key={key}>
                <span>{label}</span>
                <button
                  className={`${styles.switch} ${notifications[key] ? styles.switchOn : ""}`}
                  type="button"
                  role="switch"
                  aria-checked={notifications[key]}
                  aria-label={label}
                  onClick={() =>
                    setNotifications((current) => ({ ...current, [key]: !current[key] }))
                  }
                />
              </div>
            ))}
          </div>
          <div className={styles.settingGroup}>
            <h3>Privacy / account</h3>
            <div className={styles.settingRow}>
              <button className={styles.textButton} type="button">
                Privacy Policy
              </button>
            </div>
            <div className={styles.settingRow}>
              <button className={styles.textButton} type="button">
                Termini e gestione consensi
              </button>
            </div>
            <div className={styles.settingRow}>
              <Link className={styles.textButton} href={"/altro/assistenza" as Route}>
                Assistenza
              </Link>
            </div>
          </div>
          <button
            className={styles.logoutButton}
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Esci dall&apos;account
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
