import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
} from "@mahjong-scoring/features/curriculum/registry";
import { SECTION_LABEL_WIDTH_CLASS } from "../_lib/toc-layout";
import { CurriculumProgressBarSkeleton } from "./curriculum-progress-bar-skeleton";
import { CurriculumTocSkeleton } from "./curriculum-toc-skeleton";

/**
 * 教本（目次）の読み込み中スケルトン
 * 目次ページスケルトン
 *
 * `/lessons` の実描画（`learn/page.tsx`）と同じ構造 — タイトル帯・進捗バー・
 * セクションごとの目次 — を描く。章の行数は `CURRICULUM` から
 * 数えるため、章を足しても自動で追従する。
 *
 * 汎用の `PageSkeleton` はリスト行を大きなカード矩形で表すため、2 段組みの
 * 目次行とは形も高さも一致しない。目次ページだけこちらを使う。
 */
export function LearnIndexSkeleton() {
  return (
    <ContentContainer>
      <PageTitlePlaceholder width="w-24" />

      <div className="space-y-8">
        <CurriculumProgressBarSkeleton />

        {CURRICULUM_SECTIONS.map((section) => {
          const chapterCount = CURRICULUM.filter(
            (chapter) => chapter.section === section,
          ).length;
          if (chapterCount === 0) return undefined;
          return (
            <CurriculumTocSkeleton
              key={section}
              chapterCount={chapterCount}
              labelWidthClassName={SECTION_LABEL_WIDTH_CLASS[section]}
            />
          );
        })}
      </div>
    </ContentContainer>
  );
}
