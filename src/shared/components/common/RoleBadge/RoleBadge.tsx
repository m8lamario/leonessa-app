import { Badge } from "@/shared/components/ui";

import styles from "./RoleBadge.module.css";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  ORGANIZER: "Organizzatore",
  PLAYER: "Giocatore",
  SCHOOL_REP: "Rappresentante",
  STAFF: "Staff",
  USER: "Supporter",
};

export function RoleBadge({ role }: { role: string }) {
  return <Badge className={styles.badge}>{roleLabels[role] ?? role}</Badge>;
}
