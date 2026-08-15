import type { ComponentPropsWithoutRef } from "react";

import styles from "./Textarea.module.css";

export function Textarea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={[styles.textarea, className].filter(Boolean).join(" ")} {...props} />;
}
