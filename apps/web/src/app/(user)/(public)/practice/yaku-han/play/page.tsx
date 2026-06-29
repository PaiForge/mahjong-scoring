import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { YakuHanPlayView } from "../_components/yaku-han-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yakuHanChallenge");
  return createMetadata({ title: t("title") });
}

/**
 * 役の翻数 プレイ
 *
 * @description
 * 役翻数練習のプレイページ。役名と門前/鳴きの状態から正しい翻数を
 * 制限時間内に回答する。セッション終了時にスコアをサーバーに保存し、
 * リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 役名と状態が表示され、翻数を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default async function YakuHanPlayPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  return <YakuHanPlayView range={range} />;
}
