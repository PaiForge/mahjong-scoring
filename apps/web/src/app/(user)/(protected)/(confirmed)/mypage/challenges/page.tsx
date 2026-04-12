/**
 * マイレコード
 *
 * @description ログインユーザーのチャレンジモード成績をダッシュボード形式で閲覧する。
 *   KPIカード（ベストスコア・平均スコア）、スコア推移チャート、直近セッション履歴を表示。
 *   期間とドリル種別でフィルタリング可能。
 * @flow ダッシュボード閲覧 → 期間/種別変更 → 全履歴ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { ChallengeStatsContent } from "./_components/challenge-stats-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mypageChallenges");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function ChallengesPage() {
  const t = await getTranslations("mypageChallenges");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-6">
        <ChallengeStatsContent />
      </div>
    </ContentContainer>
  );
}
