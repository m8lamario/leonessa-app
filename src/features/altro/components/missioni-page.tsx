"use client";

import { m } from "framer-motion";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import type { HubMission } from "../types";
import { HubProgress } from "./hub-progress";
import { HubSubheader } from "./hub-subheader";

type MissioniPageProps = {
  active: HubMission[];
  completed: HubMission[];
};

const reveal = { duration: 0.24, ease: "easeOut" as const };

function MissionCard({ mission, completed = false }: { mission: HubMission; completed?: boolean }) {
  return (
    <article className={styles.missionCard}>
      <div className={styles.cardTopline}>
        <span className={styles.status}>{mission.statusLabel}</span>
        <strong className={styles.reward}>+{mission.reward} LP</strong>
      </div>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      {completed ? (
        mission.completedAt ? (
          <p className={styles.meta}>Completata il {mission.completedAt}</p>
        ) : null
      ) : (
        <HubProgress
          label={`Progresso missione ${mission.title}`}
          percent={mission.progress > 0 ? Math.min(100, mission.progress) : 0}
          currentLabel={mission.progress > 0 ? `Progresso ${mission.progress}` : mission.statusLabel}
        />
      )}
    </article>
  );
}

export function MissioniPage({ active, completed }: MissioniPageProps) {
  return (
    <PageContainer className={styles.page}>
      <HubSubheader
        kicker="Guadagna LP"
        lead="Le missioni già assegnate al tuo account, con progresso e ricompensa."
        title="Missioni"
      />
      <div className={styles.content}>
        <m.section
          aria-labelledby="active-missions-title"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reveal}
        >
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>In corso</p>
              <h2 id="active-missions-title">Missioni attive</h2>
            </div>
          </div>
          {active.length === 0 ? (
            <EmptyState
              title="Nessuna missione attiva"
              message="Quando avrai missioni da completare le troverai qui."
            />
          ) : (
            <div className={styles.cardList}>
              {active.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </m.section>

        <section aria-labelledby="completed-missions-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>Percorso</p>
              <h2 id="completed-missions-title">Completate</h2>
            </div>
          </div>
          {completed.length === 0 ? (
            <EmptyState
              title="Nessuna missione completata"
              message="Le missioni concluse compariranno in questa lista."
            />
          ) : (
            <div className={styles.cardList}>
              {completed.map((mission) => (
                <MissionCard completed key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
