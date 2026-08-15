import styles from "./LoadingState.module.css";

export function LoadingState({ label = "Caricamento in corso..." }: { label?: string }) {
  return (
    <div aria-live="polite" className={styles.state}>
      <span className={styles.spinner} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
