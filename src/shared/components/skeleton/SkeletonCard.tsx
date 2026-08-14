import type { ComponentPropsWithoutRef } from "react";

import { Skeleton } from "./Skeleton";
import styles from "./Skeleton.module.css";

type SkeletonCardProps = ComponentPropsWithoutRef<"div"> & {
  lines?: number;
  showMedia?: boolean;
};

export function SkeletonCard({
  className,
  lines = 3,
  showMedia = false,
  ...props
}: SkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.cardContainer, className].filter(Boolean).join(" ")}
      {...props}
    >
      {showMedia && <Skeleton className={styles.cardMedia} variant="card" />}
      <div className={styles.cardContent}>
        <Skeleton className={styles.cardTitle} height="1.35rem" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton className={styles.cardLine} key={index} />
        ))}
      </div>
    </div>
  );
}
