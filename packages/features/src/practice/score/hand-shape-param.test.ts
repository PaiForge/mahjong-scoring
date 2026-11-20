import { describe, expect, it } from "vitest";

import {
  HAND_SHAPE_FURO,
  HAND_SHAPE_MENZEN,
  HAND_SHAPE_PARAM,
  parseHandShape,
} from "./hand-shape-param";

describe("parseHandShape", () => {
  it("門前と副露のトークンはそれぞれの手の形になる", () => {
    expect(parseHandShape(HAND_SHAPE_MENZEN)).toBe(HAND_SHAPE_MENZEN);
    expect(parseHandShape(HAND_SHAPE_FURO)).toBe(HAND_SHAPE_FURO);
  });

  it("指定なし・空文字・未知の値は絞り込みなしになる", () => {
    expect(parseHandShape(null)).toBeUndefined();
    expect(parseHandShape("")).toBeUndefined();
    expect(parseHandShape("all")).toBeUndefined();
  });
});

describe("手の形の URL の語彙", () => {
  it("パラメータ名とトークンは空でなく、門前と副露で異なる", () => {
    expect(HAND_SHAPE_PARAM).not.toBe("");
    expect(HAND_SHAPE_MENZEN).not.toBe("");
    expect(HAND_SHAPE_FURO).not.toBe("");
    expect(HAND_SHAPE_MENZEN).not.toBe(HAND_SHAPE_FURO);
  });

  it("トークンは URL にそのまま載る文字だけでできている", () => {
    for (const value of [
      HAND_SHAPE_PARAM,
      HAND_SHAPE_MENZEN,
      HAND_SHAPE_FURO,
    ]) {
      expect(encodeURIComponent(value)).toBe(value);
    }
  });
});
