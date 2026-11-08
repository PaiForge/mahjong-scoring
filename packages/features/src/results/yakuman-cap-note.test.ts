import { describe, expect, it } from "vitest";
import { createTranslator } from "use-intl";
import { messages } from "@mahjong-scoring/messages/ja";

import {
  buildYakumanCapNote,
  type YakuBreakdownTranslator,
} from "./yakuman-cap-note";

/** 日本語の辞書の `challenge.yakuBreakdown`（アプリと同じ ICU の解釈で引く） */
const translateJa = createTranslator({
  locale: "ja",
  messages: messages.challenge.yakuBreakdown,
});

/**
 * 文字列のキーで引く形に包んだもの（use-intl の翻訳関数はキーを辞書の型で絞るため、
 * features の関数の引数の型に直接は入らない）
 */
const tJa: YakuBreakdownTranslator = (key, values) =>
  String(Reflect.apply(translateJa, undefined, [key, values]));

describe("buildYakumanCapNote", () => {
  it("役満 1 つ分の支払いに翻が乗った手は「n翻 → 役満（13翻以上は役満）」（日本語の出力は従来どおり）", () => {
    expect(
      buildYakumanCapNote(
        [
          { name: "国士無双", han: 13 },
          { name: "立直", han: 1 },
        ],
        1,
        tJa,
      ),
    ).toBe("14翻 → 役満（13翻以上は役満）");
  });

  it("ダブル役満の支払いを超える手は「n翻 → ダブル役満」で、注記の括弧を付けない", () => {
    expect(
      buildYakumanCapNote(
        [
          { name: "大三元", han: 13 },
          { name: "字一色", han: 13 },
          { name: "ドラ", han: 4 },
        ],
        2,
        tJa,
      ),
    ).toBe("30翻 → ダブル役満");
  });

  it("数え役満（役満役なし）は役満 1 つ分に打ち止める", () => {
    expect(
      buildYakumanCapNote(
        [
          { name: "清一色", han: 6 },
          { name: "ドラ", han: 8 },
        ],
        0,
        tJa,
      ),
    ).toBe("14翻 → 役満（13翻以上は役満）");
  });

  it("内訳の合計が支払いを超えなければ注記を出さない", () => {
    expect(
      buildYakumanCapNote([{ name: "国士無双", han: 13 }], 1, tJa),
    ).toBeUndefined();
  });

  it("役満単位を持たない結果（点数表早引き）は注記を出さない", () => {
    expect(
      buildYakumanCapNote([{ name: "清一色", han: 20 }], undefined, tJa),
    ).toBeUndefined();
  });

  it("文型は cap / capWithNote に han・cap・note を渡して引く", () => {
    const calls: [string, Record<string, string | number> | undefined][] = [];
    const t: YakuBreakdownTranslator = (key, values) => {
      calls.push([key, values]);
      return `<${key}>`;
    };
    buildYakumanCapNote([{ name: "清一色", han: 14 }], 1, t);
    expect(calls.at(-1)).toEqual([
      "capWithNote",
      { han: "<han>", cap: "<yakuman>", note: "<cappedNote>" },
    ]);
    buildYakumanCapNote([{ name: "清一色", han: 27 }], 2, t);
    expect(calls.at(-1)).toEqual([
      "cap",
      { han: "<han>", cap: "<doubleYakuman>" },
    ]);
  });
});
