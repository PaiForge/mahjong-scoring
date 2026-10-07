"use client";

import { createContext, useContext } from "react";

import type { LessonFollowUp } from "@mahjong-scoring/features/lessons/follow-up";

const LessonFollowUpContext = createContext<LessonFollowUp | undefined>(
  undefined,
);

/**
 * レッスンの続き（本人の次の一歩・級の進み具合）を、サーバーで描いた
 * スロットの中のクライアント部品へ渡す
 * レッスンの続きの文脈
 *
 * `LessonView` が記録の結果から入れる。いまログインしている本人の分だけで、
 * 未記録・別のユーザーに切り替わったときは undefined。
 */
export const LessonFollowUpProvider = LessonFollowUpContext.Provider;

/** レッスンの続きを読む。無ければ undefined */
export function useLessonFollowUp(): LessonFollowUp | undefined {
  return useContext(LessonFollowUpContext);
}
