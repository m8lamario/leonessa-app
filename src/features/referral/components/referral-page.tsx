"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Link2,
  MessageCircle,
  Share2,
  ShieldAlert,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageContainer } from "@/shared/components";

import type { ReferralDashboardData } from "../server/referral-service";
import styles from "./referral.module.css";

type CopyTarget = "code" | "link" | null;

const statusDetails = {
  PENDING: { label: "In attesa", icon: Clock3 },
  COMPLETED: { label: "Completato", icon: CheckCircle2 },
  BLOCKED: { label: "Da verificare", icon: ShieldAlert },
} as const;

export function ReferralPage({ data }: { data: ReferralDashboardData }) {
  const [copyTarget, setCopyTarget] = useState<CopyTarget>(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [deviceError, setDeviceError] = useState(false);
  const shareText = useMemo(
    () => `Entra anche tu nella Leonessa Cup! ⚽\nUsa il mio codice: ${data.code}\n${data.link}`,
    [data.code, data.link],
  );

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/referral/device", {
      method: "POST",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Device registration failed");
        setDeviceReady(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDeviceError(true);
      });

    return () => controller.abort();
  }, []);

  async function copy(value: string, target: Exclude<CopyTarget, null>) {
    await navigator.clipboard.writeText(value);
    setCopyTarget(target);
    window.setTimeout(() => setCopyTarget(null), 1800);
  }

  async function share() {
    if (!deviceReady) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Porta un amico — Leonessa Cup",
          text: shareText,
          url: data.link,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        await copy(data.link, "link");
      }
      return;
    }

    await copy(data.link, "link");
  }

  function shareOnWhatsApp() {
    if (!deviceReady) return;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <PageContainer className={styles.page}>
      <Link className={styles.backLink} href="/altro">
        <ArrowLeft aria-hidden="true" size={18} />
        Altro
      </Link>

      <header className={styles.hero}>
        <span className={styles.heroIcon}>
          <UserPlus aria-hidden="true" size={24} />
        </span>
        <p className={styles.kicker}>Leonessa insieme</p>
        <h1>Porta un amico</h1>
        <p>Invita un amico nella Leonessa Cup. Quando completa le condizioni, ricevete LP.</p>
      </header>

      <section className={styles.rewardCard} aria-labelledby="reward-title">
        <div className={styles.sectionTopline}>
          <span className={styles.sectionIcon}>
            <Gift aria-hidden="true" size={19} />
          </span>
          <p className={styles.kicker}>La ricompensa</p>
        </div>
        <h2 id="reward-title">
          {data.program.configured
            ? `+${data.program.referrerRewardLp} LP per te`
            : "Ricompense in configurazione"}
        </h2>
        <p>
          {data.program.configured
            ? `Il tuo amico riceverà +${data.program.inviteeRewardLp} LP dopo il completamento.`
            : "Gli importi e la condizione di completamento saranno attivati dalla Leonessa Cup. Nessun LP viene assegnato alla sola registrazione."}
        </p>
      </section>

      <section className={styles.codeCard} aria-labelledby="code-title">
        <div className={styles.sectionTopline}>
          <span className={styles.sectionIcon}>
            <Ticket aria-hidden="true" size={19} />
          </span>
          <p className={styles.kicker} id="code-title">
            Il tuo codice
          </p>
        </div>
        <strong className={styles.code}>{data.code}</strong>
        <p className={styles.linkPreview}>{data.link}</p>

        <div className={styles.actionGrid}>
          <button
            className={styles.secondaryButton}
            onClick={() => void copy(data.code, "code")}
            type="button"
          >
            {copyTarget === "code" ? (
              <Check aria-hidden="true" size={18} />
            ) : (
              <Copy aria-hidden="true" size={18} />
            )}
            {copyTarget === "code" ? "Copiato" : "Copia codice"}
          </button>
          <button
            className={styles.primaryButton}
            disabled={!deviceReady}
            onClick={() => void share()}
            type="button"
          >
            <Share2 aria-hidden="true" size={18} />
            Condividi
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => void copy(data.link, "link")}
            type="button"
          >
            {copyTarget === "link" ? (
              <Check aria-hidden="true" size={18} />
            ) : (
              <Link2 aria-hidden="true" size={18} />
            )}
            {copyTarget === "link" ? "Copiato" : "Copia link"}
          </button>
          <button
            className={styles.whatsappButton}
            disabled={!deviceReady}
            onClick={shareOnWhatsApp}
            type="button"
          >
            <MessageCircle aria-hidden="true" size={18} />
            WhatsApp
          </button>
        </div>

        {copyTarget === "link" && <p className={styles.feedback}>Link copiato.</p>}
        {deviceError && (
          <p className={styles.error} role="alert">
            Condivisione temporaneamente non disponibile. Ricarica la pagina e riprova.
          </p>
        )}
      </section>

      <section aria-labelledby="invitations-title">
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>I tuoi inviti</p>
            <h2 id="invitations-title">Stato</h2>
          </div>
          <span className={styles.totalBadge}>
            <Users aria-hidden="true" size={15} />
            {data.summary.total}
          </span>
        </div>

        {data.invitations.length === 0 ? (
          <div className={styles.emptyState}>
            <UserPlus aria-hidden="true" size={24} />
            <strong>Il primo invito parte da qui</strong>
            <p>Condividi il codice o il link personale per vedere lo stato in questa sezione.</p>
          </div>
        ) : (
          <div className={styles.invitationList}>
            {data.invitations.map((invitation) => {
              const detail = statusDetails[invitation.status];
              const StatusIcon = detail.icon;
              const statusClassName = {
                PENDING: styles.statusPENDING,
                COMPLETED: styles.statusCOMPLETED,
                BLOCKED: styles.statusBLOCKED,
              }[invitation.status];

              return (
                <article className={styles.invitation} key={invitation.id}>
                  <span className={styles.avatar} aria-hidden="true">
                    {invitation.invitedName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className={styles.invitationCopy}>
                    <strong>{invitation.invitedName}</strong>
                    <span>{invitation.createdAtLabel}</span>
                    {invitation.blockReason === "SAME_DEVICE" && (
                      <p>Serve un dispositivo differente per completare il referral.</p>
                    )}
                  </div>
                  <div className={styles.invitationMeta}>
                    <span className={statusClassName}>
                      <StatusIcon aria-hidden="true" size={14} />
                      {detail.label}
                    </span>
                    {invitation.rewardLp !== null && <b>+{invitation.rewardLp} LP</b>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.conditions} aria-labelledby="conditions-title">
        <div className={styles.sectionTopline}>
          <span className={styles.sectionIcon}>
            <ShieldAlert aria-hidden="true" size={19} />
          </span>
          <p className={styles.kicker}>Come funziona</p>
        </div>
        <h2 id="conditions-title">Condizioni</h2>
        <ul>
          <li>Ogni utente può utilizzare un solo codice referral.</li>
          <li>Non puoi auto-invitarti o cambiare referrer dopo l&apos;associazione.</li>
          <li>La sola apertura del link o registrazione non assegna LP.</li>
          <li>Ogni referral completato può essere ricompensato una sola volta.</li>
          <li>
            Un possibile utilizzo dallo stesso dispositivo mantiene l&apos;invito in verifica.
          </li>
          <li>I referral non validi non generano LP.</li>
        </ul>
      </section>
    </PageContainer>
  );
}
