/**
 * マイレコード
 *
 * @description ログインユーザーのチャレンジモード成績をダッシュボード形式で閲覧する。
 *   KPIカード（ベストスコア・平均スコア）、スコア推移チャート、直近セッション履歴を表示。
 *   期間と練習種別でフィルタリング可能。
 * @flow ダッシュボード閲覧 → 期間/種別変更 → 全履歴ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import {
  getAvailableMenuTypes,
  getChallengeSessions,
} from "./_actions/get-challenge-sessions";
import { ChallengeDashboard } from "./_components/challenge-dashboard";
import { getPeriodRange, getPreviousPeriodRange } from "./_lib/period-utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mypage.challenges");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

const DEFAULT_PERIOD = "thisWeek" as const;

export default async function ChallengesPage() {
  const t = await getTranslations("mypage.challenges");

  // サーバーサイドで初期データをプリフェッチし、クライアントの初回 useEffect を省略する
  const availableMenuTypes = await getAvailableMenuTypes();
  const firstMenu =
    availableMenuTypes.length > 0 ? availableMenuTypes[0] : undefined;

  let initialSessions: {
    current: Awaited<ReturnType<typeof getChallengeSessions>>["current"];
    previous: Awaited<ReturnType<typeof getChallengeSessions>>["previous"];
  } = { current: [], previous: [] };

  if (firstMenu) {
    const currentRange = getPeriodRange(DEFAULT_PERIOD);
    const previousRange = getPreviousPeriodRange(DEFAULT_PERIOD);
    initialSessions = await getChallengeSessions(
      firstMenu,
      currentRange.start,
      currentRange.end,
      previousRange.start,
      previousRange.end,
    );
  }

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-6">
        <ChallengeDashboard
          initialMenuTypes={availableMenuTypes}
          initialSessions={initialSessions}
        />
      </div>
    </ContentContainer>
  );
}
