import styles from "../altro.module.css";

type HubProgressProps = {
  label: string;
  percent: number;
  currentLabel: string;
  remainingLabel?: string;
};

export function HubProgress({ label, percent, currentLabel, remainingLabel }: HubProgressProps) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
      >
        <span style={{ width: `${width}%` }} />
      </div>
      <div className={styles.progressLabel}>
        <span>{currentLabel}</span>
        {remainingLabel ? <span>{remainingLabel}</span> : null}
      </div>
    </>
  );
}
