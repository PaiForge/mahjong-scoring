import { describe, expect, it } from "vitest";

import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
} from "@/lib/db/practice-menu-types";

import {
  EXCLUDED_MENU_TYPES,
  isMyRecordBoard,
  isMyRecordMenuType,
} from "../menu-scope";

describe("マイレコードの対象種別", () => {
  it("昇級試験をすべて除外対象に持つ", () => {
    const exams = PRACTICE_MENU_TYPES.filter(isExamMenuType);

    expect(exams.length).toBeGreaterThan(0);
    expect([...EXCLUDED_MENU_TYPES].sort()).toEqual([...exams].sort());
  });

  it("通常の練習は対象に含む", () => {
    expect(isMyRecordMenuType("jantou_fu")).toBe(true);
    expect(isMyRecordMenuType("score_calculation")).toBe(true);
  });

  it.each(PRACTICE_MENU_TYPES.filter(isExamMenuType))(
    "昇級試験 %s は対象外",
    (exam) => {
      // 画面から選べなくても Server Action は任意の値で呼べるため、
      // 述語そのものが試験を弾いている必要がある
      expect(isMyRecordMenuType(exam)).toBe(false);
    },
  );

  it("練習種別ではない値は対象外", () => {
    expect(isMyRecordMenuType("unknown")).toBe(false);
    expect(isMyRecordMenuType("")).toBe(false);
  });
});

describe("マイレコードの土俵", () => {
  it("練習の列挙にあるバリアントだけを対象にする", () => {
    expect(isMyRecordBoard({ menuType: "jantou_fu", variant: "default" })).toBe(
      true,
    );
    expect(isMyRecordBoard({ menuType: "yaku_han", variant: "all" })).toBe(
      true,
    );
    // バリアントを持つ練習に default は無い
    expect(isMyRecordBoard({ menuType: "yaku_han", variant: "default" })).toBe(
      false,
    );
    // 他の練習のバリアント名は通さない
    expect(isMyRecordBoard({ menuType: "jantou_fu", variant: "all" })).toBe(
      false,
    );
  });

  it("昇級試験の土俵は対象外", () => {
    expect(
      isMyRecordBoard({ menuType: "mangan_exam", variant: "default" }),
    ).toBe(false);
  });
});
