"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateMentsuJantouFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { MentsuJantouFuQuestion } from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import { TehaiDisplay } from "../../_components/tehai-display";
import { findAgariHighlight } from "../_lib/find-agari-highlight";
import { toQuestionResult } from "../_lib/types";
import type { MentsuJantouFuQuestionResult } from "../_lib/types";
import { FuItemRow } from "./fu-item-row";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(
  renfonpaiAs4Fu: boolean,
): MentsuJantouFuQuestion | undefined {
  return retryGenerate(() =>
    generateMentsuJantouFuQuestion({ renfonpaiAs4Fu }),
  );
}

type MentsuJantouFuBoardProps =
  RecordingPracticeBoardProps<MentsuJantouFuQuestionResult>;

/**
 * 面子と雀頭の符の出題盤面（手牌の提示と要素ごとの入力・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 最後の要素を選んだ時点で送信し、「回答する」ボタンは置かない。各行は
 * 単一選択で行数は出題が決めるため「全行が埋まった」という完成点が盤面から
 * 決まり、子ツモの点数（「子から / 親から」の 2 つが揃ったら送信。
 * {@link import("../../_components/score-answer-form").ScoreAnswerForm} の
 * `autoSubmit`）と同じ構造になる。全行が埋まるまで無効なボタンは、有効に
 * なった瞬間に押す以外の使い道が無く、制限時間の中では同じ答えをもう一度
 * 言う 1 タップがそのまま持ち時間を削る。
 *
 * 最後に触った行がそのまま確定になるので、埋め終えてからの見直しはできない。
 * 単一選択の盤面（雀頭符・面子符・待ち符・合計符・翻数即答）が 1 タップで
 * 確定するのと同じ割り切りで、直したい行は最後の行を選ぶ前に直す。
 *
 * 役判定だけは「回答する」ボタンが残る。成立する役の個数は出題ごとに違い
 * 解く側にも分からないため、「全部選んだ」という完成点が盤面から決まらない。
 */
export function MentsuJantouFuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: MentsuJantouFuBoardProps) {
  const t = useTranslations("mentsuJantouFu");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const generate = useCallback(
    () => generateQuestion(renfonpaiAs4Fu),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useClientGeneratedQuestion(generate);
  const [answers, setAnswers] = useState<string[]>(() => new Array(5).fill(""));
  const [tileScale, setTileScale] = useState(1);

  const advanceQuestion = useCallback(() => {
    const q = generate();
    setQuestion(q);
    setAnswers(q ? new Array(q.items.length).fill("") : []);
  }, [generate, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  const { isRevealed } = useTrainingMode();

  const submit = useCallback(
    (answered: MentsuJantouFuQuestion, filled: readonly string[]) => {
      const userFuList = answered.items.map((_, idx) => parseInt(filled[idx]));
      const allCorrect = answered.items.every(
        (item, idx) => userFuList[idx] === item.fu,
      );
      onRecordResult?.(toQuestionResult(answered, userFuList));
      onAnswer(allCorrect, advanceQuestion);
    },
    [onAnswer, advanceQuestion, onRecordResult],
  );

  // 選んだ結果を先に確定してから「全行が埋まったか」を見る。関数型の更新に
  // 送信を混ぜると StrictMode の二重呼び出しで 2 回送ることになる
  const handleSelect = useCallback(
    (idx: number, value: string) => {
      if (!question || showFeedback) return;
      const next = answers.map((a, i) => (i === idx ? value : a));
      setAnswers(next);
      if (question.items.every((_, i) => next[i] !== ""))
        submit(question, next);
    },
    [question, answers, showFeedback, submit],
  );

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="mentsuJantouFu"
      />
    );
  }

  const agariHighlight = findAgariHighlight(
    question.items,
    question.context.agariHai,
  );
  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        onScaleChange={setTileScale}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* Item list */}
      <div className="space-y-2">
        {question.items.map((item, idx) => (
          <FuItemRow
            key={item.id}
            index={idx}
            item={item}
            answer={answers[idx]}
            showFeedback={showFeedback}
            isRevealed={isRevealed}
            isCountingDown={isCountingDown}
            highlightedTileIndex={
              agariHighlight?.itemId === item.id
                ? agariHighlight.tileIndex
                : undefined
            }
            onSelect={handleSelect}
            tileScale={tileScale}
          />
        ))}
      </div>
    </div>
  );
}
