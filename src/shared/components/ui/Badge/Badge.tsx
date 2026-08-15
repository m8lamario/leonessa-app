import type { ComponentPropsWithoutRef } from "react";

import styles from "./Badge.module.css";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: "default" | "success" | "warning" | "danger";
};

export function Badge({ children, className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[variant], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
