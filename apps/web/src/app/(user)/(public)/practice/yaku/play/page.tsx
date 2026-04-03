import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { YakuDrill } from "../_components/yaku-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yaku");
  return createMetadata({ title: t("title") });
}

/**
 * 役判定練習 プレイ
 *
 * @description
 * 役判定練習のプレイページ。手牌から成立する役を制限時間内に判定する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と条件が表示され、成立する役を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default function YakuPlayPage() {
  return <YakuDrill />;
}
