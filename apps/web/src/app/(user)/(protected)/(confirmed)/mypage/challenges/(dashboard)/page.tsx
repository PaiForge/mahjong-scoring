/**
 * マイレコード
 *
 * @description ログインユーザーのチャレンジモード成績をダッシュボード形式で閲覧する。
 *   KPIカード（ベストスコア・平均スコア）、スコア推移チャート、直近セッション履歴を表示。
 *   期間と練習種別でフィルタリング可能。
 *   `?menu=<練習種別>` で開くと、その種別を選択した状態で表示する
 *   （練習結果ページの「記録」セクションからの導線で使う）。
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
import { isMyRecordMenuType } from "../_lib/menu-scope";
import {
  fetchAvailableMenuTypes,
  fetchChallengeSessions,
} from "../_lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypage.challenges");
}

const DEFAULT_PERIOD = "thisWeek" as const;

interface ChallengesPageProps {
  readonly searchParams: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
}

export default async function ChallengesPage({
  searchParams,
}: ChallengesPageProps) {
  const t = await getTranslations("mypage.challenges");
  const tMypage = await getTranslations("mypage");

  const { user } = await requireConfirmedUser();

  // サーバーサイドで初期データをプリフェッチし、クライアントの初回 useEffect を省略する
  const availableMenuTypes = await fetchAvailableMenuTypes(user.id);

  // `?menu=` の指定を初期選択にする。記録の無い種別・未知の値は既定に落とす
  // （空のダッシュボードを開かせない）
  const rawMenu = (await searchParams).menu;
  const requestedMenu =
    typeof rawMenu === "string" && isMyRecordMenuType(rawMenu)
      ? availableMenuTypes.find((menu) => menu === rawMenu)
      : undefined;

  // ダッシュボードの初期選択。プリフェッチする種別とクライアントの初期選択が
  // 食い違うと、初回描画だけ別種別のデータが出るため同じ値を両方に渡す
  const initialMenu =
    requestedMenu ??
    (availableMenuTypes.length > 0 ? availableMenuTypes[0] : undefined);

  let initialSessions: {
    current: Awaited<ReturnType<typeof fetchChallengeSessions>>["current"];
    previous: Awaited<ReturnType<typeof fetchChallengeSessions>>["previous"];
  } = { current: [], previous: [] };

  if (initialMenu) {
    const now = new Date();
    const currentRange = getPeriodRange(DEFAULT_PERIOD, now);
    const previousRange = getPreviousPeriodRange(DEFAULT_PERIOD, now);
    initialSessions = await fetchChallengeSessions(
      user.id,
      initialMenu,
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
        initialMenu={initialMenu}
        initialSessions={initialSessions}
      />
    </ContentContainer>
  );
}
