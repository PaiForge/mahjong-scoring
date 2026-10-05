/**
 * `/lessons` 目次でのセクション並び順の健全性検証
 *
 * @description
 * page.tsx は `chaptersBySection()` の順でセクションを描画する。各セクション
 * 内は order 昇順で、すべての章がちょうど 1 つのセクションに入ることを検証する。
 */
import { describe, expect, it } from "vitest";

import { CURRICULUM, CURRICULUM_SECTIONS, chaptersBySection } from "./registry";

describe("section grouping", () => {
  it("creates a bucket for every CURRICULUM_SECTIONS entry (even empty ones)", () => {
    const grouped = chaptersBySection();
    for (const section of CURRICULUM_SECTIONS) {
      expect(grouped.has(section)).toBe(true);
    }
  });

  it("preserves CURRICULUM_SECTIONS order when iterating the Map", () => {
    const grouped = chaptersBySection();
    const iteratedSections = Array.from(grouped.keys());
    expect(iteratedSections).toEqual([...CURRICULUM_SECTIONS]);
  });

  it("places every chapter into exactly one section bucket", () => {
    const grouped = chaptersBySection();
    const allBucketed = Array.from(grouped.values()).flat();
    expect(allBucketed.length).toBe(CURRICULUM.length);

    const slugs = allBucketed.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("orders chapters within each section by ascending `order`", () => {
    const grouped = chaptersBySection();
    for (const [, chapters] of grouped) {
      for (let i = 1; i < chapters.length; i++) {
        expect(chapters[i]!.order).toBeGreaterThan(chapters[i - 1]!.order);
      }
    }
  });

  it('places the four mangan chapters in the "mangan" section by role', () => {
    // 役割ごと（子のロン → 子のツモ → 親のロン → 親のツモ）。和了方法ごとに
    // 戻すと、点数表早引きの土俵（親子で分かれる）が章の切れ目と合わなくなり、
    // 読んだ範囲だけを出す練習へ送れなくなる
    const grouped = chaptersBySection();
    const manganSlugs = grouped.get("mangan")?.map((c) => c.slug) ?? [];
    expect(manganSlugs).toEqual([
      "mangan-ko-ron",
      "mangan-ko-tsumo",
      "mangan-oya-ron",
      "mangan-oya-tsumo",
    ]);
  });

  it('places jantou-fu, mentsu-fu, machi-fu, tehai-fu in the "fu" section in that order', () => {
    const grouped = chaptersBySection();
    const fuSlugs = grouped.get("fu")?.map((c) => c.slug) ?? [];
    expect(fuSlugs).toEqual(["jantou-fu", "mentsu-fu", "machi-fu", "tehai-fu"]);
  });

  it('places about-this-app and why-scoring-is-complex in "foundation"', () => {
    const grouped = chaptersBySection();
    const foundationSlugs = grouped.get("foundation")?.map((c) => c.slug) ?? [];
    expect(foundationSlugs).toEqual([
      "about-this-app",
      "why-scoring-is-complex",
    ]);
  });

  it('places yaku in the "yaku" section', () => {
    const grouped = chaptersBySection();
    const yakuSlugs = grouped.get("yaku")?.map((c) => c.slug) ?? [];
    expect(yakuSlugs).toEqual(["yaku"]);
  });

  it('places the score-calculation chapters in the "score" section', () => {
    const grouped = chaptersBySection();
    const scoreSlugs = grouped.get("score")?.map((c) => c.slug) ?? [];
    expect(scoreSlugs).toEqual([
      "chiitoitsu-score",
      "pinfu-score",
      "menzen-mentsu-score",
      "furo-score",
    ]);
  });

  it('places the memorization chapters in the "memorization" section', () => {
    const grouped = chaptersBySection();
    const memorizationSlugs =
      grouped.get("memorization")?.map((c) => c.slug) ?? [];
    expect(memorizationSlugs).toEqual([
      "fu-doubling",
      "ron-to-tsumo",
      "tsumo-payments",
    ]);
  });
});
