/** Survives client navigations; resets on full document reload (true app launch). */
let launchPulseCompleted = false;

export function hasCompletedLaunchPulse() {
  return launchPulseCompleted;
}

export function markLaunchPulseCompleted() {
  launchPulseCompleted = true;
}
