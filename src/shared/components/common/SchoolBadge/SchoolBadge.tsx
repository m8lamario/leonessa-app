import { Badge } from "@/shared/components/ui";

import styles from "./SchoolBadge.module.css";

type SchoolBadgeProps = {
  name: string;
  shortName: string;
};

export function SchoolBadge({ name, shortName }: SchoolBadgeProps) {
  return (
    <Badge className={styles.badge} title={name}>
      {shortName}
    </Badge>
  );
}
