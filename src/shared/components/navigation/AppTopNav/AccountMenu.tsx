"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ClipboardList, LogOut, Settings, UserRound } from "lucide-react";
import type { Route } from "next";

import styles from "./AccountMenu.module.css";

type AccountMenuProps = {
  userId: string;
  userInitials: string;
};

export function AccountMenu({ userId, userInitials }: AccountMenuProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu account"
        className={styles.trigger}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {userInitials}
      </button>
      {open ? (
        <div className={styles.panel} id={panelId} role="menu" aria-label="Account">
          <p className={styles.kicker}>Account</p>
          <Link
            className={styles.item}
            href={`/u/${userId}` as Route}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <UserRound aria-hidden="true" size={16} />
            La tua vetrina
          </Link>
          <Link className={styles.item} href="/profile" onClick={() => setOpen(false)} role="menuitem">
            <Settings aria-hidden="true" size={16} />
            Account
          </Link>
          <Link
            className={styles.item}
            href={"/profile/candidature" as Route}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <ClipboardList aria-hidden="true" size={16} />
            Candidature
          </Link>
          <Link
            className={styles.item}
            href={"/profile/impostazioni" as Route}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            <Settings aria-hidden="true" size={16} />
            Impostazioni
          </Link>
          <button
            className={styles.logout}
            onClick={() => void signOut({ callbackUrl: "/login" })}
            role="menuitem"
            type="button"
          >
            <LogOut aria-hidden="true" size={16} />
            Esci
          </button>
        </div>
      ) : null}
    </div>
  );
}
