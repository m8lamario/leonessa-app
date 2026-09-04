"use client";

import { useState } from "react";
import { Coins, Gift, History, Plus, RefreshCw, Save, Tag } from "lucide-react";
import { PageContainer } from "@/shared/components";
import styles from "./economy-control-center.module.css";

type EconomyConfigItem = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  category: string;
  rewardLp: number;
  enabled: boolean;
};

type HistoryItem = {
  id: string;
  oldValue: number;
  newValue: number;
  oldEnabled: boolean;
  newEnabled: boolean;
  reason: string | null;
  createdAt: string;
  actor: { name: string | null; surname: string | null; email: string } | null;
  config: { key: string; title: string } | null;
};

type RewardItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  costLp: number;
  imageUrl: string | null;
  stock: number | null;
  active: boolean;
  conditions: string | null;
  maxPerUser: number | null;
  displayOrder: number;
};

type RedemptionItem = {
  id: string;
  costLp: number;
  status: string;
  code: string | null;
  createdAt: string;
  user: { name: string | null; surname: string | null; email: string };
  reward: { name: string; category: string; costLp: number };
};

type InitialData = {
  configs: EconomyConfigItem[];
  history: HistoryItem[];
  rewards: RewardItem[];
  redemptions: RedemptionItem[];
};

export function EconomyControlCenter({ initialData }: { initialData: InitialData }) {
  const [activeTab, setActiveTab] = useState<"economy" | "rewards" | "redemptions" | "history">("economy");
  const [configs, setConfigs] = useState<EconomyConfigItem[]>(initialData.configs);
  const [history, setHistory] = useState<HistoryItem[]>(initialData.history);
  const [rewards, setRewards] = useState<RewardItem[]>(initialData.rewards);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>(initialData.redemptions);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Economy config editing state
  const [editingConfig, setEditingConfig] = useState<EconomyConfigItem | null>(null);
  const [editLp, setEditLp] = useState<number>(0);
  const [editEnabled, setEditEnabled] = useState<boolean>(true);
  const [editReason, setEditReason] = useState<string>("");

  // Reward editing state
  const [editingReward, setEditingReward] = useState<Partial<RewardItem> | null>(null);
  const [isCreatingReward, setIsCreatingReward] = useState(false);

  async function refreshAll() {
    setBusy(true);
    try {
      const [configsRes, rewardsRes, redemptionsRes] = await Promise.all([
        fetch("/api/admin/economy/configs"),
        fetch("/api/admin/economy/rewards"),
        fetch("/api/admin/economy/redemptions"),
      ]);

      if (configsRes.ok) {
        const data = await configsRes.json();
        setConfigs(data.configs);
        setHistory(data.history);
      }
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards);
      }
      if (redemptionsRes.ok) {
        const data = await redemptionsRes.json();
        setRedemptions(data.redemptions);
      }
      setMessage({ type: "success", text: "Dati aggiornati." });
    } catch {
      setMessage({ type: "error", text: "Impossibile aggiornare i dati." });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveConfig() {
    if (!editingConfig) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/economy/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editingConfig.key,
          title: editingConfig.title,
          description: editingConfig.description,
          category: editingConfig.category,
          rewardLp: Number(editLp),
          enabled: editEnabled,
          reason: editReason || "Modifica da Control Center",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Errore durante il salvataggio.");
      }

      setMessage({ type: "success", text: `Configurazione '${editingConfig.key}' salvata.` });
      setEditingConfig(null);
      await refreshAll();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveReward() {
    if (!editingReward) return;
    setBusy(true);
    try {
      if (isCreatingReward) {
        const res = await fetch("/api/admin/economy/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingReward),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Errore creazione premio.");
        }
        setMessage({ type: "success", text: "Nuovo premio creato con successo." });
      } else {
        const res = await fetch(`/api/admin/economy/rewards/${editingReward.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingReward),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Errore aggiornamento premio.");
        }
        setMessage({ type: "success", text: "Premio aggiornato con successo." });
      }
      setEditingReward(null);
      setIsCreatingReward(false);
      await refreshAll();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteReward(id: string) {
    if (!confirm("Sei sicuro di voler eliminare (disattivare) questo premio?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/economy/rewards/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Errore eliminazione");
      }
      setMessage({ type: "success", text: "Premio eliminato." });
      await refreshAll();
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Errore" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Control Center</p>
          <h1>LP Economy & Rewards</h1>
          <p className={styles.sub}>
            Gestisci centralmente le fonti di guadagno LP, i valori economici, il catalogo premi e controlla lo storico dei riscatti.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button className={styles.btnSecondary} onClick={refreshAll} disabled={busy} type="button">
            <RefreshCw size={16} /> Aggiorna
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`${styles.message} ${
            message.type === "success" ? styles.messageSuccess : styles.messageError
          }`}
        >
          {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "economy" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("economy")}
          type="button"
        >
          <Coins size={16} /> Fonti LP & Valori
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "rewards" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("rewards")}
          type="button"
        >
          <Gift size={16} /> Catalogo Premi
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "redemptions" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("redemptions")}
          type="button"
        >
          <Tag size={16} /> Riscatti ({redemptions.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "history" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("history")}
          type="button"
        >
          <History size={16} /> Audit & Modifiche
        </button>
      </div>

      {activeTab === "economy" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Fonti di Guadagno LP</h2>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Chiave</th>
                  <th>Titolo & Descrizione</th>
                  <th>Categoria</th>
                  <th>LP Assegnati</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg) => (
                  <tr key={cfg.key}>
                    <td>
                      <code>{cfg.key}</code>
                    </td>
                    <td>
                      <strong>{cfg.title}</strong>
                      {cfg.description && (
                        <div style={{ color: "#8a9fc4", fontSize: "0.74rem" }}>{cfg.description}</div>
                      )}
                    </td>
                    <td>
                      <span className={styles.badge}>{cfg.category}</span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--color-primary-light, #80a1ff)" }}>
                        +{cfg.rewardLp} LP
                      </strong>
                    </td>
                    <td>
                      <span className={cfg.enabled ? styles.statusActive : styles.statusInactive}>
                        {cfg.enabled ? "ATTIVA" : "DISATTIVA"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={styles.btnSecondary}
                        style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                        onClick={() => {
                          setEditingConfig(cfg);
                          setEditLp(cfg.rewardLp);
                          setEditEnabled(cfg.enabled);
                          setEditReason("");
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

          {editingConfig && (
            <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #305cff55", borderRadius: "8px", background: "#0a133b" }}>
              <h3 style={{ margin: "0 0 16px" }}>Modifica Configurazione: {editingConfig.title}</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Valore Ricompensa (LP)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={editLp}
                    onChange={(e) => setEditLp(Number(e.target.value))}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Stato Fonte</label>
                  <select
                    className={styles.select}
                    value={editEnabled ? "true" : "false"}
                    onChange={(e) => setEditEnabled(e.target.value === "true")}
                  >
                    <option value="true">Attiva</option>
                    <option value="false">Disattivata</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Motivo Modifica (Audit trail)</label>
                  <input
                    className={styles.input}
                    placeholder="Es. Bilanciamento ricompense inizio stagione"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button className={styles.btnPrimary} onClick={handleSaveConfig} disabled={busy} type="button">
                  <Save size={16} /> Salva Modifiche
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setEditingConfig(null)}
                  disabled={busy}
                  type="button"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "rewards" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Catalogo Premi</h2>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setIsCreatingReward(true);
                setEditingReward({
                  name: "",
                  description: "",
                  category: "merchandise",
                  costLp: 100,
                  stock: null,
                  active: true,
                  conditions: "",
                  maxPerUser: 1,
                  displayOrder: rewards.length,
                });
              }}
              type="button"
            >
              <Plus size={16} /> Nuovo Premio
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome & Descrizione</th>
                  <th>Categoria</th>
                  <th>Costo LP</th>
                  <th>Disponibilità (Stock)</th>
                  <th>Limite / Utente</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td>
                      <strong>{reward.name}</strong>
                      <div style={{ color: "#8a9fc4", fontSize: "0.74rem" }}>{reward.description}</div>
                      {reward.conditions && (
                        <div style={{ color: "#f7c948", fontSize: "0.7rem", marginTop: "4px" }}>
                          Condizioni: {reward.conditions}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={styles.badge}>{reward.category}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#ffd166" }}>{reward.costLp} LP</strong>
                    </td>
                    <td>
                      {reward.stock === null ? (
                        <span style={{ color: "#6ee7b7" }}>Illimitato</span>
                      ) : reward.stock <= 0 ? (
                        <span style={{ color: "#fca5a5" }}>Esaurito (0)</span>
                      ) : (
                        <span>{reward.stock} rimasti</span>
                      )}
                    </td>
                    <td>{reward.maxPerUser ? `${reward.maxPerUser} per utente` : "Illimitato"}</td>
                    <td>
                      <span className={reward.active ? styles.statusActive : styles.statusInactive}>
                        {reward.active ? "ATTIVO" : "INATTIVO"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className={styles.btnSecondary}
                          style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                          onClick={() => {
                            setIsCreatingReward(false);
                            setEditingReward(reward);
                          }}
                          type="button"
                        >
                          Modifica
                        </button>
                        <button
                          className={styles.btnDanger}
                          style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                          onClick={() => handleDeleteReward(reward.id)}
                          type="button"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingReward && (
            <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #305cff55", borderRadius: "8px", background: "#0a133b" }}>
              <h3 style={{ margin: "0 0 16px" }}>
                {isCreatingReward ? "Crea Nuovo Premio" : `Modifica Premio: ${editingReward.name}`}
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nome Premio</label>
                  <input
                    className={styles.input}
                    value={editingReward.name || ""}
                    onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Categoria</label>
                  <select
                    className={styles.select}
                    value={editingReward.category || "merchandise"}
                    onChange={(e) => setEditingReward({ ...editingReward, category: e.target.value })}
                  >
                    <option value="merchandise">Merchandising</option>
                    <option value="partner">Sconti Partner</option>
                    <option value="experience">Esperienze</option>
                    <option value="digital">Premi Digitali</option>
                    <option value="events">Eventi / Accessi</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Costo in LP</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={editingReward.costLp || 0}
                    onChange={(e) => setEditingReward({ ...editingReward, costLp: Number(e.target.value) })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Stock (vuoto = illimitato)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    placeholder="Illimitato"
                    value={editingReward.stock ?? ""}
                    onChange={(e) =>
                      setEditingReward({
                        ...editingReward,
                        stock: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Limite per utente (vuoto = illimitato)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    placeholder="Illimitato"
                    value={editingReward.maxPerUser ?? ""}
                    onChange={(e) =>
                      setEditingReward({
                        ...editingReward,
                        maxPerUser: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Stato Attivo</label>
                  <select
                    className={styles.select}
                    value={editingReward.active ? "true" : "false"}
                    onChange={(e) => setEditingReward({ ...editingReward, active: e.target.value === "true" })}
                  >
                    <option value="true">Attivo</option>
                    <option value="false">Inattivo</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Descrizione</label>
                  <textarea
                    className={styles.textarea}
                    value={editingReward.description || ""}
                    onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Condizioni speciali / Note di ritiro</label>
                  <input
                    className={styles.input}
                    placeholder="Es. Ritiro presso info-point Leonessa con codice"
                    value={editingReward.conditions || ""}
                    onChange={(e) => setEditingReward({ ...editingReward, conditions: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button className={styles.btnPrimary} onClick={handleSaveReward} disabled={busy} type="button">
                  <Save size={16} /> Salva Premio
                </button>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setEditingReward(null)}
                  disabled={busy}
                  type="button"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "redemptions" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Storico Riscatti Utenti</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Utente</th>
                  <th>Premio</th>
                  <th>Costo LP</th>
                  <th>Codice Claim</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#8a9fc4", padding: "24px" }}>
                      Nessun riscatto registrato al momento.
                    </td>
                  </tr>
                ) : (
                  redemptions.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.createdAt).toLocaleString("it-IT")}</td>
                      <td>
                        <strong>
                          {r.user.name} {r.user.surname}
                        </strong>
                        <div style={{ color: "#8a9fc4", fontSize: "0.72rem" }}>{r.user.email}</div>
                      </td>
                      <td>{r.reward.name}</td>
                      <td style={{ color: "#ffd166", fontWeight: "bold" }}>-{r.costLp} LP</td>
                      <td>
                        <code>{r.code || "—"}</code>
                      </td>
                      <td>
                        <span className={r.status === "COMPLETED" ? styles.statusActive : styles.statusInactive}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Audit Log Modifiche Economiche</h2>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Admin</th>
                  <th>Regola / Fonte</th>
                  <th>Variazione Valore</th>
                  <th>Variazione Stato</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#8a9fc4", padding: "24px" }}>
                      Nessuna modifica economica registrata.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.createdAt).toLocaleString("it-IT")}</td>
                      <td>
                        {h.actor ? (
                          <>
                            <strong>
                              {h.actor.name} {h.actor.surname}
                            </strong>
                            <div style={{ color: "#8a9fc4", fontSize: "0.72rem" }}>{h.actor.email}</div>
                          </>
                        ) : (
                          "Sistema"
                        )}
                      </td>
                      <td>
                        <strong>{h.config?.title || "Configurazione"}</strong>
                        <div>
                          <code>{h.config?.key}</code>
                        </div>
                      </td>
                      <td>
                        {h.oldValue} LP → <strong>{h.newValue} LP</strong>
                      </td>
                      <td>
                        {h.oldEnabled ? "Attivo" : "Disattivo"} →{" "}
                        <strong>{h.newEnabled ? "Attivo" : "Disattivo"}</strong>
                      </td>
                      <td>{h.reason || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PageContainer>
  );
}
