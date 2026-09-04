"use client";
/* eslint-disable react/no-unescaped-entities */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Coins, Gift, Info, Loader2, Sparkles, Tag } from "lucide-react";
import { EmptyState, Modal, PageContainer } from "@/shared/components";
import styles from "../altro.module.css";
import { HubSubheader } from "./hub-subheader";

type RewardCatalogItem = {
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
  userRedeemedCount: number;
  isOutOfStock: boolean;
  reachedMaxPerUser: boolean;
  canAfford: boolean;
  canRedeem: boolean;
};

type RedemptionItem = {
  id: string;
  costLp: number;
  status: string;
  code: string | null;
  createdAt: string;
  reward: {
    id: string;
    name: string;
    description: string;
    category: string;
  };
};

export function PremiPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [rewards, setRewards] = useState<RewardCatalogItem[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "my-rewards">("catalog");

  // Redemption modal state
  const [selectedReward, setSelectedReward] = useState<RewardCatalogItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [successClaim, setSuccessClaim] = useState<{
    code: string | null;
    rewardName: string;
    costLp: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catRes, redRes] = await Promise.all([
        fetch("/api/rewards"),
        fetch("/api/rewards/redemptions"),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setBalance(catData.balance);
        setRewards(catData.rewards);
      }
      if (redRes.ok) {
        const redData = await redRes.json();
        setRedemptions(redData.redemptions);
      }
    } catch {
      // Keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const [catRes, redRes] = await Promise.all([
          fetch("/api/rewards"),
          fetch("/api/rewards/redemptions"),
        ]);
        if (!ignore) {
          if (catRes.ok) {
            const catData = await catRes.json();
            setBalance(catData.balance);
            setRewards(catData.rewards);
          }
          if (redRes.ok) {
            const redData = await redRes.json();
            setRedemptions(redData.redemptions);
          }
        }
      } catch {
        // Keep existing
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleConfirmRedeem() {
    if (!selectedReward) return;
    setRedeeming(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/rewards/${selectedReward.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: `client-${selectedReward.id}-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Errore durante il riscatto.");
      }

      setSuccessClaim({
        code: data.redemption.code,
        rewardName: selectedReward.name,
        costLp: selectedReward.costLp,
      });

      if (typeof data.remainingBalance === "number") {
        setBalance(data.remainingBalance);
      }

      await loadData();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Errore durante il riscatto.");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Leonessa Pass"
        lead="Qui troverai merch, sconti, esperienze e vantaggi esclusivi riscattabili con i tuoi LP."
        title="Premi"
      />

      <div className={styles.content}>
        {/* Top Info Banner */}
        <article className={styles.infoCard}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.destinationIcon} aria-hidden="true">
              <Gift size={18} />
            </span>
            {balance !== null && (
              <span className={styles.rewardCostBadge}>
                <Coins size={14} /> Saldo: {balance.toLocaleString("it-IT")} LP
              </span>
            )}
          </div>
          <h2>Come funzionano</h2>
          <p className={styles.emptyCopy}>
            Accumula LP partecipando agli eventi, completando missioni o giocando al Fanta Leonessa.
            Riscatta i premi del catalogo e ricevi il tuo codice univoco per il ritiro o l'utilizzo.
          </p>

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              className={activeTab === "catalog" ? styles.primaryButton : styles.ghostButton}
              onClick={() => setActiveTab("catalog")}
              type="button"
              style={{ minHeight: "38px", padding: "0 14px", fontSize: "0.78rem" }}
            >
              <Sparkles size={14} /> Catalogo Premi
            </button>
            <button
              className={activeTab === "my-rewards" ? styles.primaryButton : styles.ghostButton}
              onClick={() => setActiveTab("my-rewards")}
              type="button"
              style={{ minHeight: "38px", padding: "0 14px", fontSize: "0.78rem" }}
            >
              <Tag size={14} /> I Miei Riscatti ({redemptions.length})
            </button>
          </div>
        </article>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Loader2 className={styles.chevron} size={32} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : activeTab === "catalog" ? (
          rewards.length === 0 ? (
            <EmptyState
              title="Nessun premio disponibile"
              message="Il catalogo premi non è ancora stato pubblicato."
            />
          ) : (
            <div className={styles.rewardGrid}>
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className={`${styles.rewardCard} ${!reward.canRedeem ? styles.rewardCardDisabled : ""}`}
                >
                  <div>
                    <div className={styles.rewardHeader}>
                      <span className={styles.rewardCategory}>{reward.category}</span>
                      <span className={styles.rewardCostBadge}>
                        <Coins size={14} /> {reward.costLp.toLocaleString("it-IT")} LP
                      </span>
                    </div>

                    <h3 className={styles.rewardTitle}>{reward.name}</h3>
                    <p className={styles.rewardDescription}>{reward.description}</p>

                    {reward.conditions && (
                      <div className={styles.rewardConditions}>
                        <Info size={12} style={{ display: "inline", marginRight: "4px" }} />
                        {reward.conditions}
                      </div>
                    )}
                  </div>

                  <div className={styles.rewardFooter}>
                    <div className={styles.rewardMetaRow}>
                      <span>
                        {reward.stock === null
                          ? "Disponibile"
                          : reward.isOutOfStock
                          ? "Esaurito"
                          : `${reward.stock} disponibili`}
                      </span>
                      {reward.maxPerUser && (
                        <span>
                          Riscattati: {reward.userRedeemedCount} / {reward.maxPerUser}
                        </span>
                      )}
                    </div>

                    <button
                      className={styles.rewardButton}
                      disabled={!reward.canRedeem}
                      onClick={() => {
                        setSelectedReward(reward);
                        setErrorMsg(null);
                        setSuccessClaim(null);
                      }}
                      type="button"
                    >
                      {reward.isOutOfStock
                        ? "Esaurito"
                        : reward.reachedMaxPerUser
                        ? "Limite raggiunto"
                        : !reward.canAfford
                        ? "LP insufficienti"
                        : "Riscatta Premio"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : redemptions.length === 0 ? (
          <EmptyState
            title="Nessun premio riscattato"
            message="Non hai ancora riscattato premi. Consulta il catalogo per utilizzare i tuoi LP!"
          />
        ) : (
          <div className={styles.cardList}>
            {redemptions.map((item) => (
              <article key={item.id} className={styles.missionCard}>
                <div className={styles.cardTopline}>
                  <span className={styles.status}>{item.reward.category}</span>
                  <span className={styles.reward}>-{item.costLp} LP</span>
                </div>
                <h3>{item.reward.name}</h3>
                <p>{item.reward.description}</p>
                <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Riscattato il {new Date(item.createdAt).toLocaleDateString("it-IT")}
                  </span>
                  {item.code && (
                    <span className={styles.chip} style={{ letterSpacing: "0.08em" }}>
                      Codice: {item.code}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation / Success Modal */}
      <Modal
        open={Boolean(selectedReward)}
        title={successClaim ? "Premio Riscattato!" : "Conferma Riscatto"}
        onClose={() => {
          setSelectedReward(null);
          setSuccessClaim(null);
          setErrorMsg(null);
        }}
      >
        {successClaim ? (
          <div style={{ textAlign: "center", display: "grid", gap: "14px", padding: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", color: "#34d399" }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Complimenti!</h3>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "0.88rem" }}>
              Hai riscattato con successo <strong>{successClaim.rewardName}</strong> scalando{" "}
              <strong>{successClaim.costLp} LP</strong> dal tuo saldo.
            </p>

            {successClaim.code && (
              <div
                style={{
                  margin: "12px 0",
                  padding: "16px",
                  borderRadius: "8px",
                  background: "rgb(48 92 255 / 15%)",
                  border: "1px dashed #305cff",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "#9cb2ff", textTransform: "uppercase", fontWeight: 800 }}>
                  Il tuo codice di claim
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-family-display)",
                    fontSize: "1.8rem",
                    letterSpacing: "0.1em",
                    marginTop: "6px",
                    color: "#fff",
                  }}
                >
                  {successClaim.code}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#b8c0d5", marginTop: "4px" }}>
                  Mostra questo codice presso il punto di ritiro o al partner convenzionato.
                </div>
              </div>
            )}

            <button
              className={styles.primaryButton}
              onClick={() => {
                setSelectedReward(null);
                setSuccessClaim(null);
              }}
              type="button"
            >
              Chiudi
            </button>
          </div>
        ) : selectedReward ? (
          <div style={{ display: "grid", gap: "16px", padding: "10px 0" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              Sei sicuro di voler riscattare il seguente premio?
            </p>

            <div
              style={{
                padding: "16px",
                borderRadius: "8px",
                background: "rgb(255 255 255 / 4%)",
                border: "1px solid var(--color-line)",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#9cb2ff", textTransform: "uppercase", fontWeight: 800 }}>
                {selectedReward.category}
              </div>
              <h4 style={{ margin: "4px 0", fontSize: "1.2rem" }}>{selectedReward.name}</h4>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                {selectedReward.description}
              </p>
              {selectedReward.conditions && (
                <div style={{ marginTop: "8px", fontSize: "0.75rem", color: "#ffd166" }}>
                  Condizioni: {selectedReward.conditions}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Costo riscatto:</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffd166" }}>
                {selectedReward.costLp} LP
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Saldo rimanente previsto:</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#34d399" }}>
                {((balance ?? 0) - selectedReward.costLp).toLocaleString("it-IT")} LP
              </span>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "rgb(220 38 38 / 15%)",
                  border: "1px solid #dc2626",
                  color: "#fca5a5",
                  fontSize: "0.82rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                className={styles.primaryButton}
                disabled={redeeming}
                onClick={handleConfirmRedeem}
                type="button"
                style={{ flex: 1 }}
              >
                {redeeming ? "Elaborazione in corso..." : "Conferma Riscatto"}
              </button>
              <button
                className={styles.ghostButton}
                disabled={redeeming}
                onClick={() => setSelectedReward(null)}
                type="button"
              >
                Annulla
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </PageContainer>
  );
}

