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
import { TextbookLinkSection } from "./textbook-link-section";

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 行程が進行中なら「次の一歩」→「教本」（目次への補助リンク）→ お知らせ、
 * 全級取得済みなら「教本の続き」→「おすすめの練習」（総合演習）→ お知らせ
 * の順に並べる。出し分けは `selectDashboardGuidance` が決める。
 *
 * 「次の一歩」は黒帯への道（段級位の行程）の中で今やること 1 つ
 * （{@link NextStepSection}）。登録直後は最初のレッスン、以降は章と練習を
 * 交互に進み、最後に試験。ホームは「今すること」を答える場で、全体の道筋は
 * 道場が持つ。行程が進行中のあいだ教本は補助リンクにとどめ、別の「次はここ」
 * を同じ重さで並べない（{@link TextbookLinkSection}）。
 */
export async function HomeDashboard() {
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

  const { journey, showTextbookLink, nextChapter, showComprehensivePractice } =
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
        <NextStepSection journey={journey} />

        {showTextbookLink && <TextbookLinkSection />}

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
