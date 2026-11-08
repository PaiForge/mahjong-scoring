import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

import { practiceDisplayTitle } from "./practice-variant-label";

/** 日本語の辞書全体を引く翻訳関数（アプリと同じ ICU の解釈で引く） */
const translateJa = createTranslator({ locale: "ja", messages });

/**
 * 文字列のキーで引く形に包んだもの
 *
 * use-intl の翻訳関数はキーを辞書の型で絞るため、テンプレートリテラルで組んだ
 * キーを渡す features の関数の引数の型に直接は入らない。ここでは同じ関数を
 * 文字列のキーで呼ぶ。
 */
const tJa = (key: string, values?: Record<string, string>): string =>
  String(Reflect.apply(translateJa, undefined, [key, values]));

describe("practiceDisplayTitle", () => {
  it("設定を持つ練習はバリアント名を全角の括弧で添える（日本語の出力は従来どおり）", () => {
    expect(practiceDisplayTitle(tJa, "score-table", "ko_mangan_plus")).toBe(
      "点数表早引き（子・満貫以上）",
    );
  });

  it("バリアントを指定しなければ練習名だけ", () => {
    expect(practiceDisplayTitle(tJa, "score-table", undefined)).toBe(
      "点数表早引き",
    );
  });

  it("設定を持たない練習は既定のバリアントでも練習名だけ", () => {
    expect(practiceDisplayTitle(tJa, "jantou-fu", "default")).toBe(
      "雀頭の符計算",
    );
  });

  it("括弧の文型は practice.titleWithVariant に title と variant を渡して引く", () => {
    const calls: [string, Record<string, string> | undefined][] = [];
    const t = (key: string, values?: Record<string, string>): string => {
      calls.push([key, values]);
      return `<${key}>`;
    };
    expect(practiceDisplayTitle(t, "score-table", "all")).toBe(
      "<practice.titleWithVariant>",
    );
    expect(calls.at(-1)).toEqual([
      "practice.titleWithVariant",
      {
        title: "<practice.practices.scoreTable.title>",
        variant: "<scoreTableChallenge.variants.all.label>",
      },
    ]);
  });
});
