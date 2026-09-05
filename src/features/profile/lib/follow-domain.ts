export function assertCanFollowUser(followerId: string, followingId: string) {
  if (!followerId.trim() || !followingId.trim()) {
    return { ok: false as const, code: "INVALID" as const, message: "Utente non valido." };
  }
  if (followerId === followingId) {
    return { ok: false as const, code: "SELF" as const, message: "Non puoi seguire te stesso." };
  }
  return { ok: true as const };
}

export function nextFollowCounts(input: {
  followerCount: number;
  following: boolean;
  nextFollowing: boolean;
}) {
  if (input.following === input.nextFollowing) {
    return input.followerCount;
  }
  if (input.nextFollowing) {
    return input.followerCount + 1;
  }
  return Math.max(0, input.followerCount - 1);
}
