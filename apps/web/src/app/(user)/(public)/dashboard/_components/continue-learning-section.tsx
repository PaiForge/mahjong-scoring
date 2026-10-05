import { getTranslations } from "next-intl/server";

import { CurriculumProgressBar } from "@/app/(user)/(public)/lessons/_components/curriculum-progress-bar";
import { CurriculumToc } from "@/app/(user)/(public)/lessons/_components/curriculum-toc";
import { CurriculumTocLink } from "@/app/(user)/(public)/lessons/_components/curriculum-toc-link";
import {
  CURRICULUM,
  type CurriculumChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import { SectionTitle } from "@/app/(user)/_components/section-title";

interface ContinueLearningSectionProps {
  /** 完了したレッスン（章）のスラッグ */
  readonly completedSlugs: ReadonlySet<string>;
  /** 次に取り組むレッスン */
  readonly nextChapter: CurriculumChapter;
}

/**
 * ダッシュボードの「レッスンの続き」セクション。
 * レッスンの続き
 *
 * 進捗バーと「次はここから」のレッスン 1 件を `/lessons` と同じ見た目で表示し、
 * 再訪ユーザーが途中の位置へ 1 クリックで戻れるようにする。
 * 目次全体は `/lessons` の役目なので、ここでは次の 1 件だけに絞る。
 *
 * 出すのは黒帯への道を終えた（全級取得済みの）ユーザーだけ。行程が進行中は
 * 「次にやること」がレッスンを順に案内するので、別の「次はここ」を並べない。
 * すべて完了のときも次が無いので出さない。出す / 出さないの判断は親
 * （`selectDashboardGuidance`）が持つ。
 *
 * 昇級試験への導線はここには置かない。試験は黒帯への道の「認定される」の
 * 段として「次にやること」カードが順番どおりに出す。
 */
export async function ContinueLearningSection({
  completedSlugs,
  nextChapter,
}: ContinueLearningSectionProps) {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-4">
      <SectionTitle>{t("continueLearningTitle")}</SectionTitle>

      <CurriculumProgressBar
        completedCount={completedSlugs.size}
        totalCount={CURRICULUM.length}
        allCompleted={false}
      />

      <CurriculumToc
        section={nextChapter.section}
        chapters={[nextChapter]}
        completedSlugs={completedSlugs}
        nextSlug={nextChapter.slug}
      />

      <CurriculumTocLink />
    </div>
  );
}
