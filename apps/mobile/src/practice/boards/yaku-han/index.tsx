import {
  PRACTICE_SLUG,
  resolvePracticeVariant,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  parseYakuHanResults,
  type YakuHanQuestionResult,
} from "@mahjong-scoring/features/practice/yaku-han/types";
import { YAKU_HAN_VARIANT_RANGES } from "@mahjong-scoring/features/practice/yaku-han/variants";

import {
  createChallengePlayView,
  createTrainingView,
} from "../../create-practice-views";
import type { PracticeScreens } from "../../practice-screens";
import { YakuHanBoard } from "./yaku-han-board";
import { YakuHanHowToPlay } from "./yaku-han-how-to-play";
import { YakuHanProblemList } from "./yaku-han-problem-list";

/** バリアント（正規化済み）から出題範囲を引く */
function rangeOf(variant: string) {
  return YAKU_HAN_VARIANT_RANGES[
    resolvePracticeVariant(PRACTICE_SLUG.yakuHan, variant)
  ];
}

/** 役の翻数の画面一式 */
export const yakuHanScreens: PracticeScreens = {
  Play: createChallengePlayView<YakuHanQuestionResult>({
    slug: PRACTICE_SLUG.yakuHan,
    renderBoard: (args, props) => (
      <YakuHanBoard
        showFeedback={args.showFeedback}
        isCountingDown={args.isCountingDown}
        range={rangeOf(props.variant)}
        onAnswer={args.onAnswer}
        onRecordResult={args.recordResult}
        onPresentQuestion={args.presentQuestion}
      />
    ),
  }),
  Training: createTrainingView({
    slug: PRACTICE_SLUG.yakuHan,
    renderBoard: (args, props) => (
      <YakuHanBoard
        showFeedback={args.showFeedback}
        range={rangeOf(props.variant)}
        onAnswer={args.onAnswer}
      />
    ),
  }),
  Demo: YakuHanHowToPlay,
  ProblemList: ({ results }) => (
    <YakuHanProblemList results={parseYakuHanResults(results)} />
  ),
};
