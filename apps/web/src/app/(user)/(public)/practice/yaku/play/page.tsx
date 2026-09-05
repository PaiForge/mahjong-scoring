import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { Metadata } from "next";
import { createPracticePlayMetadata } from "../../_lib/metadata";
import { YakuPlayView } from "../_components/yaku-play-view";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticePlayMetadata(PRACTICE_SLUG.yaku);
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
 * 3. 問題別の回答結果を sessionStorage に保存
 * 4. 制限時間経過またはミス3回で終了
 * 5. スコアを保存し、result ページへリダイレクト
 */
export default function YakuPlayPage() {
  return <YakuPlayView />;
}
