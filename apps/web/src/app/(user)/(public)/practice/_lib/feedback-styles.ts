/**
 * 練習の正誤フィードバック時のボーダー＋背景クラスを返す
 * フィードバック枠スタイル
 *
 * @param showFeedback - フィードバック表示中かどうか
 * @param lastAnswerCorrect - 直前の回答が正解だったか（undefined の場合はデフォルト表示）
 */
export function getFeedbackBorderClass(
  showFeedback: boolean,
  lastAnswerCorrect: boolean | undefined,
): string {
  if (!showFeedback || lastAnswerCorrect === undefined)
    return "border-ink bg-white";
  return lastAnswerCorrect
    ? "border-success bg-success-subtle"
    : "border-destructive bg-destructive-subtle";
}

/**
 * 選択肢ボタンのボーダー＋背景クラスを返す
 * 選択肢配色
 *
 * 選んだ選択肢は、正誤が付く前（`isSelected && !showFeedback`）から色を変える。
 * 記録ありのチャレンジは採点がサーバーで行われ、押してから正誤が返るまで
 * 通信の往復と採点のぶん待つ（長さは回線次第。回答ごとの計測ログ
 * `challenge.answer` の `previousClientRoundTripMs` — 次の回答に添えて
 * 届く直前の回答の往復時間 — で見る）。その間ボタンが
 * 静止時の見た目に戻ると「押したのに
 * 何も起きない」一拍になるので、押した瞬間に「受け付けた」を見せ、
 * 正誤の色は後から乗せる。採点が同期のトレーニングとレッスンでは、選択と
 * 同時に `showFeedback` が立つのでこの状態を通らない。
 *
 * 「受け付けた」の塗りは正誤のどちらとも読めない灰色（`bg-surface-100`。
 * select で答える盤面が待ち中に出す `disabled:bg-surface-100` と同じ）に
 * 限る。以前はブランドの緑（`bg-primary-100`）を使っていたが、その値は
 * 正解の塗り `bg-success-subtle` と同じ色で、不正解だったときに「緑で
 * 正解になってから赤に変わる」ように見えた（2026-10 に本番で報告）。
 */
export function getFeedbackStyles(
  showFeedback: boolean,
  isSelected: boolean,
  isCorrect: boolean,
): { borderClass: string; bgClass: string } {
  if (!showFeedback) {
    return isSelected
      ? { borderClass: "border-ink", bgClass: "bg-surface-100" }
      : { borderClass: "border-ink", bgClass: "bg-white hover:bg-primary-50" };
  }

  if (isCorrect) {
    return { borderClass: "border-success", bgClass: "bg-success-subtle" };
  }

  if (isSelected) {
    return {
      borderClass: "border-destructive",
      bgClass: "bg-destructive-subtle",
    };
  }

  return { borderClass: "border-ink", bgClass: "bg-white opacity-50" };
}

/**
 * 選択肢ボタンに渡すフィードバック関連の props をまとめて組み立てる
 * 選択肢フィードバックprops
 *
 * 選択肢グリッドを持つ盤面（雀頭符・面子符・待ち符など）で共通の
 * 「正誤の配色 + カウントダウン/フィードバック中は押させない」を1箇所にする。
 * グリッドの列数や中身は盤面ごとに違うため、コンポーネントには寄せていない。
 */
export function getChoiceFeedbackProps(params: {
  readonly showFeedback: boolean;
  readonly isCountingDown: boolean;
  readonly isSelected: boolean;
  readonly isCorrect: boolean;
}): {
  readonly borderClass: string;
  readonly bgClass: string;
  readonly disabled: boolean;
} {
  const { showFeedback, isCountingDown, isSelected, isCorrect } = params;
  return {
    ...getFeedbackStyles(showFeedback, isSelected, isCorrect),
    disabled: showFeedback || isCountingDown,
  };
}
