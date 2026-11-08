/**
 * 昇級試験（30〜50符の点数計算） 結果
 *
 * @description
 * 昇級試験の結果ページ。スコアと正答率、問題別の答え合わせを表示する。
 * ランキングのプレビューは出さない（試験の成果は段級位が表すため、
 * 昇級試験はランキングを持たない）。
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
import { FuScoreExamResultView } from "../_components/fu-score-exam-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.fuScoreExam;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/exam/fu-score/result">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/exam/fu-score/result");
  return createPracticeResultMetadata(SLUG, { locale });
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(FuScoreExamResultView, {
  slug: SLUG,
});

export default async function FuScoreExamResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/exam/fu-score/result">) {
  await prepareRouteLocale(params, "/exam/fu-score/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
