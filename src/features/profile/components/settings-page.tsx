"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import type { Route } from "next";

import { PageContainer } from "@/shared/components";

import styles from "../profile.module.css";
import { AccountSubheader } from "./account-subheader";

export function SettingsPage() {
  return (
    <PageContainer className={styles.profile}>
      <AccountSubheader
        kicker="Gestione"
        lead="Privacy, regolamento e accesso al tuo account."
        title="Impostazioni"
      />

      <div className={styles.content}>
        <section className={styles.settings} aria-labelledby="settings-title">
          <p className={styles.kicker}>Supporto</p>
          <h2 id="settings-title">Privacy e supporto</h2>
          <p className={styles.settingsIntro}>Pagine ufficiali Leonessa e uscita dall&apos;account.</p>
          <div className={styles.settingGroup}>
            <div className={styles.settingRow}>
              <Link className={styles.textButton} href={"/altro/info" as Route}>
                Informazioni
              </Link>
            </div>
            <div className={styles.settingRow}>
              <Link className={styles.textButton} href={"/altro/regolamento" as Route}>
                Regolamento
              </Link>
            </div>
            <div className={styles.settingRow}>
              <Link className={styles.textButton} href={"/altro/assistenza" as Route}>
                Assistenza
              </Link>
            </div>
          </div>
          <button
            className={styles.logoutButton}
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Esci dall&apos;account
          </button>
        </section>
      </div>
    </PageContainer>
  );
}
