import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { ScoreTableQuestion } from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@mahjong-scoring/features/practice-menu-types";
import { type ScoreTableQuestionResult } from "@mahjong-scoring/features/practice/score-table/types";

import { borderWidth, radius } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { feedbackFrameStyle } from "../../feedback-styles";
import { ScoreTableAnswerForm } from "./score-table-answer-form";
import { ScoreTablePrompt } from "./score-table-prompt";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import { scoreTableGeneratorOptions } from "@mahjong-scoring/features/practice/score-table/variants";
import { useScoreTableAnswer } from "@mahjong-scoring/features/practice/score-table/use-score-table-answer";
import { useScoreTableQuestion } from "@mahjong-scoring/features/practice/score-table/use-score-table-question";

interface ScoreTableBoardProps extends RecordingPracticeBoardProps<ScoreTableQuestionResult> {
  /** 現在の問題 */
  readonly question: ScoreTableQuestion;
  /** 次の問題へ進む（回答後の遷移に使用） */
  readonly onAdvance: () => void;
}

/**
 * 点数表早引きの出題盤面（条件の提示と点数の回答）
 *
 * web の `ScoreTableBoard` の移植。出題状態は呼び出し側
 * （{@link ScoreTableVariantBoard}）が保持し、本コンポーネントは与えられた
 * 問題の提示と回答判定のみを行う。チャレンジ・トレーニング両モードで共有する。
 * 自前の枠を持たない出題なので、出題を囲む枠が正誤の色を返す。
 */
export function ScoreTableBoard({
  question,
  onAdvance,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreTableBoardProps) {
  const { handleSubmit, showAnswer } = useScoreTableAnswer({
    question,
    onAdvance,
    showFeedback,
    lastAnswerCorrect,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  return (
    <View style={styles.board}>
      <View
        style={[
          styles.frame,
          feedbackFrameStyle(showFeedback, lastAnswerCorrect),
        ]}
      >
        <ScoreTablePrompt
          isOya={question.isOya}
          isTsumo={question.isTsumo}
          han={question.han}
          fu={question.fu}
          revealedAnswer={showAnswer ? question.correctAnswer : undefined}
        />
      </View>

      <ScoreTableAnswerForm
        question={question}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        isTraining={isTraining}
      />
    </View>
  );
}

/**
 * バリアント（出題条件）で出題状態を持つ盤面
 *
 * web の `ScoreTableBoardFromQuery`（と手書きのトレーニングビュー）に当たる。
 * web は URL のバリアントを読むために出題状態をビュー側へ引き上げているが、
 * モバイルはバリアントを props で受け取るので、ここで出題状態を持つ。
 */
export function ScoreTableVariantBoard({
  variant,
  ...props
}: RecordingPracticeBoardProps<ScoreTableQuestionResult> & {
  readonly variant: PracticeVariantOf<"score-table">;
}) {
  const t = useTranslations("scoreTableChallenge");
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const isTraining = props.isTraining ?? false;
  const generatorOptions = useMemo(
    () => scoreTableGeneratorOptions(variant, { kiriageMangan, isTraining }),
    [variant, kiriageMangan, isTraining],
  );
  const { question, advance } = useScoreTableQuestion(generatorOptions);
  if (!question) return <QuestionPlaceholder label={t("generating")} />;
  return <ScoreTableBoard {...props} question={question} onAdvance={advance} />;
}

const styles = StyleSheet.create({
  board: {
    marginTop: 24,
    gap: 24,
  },
  frame: {
    borderWidth: borderWidth.panel,
    borderRadius: radius.xl,
    padding: 24,
  },
});
