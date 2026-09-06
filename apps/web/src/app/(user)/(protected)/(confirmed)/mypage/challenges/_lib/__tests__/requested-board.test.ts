import { describe, expect, it } from "vitest";

import { resolveRequestedBoard } from "../requested-board";

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
