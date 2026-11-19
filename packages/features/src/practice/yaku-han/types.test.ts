import { describe, expect, it } from "vitest";

import { PRACTICE_SLUG, resultStorageKeyFor } from "../../practice-menu-types";
import {
  parseYakuHanResults,
  RESULT_STORAGE_KEY,
  toQuestionResult,
} from "./types";

/** 保存形式として妥当な結果データ */
const validResult = {
  yakuName: "三色同順",
  isMenzen: false,
  correctHan: 1,
  userHan: 2,
  outcome: "incorrect",
};

describe("RESULT_STORAGE_KEY", () => {
  it("レジストリの役翻数練習の slug から導いた保存キーを使う", () => {
    expect(RESULT_STORAGE_KEY).toBe(resultStorageKeyFor(PRACTICE_SLUG.yakuHan));
  });
});

describe("toQuestionResult", () => {
  const question = { yakuName: "混一色", isMenzen: true, correctHan: 3 };

  it("出題した役・門前か・正解の翻数と回答を記録し、一致すれば正解にする", () => {
    expect(toQuestionResult(question, 3)).toEqual({
      yakuName: "混一色",
      isMenzen: true,
      correctHan: 3,
      userHan: 3,
      outcome: "correct",
    });
  });

  it("正解の翻数と違えば不正解にする", () => {
    expect(toQuestionResult(question, 2)).toMatchObject({
      userHan: 2,
      outcome: "incorrect",
    });
  });

  it("回答なし（時間切れ）は outcome=timeUp で記録し、パースを通過する", () => {
    const result = toQuestionResult(question, undefined);
    expect(result.outcome).toBe("timeUp");
    expect(result.userHan).toBeUndefined();
    expect(parseYakuHanResults([result])).toEqual([result]);
  });
});

describe("parseYakuHanResults", () => {
  it("保存形式として妥当な要素はそのまま返す", () => {
    expect(parseYakuHanResults([validResult])).toEqual([validResult]);
  });

  it("役名が文字列でない要素は除外する", () => {
    expect(parseYakuHanResults([{ ...validResult, yakuName: 1 }])).toEqual([]);
  });

  it("門前かどうかが真偽値でない要素は除外する", () => {
    expect(
      parseYakuHanResults([{ ...validResult, isMenzen: "false" }]),
    ).toEqual([]);
  });
});
