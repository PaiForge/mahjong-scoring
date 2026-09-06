/**
 * チャレンジ全履歴
 *
 * @description チャレンジモードの全チャレンジ結果をページネーション付きテーブルで表示する。
 *   土俵（練習種別 × バリアント）によるフィルタリングが可能（`?menu=&variant=`）。
 * @flow ダッシュボード「すべての結果を見る」 → 全履歴閲覧 → ページ遷移 → メニュー絞り込み
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { PaginationNav } from "@/app/(user)/_components/pagination-nav";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";

import { boardLabel } from "../_lib/board-label";
import { getChallengeResultsPaginated } from "../_lib/queries";
import { resolveRequestedBoard } from "../_lib/requested-board";
import { ResultsTable } from "./_components/results-table";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypage.challengeResults");
}

export default async function ChallengeResultsPage({ searchParams }: Props) {
  const t = await getTranslations("mypage.challengeResults");
  const tChallenges = await getTranslations("mypage.challenges");
  const tMypage = await getTranslations("mypage");
  const tRoot = await getTranslations();
  const params = await searchParams;

  const { user } = await requireConfirmedUser();

  const pageParam =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const board = resolveRequestedBoard(params);

  const { items, totalPages } = await getChallengeResultsPaginated(
    user.id,
    page,
    board,
  );

  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  const buildHref = (p: number) => {
    const urlParams = new URLSearchParams();
    if (p > 1) urlParams.set("page", String(p));
    if (board) {
      urlParams.set("menu", board.menuType);
      urlParams.set("variant", board.variant);
    }
    const qs = urlParams.toString();
    return `/mypage/challenges/results${qs ? `?${qs}` : ""}`;
  };

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: tChallenges("pageTitle"), href: "/mypage/challenges" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-6">
        <SectionTitle>{t("sectionTitle")}</SectionTitle>
        <ResultsTable
          items={items}
          emptyMessage={t("empty")}
          headers={{
            date: t("tableDate"),
            menu: t("tableMenu"),
            correctAnswers: t("tableCorrectAnswers"),
            incorrectAnswers: t("tableIncorrectAnswers"),
          }}
          getBoardLabel={(item) => boardLabel(item, tRoot)}
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
