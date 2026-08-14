export const LEVEL_THRESHOLDS = [
  { level: 1, requiredLP: 0 },
  { level: 2, requiredLP: 250 },
  { level: 3, requiredLP: 500 },
  { level: 4, requiredLP: 1000 },
  { level: 5, requiredLP: 1750 },
  { level: 6, requiredLP: 2750 },
  { level: 7, requiredLP: 4000 },
  { level: 8, requiredLP: 5500 },
  { level: 9, requiredLP: 7500 },
  { level: 10, requiredLP: 10000 },
] as const;

export type Level = (typeof LEVEL_THRESHOLDS)[number]["level"];

export type LevelProgress = {
  level: Level;
  currentLP: number;
  currentLevelLP: number;
  nextLevelLP: number | null;
  progressLP: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

function assertNonNegativeLP(lp: number) {
  if (!Number.isInteger(lp) || lp < 0) {
    throw new RangeError("Gli LP devono essere un intero maggiore o uguale a zero.");
  }
}

export function getLevelForLP(lp: number): Level {
  assertNonNegativeLP(lp);

  let currentLevel: Level = LEVEL_THRESHOLDS[0].level;

  for (const threshold of LEVEL_THRESHOLDS) {
    if (lp < threshold.requiredLP) {
      break;
    }

    currentLevel = threshold.level;
  }

  return currentLevel;
}

export function getLevelProgress(lp: number): LevelProgress {
  assertNonNegativeLP(lp);

  const level = getLevelForLP(lp);
  const currentThreshold = LEVEL_THRESHOLDS.find(
    ({ level: thresholdLevel }) => thresholdLevel === level,
  );
  const nextThreshold = LEVEL_THRESHOLDS.find(
    ({ level: thresholdLevel }) => thresholdLevel === level + 1,
  );

  if (!currentThreshold) {
    throw new Error("Configurazione livelli non valida.");
  }

  if (!nextThreshold) {
    return {
      level,
      currentLP: lp,
      currentLevelLP: currentThreshold.requiredLP,
      nextLevelLP: null,
      progressLP: lp - currentThreshold.requiredLP,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  const levelSpan = nextThreshold.requiredLP - currentThreshold.requiredLP;
  const progressLP = lp - currentThreshold.requiredLP;

  return {
    level,
    currentLP: lp,
    currentLevelLP: currentThreshold.requiredLP,
    nextLevelLP: nextThreshold.requiredLP,
    progressLP,
    progressPercent: Math.min(100, Math.floor((progressLP / levelSpan) * 100)),
    isMaxLevel: false,
  };
}
