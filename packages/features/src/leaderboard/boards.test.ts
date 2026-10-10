import { describe, expect, it } from "vitest";

import { PRACTICE_CATEGORIES } from "../practice/catalog";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  practiceBoardKey,
} from "../practice-menu-types";

import {
  LEADERBOARD_BOARDS,
  LEADERBOARD_MENU_TYPES,
  LEADERBOARD_PERIODS,
  isLeaderboardBoard,
  isLeaderboardMenuType,
  isLeaderboardPeriod,
  leaderboardBoardGroups,
  resolveLeaderboardBoard,
} from "./boards";

const exams = PRACTICE_MENU_TYPES.filter(isExamMenuType);

describe("LEADERBOARD_PERIODS", () => {
  it("総合と月間の 2 つ", () => {
    expect(LEADERBOARD_PERIODS).toEqual(["all-time", "monthly"]);
  });
});

describe("isLeaderboardPeriod", () => {
  it.each(["all-time", "monthly"])("%s を通す", (value) => {
    expect(isLeaderboardPeriod(value)).toBe(true);
  });

  it.each(["", "weekly", "alltime", "All-Time", "MONTHLY"])(
    "%s を弾く",
    (value) => {
      expect(isLeaderboardPeriod(value)).toBe(false);
    },
  );
});

describe("LEADERBOARD_MENU_TYPES", () => {
  it("練習を一覧の順に並べる", () => {
    expect(LEADERBOARD_MENU_TYPES).toEqual([
      "jantou_fu",
      "machi_fu",
      "mentsu_fu",
      "mentsu_jantou_fu",
      "total_fu",
      "yaku",
      "score_table",
      "score_calculation",
      "han_count",
      "yaku_han",
      "mangan_score_calculation",
    ]);
  });

  it("昇級試験を含まない", () => {
    // 試験の成果は段級位が表す。ランキングにも並べると物差しが 2 本になる
    expect(exams.length).toBeGreaterThan(0);
    for (const exam of exams) {
      expect(LEADERBOARD_MENU_TYPES).not.toContain(exam);
    }
  });
});

describe("isLeaderboardMenuType", () => {
  it.each(["jantou_fu", "yaku", "mentsu_jantou_fu"])("%s を通す", (value) => {
    expect(isLeaderboardMenuType(value)).toBe(true);
  });

  it.each(["", "jantou-fu", "unknown"])("%s を弾く", (value) => {
    expect(isLeaderboardMenuType(value)).toBe(false);
  });

  // 練習種別としては実在するが、ランキングを持たない。ここを通すと
  // 一覧から外した試験の詳細が直 URL で開けたままになる
  it.each(exams)("昇級試験 %s を弾く", (exam) => {
    expect(isLeaderboardMenuType(exam)).toBe(false);
  });
});

describe("LEADERBOARD_BOARDS", () => {
  it("ランキング対象の練習 × バリアントを列挙順に並べる", () => {
    const yakuHan = LEADERBOARD_BOARDS.filter(
      (board) => board.menuType === "yaku_han",
    );
    expect(yakuHan.map((board) => board.variant)).toEqual([
      "no_kuisagari",
      "kuisagari",
      "all",
    ]);
    const jantouFu = LEADERBOARD_BOARDS.filter(
      (board) => board.menuType === "jantou_fu",
    );
    expect(jantouFu.map((board) => board.variant)).toEqual(["default"]);
  });

  it("昇級試験の土俵を持たない", () => {
    expect(
      LEADERBOARD_BOARDS.some((board) => board.menuType === "mangan_exam"),
    ).toBe(false);
  });
});

describe("isLeaderboardBoard", () => {
  it("列挙にあるバリアントの土俵を通す", () => {
    expect(isLeaderboardBoard({ menuType: "yaku_han", variant: "all" })).toBe(
      true,
    );
  });

  it("他の練習のバリアント名を名乗った土俵を弾く", () => {
    expect(
      isLeaderboardBoard({ menuType: "jantou_fu", variant: "kuisagari" }),
    ).toBe(false);
  });

  it("昇級試験の土俵を弾く", () => {
    expect(
      isLeaderboardBoard({ menuType: "mangan_exam", variant: "default" }),
    ).toBe(false);
  });
});

describe("resolveLeaderboardBoard", () => {
  it("バリアントを既定に正規化する", () => {
    expect(resolveLeaderboardBoard("yaku-han", undefined)).toEqual({
      menuType: "yaku_han",
      variant: "no_kuisagari",
    });
    expect(resolveLeaderboardBoard("yaku-han", "bogus")?.variant).toBe(
      "no_kuisagari",
    );
    expect(resolveLeaderboardBoard("yaku-han", "all")?.variant).toBe("all");
    expect(resolveLeaderboardBoard("jantou-fu", "all")?.variant).toBe(
      "default",
    );
  });

  it("ランキングを持たない練習・未知のスラッグは undefined", () => {
    expect(resolveLeaderboardBoard("mangan-exam", undefined)).toBeUndefined();
    expect(resolveLeaderboardBoard("nope", undefined)).toBeUndefined();
  });
});

/**
 * 分野は練習カタログ（`PRACTICE_CATALOG`）から引くため、カタログに載らない
 * 練習がランキング対象に入ると、その土俵はどの見出しにも属さず一覧から
 * 静かに消える。落ちるのは行そのものなので、過不足をここで突き合わせる。
 */
describe("leaderboardBoardGroups", () => {
  const groups = leaderboardBoardGroups();

  it("すべての土俵がちょうど 1 つの分野に入る", () => {
    const grouped = groups.flatMap((group) => group.boards);
    // 並びは別の検査が見る。ここは過不足だけを集合で比べる
    expect(new Set(grouped.map(practiceBoardKey))).toEqual(
      new Set(LEADERBOARD_BOARDS.map(practiceBoardKey)),
    );
    expect(grouped).toHaveLength(LEADERBOARD_BOARDS.length);
  });

  it("分野は学習順（符 → 翻数 → 点数）に並ぶ", () => {
    const order = groups.map((group) => group.category);
    expect(order).toEqual(
      PRACTICE_CATEGORIES.filter((category) => order.includes(category)),
    );
  });

  it("分野の中の並びは LEADERBOARD_BOARDS の順を保つ", () => {
    const expected = LEADERBOARD_BOARDS.filter((board) =>
      groups[0]?.boards.includes(board),
    );
    expect(groups[0]?.boards).toEqual(expected);
  });
});
