/**
 * 昇級試験（手牌の合計符） 結果
 *
 * @description
 * 昇級試験の結果ページ。スコアと正答率、問題別の答え合わせを表示する。
 * ランキングのプレビューは出さない（試験の成果は段級位が表すため、
 * 昇級試験はランキングを持たない）。
 *
 * @flow
 * 1. 試験終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開すると
 *    出題された手牌・符の内訳・回答の比較を確認できる）
 * 4. リトライボタンと道場へのリンク
 */
import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "@/app/[locale]/(user)/(public)/practice/_lib/create-practice-result-page";
import { FuExamResultView } from "../_components/fu-exam-result-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

const SLUG = PRACTICE_SLUG.fuExam;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/exam/fu/result">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/exam/fu/result");
  return createPracticeResultMetadata(SLUG, { locale });
}

export const dynamic = "force-dynamic";

const PracticeResultPage = createPracticeResultPage(FuExamResultView, {
  slug: SLUG,
});

export default async function FuExamResultPage({
  params,
  searchParams,
}: PageProps<"/[locale]/exam/fu/result">) {
  await prepareRouteLocale(params, "/exam/fu/result");
  return <PracticeResultPage searchParams={searchParams} />;
}
