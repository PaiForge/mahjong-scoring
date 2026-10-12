import { describe, expect, it } from "vitest";

import { leaderboardBoardLabel } from "./board-label";

/** キーをそのまま返す翻訳関数 */
const t = (key: string): string => key;

describe("leaderboardBoardLabel", () => {
  it("出題範囲を選べる練習でも、土俵が 1 つなら範囲名を添えない", () => {
    expect(
      leaderboardBoardLabel({ menuType: "score_table", variant: "all" }, t),
    ).toBe("practice.practices.scoreTable.shortTitle");
  });

  it("設定を持たない練習は短い名だけ", () => {
    expect(
      leaderboardBoardLabel({ menuType: "jantou_fu", variant: "default" }, t),
    ).toBe("practice.practices.jantouFu.shortTitle");
  });
});
