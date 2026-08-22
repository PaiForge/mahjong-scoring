import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { CurriculumProgressBar } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar";
import { CurriculumToc } from "@/app/(user)/(public)/learn/_components/curriculum-toc";
import {
  CURRICULUM,
  type CurriculumChapter,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface ContinueLearningSectionProps {
  /** 読了済み章のスラッグ */
  readonly readSlugs: ReadonlySet<string>;
  /** 次に読む章 */
  readonly nextChapter: CurriculumChapter;
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

      <div className="text-right">
        <Link
          href="/learn"
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("viewAllChapters")}
        </Link>
      </div>
    </div>
  );
}
