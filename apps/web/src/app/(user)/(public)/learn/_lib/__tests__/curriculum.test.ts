import { describe, expect, it } from "vitest";

import {
  CURRICULUM,
  CURRICULUM_CHAPTER_SLUGS,
  CURRICULUM_SECTIONS,
  getAdjacentChapters,
  getChapterBySlug,
  getChapterI18nPath,
  isCurriculumChapterSlug,
  pickNextChapter,
} from "../curriculum";

describe("pickNextChapter", () => {
  it("returns the first chapter when nothing is read", () => {
    const result = pickNextChapter(new Set());
    expect(result?.slug).toBe("about-this-app");
  });

  it("skips read chapters and returns the next in order", () => {
    const result = pickNextChapter(new Set(["about-this-app"]));
    expect(result?.slug).toBe("why-scoring-is-complex");
  });

  it("returns the next unread chapter even if later chapters are read", () => {
    const result = pickNextChapter(
      new Set(["about-this-app", "jantou-fu", "yaku"]),
    );
    expect(result?.slug).toBe("why-scoring-is-complex");
  });

  it("returns undefined when all chapters are read", () => {
    const all = new Set<string>(CURRICULUM_CHAPTER_SLUGS);
    expect(pickNextChapter(all)).toBeUndefined();
  });

  it("ignores unknown slugs in readSlugs", () => {
    const result = pickNextChapter(new Set(["nonexistent-chapter"]));
    expect(result?.slug).toBe("about-this-app");
  });
});

describe("getAdjacentChapters", () => {
  it("returns undefined prev for the first chapter", () => {
    const { prev, next } = getAdjacentChapters("about-this-app");
    expect(prev).toBeUndefined();
    expect(next?.slug).toBe("why-scoring-is-complex");
  });

  it("returns undefined next for the last chapter", () => {
    const { prev, next } = getAdjacentChapters("tehai-fu");
    expect(prev?.slug).toBe("machi-fu");
    expect(next).toBeUndefined();
  });

  it("places yaku right after the mangan section and before fu", () => {
    const { prev, next } = getAdjacentChapters("yaku");
    expect(prev?.slug).toBe("mangan-oya-tsumo");
    expect(next?.slug).toBe("jantou-fu");
  });

  it("returns both prev and next for a middle chapter", () => {
    const { prev, next } = getAdjacentChapters("mentsu-fu");
    expect(prev?.slug).toBe("jantou-fu");
    expect(next?.slug).toBe("machi-fu");
  });
});

describe("isCurriculumChapterSlug", () => {
  it("returns true for valid slugs", () => {
    for (const slug of CURRICULUM_CHAPTER_SLUGS) {
      expect(isCurriculumChapterSlug(slug)).toBe(true);
    }
  });

  it("returns false for unknown strings", () => {
    expect(isCurriculumChapterSlug("unknown")).toBe(false);
    expect(isCurriculumChapterSlug("")).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isCurriculumChapterSlug(undefined)).toBe(false);
    expect(isCurriculumChapterSlug(123)).toBe(false);
    expect(isCurriculumChapterSlug({})).toBe(false);
    expect(isCurriculumChapterSlug(null)).toBe(false);
  });
});

describe("CURRICULUM", () => {
  it("has a chapter for every slug in CURRICULUM_CHAPTER_SLUGS", () => {
    const curriculumSlugs = CURRICULUM.map((c) => c.slug).sort();
    const masterSlugs = [...CURRICULUM_CHAPTER_SLUGS].sort();
    expect(curriculumSlugs).toEqual(masterSlugs);
  });

  it("has unique order values", () => {
    const orders = CURRICULUM.map((c) => c.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("has unique slugs across the entire curriculum", () => {
    const slugs = CURRICULUM.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique i18n keys across the entire curriculum", () => {
    const keys = CURRICULUM.map((c) => c.i18nKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is already ordered in ascending `order` (no manual sort needed)", () => {
    for (let i = 1; i < CURRICULUM.length; i++) {
      expect(CURRICULUM[i]!.order).toBeGreaterThan(CURRICULUM[i - 1]!.order);
    }
  });

  it("uses sections that are all members of CURRICULUM_SECTIONS", () => {
    const allowed = new Set<string>(CURRICULUM_SECTIONS);
    for (const chapter of CURRICULUM) {
      expect(allowed.has(chapter.section)).toBe(true);
    }
  });

  it("uses `/practice/` prefixed hrefs for every practice link", () => {
    for (const chapter of CURRICULUM) {
      for (const href of chapter.practiceHrefs ?? []) {
        expect(href.startsWith("/practice/")).toBe(true);
      }
    }
  });

  it("has practice hrefs with only lowercase kebab-case slugs after /practice/", () => {
    // 不正な文字を含む href が紛れ込むと CHECK 制約や i18n キー解決が失敗する
    // 先回り検知のための健全性テスト。
    // 出題条件のクエリ文字列（例: `?roles=ko&wins=ron&ranges=plus`）は許容する。
    const segmentPattern = /^\/practice\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\?[^#]*)?$/;
    for (const chapter of CURRICULUM) {
      for (const href of chapter.practiceHrefs ?? []) {
        expect(href).toMatch(segmentPattern);
      }
    }
  });

  it("uses only lowercase kebab-case slugs (matches DB CHECK constraint)", () => {
    // マイグレーション `add_chapter_slug_format_check.sql` と同じ形式
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const slug of CURRICULUM_CHAPTER_SLUGS) {
      expect(slug).toMatch(pattern);
    }
  });

  it("has non-empty positive `order` integers for every chapter", () => {
    for (const chapter of CURRICULUM) {
      expect(Number.isInteger(chapter.order)).toBe(true);
      expect(chapter.order).toBeGreaterThan(0);
    }
  });
});

describe("CURRICULUM_SECTIONS", () => {
  it("contains only unique values", () => {
    const sections = [...CURRICULUM_SECTIONS];
    expect(new Set(sections).size).toBe(sections.length);
  });
});

describe("pickNextChapter (additional edge cases)", () => {
  it("returns the first chapter for an empty Set (unauthenticated user)", () => {
    // Task 3(A): 未認証時は空 Set が渡される前提
    const result = pickNextChapter(new Set<string>());
    expect(result?.slug).toBe("about-this-app");
    expect(result?.order).toBe(CURRICULUM[0]!.order);
  });

  it("returns the correct next chapter when only a middle chapter is read", () => {
    // ギャップがあっても order 順で最初の未読を返すこと
    const result = pickNextChapter(new Set(["jantou-fu"]));
    expect(result?.slug).toBe("about-this-app");
  });

  it("returns undefined when every slug in CURRICULUM is marked read", () => {
    const all = new Set<string>(CURRICULUM.map((c) => c.slug));
    expect(pickNextChapter(all)).toBeUndefined();
  });

  it("handles a readSet that contains extra (removed-in-future) slugs without crashing", () => {
    // 過去に削除された slug が DB に残っていても既存 curriculum の順序に従う
    const result = pickNextChapter(
      new Set([
        "about-this-app",
        "legacy-removed-chapter",
        "why-scoring-is-complex",
      ]),
    );
    expect(result?.slug).toBe("mangan-ko-ron");
  });
});

describe("getAdjacentChapters (additional edge cases)", () => {
  it("returns undefined for both prev and next when slug is not in curriculum", () => {
    // @ts-expect-error: invalid slug at type level, but runtime must not crash.
    const { prev, next } = getAdjacentChapters("bogus-slug");
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });
});

describe("CURRICULUM definition order (CI 健全性テスト)", () => {
  // モジュール内部で CURRICULUM_SORTED_BY_ORDER を事前ソートキャッシュしているため、
  // 将来 CURRICULUM の定義順序が崩れた場合に「ソート依存コードがあった頃の順序と
  // 異なる結果を返す」リスクがある。CURRICULUM がソース上でも order 昇順で並んで
  // いることを CI で守る。
  it("CURRICULUM is defined in ascending order by `order`", () => {
    const orders = CURRICULUM.map((c) => c.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });
});

describe("getChapterBySlug", () => {
  it("returns the matching chapter for every slug in CURRICULUM", () => {
    for (const chapter of CURRICULUM) {
      expect(getChapterBySlug(chapter.slug)).toBe(chapter);
    }
  });

  it("returns the exact chapter object for known slugs", () => {
    const result = getChapterBySlug("jantou-fu");
    expect(result?.slug).toBe("jantou-fu");
    expect(result?.section).toBe("fu");
  });

  it("returns undefined for an unknown slug (runtime safety)", () => {
    // @ts-expect-error: invalid slug at type level, but runtime must not crash.
    expect(getChapterBySlug("not-a-real-chapter")).toBeUndefined();
  });
});

describe("getChapterI18nPath", () => {
  it('strips the "learnCurriculum." prefix', () => {
    const chapter = CURRICULUM.find((c) => c.slug === "about-this-app");
    expect(chapter).toBeDefined();
    expect(getChapterI18nPath(chapter!)).toBe("chapters.aboutThisApp");
  });

  it("returns the i18nKey as-is when the prefix is absent", () => {
    const chapter = {
      slug: "about-this-app",
      section: "foundation",
      order: 10,
      i18nKey: "chapters.aboutThisApp",
    } as const;
    expect(getChapterI18nPath(chapter)).toBe("chapters.aboutThisApp");
  });

  it('returns "chapters.<camelCase>" for every chapter in CURRICULUM', () => {
    for (const chapter of CURRICULUM) {
      const path = getChapterI18nPath(chapter);
      expect(path.startsWith("chapters.")).toBe(true);
      // camelCase 以外（ハイフン等）が混入していないこと
      expect(path).toMatch(/^chapters\.[a-zA-Z0-9]+$/);
    }
  });
});
