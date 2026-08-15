import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./Section.module.css";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function Section({ title, eyebrow, actions, children, className, ...props }: SectionProps) {
  return (
    <section className={[styles.section, className].filter(Boolean).join(" ")} {...props}>
      {(title || eyebrow || actions) && (
        <header className={styles.header}>
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
