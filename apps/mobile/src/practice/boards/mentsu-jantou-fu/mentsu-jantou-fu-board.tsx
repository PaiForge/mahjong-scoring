import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { findAgariHighlight } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";
import { type MentsuJantouFuQuestionResult } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";

import { TehaiDisplay } from "../../../board/tehai-display";
import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { FuItemRow } from "./fu-item-row";
import { useMentsuJantouFuBoard } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/use-mentsu-jantou-fu-board";

/** 行ごとに選んだ符（未選択の行は undefined） */
/**
 * 面子と雀頭の符の出題盤面（手牌の提示と要素ごとの入力・一括判定）
 * 面子雀頭符盤面
 *
 * web の `MentsuJantouFuBoard` の移植。出題状態と回答ロジック（全行が埋まった
 * 時点で送る）は `useMentsuJantouFuBoard` が持ち、チャレンジ・トレーニング両モードで
 * 共有する。
 */
export function MentsuJantouFuBoard({
  showFeedback,
  isCountingDown = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: RecordingPracticeBoardProps<MentsuJantouFuQuestionResult>) {
  const t = useTranslations("mentsuJantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const { question, answers, isRevealed, handleSelect } =
    useMentsuJantouFuBoard({
      renfonpaiAs4Fu,
      showFeedback,
      onAnswer,
      onRecordResult,
      onPresentQuestion,
    });

  if (!question) {
    return <QuestionPlaceholder label={t("generating")} />;
  }

  const agariHighlight = findAgariHighlight(
    question.items,
    question.context.agariHai,
  );
  return (
    <View style={styles.board}>
      <TehaiDisplay tehai={question.tehai} context={question.context} />
      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>
      <View style={styles.items}>
        {question.items.map((item, i) => (
          <FuItemRow
            key={item.id}
            index={i}
            item={item}
            answer={answers[i]}
            showFeedback={showFeedback}
            isRevealed={isRevealed}
            isCountingDown={isCountingDown}
            highlightedTileIndex={
              agariHighlight?.itemId === item.id
                ? agariHighlight.tileIndex
                : undefined
            }
            onSelect={handleSelect}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 16,
  },
  items: {
    gap: 8,
  },
});
