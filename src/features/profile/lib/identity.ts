export function formatUserName(user: { name?: string | null; surname?: string | null }) {
  return [user.name, user.surname].filter(Boolean).join(" ").trim() || "Tifoso";
}

export function formatUserInitials(user: { name?: string | null; surname?: string | null }) {
  const initials = [user.name, user.surname]
    .filter(Boolean)
    .map((value) => value?.slice(0, 1).toUpperCase())
    .join("");
  return initials || "LC";
}

export type CompareRow = {
  label: string;
  yours: string;
  theirs: string;
  highlight: "yours" | "theirs" | "tie";
};

export function compareNumericRows(
  label: string,
  yours: number | null,
  theirs: number | null,
  options?: { invert?: boolean; prefix?: string; suffix?: string; empty?: string },
): CompareRow {
  const empty = options?.empty ?? "—";
  const format = (value: number | null) => {
    if (value == null) return empty;
    const formatted = value.toLocaleString("it-IT");
    return `${options?.prefix ?? ""}${formatted}${options?.suffix ?? ""}`;
  };

  if (yours == null && theirs == null) {
    return { label, yours: empty, theirs: empty, highlight: "tie" };
  }
  if (yours == null) {
    return { label, yours: empty, theirs: format(theirs), highlight: "theirs" };
  }
  if (theirs == null) {
    return { label, yours: format(yours), theirs: empty, highlight: "yours" };
  }

  const yoursWins = options?.invert ? yours < theirs : yours > theirs;
  const theirsWins = options?.invert ? theirs < yours : theirs > yours;
  return {
    label,
    yours: format(yours),
    theirs: format(theirs),
    highlight: yoursWins ? "yours" : theirsWins ? "theirs" : "tie",
  };
}
