import { describe, expect, it } from "vitest";
import { FuroType, HaiKind, Tacha } from "@mahjong-scoring/core";

import {
  parseMarkers,
  parseQuestionTiles,
  restoreTehaiQuestion,
} from "./parse-question-tiles";

/** 牌まわりのスナップショット（2.0 の表記） */
const SNAPSHOT = {
  tehai: "234m67888s[2-34s][6-78m]",
  agariHai: "2m",
  bakaze: "2z",
  jikaze: "1z",
};

describe("parseQuestionTiles", () => {
  it("手牌・和了牌・場風・自風を復元する", () => {
    const tiles = parseQuestionTiles(SNAPSHOT);

    expect(tiles?.agariHai).toBe(HaiKind.ManZu2);
    expect(tiles?.bakaze).toBe(HaiKind.Nan);
    expect(tiles?.jikaze).toBe(HaiKind.Ton);
    expect(tiles?.tehai.exposed).toHaveLength(2);
    expect(tiles?.tehai.exposed[0]?.furo).toEqual({
      type: FuroType.Chi,
      from: Tacha.Kamicha,
      nakiHai: HaiKind.SouZu2,
    });
  });

  it("解釈できない手牌（Extended MPSZ 1.x の表記）は例外にせず undefined にする", () => {
    // 方向注釈の無い副露。スキーマは文字列であることしか見ないので、
    // 手牌の再表示だけを諦め、正誤の一覧は表示できるようにする
    const unreadable = { ...SNAPSHOT, tehai: "234m67888s[234s][678m]" };
    expect(() => parseQuestionTiles(unreadable)).not.toThrow();
    expect(parseQuestionTiles(unreadable)).toBeUndefined();
  });

  it("赤 5 の表記は 5 として読む", () => {
    const tiles = parseQuestionTiles({ ...SNAPSHOT, tehai: "406m" });
    expect(tiles?.tehai.closed).toEqual([
      HaiKind.ManZu4,
      HaiKind.ManZu5,
      HaiKind.ManZu6,
    ]);
  });
});

describe("parseQuestionTiles の欠けた値", () => {
  it.each([
    ["手牌", { tehai: "" }],
    ["和了牌", { agariHai: "" }],
    ["和了牌（読めない文字列）", { agariHai: "x" }],
    ["場風", { bakaze: "" }],
    ["場風（風牌でない牌）", { bakaze: "5z" }],
    ["自風", { jikaze: "" }],
    ["自風（風牌でない牌）", { jikaze: "1m" }],
  ])(
    "%s を復元できなければ、他が読めても全体を undefined にする",
    (_, patch) => {
      expect(parseQuestionTiles({ ...SNAPSHOT, ...patch })).toBeUndefined();
    },
  );
});

describe("restoreTehaiQuestion", () => {
  it("手牌と状況（和了牌・場風・自風・ツモ/ロン・ルール設定）を分けて返す", () => {
    const ruleConfig = { kiriageMangan: true };
    const restored = restoreTehaiQuestion({
      ...SNAPSHOT,
      isTsumo: true,
      ruleConfig,
    });
    expect(restored?.tehai).toEqual(parseQuestionTiles(SNAPSHOT)?.tehai);
    expect(restored?.context).toEqual({
      agariHai: HaiKind.ManZu2,
      bakaze: HaiKind.Nan,
      jikaze: HaiKind.Ton,
      isTsumo: true,
      ruleConfig,
    });
  });

  it("ルール設定を保存していない結果は、ルール設定を持たない状況になる", () => {
    const restored = restoreTehaiQuestion({ ...SNAPSHOT, isTsumo: false });
    expect(restored?.context.isTsumo).toBe(false);
    expect(restored?.context.ruleConfig).toBeUndefined();
  });

  it("牌を復元できなければ undefined にする", () => {
    expect(
      restoreTehaiQuestion({ ...SNAPSHOT, jikaze: "", isTsumo: true }),
    ).toBeUndefined();
  });
});

describe("parseMarkers", () => {
  it("要素ごとに MPSZ を読み、複数の牌を持つ要素も平坦化する", () => {
    expect(parseMarkers(["1m", "23p"])).toEqual([
      HaiKind.ManZu1,
      HaiKind.PinZu2,
      HaiKind.PinZu3,
    ]);
  });

  it("表示牌を保存していなければ undefined のまま返す", () => {
    expect(parseMarkers(undefined)).toBeUndefined();
  });
});
