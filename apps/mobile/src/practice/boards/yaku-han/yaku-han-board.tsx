import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  DEFAULT_YAKU_HAN_RANGE,
  generateYakuHanQuestion,
} from "@mahjong-scoring/core";
import type { YakuHanQuestion, YakuHanRange } from "@mahjong-scoring/core";
import {
  toQuestionResult,
  type YakuHanQuestionResult,
} from "@mahjong-scoring/features/practice/yaku-han/types";

import { colors, radius } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { useGeneratedQuestion } from "../../hooks/use-generated-question";
import { usePresentQuestion } from "../../hooks/use-present-question";
import { useRegisterAdvance } from "../../hooks/use-training-mode";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import { YakuHanPrompt } from "./yaku-han-prompt";

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(question: YakuHanQuestion): YakuHanQuestionResult {
  return toQuestionResult(question, undefined);
}

/**
 * 役翻数の出題盤面（役名・状態の提示と翻数入力）
 *
 * web の `YakuHanBoard` の移植。出題状態と回答ロジックを内包し、チャレンジ・
 * トレーニング両モードで共有する。
 */
export function YakuHanBoard({
  showFeedback,
  isCountingDown = false,
  range = DEFAULT_YAKU_HAN_RANGE,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<YakuHanQuestionResult> & {
  /** 出題範囲（役のフィルタ）。未指定時は全役から出題する */
  readonly range?: YakuHanRange;
}) {
  const generateQuestion = useCallback(
    (): YakuHanQuestion => generateYakuHanQuestion(range),
    [range],
  );
  const [question, nextQuestion] = useGeneratedQuestion(generateQuestion);
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setQuestionIndex((prev) => prev + 1);
  }, [nextQuestion]);

  useRegisterAdvance(advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);

  const handleSubmit = useCallback(
    (userHan: number) => {
      if (showFeedback) return;
      const result = toQuestionResult(question, userHan);
      onRecordResult?.(result);
      onAnswer(userHan === question.correctHan, advanceQuestion);
    },
    [showFeedback, question, onRecordResult, onAnswer, advanceQuestion],
  );

  return (
    <View style={styles.board}>
      {/* 出題を囲む枠。盤面では役名が白いカードの上に浮いてしまうため、
          ここで面を与える */}
      <View style={styles.promptFrame}>
        <YakuHanPrompt
          yakuName={question.yakuName}
          isMenzen={question.isMenzen}
        />
      </View>

      <YakuHanAnswerForm
        correctHan={question.correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    marginTop: 16,
    gap: 24,
  },
  promptFrame: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
});
