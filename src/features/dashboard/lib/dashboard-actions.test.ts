import { describe, expect, it } from "vitest";

import { pickTodayActions } from "./dashboard-actions";

describe("dashboard today actions", () => {
  it("keeps only the most relevant real actions", () => {
    const actions = pickTodayActions([
      null,
      { id: "prediction", title: "Pronostico", description: "Scegli il vincitore", href: "#prediction" },
      { id: "fanta", title: "Fanta", description: "Completa la formazione", href: "/fanta" },
      undefined,
      { id: "mission", title: "Missione", description: "Disponibile", href: "/altro/missioni" },
      { id: "referral", title: "Referral", description: "Invita", href: "/altro/referral" },
    ]);

    expect(actions.map((action) => action.id)).toEqual(["prediction", "fanta", "mission"]);
  });
});
