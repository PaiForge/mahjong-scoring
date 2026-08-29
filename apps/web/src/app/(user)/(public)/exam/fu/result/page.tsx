/**
 * 昇級試験（手牌の合計符） 結果
 *
 * @description
 * 昇級試験の結果ページ。スコア・正答率の表示に加え、
 * 全期間リーダーボードの上位3名をプレビュー表示する。
 *
 * @flow
 * 1. 試験終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 問題別フィードバック一覧を表示（sessionStorage から読み取り、展開すると
 *    出題された手牌・符の内訳・回答の比較を確認できる）
 * 4. 全期間リーダーボード上位3名を表示
 * 5. リトライボタンと練習一覧へのリンク
 */
import type { Metadata } from "next";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "@/app/(user)/(public)/practice/_lib/create-practice-result-page";
import { FuExamResultView } from "../_components/fu-exam-result-view";

const SLUG = "fu-exam" as const;

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

export default createPracticeResultPage(FuExamResultView, { slug: SLUG });
