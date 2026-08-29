import {
  CURRICULUM_SECTIONS,
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";
import { CurriculumToc } from "./curriculum-toc";

interface ChapterTocListProps {
  /** 表示する章（カリキュラムの表示順で渡す） */
  readonly slugs: readonly CurriculumChapterSlug[];
  /** 読了済み章。読了チェックを出さない場面では空集合を渡す */
  readonly readSlugs: ReadonlySet<string>;
}

/**
 * 章スラッグの並びをセクションごとの目次として描く
 * 章目次リスト
 *
 * Server Component。カリキュラム全体ではなく「選んだ章だけ」を目次の書式で
 * 見せたい場面（道場の前提章・昇級試験ページの前提章）で使う。セクションを
 * またぐ章の集合を渡しても、`/learn` と同じセクション見出し付きの並びになる。
 *
 * 「次はここから」バッジは出さない（`nextSlug` を渡さない）。読む順の案内は
 * 教本の目次が持つ役割で、抜粋の側が別の順序を主張すると二重になる。
 */
export async function ChapterTocList({
  slugs,
  readSlugs,
}: ChapterTocListProps) {
  const chapters = slugs
    .map(getChapterBySlug)
    .filter((chapter) => chapter !== undefined);

  return (
    <div className="space-y-6">
      {CURRICULUM_SECTIONS.map((section) => {
        const sectionChapters = chapters.filter(
          (chapter) => chapter.section === section,
        );
        if (sectionChapters.length === 0) return undefined;

        return (
          <CurriculumToc
            key={section}
            section={section}
            chapters={sectionChapters}
            readSlugs={readSlugs}
            nextSlug={undefined}
          />
        );
      })}
    </div>
  );
}
