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
 * 回答すると枠線と背景が正誤に応じて変わる。自前の枠を持たない出題
 * （点数表早引きの条件提示）を載せる白カードで、それ自体が出題の枠になる。
 *
 * 手牌の盤面（{@link import("./tehai-display").TehaiDisplay}）はこれで囲まない。
 * 盤面が自前で枠を持つため二重枠になり、狭い画面ではそのぶん手牌が小さくなる。
 * 選択肢を持たない練習の正誤は、ライフ表示と正解/不正解カウンタが示す。
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
      className={`rounded-xl border-3 transition-colors ${className} ${borderClass}`}
    >
      {children}
    </div>
  );
}
