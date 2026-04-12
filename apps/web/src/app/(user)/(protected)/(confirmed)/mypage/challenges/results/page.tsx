/**
 * チャレンジ全履歴
 *
 * @description チャレンジモードの全セッション結果をページネーション付きテーブルで表示する。
 *   メニュー種別によるフィルタリングが可能。
 * @flow ダッシュボード「すべての結果を見る」 → 全履歴閲覧 → ページ遷移 → メニュー絞り込み
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { PaginationNav } from "@/app/_components/pagination-nav";
import { createMetadata } from "@/app/_lib/metadata";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { isPracticeMenuType, menuTypeToMessageKey } from "@/lib/db/practice-menu-types";
import { getAuthenticatedUser } from "@/lib/auth";

import { formatDate, getMissColorClass } from "../_lib/dashboard-utils";
import { getChallengeResultsPaginated } from "../_lib/queries";
import { ResultsTable } from "./_components/results-table";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mypage.challengeResults");
  return {
    ...createMetadata({ title: t("pageTitle") }),
    robots: { index: false, follow: false },
  };
}

export default async function ChallengeResultsPage({ searchParams }: Props) {
  const t = await getTranslations("mypage.challengeResults");
  const tChallenges = await getTranslations("mypage.challenges");
  const params = await searchParams;

  const user = await getAuthenticatedUser();

  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const menuParam = typeof params.menu === "string" ? params.menu : undefined;
  const menuType: PracticeMenuType | undefined =
    menuParam && isPracticeMenuType(menuParam) ? menuParam : undefined;

  const { items, totalPages } = await getChallengeResultsPaginated(
    user.id,
    page,
    menuType,
  );

  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  const buildHref = (p: number) => {
    const urlParams = new URLSearchParams();
    if (p > 1) urlParams.set("page", String(p));
    if (menuType) urlParams.set("menu", menuType);
    const qs = urlParams.toString();
    return `/mypage/challenges/results${qs ? `?${qs}` : ""}`;
  };

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-6 space-y-6">
        <ResultsTable
          items={items}
          menuType={menuType}
          emptyMessage={t("empty")}
          headers={{
            date: t("tableDate"),
            menu: t("tableMenu"),
            correctAnswers: t("tableCorrectAnswers"),
            incorrectAnswers: t("tableIncorrectAnswers"),
          }}
          formatDate={formatDate}
          getMissColorClass={getMissColorClass}
          getMenuLabel={(type) =>
            isPracticeMenuType(type)
              ? tChallenges(`menuTypes.${menuTypeToMessageKey(type)}`)
              : type
          }
        />

        <PaginationNav
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildHref}
        />
      </div>
    </ContentContainer>
  );
}
