import { create } from "zustand";
import type { FinalResult } from "@mahjong-scoring/features/session/use-timed-session";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

/**
 * 終えたチャレンジ 1 回分の結果
 * チャレンジ結果
 *
 * web は結果を URL（正解数・問題数・時間）と sessionStorage（問題別の結果）で
 * 結果ページへ運ぶ。モバイルには sessionStorage が無く、URL に問題別の結果を
 * 載せるには大きすぎるため、アプリのメモリに置いて結果画面が読む。
 * 永続化はしない（アプリを閉じれば消える — web のタブを閉じたときと同じ）。
 */
export interface ChallengeAttempt {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  readonly finalResult: FinalResult;
  readonly elapsedMs: number;
  /** 問題別の結果（盤面ごとの型。結果画面の一覧が盤面の型として読む） */
  readonly results: readonly unknown[];
  /**
   * サーバーで記録するチャレンジの ID。結果画面が確定の送信の状態
   * （`useFinishStatus`）を読む。ゲストのチャレンジ・1 問も答えずに
   * 終わったチャレンジでは無い
   */
  readonly recordedAttemptId?: string;
}

interface ChallengeResultState {
  readonly attempt: ChallengeAttempt | undefined;
  readonly setAttempt: (attempt: ChallengeAttempt) => void;
}

/** 直近のチャレンジ結果ストア（メモリのみ） */
export const useChallengeResultStore = create<ChallengeResultState>()(
  (set) => ({
    attempt: undefined,
    setAttempt: (attempt) => set({ attempt }),
  }),
);
