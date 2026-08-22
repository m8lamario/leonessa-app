export { MATCH_START_NOTIFICATION_TYPE } from "./constants";
export { MatchFollowButton } from "./components/match-follow-button";
export type { MatchFollowButtonProps } from "./components/match-follow-button";
export { PushRuntime } from "./components/push-runtime";
export {
  extractMatchIdFromLivePath,
  liveDeepLinkForMatch,
  livePathForMatch,
  resolveAppPathFromDeepLink,
} from "./lib/deep-link";
export {
  evaluateFollowEligibility,
  type FollowMatchStatus,
} from "./lib/follow-eligibility";
export {
  buildMatchStartIdempotencyKey,
  buildMatchStartIdempotencyKeyForDevice,
} from "./lib/idempotency";
export {
  ensurePushPermissionAndRegister,
  type PushRegisterResult,
} from "./lib/push-client";
