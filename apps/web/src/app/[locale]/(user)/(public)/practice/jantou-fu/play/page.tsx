import { PRACTICE_SLUG } from "@mahjong-scoring/features/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { JantouFuPlayView } from "../_components/jantou-fu-play-view";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/jantou-fu/play">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/practice/jantou-fu/play");
  return createPracticePlayMetadata(PRACTICE_SLUG.jantouFu, { locale });
}

/**
 * 雀頭符練習 プレイ
 *
 * @description
 * 雀頭符練習のプレイページ。場風・自風の条件のもと、
 * 指定された符になる雀頭を4択から選択する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 場風・自風が表示され、正しい符の雀頭を4択から選択
 * 3. 問題別の回答結果を sessionStorage に保存
 * 4. 制限時間経過またはミス3回で終了
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default async function JantouFuPlayPage({
  params,
}: PageProps<"/[locale]/practice/jantou-fu/play">) {
  await prepareRouteLocale(params, "/practice/jantou-fu/play");
  return <JantouFuPlayView />;
}
