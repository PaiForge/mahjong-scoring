"use client";

import {
  useTrainingSession as useSharedTrainingSession,
  type TrainingSessionState,
} from "@mahjong-scoring/features/session/use-training-session";

import { useAutoAdvanceOnCorrect } from "@/app/_hooks/use-training-settings-store";
import { scrollToPracticeAnchor } from "../_lib/scroll-anchor";

/**
 * 練習のトレーニングセッション管理（web）
 * トレーニングセッション管理
 *
 * features の `useTrainingSession` に、端末ローカルのトレーニング設定
 * （正解時の自動遷移）と、表示が切り替わったとき練習の先頭へスクロールして
 * 戻す処理を渡す。
 */
export function useTrainingSession(): TrainingSessionState {
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  return useSharedTrainingSession({
    autoAdvanceOnCorrect,
    onDisplayChange: scrollToPracticeAnchor,
  });
}
