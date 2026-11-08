import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import {
  formatFuReasonJa,
  generateTotalFuQuestion,
  type FuReasonSpec,
} from "@mahjong-scoring/core";
import { messages } from "@mahjong-scoring/messages/ja";

import { fuReasonLabel, type FuReasonTranslator } from "./fu-reason-label";

/** 日本語の辞書の `challenge.fuBreakdown`（アプリと同じ ICU の解釈で引く） */
const translateJa = createTranslator({
  locale: "ja",
  messages: messages.challenge.fuBreakdown,
});

/**
 * 文字列のキーで引く形に包んだもの
 *
 * use-intl の翻訳関数はキーを辞書の型で絞るため、テンプレートリテラルで組んだ
 * キーを渡す features の関数の引数の型に直接は入らない（アプリは辞書の型を
 * 宣言していないので文字列で渡せる）。ここでは同じ関数を文字列のキーで呼ぶ。
 */
const tJa: FuReasonTranslator = (key, values) =>
  String(Reflect.apply(translateJa, undefined, [key, values]));

/** core が出せる理由の構造をすべて並べたもの */
const ALL_SPECS: readonly FuReasonSpec[] = [
  { kind: "futei" },
  { kind: "chiitoitsu" },
  { kind: "pinfuTsumo" },
  { kind: "tsumo" },
  { kind: "menzenRon" },
  { kind: "kuiPinfu" },
  ...[false, true].flatMap((yaochu) =>
    [false, true].flatMap((open) =>
      [false, true].map((kantsu): FuReasonSpec => ({
        kind: "mentsu",
        yaochu,
        open,
        kantsu,
      })),
    ),
  ),
  { kind: "jantou", reasons: ["bakaze"] },
  { kind: "jantou", reasons: ["jikaze"] },
  { kind: "jantou", reasons: ["sangenpai"] },
  { kind: "jantou", reasons: ["bakaze", "jikaze"] },
  { kind: "machi", machi: "tanki" },
  { kind: "machi", machi: "kanchan" },
  { kind: "machi", machi: "penchan" },
  { kind: "machi", machi: "other" },
];

describe("fuReasonLabel", () => {
  it.each(ALL_SPECS)(
    "日本語の辞書で引いた文言は core の formatFuReasonJa と一致する（%j）",
    (spec) => {
      expect(fuReasonLabel({ reason: formatFuReasonJa(spec), spec }, tJa)).toBe(
        formatFuReasonJa(spec),
      );
    },
  );

  it("出題が組んだ内訳の全行で、日本語の辞書の文言が reason と一致する", () => {
    for (let i = 0; i < 200; i++) {
      const question = generateTotalFuQuestion();
      if (question === undefined) continue;
      for (const detail of question.fuDetails) {
        expect(detail.spec).toBeDefined();
        expect(fuReasonLabel(detail, tJa)).toBe(detail.reason);
      }
    }
  });

  it("構造を持たない行（構造を足す前に保存された内訳）は reason をそのまま返す", () => {
    const t: FuReasonTranslator = (key) => `<${key}>`;
    expect(fuReasonLabel({ reason: "副底" }, t)).toBe("副底");
  });

  it("面子・雀頭・待ちは ICU の引数で辞書へ渡す", () => {
    const calls: [string, Record<string, string | number> | undefined][] = [];
    const t: FuReasonTranslator = (key, values) => {
      calls.push([key, values]);
      return key === "reasons.jantouReasonSeparator" ? "+" : `<${key}>`;
    };

    fuReasonLabel(
      {
        reason: "么九牌明刻子",
        spec: { kind: "mentsu", yaochu: true, open: true, kantsu: false },
      },
      t,
    );
    expect(calls.at(-1)).toEqual([
      "reasons.mentsu",
      { yaochu: "yes", open: "yes", kantsu: "no" },
    ]);

    expect(
      fuReasonLabel(
        {
          reason: "雀頭(場風・自風)",
          spec: { kind: "jantou", reasons: ["bakaze", "jikaze"] },
        },
        t,
      ),
    ).toBe("<reasons.jantou>");
    expect(calls.at(-1)).toEqual([
      "reasons.jantou",
      {
        reasons:
          "<reasons.jantouReasons.bakaze>+<reasons.jantouReasons.jikaze>",
      },
    ]);

    fuReasonLabel(
      { reason: "嵌張待ち", spec: { kind: "machi", machi: "kanchan" } },
      t,
    );
    expect(calls.at(-1)).toEqual(["reasons.machi", { machi: "kanchan" }]);
  });
});
