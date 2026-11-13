import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

import { boardLabel } from "../my-record/board-label";
import { leaderboardBoardLabel } from "./board-label";

/** キーをそのまま返す翻訳関数 */
const t = (key: string): string => key;

/** 日本語の辞書全体を引く翻訳関数（アプリと同じ ICU の解釈で引く） */
const translateJa = createTranslator({ locale: "ja", messages });

/**
 * 文字列のキーで引く形に包んだもの（use-intl の翻訳関数はキーを辞書の型で絞るため、
 * 組み立てたキーを渡す features の関数の引数の型に直接は入らない）
 */
const tJa = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
): string => String(Reflect.apply(translateJa, undefined, [key, values]));

describe("boardLabel", () => {
  it("設定を持つ練習は短い名にバリアント名を全角の括弧で添える（日本語の出力は従来どおり）", () => {
    expect(
      boardLabel({ menuType: "score_table", variant: "ko_non_mangan" }, tJa),
    ).toBe("点数表早引き（子・満貫未満）");
  });

  it("設定を持たない練習は短い名だけ", () => {
    expect(boardLabel({ menuType: "jantou_fu", variant: "default" }, tJa)).toBe(
      "雀頭の符",
    );
  });

  it("括弧の文型は practice.titleWithVariant に title と variant を渡して引く", () => {
    const calls: [
      string,
      Readonly<Record<string, string | number>> | undefined,
    ][] = [];
    const tSpy = (
      key: string,
      values?: Readonly<Record<string, string | number>>,
    ): string => {
      calls.push([key, values]);
      return `<${key}>`;
    };
    boardLabel({ menuType: "score_table", variant: "all" }, tSpy);
    expect(calls.at(-1)).toEqual([
      "practice.titleWithVariant",
      {
        title: "<practice.practices.scoreTable.shortTitle>",
        variant: "<scoreTableChallenge.variants.all.label>",
      },
    ]);
  });
});

describe("leaderboardBoardLabel", () => {
  it("出題範囲を選べる練習でも、土俵が 1 つなら範囲名を添えない", () => {
    expect(
      leaderboardBoardLabel({ menuType: "score_table", variant: "all" }, t),
    ).toBe("practice.practices.scoreTable.shortTitle");
  });

  it("設定を持たない練習は短い名だけ", () => {
    expect(
      leaderboardBoardLabel({ menuType: "jantou_fu", variant: "default" }, t),
    ).toBe("practice.practices.jantouFu.shortTitle");
  });
});
