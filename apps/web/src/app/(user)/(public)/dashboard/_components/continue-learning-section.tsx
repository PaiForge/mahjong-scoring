import { getTranslations } from "next-intl/server";

import { CurriculumProgressBar } from "@/app/(user)/(public)/learn/_components/curriculum-progress-bar";
import { CurriculumToc } from "@/app/(user)/(public)/learn/_components/curriculum-toc";
import { CurriculumTocLink } from "@/app/(user)/(public)/learn/_components/curriculum-toc-link";
import {
  CURRICULUM,
  type CurriculumChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import { SectionTitle } from "@/app/(user)/_components/section-title";

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
 * 出すのは黒帯への道を終えた（全級取得済みの）ユーザーだけ。行程が進行中は
 * 「次にやること」が章を順に案内するので、別の「次はここ」を並べない。全章
 * 学習済みのときも次の章が無いので出さない。出す / 出さないの判断は親
 * （`selectDashboardGuidance`）が持つ。
 *
 * 昇級試験への導線はここには置かない。試験は黒帯への道の「認定される」の
 * 段として「次にやること」カードが順番どおりに出す。
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

      <CurriculumTocLink />
    </div>
  );
}
