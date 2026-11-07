/**
 * 点数即答 結果
 *
 * @description
 * 点数即答の結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. 練習終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開式アコーディオン）
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
import { ScoreCalculationResultView } from "../_components/score-calculation-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.scoreCalculation;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/score-calculation/result">): Promise<Metadata> {
  await prepareRouteLocale(params, "/practice/score-calculation/result");
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(
  ScoreCalculationResultView,
  {
    slug: SLUG,
  },
);

export default async function ScoreCalculationResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/practice/score-calculation/result">) {
  await prepareRouteLocale(params, "/practice/score-calculation/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
