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
import { createClient } from "@/lib/supabase/server";

import { ChallengeDashboard } from "./_components/challenge-dashboard";
import { getPeriodRange, getPreviousPeriodRange } from "./_lib/period-utils";
import {
  fetchAvailableMenuTypes,
  fetchChallengeSessions,
} from "./_lib/queries";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // protected ルート内のため user は必ず存在するが、型安全のためフォールバック
  const availableMenuTypes = user
    ? await fetchAvailableMenuTypes(user.id)
    : [];
  const firstMenu =
    availableMenuTypes.length > 0 ? availableMenuTypes[0] : undefined;

  let initialSessions: {
    current: Awaited<ReturnType<typeof fetchChallengeSessions>>["current"];
    previous: Awaited<ReturnType<typeof fetchChallengeSessions>>["previous"];
  } = { current: [], previous: [] };

  if (firstMenu && user) {
    const currentRange = getPeriodRange(DEFAULT_PERIOD);
    const previousRange = getPreviousPeriodRange(DEFAULT_PERIOD);
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
