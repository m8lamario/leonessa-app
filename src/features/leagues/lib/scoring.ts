export const IMPLEMENTED_SCORING_RULES = ["LP_EARNED_DURING_LEAGUE"] as const;

export type ImplementedScoringRule = (typeof IMPLEMENTED_SCORING_RULES)[number];

export type ReservedScoringRule = "FANTA_POINTS" | "MISSION_POINTS" | "EVENT_POINTS";

export type ScoringRule = ImplementedScoringRule | ReservedScoringRule;

export type ScoringWindow = {
  from: Date;
  to: Date;
};

export type ScoreableTransaction = {
  userId: string;
  amount: number;
  type: string;
  createdAt: Date;
};

export type RankableMember = {
  userId: string;
  joinedAt: Date;
  score: number;
};

export function getScoringWindow(input: {
  startAt: Date;
  endAt: Date;
  joinedAt: Date;
}): ScoringWindow {
  return {
    from: input.startAt > input.joinedAt ? input.startAt : input.joinedAt,
    to: input.endAt,
  };
}

export function isPositiveLpInWindow(transaction: ScoreableTransaction, window: ScoringWindow) {
  return (
    transaction.type === "LP" &&
    transaction.amount > 0 &&
    transaction.createdAt >= window.from &&
    transaction.createdAt <= window.to
  );
}

export function sumLeagueScore(transactions: ScoreableTransaction[], window: ScoringWindow) {
  return transactions.reduce(
    (total, transaction) => total + (isPositiveLpInWindow(transaction, window) ? transaction.amount : 0),
    0,
  );
}

export function scoreMembersByRule(
  rule: ScoringRule,
  members: Array<{ userId: string; joinedAt: Date }>,
  league: { startAt: Date; endAt: Date },
  transactions: ScoreableTransaction[],
): RankableMember[] {
  if (rule !== "LP_EARNED_DURING_LEAGUE") {
    throw new Error(`Regola di punteggio non supportata: ${rule}`);
  }

  const byUser = new Map<string, ScoreableTransaction[]>();
  for (const transaction of transactions) {
    const list = byUser.get(transaction.userId);
    if (list) {
      list.push(transaction);
    } else {
      byUser.set(transaction.userId, [transaction]);
    }
  }

  return members.map((member) => {
    const window = getScoringWindow({
      startAt: league.startAt,
      endAt: league.endAt,
      joinedAt: member.joinedAt,
    });
    return {
      userId: member.userId,
      joinedAt: member.joinedAt,
      score: sumLeagueScore(byUser.get(member.userId) ?? [], window),
    };
  });
}

export function rankMembers(members: RankableMember[]) {
  return [...members]
    .sort((left, right) => right.score - left.score || left.joinedAt.getTime() - right.joinedAt.getTime())
    .map((member, index) => ({ ...member, rank: index + 1 }));
}
