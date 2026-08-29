import { getTranslations } from "next-intl/server";

import { ExamCtaCard } from "@/app/(user)/(public)/learn/_components/exam-cta-card";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { fetchAchievedRankSlugs } from "../_lib/achieved-ranks";
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
 * 「昇級試験」→「教本の続き」→「おすすめの練習」→ お知らせ の順に並べる。
 * 再訪時に真っ先に必要なのは学習の再開点で、お知らせはその次だという判断。
 *
 * 昇級試験だけは再開点より前に出す。前提章を読み終えたときにしか現れず、
 * 受かればその級を取って消える一度きりの導線で、章の続きより先に案内する
 * 価値がある（毎回出続けるものではない）。
 *
 * 学習導線は勧めるものがあるときだけ出す（`selectDashboardGuidance`）。
 * 教本を読み切って練習もひととおり終えたユーザーには、代わりに総合演習を出す。
 */
export async function HomeDashboard() {
  const [t, tDashboard, readSlugs, attemptedSlugs, achievedRankSlugs] =
    await Promise.all([
      getTranslations("nav"),
      getTranslations("dashboard"),
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

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        {readyExamSlugs.map((slug) => (
          <ExamCtaCard
            key={slug}
            slug={slug}
            lead={tDashboard("examReadyLead")}
          />
        ))}

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
