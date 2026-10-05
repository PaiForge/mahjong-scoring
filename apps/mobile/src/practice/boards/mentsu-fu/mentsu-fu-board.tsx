import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { generateMentsuFuQuestion } from "@mahjong-scoring/core";
import type { MentsuFuQuestion } from "@mahjong-scoring/core";
import { FU_OPTIONS } from "@mahjong-scoring/features/practice/fu-options";
import {
  toQuestionResult,
  type MentsuFuQuestionResult,
} from "@mahjong-scoring/features/practice/mentsu-fu/types";

import { FuroTiles } from "../../../board/furo-tiles";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { FuChoiceGrid } from "../../components/fu-choice-grid";
import { PromptLabel } from "../../components/prompt-label";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { useFuChoiceBoard } from "../../hooks/use-fu-choice-board";

/**
 * 面子符の出題盤面（面子の提示と符の選択）
 * 面子符盤面
 *
 * web の `MentsuFuBoard` の移植。出題状態と回答ロジックを内包し、チャレンジ・
 * トレーニング両モードで共有する。web は md の副露を 1.5 倍に拡大しているが、
 * 横倒しの牌を含む槓子でも画面幅に収まるよう lg の牌で描く。
 */
export function MentsuFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<MentsuFuQuestionResult>) {
  const t = useTranslations("mentsuFu");
  const recordResult = useCallback(
    (question: MentsuFuQuestion, fu: number) =>
      onRecordResult?.(toQuestionResult(question, fu)),
    [onRecordResult],
  );
  const presentQuestion = useCallback(
    (question: MentsuFuQuestion) =>
      onPresentQuestion?.(toQuestionResult(question, undefined)),
    [onPresentQuestion],
  );
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMentsuFuQuestion,
    options: FU_OPTIONS,
    showFeedback,
    onAnswer,
    onRecordResult: recordResult,
    onPresentQuestion: presentQuestion,
  });

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  return (
    <View style={styles.board}>
      <View style={styles.mentsu}>
        <PromptLabel>{t("mentsuLabel")}</PromptLabel>
        <View style={styles.tiles}>
          <FuroTiles
            mentsu={question.mentsu}
            furo={question.mentsu.furo}
            size="lg"
          />
        </View>
      </View>
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
      <FuChoiceGrid
        options={FU_OPTIONS}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columns={3}
        translationNamespace="mentsuFu"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 20,
  },
  mentsu: {
    alignItems: "center",
    gap: 16,
  },
  tiles: {
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
