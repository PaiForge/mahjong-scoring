import type { ReactNode } from "react";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  parseQuestionResults,
  type ScoreQuestionResult,
} from "@mahjong-scoring/features/results/score-question-result";

import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { ScoreProblemList } from "../components/score-problem-list";
import {
  createChallengePlayView,
  createTrainingView,
} from "../create-practice-views";
import type { PracticeScreens } from "../practice-screens";

interface ScoreExamScreensConfig {
  readonly slug: PracticeMenuSlug;
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
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
 * モバイルが開くのは模試（`Training`）だけ。本番（`Play`）と結果の一覧
 * （`ProblemList`）は `PracticeScreens` の契約として組んでおくが、本番の
 * 試験は合否と段級位の付与にアカウントが要るため、どの画面からもリンクしない。
 */
export function createScoreExamScreens({
  slug,
  translationNamespace,
  Board,
  Demo,
}: ScoreExamScreensConfig): PracticeScreens {
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
