export type LpOvertakeChange = "overtake" | "reset" | "unchanged";

export function detectLpOvertake(input: {
  followerLp: number;
  followingLp: number;
  wasAhead: boolean;
}): LpOvertakeChange {
  const isAhead = input.followingLp > input.followerLp;
  if (isAhead && !input.wasAhead) return "overtake";
  if (!isAhead && input.wasAhead) return "reset";
  return "unchanged";
}

export function formatLpAmount(value: number) {
  return Math.trunc(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function buildLpOvertakeCopy(input: {
  overtakerName: string;
  overtakerLp: number;
  viewerLp: number;
}) {
  const overtakerLp = formatLpAmount(input.overtakerLp);
  const viewerLp = formatLpAmount(input.viewerLp);
  return {
    title: `${input.overtakerName} ti ha superato!`,
    body: `${input.overtakerName} ha ${overtakerLp} LP, tu ne hai ${viewerLp}.`,
  };
}

export function buildLpOvertakeIdempotencyKey(input: {
  viewerId: string;
  overtakerId: string;
  overtakeCount: number;
}) {
  return `lp-overtake:${input.viewerId}:${input.overtakerId}:${input.overtakeCount}`;
}
