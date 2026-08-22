import "server-only";

import { createPrivateKey } from "node:crypto";

import { env } from "@/env";
import { logger } from "@/lib/logger";

function hasFirebaseEnvVars() {
  return Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
}

/** PEM from Firebase JSON often arrives with literal \\n or wrapping quotes in .env files. */
export function normalizeFirebasePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function canParseFirebasePrivateKey(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    createPrivateKey(normalizeFirebasePrivateKey(raw));
    return true;
  } catch {
    return false;
  }
}

function hasFirebaseCredentials() {
  return (
    hasFirebaseEnvVars() &&
    canParseFirebasePrivateKey(env.FIREBASE_PRIVATE_KEY)
  );
}

export function isPushProviderConfigured() {
  return hasFirebaseCredentials();
}

export type PushSendResult =
  | { ok: true; messageId: string }
  | { ok: false; errorCode: string; errorMessage: string; invalidToken: boolean };

let messagingInitFailed = false;

async function getMessagingOrNull() {
  if (!hasFirebaseEnvVars() || messagingInitFailed) return null;

  const [{ cert, getApps, initializeApp }, { getMessaging }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/messaging"),
  ]);

  try {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID!,
          clientEmail: env.FIREBASE_CLIENT_EMAIL!,
          privateKey: normalizeFirebasePrivateKey(env.FIREBASE_PRIVATE_KEY!),
        }),
      });

    return getMessaging(app);
  } catch (error) {
    messagingInitFailed = true;
    logger.error(
      { err: error },
      "Firebase Admin init failed; check FIREBASE_* credentials in .env",
    );
    return null;
  }
}

export async function sendPushToToken(input: {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<PushSendResult> {
  const messaging = await getMessagingOrNull();
  if (!messaging) {
    if (hasFirebaseEnvVars()) {
      return {
        ok: false,
        errorCode: "app/invalid-credential",
        errorMessage: "Firebase Admin credentials are invalid or unavailable",
        invalidToken: false,
      };
    }
    logger.info({ tokenSuffix: input.token.slice(-8) }, "Push dry-run (Firebase not configured)");
    return { ok: true, messageId: `dry-run-${Date.now()}` };
  }

  try {
    const messageId = await messaging.send({
      token: input.token,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data,
      android: {
        priority: "high",
        notification: {
          channelId: "match_updates",
          clickAction: "OPEN_MATCH",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    });
    return { ok: true, messageId };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown";
    const message = error instanceof Error ? error.message : "Push send failed";
    const invalidToken =
      code.includes("registration-token-not-registered") ||
      code.includes("invalid-registration-token") ||
      code.includes("invalid-argument");
    logger.warn({ err: error, code }, "FCM send failed");
    return { ok: false, errorCode: code, errorMessage: message, invalidToken };
  }
}
