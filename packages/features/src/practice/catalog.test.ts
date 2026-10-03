import { describe, expect, it } from "vitest";

import { CURRICULUM, CURRICULUM_CHAPTER_SLUGS } from "../curriculum/registry";
import { PRACTICE_MENU_SLUGS, slugToMenuType } from "../practice-menu-types";
import { RANK_REGISTRY, rankRequiringMenu } from "../ranks/registry";
import { practiceHref, rankExamHref } from "../routes";
import {
  isExamMenu,
  PRACTICE_CATALOG,
  practiceMenuFromCatalog,
  listedPracticeMenus,
  relatedChaptersForPractice,
} from "./catalog";

describe("PRACTICE_CATALOG", () => {
  it("記録対象の練習をすべて載せている", () => {
    const cataloged = PRACTICE_CATALOG.map((menu) => menu.slug).sort();
    expect(cataloged).toEqual([...PRACTICE_MENU_SLUGS].sort());
  });

  it("slug が重複していない", () => {
    const slugs = PRACTICE_CATALOG.map((menu) => menu.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("一覧は昇級試験を除く全件を過不足なく覆う", () => {
    // 昇級試験は道場（/dojo）から入るため練習一覧のカードにしない。
    // それ以外が一覧から漏れると静かに消えるため固定する。
    const listed = listedPracticeMenus()
      .map((menu) => menu.slug)
      .sort();
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
    const slugs = listedPracticeMenus().map((menu) => menu.slug);
    expect(slugs).not.toContain("mangan-exam");
    expect(slugs).not.toContain("fu-exam");
    expect(slugs).not.toContain("chiitoitsu-exam");
    expect(slugs).not.toContain("pinfu-exam");
    expect(slugs).not.toContain("fu-score-exam");
  });

  it("前提章はカリキュラムに存在する章を指す", () => {
    for (const menu of PRACTICE_CATALOG) {
      if (menu.learnChapter === undefined) continue;
      expect(CURRICULUM_CHAPTER_SLUGS).toContain(menu.learnChapter);
    }
  });
});

describe("段級位との対応", () => {
  it("昇級試験の段級位は、その試験を要件に持つ級と一致する", () => {
    // 試験カードとカタログのピルが別々の級を名乗ると、道場から入った試験と
    // 一覧で見た試験が違うものに見える。正典は段級位レジストリの要件。
    for (const menu of PRACTICE_CATALOG) {
      if (!isExamMenu(menu.slug)) continue;
      const menuType = slugToMenuType(menu.slug);
      expect(menuType, `${menu.slug}`).toBeDefined();
      expect(rankRequiringMenu(menuType ?? "")?.rank.slug, `${menu.slug}`).toBe(
        menu.rank,
      );
    }
  });

  it("段級位を持つ練習の前提章は、その級の前提章に含まれる", () => {
    // 「4級の練習」と掲げたカードが 4級の受験に関係ない章へ送る、という
    // ずれを防ぐ。章を持たない練習（翻数即答など）は級だけで判断する。
    for (const menu of PRACTICE_CATALOG) {
      if (menu.rank === undefined || menu.learnChapter === undefined) continue;
      const rank = RANK_REGISTRY.find((entry) => entry.slug === menu.rank);
      expect(rank?.learnChapterSlugs, `${menu.slug}`).toContain(
        menu.learnChapter,
      );
    }
  });

  it("段級位ピルの行き先はその級の昇級試験", () => {
    // カードが「4級」と名乗る以上、押した先も 4級 の話をしていること。
    expect(rankExamHref("kyu-4")).toBe("/exam/fu");
    expect(rankExamHref("kyu-5")).toBe("/exam/mangan");
    expect(rankExamHref("kyu-3")).toBe("/exam/chiitoitsu");
    expect(rankExamHref("kyu-2")).toBe("/exam/pinfu");
    expect(rankExamHref("kyu-1")).toBe("/exam/fu-score");
  });

  it("段級位ピルの行き先は、その級を要件に持つ試験のカタログ上のパスと一致する", () => {
    // 試験の URL を直書きせずレジストリの要件から引いていることを固定する
    for (const menu of PRACTICE_CATALOG) {
      if (!isExamMenu(menu.slug) || menu.rank === undefined) continue;
      expect(rankExamHref(menu.rank), `${menu.slug}`).toBe(
        practiceHref(menu.slug),
      );
    }
  });
});

describe("章と練習の対応", () => {
  it("満貫の章は、その役割の点数が揃った章からだけ点数表早引きへ送る", () => {
    // 点数表早引きの土俵は親子で分かれ、和了方法では分かれない。ロンだけを
    // 読んだ時点で送るとツモの問題が出てしまうので、ツモの章まで読んで
    // その役割が揃ってから送る。章の並びは section-grouping.test.ts が守る
    const expected = {
      "mangan-ko-ron": undefined,
      "mangan-ko-tsumo": "ko_mangan_plus",
      "mangan-oya-ron": undefined,
      "mangan-oya-tsumo": "oya_mangan_plus",
    } as const;

    for (const [slug, variant] of Object.entries(expected)) {
      const links =
        CURRICULUM.find((chapter) => chapter.slug === slug)?.practiceLinks ??
        [];
      const scoreTableLinks = links.filter(
        (link) => link.slug === "score-table",
      );
      if (variant === undefined) {
        expect(links, slug).toEqual([]);
        continue;
      }
      expect(scoreTableLinks, slug).toHaveLength(1);
      expect(scoreTableLinks[0]?.variant, slug).toBe(variant);
    }
  });

  it("満貫以上点数計算は親の満貫が揃う章からだけ送る", () => {
    // 出題は親子・満貫以上の固定。子のツモまでしか読んでいない時点で
    // 送ると親の問題が出てしまう
    const sending = CURRICULUM.filter((chapter) =>
      (chapter.practiceLinks ?? []).some(
        (link) => link.slug === "mangan-score-calculation",
      ),
    ).map((chapter) => chapter.slug);
    expect(sending).toEqual(["mangan-oya-tsumo"]);
  });

  it("一覧に並ぶ練習はすべて関連する教本の章を持つ", () => {
    // 章から練習へ来た人が教本へ戻れること。章側の practiceLinks か
    // カタログの learnChapter か、どちらの宣言でもよい
    for (const menu of listedPracticeMenus()) {
      expect(
        relatedChaptersForPractice(menu.slug),
        `${menu.slug}`,
      ).not.toHaveLength(0);
    }
  });

  it("章の practiceLinks はカタログに載っている練習を指す", () => {
    for (const chapter of CURRICULUM) {
      for (const { slug } of chapter.practiceLinks ?? []) {
        // カタログ外の練習は一覧のカードもおすすめも持たないため、
        // 章からのリンクだけが孤立した導線になる
        expect(practiceMenuFromCatalog(slug), chapter.slug).toBeDefined();
      }
    }
  });

  it("章の practiceLinks と練習の learnChapter は互いの逆写像ではない", () => {
    // 逆写像だと思って一方から他方を導出すると壊れることを固定する。
    // 点数即答は前提章を持つが、その章の practiceLinks には挙がっていない
    // （出題範囲を絞れず、どの章から送っても読んだ範囲をはみ出すため）。
    const scoreCalculation = PRACTICE_CATALOG.find(
      (m) => m.slug === "score-calculation",
    );
    expect(scoreCalculation?.learnChapter).toBe("pinfu-score");
    const pinfuChapter = CURRICULUM.find((c) => c.slug === "pinfu-score");
    expect(pinfuChapter?.practiceLinks).toBeUndefined();

    // 逆に、役の翻数は役の章から勧められるが専用の章は持たない。
    const yakuHan = PRACTICE_CATALOG.find((m) => m.slug === "yaku-han");
    expect(yakuHan?.learnChapter).toBeUndefined();
    const yakuChapter = CURRICULUM.find((c) => c.slug === "yaku");
    expect(yakuChapter?.practiceLinks).toContainEqual({ slug: "yaku-han" });
  });
});

describe("practiceMenuFromCatalog", () => {
  it("slug からカタログの 1 件を引く", () => {
    expect(practiceMenuFromCatalog("mentsu-jantou-fu")).toMatchObject({
      slug: "mentsu-jantou-fu",
      category: "fuCalculation",
      rank: "kyu-4",
    });
  });
});
