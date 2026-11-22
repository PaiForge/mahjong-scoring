import { describe, expect, it } from "vitest";
import { DEFAULT_RULE_SETTINGS } from "@mahjong-scoring/core/rules/settings";
import { parseDailyAnswerDetail } from "./answer-detail";

const detail = {
  v: 1,
  outcome: "answered",
  mode: {
    requireYaku: true,
    requireHanFu: true,
    exactHan: false,
    requireFuForMangan: false,
  },
  answer: { han: 5, score: 8000, yaku: ["Ton"] },
  client: {
    scoringVersion: 1,
    build: "answer-time-build",
    ruleSettings: DEFAULT_RULE_SETTINGS,
    scoreInput: "select",
    koTsumoInput: "split",
  },
};

describe("解答詳細の保存契約", () => {
  it("省略・未対応版・不正な詳細を区別する", () => {
    expect(parseDailyAnswerDetail(undefined)).toEqual({ kind: "legacy" });
    expect(parseDailyAnswerDetail({ v: 2 })).toEqual({
      kind: "unsupportedDetail",
    });
    for (const value of [null, {}, { v: 1 }, { v: "2" }])
      expect(parseDailyAnswerDetail(value)).toEqual({ kind: "invalidDetail" });
  });
  it("5翻を選んで符が省略された正当な誤答を受け、解答時の条件を保持する", () => {
    expect(parseDailyAnswerDetail(detail)).toEqual({ kind: "valid", detail });
  });
  it("回答に内訳専用の役ID・表示名・ドラを受け付けない", () => {
    for (const id of ["Bakaze", "Jikaze", "三暗刻", "Dora", "toString"])
      expect(
        parseDailyAnswerDetail({
          ...detail,
          answer: { ...detail.answer, yaku: [id] },
        }).kind,
      ).toBe("invalidDetail");
  });
  it("わからないは解答を持たず、回答モードと端末条件は保持する", () => {
    const gaveUp = {
      v: 1,
      outcome: "gaveUp",
      mode: detail.mode,
      client: detail.client,
    };
    expect(parseDailyAnswerDetail(gaveUp)).toEqual({
      kind: "valid",
      detail: gaveUp,
    });
    expect(parseDailyAnswerDetail({ ...detail, outcome: "gaveUp" }).kind).toBe(
      "invalidDetail",
    );
  });
  it("タイル入力の実効方式にsplitを記録しない", () => {
    expect(
      parseDailyAnswerDetail({
        ...detail,
        client: { ...detail.client, scoreInput: "tiles" },
      }).kind,
    ).toBe("invalidDetail");
  });
});
