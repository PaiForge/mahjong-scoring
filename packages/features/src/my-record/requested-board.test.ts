import { describe, expect, it } from "vitest";

import { resolveRequestedBoard, selectRecordBoard } from "./requested-board";

describe("resolveRequestedBoard", () => {
  it("menu と variant から土俵を組む", () => {
    expect(
      resolveRequestedBoard({ menu: "yaku_han", variant: "kuisagari" }),
    ).toEqual({ menuType: "yaku_han", variant: "kuisagari" });
  });

  it("variant が無ければ既定（設定を持たない練習の唯一の土俵）", () => {
    expect(resolveRequestedBoard({ menu: "jantou_fu" })).toEqual({
      menuType: "jantou_fu",
      variant: "default",
    });
  });

  it("バリアントを持つ練習で variant を省くと指定なし扱い", () => {
    expect(resolveRequestedBoard({ menu: "yaku_han" })).toBeUndefined();
  });

  it("未知の種別・昇級試験・他の練習のバリアントは指定なし扱い", () => {
    expect(resolveRequestedBoard({ menu: "nope" })).toBeUndefined();
    expect(resolveRequestedBoard({ menu: "mangan_exam" })).toBeUndefined();
    expect(
      resolveRequestedBoard({ menu: "jantou_fu", variant: "all" }),
    ).toBeUndefined();
    expect(resolveRequestedBoard({})).toBeUndefined();
  });
});

describe("selectRecordBoard", () => {
  const jantouFu = { menuType: "jantou_fu", variant: "default" } as const;
  const yakuHan = { menuType: "yaku_han", variant: "kuisagari" } as const;
  const boards = [jantouFu, yakuHan];

  it("要求された土俵に記録があればそれを選ぶ", () => {
    expect(
      selectRecordBoard(boards, { menuType: "yaku_han", variant: "kuisagari" }),
    ).toBe(yakuHan);
  });

  it("要求なし・記録の無い土俵は先頭に落とす", () => {
    expect(selectRecordBoard(boards, undefined)).toBe(jantouFu);
    expect(
      selectRecordBoard(boards, { menuType: "yaku_han", variant: "all" }),
    ).toBe(jantouFu);
  });

  it("記録が 1 件も無ければ undefined", () => {
    expect(selectRecordBoard([], jantouFu)).toBeUndefined();
    expect(selectRecordBoard([], undefined)).toBeUndefined();
  });
});
