import { describe, expect, it } from "vitest";

import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
} from "@/lib/db/practice-menu-types";

import {
  BOARDS,
  MODULES,
  PAGE_SIZE,
  VALID_PERIODS,
  buildChallengePath,
  buildDetailPath,
  moduleToSlug,
  resolveBoard,
  slugToModule,
} from "../types";

describe("VALID_PERIODS", () => {
  it('contains exactly "all-time" and "monthly"', () => {
    expect(VALID_PERIODS).toEqual(["all-time", "monthly"]);
  });

  it("has length 2", () => {
    expect(VALID_PERIODS).toHaveLength(2);
  });
});

describe("MODULES", () => {
  it("contains all practice modules", () => {
    expect(MODULES).toEqual([
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
    const exams = PRACTICE_MENU_TYPES.filter(isExamMenuType);

    expect(exams.length).toBeGreaterThan(0);
    for (const exam of exams) {
      expect(MODULES).not.toContain(exam);
    }
  });
});

describe("PAGE_SIZE", () => {
  it("is 20", () => {
    expect(PAGE_SIZE).toBe(20);
  });
});

describe("moduleToSlug", () => {
  it("converts jantou_fu to jantou-fu", () => {
    expect(moduleToSlug("jantou_fu")).toBe("jantou-fu");
  });

  it("converts machi_fu to machi-fu", () => {
    expect(moduleToSlug("machi_fu")).toBe("machi-fu");
  });

  it("converts yaku to yaku", () => {
    expect(moduleToSlug("yaku")).toBe("yaku");
  });
});

describe("slugToModule", () => {
  it("converts jantou-fu to jantou_fu", () => {
    expect(slugToModule("jantou-fu")).toBe("jantou_fu");
  });

  it("converts mentsu-fu to mentsu_fu", () => {
    expect(slugToModule("mentsu-fu")).toBe("mentsu_fu");
  });

  it("converts yaku to yaku", () => {
    expect(slugToModule("yaku")).toBe("yaku");
  });

  it("returns undefined for unknown slug", () => {
    expect(slugToModule("unknown")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(slugToModule("")).toBeUndefined();
  });
});

describe("buildDetailPath", () => {
  it("builds correct path for all-time jantou_fu", () => {
    expect(
      buildDetailPath("all-time", { module: "jantou_fu", variant: "default" }),
    ).toBe("/leaderboard/all-time/jantou-fu");
  });

  it("builds correct path for monthly yaku", () => {
    expect(
      buildDetailPath("monthly", { module: "yaku", variant: "default" }),
    ).toBe("/leaderboard/monthly/yaku");
  });

  it("バリアントを持つ練習は ?variant= で土俵を指す", () => {
    expect(
      buildDetailPath("all-time", { module: "yaku_han", variant: "kuisagari" }),
    ).toBe("/leaderboard/all-time/yaku-han?variant=kuisagari");
  });
});

describe("buildChallengePath", () => {
  it("builds correct path for jantou_fu", () => {
    expect(
      buildChallengePath({ module: "jantou_fu", variant: "default" }),
    ).toBe("/practice/jantou-fu/play");
  });

  it("バリアントを持つ練習はそのバリアントで play を開く", () => {
    expect(buildChallengePath({ module: "score_table", variant: "all" })).toBe(
      "/practice/score-table/play?variant=all",
    );
  });
});

describe("BOARDS", () => {
  it("ランキング対象の練習 × バリアントを列挙順に並べる", () => {
    const yakuHan = BOARDS.filter((board) => board.module === "yaku_han");
    expect(yakuHan.map((board) => board.variant)).toEqual([
      "no_kuisagari",
      "kuisagari",
      "all",
    ]);
    const jantouFu = BOARDS.filter((board) => board.module === "jantou_fu");
    expect(jantouFu.map((board) => board.variant)).toEqual(["default"]);
  });

  it("昇級試験の土俵を持たない", () => {
    expect(BOARDS.some((board) => board.module === "mangan_exam")).toBe(false);
  });
});

describe("resolveBoard", () => {
  it("バリアントを既定に正規化する", () => {
    expect(resolveBoard("yaku-han", undefined)).toEqual({
      module: "yaku_han",
      variant: "no_kuisagari",
    });
    expect(resolveBoard("yaku-han", "bogus")?.variant).toBe("no_kuisagari");
    expect(resolveBoard("yaku-han", "all")?.variant).toBe("all");
    expect(resolveBoard("jantou-fu", "all")?.variant).toBe("default");
  });

  it("ランキングを持たない練習・未知のスラッグは undefined", () => {
    expect(resolveBoard("mangan-exam", undefined)).toBeUndefined();
    expect(resolveBoard("nope", undefined)).toBeUndefined();
  });
});
