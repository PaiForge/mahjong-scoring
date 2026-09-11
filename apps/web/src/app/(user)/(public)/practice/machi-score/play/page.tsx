import type { Metadata } from "next";
import { createFreePracticePlayMetadata } from "../../_lib/metadata";
import { MachiScoreBoard } from "../_components/machi-score-board";

export async function generateMetadata(): Promise<Metadata> {
  return createFreePracticePlayMetadata("machiScore");
}

/**
 * 待ち別点数計算 プレイ
 *
 * @description
 * 待ち別点数計算のプレイページ。エンドレス自由練習形式で、聴牌形（13 枚）から
 * 待ち牌を読み、待ちごとにツモ・ロンの点数を答える。
 *
 * @flow
 * 1. 設定ページからクエリパラメータを受け取り問題を生成
 * 2. 聴牌形と条件が表示され、待ち牌をすべて選んで回答（正誤を表示）
 * 3. 「点数計算へ進む」で待ち × ツモ/ロン のマスが出る（リーチなら裏ドラも開く）。
 *    マスを選んで翻・符・点数（役なしの場合は「役なし」）を当てはめ、全マス
 *    埋まったら回答
 * 4. 答え合わせ（マスごとの正誤と内訳）→「次へ」で新しい問題を生成
 *    （自動次へ設定時は待ち・全マス正解で自動遷移）
 * 5. 任意のタイミングで設定画面に戻るか終了できる
 */
export default function MachiScorePlayPage() {
  return <MachiScoreBoard />;
}
