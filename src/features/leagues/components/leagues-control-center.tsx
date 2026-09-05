"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { Handshake, Plus, RefreshCw, Save, Trophy } from "lucide-react";

import type { AdminLeague, AdminLeagueDetail, AdminPartner } from "@/features/leagues/types/leagues";
import { PageContainer } from "@/shared/components";
import styles from "@/features/economy/components/economy-control-center.module.css";

type Tab = "leagues" | "partners";

function toDatetimeLocal(iso: string) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function defaultLeagueForm(partnerId: string): LeagueForm {
  const start = new Date();
  const end = new Date(start.getTime() + 30 * 86_400_000);
  return {
    partnerId,
    name: "",
    description: "",
    imageUrl: "",
    startAt: toDatetimeLocal(start.toISOString()),
    endAt: toDatetimeLocal(end.toISOString()),
    status: "DRAFT",
    enrollmentOpen: true,
    prizeTitle: "",
    prizeDescription: "",
    awardedPositions: 1,
    conditionsText: "",
    minLevel: "",
    schoolRequired: false,
  };
}

type LeagueForm = {
  partnerId: string;
  name: string;
  description: string;
  imageUrl: string;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrollmentOpen: boolean;
  prizeTitle: string;
  prizeDescription: string;
  awardedPositions: number;
  conditionsText: string;
  minLevel: string;
  schoolRequired: boolean;
};

function leagueToForm(league: AdminLeague): LeagueForm {
  return {
    partnerId: league.partnerId,
    name: league.name,
    description: league.description ?? "",
    imageUrl: league.imageUrl ?? "",
    startAt: toDatetimeLocal(league.startAt),
    endAt: toDatetimeLocal(league.endAt),
    status: league.status,
    enrollmentOpen: league.enrollmentOpen,
    prizeTitle: league.prizeTitle,
    prizeDescription: league.prizeDescription ?? "",
    awardedPositions: league.awardedPositions,
    conditionsText: league.conditionsText ?? "",
    minLevel: league.conditions.minLevel ? String(league.conditions.minLevel) : "",
    schoolRequired: Boolean(league.conditions.schoolRequired),
  };
}

function formPayload(form: LeagueForm) {
  return {
    partnerId: form.partnerId,
    name: form.name,
    description: form.description || null,
    imageUrl: form.imageUrl || null,
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    status: form.status,
    enrollmentOpen: form.enrollmentOpen,
    prizeTitle: form.prizeTitle,
    prizeDescription: form.prizeDescription || null,
    awardedPositions: Number(form.awardedPositions) || 1,
    conditionsText: form.conditionsText || null,
    conditions: {
      minLevel: form.minLevel ? Number(form.minLevel) : undefined,
      schoolRequired: form.schoolRequired || undefined,
    },
  };
}

export function LeaguesControlCenter({
  initialPartners,
  initialLeagues,
}: {
  initialPartners: AdminPartner[];
  initialLeagues: AdminLeague[];
}) {
  const [tab, setTab] = useState<Tab>("leagues");
  const [partners, setPartners] = useState(initialPartners);
  const [leagues, setLeagues] = useState(initialLeagues);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partial<AdminPartner> | null>(null);
  const [creatingPartner, setCreatingPartner] = useState(false);
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [creatingLeague, setCreatingLeague] = useState(false);
  const [leagueForm, setLeagueForm] = useState<LeagueForm>(defaultLeagueForm(initialPartners[0]?.id ?? ""));
  const [detail, setDetail] = useState<AdminLeagueDetail | null>(null);

  const activePartners = useMemo(() => partners.filter((partner) => partner.active), [partners]);

  async function refresh() {
    setBusy(true);
    try {
      const [partnersRes, leaguesRes] = await Promise.all([
        fetch("/api/admin/partners"),
        fetch("/api/admin/leagues"),
      ]);
      if (partnersRes.ok) setPartners((await partnersRes.json()).partners);
      if (leaguesRes.ok) setLeagues((await leaguesRes.json()).leagues);
      setMessage({ type: "success", text: "Dati aggiornati." });
    } catch {
      setMessage({ type: "error", text: "Impossibile aggiornare i dati." });
    } finally {
      setBusy(false);
    }
  }

  async function savePartner() {
    if (!editingPartner?.name) return;
    setBusy(true);
    try {
      const response = await fetch(
        creatingPartner ? "/api/admin/partners" : `/api/admin/partners/${editingPartner.id}`,
        {
          method: creatingPartner ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingPartner.name,
            description: editingPartner.description,
            logoUrl: editingPartner.logoUrl,
            active: editingPartner.active ?? true,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(((await response.json()) as { message?: string }).message ?? "Errore partner");
      }
      setCreatingPartner(false);
      setEditingPartner(null);
      setMessage({ type: "success", text: creatingPartner ? "Partner creato." : "Partner aggiornato." });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  async function saveLeague() {
    setBusy(true);
    try {
      const response = await fetch(
        creatingLeague ? "/api/admin/leagues" : `/api/admin/leagues/${editingLeagueId}`,
        {
          method: creatingLeague ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formPayload(leagueForm)),
        },
      );
      if (!response.ok) {
        throw new Error(((await response.json()) as { message?: string }).message ?? "Errore lega");
      }
      setCreatingLeague(false);
      setEditingLeagueId(null);
      setMessage({ type: "success", text: creatingLeague ? "Lega creata." : "Lega aggiornata." });
      await refresh();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  async function openDetail(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/leagues/${id}`);
      if (!response.ok) {
        throw new Error(((await response.json()) as { message?: string }).message ?? "Errore classifica");
      }
      setDetail(((await response.json()) as { league: AdminLeagueDetail }).league);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Control Center</p>
          <h1>Leghe Sponsor</h1>
          <p className={styles.sub}>
            Crea partner e leghe sponsorizzate. Il punteggio V1 usa gli LP guadagnati dopo l&apos;iscrizione.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link className={styles.badge} href={"/admin/economy" as Route}>
            LP Economy
          </Link>
          <button className={styles.btnSecondary} disabled={busy} onClick={() => void refresh()} type="button">
            <RefreshCw size={16} /> Aggiorna
          </button>
        </div>
      </header>

      {message ? (
        <div className={`${styles.message} ${message.type === "success" ? styles.messageSuccess : styles.messageError}`}>
          {message.text}
        </div>
      ) : null}

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === "leagues" ? styles.activeTab : ""}`}
          onClick={() => setTab("leagues")}
          type="button"
        >
          <Trophy size={16} /> Leghe
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "partners" ? styles.activeTab : ""}`}
          onClick={() => setTab("partners")}
          type="button"
        >
          <Handshake size={16} /> Partner
        </button>
      </div>

      {tab === "partners" ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Partner</h2>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setCreatingPartner(true);
                setEditingPartner({ name: "", description: "", logoUrl: "", active: true });
              }}
              type="button"
            >
              <Plus size={16} /> Nuovo partner
            </button>
          </div>
          {editingPartner ? (
            <div className={styles.formGrid} style={{ marginBottom: 16 }}>
              <div className={styles.formGroup}>
                <label htmlFor="partner-name">Nome</label>
                <input
                  className={styles.input}
                  id="partner-name"
                  onChange={(event) => setEditingPartner({ ...editingPartner, name: event.target.value })}
                  value={editingPartner.name ?? ""}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="partner-logo">Logo URL</label>
                <input
                  className={styles.input}
                  id="partner-logo"
                  onChange={(event) => setEditingPartner({ ...editingPartner, logoUrl: event.target.value })}
                  value={editingPartner.logoUrl ?? ""}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="partner-description">Descrizione</label>
                <textarea
                  className={styles.textarea}
                  id="partner-description"
                  onChange={(event) =>
                    setEditingPartner({ ...editingPartner, description: event.target.value })
                  }
                  value={editingPartner.description ?? ""}
                />
              </div>
              <label className={styles.formGroup}>
                Attivo
                <input
                  checked={editingPartner.active ?? true}
                  onChange={(event) => setEditingPartner({ ...editingPartner, active: event.target.checked })}
                  type="checkbox"
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                <button className={styles.btnPrimary} disabled={busy} onClick={() => void savePartner()} type="button">
                  <Save size={16} /> Salva
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    setEditingPartner(null);
                    setCreatingPartner(false);
                  }}
                  type="button"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Stato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.id}>
                    <td>{partner.name}</td>
                    <td>
                      <span className={partner.active ? styles.statusActive : styles.statusInactive}>
                        {partner.active ? "Attivo" : "Disattivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`${styles.btnSecondary} ${styles.actionBtn}`}
                        onClick={() => {
                          setCreatingPartner(false);
                          setEditingPartner(partner);
                        }}
                        type="button"
                      >
                        Modifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Leghe</h2>
            <button
              className={styles.btnPrimary}
              disabled={activePartners.length === 0}
              onClick={() => {
                setCreatingLeague(true);
                setEditingLeagueId(null);
                setLeagueForm(defaultLeagueForm(activePartners[0]?.id ?? ""));
              }}
              type="button"
            >
              <Plus size={16} /> Nuova lega
            </button>
          </div>
          {activePartners.length === 0 ? (
            <p className={styles.sub}>Crea prima un partner nella scheda Partner.</p>
          ) : null}
          {creatingLeague || editingLeagueId ? (
            <div className={styles.formGrid} style={{ marginBottom: 16 }}>
              <div className={styles.formGroup}>
                <label htmlFor="league-partner">Sponsor</label>
                <select
                  className={styles.select}
                  id="league-partner"
                  onChange={(event) => setLeagueForm({ ...leagueForm, partnerId: event.target.value })}
                  value={leagueForm.partnerId}
                >
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-name">Nome</label>
                <input
                  className={styles.input}
                  id="league-name"
                  onChange={(event) => setLeagueForm({ ...leagueForm, name: event.target.value })}
                  value={leagueForm.name}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-start">Inizio</label>
                <input
                  className={styles.input}
                  id="league-start"
                  onChange={(event) => setLeagueForm({ ...leagueForm, startAt: event.target.value })}
                  type="datetime-local"
                  value={leagueForm.startAt}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-end">Fine</label>
                <input
                  className={styles.input}
                  id="league-end"
                  onChange={(event) => setLeagueForm({ ...leagueForm, endAt: event.target.value })}
                  type="datetime-local"
                  value={leagueForm.endAt}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-status">Stato</label>
                <select
                  className={styles.select}
                  id="league-status"
                  onChange={(event) =>
                    setLeagueForm({
                      ...leagueForm,
                      status: event.target.value as LeagueForm["status"],
                    })
                  }
                  value={leagueForm.status}
                >
                  <option value="DRAFT">Bozza</option>
                  <option value="PUBLISHED">Pubblicata</option>
                  <option value="ARCHIVED">Archiviata</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-rule">Punteggio</label>
                <select className={styles.select} disabled id="league-rule" value="LP_EARNED_DURING_LEAGUE">
                  <option value="LP_EARNED_DURING_LEAGUE">LP guadagnati durante la lega</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-prize">Premio</label>
                <input
                  className={styles.input}
                  id="league-prize"
                  onChange={(event) => setLeagueForm({ ...leagueForm, prizeTitle: event.target.value })}
                  value={leagueForm.prizeTitle}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-positions">Posizioni premiate</label>
                <input
                  className={styles.input}
                  id="league-positions"
                  min={1}
                  onChange={(event) =>
                    setLeagueForm({ ...leagueForm, awardedPositions: Number(event.target.value) })
                  }
                  type="number"
                  value={leagueForm.awardedPositions}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="league-description">Descrizione</label>
                <textarea
                  className={styles.textarea}
                  id="league-description"
                  onChange={(event) => setLeagueForm({ ...leagueForm, description: event.target.value })}
                  value={leagueForm.description}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-prize-desc">Dettaglio premio</label>
                <input
                  className={styles.input}
                  id="league-prize-desc"
                  onChange={(event) =>
                    setLeagueForm({ ...leagueForm, prizeDescription: event.target.value })
                  }
                  value={leagueForm.prizeDescription}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-image">Immagine URL</label>
                <input
                  className={styles.input}
                  id="league-image"
                  onChange={(event) => setLeagueForm({ ...leagueForm, imageUrl: event.target.value })}
                  value={leagueForm.imageUrl}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-conditions">Condizioni (testo)</label>
                <input
                  className={styles.input}
                  id="league-conditions"
                  onChange={(event) =>
                    setLeagueForm({ ...leagueForm, conditionsText: event.target.value })
                  }
                  value={leagueForm.conditionsText}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="league-min-level">Livello minimo</label>
                <input
                  className={styles.input}
                  id="league-min-level"
                  min={0}
                  onChange={(event) => setLeagueForm({ ...leagueForm, minLevel: event.target.value })}
                  type="number"
                  value={leagueForm.minLevel}
                />
              </div>
              <label className={styles.formGroup}>
                Iscrizioni aperte
                <input
                  checked={leagueForm.enrollmentOpen}
                  onChange={(event) =>
                    setLeagueForm({ ...leagueForm, enrollmentOpen: event.target.checked })
                  }
                  type="checkbox"
                />
              </label>
              <label className={styles.formGroup}>
                Richiedi scuola
                <input
                  checked={leagueForm.schoolRequired}
                  onChange={(event) =>
                    setLeagueForm({ ...leagueForm, schoolRequired: event.target.checked })
                  }
                  type="checkbox"
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
                <button className={styles.btnPrimary} disabled={busy} onClick={() => void saveLeague()} type="button">
                  <Save size={16} /> Salva
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={() => {
                    setCreatingLeague(false);
                    setEditingLeagueId(null);
                  }}
                  type="button"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Lega</th>
                  <th>Sponsor</th>
                  <th>Stato</th>
                  <th>Iscritti</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {leagues.map((league) => (
                  <tr key={league.id}>
                    <td>{league.name}</td>
                    <td>{league.partnerName}</td>
                    <td>
                      <span className={league.status === "PUBLISHED" ? styles.statusActive : styles.statusInactive}>
                        {league.status}
                        {league.enrollmentOpen ? " · open" : ""}
                      </span>
                    </td>
                    <td>{league.participantCount}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button
                        className={`${styles.btnSecondary} ${styles.actionBtn}`}
                        onClick={() => {
                          setCreatingLeague(false);
                          setEditingLeagueId(league.id);
                          setLeagueForm(leagueToForm(league));
                        }}
                        type="button"
                      >
                        Modifica
                      </button>
                      <button
                        className={`${styles.btnSecondary} ${styles.actionBtn}`}
                        onClick={() => void openDetail(league.id)}
                        type="button"
                      >
                        Classifica
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detail ? (
            <div style={{ marginTop: 20 }}>
              <h3>{detail.name} · partecipanti</h3>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Utente</th>
                      <th>Punteggio</th>
                      <th>Iscritto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.participants.map((participant) => (
                      <tr key={participant.userId}>
                        <td>{participant.rank}</td>
                        <td>
                          {participant.name}
                          <br />
                          {participant.email}
                        </td>
                        <td>{participant.score}</td>
                        <td>{new Date(participant.joinedAt).toLocaleString("it-IT")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </PageContainer>
  );
}
