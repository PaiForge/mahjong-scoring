import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { generateMachiFuQuestion } from "@mahjong-scoring/core";
import { MACHI_FU_OPTIONS } from "@mahjong-scoring/features/practice/machi-fu/fu-options";
import {
  toQuestionResult,
  type MachiFuQuestionResult,
} from "@mahjong-scoring/features/practice/machi-fu/types";

import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { FuChoiceGrid } from "../../components/fu-choice-grid";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { useFuChoiceBoard } from "@mahjong-scoring/features/practice/use-fu-choice-board";
import { MachiFuPrompt } from "./machi-fu-prompt";

/**
 * 待ち符の出題盤面（待ち牌・和了牌の提示と 2 択）
 * 待ち符盤面
 *
 * web の `MachiFuBoard` の移植。出題状態と回答ロジックを内包し、チャレンジ・
 * トレーニング両モードで共有する。
 */
export function MachiFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<MachiFuQuestionResult>) {
  const t = useTranslations("machiFu");
  const { question, selectedFu, handleSelect } = useFuChoiceBoard({
    generateQuestion: generateMachiFuQuestion,
    options: MACHI_FU_OPTIONS,
    toResult: toQuestionResult,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  return (
    <View style={styles.board}>
      <MachiFuPrompt tiles={question.tiles} agariHai={question.agariHai} />
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
      <FuChoiceGrid
        options={MACHI_FU_OPTIONS}
        answer={question.answer}
        selectedFu={selectedFu}
        showFeedback={showFeedback}
        isCountingDown={isCountingDown}
        onSelect={handleSelect}
        columns={2}
        translationNamespace="machiFu"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 20,
  },
});
