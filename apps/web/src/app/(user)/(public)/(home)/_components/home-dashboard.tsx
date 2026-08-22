import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";

import { ContinueLearningSection } from "./continue-learning-section";
import { HomeAnnouncements } from "./home-announcements";

/**
 * ログイン済みユーザーのトップ（ダッシュボード）。
 * ダッシュボード
 *
 * 「学習の続き」を先頭に置き、お知らせをその下に並べる。再訪時に真っ先に
 * 必要なのは読みかけの章への導線なので、お知らせより上に出す。
 */
export async function HomeDashboard() {
  const t = await getTranslations("nav");

  return (
    <ContentContainer>
      <PageTitle>{t("home")}</PageTitle>

      <div className="space-y-8">
        <ContinueLearningSection />
        <HomeAnnouncements />
      </div>
    </ContentContainer>
  );
}
