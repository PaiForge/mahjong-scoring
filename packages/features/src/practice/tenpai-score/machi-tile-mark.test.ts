import { describe, expect, it } from "vitest";
import { HaiKind, judgeMachiSelection } from "@mahjong-scoring/core";

import { TENPAI_SCORE_DEMO_QUESTION } from "./demo-question";
import { MACHI_TILE_MARK_CLASSES, machiTileMark } from "./machi-tile-mark";

// デモの待ちは二筒・五筒。二筒と一萬を選んだ判定で、正解・余計・見落としが 1 つずつ揃う
const judgement = judgeMachiSelection(TENPAI_SCORE_DEMO_QUESTION, [
  HaiKind.PinZu2,
  HaiKind.ManZu1,
]);

describe("machiTileMark", () => {
  it("回答前はどの牌にも印が付かない", () => {
    expect(machiTileMark(HaiKind.PinZu2, true, undefined)).toBeUndefined();
    expect(machiTileMark(HaiKind.ManZu1, true, undefined)).toBeUndefined();
  });

  it("待ちを選んでいれば正解の印が付く", () => {
    expect(machiTileMark(HaiKind.PinZu2, true, judgement)).toBe("correct");
  });

  it("待ちでない牌を選んでいれば余計の印が付く", () => {
    expect(machiTileMark(HaiKind.ManZu1, true, judgement)).toBe("extra");
  });

  it("選ばなかった待ちには見落としの印が付く", () => {
    expect(machiTileMark(HaiKind.PinZu5, false, judgement)).toBe("missed");
  });

  it("待ちでもなく選んでもいない牌には印が付かない", () => {
    expect(machiTileMark(HaiKind.SouZu9, false, judgement)).toBeUndefined();
  });

  it("選んでいない牌は、判定の正解に含まれていても正解の印にならない", () => {
    expect(machiTileMark(HaiKind.PinZu2, false, judgement)).toBeUndefined();
  });
});

describe("MACHI_TILE_MARK_CLASSES", () => {
  it("印ごとに見た目が異なる", () => {
    const classes = Object.values(MACHI_TILE_MARK_CLASSES);
    expect(new Set(classes).size).toBe(classes.length);
    expect(classes.every((c) => c.trim().length > 0)).toBe(true);
  });

  it("破線は見落としだけに付く（選んでいない牌を塗ると選んだように見えるため）", () => {
    const dashed = Object.entries(MACHI_TILE_MARK_CLASSES)
      .filter(([, c]) => c.split(" ").includes("border-dashed"))
      .map(([mark]) => mark);
    expect(dashed).toEqual(["missed"]);
  });
});
