import { Button } from "@/shared/components/ui";

import styles from "./ErrorState.module.css";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Qualcosa non ha funzionato",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>Riprova</Button>}
    </div>
  );
}
