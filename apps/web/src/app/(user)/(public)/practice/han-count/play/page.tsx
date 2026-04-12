import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { HanCountPlayView } from "../_components/han-count-play-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hanCountDrill");
  return createMetadata({ title: t("title") });
}

/**
 * 翻数即答 プレイ
 *
 * @description
 * 翻数即答ドリルのプレイページ。手牌から合計翻数を制限時間内に回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と条件が表示され、合計翻数を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default function HanCountPlayPage() {
  return <HanCountPlayView />;
}
