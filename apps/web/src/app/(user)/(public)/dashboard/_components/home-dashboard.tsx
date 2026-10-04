import { getTranslations } from "next-intl/server";

import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/progress";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { fetchAchievedRankSlugs } from "../_lib/achieved-ranks";
import { fetchAttemptedPractices } from "../_lib/attempted-practices";
import { selectDashboardGuidance } from "../_lib/guidance";
import { ComprehensivePracticeSection } from "./comprehensive-practice-section";
import { ContinueLearningSection } from "./continue-learning-section";
import { HomeAnnouncements } from "./home-announcements";
import { NextStepSection } from "./next-step-section";
import { PendingLessonSync } from "./pending-lesson-sync";

interface HomeDashboardProps {
  /** ログインしている本人の id（ページが cookie から確定したもの） */
  readonly userId: string;
}

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 行程が進行中なら「次の一歩」→ お知らせ、
 * 全級取得済みなら「教本の続き」→「おすすめの練習」（総合演習）→ お知らせ
 * の順に並べる。出し分けは `selectDashboardGuidance` が決める。
 *
 * 「次の一歩」は黒帯への道（段級位の行程）の中で今やること 1 つ
 * （{@link NextStepSection}）。登録直後は最初のレッスン、以降は章と練習を
 * 交互に進み、最後に試験。ホームは「今すること」を答える場で、全体の道筋は
 * 道場が持つ。行程が進行中のあいだ教本は出さない — 別の「次はここ」を
 * 同じ重さで並べると今やることが決まらず、目次へはナビゲーションから行ける
 * （{@link selectDashboardGuidance}）。
 *
 * 先頭に {@link PendingLessonSync} を置く。登録前に終えたレッスンや保存に
 * 失敗した完了が端末に残っていれば、ここで本人の記録にして「次の一歩」を
 * 組み直す。
 */
export async function HomeDashboard({ userId }: HomeDashboardProps) {
  const [
    t,
    readSlugs,
    completedLessonSlugs,
    attemptedPractices,
    achievedRankSlugs,
  ] = await Promise.all([
    getTranslations("nav"),
    fetchReadChapterSlugs(),
    fetchCompletedLessonSlugs(),
    fetchAttemptedPractices(),
    fetchAchievedRankSlugs(),
  ]);

  const { journey, nextChapter, showComprehensivePractice } =
    selectDashboardGuidance({
      readSlugs,
      completedLessonSlugs,
      attemptedPractices,
      achievedRankSlugs,
    });

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        <PendingLessonSync userId={userId} />

        <NextStepSection journey={journey} />

        {nextChapter && (
          <ContinueLearningSection
            readSlugs={readSlugs}
            nextChapter={nextChapter}
          />
        )}

        {showComprehensivePractice && <ComprehensivePracticeSection />}

        <HomeAnnouncements />
      </div>
    </ContentContainer>
  );
}
