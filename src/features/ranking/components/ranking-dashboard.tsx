"use client";

import { AnimatePresence, m } from "framer-motion";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { PageContainer } from "@/shared/components";
import { selection as hapticSelection } from "@/shared/lib/haptics";
import skeletonStyles from "@/shared/components/skeleton/Skeleton.module.css";

import type { RankingData, RankingTab } from "../types/ranking";
import { SchoolLeaderboard, UserLeaderboard } from "./leaderboard";
import { LeagueCards } from "./league-cards";
import styles from "../ranking.module.css";

const TABS: Array<{ id: RankingTab; label: string }> = [
  { id: "generale", label: "Generale" },
  { id: "scuole", label: "Scuole" },
  { id: "leghe", label: "Leghe" },
];

function parseTab(value: string | null): RankingTab {
  if (value === "scuole" || value === "leghe" || value === "generale") return value;
  return "generale";
}

export function RankingDashboard({
  initialData,
  initialTab,
}: {
  initialData: RankingData;
  initialTab?: RankingTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab") ?? initialTab ?? "generale");
  const ranking = initialData;

  function setTab(tab: RankingTab) {
    if (tab === activeTab) return;
    void hapticSelection();
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "generale") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, {
      scroll: false,
    });
  }

  return (
    <PageContainer className={`${styles.ranking} ${skeletonStyles.fadeIn}`}>
      <header className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>Competizione</p>
          <h1>Ranking</h1>
        </div>
      </header>

      <section className={styles.panel} aria-label="Classifiche">
        <div className={styles.segmentedControl} aria-label="Sezione ranking">
          {TABS.map((tab) => (
            <button
              aria-pressed={activeTab === tab.id}
              className={activeTab === tab.id ? styles.segmentActive : undefined}
              key={tab.id}
              onClick={() => setTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
        <AnimatePresence initial={false} mode="wait">
          <m.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, y: 6 }}
            key={activeTab}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {activeTab === "generale" ? (
              <UserLeaderboard currentUser={ranking.currentUser} entries={ranking.userRanking} />
            ) : null}
            {activeTab === "scuole" ? (
              <SchoolLeaderboard
                currentSchool={ranking.currentSchool}
                entries={ranking.schoolRanking}
              />
            ) : null}
            {activeTab === "leghe" ? <LeagueCards leagues={ranking.leagues} /> : null}
          </m.div>
        </AnimatePresence>
      </section>
    </PageContainer>
  );
}
