"use client";

import { m } from "framer-motion";
import Image from "next/image";

import styles from "../auth.module.css";
import { keyboardFocusClassName, useKeyboardFocusMode } from "./keyboard-focus-mode";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  const keyboardOpen = useKeyboardFocusMode();

  return (
    <main className={`${styles.page} ${keyboardFocusClassName(keyboardOpen)}`}>
      <m.section
        className={styles.content}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className={styles.brandLockup}>
          <Image
            className={styles.logoImage}
            src="/logo/logo leonessa bianco.png"
            alt="Logo Leonessa Cup"
            width={1986}
            height={2744}
            priority
          />
          <div>
            <h1>Leonessa Cup</h1>
            <p>La community ufficiale degli studenti</p>
          </div>
        </header>
        <h2 className={styles.formTitle}>{title}</h2>
        {children}
      </m.section>
    </main>
  );
}
