import { describe, expect, it } from "vitest";

import {
  CURRICULUM_CHAPTER_SLUGS,
  CURRICULUM_SECTIONS,
  getChapterBySlug,
  chaptersInSection,
  chaptersLinkingToPractice,
  relatedChaptersForPractice,
  type CurriculumChapterSlug,
} from "../curriculum";
import { practiceMenuFromCatalog } from "../../../practice/_lib/practice-catalog";

/** カリキュラムの表示順に並んでいるか */
function isCurriculumOrder(slugs: readonly CurriculumChapterSlug[]): boolean {
  const indexOf = (slug: CurriculumChapterSlug) =>
    CURRICULUM_CHAPTER_SLUGS.indexOf(slug);
  return slugs.every(
    (slug, i) => i === 0 || indexOf(slugs[i - 1]!) < indexOf(slug),
  );
}

describe("chaptersLinkingToPractice", () => {
  it("その練習へ送っている章をカリキュラムの順で返す", () => {
    expect(chaptersLinkingToPractice("jantou-fu")).toEqual(["jantou-fu"]);
    expect(chaptersLinkingToPractice("yaku-han")).toEqual(["yaku"]);
  });

  it("バリアント違いの href を練習単位に畳む", () => {
    // 点数表早引きは5つの章がそれぞれ別のバリアントで送るが、戻る先は
    // どれも「その章」なので章は重複せず、クエリの違いでも分かれない
    const chapters = chaptersLinkingToPractice("score-table");
    expect(chapters).toEqual([
      "mangan-ko-tsumo",
      "mangan-oya-tsumo",
      "fu-doubling",
      "ron-to-tsumo",
      "tsumo-payments",
    ]);
    expect(new Set(chapters).size).toBe(chapters.length);
  });

  it("どの章からも送られていない練習は空", () => {
    // 昇級試験は章の practiceHrefs ではなく examSlug で指される
    expect(chaptersLinkingToPractice("fu-exam")).toEqual([]);
  });
});

describe("relatedChaptersForPractice", () => {
  it("カタログの前提章と逆引きの章を畳む", () => {
    // 手牌の合計符はカタログ側だけが章を宣言する（章の練習リンクには
    // 挙がらない）。逆に役の翻数は章側だけが宣言する
    expect(practiceMenuFromCatalog("total-fu")?.learnChapter).toBe("tehai-fu");
    expect(relatedChaptersForPractice("total-fu")).toContain("tehai-fu");

    expect(practiceMenuFromCatalog("yaku-han")?.learnChapter).toBeUndefined();
    expect(relatedChaptersForPractice("yaku-han")).toEqual(["yaku"]);
  });

  it("両側が同じ章を宣言していても重複しない", () => {
    expect(practiceMenuFromCatalog("jantou-fu")?.learnChapter).toBe(
      "jantou-fu",
    );
    expect(chaptersLinkingToPractice("jantou-fu")).toEqual(["jantou-fu"]);
    expect(relatedChaptersForPractice("jantou-fu")).toEqual(["jantou-fu"]);
  });

  it("カリキュラムの表示順に並ぶ", () => {
    expect(isCurriculumOrder(relatedChaptersForPractice("score-table"))).toBe(
      true,
    );
  });
});

describe("chaptersInSection", () => {
  it("セクションの章をカリキュラムの順で返す", () => {
    // 総合演習（/practice/score）の戻り先。点数の計算セクションの各章が
    // 本文の CTA でこの練習へ送っている
    expect(chaptersInSection("score")).toEqual([
      "chiitoitsu-score",
      "pinfu-score",
      "menzen-mentsu-score",
      "furo-score",
    ]);
  });

  it("返すのはそのセクションの章だけ", () => {
    for (const section of CURRICULUM_SECTIONS) {
      for (const slug of chaptersInSection(section)) {
        expect(getChapterBySlug(slug)?.section, slug).toBe(section);
      }
    }
  });

  it("全セクションを合わせるとカリキュラム全体になる", () => {
    const all = CURRICULUM_SECTIONS.flatMap(chaptersInSection);
    expect(new Set(all)).toEqual(new Set(CURRICULUM_CHAPTER_SLUGS));
  });
});
