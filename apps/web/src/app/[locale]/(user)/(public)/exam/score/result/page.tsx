/**
 * 昇段試験（あらゆる手の点数計算） 結果
 *
 * @description
 * 昇段試験の結果ページ。スコア・正答率の表示に加え、
 * 全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. 試験終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開式アコーディオン）
 * 4. リトライボタンと道場へのリンク
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "@/app/[locale]/(user)/(public)/practice/_lib/create-practice-result-page";
import { ScoreExamResultView } from "../_components/score-exam-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.scoreExam;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/exam/score/result">): Promise<Metadata> {
  await prepareRouteLocale(params, "/exam/score/result");
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(ScoreExamResultView, {
  slug: SLUG,
});

export default async function ScoreExamResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/exam/score/result">) {
  await prepareRouteLocale(params, "/exam/score/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
