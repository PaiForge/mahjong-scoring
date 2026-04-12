/**
 * 手牌符練習 結果
 *
 * @description
 * 手牌符練習の結果ページ。
 * スコア・正答率の表示に加え、全期間リーダーボードの上位3名をプレビュー表示する。
 * Server Component としてリーダーボードデータを取得し、Client Component に渡す。
 *
 * @flow
 * 1. 練習終了後に自動リダイレクトされる
 * 2. スコア・正答率を表示
 * 3. 全期間リーダーボード上位3名を表示
 * 4. リーダーボード詳細ページへのリンク
 * 5. リトライまたは練習一覧に戻るボタン
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ResultView } from "../../_components/result-view";
import { createPracticeResultPage } from "../../_lib/create-practice-result-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  const tChallenge = await getTranslations("challenge");
  return createMetadata({ title: `${t("title")} - ${tChallenge("resultSuffix")}` });
}

export const dynamic = 'force-dynamic';

export default createPracticeResultPage(ResultView, {
  module: 'tehai_fu',
  playHref: '/practice/tehai-fu/play',
  resolveTitle: async () => {
    const t = await getTranslations('tehaiFu');
    return t('title');
  },
});
