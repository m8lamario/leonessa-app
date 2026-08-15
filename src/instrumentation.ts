import { logger } from "@/lib/logger";

const SYNC_INTERVAL_MS = 30 * 60 * 1000;

type SyncSchedulerState = {
  started: boolean;
  running: boolean;
  interval?: ReturnType<typeof setInterval>;
};

const globalForScheduler = globalThis as typeof globalThis & {
  leonessaCupSyncScheduler?: SyncSchedulerState;
};

const scheduler =
  globalForScheduler.leonessaCupSyncScheduler ??
  ({
    started: false,
    running: false,
  } satisfies SyncSchedulerState);

globalForScheduler.leonessaCupSyncScheduler = scheduler;

async function runSync(trigger: "startup" | "interval") {
  if (scheduler.running) {
    logger.warn({ trigger }, "Sync already running");
    return;
  }

  scheduler.running = true;

  try {
    const { syncLeonessaCup } = await import("@/features/cup/server");
    const result = await syncLeonessaCup();
    logger.info({ trigger, result }, "Cup sync trigger completed");
  } catch (error) {
    logger.error({ err: error, trigger }, "Cup sync trigger failed");
  } finally {
    scheduler.running = false;
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || scheduler.started) {
    return;
  }

  scheduler.started = true;
  await runSync("startup");
  scheduler.interval = setInterval(() => {
    void runSync("interval");
  }, SYNC_INTERVAL_MS);
}
