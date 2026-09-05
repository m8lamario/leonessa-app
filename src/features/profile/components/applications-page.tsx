"use client";

import { ClipboardList, type LucideIcon, Medal, Rocket } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { PageContainer } from "@/shared/components";
import { error as hapticError, success as hapticSuccess } from "@/shared/lib/haptics";

import styles from "../profile.module.css";
import type {
  ApplicationKind,
  ApplicationStatus,
  CandidaturePageData,
  ProfileApplication,
} from "../types/profile";
import { AccountSubheader } from "./account-subheader";

type ApplicationsPageProps = {
  candidature: CandidaturePageData;
};

const opportunities: Array<{
  kind: ApplicationKind;
  icon: LucideIcon;
  title: string;
  description: string;
  persist?: boolean;
}> = [
  {
    kind: "player",
    icon: Medal,
    title: "Diventa Giocatore",
    description: "Rappresenta il tuo istituto: candidati alla squadra della tua scuola.",
    persist: true,
  },
  {
    kind: "team-staff",
    icon: ClipboardList,
    title: "Staff Squadra",
    description: "Aiuta il tuo team durante la stagione Leonessa.",
    persist: true,
  },
  {
    kind: "leonessa-staff",
    icon: Rocket,
    title: "Entra nello Staff Leonessa",
    description: "Scrivi al team Leonessa se vuoi collaborare all'organizzazione della Cup.",
  },
];

function statusClass(status: ApplicationStatus) {
  if (status === "Accettata") return styles.accepted;
  if (status === "Rifiutata") return styles.rejected;
  return styles.review;
}

function apiKind(kind: ApplicationKind) {
  return kind === "player" ? "PLAYER" : "STAFF";
}

export function ApplicationsPage({ candidature }: ApplicationsPageProps) {
  const [applications, setApplications] = useState<ProfileApplication[]>(candidature.applications);
  const [pendingKind, setPendingKind] = useState<ApplicationKind | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  async function submitApplication(kind: ApplicationKind) {
    if (!candidature.schoolTeamId || pendingKind) return;
    setApplyError(null);
    setPendingKind(kind);
    try {
      const response = await fetch(`/api/teams/${candidature.schoolTeamId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: apiKind(kind) }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        setApplyError(body.message ?? "Non è stato possibile inviare la candidatura.");
        void hapticError();
        return;
      }
      const title = opportunities.find((item) => item.kind === kind)?.title ?? "Candidatura";
      setApplications((current) => {
        if (current.some((item) => item.kind === kind)) return current;
        return [
          {
            id: `${kind}-${Date.now()}`,
            kind,
            title,
            status: "In revisione",
            submittedAt: "Oggi",
          },
          ...current,
        ];
      });
      void hapticSuccess();
    } catch {
      setApplyError("Non è stato possibile inviare la candidatura. Riprova.");
      void hapticError();
    } finally {
      setPendingKind(null);
    }
  }

  return (
    <PageContainer className={styles.profile}>
      <AccountSubheader
        kicker="Partecipa"
        lead="Candidati alla squadra della tua scuola o contatta lo staff Leonessa."
        title="Candidature"
      />

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="opportunities-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Opportunità</p>
              <h2 id="opportunities-title">Come entrare</h2>
            </div>
          </div>
          <div className={styles.opportunities}>
            {opportunities.map((opportunity) => {
              const existing = applications.find((item) => item.kind === opportunity.kind);
              return (
                <article className={`${styles.card} ${styles.opportunity}`} key={opportunity.kind}>
                  <opportunity.icon aria-hidden="true" size={24} strokeWidth={1.8} />
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.description}</p>
                  {opportunity.persist ? (
                    <button
                      className={styles.actionButton}
                      disabled={
                        Boolean(existing) ||
                        !candidature.schoolTeamId ||
                        pendingKind === opportunity.kind
                      }
                      onClick={() => void submitApplication(opportunity.kind)}
                      type="button"
                    >
                      {existing
                        ? existing.status
                        : candidature.schoolTeamId
                          ? pendingKind === opportunity.kind
                            ? "Invio..."
                            : "Candidati"
                          : "Squadra scuola non disponibile"}
                    </button>
                  ) : (
                    <Link className={styles.actionButton} href={"/altro/contatti" as Route}>
                      Contatta Leonessa
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
          {applyError ? (
            <p className={styles.formError} role="alert">
              {applyError}
            </p>
          ) : null}
        </section>

        <section className={styles.section} aria-labelledby="applications-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Stato</p>
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
      </div>
    </PageContainer>
  );
}
