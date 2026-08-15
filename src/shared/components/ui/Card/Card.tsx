import type { ComponentPropsWithoutRef } from "react";

import styles from "./Card.module.css";

type CardProps = ComponentPropsWithoutRef<"article"> & {
  interactive?: boolean;
  variant?: "default" | "raised";
};

export function Card({
  children,
  className,
  interactive = false,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <article
      data-interactive={interactive ? true : undefined}
      className={[styles.card, styles[variant], className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </article>
  );
}
