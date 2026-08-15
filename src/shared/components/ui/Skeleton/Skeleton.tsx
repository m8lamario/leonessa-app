import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import styles from "./Skeleton.module.css";

type SkeletonProps = ComponentPropsWithoutRef<"div"> & {
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
};

export function Skeleton({ className, height, style, width, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
      style={{ ...style, width, height }}
      {...props}
    />
  );
}
