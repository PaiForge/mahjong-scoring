import { DailyProblemScreen } from "../../../daily-problem/daily-problem-board";

/**
 * 本日の問題
 *
 * @description
 * 全員に同じ和了形の点数計算 1 問を 1 日 1 問解く画面（web の `/daily-problem`）。
 * ログイン中だけ問題を読み、手牌と状況から翻数・符・点数を答えて正誤と内訳を
 * 確かめる。最初の回答（または「わからない」）の正誤だけを記録し、解答済みでも
 * 同じ盤面を解き直せる（記録は変わらない）。回数制限は掛からない。
 * 解答中の画面と同じく全画面のモーダルで出す。
 *
 * @flow
 * 1. ホームの「本日の問題」の「解く」/「もう一度見る」で開く
 * 2. 手牌と状況を見て翻数・符・点数を回答（または「わからない」で答えを見る）
 * 3. 答え合わせの後、「もっと解く」から和了形の点数計算の設定画面へ、または
 *    「ホームへ戻る」/ × でホームへ
 */
export default function DailyProblemPage() {
  return <DailyProblemScreen />;
}
