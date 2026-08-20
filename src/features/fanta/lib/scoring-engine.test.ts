import { describe, expect, it } from "vitest";

import { CAPTAIN_MULTIPLIER } from "../constants/fanta";
import { valueDeltaFromPoints } from "../server/value-engine";
import {
  SCORING,
  SCORING_RULES,
  applyCaptainMultiplier,
  computeMatchScoring,
  getCleanSheetPoints,
  getEventPointsForType,
  getMatchResultPoints,
  getMatchdayRound,
  getPlayerBasePoints,
  getPlayerMatchBreakdown,
  getPlayerMatchScore,
  type ScorableMatch,
  type ScorablePlayer,
} from "./scoring-engine";

function match(partial: Partial<ScorableMatch> & Pick<ScorableMatch, "homeTeamId" | "awayTeamId">): ScorableMatch {
  return {
    homeScore: 0,
    awayScore: 0,
    events: [],
    ...partial,
  };
}

const homePor: ScorablePlayer = { id: "p-por", teamId: "home", fantasyRole: "PORTIERE" };
const homeDif: ScorablePlayer = { id: "p-dif", teamId: "home", fantasyRole: "DIFENSORE" };
const homeCen: ScorablePlayer = { id: "p-cen", teamId: "home", fantasyRole: "CENTROCAMPISTA" };
const homeAtt: ScorablePlayer = { id: "p-att", teamId: "home", fantasyRole: "ATTACCANTE" };

describe("scoring rules single source", () => {
  it("keeps SCORING and SCORING_RULES aligned", () => {
    expect(SCORING_RULES.GOAL).toBe(SCORING.goal);
    expect(SCORING_RULES.ASSIST).toBe(SCORING.assist);
    expect(SCORING_RULES.YELLOW_CARD).toBe(SCORING.yellowCard);
    expect(SCORING_RULES.RED_CARD).toBe(SCORING.redCard);
    expect(SCORING_RULES.OWN_GOAL).toBe(SCORING.ownGoal);
    expect(SCORING_RULES.WIN).toBe(SCORING.win);
    expect(SCORING_RULES.DRAW).toBe(SCORING.draw);
    expect(SCORING_RULES.CLEAN_SHEET).toBe(SCORING.cleanSheet);
    expect(SCORING_RULES.MVP).toBe(0);
  });
});

describe("event scoring", () => {
  it("scores GOAL as +100", () => {
    expect(getEventPointsForType("GOAL")).toBe(100);
  });
  it("scores ASSIST as +50", () => {
    expect(getEventPointsForType("ASSIST")).toBe(50);
  });
  it("scores YELLOW_CARD as -20", () => {
    expect(getEventPointsForType("YELLOW_CARD")).toBe(-20);
  });
  it("scores RED_CARD as -50", () => {
    expect(getEventPointsForType("RED_CARD")).toBe(-50);
  });
  it("scores OWN_GOAL as -70", () => {
    expect(getEventPointsForType("OWN_GOAL")).toBe(-70);
  });
  it("scores MVP as 0", () => {
    expect(getEventPointsForType("MVP")).toBe(0);
  });
  it("does not use events × 25", () => {
    expect(getEventPointsForType("GOAL")).not.toBe(25);
  });
});

describe("match result", () => {
  it("scores WIN as +20", () => {
    expect(getMatchResultPoints(2, 1)).toBe(20);
  });
  it("scores DRAW as +5", () => {
    expect(getMatchResultPoints(1, 1)).toBe(5);
  });
  it("scores LOSS as 0", () => {
    expect(getMatchResultPoints(0, 2)).toBe(0);
  });
});

describe("clean sheet", () => {
  it("gives +30 to POR when opponentScore is 0", () => {
    expect(getCleanSheetPoints("PORTIERE", 0)).toBe(30);
  });
  it("gives +30 to DIF when opponentScore is 0", () => {
    expect(getCleanSheetPoints("DIFENSORE", 0)).toBe(30);
  });
  it("gives 0 to CEN when opponentScore is 0", () => {
    expect(getCleanSheetPoints("CENTROCAMPISTA", 0)).toBe(0);
  });
  it("gives 0 to ATT when opponentScore is 0", () => {
    expect(getCleanSheetPoints("ATTACCANTE", 0)).toBe(0);
  });
  it("gives 0 when opponent scored", () => {
    expect(getCleanSheetPoints("PORTIERE", 1)).toBe(0);
  });
});

describe("captain", () => {
  it("applies CAPTAIN_MULTIPLIER with Math.round", () => {
    expect(CAPTAIN_MULTIPLIER).toBe(1.5);
    expect(applyCaptainMultiplier(100, true)).toBe(150);
    expect(applyCaptainMultiplier(101, true)).toBe(Math.round(101 * 1.5));
    expect(applyCaptainMultiplier(100, false)).toBe(100);
  });
});

describe("combined scoring", () => {
  it("Goal + Assist + Win + Clean Sheet", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [
        { playerId: homeDif.id, type: "GOAL" },
        { playerId: homeDif.id, type: "ASSIST" },
      ],
    });
    expect(getPlayerBasePoints(game, homeDif)).toBe(100 + 50 + 20 + 30);
  });

  it("Goal + Yellow", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 2,
      events: [
        { playerId: homeAtt.id, type: "GOAL" },
        { playerId: homeAtt.id, type: "YELLOW_CARD" },
      ],
    });
    expect(getPlayerBasePoints(game, homeAtt)).toBe(100 - 20);
  });

  it("Goal + Red", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 0,
      awayScore: 1,
      events: [
        { playerId: homeAtt.id, type: "GOAL" },
        { playerId: homeAtt.id, type: "RED_CARD" },
      ],
    });
    expect(getPlayerBasePoints(game, homeAtt)).toBe(100 - 50);
  });

  it("Assist + Win", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 2,
      awayScore: 1,
      events: [{ playerId: homeCen.id, type: "ASSIST" }],
    });
    expect(getPlayerBasePoints(game, homeCen)).toBe(50 + 20);
  });

  it("Goal + Captain", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 0,
      awayScore: 1,
      events: [{ playerId: homeAtt.id, type: "GOAL" }],
    });
    expect(getPlayerMatchScore(game, homeAtt, { role: "ATTACCANTE", isCaptain: true })).toBe(150);
    expect(getPlayerMatchScore(game, homeAtt, { role: "ATTACCANTE", isCaptain: false })).toBe(100);
  });
});

describe("clean sheet match scenarios", () => {
  it("Home 1 Away 0 grants CS to home POR/DIF only", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
    });
    expect(getPlayerBasePoints(game, homePor)).toBe(20 + 30);
    expect(getPlayerBasePoints(game, homeDif)).toBe(20 + 30);
    expect(getPlayerBasePoints(game, homeCen)).toBe(20);
    expect(getPlayerBasePoints(game, homeAtt)).toBe(20);
  });

  it("Home 1 Away 1 grants no clean sheet", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 1,
    });
    expect(getCleanSheetPoints("PORTIERE", 1)).toBe(0);
    expect(getPlayerBasePoints(game, homePor)).toBe(5);
  });
});

describe("role coherence for clean sheet", () => {
  it("uses selection.role when provided (fielded fantasy role)", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
    });
    // Player anagrafico CEN, ma schierato come DIF → CS
    const player: ScorablePlayer = { id: "flex", teamId: "home", fantasyRole: "CENTROCAMPISTA" };
    expect(getPlayerBasePoints(game, player, { role: "DIFENSORE" })).toBe(20 + 30);
    expect(getPlayerBasePoints(game, player)).toBe(20);
  });
});

describe("production vs sandbox same inputs", () => {
  it("computeMatchScoring is identical for the same match payload", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 2,
      awayScore: 0,
      events: [
        { playerId: homeAtt.id, type: "GOAL" },
        { playerId: homeCen.id, type: "ASSIST" },
        { playerId: homeDif.id, type: "YELLOW_CARD" },
      ],
    });
    const players = [homePor, homeDif, homeCen, homeAtt];
    const fantasyTeams = [
      {
        id: "ft-1",
        players: [
          { playerId: homeAtt.id, role: "ATTACCANTE", isCaptain: true },
          { playerId: homeDif.id, role: "DIFENSORE", isCaptain: false },
        ],
      },
    ];

    const production = computeMatchScoring(game, players, fantasyTeams);
    const sandbox = computeMatchScoring(game, players, fantasyTeams);
    expect(sandbox).toEqual(production);

    const attBase = 100 + 20;
    const difBase = -20 + 20 + 30;
    expect(production.playerPoints.find((p) => p.playerId === homeAtt.id)?.points).toBe(attBase);
    expect(production.teamPoints[0]?.points).toBe(
      applyCaptainMultiplier(attBase, true) + difBase,
    );
  });
});

describe("control center recalculate rebuild semantics", () => {
  it("rebuilds player points when events are added or removed", () => {
    const baseMatch = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
    });

    const withGoal = {
      ...baseMatch,
      events: [{ playerId: homeAtt.id, type: "GOAL" as const }],
    };
    expect(getPlayerBasePoints(withGoal, homeAtt)).toBe(100 + 20);

    const withGoalAndAssist = {
      ...baseMatch,
      events: [
        { playerId: homeAtt.id, type: "GOAL" as const },
        { playerId: homeAtt.id, type: "ASSIST" as const },
      ],
    };
    expect(getPlayerBasePoints(withGoalAndAssist, homeAtt)).toBe(100 + 50 + 20);

    const assistOnly = {
      ...baseMatch,
      events: [{ playerId: homeAtt.id, type: "ASSIST" as const }],
    };
    expect(getPlayerBasePoints(assistOnly, homeAtt)).toBe(50 + 20);
  });

  it("recalculate twice yields the same absolute total", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [{ playerId: homeDif.id, type: "GOAL" }],
    });
    const first = getPlayerBasePoints(game, homeDif);
    const second = getPlayerBasePoints(game, homeDif);
    expect(first).toBe(second);
    expect(first).toBe(100 + 20 + 30);
  });
});

describe("sandbox simulation scoring", () => {
  it("GOAL contributes +100 not +25", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [{ playerId: homeAtt.id, type: "GOAL" }],
    });
    const points = getPlayerBasePoints(game, homeAtt);
    expect(points).toBe(120);
    expect(points).not.toBe(25);
  });
});

describe("inspector breakdown", () => {
  it("exposes captain final points from the same engine", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [
        { playerId: homeDif.id, type: "GOAL" },
        { playerId: homeDif.id, type: "ASSIST" },
      ],
    });
    const breakdown = getPlayerMatchBreakdown(game, homeDif, {
      role: "DIFENSORE",
      isCaptain: true,
    });
    expect(breakdown.eventPoints).toBe(150);
    expect(breakdown.resultPoints).toBe(20);
    expect(breakdown.cleanSheetPoints).toBe(30);
    expect(breakdown.basePoints).toBe(200);
    expect(breakdown.finalPoints).toBe(300);
  });
});

describe("value engine uses scoring points", () => {
  it("maps scoring output bands without reimplementing event rules", () => {
    expect(valueDeltaFromPoints(100)).toBe(5);
    expect(valueDeltaFromPoints(30)).toBe(2);
    expect(valueDeltaFromPoints(0)).toBe(0);
    expect(valueDeltaFromPoints(-1)).toBe(-2);
    expect(valueDeltaFromPoints(-40)).toBe(-5);

    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [{ playerId: homeAtt.id, type: "GOAL" }],
    });
    const points = getPlayerBasePoints(game, homeAtt);
    expect(valueDeltaFromPoints(points)).toBe(5);
  });
});

describe("matchday round", () => {
  it("uses UTC YYYYMMDD", () => {
    expect(getMatchdayRound(new Date("2026-08-20T15:00:00.000Z"))).toBe(20260820);
  });
});

describe("production idempotency contract", () => {
  it("computeMatchScoring is pure so repeated calls do not accumulate", () => {
    const game = match({
      homeTeamId: "home",
      awayTeamId: "away",
      homeScore: 1,
      awayScore: 0,
      events: [{ playerId: homeAtt.id, type: "GOAL" }],
    });
    const teams = [
      {
        id: "ft",
        players: [{ playerId: homeAtt.id, role: "ATTACCANTE", isCaptain: false }],
      },
    ];
    const a = computeMatchScoring(game, [homeAtt], teams);
    const b = computeMatchScoring(game, [homeAtt], teams);
    expect(a).toEqual(b);
    expect(a.teamPoints[0]?.points).toBe(120);
  });
});
