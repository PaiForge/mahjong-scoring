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

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";

import { ChallengeDashboard } from "../_components/challenge-dashboard";
import { getPeriodRange, getPreviousPeriodRange } from "../_lib/period-utils";
import {
  fetchAvailableMenuTypes,
  fetchChallengeSessions,
} from "../_lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypage.challenges");
}

const DEFAULT_PERIOD = "thisWeek" as const;

export default async function ChallengesPage() {
  const t = await getTranslations("mypage.challenges");
  const tMypage = await getTranslations("mypage");

  const { user } = await requireConfirmedUser();

  // サーバーサイドで初期データをプリフェッチし、クライアントの初回 useEffect を省略する
  const availableMenuTypes = await fetchAvailableMenuTypes(user.id);
  const firstMenu =
    availableMenuTypes.length > 0 ? availableMenuTypes[0] : undefined;

  let initialSessions: {
    current: Awaited<ReturnType<typeof fetchChallengeSessions>>["current"];
    previous: Awaited<ReturnType<typeof fetchChallengeSessions>>["previous"];
  } = { current: [], previous: [] };

  if (firstMenu) {
    const now = new Date();
    const currentRange = getPeriodRange(DEFAULT_PERIOD, now);
    const previousRange = getPreviousPeriodRange(DEFAULT_PERIOD, now);
    initialSessions = await fetchChallengeSessions(
      user.id,
      firstMenu,
      currentRange.start,
      currentRange.end,
      previousRange.start,
      previousRange.end,
    );
  }

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <ChallengeDashboard
        initialMenuTypes={availableMenuTypes}
        initialSessions={initialSessions}
      />
    </ContentContainer>
  );
}
