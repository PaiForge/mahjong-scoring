"use client";

import type { ReactNode } from "react";

import type { PracticeLink } from "@mahjong-scoring/features/curriculum/registry";

import { isNextStepPractice } from "@mahjong-scoring/features/lessons/follow-up";
import { useLessonFollowUp } from "./lesson-follow-up-context";

interface RelatedPracticeCardSlotProps {
  /** このカードが指す練習 */
  readonly link: PracticeLink;
  /** サーバーで描いた練習のカード */
  readonly children: ReactNode;
}

/**
 * 関連する練習のカード 1 枚。完了画面の次の一歩と同じ練習なら出さない
 * 関連する練習のカード枠
 *
 * レジストリの練習リンクは道筋の順の次の一歩と重ならない（features の
 * テストが固定）が、本人の進み具合を踏まえた次の一歩は記録のあとにしか
 * 分からず、関連する練習のどれかを指し得る。同じ練習のボタンとカードを
 * 並べないよう、その 1 枚だけを隠す。
 */
export function RelatedPracticeCardSlot({
  link,
  children,
}: RelatedPracticeCardSlotProps) {
  const followUp = useLessonFollowUp();
  if (isNextStepPractice(followUp?.next, link)) return null;
  return children;
}
