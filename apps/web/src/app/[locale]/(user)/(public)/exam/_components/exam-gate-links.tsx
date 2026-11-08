"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  DEFAULT_EXAM_GATE_LINKS,
  type ExamGateLinks,
} from "../_lib/exam-gate-link-defaults";

export type { ExamGateLinks } from "../_lib/exam-gate-link-defaults";

const ExamGateLinksContext = createContext<ExamGateLinks>(
  DEFAULT_EXAM_GATE_LINKS,
);

/**
 * 受験ゲートの導線を配下へ渡す
 * 受験ゲートの導線Provider
 *
 * @design props ではなく context で渡す理由
 * 受験ゲート（`ExamStartGate`）は説明ページの開始導線のほか、模試の画面末尾
 * （練習の共有の部品 `createTrainingView` → `TrainingChallengeCta` の中）にも
 * 置かれる。模試の page.tsx からゲートまでの間はすべてクライアントの共有部品で、
 * そこへ導線の props を 1 本ずつ通すと試験のための引数が練習の部品に増える。
 * 試験のページがこの Provider で包めば、間の部品は導線を知らずに済む。
 */
export function ExamGateLinksProvider({
  links,
  children,
}: {
  readonly links: ExamGateLinks;
  readonly children: ReactNode;
}) {
  return (
    <ExamGateLinksContext.Provider value={links}>
      {children}
    </ExamGateLinksContext.Provider>
  );
}

/** 受験ゲートの導線（Provider の外では言語をまたがない既定の導線） */
export function useExamGateLinks(): ExamGateLinks {
  return useContext(ExamGateLinksContext);
}
