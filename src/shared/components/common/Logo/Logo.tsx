import Link from "next/link";

import styles from "./Logo.module.css";

export function Logo() {
  return (
    <Link aria-label="Leonessa Cup" className={styles.logo} href="/dashboard">
      <span>LC</span>
      <strong>Leonessa</strong>
    </Link>
  );
}
