import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import { Skeleton } from "./Skeleton";
import { SkeletonAvatar } from "./SkeletonAvatar";
import styles from "./Skeleton.module.css";

type SkeletonListProps = ComponentPropsWithoutRef<"div"> & {
  avatarSize?: CSSProperties["width"];
  items?: number;
  showAvatar?: boolean;
};

export function SkeletonList({
  avatarSize,
  className,
  items = 3,
  showAvatar = true,
  ...props
}: SkeletonListProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.list, className].filter(Boolean).join(" ")}
      {...props}
    >
      {Array.from({ length: items }, (_, index) => (
        <div className={styles.listItem} key={index}>
          {showAvatar && <SkeletonAvatar size={avatarSize} />}
          <div className={styles.listCopy}>
            <Skeleton className={styles.listTitle} height="0.9rem" />
            <Skeleton className={styles.listSubtitle} height="0.7rem" />
          </div>
          <Skeleton className={styles.listMeta} height="1.2rem" />
        </div>
      ))}
    </div>
  );
}
