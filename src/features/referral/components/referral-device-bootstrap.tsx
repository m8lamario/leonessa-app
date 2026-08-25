"use client";

import { useEffect } from "react";

export function ReferralDeviceBootstrap() {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/referral/device", {
      method: "POST",
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, []);

  return null;
}
