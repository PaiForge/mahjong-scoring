/**
 * ミス回数に応じた文字色クラスを返す。
 * ミス数カラー
 *
 * ランキングとマイページ（チャレンジ履歴・成績一覧）で同じ「ミス数」を
 * 出すため、色の段階はここ 1 箇所で決める。0 回は地の文字色のまま、
 * 1 回は注意（warning）、2 回以上は危険（destructive）。チャレンジは
 * ミス 3 回で終了するので、2 回は「あと 1 回」の警告に当たる。
 *
 * 状態を表す色なので `globals.css` の状態トークンだけを使い、ブランド緑
 * （primary）や surface の階調は使わない — 緑は「押せる面」と正解
 * フィードバックに取ってある色で、ミス 0 回に当てると意味が二重になる。
 */
export function getMissColorClass(incorrectAnswers: number): string {
  if (incorrectAnswers === 0) return "text-foreground";
  if (incorrectAnswers <= 1) return "text-warning";
  return "text-destructive";
}
