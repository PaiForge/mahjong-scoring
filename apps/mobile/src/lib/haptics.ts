import * as Haptics from "expo-haptics";

/** 正誤の判定（正解 / 不正解） */
export type JudgementVerdict = "correct" | "incorrect";

/**
 * 正誤の判定を手触りで知らせる
 * 触覚フィードバック
 *
 * 画面の色の変化に加えて、正解は軽い成功の振動、不正解は失敗の振動を返す
 * （スマホアプリの答え合わせの定石。盤面から目を離していても分かる）。
 * 端末が触覚を持たないとき・web では何もしない。失敗は握りつぶす —
 * 振動が鳴らないことで練習を止めない。
 */
export function hapticJudgement(verdict: JudgementVerdict): void {
  void Haptics.notificationAsync(
    verdict === "correct"
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error,
  ).catch(() => undefined);
}
