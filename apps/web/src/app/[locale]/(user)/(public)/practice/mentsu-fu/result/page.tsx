/**
 * 面子符練習 結果
 *
 * @description
 * 面子符練習の結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 * Server Component としてリーダーボードデータを取得し、Client Component に渡す。
 *
 * @flow
 * 1. 練習終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開すると
 *    出題された面子と正解・自分の回答を確認できる）
 * 4. 全期間リーダーボード上位3名を表示
 * 5. リーダーボード詳細ページへのリンク
 * 6. リトライボタンと練習一覧へのリンク
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "../../_lib/create-practice-result-page";
import { MentsuFuResultView } from "../_components/mentsu-fu-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.mentsuFu;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/mentsu-fu/result">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/mentsu-fu/result");
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(MentsuFuResultView, {
  slug: SLUG,
});

export default async function MentsuFuResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/practice/mentsu-fu/result">) {
  await prepareRouteLocale(params, "/practice/mentsu-fu/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
