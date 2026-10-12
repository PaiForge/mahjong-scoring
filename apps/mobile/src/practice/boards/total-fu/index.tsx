import { useCallback, useMemo } from "react";
import {
  generateTotalFuQuestionInRange,
  totalFuChoices,
} from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  parseFuQuestionResults,
  type TotalFuQuestionResult,
} from "@mahjong-scoring/features/practice/total-fu/types";
import { TOTAL_FU_VARIANT_RANGES } from "@mahjong-scoring/features/practice/total-fu/variants";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { FuProblemList } from "../../components/fu-problem-list";
import { TotalFuQuestionBoard } from "../../components/total-fu-question-board";
import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";

/** 手牌の合計符の盤面（web の `TotalFuBoard`）。`variant` は出題範囲のバリアント */
function TotalFuBoard({
  variant,
  ...props
}: RecordingPracticeBoardProps<TotalFuQuestionResult> & {
  readonly variant: string;
}) {
  const range =
    TOTAL_FU_VARIANT_RANGES[
      resolvePracticeVariant(PRACTICE_SLUG.totalFu, variant)
    ];
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generateQuestion = useCallback(
    () => generateTotalFuQuestionInRange(range, { renfonpaiAs4Fu }),
    [range, renfonpaiAs4Fu],
  );
  const options = useMemo(() => totalFuChoices(range), [range]);
  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateQuestion}
      options={options}
      translationNamespace="totalFu"
    />
  );
}

/** 手牌の合計符の画面一式 */
export const totalFuScreens: PracticeScreens = {
  Play: createChallengePlayView<TotalFuQuestionResult>({
    slug: PRACTICE_SLUG.totalFu,
    renderBoard: (args, props) => (
      <TotalFuBoard
        variant={props.variant}
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.totalFu,
    renderBoard: (args, props) => (
      <TotalFuBoard
        variant={props.variant}
        showFeedback={args.showFeedback}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: () => (
    <TotalFuBoard
      variant="all"
      showFeedback={false}
      onAnswer={() => undefined}
    />
  ),
  ProblemList: ({ results }) => (
    <FuProblemList
      results={parseFuQuestionResults(results)}
      translationNamespace="totalFu"
    />
  ),
};
