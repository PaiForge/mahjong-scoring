import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { DEFAULT_YAKU_HAN_RANGE } from "@mahjong-scoring/core";
import type { YakuHanRange } from "@mahjong-scoring/core";
import { type YakuHanQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";

import { colors, radius } from "../../../lib/theme";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { useYakuHanBoard } from "@mahjong-scoring/features/practice/yaku-han/use-yaku-han-board";

/**
 * 役翻数の出題盤面（役名・状態の提示と翻数入力）
 *
 * web の `YakuHanBoard` の移植。出題状態と回答ロジックは `useYakuHanBoard` が持ち、チャレンジ・
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
  const t = useTranslations("yakuHanChallenge");
  const { question, questionIndex, handleSubmit } = useYakuHanBoard({
    range,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) return <QuestionPlaceholder label={t("generating")} />;

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
