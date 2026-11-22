import { describe, expect, it } from "vitest";
import { DEFAULT_RULE_SETTINGS, SCORING_VERSION } from "@mahjong-scoring/core";

import { parseDailyAnswerDetail } from "./answer-detail";
import {
  buildDailyAnswerDetail,
  type DailyAnswerDetailInput,
} from "./build-answer-detail";

const input: DailyAnswerDetailInput = {
  answer: { han: undefined, fu: undefined, score: 8000, yakus: [] },
  mode: {
    requireYaku: false,
    requireHanFu: false,
    exactHan: false,
    requireFuForMangan: false,
  },
  ruleSettings: DEFAULT_RULE_SETTINGS,
  build: "dpl_1",
  scoreInput: "select",
  storedKoTsumoInput: "split",
};

describe("buildDailyAnswerDetail", () => {
  it("入力しなかった項目を持たず、役を役 ID で持つ詳細を組み立てる", () => {
    const detail = buildDailyAnswerDetail({
      ...input,
      answer: {
        han: 2,
        fu: undefined,
        scoreFromKo: 500,
        scoreFromOya: 1000,
        yakus: ["立直", "役牌 東"],
      },
    });
    expect(detail).toEqual({
      v: 1,
      outcome: "answered",
      mode: input.mode,
      answer: {
        han: 2,
        scoreFromKo: 500,
        scoreFromOya: 1000,
        yaku: ["Riichi", "Ton"],
      },
      client: {
        scoringVersion: SCORING_VERSION,
        build: "dpl_1",
        ruleSettings: DEFAULT_RULE_SETTINGS,
        scoreInput: "select",
        koTsumoInput: "split",
      },
    });
    // サーバーの入口と同じ検証を通る
    expect(parseDailyAnswerDetail(JSON.parse(JSON.stringify(detail)))).toEqual({
      kind: "valid",
      detail,
    });
  });

  it("「わからない」は解答を持たない", () => {
    const detail = buildDailyAnswerDetail({ ...input, answer: undefined });
    expect(detail).toMatchObject({ outcome: "gaveUp" });
    expect(detail).not.toHaveProperty("answer");
  });

  it("タイル入力では、保存値が別々でも子ツモは組として残す", () => {
    expect(
      buildDailyAnswerDetail({ ...input, scoreInput: "tiles" })?.client,
    ).toMatchObject({ scoreInput: "tiles", koTsumoInput: "combined" });
  });

  it("ビルドが分からない環境では build を持たない", () => {
    for (const build of [undefined, ""])
      expect(
        buildDailyAnswerDetail({ ...input, build })?.client,
      ).not.toHaveProperty("build");
  });

  it("ストアの状態（setter を含む）を渡しても、ルール設定の真偽値だけを写す", () => {
    const store = {
      ...DEFAULT_RULE_SETTINGS,
      kiriageMangan: true,
      set: () => {},
    };
    expect(
      buildDailyAnswerDetail({ ...input, ruleSettings: store })?.client
        .ruleSettings,
    ).toEqual({ ...DEFAULT_RULE_SETTINGS, kiriageMangan: true });
  });

  it("選択肢に無い役名・内訳専用の役名を含む解答は組み立てない", () => {
    for (const name of ["未知の役", "場風牌", "ドラ"])
      expect(
        buildDailyAnswerDetail({
          ...input,
          answer: { han: undefined, fu: undefined, score: 8000, yakus: [name] },
        }),
      ).toBeUndefined();
  });
});
