"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronLeft, Crown, Search, Shield, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CAPTAIN_MULTIPLIER, FORMATION_LIMITS, INITIAL_BUDGET } from "../constants/fanta";
import type { FantasyPlayer, FantasyRole } from "../types";
import styles from "./fanta-dashboard.module.css";

const roleLabels: Record<FantasyRole, string> = {
  PORTIERE: "Portiere",
  DIFENSORE: "Difensori",
  CENTROCAMPISTA: "Centrocampisti",
  ATTACCANTE: "Attaccanti",
};
const roleForStep: Partial<Record<number, FantasyRole>> = {
  2: "PORTIERE",
  3: "DIFENSORE",
  4: "CENTROCAMPISTA",
  5: "ATTACCANTE",
};
const steps = ["Identità", "Portiere", "Difensori", "Centrocampo", "Attacco", "Capitano", "Pronti"];

export function TeamBuilder() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<FantasyPlayer[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
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

  const selectedPlayers = useMemo(
    () =>
      selected
        .map((id) => players.find((player) => player.id === id))
        .filter(Boolean) as FantasyPlayer[],
    [players, selected],
  );
  const spent = selectedPlayers.reduce((total, player) => total + player.fantasyValue, 0);
  const remaining = INITIAL_BUDGET - spent;
  const activeRole = roleForStep[step];
  const rolePlayers = players.filter(
    (player) =>
      player.role === activeRole &&
      `${player.name} ${player.school}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedForRole = activeRole
    ? selectedPlayers.filter((player) => player.role === activeRole)
    : [];

  function togglePlayer(player: FantasyPlayer) {
    setError("");
    if (selected.includes(player.id)) {
      setSelected((current) => current.filter((id) => id !== player.id));
      if (captainId === player.id) setCaptainId("");
      return;
    }
    if (selectedForRole.length >= FORMATION_LIMITS[player.role]) {
      setError(`Hai già scelto tutti i ${roleLabels[player.role].toLowerCase()}.`);
      return;
    }
    if (remaining < player.fantasyValue) {
      setError("Budget insufficiente per questo giocatore.");
      return;
    }
    setSelected((current) => [...current, player.id]);
  }

  function next() {
    setError("");
    if (step === 1 && (name.trim().length < 3 || name.trim().length > 30)) {
      setError("Scegli un nome da 3 a 30 caratteri per la tua squadra.");
      return;
    }
    if (activeRole && selectedForRole.length !== FORMATION_LIMITS[activeRole]) {
      setError(
        `Completa questo reparto: servono ${FORMATION_LIMITS[activeRole]} ${roleLabels[activeRole].toLowerCase()}.`,
      );
      return;
    }
    if (step === 6 && !captainId) {
      setError("Scegli il giocatore che guiderà la tua squadra.");
      return;
    }
    setSearch("");
    setStep((current) => Math.min(7, current + 1));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/fanta/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, playerIds: selected, captainId }),
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
            <b>{selected.length}</b>/11 <Users aria-hidden="true" size={14} />
          </span>
        </div>
      </header>
      <nav className={styles.stepper} aria-label="Progresso creazione squadra">
        {steps.map((label, index) => (
          <div className={index + 1 <= step ? styles.stepActive : styles.step} key={label}>
            <i>{index + 1 < step ? <Check aria-hidden="true" size={12} /> : index + 1}</i>
            <span>{label}</span>
          </div>
        ))}
      </nav>
      <div className={styles.stepProgress}>
        <span style={{ width: `${(step / steps.length) * 100}%` }} />
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
          {step === 1 && <NameStep name={name} onChange={setName} />}
          {activeRole && (
            <PlayerStep
              players={rolePlayers}
              role={activeRole}
              search={search}
              selected={selected}
              selectedCount={selectedForRole.length}
              onSearch={setSearch}
              onToggle={togglePlayer}
            />
          )}
          {step === 6 && (
            <CaptainStep captainId={captainId} players={selectedPlayers} onSelect={setCaptainId} />
          )}
          {step === 7 && (
            <FinalStep
              captainId={captainId}
              name={name}
              players={selectedPlayers}
              remaining={remaining}
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
          aria-label={step > 1 ? "Torna allo step precedente" : "Torna alla dashboard Fanta"}
          className={styles.backButton}
          onClick={() => {
            setError("");
            if (step === 1) {
              router.push("/fanta");
            } else {
              setStep((current) => current - 1);
            }
          }}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={20} /> {step > 1 ? "Indietro" : "Esci"}
        </button>
        <button
          className={styles.continueButton}
          disabled={saving}
          onClick={step === 7 ? () => void save() : next}
          type="button"
        >
          {step === 7
            ? saving
              ? "La squadra entra in campo..."
              : "Conferma la squadra"
            : "Continua"}
        </button>
      </footer>
    </section>
  );
}

function NameStep({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div className={styles.pageContainer}>
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
  players,
  role,
  search,
  selected,
  selectedCount,
  onSearch,
  onToggle,
}: {
  players: FantasyPlayer[];
  role: FantasyRole;
  search: string;
  selected: string[];
  selectedCount: number;
  onSearch: (search: string) => void;
  onToggle: (player: FantasyPlayer) => void;
}) {
  const needed = FORMATION_LIMITS[role];
  return (
    <>
      <p className={styles.sceneEyebrow}>
        Passo {Object.entries(roleForStep).find(([, value]) => value === role)?.[0]} · Costruisci il
        reparto
      </p>
      <h1 id="builder-title">
        Scegli {needed === 1 ? "il tuo" : "i tuoi"} {roleLabels[role].toLowerCase()}
      </h1>
      <div className={styles.roleCounter}>
        <span>{roleLabels[role]}</span>
        <b>
          {selectedCount}/{needed}
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
          const chosen = selected.includes(player.id);
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
      <p className={styles.sceneEyebrow}>Passo 6 · Il leader</p>
      <h1 id="builder-title">Chi indossa la fascia?</h1>
      <p className={styles.sceneLead}>Il suo bonus sarà x{CAPTAIN_MULTIPLIER}.</p>
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
  players,
  remaining,
}: {
  captainId: string;
  name: string;
  players: FantasyPlayer[];
  remaining: number;
}) {
  const captain = players.find((player) => player.id === captainId);
  return (
    <div className={styles.finalReveal}>
      <div className={styles.finalCrest}>
        <Shield aria-hidden="true" size={44} />
      </div>
      <p className={styles.sceneEyebrow}>Passo 7 · Squadra completa</p>
      <h1 id="builder-title">{name}</h1>
      <p className={styles.sceneLead}>La tua formazione è pronta per la Cup.</p>
      <div className={styles.finalScore}>
        <span>
          <b>11</b> giocatori
        </span>
        <span>
          <b>{remaining}</b> LP rimasti
        </span>
        <span>
          <b>👑</b> {captain?.name ?? "Capitano"}
        </span>
      </div>
      <div className={styles.finalRoster}>
        {players.map((player) => (
          <span key={player.id}>
            {player.id === captainId ? "👑 " : ""}
            {player.name}
          </span>
        ))}
      </div>
    </div>
  );
}
