"use client";

import { App } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications, type ActionPerformed, type PushNotificationSchema } from "@capacitor/push-notifications";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MATCH_START_NOTIFICATION_TYPE } from "../constants";
import { resolveAppPathFromDeepLink } from "../lib/deep-link";
import styles from "./push-runtime.module.css";

type ForegroundNotice = {
  title: string;
  body: string;
  href: string;
};

function pathFromNotification(notification: PushNotificationSchema | ActionPerformed["notification"]) {
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const deepLink = typeof data.deepLink === "string" ? data.deepLink : null;
  const linkUrl = typeof data.linkUrl === "string" ? data.linkUrl : null;
  const matchId = typeof data.matchId === "string" ? data.matchId : null;

  if (deepLink) {
    return resolveAppPathFromDeepLink(deepLink);
  }
  if (linkUrl?.startsWith("/")) {
    return linkUrl;
  }
  if (matchId) {
    return `/live/${matchId}`;
  }
  return null;
}

export function PushRuntime() {
  const router = useRouter();
  const [foreground, setForeground] = useState<ForegroundNotice | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handles: PluginListenerHandle[] = [];

    void PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const data = (notification.data ?? {}) as Record<string, unknown>;
      const href = pathFromNotification(notification);
      if (!href) return;

      // Foreground: never auto-navigate.
      if (data.type === MATCH_START_NOTIFICATION_TYPE || href.startsWith("/live/")) {
        setForeground({
          title: notification.title ?? "Partita iniziata",
          body: notification.body ?? "La partita è iniziata.",
          href,
        });
      }
    }).then((handle) => handles.push(handle));

    void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const href = pathFromNotification(action.notification);
      if (href) {
        setForeground(null);
        router.push(href as never);
      }
    }).then((handle) => handles.push(handle));

    void App.getLaunchUrl().then((launch) => {
      // Cold start via custom URL is handled by DeepLinkListener;
      // also check pending notification action if present later.
      if (launch?.url) {
        const path = resolveAppPathFromDeepLink(launch.url);
        if (path) router.replace(path as never);
      }
    });

    return () => {
      for (const handle of handles) {
        void handle.remove();
      }
    };
  }, [router]);

  if (!foreground) return null;

  return (
    <div className={styles.toast} role="status">
      <div>
        <strong>🔴 {foreground.title}</strong>
        <p>{foreground.body}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          const href = foreground.href;
          setForeground(null);
          router.push(href as never);
        }}
      >
        Vedi Live
      </button>
      <button
        aria-label="Chiudi"
        className={styles.dismiss}
        type="button"
        onClick={() => setForeground(null)}
      >
        ×
      </button>
    </div>
  );
}
