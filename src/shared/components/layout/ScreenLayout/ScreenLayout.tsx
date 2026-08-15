import type { ReactNode } from "react";

import styles from "./ScreenLayout.module.css";

export function ScreenLayout({ children }: { children: ReactNode }) {
  return <div className={styles.screen}>{children}</div>;
}
