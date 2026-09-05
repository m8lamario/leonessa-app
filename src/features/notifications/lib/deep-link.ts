const LIVE_PATH_PREFIX = "/live/";
const PROFILE_PATH_PREFIX = "/u/";

export function livePathForMatch(matchId: string): string {
  return `${LIVE_PATH_PREFIX}${matchId}`;
}

export function liveDeepLinkForMatch(matchId: string): string {
  return `leonessa://live/${matchId}`;
}

export function profilePathForUser(userId: string): string {
  return `${PROFILE_PATH_PREFIX}${userId}`;
}

export function profileDeepLinkForUser(userId: string): string {
  return `leonessa://u/${userId}`;
}

function stripTrailingSlash(path: string) {
  return path.replace(/\/+$/, "");
}

/** Resolve app-relative path from leonessa:// or https deep links. */
export function resolveAppPathFromDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "leonessa:") {
      const host = parsed.hostname;
      const path = parsed.pathname.replace(/\/+$/, "");
      if (host === "live" && path.length > 1) {
        return `/live${path}`;
      }
      if (host === "match" && path.length > 1) {
        return `/live${path}`;
      }
      if (host === "u" && path.length > 1) {
        return `/u${path}`;
      }
      const combined = `/${host}${path}`.replace(/\/+$/, "");
      if (combined.startsWith(LIVE_PATH_PREFIX) && combined.length > LIVE_PATH_PREFIX.length) {
        return combined;
      }
      if (combined.startsWith(PROFILE_PATH_PREFIX) && combined.length > PROFILE_PATH_PREFIX.length) {
        return combined;
      }
      return null;
    }

    const pathname = stripTrailingSlash(parsed.pathname);
    if (pathname.startsWith(LIVE_PATH_PREFIX) && pathname.length > LIVE_PATH_PREFIX.length) {
      return pathname;
    }
    if (pathname.startsWith(PROFILE_PATH_PREFIX) && pathname.length > PROFILE_PATH_PREFIX.length) {
      return pathname;
    }

    return null;
  } catch {
    return null;
  }
}

export function extractMatchIdFromLivePath(path: string): string | null {
  if (!path.startsWith(LIVE_PATH_PREFIX)) return null;
  const id = path.slice(LIVE_PATH_PREFIX.length).split("/")[0]?.trim();
  return id || null;
}
