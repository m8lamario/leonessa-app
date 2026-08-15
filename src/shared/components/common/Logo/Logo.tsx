import Image from "next/image";
import Link from "next/link";

import styles from "./Logo.module.css";

export function Logo() {
  return (
    <Link aria-label="Leonessa Cup" className={styles.logo} href="/dashboard">
      <Image
        alt=""
        className={styles.mark}
        height={2744}
        priority
        src="/logo/logo leonessa bianco.png"
        width={1986}
      />
      <span className={styles.copy}>
        <strong>Leonessa Cup</strong>
        <small>Official App</small>
      </span>
    </Link>
  );
}
