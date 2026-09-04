import { prisma } from "@/lib/prisma";
import { REWARD_VALUES } from "@/features/rewards/reward-values";

export type DefaultRewardConfig = {
  key: string;
  title: string;
  description: string;
  category: string;
  rewardLp: number;
  enabled: boolean;
};

export const DEFAULT_REWARD_CONFIGS: Record<string, DefaultRewardConfig> = {
  dailyLogin: {
    key: "dailyLogin",
    title: "Accesso giornaliero",
    description: "LP assegnati per il login giornaliero",
    category: "engagement",
    rewardLp: REWARD_VALUES.dailyLogin,
    enabled: true,
  },
  "streak.threeDays": {
    key: "streak.threeDays",
    title: "Streak 3 giorni",
    description: "LP assegnati al raggiungimento di 3 giorni consecutivi",
    category: "engagement",
    rewardLp: REWARD_VALUES.streak.threeDays,
    enabled: true,
  },
  "streak.sevenDays": {
    key: "streak.sevenDays",
    title: "Streak 7 giorni",
    description: "LP assegnati al raggiungimento di 7 giorni consecutivi",
    category: "engagement",
    rewardLp: REWARD_VALUES.streak.sevenDays,
    enabled: true,
  },
  "streak.fourteenDays": {
    key: "streak.fourteenDays",
    title: "Streak 14 giorni",
    description: "LP assegnati al raggiungimento di 14 giorni consecutivi",
    category: "engagement",
    rewardLp: REWARD_VALUES.streak.fourteenDays,
    enabled: true,
  },
  "streak.thirtyDays": {
    key: "streak.thirtyDays",
    title: "Streak 30 giorni",
    description: "LP assegnati al raggiungimento di 30 giorni consecutivi",
    category: "engagement",
    rewardLp: REWARD_VALUES.streak.thirtyDays,
    enabled: true,
  },
  "referral.inviter": {
    key: "referral.inviter",
    title: "Referral - Inviter",
    description: "LP assegnati a chi invita un nuovo amico verificato",
    category: "referral",
    rewardLp: REWARD_VALUES.referral.inviter,
    enabled: true,
  },
  "referral.invitee": {
    key: "referral.invitee",
    title: "Referral - Invitee",
    description: "LP assegnati all'amico invitato che completa la registrazione",
    category: "referral",
    rewardLp: REWARD_VALUES.referral.invitee,
    enabled: true,
  },
  "events.attendance": {
    key: "events.attendance",
    title: "Presenza evento",
    description: "LP per check-in presenza a una partita o evento Leonessa",
    category: "events",
    rewardLp: REWARD_VALUES.events.attendance,
    enabled: true,
  },
  "events.specialAttendance": {
    key: "events.specialAttendance",
    title: "Presenza evento speciale",
    description: "LP per check-in a un evento speciale della community",
    category: "events",
    rewardLp: REWARD_VALUES.events.specialAttendance,
    enabled: true,
  },
  "events.finalAttendance": {
    key: "events.finalAttendance",
    title: "Presenza finale",
    description: "LP per check-in alla finale Leonessa Cup",
    category: "events",
    rewardLp: REWARD_VALUES.events.finalAttendance,
    enabled: true,
  },
  "fanta.teamCreation": {
    key: "fanta.teamCreation",
    title: "Creazione squadra Fanta",
    description: "LP assegnati alla creazione della prima squadra Fanta Leonessa",
    category: "fanta",
    rewardLp: 50,
    enabled: true,
  },
  "email.verification": {
    key: "email.verification",
    title: "Verifica email",
    description: "LP assegnati per la verifica dell'indirizzo email",
    category: "onboarding",
    rewardLp: 25,
    enabled: true,
  },
};

export async function getRewardConfig(key: string): Promise<{
  key: string;
  title: string;
  rewardLp: number;
  enabled: boolean;
  category: string;
}> {
  const dbConfig = await prisma.economyRewardConfig.findUnique({
    where: { key },
  });

  if (dbConfig) {
    return {
      key: dbConfig.key,
      title: dbConfig.title,
      rewardLp: dbConfig.rewardLp,
      enabled: dbConfig.enabled,
      category: dbConfig.category,
    };
  }

  const fallback = DEFAULT_REWARD_CONFIGS[key];
  if (fallback) {
    return fallback;
  }

  return {
    key,
    title: key,
    rewardLp: 0,
    enabled: false,
    category: "custom",
  };
}

export async function getAllRewardConfigs() {
  const dbConfigs = await prisma.economyRewardConfig.findMany({
    orderBy: { key: "asc" },
  });
  const dbMap = new Map(dbConfigs.map((c) => [c.key, c]));

  const result = [];
  const handledKeys = new Set<string>();

  for (const [key, defaultCfg] of Object.entries(DEFAULT_REWARD_CONFIGS)) {
    handledKeys.add(key);
    const existing = dbMap.get(key);
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        id: `default-${key}`,
        key: defaultCfg.key,
        title: defaultCfg.title,
        description: defaultCfg.description,
        category: defaultCfg.category,
        rewardLp: defaultCfg.rewardLp,
        enabled: defaultCfg.enabled,
        conditions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  for (const cfg of dbConfigs) {
    if (!handledKeys.has(cfg.key)) {
      result.push(cfg);
    }
  }

  return result;
}

export async function updateRewardConfig(
  actorId: string | null,
  input: {
    key: string;
    title?: string;
    description?: string;
    category?: string;
    rewardLp: number;
    enabled: boolean;
    reason?: string;
  },
) {
  if (input.rewardLp < 0 || !Number.isInteger(input.rewardLp)) {
    throw new RangeError("Il valore rewardLp deve essere un intero maggiore o uguale a 0.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.economyRewardConfig.findUnique({
      where: { key: input.key },
    });

    const fallback = DEFAULT_REWARD_CONFIGS[input.key];
    const oldValue = existing ? existing.rewardLp : (fallback?.rewardLp ?? 0);
    const oldEnabled = existing ? existing.enabled : (fallback?.enabled ?? true);
    const title = input.title ?? existing?.title ?? fallback?.title ?? input.key;
    const description = input.description ?? existing?.description ?? fallback?.description ?? null;
    const category = input.category ?? existing?.category ?? fallback?.category ?? "general";

    const config = await tx.economyRewardConfig.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        title,
        description,
        category,
        rewardLp: input.rewardLp,
        enabled: input.enabled,
      },
      update: {
        title,
        description,
        category,
        rewardLp: input.rewardLp,
        enabled: input.enabled,
      },
    });

    await tx.economyConfigHistory.create({
      data: {
        configId: config.id,
        actorId,
        oldValue,
        newValue: input.rewardLp,
        oldEnabled,
        newEnabled: input.enabled,
        reason: input.reason ?? "Aggiornamento da Control Center",
      },
    });

    if (actorId) {
      await tx.auditLog.create({
        data: {
          actorId,
          action: "ECONOMY_CONFIG_UPDATE",
          entityType: "EconomyRewardConfig",
          entityId: config.id,
          metadata: {
            key: config.key,
            oldValue,
            newValue: input.rewardLp,
            oldEnabled,
            newEnabled: input.enabled,
            reason: input.reason,
          },
        },
      });
    }

    return config;
  });
}
