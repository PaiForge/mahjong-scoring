/**
 * `/learn` 目次でのセクション並び順の健全性検証
 *
 * @description
 * page.tsx では `CURRICULUM_SECTIONS.map(...)` の順でセクションを描画し、
 * 各セクション内は `CURRICULUM` を order 昇順でソートしてグルーピングする。
 * このテストでは、grouping の結果が仕様通りになることを純関数的に検証する。
 */
import { describe, expect, it } from 'vitest';

import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  type CurriculumChapter,
  type CurriculumSection,
} from '../curriculum';

/** page.tsx の grouping 実装を抽出した純関数版 */
function groupChaptersBySection(): Map<CurriculumSection, CurriculumChapter[]> {
  const sorted = [...CURRICULUM].sort((a, b) => a.order - b.order);
  const grouped = new Map<CurriculumSection, CurriculumChapter[]>();
  for (const section of CURRICULUM_SECTIONS) grouped.set(section, []);
  for (const chapter of sorted) {
    grouped.get(chapter.section)?.push(chapter);
  }
  return grouped;
}

describe('section grouping', () => {
  it('creates a bucket for every CURRICULUM_SECTIONS entry (even empty ones)', () => {
    const grouped = groupChaptersBySection();
    for (const section of CURRICULUM_SECTIONS) {
      expect(grouped.has(section)).toBe(true);
    }
  });

  it('preserves CURRICULUM_SECTIONS order when iterating the Map', () => {
    const grouped = groupChaptersBySection();
    const iteratedSections = Array.from(grouped.keys());
    expect(iteratedSections).toEqual([...CURRICULUM_SECTIONS]);
  });

  it('places every chapter into exactly one section bucket', () => {
    const grouped = groupChaptersBySection();
    const allBucketed = Array.from(grouped.values()).flat();
    expect(allBucketed.length).toBe(CURRICULUM.length);

    const slugs = allBucketed.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('orders chapters within each section by ascending `order`', () => {
    const grouped = groupChaptersBySection();
    for (const [, chapters] of grouped) {
      for (let i = 1; i < chapters.length; i++) {
        expect(chapters[i]!.order).toBeGreaterThan(chapters[i - 1]!.order);
      }
    }
  });

  it('places jantou-fu, mentsu-fu, machi-fu, tehai-fu in the "fu" section in that order', () => {
    const grouped = groupChaptersBySection();
    const fuSlugs = grouped.get('fu')?.map((c) => c.slug) ?? [];
    expect(fuSlugs).toEqual(['jantou-fu', 'mentsu-fu', 'machi-fu', 'tehai-fu']);
  });

  it('places about-this-app and why-scoring-is-complex in "foundation"', () => {
    const grouped = groupChaptersBySection();
    const foundationSlugs = grouped.get('foundation')?.map((c) => c.slug) ?? [];
    expect(foundationSlugs).toEqual(['about-this-app', 'why-scoring-is-complex']);
  });

  it('places yaku in the "yaku" section', () => {
    const grouped = groupChaptersBySection();
    const yakuSlugs = grouped.get('yaku')?.map((c) => c.slug) ?? [];
    expect(yakuSlugs).toEqual(['yaku']);
  });

  it('has an empty "score" section (no chapters assigned yet)', () => {
    const grouped = groupChaptersBySection();
    const scoreSlugs = grouped.get('score')?.map((c) => c.slug) ?? [];
    expect(scoreSlugs).toEqual([]);
  });
});
