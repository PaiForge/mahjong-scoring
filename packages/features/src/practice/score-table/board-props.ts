import type {
  ScoreTableAnswer,
  ScoreTableQuestion,
} from "@mahjong-scoring/core";

import type { RecordingPracticeBoardProps } from "../board-props";
import type { ScoreTableQuestionResult } from "./types";

/**
 * 点数表早引きの出題文（`ScoreTablePrompt`）の props（web とアプリで共有）
 * 点数表出題文props
 */
export interface ScoreTablePromptProps {
  readonly isOya: boolean;
  readonly isTsumo: boolean;
  readonly han: number;
  /** 符。満貫以上は点数が符に依存しないため省く */
  readonly fu?: number;
  /**
   * 開示する正解。指定時は出題文の行をこれに差し替える
   * （トレーニングの「わからない」と不正解のあと）。正解の点数は押すと
   * この条件のセルをハイライトした点数早見表が開く
   */
  readonly revealedAnswer?: ScoreTableAnswer;
}

/**
 * 点数表早引きの盤面（`ScoreTableBoard`）の props（web とアプリで共有）
 * 点数表盤面props
 */
export interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
}
