import { getTranslations } from "next-intl/server";

import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { fetchAchievedRankSlugs } from "../_lib/achieved-ranks";
import { fetchAttemptedPracticeSlugs } from "../_lib/attempted-practices";
import { selectDashboardGuidance } from "../_lib/guidance";
import { ComprehensivePracticeSection } from "./comprehensive-practice-section";
import { ContinueLearningSection } from "./continue-learning-section";
import { HomeAnnouncements } from "./home-announcements";
import { ReadyExamLinks } from "./ready-exam-links";
import { RecommendedPracticeSection } from "./recommended-practice-section";

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 「教本の続き」→「おすすめの練習」→ お知らせ の順に並べる。
 * 再訪時に真っ先に必要なのは学習の再開点で、お知らせはその次だという判断。
 *
 * 受験できる昇級試験は「教本の続き」の末尾にリンクとして添える
 * （{@link ReadyExamLinks}）。前提章を読み終えた先にある行き先なので
 * 学習の再開点の隣が収まりがよく、ページ先頭のカードにはしない。
 *
 * 学習導線は勧めるものがあるときだけ出す（`selectDashboardGuidance`）。
 * 教本を読み切って練習もひととおり終えたユーザーには、代わりに総合演習を出す。
 */
export async function HomeDashboard() {
  const [t, readSlugs, attemptedSlugs, achievedRankSlugs] = await Promise.all([
    getTranslations("nav"),
    fetchReadChapterSlugs(),
    fetchAttemptedPracticeSlugs(),
    fetchAchievedRankSlugs(),
  ]);

  const {
    nextChapter,
    recommendedPracticeSlugs,
    showComprehensivePractice,
    readyExamSlugs,
  } = selectDashboardGuidance({
    readSlugs,
    attemptedSlugs,
    achievedRankSlugs,
  });

  const examLinks =
    readyExamSlugs.length > 0 ? (
      <ReadyExamLinks slugs={readyExamSlugs} />
    ) : undefined;

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        {nextChapter ? (
          <ContinueLearningSection
            readSlugs={readSlugs}
            nextChapter={nextChapter}
            tailLink={examLinks}
          />
        ) : (
          // 全章読了済みで「教本の続き」が出ないときも、受験できる試験の
          // 導線だけは残す（次に取れる級があることを知らせる場が他に無い）
          examLinks
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
