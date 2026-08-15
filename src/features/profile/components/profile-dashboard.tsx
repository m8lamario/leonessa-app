"use client";

import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Award, ClipboardList, Medal, Rocket, type LucideIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

import { PageContainer } from "@/shared/components";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import { profileMock } from "../mock/profile.mock";
import styles from "../profile.module.css";
import type { ApplicationKind, ApplicationStatus, ProfileApplication } from "../types/profile";

type ProfileDashboardProps = {
  email: string;
  name: string;
  role: string;
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

export function ProfileDashboard({ email, name, role }: ProfileDashboardProps) {
  const [openForm, setOpenForm] = useState<ApplicationKind | null>(null);
  const [applications, setApplications] = useState<ProfileApplication[]>(profileMock.applications);
  const [notifications, setNotifications] = useState({
    push: true,
    news: true,
    events: false,
    ranking: true,
    missions: true,
  });
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

  return (
    <PageContainer className={styles.profile}>
      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reveal}
      >
        <div className={styles.topline}>
          <p className={styles.kicker}>La tua identità Leonessa</p>
          <span aria-label="Badge in evidenza" className={styles.featuredBadge}>
            <Medal aria-hidden="true" size={15} strokeWidth={2.2} />
            {profileMock.featuredBadge}
          </span>
        </div>
        <div className={styles.identity}>
          <div className={styles.avatar} aria-hidden="true">
            {initials(name)}
          </div>
          <div className={styles.identityCopy}>
            <h1>{name}</h1>
            <p className={styles.meta}>{profileMock.schoolName}</p>
            <span className={styles.roleBadge}>
              <Award aria-hidden="true" size={15} strokeWidth={2.2} />
              {roleLabel}
            </span>
          </div>
        </div>
        <div className={styles.levelGrid}>
          <div>
            <span className={styles.statLabel}>Livello</span>
            <strong className={styles.statValue}>{profileMock.level}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>LP totali</span>
            <strong className={styles.statValue}>
              {profileMock.totalLp.toLocaleString("it-IT")}
            </strong>
          </div>
        </div>
      </motion.header>

      <div className={styles.content}>
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.06 }}
          aria-labelledby="showcase-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Il tuo percorso</p>
              <h2 id="showcase-title">Personal Showcase</h2>
            </div>
          </div>
          <div className={styles.statsGrid}>
            {profileMock.stats.map((stat) => (
              <article className={`${styles.card} ${styles.statCard}`} key={stat.label}>
                <span className={styles.statLabel}>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.detail}</p>
              </article>
            ))}
          </div>
          <article className={`${styles.card} ${styles.schoolCard}`}>
            <span className={styles.kicker}>La tua scuola</span>
            <strong>{profileMock.schoolName}</strong>
            <span>#{profileMock.schoolRank} nel Ranking Scuole</span>
          </article>
        </motion.section>

        <motion.section
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
                    <motion.form
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
                    </motion.form>
                  )}
                </article>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.18 }}
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
            {applications.map((application) => (
              <article className={`${styles.card} ${styles.application}`} key={application.id}>
                <div className={styles.applicationHeader}>
                  <h3>{application.title}</h3>
                  <span className={`${styles.status} ${statusClass(application.status)}`}>
                    {application.status}
                  </span>
                </div>
                <p className={styles.applicationDate}>Inviata il {application.submittedAt}</p>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section
          className={styles.settings}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...reveal, delay: 0.24 }}
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
              <button className={styles.textButton} type="button">
                Aggiorna
              </button>
            </div>
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
            <h3>Privacy e supporto</h3>
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
              <button className={styles.textButton} type="button">
                Contatti e segnala un problema
              </button>
            </div>
          </div>
          <button
            className={styles.logoutButton}
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Esci dall&apos;account
          </button>
        </motion.section>
      </div>
    </PageContainer>
  );
}
