import { Badge } from "@/shared/components/ui";

import styles from "./LevelBadge.module.css";

export function LevelBadge({ level }: { level: number }) {
  return <Badge className={styles.badge}>Livello {level}</Badge>;
}
