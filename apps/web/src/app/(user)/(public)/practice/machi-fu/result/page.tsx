/**
 * 待ち符練習 結果
 *
 * @description
 * 待ち符練習の結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 * Server Component としてリーダーボードデータを取得し、Client Component に渡す。
 *
 * @flow
 * 1. 練習終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 全期間リーダーボード上位3名を表示
 * 4. リーダーボード詳細ページへのリンク
 * 5. リトライボタンと練習一覧へのリンク
 */
import type { Metadata } from "next";
import { ResultView } from "../../_components/result-view";
import {
  createPracticeResultMetadata,
  createPracticeResultPage,
} from "../../_lib/create-practice-result-page";

const SLUG = "machi-fu" as const;

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeResultMetadata(SLUG);
}

export const dynamic = "force-dynamic";

export default createPracticeResultPage(ResultView, { slug: SLUG });
