/**
 * 練習カードの例示の検証
 *
 * @description
 * 例示は一覧の見た目を揃えるためのもので、1 枚でも欠けるとその練習だけ
 * 帯の無い低いカードになる。文言のキーは組み立てて引くため（`cardExample.*`）、
 * 欠けても描画時まで気付けない。どちらもここで突き合わせる。
 */
import { describe, expect, it } from "vitest";

import { messages as messagesJson } from "@mahjong-scoring/messages/ja";

import { hasPracticeCardVisual, practiceCardVisual } from "./card-visual";
import { listedPracticeMenus } from "@mahjong-scoring/features/practice/catalog";
import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";

/** キーをそのまま返すスタブ（文言そのものは検証しない） */
const t = (key: string) => key;

/**
 * `practice` 名前空間の辞書を引く翻訳関数。キーが辞書の文字列に行き着かなければ投げる
 * （組み立てたキーの書き損じを、描画時ではなくここで落とすため）
 */
function dictionaryT(key: string): string {
  let node: unknown = messagesJson.practice;
  for (const segment of key.split(".")) {
    node =
      typeof node === "object" && node !== null
        ? Reflect.get(node, segment)
        : undefined;
  }
  if (typeof node !== "string") {
    throw new Error(`practice.${key} は辞書に無い`);
  }
  return node;
}

describe("練習カードの例示", () => {
  it("一覧に並ぶ練習はすべて例示を持つ", () => {
    const missing = listedPracticeMenus()
      .map((menu) => menu.slug)
      .filter((slug) => !hasPracticeCardVisual(slug));

    expect(missing).toEqual([]);
  });

  it("手牌の例示は 14 枚に解ける", () => {
    const hands = listedPracticeMenus()
      .map((menu) => practiceCardVisual(menu.slug, t)?.subject)
      .filter((subject) => subject?.kind === "hand");

    // MPSZ の書き損じは牌が減った手牌として静かに描画されるため枚数で見る
    expect(hands.length).toBeGreaterThan(0);
    for (const hand of hands) {
      expect(hand.tiles).toHaveLength(14);
    }
  });

  it("例示が引く文言のキーが辞書にある", () => {
    const { cardExample } = messagesJson.practice;

    for (const unit of ["fu", "han", "score", "yaku"] as const) {
      expect(cardExample.units[unit]).toBeTypeOf("string");
    }
    for (const key of ["naki", "yakuName", "manganHan"] as const) {
      expect(Reflect.get(cardExample, key)).toBeTypeOf("string");
    }
    expect(cardExample.fuHanExample.fu).toBeTypeOf("string");
    expect(cardExample.fuHanExample.han).toBeTypeOf("string");
  });

  it("一覧に並ぶ練習の例示は、引く文言がすべて辞書の文字列に解ける", () => {
    for (const { slug } of listedPracticeMenus()) {
      const visual = practiceCardVisual(slug, dictionaryT);
      expect(visual?.unitLabel, slug).toBeTypeOf("string");
      const subject = visual?.subject;
      if (subject?.kind === "labels") {
        expect(subject.text, slug).toBeTypeOf("string");
      }
      if (subject?.kind === "fuHan") {
        expect([subject.fu, subject.han], slug).toEqual([
          expect.any(String),
          expect.any(String),
        ]);
      }
    }
  });

  it("答えの単位は練習ごとの単位の文言を引く", () => {
    const { units } = messagesJson.practice.cardExample;
    expect(practiceCardVisual("jantou-fu", dictionaryT)?.unitLabel).toBe(
      units.fu,
    );
    expect(practiceCardVisual("yaku", dictionaryT)?.unitLabel).toBe(units.yaku);
  });

  it("出題が先に示す値（満貫以上の翻数）は単位に添え、持たない練習は添えない", () => {
    const { cardExample } = messagesJson.practice;
    expect(
      practiceCardVisual("mangan-score-calculation", dictionaryT)?.note,
    ).toBe(cardExample.manganHan);
    expect(practiceCardVisual("score-calculation", dictionaryT)?.note).toBe(
      undefined,
    );
  });

  it("文言だけの出題（役の翻数）は、状態のピルと役名の文言を引く", () => {
    const { cardExample } = messagesJson.practice;
    expect(practiceCardVisual("yaku-han", dictionaryT)?.subject).toEqual({
      kind: "labels",
      pill: cardExample.naki,
      text: cardExample.yakuName,
    });
  });

  it("符と翻だけの出題（点数表早引き）は、符と翻の例の文言を引く", () => {
    const { fuHanExample } = messagesJson.practice.cardExample;
    expect(practiceCardVisual("score-table", dictionaryT)?.subject).toEqual({
      kind: "fuHan",
      fu: fuHanExample.fu,
      han: fuHanExample.han,
    });
  });

  it("牌の例示は空でない牌のまとまりを並べる", () => {
    for (const { slug } of listedPracticeMenus()) {
      const subject = practiceCardVisual(slug, t)?.subject;
      if (subject?.kind !== "tiles") continue;
      expect(subject.groups.length, slug).toBeGreaterThan(0);
      for (const group of subject.groups) {
        expect(group.length, slug).toBeGreaterThan(0);
      }
    }
  });

  it("一覧のカードにならない練習（昇級試験）は例示を持たない", () => {
    const listed = new Set(listedPracticeMenus().map((menu) => menu.slug));
    const unlisted = PRACTICE_MENU_SLUGS.filter((slug) => !listed.has(slug));
    expect(unlisted.length).toBeGreaterThan(0);
    for (const slug of unlisted) {
      expect(hasPracticeCardVisual(slug), slug).toBe(false);
      expect(practiceCardVisual(slug, t), slug).toBeUndefined();
    }
  });
});
