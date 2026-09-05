import "server-only";

import { buildShowcaseStats, getUserShowcase } from "./showcase-service";
import type { ProfileIdentity } from "../types";

export async function getProfileIdentity(
  userId: string,
  _schoolId: string | null,
  schoolName: string | null,
): Promise<ProfileIdentity> {
  const showcase = await getUserShowcase(userId);

  if (!showcase) {
    return {
      schoolName,
      schoolRank: null,
      level: 1,
      totalLp: 0,
      featuredBadge: null,
      badges: [],
      stats: [],
      rankingPosition: null,
      fantaPosition: null,
      fantaPoints: null,
      predictionPercent: null,
      missionsCompleted: 0,
      eventsAttended: 0,
      referralsCompleted: 0,
      levelProgressPercent: 0,
      bio: null,
    };
  }

  return {
    schoolName: showcase.schoolName ?? schoolName,
    schoolRank: showcase.schoolRank,
    level: showcase.level,
    totalLp: showcase.totalLp,
    featuredBadge: showcase.badges[0]?.name ?? null,
    badges: showcase.badges,
    stats: buildShowcaseStats(showcase),
    rankingPosition: showcase.rankingPosition,
    fantaPosition: showcase.fantaPosition,
    fantaPoints: showcase.fantaPoints,
    predictionPercent: showcase.predictionPercent,
    missionsCompleted: showcase.missionsCompleted,
    eventsAttended: showcase.eventsAttended,
    referralsCompleted: showcase.referralsCompleted,
    levelProgressPercent: showcase.levelProgressPercent,
    bio: showcase.bio,
  };
}
