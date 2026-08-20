export function readApiErrorMessage(
  payload: unknown,
  fallback = "Operazione non riuscita. Riprova.",
): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function networkErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Errore di rete. Riprova.";
}
