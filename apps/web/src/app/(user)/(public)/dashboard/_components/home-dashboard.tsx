import { getTranslations } from "next-intl/server";

import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/progress";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { fetchAchievedRankSlugs } from "../_lib/achieved-ranks";
import { fetchAttemptedPracticeSlugs } from "../_lib/attempted-practices";
import { selectDashboardGuidance } from "../_lib/guidance";
import { ComprehensivePracticeSection } from "./comprehensive-practice-section";
import { ContinueLearningSection } from "./continue-learning-section";
import { HomeAnnouncements } from "./home-announcements";
import { NextStepSection } from "./next-step-section";

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 「次の一歩」→「教本の続き」→ お知らせ の順に並べる。
 *
 * 「次の一歩」は黒帯への道（段級位の行程）の中で今やること 1 つ
 * （{@link NextStepSection}）。登録直後は最初のレッスン、以降は章 → 練習 →
 * 試験と進む。ホームは「今すること」を答える場で、全体の道筋は道場が持つ。
 *
 * 「教本の続き」は行程とは別に残す。行程が数えるのは級の前提章だけで、
 * 基礎のセクションや点数記憶術のように級に属さない章の読む位置は、
 * ここでしか示せない。
 *
 * 学習導線は勧めるものがあるときだけ出す（`selectDashboardGuidance`）。
 * 全級を取得し教本も読み切ったユーザーには、代わりに総合演習を出す。
 */
export async function HomeDashboard() {
  const [
    t,
    readSlugs,
    completedLessonSlugs,
    attemptedSlugs,
    achievedRankSlugs,
  ] = await Promise.all([
    getTranslations("nav"),
    fetchReadChapterSlugs(),
    fetchCompletedLessonSlugs(),
    fetchAttemptedPracticeSlugs(),
    fetchAchievedRankSlugs(),
  ]);

  const { journey, nextChapter, showComprehensivePractice } =
    selectDashboardGuidance({
      readSlugs,
      completedLessonSlugs,
      attemptedSlugs,
      achievedRankSlugs,
    });

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
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
