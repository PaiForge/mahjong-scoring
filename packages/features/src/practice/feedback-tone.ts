/**
 * 練習の正誤フィードバックの状態判定（色はアプリが持つ）
 * フィードバックトーン
 *
 * 盤面の枠と選択肢のボタンが「今どの状態か」を決める規則。web（Tailwind の
 * クラス）とモバイル（RN の style）が同じ規則で色を変えるため、状態の判定は
 * ここに 1 つ置き、各アプリはトーン → 色の写像だけを持つ。
 *
 * このモジュールは純粋。
 */

/** 盤面の枠の状態 */
export type FrameFeedbackTone = "idle" | "correct" | "wrong";

/**
 * 盤面の枠が示す正誤
 * 枠トーン
 *
 * @param showFeedback - フィードバック表示中か
 * @param lastAnswerCorrect - 直前の回答が正解だったか（undefined なら既定の表示）
 */
export function frameFeedbackTone(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): FrameFeedbackTone {
  if (!showFeedback || lastAnswerCorrect === undefined) return "idle";
  return lastAnswerCorrect ? "correct" : "wrong";
}

/**
 * 選択肢のボタンの状態
 *
 * - `idle` 押していない、正誤もまだ
 * - `pending` 押した直後で正誤を待っている（記録ありのチャレンジはサーバーで
 *   採点するため、押してから正誤が返るまでに通信の往復がある）
 * - `correct` 正解（選んだかどうかに関わらず正解を示す）
 * - `wrong` 選んだ不正解
 * - `dimmed` 選ばなかった不正解（薄くする）
 */
export type ChoiceFeedbackTone =
  "idle" | "pending" | "correct" | "wrong" | "dimmed";

/**
 * 選択肢のボタンが示す状態
 * 選択肢トーン
 *
 * 選んだ選択肢は、正誤が付く前（`isSelected && !showFeedback`）から
 * `pending` にする。その間ボタンが静止時の見た目に戻ると「押したのに何も
 * 起きない」一拍になるので、押した瞬間に「受け付けた」を見せ、正誤は後から
 * 乗せる。採点が同期のトレーニングとレッスンでは、選択と同時に `showFeedback`
 * が立つのでこの状態を通らない。
 *
 * `pending` の色は正誤のどちらとも読めない灰に限る。以前 web がブランドの
 * 緑を使ったところ、その値が正解の塗りと同じ色で、不正解だったときに
 * 「緑で正解になってから赤に変わる」ように見えた（2026-10 に本番で報告）。
 */
export function choiceFeedbackTone(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): ChoiceFeedbackTone {
  if (!showFeedback) return isSelected ? "pending" : "idle";
  if (isCorrect) return "correct";
  return isSelected ? "wrong" : "dimmed";
}
