import Link from "next/link";

import styles from "../auth.module.css";

export function AuthModeSwitch({ activeMode }: { activeMode: "login" | "register" }) {
  return (
    <nav className={styles.modeSwitch} aria-label="Autenticazione">
      <Link
        className={`${styles.modePanel} ${activeMode === "login" ? styles.modePanelActive : ""}`}
        href="/login"
        aria-current={activeMode === "login" ? "page" : undefined}
      >
        <span>Accedi</span>
      </Link>
      <Link
        className={`${styles.modePanel} ${activeMode === "register" ? styles.modePanelActive : ""}`}
        href="/register"
        aria-current={activeMode === "register" ? "page" : undefined}
      >
        <span>Registrati</span>
      </Link>
    </nav>
  );
}
