import "server-only";

import {
  generateJantouFuQuestion,
  generateMachiFuQuestion,
  generateMentsuFuQuestion,
  generateMentsuJantouFuQuestion,
  generateTotalFuQuestion,
  generateTotalFuQuestionInRange,
  generateYakuQuestion,
  generateYakuHanQuestion,
  generateScoreTableQuestion,
  generateValidScoreQuestion,
  retryGenerate,
  type YakuHanQuestion,
} from "@mahjong-scoring/core";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { resolvePracticeVariant } from "@mahjong-scoring/features/practice-menu-types";
import { SCORE_TABLE_VARIANT_OPTIONS } from "@mahjong-scoring/features/practice/score-table/variants";
import { TOTAL_FU_VARIANT_RANGES } from "@mahjong-scoring/features/practice/total-fu/variants";
import { YAKU_HAN_VARIANT_RANGES } from "@mahjong-scoring/features/practice/yaku-han/variants";
import { EXAM_GENERATE_OPTIONS as mangan } from "@mahjong-scoring/features/exam/mangan/types";
import { EXAM_GENERATE_OPTIONS as fu } from "@mahjong-scoring/features/exam/fu/types";
import { EXAM_GENERATE_OPTIONS as chiitoitsu } from "@mahjong-scoring/features/exam/chiitoitsu/types";
import { EXAM_GENERATE_OPTIONS as pinfu } from "@mahjong-scoring/features/exam/pinfu/types";
import { EXAM_GENERATE_OPTIONS as fuScore } from "@mahjong-scoring/features/exam/fu-score/types";
import { EXAM_GENERATE_OPTIONS as score } from "@mahjong-scoring/features/exam/score/types";
import type {
  ChallengeQuestion,
  ChallengeSettings,
} from "@mahjong-scoring/features/challenge/types";

/** 1 問を生成するときに練習の種類に依らず渡る文脈 */
export interface ChallengeGenerationContext {
  /** 出題設定のバリアント（未指定・不正値は各練習の既定に正規化して読む） */
  readonly variant: string;
  readonly settings: ChallengeSettings;
  /** この挑戦で既に出した問題（同じ問題を続けて出さない練習だけが読む） */
  readonly asked: readonly ChallengeQuestion[];
}

type ChallengeQuestionGenerator = (
  context: ChallengeGenerationContext,
) => ChallengeQuestion | undefined;

function isYakuHanQuestion(
  question: ChallengeQuestion,
): question is YakuHanQuestion {
  return "yakuName" in question && "correctHan" in question;
}

/** 点数計算系の生成（有効な問題が出るまで 500 回まで引き直す） */
const scoreGenerator =
  (options: Parameters<typeof generateValidScoreQuestion>[0]) => () =>
    generateValidScoreQuestion(options, 500);

/**
 * 練習の種類ごとの出題
 * チャレンジ出題表
 *
 * `PRACTICE_MENU_REGISTRY`（features）に生成関数を持たせない。生成器は
 * サーバーだけが持つ（`server-only`）もので、features のレジストリに載せると
 * モバイルのバンドルに core の生成器が丸ごと入る。表をここに置き、キーの
 * 網羅は `Record<PracticeMenuType, …>` の型で担保する（練習を足すと、ここに
 * 行を足すまで typecheck が落ちる）。
 */
export const CHALLENGE_QUESTION_GENERATORS: Readonly<
  Record<PracticeMenuType, ChallengeQuestionGenerator>
> = {
  jantou_fu: ({ settings }) => generateJantouFuQuestion(settings),
  machi_fu: () => generateMachiFuQuestion(),
  mentsu_fu: () => generateMentsuFuQuestion(),
  mentsu_jantou_fu: ({ settings }) =>
    retryGenerate(() => generateMentsuJantouFuQuestion(settings), 100),
  total_fu: ({ variant, settings }) =>
    generateTotalFuQuestionInRange(
      TOTAL_FU_VARIANT_RANGES[resolvePracticeVariant("total-fu", variant)],
      settings,
    ),
  fu_exam: () => retryGenerate(() => generateTotalFuQuestion(fu), 100),
  yaku: () => retryGenerate(generateYakuQuestion, 100),
  yaku_han: ({ variant, asked }) =>
    generateYakuHanQuestion(
      YAKU_HAN_VARIANT_RANGES[resolvePracticeVariant("yaku-han", variant)],
      asked.filter(isYakuHanQuestion),
    ),
  score_table: ({ variant }) =>
    generateScoreTableQuestion({
      ...SCORE_TABLE_VARIANT_OPTIONS[
        resolvePracticeVariant("score-table", variant)
      ],
      excludeKiriageBoundary: true,
    }),
  han_count: () => generateValidScoreQuestion(),
  mangan_exam: scoreGenerator(mangan),
  chiitoitsu_exam: scoreGenerator(chiitoitsu),
  pinfu_exam: scoreGenerator(pinfu),
  fu_score_exam: scoreGenerator(fuScore),
  score_exam: scoreGenerator(score),
  mangan_score_calculation: scoreGenerator({
    ...score,
    allowedRanges: ["manganPlus"],
  }),
  score_calculation: scoreGenerator(score),
};
