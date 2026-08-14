import type { ComponentPropsWithoutRef, CSSProperties } from "react";

import styles from "./Skeleton.module.css";

export type SkeletonVariant = "text" | "card" | "avatar" | "circle";

export type SkeletonProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  variant?: SkeletonVariant;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
};

export function Skeleton({
  className,
  height,
  style,
  variant = "text",
  width,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[styles.base, styles[variant], className].filter(Boolean).join(" ")}
      style={{ ...style, width, height }}
      {...props}
    />
  );
}
