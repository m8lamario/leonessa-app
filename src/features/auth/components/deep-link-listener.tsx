"use client";

import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function getVerificationDestination(url: string) {
  const parsed = new URL(url);
  const path =
    parsed.protocol === "leonessa:"
      ? `/${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "")
      : parsed.pathname;
  const token = parsed.searchParams.get("token");

  if (
    (path !== "/verify-email" && path !== "/reset-password") ||
    !token ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return null;
  }

  return `${path}?token=${encodeURIComponent(token)}`;
}

export function DeepLinkListener() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const navigate = (url: string) => {
      const destination = getVerificationDestination(url);

      if (destination) {
        router.replace(destination as never);
      }
    };
    let listener: PluginListenerHandle | undefined;

    void App.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) {
        navigate(launchUrl.url);
      }
    });
    void App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      navigate(event.url);
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [router]);

  return null;
}
