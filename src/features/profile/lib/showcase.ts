import { compareNumericRows, type CompareRow } from "./identity";
import type { UserShowcase } from "../types/profile";

export function buildShowcaseStats(showcase: UserShowcase) {
  return [
    {
      label: "Ranking LP",
      value: `#${showcase.rankingPosition}`,
      detail: `${showcase.totalLp.toLocaleString("it-IT")} LP`,
    },
    {
      label: "Livello",
      value: String(showcase.level),
      detail: showcase.nextLevelLP
        ? `${showcase.currentLP.toLocaleString("it-IT")} / ${showcase.nextLevelLP.toLocaleString("it-IT")} LP`
        : "Livello massimo",
    },
    {
      label: "Fanta",
      value: showcase.fantaPosition ? `#${showcase.fantaPosition}` : "—",
      detail: showcase.fantaPoints != null ? `${showcase.fantaPoints} pt` : "Squadra non creata",
    },
    {
      label: "Pronostici",
      value: showcase.predictionPercent != null ? `${showcase.predictionPercent}%` : "—",
      detail:
        showcase.predictionSettled > 0
          ? `${showcase.predictionSettled} liquidati`
          : "Nessun pronostico chiuso",
    },
    {
      label: "Badge",
      value: String(showcase.badgeCount),
      detail: "ottenuti",
    },
    {
      label: "Missioni",
      value: String(showcase.missionsCompleted),
      detail: "completate",
    },
    {
      label: "Eventi",
      value: String(showcase.eventsAttended),
      detail: "partecipati",
    },
    {
      label: "Referral",
      value: String(showcase.referralsCompleted),
      detail: "completati",
    },
  ];
}

export function buildProfileComparison(yours: UserShowcase, theirs: UserShowcase): CompareRow[] {
  return [
    compareNumericRows("Livello", yours.level, theirs.level),
    compareNumericRows("LP", yours.totalLp, theirs.totalLp),
    compareNumericRows("Ranking LP", yours.rankingPosition, theirs.rankingPosition, {
      invert: true,
      prefix: "#",
    }),
    compareNumericRows("Fanta", yours.fantaPosition, theirs.fantaPosition, {
      invert: true,
      prefix: "#",
      empty: "—",
    }),
    compareNumericRows("Punti Fanta", yours.fantaPoints, theirs.fantaPoints),
    compareNumericRows("Badge", yours.badgeCount, theirs.badgeCount),
    compareNumericRows("Pronostici", yours.predictionPercent, theirs.predictionPercent, {
      suffix: "%",
    }),
    compareNumericRows("Missioni", yours.missionsCompleted, theirs.missionsCompleted),
  ];
}
