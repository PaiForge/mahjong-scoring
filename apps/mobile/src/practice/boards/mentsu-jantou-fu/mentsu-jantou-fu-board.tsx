import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  generateMentsuJantouFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { MentsuJantouFuQuestion } from "@mahjong-scoring/core";
import { findAgariHighlight } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/find-agari-highlight";
import {
  toQuestionResult,
  type MentsuJantouFuQuestionResult,
} from "@mahjong-scoring/features/practice/mentsu-jantou-fu/types";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { TehaiDisplay } from "../../../board/tehai-display";
import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";
import type { RecordingPracticeBoardProps } from "../../board-props";
import { QuestionPlaceholder } from "../../components/question-placeholder";
import { QuestionPrompt } from "../../components/question-prompt";
import { useGeneratedQuestion } from "../../hooks/use-generated-question";
import { usePresentQuestion } from "../../hooks/use-present-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "@mahjong-scoring/features/practice/use-training-mode";
import { FuItemRow } from "./fu-item-row";

/** 行ごとに選んだ符（未選択の行は undefined） */
type RowAnswers = readonly (number | undefined)[];

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: MentsuJantouFuQuestion,
): MentsuJantouFuQuestionResult {
  return toQuestionResult(question, undefined);
}

/**
 * 面子と雀頭の符の出題盤面（手牌の提示と要素ごとの入力・一括判定）
 * 面子雀頭符盤面
 *
 * web の `MentsuJantouFuBoard` の移植。出題状態と回答ロジックを内包し、
 * チャレンジ・トレーニング両モードで共有する。
 *
 * 最後の要素を選んだ時点で送信し、「回答する」ボタンは置かない。各行は
 * 単一選択で行数は出題が決めるため「全行が埋まった」という完成点が盤面から
 * 決まる。全行が埋まるまで無効なボタンは、有効になった瞬間に押す以外の
 * 使い道が無く、制限時間の中では 1 タップがそのまま持ち時間を削る。
 * 最後に触った行がそのまま確定になるので、埋め終えてからの見直しはできない
 * （単一選択の盤面が 1 タップで確定するのと同じ割り切り）。
 *
 * モバイルは記録を持たないため、web のサーバー採点を通さず手元で採点する。
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
  const generate = useCallback(
    (): MentsuJantouFuQuestion | undefined =>
      retryGenerate(() => generateMentsuJantouFuQuestion({ renfonpaiAs4Fu })),
    [renfonpaiAs4Fu],
  );
  const [question, nextQuestion] = useGeneratedQuestion(generate);
  const [answers, setAnswers] = useState<RowAnswers>([]);

  const advanceQuestion = useCallback(() => {
    nextQuestion();
    setAnswers([]);
  }, [nextQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);
  const { isRevealed } = useTrainingMode();

  const submit = useCallback(
    (answered: MentsuJantouFuQuestion, userFuList: readonly number[]) => {
      const result = toQuestionResult(answered, userFuList);
      onRecordResult?.(result);
      onAnswer(result.outcome === AnswerOutcome.Correct, advanceQuestion);
    },
    [onRecordResult, onAnswer, advanceQuestion],
  );

  const handleSelect = useCallback(
    (index: number, value: number) => {
      if (!question || showFeedback) return;
      const next = question.items.map((_, i) =>
        i === index ? value : answers[i],
      );
      setAnswers(next);
      const filled = next.filter((fu) => fu !== undefined);
      if (filled.length === question.items.length) submit(question, filled);
    },
    [question, answers, showFeedback, submit],
  );

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
