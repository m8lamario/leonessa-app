export function isSandboxMode() {
  return process.env.APP_SANDBOX_MODE === "true";
}

export function assertSandboxEnabled() {
  if (!isSandboxMode()) {
    throw new Error("Sandbox mode is disabled. Set APP_SANDBOX_MODE=true to enable it.");
  }
}
