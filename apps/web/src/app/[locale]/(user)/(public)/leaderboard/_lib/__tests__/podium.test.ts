import { describe, expect, it } from "vitest";

import { leaderboardRowClassName } from "../podium";

describe("leaderboardRowClassName", () => {
  it("accents the podium rows with the matching metal", () => {
    expect(
      leaderboardRowClassName({ rank: 1, isCurrentUser: false }),
    ).toContain("border-l-podium-gold");
    expect(
      leaderboardRowClassName({ rank: 2, isCurrentUser: false }),
    ).toContain("border-l-podium-silver");
    expect(
      leaderboardRowClassName({ rank: 3, isCurrentUser: false }),
    ).toContain("border-l-podium-bronze");
  });

  it("leaves rows outside the podium without an accent", () => {
    expect(
      leaderboardRowClassName({ rank: 4, isCurrentUser: false }),
    ).not.toContain("border-l-");
  });

  it("prefers the current-user highlight over the podium fill", () => {
    const className = leaderboardRowClassName({ rank: 1, isCurrentUser: true });

    expect(className).toContain("bg-brand-subtle");
    expect(className).not.toContain("bg-surface-50");
    // 塗りは自分の行が勝っても、金属の縁は残す
    expect(className).toContain("border-l-podium-gold");
  });
});
