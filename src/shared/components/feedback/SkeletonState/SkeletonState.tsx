import { Skeleton } from "@/shared/components/ui";

import styles from "./SkeletonState.module.css";

export function SkeletonState({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" className={styles.state}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton height="72px" key={index} width="100%" />
      ))}
    </div>
  );
}
