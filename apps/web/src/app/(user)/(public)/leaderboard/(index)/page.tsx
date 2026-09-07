/**
 * リーダーボード一覧
 *
 * @description
 * リーダーボード一覧ページ。
 * 全土俵（練習 × 出題設定）のランキングを分野ごとの行リンクで並べる。
 * クエリパラメータ `period` で全期間 / 月間を切り替え可能。
 * ログイン中のユーザーには各土俵での自分の順位を表示する。
 *
 * @flow
 * 1. ユーザーがランキングページにアクセス
 * 2. 分野（符の計算 / 翻数 / 点数計算）ごとに土俵の一覧を表示（既定は総合）
 * 3. 各行にユーザーの順位を表示（ログイン時）
 * 4. 行を押すとその土俵の詳細ランキングへ遷移
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";

import { LeaderboardRowListSkeleton } from "../_components/leaderboard-row-list-skeleton";
import { LeaderboardTopContent } from "../_components/leaderboard-top-content";
import type { LeaderboardPeriod } from "../_lib/types";
import { isValidPeriod } from "../_lib/validators";

export const dynamic = "force-dynamic";

interface LeaderboardIndexPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

function parsePeriod(value: string | undefined): LeaderboardPeriod {
  if (value && isValidPeriod(value)) {
    return value;
  }
  return "all-time";
}

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("leaderboard");
}

export default async function LeaderboardIndexPage({
  searchParams,
}: LeaderboardIndexPageProps) {
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);
  const t = await getTranslations("leaderboard");

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <Suspense key={period} fallback={<LeaderboardRowListSkeleton />}>
        <LeaderboardTopContent period={period} />
      </Suspense>
    </ContentContainer>
  );
}
