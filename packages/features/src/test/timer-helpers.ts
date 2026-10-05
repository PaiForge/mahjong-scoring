import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * カウントダウンを完了させる（countdownFrom 秒分だけ進める）
 * カウントダウン完了
 *
 * チャレンジは開始直後にカウントダウンオーバーレイを挟むため、
 * タイマー本体を検証するテストはまずこれを呼んで本編に入る。
 * 呼び出し側で `vi.useFakeTimers()` を有効にしておくこと。
 */
export function completeCountdown(countdownFrom = 3): void {
  for (let i = 0; i < countdownFrom; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}
