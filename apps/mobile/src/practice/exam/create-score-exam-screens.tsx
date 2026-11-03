import type { ReactNode } from "react";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseQuestionResults,
  type ScoreQuestionResult,
} from "@mahjong-scoring/features/results/score-question-result";

import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import {
  scoreExamQuestionGenerator,
  type ScoreExamBoardConfig,
} from "@mahjong-scoring/features/exam/score-exam-board-config";
import { ScoreProblemList } from "../components/score-problem-list";
import {
  createChallengePlayView,
  createTrainingView,
} from "../create-practice-views";
import type { PracticeScreens } from "../practice-screens";

interface ScoreExamScreensConfig {
  readonly slug: PracticeMenuSlug;
  /**
   * 出題盤面の設定（`EXAM_BOARD_CONFIG`）。翻訳名前空間と、模試を回数制限に
   * 通すときに画面側で問題を作る条件をここから取る
   */
  readonly boardConfig: ScoreExamBoardConfig;
  /** 出題盤面（{@link import("./create-score-exam-board").createScoreExamBoard} の戻り値） */
  readonly Board: (
    props: RecordingPracticeBoardProps<ScoreQuestionResult>,
  ) => ReactNode;
  /** 説明画面の「問題方式」の見本 */
  readonly Demo: () => ReactNode;
}

/**
 * 点数計算の昇級試験の画面一式を組む
 * 昇級試験画面一式生成
 *
 * web の各級の `<級>-exam-play-view.tsx` / `-training-view.tsx` /
 * `-result-view.tsx` に当たるものを 1 か所で組む。級ごとに違うのは盤面と
 * 見本と翻訳名前空間だけ。
 *
 * 本番（`Play`）は記録付きでしか始めない（ゲスト等は説明画面へ戻る）。
 * 結果の一覧（`ProblemList`）は試験の結果画面が使う。模試（`Training`）は
 * 回数制限の対象の試験（1級・初段）なら出題を回数制限に通す
 * （`createTrainingView` が `isQuotaMenu(slug)` で決める）。
 */
export function createScoreExamScreens({
  slug,
  boardConfig,
  Board,
  Demo,
}: ScoreExamScreensConfig): PracticeScreens {
  const { translationNamespace } = boardConfig;
  return {
    Play: createChallengePlayView<ScoreQuestionResult>({
      slug,
      renderBoard: (args) => (
        <Board
          showFeedback={args.showFeedback}
          lastAnswerCorrect={args.lastAnswerCorrect}
          isCountingDown={args.isCountingDown}
          onAnswer={args.onAnswer}
          onRecordResult={args.recordResult}
          onPresentQuestion={args.presentQuestion}
        />
      ),
    }),
    Training: createTrainingView({
      slug,
      generateQuestion: scoreExamQuestionGenerator(boardConfig),
      renderBoard: (args) => (
        <Board
          showFeedback={args.showFeedback}
          lastAnswerCorrect={args.lastAnswerCorrect}
          isTraining={args.isTraining}
          onAnswer={args.onAnswer}
        />
      ),
    }),
    Demo,
    ProblemList: ({ results }) => (
      <ScoreProblemList
        results={parseQuestionResults(results)}
        translationNamespace={translationNamespace}
      />
    ),
  };
}
