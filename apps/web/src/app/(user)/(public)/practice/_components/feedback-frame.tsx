import type { ReactNode } from "react";

import { getFeedbackBorderClass } from "../_lib/feedback-styles";

interface FeedbackFrameProps {
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  /** 直前の回答が正解だったか（未回答は undefined） */
  readonly lastAnswerCorrect: boolean | undefined;
  /** 余白などのレイアウト調整。枠線・配色は上書きしない */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * 出題を囲む正誤フィードバック枠
 * フィードバック枠
 *
 * 回答すると枠線と背景が正誤に応じて変わる。点数系の盤面で共通の体裁で、
 * 中身と余白だけが練習ごとに違う。
 */
export function FeedbackFrame({
  showFeedback,
  lastAnswerCorrect,
  className = "p-2 sm:p-4",
  children,
}: FeedbackFrameProps) {
  const borderClass = getFeedbackBorderClass(showFeedback, lastAnswerCorrect);

  return (
    <div
      className={`rounded-xl border-3 shadow-sm transition-colors ${className} ${borderClass}`}
    >
      {children}
    </div>
  );
}
