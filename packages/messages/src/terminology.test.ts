import { describe, expect, it } from "vitest";

import { messages as en } from "./en";
import { messages as ja } from "./ja";
import { TERMINOLOGY } from "./terminology";

/** 辞書の値（入れ子を含む）を `名前空間.キー` と値の組で取り出す */
function entries(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    entries(child, path === "" ? key : `${path}.${key}`),
  );
}

/** 日本語の用語から訳語表の行を引く */
function termOf(japanese: string): string {
  const entry = TERMINOLOGY.find((term) =>
    term.ja.some((word) => word === japanese),
  );
  if (entry === undefined) throw new Error(`訳語表に無い用語: ${japanese}`);
  return entry.en;
}

describe("訳語表", () => {
  it("同じ日本語の用語を 2 つの訳語に割り当てない", () => {
    const words = TERMINOLOGY.flatMap((term) => term.ja);
    const duplicated = words.filter(
      (word, index) => words.indexOf(word) !== index,
    );
    expect(duplicated).toEqual([]);
  });

  it("英語の辞書に使わない訳語が現れない", () => {
    // 例: 親子を parent / child、翻を fan と訳す。「セッション」は UI に出さない内部の概念。
    // 認証の「セッションが切れました」（ログイン状態という別の概念）を訳すときは、
    // その文言だけを例外として明示する
    const values = entries(en, "");
    const offending = TERMINOLOGY.flatMap((term) =>
      ("avoid" in term ? term.avoid : []).flatMap((word) => {
        const pattern = new RegExp(`\\b${word}\\b`, "i");
        return values
          .filter(([, value]) => pattern.test(value))
          .map(([key]) => `${key}: ${word}`);
      }),
    );
    expect(offending).toEqual([]);
  });
});

describe("完訳の辞書が訳語表に従う", () => {
  it("点数表の打点の区分名は訳語表の表記（先頭だけ大文字）", () => {
    const tiers = [
      ["mangan", "満貫"],
      ["haneman", "跳満"],
      ["baiman", "倍満"],
      ["sanbaiman", "三倍満"],
      ["yakuman", "役満"],
    ] as const;
    for (const [key, japanese] of tiers) {
      expect(ja.scoreTable[key]).toBe(japanese);
      expect(en.scoreTable[key].toLowerCase()).toBe(termOf(japanese));
    }
  });

  it("親子は dealer / non-dealer で、点数表と共通の語で同じ訳にする", () => {
    // 点数表の切り替え（scoreTable.oya / ko）と答え合わせ等の表記（common.dealer /
    // nonDealer）が日本語で同じ語なら、英語でも同じ語にする。入れ替わると
    // 親の点数を子の点数として読ませてしまう
    expect(ja.scoreTable.oya).toBe(ja.common.dealer);
    expect(ja.scoreTable.ko).toBe(ja.common.nonDealer);
    expect(en.scoreTable.oya).toBe(en.common.dealer);
    expect(en.scoreTable.ko).toBe(en.common.nonDealer);
    expect(en.scoreTable.oya.toLowerCase()).toBe(termOf("親"));
    expect(en.scoreTable.ko.toLowerCase()).toBe(termOf("子"));
  });

  it("ロン / ツモは ron / tsumo で、点数表と共通の語で同じ訳にする", () => {
    expect(ja.scoreTable.ron).toBe(ja.common.ron);
    expect(ja.scoreTable.tsumo).toBe(ja.common.tsumo);
    expect(en.scoreTable.ron).toBe(en.common.ron);
    expect(en.scoreTable.tsumo).toBe(en.common.tsumo);
    expect(en.scoreTable.ron.toLowerCase()).toBe(termOf("ロン"));
    expect(en.scoreTable.tsumo.toLowerCase()).toBe(termOf("ツモ"));
  });

  it("翻・符の接尾辞は han / fu（数で形を変えない）", () => {
    expect(en.scoreTable.hanSuffix.trim()).toBe(termOf("翻"));
    expect(en.scoreTable.fuSuffix.trim()).toBe(termOf("符"));
  });
});
