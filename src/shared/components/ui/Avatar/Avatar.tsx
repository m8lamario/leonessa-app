import type { ComponentPropsWithoutRef } from "react";

import styles from "./Avatar.module.css";

type AvatarProps = ComponentPropsWithoutRef<"span"> & {
  label: string;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ className, label, size = "md", ...props }: AvatarProps) {
  return (
    <span
      aria-label={label}
      className={[styles.avatar, styles[size], className].filter(Boolean).join(" ")}
      role="img"
      {...props}
    >
      {label
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}
