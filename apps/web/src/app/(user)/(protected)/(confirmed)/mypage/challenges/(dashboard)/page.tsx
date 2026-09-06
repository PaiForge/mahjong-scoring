/**
 * マイレコード
 *
 * @description ログインユーザーのチャレンジモード成績をダッシュボード形式で閲覧する。
 *   KPIカード（ベストスコア・平均スコア）、スコア推移チャート、直近チャレンジ履歴を表示。
 *   期間と練習種別でフィルタリング可能。
 *   `?menu=<練習種別>&variant=<バリアント>` で開くと、その土俵を選択した状態で
 *   表示する（練習結果ページの「記録」セクションからの導線で使う）。
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
import { fetchAvailableBoards, fetchChallengeAttempts } from "../_lib/queries";
import { recordBoardKey } from "../_lib/types";
import { resolveRequestedBoard } from "../_lib/requested-board";

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
  const availableBoards = await fetchAvailableBoards(user.id);

  // `?menu=&variant=` の指定を初期選択にする。記録の無い土俵・未知の値は
  // 既定に落とす（空のダッシュボードを開かせない）
  const requested = resolveRequestedBoard(await searchParams);
  const requestedBoard =
    requested === undefined
      ? undefined
      : availableBoards.find(
          (board) => recordBoardKey(board) === recordBoardKey(requested),
        );

  // ダッシュボードの初期選択。プリフェッチする土俵とクライアントの初期選択が
  // 食い違うと、初回描画だけ別の土俵のデータが出るため同じ値を両方に渡す
  const initialBoard =
    requestedBoard ??
    (availableBoards.length > 0 ? availableBoards[0] : undefined);

  let initialAttempts: {
    current: Awaited<ReturnType<typeof fetchChallengeAttempts>>["current"];
    previous: Awaited<ReturnType<typeof fetchChallengeAttempts>>["previous"];
  } = { current: [], previous: [] };

  if (initialBoard) {
    const now = new Date();
    const currentRange = getPeriodRange(DEFAULT_PERIOD, now);
    const previousRange = getPreviousPeriodRange(DEFAULT_PERIOD, now);
    initialAttempts = await fetchChallengeAttempts(
      user.id,
      initialBoard,
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
        initialBoards={availableBoards}
        initialBoard={initialBoard}
        initialAttempts={initialAttempts}
      />
    </ContentContainer>
  );
}
