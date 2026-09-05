import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { TotalFuPlayView } from "../_components/total-fu-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata(PRACTICE_SLUG.totalFu);
}

/**
 * 手牌の合計符練習 プレイ
 *
 * @description
 * 手牌の合計符練習のプレイページ。手牌全体の符を制限時間内に繰り返し回答する。
 * セッション終了時にスコアをサーバーに保存し、リーダーボードに反映する。
 *
 * @flow
 * 1. カウントダウンオーバーレイ（3, 2, 1）の後にタイマー開始
 * 2. 手牌が表示され、切り上げ後の合計符を選択肢から1つ選ぶ
 * 3. 回答するとその手牌の符の内訳が表示される
 * 4. 制限時間経過またはミス3回で終了し、result ページへリダイレクト
 */
export default function TotalFuPlayPage() {
  return <TotalFuPlayView />;
}
