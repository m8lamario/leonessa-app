"use client";

import { signOut } from "next-auth/react";

import styles from "../auth.module.css";

export function LogoutButton() {
  return (
    <button
      className={styles.secondaryButton}
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Esci
    </button>
  );
}
