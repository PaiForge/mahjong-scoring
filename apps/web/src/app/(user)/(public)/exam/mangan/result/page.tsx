/**
 * 昇級試験（満貫以上の点数計算） 結果
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
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "@/app/(user)/(public)/practice/_lib/create-practice-result-page";
import { ManganExamResultView } from "../_components/mangan-exam-result-view";

const SLUG = "mangan-exam" as const;

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

export default createPracticeResultPage(ManganExamResultView, {
  slug: SLUG,
});
