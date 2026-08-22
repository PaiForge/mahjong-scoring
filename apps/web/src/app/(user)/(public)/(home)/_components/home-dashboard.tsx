import { getTranslations } from "next-intl/server";

import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { fetchAttemptedPracticeSlugs } from "../_lib/attempted-practices";
import { selectDashboardGuidance } from "../_lib/guidance";
import { ComprehensivePracticeSection } from "./comprehensive-practice-section";
import { ContinueLearningSection } from "./continue-learning-section";
import { HomeAnnouncements } from "./home-announcements";
import { RecommendedPracticeSection } from "./recommended-practice-section";

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 「教本の続き」→「おすすめの練習」→ お知らせ の順に並べる。再訪時に真っ先に
 * 必要なのは学習の再開点で、お知らせはその次だという判断。
 *
 * 学習導線は勧めるものがあるときだけ出す（`selectDashboardGuidance`）。
 * 教本を読み切って練習もひととおり終えたユーザーには、代わりに総合演習を出す。
 */
export async function HomeDashboard() {
  const [t, readSlugs, attemptedSlugs] = await Promise.all([
    getTranslations("nav"),
    fetchReadChapterSlugs(),
    fetchAttemptedPracticeSlugs(),
  ]);

  const { nextChapter, recommendedPracticeSlugs, showComprehensivePractice } =
    selectDashboardGuidance({ readSlugs, attemptedSlugs });

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        {nextChapter && (
          <ContinueLearningSection
            readSlugs={readSlugs}
            nextChapter={nextChapter}
          />
        )}

        {recommendedPracticeSlugs.length > 0 && (
          <RecommendedPracticeSection slugs={recommendedPracticeSlugs} />
        )}

        {showComprehensivePractice && <ComprehensivePracticeSection />}

        <HomeAnnouncements />
      </div>
    </ContentContainer>
  );
}
