const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
});

export function formatLeagueRange(startAt: string, endAt: string) {
  return `${dateFormatter.format(new Date(startAt))} – ${dateFormatter.format(new Date(endAt))}`;
}

export function formatRemaining(ms: number, ended: boolean) {
  if (ended || ms <= 0) return "Terminata";

  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
}

export function formatPoints(points: number) {
  return points.toLocaleString("it-IT");
}
