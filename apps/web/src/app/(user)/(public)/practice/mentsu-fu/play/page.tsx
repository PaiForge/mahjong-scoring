import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { MentsuFuDrill } from "../_components/mentsu-fu-drill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentsuFu");
  return createMetadata({ title: t("title") });
}

/**
 * @description
 * 面子符ドリルのプレイページ。面子の形からの符計算を制限時間内に繰り返し回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 面子が表示され、符を選択
 * 3. 制限時間経過またはミス3回で終了
 * 4. スコアを保存し、result ページへリダイレクト
 */
export default function MentsuFuPlayPage() {
  return <MentsuFuDrill />;
}
