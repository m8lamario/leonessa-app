import type { ComponentPropsWithoutRef } from "react";

import styles from "./Input.module.css";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={[styles.input, className].filter(Boolean).join(" ")} {...props} />;
}
