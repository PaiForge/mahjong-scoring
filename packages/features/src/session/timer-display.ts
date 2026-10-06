/**
 * 残り秒数を「分:秒」にする
 * タイマー表示
 */
export function formatTimerClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * 円形タイマーの円弧の色（経過で緑 → 琥珀 → 赤）
 * タイマー色
 *
 * web は SVG の stroke、モバイルは react-native-svg の stroke に同じ値を渡す。
 *
 * @param progress 経過の割合（0〜1）
 */
export function timerColorOf(progress: number): string {
  if (progress >= 0.8) return "#ef4444";
  if (progress >= 0.6) return "#f59e0b";
  return "#22c55e";
}
