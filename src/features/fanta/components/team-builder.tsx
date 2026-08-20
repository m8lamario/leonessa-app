"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronLeft, Crown, Search, Shield, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  BENCH_LIMITS,
  CAPTAIN_MULTIPLIER,
  INITIAL_BUDGET,
  MIN_BENCH_SIZE,
  STARTER_LIMITS,
  STARTER_SIZE,
  TEAM_SIZE,
} from "../constants/fanta";
import type { FantasyPlayer, FantasyRole } from "../types";
import styles from "./fanta-dashboard.module.css";

const roleLabels: Record<FantasyRole, string> = {
  PORTIERE: "Portiere",
  DIFENSORE: "Difensori",
  CENTROCAMPISTA: "Centrocampisti",
  ATTACCANTE: "Attaccanti",
};

type StepKind = "name" | "starter" | "bench" | "captain" | "ready";

const steps: Array<{ label: string; kind: StepKind; role?: FantasyRole }> = [
  { label: "Nome", kind: "name" },
  { label: "POR", kind: "starter", role: "PORTIERE" },
  { label: "DIF", kind: "starter", role: "DIFENSORE" },
  { label: "CEN", kind: "starter", role: "CENTROCAMPISTA" },
  { label: "ATT", kind: "starter", role: "ATTACCANTE" },
  { label: "POR+", kind: "bench", role: "PORTIERE" },
  { label: "DIF+", kind: "bench", role: "DIFENSORE" },
  { label: "CEN+", kind: "bench", role: "CENTROCAMPISTA" },
  { label: "ATT+", kind: "bench", role: "ATTACCANTE" },
  { label: "Cap", kind: "captain" },
  { label: "OK", kind: "ready" },
];

export function TeamBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<FantasyPlayer[]>([]);
  const [starters, setStarters] = useState<string[]>([]);
  const [bench, setBench] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    void fetch("/api/fanta/players")
      .then(async (response) => {
        if (!response.ok) throw new Error("Impossibile caricare i giocatori.");
        return response.json() as Promise<{ players: FantasyPlayer[] }>;
      })
      .then((data) => setPlayers(data.players))
      .catch((requestError: Error) => setError(requestError.message));

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const current = steps[step]!;
  const allSelected = useMemo(() => new Set([...starters, ...bench]), [starters, bench]);
  const starterPlayers = useMemo(
    () =>
      starters
        .map((id) => players.find((player) => player.id === id))
        .filter(Boolean) as FantasyPlayer[],
    [players, starters],
  );
  const benchPlayers = useMemo(
    () =>
      bench
        .map((id) => players.find((player) => player.id === id))
        .filter(Boolean) as FantasyPlayer[],
    [players, bench],
  );
  const spent = [...starterPlayers, ...benchPlayers].reduce(
    (total, player) => total + player.fantasyValue,
    0,
  );
  const remaining = INITIAL_BUDGET - spent;
  const activeRole = current.role;
  const limit =
    current.kind === "starter" && activeRole
      ? STARTER_LIMITS[activeRole]
      : current.kind === "bench" && activeRole
        ? BENCH_LIMITS[activeRole]
        : 0;
  const selectedForStep =
    current.kind === "starter" && activeRole
      ? starterPlayers.filter((player) => player.role === activeRole)
      : current.kind === "bench" && activeRole
        ? benchPlayers.filter((player) => player.role === activeRole)
        : [];
  const rolePlayers = players.filter((player) => {
    if (player.role !== activeRole) return false;
    if (current.kind === "starter" && bench.includes(player.id)) return false;
    if (current.kind === "bench" && starters.includes(player.id)) return false;
    return `${player.name} ${player.school}`.toLowerCase().includes(search.toLowerCase());
  });

  function togglePlayer(player: FantasyPlayer) {
    setError("");
    const inStarters = starters.includes(player.id);
    const inBench = bench.includes(player.id);
    if (inStarters || inBench) {
      setStarters((currentIds) => currentIds.filter((id) => id !== player.id));
      setBench((currentIds) => currentIds.filter((id) => id !== player.id));
      if (captainId === player.id) setCaptainId("");
      return;
    }
    if (allSelected.has(player.id)) return;
    if (selectedForStep.length >= limit) {
      setError(
        current.kind === "bench"
          ? `Hai già la riserva ${roleLabels[player.role].toLowerCase()}.`
          : `Hai già scelto tutti i titolari ${roleLabels[player.role].toLowerCase()}.`,
      );
      return;
    }
    if (remaining < player.fantasyValue) {
      setError("Budget insufficiente per questo giocatore.");
      return;
    }
    if (current.kind === "starter") {
      setStarters((currentIds) => [...currentIds, player.id]);
    } else if (current.kind === "bench") {
      setBench((currentIds) => [...currentIds, player.id]);
    }
  }

  function next() {
    setError("");
    if (current.kind === "name" && (name.trim().length < 3 || name.trim().length > 30)) {
      setError("Scegli un nome da 3 a 30 caratteri per la tua squadra.");
      return;
    }
    if (current.kind === "starter" && selectedForStep.length !== limit) {
      setError(`Completa i titolari: servono ${limit} ${roleLabels[activeRole!].toLowerCase()}.`);
      return;
    }
    if (current.kind === "bench") {
      const isLastBenchStep = steps[step + 1]?.kind === "captain";
      if (isLastBenchStep && bench.length < MIN_BENCH_SIZE) {
        setError("Seleziona almeno 1 riserva (massimo 4).");
        return;
      }
    }
    if (current.kind === "captain" && !captainId) {
      setError("Scegli il capitano tra i titolari.");
      return;
    }
    setSearch("");
    setStep((currentStep) => Math.min(steps.length - 1, currentStep + 1));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/fanta/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, starterIds: starters, benchIds: bench, captainId }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Impossibile salvare la squadra.");
      router.push("/fanta");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossibile salvare la squadra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.builderExperience} aria-labelledby="builder-title">
      <header className={styles.builderHeader}>
        <div className={styles.builderBrand}>
          <Shield aria-hidden="true" size={20} />
          <span>Fanta Leonessa</span>
        </div>
        <div className={styles.builderMetrics}>
          <span>
            <b>{remaining}</b> LP
          </span>
          <span>
            <b>{starters.length + bench.length}</b>/{TEAM_SIZE} <Users aria-hidden="true" size={14} />
          </span>
        </div>
      </header>

      <nav className={`${styles.stepper} ${styles.stepperCompact}`} aria-label="Progresso creazione squadra">
        {steps.map((item, index) => (
          <div className={index <= step ? styles.stepActive : styles.step} key={item.label}>
            <i>{index < step ? <Check aria-hidden="true" size={12} /> : index + 1}</i>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className={styles.stepProgress}>
        <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <m.div
          animate={{ opacity: 1, x: 0 }}
          className={styles.stepScene}
          exit={{ opacity: 0, x: -18 }}
          initial={{ opacity: 0, x: 18 }}
          key={step}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {current.kind === "name" && <NameStep name={name} onChange={setName} />}
          {(current.kind === "starter" || current.kind === "bench") && activeRole && (
            <PlayerStep
              kind={current.kind}
              limit={limit}
              onSearch={setSearch}
              onToggle={togglePlayer}
              players={rolePlayers}
              role={activeRole}
              search={search}
              selectedIds={allSelected}
              selectedCount={selectedForStep.length}
              stepNumber={step + 1}
            />
          )}
          {current.kind === "captain" && (
            <CaptainStep captainId={captainId} onSelect={setCaptainId} players={starterPlayers} />
          )}
          {current.kind === "ready" && (
            <FinalStep
              bench={benchPlayers}
              captainId={captainId}
              name={name}
              remaining={remaining}
              starters={starterPlayers}
            />
          )}
        </m.div>
      </AnimatePresence>

      {error && (
        <p className={styles.builderError} role="alert">
          {error}
        </p>
      )}

      <footer className={styles.builderFooter}>
        <button
          aria-label={step > 0 ? "Torna allo step precedente" : "Torna alla dashboard Fanta"}
          className={styles.backButton}
          onClick={() => {
            setError("");
            if (step === 0) {
              router.push("/fanta");
            } else {
              setStep((currentStep) => currentStep - 1);
            }
          }}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} /> {step > 0 ? "Indietro" : "Esci"}
        </button>
        <button
          className={styles.continueButton}
          disabled={saving}
          onClick={current.kind === "ready" ? () => void save() : next}
          type="button"
        >
          {current.kind === "ready"
            ? saving
              ? "La squadra entra in campo..."
              : "Conferma la squadra"
            : current.kind === "bench" && selectedForStep.length === 0
              ? "Salta"
              : "Continua"}
        </button>
      </footer>
    </section>
  );
}

function NameStep({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div>
      <div className={styles.sceneIcon}>
        <Sparkles aria-hidden="true" size={30} />
      </div>
      <p className={styles.sceneEyebrow}>Passo 1 · La tua identità</p>
      <h1 id="builder-title">Nome squadra?</h1>
      <p className={styles.sceneLead}>Il nome con cui scenderai in campo.</p>
      <label className={styles.nameField}>
        <span>Nome squadra</span>
        <input
          autoFocus
          maxLength={30}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Es. Leonessa Legends"
          value={name}
        />
        <small>{name.length}/30</small>
      </label>
      <div className={styles.namePreview}>
        <span>LA TUA MAGLIA</span>
        <strong>{name || "LA TUA SQUADRA"}</strong>
      </div>
    </div>
  );
}

function PlayerStep({
  kind,
  limit,
  players,
  role,
  search,
  selectedIds,
  selectedCount,
  stepNumber,
  onSearch,
  onToggle,
}: {
  kind: "starter" | "bench";
  limit: number;
  players: FantasyPlayer[];
  role: FantasyRole;
  search: string;
  selectedIds: Set<string>;
  selectedCount: number;
  stepNumber: number;
  onSearch: (search: string) => void;
  onToggle: (player: FantasyPlayer) => void;
}) {
  return (
    <>
      <p className={styles.sceneEyebrow}>
        Passo {stepNumber} · {kind === "bench" ? "Panchina" : "Titolari"}
      </p>
      <h1 id="builder-title">
        {kind === "bench"
          ? `Riserva ${roleLabels[role].toLowerCase()}`
          : `Scegli ${limit === 1 ? "il tuo" : "i tuoi"} ${roleLabels[role].toLowerCase()}`}
      </h1>
      {kind === "bench" && (
        <p className={styles.sceneLead}>Facoltativa se hai già almeno una riserva (massimo 4).</p>
      )}
      <div className={styles.roleCounter}>
        <span>
          {kind === "bench" ? "PANCHINA" : "TITOLARI"} · {roleLabels[role]}
        </span>
        <b>
          {selectedCount}/{limit}
        </b>
      </div>
      <label className={styles.searchField}>
        <Search aria-hidden="true" size={18} />
        <input
          aria-label="Cerca giocatore o scuola"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Cerca giocatore o scuola"
          value={search}
        />
      </label>
      <div className={styles.playerDeck}>
        {players.map((player) => {
          const chosen = selectedIds.has(player.id);
          return (
            <m.button
              animate={chosen ? { scale: [1, 1.025, 1] } : { scale: 1 }}
              className={chosen ? styles.premiumPlayerSelected : styles.premiumPlayer}
              key={player.id}
              onClick={() => onToggle(player)}
              type="button"
            >
              <span className={styles.playerDetails}>
                <b>{player.name}</b>
                <small>{player.school}</small>
                <em>
                  {role.slice(0, 3)} · {player.fantasyValue} LP
                </em>
              </span>
              <span className={styles.selectMark}>
                {chosen ? <Check aria-hidden="true" size={17} /> : "+"}
              </span>
            </m.button>
          );
        })}
      </div>
      {players.length === 0 && (
        <p className={styles.helper}>Nessun giocatore corrisponde alla ricerca.</p>
      )}
    </>
  );
}

function CaptainStep({
  captainId,
  players,
  onSelect,
}: {
  captainId: string;
  players: FantasyPlayer[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className={styles.sceneIcon}>
        <Crown aria-hidden="true" size={30} />
      </div>
      <p className={styles.sceneEyebrow}>Passo 10 · Il leader</p>
      <h1 id="builder-title">Chi indossa la fascia?</h1>
      <p className={styles.sceneLead}>Solo tra i titolari. Bonus x{CAPTAIN_MULTIPLIER}.</p>
      <div className={styles.captainDeck}>
        {players.map((player) => (
          <button
            className={captainId === player.id ? styles.captainCardSelected : styles.captainCard}
            key={player.id}
            onClick={() => onSelect(player.id)}
            type="button"
          >
            <span>{captainId === player.id ? "👑" : "C"}</span>
            <b>{player.name}</b>
            <small>
              {player.school} · {player.role.slice(0, 3)}
            </small>
          </button>
        ))}
      </div>
    </>
  );
}

function FinalStep({
  captainId,
  name,
  starters,
  bench,
  remaining,
}: {
  captainId: string;
  name: string;
  starters: FantasyPlayer[];
  bench: FantasyPlayer[];
  remaining: number;
}) {
  const captain = starters.find((player) => player.id === captainId);
  return (
    <div className={styles.finalReveal}>
      <div className={styles.finalCrest}>
        <Shield aria-hidden="true" size={44} />
      </div>
      <p className={styles.sceneEyebrow}>Passo 11 · Squadra completa</p>
      <h1 id="builder-title">{name}</h1>
      <p className={styles.sceneLead}>
        11 titolari e da 1 a 4 riserve, pronti per la Cup.
      </p>
      <div className={styles.finalScore}>
        <span>
          <b>
            {STARTER_SIZE}+{bench.length}
          </b>{" "}
          rosa
        </span>
        <span>
          <b>{remaining}</b> LP rimasti
        </span>
        <span>
          <b>👑</b> {captain?.name ?? "Capitano"}
        </span>
      </div>
      <div className={styles.finalRoster}>
        <strong>Titolari</strong>
        {starters.map((player) => (
          <span key={player.id}>
            {player.id === captainId ? "👑 " : ""}
            {player.name}
          </span>
        ))}
        <strong>Panchina</strong>
        {bench.map((player) => (
          <span key={player.id}>{player.name}</span>
        ))}
      </div>
    </div>
  );
}
