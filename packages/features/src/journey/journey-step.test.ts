import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

import { journeyStepHref, journeyStepTitle } from "./journey-step";

/** 日本語の辞書全体を引く翻訳関数（アプリと同じ ICU の解釈で引く） */
const translateJa = createTranslator({ locale: "ja", messages });

/**
 * 文字列のキーで引く形に包んだもの
 *
 * use-intl の翻訳関数はキーを辞書の型で絞るため、テンプレートリテラルで組んだ
 * キーを渡す features の関数の引数の型に直接は入らない。ここでは同じ関数を
 * 文字列のキーで呼ぶ。
 */
const tJa = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
): string => String(Reflect.apply(translateJa, undefined, [key, values]));

describe("journeyStepHref", () => {
  it("学ぶ段の一歩はレッスンのページへ送る", () => {
    expect(journeyStepHref({ kind: "lesson", chapterSlug: "jantou-fu" })).toBe(
      "/lessons/jantou-fu",
    );
  });

  it("練習の一歩はバリアントを URL に載せて説明ページへ送る", () => {
    expect(
      journeyStepHref({ kind: "practice", slug: "total-fu", variant: "all" }),
    ).toBe("/practice/total-fu?variant=all");
  });

  it("バリアントを持たない練習の一歩は説明ページそのものへ送る", () => {
    expect(
      journeyStepHref({
        kind: "practice",
        slug: "jantou-fu",
        variant: undefined,
      }),
    ).toBe("/practice/jantou-fu");
  });

  it("試験の一歩は試験の URL 名前空間の説明ページへ送る", () => {
    expect(journeyStepHref({ kind: "exam", slug: "mangan-exam" })).toBe(
      "/exam/mangan",
    );
  });
});

describe("journeyStepTitle", () => {
  it("レッスンの一歩は目次と同じ章の見出しで呼ぶ", () => {
    expect(
      journeyStepTitle({ kind: "lesson", chapterSlug: "jantou-fu" }, tJa),
    ).toBe(messages.learnCurriculum.chapters.jantouFu.title);
  });

  it("バリアント付きの練習の一歩は練習名にバリアント名を添える", () => {
    expect(
      journeyStepTitle(
        { kind: "practice", slug: "total-fu", variant: "up_to_40" },
        tJa,
      ),
    ).toBe("手牌の合計符（40符まで）");
  });

  it("級の試験の一歩は「<級> 昇級試験」と呼ぶ", () => {
    expect(journeyStepTitle({ kind: "exam", slug: "mangan-exam" }, tJa)).toBe(
      "5級 昇級試験",
    );
  });

  it("段の試験の一歩は「<段> 昇段試験」と呼ぶ", () => {
    expect(journeyStepTitle({ kind: "exam", slug: "score-exam" }, tJa)).toBe(
      "初段 昇段試験",
    );
  });

  it("どの段級位の試験でもない練習を試験として渡すと名前を出さない", () => {
    expect(journeyStepTitle({ kind: "exam", slug: "jantou-fu" }, tJa)).toBe("");
  });
});
