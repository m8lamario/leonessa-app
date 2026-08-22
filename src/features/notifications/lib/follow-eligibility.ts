export type FollowMatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "CANCELLED";

export function evaluateFollowEligibility(input: {
  status: FollowMatchStatus;
  startAt: Date;
  now?: Date;
}): { allowed: boolean; reason?: string } {
  const now = input.now ?? new Date();

  if (input.status === "CANCELLED") {
    return { allowed: false, reason: "Partita cancellata." };
  }
  if (input.status === "FINISHED") {
    return { allowed: false, reason: "Partita già terminata." };
  }
  if (input.status === "LIVE" || input.startAt.getTime() <= now.getTime()) {
    return { allowed: false, reason: "Partita già iniziata." };
  }
  return { allowed: true };
}
