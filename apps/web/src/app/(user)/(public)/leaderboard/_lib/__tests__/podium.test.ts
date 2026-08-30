import { describe, expect, it } from "vitest";

import { getMedalEmoji, leaderboardRowClassName } from "../podium";

describe("getMedalEmoji", () => {
  it("returns gold / silver / bronze medals for the podium", () => {
    expect(getMedalEmoji(1)).toBe("🥇");
    expect(getMedalEmoji(2)).toBe("🥈");
    expect(getMedalEmoji(3)).toBe("🥉");
  });

  it("returns undefined outside the podium", () => {
    expect(getMedalEmoji(4)).toBeUndefined();
    expect(getMedalEmoji(0)).toBeUndefined();
  });
});

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

  it("keeps the accent solid so the dashed row divider does not bleed into it", () => {
    expect(
      leaderboardRowClassName({ rank: 1, isCurrentUser: false }),
    ).toContain("[border-left-style:solid]");
  });

  it("leaves rows outside the podium without an accent", () => {
    expect(
      leaderboardRowClassName({ rank: 4, isCurrentUser: false }),
    ).not.toContain("border-l-");
  });

  it("prefers the current-user highlight over the podium fill", () => {
    const className = leaderboardRowClassName({ rank: 1, isCurrentUser: true });

    expect(className).toContain("bg-primary-50");
    expect(className).not.toContain("bg-surface-50");
    // 塗りは自分の行が勝っても、金属の縁は残す
    expect(className).toContain("border-l-podium-gold");
  });
});
