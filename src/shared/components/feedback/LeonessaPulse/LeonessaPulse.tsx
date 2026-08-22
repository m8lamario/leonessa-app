"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import styles from "./LeonessaPulse.module.css";

/** Soft ease-out — calm, not snappy. */
const EASE = [0.22, 1, 0.36, 1] as const;

type LeonessaPulseProps = {
  onComplete: () => void;
  /** When true, shorten the exit once the sequence minimum has elapsed. */
  appReady?: boolean;
};

export function LeonessaPulse({ onComplete, appReady = true }: LeonessaPulseProps) {
  const reduceMotion = useReducedMotion();
  const [exiting, setExiting] = useState(false);
  const completedRef = useRef(false);
  const startedAtRef = useRef(0);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    startedAtRef.current = performance.now();

    if (reduceMotion) {
      const timer = window.setTimeout(() => setExiting(true), 220);
      return () => window.clearTimeout(timer);
    }

    // Calm entrance hold; never blocks on network/data.
    const exitTimer = window.setTimeout(() => setExiting(true), 1400);
    return () => window.clearTimeout(exitTimer);
  }, [reduceMotion]);

  useEffect(() => {
    if (!appReady || reduceMotion || exiting) return;

    // App already ready: let the calm sequence finish, then exit (no extra hold).
    const elapsed = performance.now() - startedAtRef.current;
    const minPresenceMs = 1180;
    const remaining = Math.max(0, minPresenceMs - elapsed);
    const timer = window.setTimeout(() => setExiting(true), remaining);
    return () => window.clearTimeout(timer);
  }, [appReady, exiting, reduceMotion]);

  return (
    <AnimatePresence onExitComplete={finish}>
      {!exiting ? (
        <m.div
          key="leonessa-pulse"
          aria-hidden="true"
          className={styles.overlay}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: reduceMotion ? 1 : 1.02,
            transition: { duration: reduceMotion ? 0.2 : 0.38, ease: EASE },
          }}
        >
          <div className={styles.stage}>
            <div className={styles.markWrap}>
              {!reduceMotion ? (
                <m.span
                  className={styles.ring}
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: [0, 0.45, 0], scale: [0.88, 1.06, 1.14] }}
                  transition={{ duration: 1.05, delay: 0.35, ease: EASE }}
                />
              ) : null}

              <m.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: [0.92, 1, 1.025, 1] }
                }
                transition={
                  reduceMotion
                    ? { duration: 0.22, ease: EASE }
                    : {
                        duration: 1.05,
                        times: [0, 0.5, 0.78, 1],
                        ease: EASE,
                      }
                }
              >
                <Image
                  alt=""
                  className={styles.mark}
                  height={2744}
                  priority
                  src="/logo/logo leonessa bianco.png"
                  width={1986}
                />
              </m.div>
            </div>

            <m.p
              className={styles.wordmark}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0.18 : 0.48,
                delay: reduceMotion ? 0.06 : 0.55,
                ease: EASE,
              }}
            >
              Leonessa
            </m.p>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
