import type { ReactNode } from "react";

import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="presentation">
      <section
        aria-modal="true"
        aria-label={title}
        className={styles.modal}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </section>
    </div>
  );
}
