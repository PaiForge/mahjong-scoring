/**
 * 土俵の分野分けの検証
 *
 * @description
 * 分野は練習カタログ（`PRACTICE_CATALOG`）から引くため、カタログに載らない
 * 練習がランキング対象に入ると、その土俵はどの見出しにも属さず一覧から
 * 静かに消える。落ちるのは行そのものなので、過不足をここで突き合わせる。
 */
import { describe, expect, it } from "vitest";

import { PRACTICE_CATEGORIES } from "@/app/(user)/(public)/practice/_lib/practice-catalog";

import { leaderboardBoardGroups } from "../board-groups";
import { BOARDS, boardKey } from "../types";

const groups = leaderboardBoardGroups();
const grouped = groups.flatMap((group) => group.boards);

describe("leaderboardBoardGroups", () => {
  it("すべての土俵がちょうど 1 つの分野に入る", () => {
    expect(grouped.map(boardKey).toSorted()).toEqual(
      BOARDS.map(boardKey).toSorted(),
    );
  });

  it("分野は学習順（符 → 翻数 → 点数）に並ぶ", () => {
    const order = groups.map((group) => group.category);

    expect(order).toEqual(
      PRACTICE_CATEGORIES.filter((category) => order.includes(category)),
    );
  });

  it("分野の中の並びは BOARDS の順を保つ", () => {
    const expected = BOARDS.filter((board) =>
      groups[0]?.boards.includes(board),
    );

    expect(groups[0]?.boards).toEqual(expected);
  });
});
