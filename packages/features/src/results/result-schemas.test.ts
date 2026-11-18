import { describe, expect, it } from "vitest";

import {
  AnswerOutcome,
  ruleConfigSchema,
  toAnswerOutcome,
  toNumericAnswerOutcome,
} from "./result-schemas";

describe("toNumericAnswerOutcome", () => {
  it("正解と同じ値なら Correct、違えば Incorrect", () => {
    expect(toNumericAnswerOutcome(30, 30)).toBe(AnswerOutcome.Correct);
    expect(toNumericAnswerOutcome(40, 30)).toBe(AnswerOutcome.Incorrect);
  });

  it("回答が無ければ比べずに TimeUp", () => {
    expect(toNumericAnswerOutcome(undefined, 30)).toBe(AnswerOutcome.TimeUp);
  });

  it("0 の回答は「回答なし」と取り違えない", () => {
    expect(toNumericAnswerOutcome(0, 0)).toBe(AnswerOutcome.Correct);
    expect(toNumericAnswerOutcome(0, 2)).toBe(AnswerOutcome.Incorrect);
  });
});

describe("toAnswerOutcome", () => {
  it("正誤の判定を顛末にし、判定が無ければ時間切れにする", () => {
    expect(toAnswerOutcome(true)).toBe(AnswerOutcome.Correct);
    expect(toAnswerOutcome(false)).toBe(AnswerOutcome.Incorrect);
    expect(toAnswerOutcome(undefined)).toBe(AnswerOutcome.TimeUp);
  });
});

describe("ruleConfigSchema", () => {
  it("保存したルール設定の項目を落とさずに読み戻す", () => {
    const ruleConfig = {
      doubleWindJantouFu: 4,
      kiriageMangan: true,
      suuankouTanki: false,
      daisuushii: true,
      kokushiMusouJuusanmen: false,
      junseiChuurenPoutou: true,
      fukugouYakuman: false,
    } as const;
    expect(ruleConfigSchema.parse(ruleConfig)).toEqual(ruleConfig);
  });

  it("連風牌の雀頭符は 2 か 4 だけを受け付ける", () => {
    expect(ruleConfigSchema.safeParse({ doubleWindJantouFu: 2 }).success).toBe(
      true,
    );
    expect(ruleConfigSchema.safeParse({ doubleWindJantouFu: 3 }).success).toBe(
      false,
    );
  });

  it("真偽値の項目に真偽値以外が入っていれば弾く", () => {
    expect(ruleConfigSchema.safeParse({ kiriageMangan: "yes" }).success).toBe(
      false,
    );
  });
});
