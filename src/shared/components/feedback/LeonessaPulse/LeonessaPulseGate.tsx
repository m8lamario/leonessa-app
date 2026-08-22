"use client";

import { useEffect, useState, type ReactNode } from "react";

import { LeonessaPulse } from "./LeonessaPulse";
import {
  hasCompletedLaunchPulse,
  markLaunchPulseCompleted,
} from "./launch-pulse-session";

type LeonessaPulseGateProps = {
  children: ReactNode;
};

/**
 * Shows Leonessa Pulse once per real app launch (full document load).
 * Client navigations keep this provider mounted, so the overlay never repeats.
 */
export function LeonessaPulseGate({ children }: LeonessaPulseGateProps) {
  const [showPulse, setShowPulse] = useState(() => !hasCompletedLaunchPulse());
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!showPulse) return;

    const markReady = () => setAppReady(true);

    if (document.readyState === "complete") {
      markReady();
      return;
    }

    window.addEventListener("load", markReady, { once: true });
    return () => window.removeEventListener("load", markReady);
  }, [showPulse]);

  useEffect(() => {
    if (!showPulse) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [showPulse]);

  const handleComplete = () => {
    markLaunchPulseCompleted();
    setShowPulse(false);
  };

  return (
    <>
      {children}
      {showPulse ? (
        <LeonessaPulse appReady={appReady} onComplete={handleComplete} />
      ) : null}
    </>
  );
}
