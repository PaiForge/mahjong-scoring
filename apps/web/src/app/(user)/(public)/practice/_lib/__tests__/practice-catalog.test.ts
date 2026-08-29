import { describe, expect, it } from "vitest";

import messages from "@/messages/ja.json";
import {
  CURRICULUM,
  CURRICULUM_CHAPTER_SLUGS,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { PRACTICE_MENU_SLUGS } from "@/lib/db/practice-menu-types";
import {
  isExamMenu,
  PRACTICE_CATALOG,
  PRACTICE_CATEGORIES,
  practiceDescriptionKey,
  practiceHref,
  practiceMenuFromCatalog,
  practiceMenusByCategory,
  practiceSlugFromHref,
  practiceTitleKey,
} from "../practice-catalog";

describe("PRACTICE_CATALOG", () => {
  it("記録対象の練習をすべて載せている", () => {
    const cataloged = PRACTICE_CATALOG.map((menu) => menu.slug).sort();
    expect(cataloged).toEqual([...PRACTICE_MENU_SLUGS].sort());
  });

  it("slug が重複していない", () => {
    const slugs = PRACTICE_CATALOG.map((menu) => menu.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("カテゴリ別の一覧は昇級試験を除く全件を過不足なく覆う", () => {
    // 昇級試験は道場（/dojo）から入るため練習一覧のカードにしない。
    // それ以外がカテゴリの表示から漏れると一覧から静かに消えるため固定する。
    const listed = PRACTICE_CATEGORIES.flatMap((category) =>
      practiceMenusByCategory(category).map((menu) => menu.slug),
    ).sort();
    const expected = PRACTICE_CATALOG.map((menu) => menu.slug)
      .filter((slug) => !isExamMenu(slug))
      .sort();
    expect(listed).toEqual(expected);
  });

  it("昇級試験は learnChapter を持たない（前提章は段級位レジストリが正典）", () => {
    // カタログにも 1 章だけ持たせると、説明ページが「前提となる教本の章」に
    // ランクの前提章の一部しか出さない状態に戻る（役の章だけが出て、
    // 満貫セクションの 4 章が落ちる）。二重の出どころを作らないよう固定する。
    for (const menu of PRACTICE_CATALOG) {
      if (!isExamMenu(menu.slug)) continue;
      expect(menu.learnChapter, `${menu.slug}`).toBeUndefined();
    }
  });

  it("昇級試験は /exam 配下に住み、練習一覧のカードにならない", () => {
    expect(isExamMenu("mangan-exam")).toBe(true);
    expect(isExamMenu("jantou-fu")).toBe(false);
    for (const category of PRACTICE_CATEGORIES) {
      const slugs = practiceMenusByCategory(category).map((menu) => menu.slug);
      expect(slugs).not.toContain("mangan-exam");
    }
  });

  it("前提章はカリキュラムに存在する章を指す", () => {
    for (const menu of PRACTICE_CATALOG) {
      if (menu.learnChapter === undefined) continue;
      expect(CURRICULUM_CHAPTER_SLUGS).toContain(menu.learnChapter);
    }
  });
});

describe("章と練習の対応", () => {
  it("章の practiceHrefs はカタログに載っている練習を指す", () => {
    for (const chapter of CURRICULUM) {
      for (const href of chapter.practiceHrefs ?? []) {
        // 解決できない href は「おすすめの練習」から黙って消えるため、
        // 章側のタイポやカタログからの削除をここで検出する
        expect(practiceSlugFromHref(href)).toBeDefined();
      }
    }
  });

  it("章の practiceHrefs と練習の learnChapter は互いの逆写像ではない", () => {
    // 逆写像だと思って一方から他方を導出すると壊れることを固定する。
    // 手牌の合計符は前提章を持つが、その章の practiceHrefs には挙がっていない。
    const totalFu = PRACTICE_CATALOG.find((m) => m.slug === "total-fu");
    expect(totalFu?.learnChapter).toBe("tehai-fu");
    const tehaiFuChapter = CURRICULUM.find((c) => c.slug === "tehai-fu");
    expect(tehaiFuChapter?.practiceHrefs).not.toContain("/practice/total-fu");

    // 逆に、役の翻数は役の章から勧められるが専用の章は持たない。
    const yakuHan = PRACTICE_CATALOG.find((m) => m.slug === "yaku-han");
    expect(yakuHan?.learnChapter).toBeUndefined();
    const yakuChapter = CURRICULUM.find((c) => c.slug === "yaku");
    expect(yakuChapter?.practiceHrefs).toContain("/practice/yaku-han");
  });
});

describe("i18n キーの導出", () => {
  it("全練習の名前と説明が辞書に存在する", () => {
    const practices: Record<string, { title: string; description: string }> =
      messages.practice.practices;
    for (const menu of PRACTICE_CATALOG) {
      const titleKey = practiceTitleKey(menu.slug);
      const descriptionKey = practiceDescriptionKey(menu.slug);
      // "practices.<messageKey>.title" の messageKey 部分を取り出して引く
      const messageKey = titleKey.split(".")[1] ?? "";
      expect(practices[messageKey]?.title).toBeTruthy();
      expect(practices[messageKey]?.description).toBeTruthy();
      expect(descriptionKey).toBe(`practices.${messageKey}.description`);
    }
  });
});

describe("practiceHref", () => {
  it("slug から練習ページのパスを作る", () => {
    expect(practiceHref("jantou-fu")).toBe("/practice/jantou-fu");
  });
});

describe("practiceSlugFromHref", () => {
  it("練習ページのパスから slug を取り出す", () => {
    expect(practiceSlugFromHref("/practice/jantou-fu")).toBe("jantou-fu");
  });

  it("クエリ付きでも slug を取り出す（教本の practiceHrefs 用）", () => {
    expect(
      practiceSlugFromHref("/practice/score-table?roles=ko&wins=ron"),
    ).toBe("score-table");
  });

  it("末尾スラッシュとハッシュを許容する", () => {
    expect(practiceSlugFromHref("/practice/yaku/")).toBe("yaku");
    expect(practiceSlugFromHref("/practice/yaku#top")).toBe("yaku");
  });

  it("登録されていない練習は undefined", () => {
    // /practice/score は記録対象外でレジストリに載らない
    expect(practiceSlugFromHref("/practice/score")).toBeUndefined();
    expect(practiceSlugFromHref("/practice/unknown")).toBeUndefined();
  });

  it("練習ページ以外は undefined", () => {
    expect(practiceSlugFromHref("/learn/jantou-fu")).toBeUndefined();
    expect(practiceSlugFromHref("/practice/jantou-fu/play")).toBeUndefined();
    expect(practiceSlugFromHref("")).toBeUndefined();
  });
});

describe("practiceMenuFromCatalog", () => {
  it("slug からカタログの 1 件を引く", () => {
    expect(practiceMenuFromCatalog("mentsu-jantou-fu")).toMatchObject({
      slug: "mentsu-jantou-fu",
      category: "fuCalculation",
      difficulty: "advanced",
    });
  });
});
