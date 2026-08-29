import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { CurriculumProgressBar } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar";
import { CurriculumToc } from "@/app/(user)/(public)/learn/_components/curriculum-toc";
import { CurriculumTocLink } from "@/app/(user)/(public)/learn/_components/curriculum-toc-link";
import {
  CURRICULUM,
  type CurriculumChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { SectionTitle } from "@/app/(user)/_components/section-title";

interface ContinueLearningSectionProps {
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 次に読む章 */
  readonly nextChapter: CurriculumChapter;
  /**
   * セクションの末尾に添える行リンク（受験できる昇級試験など）。
   *
   * 本題（読みかけの位置 → 目次へ）を最後まで通したあとに置く。教本を
   * 読み進めた先にある行き先なのでこのセクションに同居させるが、
   * 章と目次の間に割り込ませない。ランクを知らないままにするため
   * スロットで受ける。
   */
  readonly trailingRow?: ReactNode;
}

/**
 * ダッシュボードの「教本の続き」セクション。
 * 教本の続き
 *
 * 進捗バーと「次はここから」の章 1 件を `/learn` と同じ見た目で表示し、
 * 再訪ユーザーが読みかけの位置へ 1 クリックで戻れるようにする。
 * 目次全体は `/learn` の役目なので、ここでは次の 1 章だけに絞る。
 *
 * 全章読了済みのときは次の章が無いのでこのセクション自体を出さない。
 * 出す / 出さないの判断は親（`selectDashboardGuidance`）が持つ。
 */
export async function ContinueLearningSection({
  readSlugs,
  nextChapter,
  trailingRow,
}: ContinueLearningSectionProps) {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-4">
      <SectionTitle>{t("continueLearningTitle")}</SectionTitle>

      <CurriculumProgressBar
        readCount={readSlugs.size}
        totalCount={CURRICULUM.length}
        allCompleted={false}
      />

      <CurriculumToc
        section={nextChapter.section}
        chapters={[nextChapter]}
        readSlugs={readSlugs}
        nextSlug={nextChapter.slug}
      />

      <CurriculumTocLink />

      {trailingRow}
    </div>
  );
}
