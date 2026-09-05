/**
 * 練習カードの例示の検証
 *
 * @description
 * 例示は一覧の見た目を揃えるためのもので、1 枚でも欠けるとその練習だけ
 * 帯の無い低いカードになる。文言のキーは組み立てて引くため（`cardExample.*`）、
 * 欠けても描画時まで気付けない。どちらもここで突き合わせる。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

import {
  hasPracticeCardVisual,
  practiceCardVisual,
} from "../practice-card-visual";
import { listedPracticeMenus } from "../practice-catalog";

/** キーをそのまま返すスタブ（文言そのものは検証しない） */
const t = ((key: string) => key) as Parameters<typeof practiceCardVisual>[1];

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

    // MSPZ の書き損じは牌が減った手牌として静かに描画されるため枚数で見る
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
    for (const key of ["naki", "yakuName", "fuHan", "manganHan"] as const) {
      expect(Reflect.get(cardExample, key)).toBeTypeOf("string");
    }
  });
});
