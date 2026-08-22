import * as Sentry from "@sentry/nextjs";

import { logger } from "@/lib/logger";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const KICKOFF_INTERVAL_MS = 60 * 1000;

type SyncSchedulerState = {
  started: boolean;
  running: boolean;
  interval?: ReturnType<typeof setInterval>;
};

type KickoffSchedulerState = {
  started: boolean;
  running: boolean;
  interval?: ReturnType<typeof setInterval>;
};

const globalForScheduler = globalThis as typeof globalThis & {
  leonessaCupSyncScheduler?: SyncSchedulerState;
  leonessaKickoffScheduler?: KickoffSchedulerState;
};

const scheduler =
  globalForScheduler.leonessaCupSyncScheduler ??
  ({
    started: false,
    running: false,
  } satisfies SyncSchedulerState);

globalForScheduler.leonessaCupSyncScheduler = scheduler;

const kickoffScheduler =
  globalForScheduler.leonessaKickoffScheduler ??
  ({
    started: false,
    running: false,
  } satisfies KickoffSchedulerState);

globalForScheduler.leonessaKickoffScheduler = kickoffScheduler;

async function runSync(trigger: "startup" | "interval") {
  if (scheduler.running) {
    logger.warn({ trigger }, "Sync already running");
    return;
  }

  scheduler.running = true;

  try {
    const { syncFantasyScoring } = await import("@/features/fanta/server");
    const result = await syncFantasyScoring();
    logger.info({ trigger, result }, "Fantasy scoring sync trigger completed");
  } catch (error) {
    logger.error({ err: error, trigger }, "Cup sync trigger failed");
  } finally {
    scheduler.running = false;
  }
}

async function runKickoffDispatch(trigger: "startup" | "interval") {
  if (kickoffScheduler.running) {
    return;
  }

  kickoffScheduler.running = true;

  try {
    const { dispatchDueMatchStartNotifications } = await import(
      "@/features/notifications/server"
    );
    const result = await dispatchDueMatchStartNotifications();
    if (result.processed > 0) {
      logger.info({ trigger, result }, "Kickoff notification dispatch trigger completed");
    }
  } catch (error) {
    logger.error({ err: error, trigger }, "Kickoff notification dispatch failed");
  } finally {
    kickoffScheduler.running = false;
  }
}

async function startNodeSchedulers() {
  if (!scheduler.started) {
    scheduler.started = true;
    await runSync("startup");
    scheduler.interval = setInterval(() => {
      void runSync("interval");
    }, SYNC_INTERVAL_MS);
  }

  if (!kickoffScheduler.started) {
    kickoffScheduler.started = true;
    await runKickoffDispatch("startup");
    kickoffScheduler.interval = setInterval(() => {
      void runKickoffDispatch("interval");
    }, KICKOFF_INTERVAL_MS);
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
    await startNodeSchedulers();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
