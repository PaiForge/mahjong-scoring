import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { TehaiFuDrill } from "../_components/tehai-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tehaiFu");
  return createMetadata({ title: t("title") });
}

/**
 * 手牌符練習 プレイ
 *
 * @description
 * 手牌符練習のプレイページ。手牌の各面子・雀頭・待ちの符計算を制限時間内に繰り返し回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌と各構成要素が表示され、それぞれの符を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default function TehaiFuPlayPage() {
  return <TehaiFuDrill />;
}
