"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  generateYakuQuestion,
  judgeYakuAnswer,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { YakuQuestion } from "@mahjong-scoring/core";
import { ChallengeSubmitButton } from "../../_components/challenge-submit-button";
import { TehaiDisplay } from "../../_components/tehai-display";
import { YakuAnswerComparison } from "./yaku-answer-comparison";
import { YAKU_LIST_HEIGHT_CLASSES, YakuSelectList } from "./yaku-select-list";
import { YakuSelectedChips } from "./yaku-selected-chips";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useClientGeneratedQuestion } from "../../_hooks/use-client-generated-question";
import {
  useRegisterAdvance,
  useTrainingMode,
} from "../../_hooks/use-training-mode";
import {
  QUESTION_GENERATION_MAX_RETRIES,
  toQuestionResult,
} from "../_lib/types";
import type { YakuQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";

function generateQuestion(): YakuQuestion | undefined {
  return retryGenerate(generateYakuQuestion, QUESTION_GENERATION_MAX_RETRIES);
}

interface YakuBoardProps extends RecordingPracticeBoardProps<YakuQuestionResult> {
  /** 直前の回答が正解だったか。トレーニングの答え合わせの色に使う */
  readonly lastAnswerCorrect?: boolean;
}

/**
 * 役判定の出題盤面（手牌の提示と役の複数選択・一括判定）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 答え合わせはトレーニングでだけ、回答した問題と「わからない」で開示した問題に
 * 対して表示する。チャレンジは制限時間内に解き続ける形式で、成立していた役を
 * 出しても読む間もなく次の問題へ変わってしまうため出さない。振り返りは結果
 * ページの問題別フィードバック一覧で行う。
 */
export function YakuBoard({
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  lastAnswerCorrect,
  onAnswer,
  onRecordResult,
}: YakuBoardProps) {
  const t = useTranslations("yaku");
  const [question, setQuestion] = useClientGeneratedQuestion(generateQuestion);
  const [selectedYaku, setSelectedYaku] = useState<Set<string>>(new Set());
  const [questionIndex, setQuestionIndex] = useState(0);

  const advanceQuestion = useCallback(() => {
    setQuestion(generateQuestion());
    setSelectedYaku(new Set());
    setQuestionIndex((index) => index + 1);
  }, [setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);

  // 答え合わせはトレーニングで止まっている間だけ出す（開示・回答後のどちらでも）
  const { isRevealed, isHolding } = useTrainingMode();
  const showAnswer = isRevealed || isHolding;

  const handleToggleYaku = useCallback(
    (yakuName: string) => {
      if (showFeedback) return;
      setSelectedYaku((prev) => {
        const next = new Set(prev);
        if (next.has(yakuName)) {
          next.delete(yakuName);
        } else {
          next.add(yakuName);
        }
        return next;
      });
    },
    [showFeedback],
  );

  const handleSubmit = useCallback(() => {
    if (!question || showFeedback || selectedYaku.size === 0) return;
    const selected = [...selectedYaku];
    const isCorrect = judgeYakuAnswer(question.correctYakuNames, selected);
    onRecordResult?.(toQuestionResult(question, selected, isCorrect));
    onAnswer(isCorrect, advanceQuestion);
  }, [
    question,
    selectedYaku,
    showFeedback,
    onAnswer,
    advanceQuestion,
    onRecordResult,
  ]);

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="yaku"
      />
    );
  }

  const hasSelection = selectedYaku.size > 0;

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={question.context}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {/* Instruction */}
      <QuestionPrompt>{t("selectYaku")}</QuestionPrompt>

      {/* 回答中は一覧から選ぶ。止まって答え合わせをする間は、一覧の場所に
          結果ページの問題別フィードバックと同じ対比表を出す。枠は一覧と同じ
          高さにして、入れ替えで盤面の丈を変えない（変えると押したばかりの
          ボタンとその下が動く）。表が枠より長ければ枠の中でスクロールする */}
      {showAnswer ? (
        <div className={`overflow-y-auto ${YAKU_LIST_HEIGHT_CLASSES}`}>
          <YakuAnswerComparison
            correctYakuNames={question.correctYakuNames}
            selectedYakuNames={[...selectedYaku]}
            isCorrect={lastAnswerCorrect}
          />
        </div>
      ) : (
        <YakuSelectList
          selected={selectedYaku}
          disabled={isCountingDown || showFeedback}
          questionIndex={questionIndex}
          onToggle={handleToggleYaku}
        />
      )}

      {/* 選択中の役（一覧をスクロールすると選んだ役が視界から出るため、
          回答する直前に何を選んだのかをボタンの上で読ませる）。
          回答した瞬間はこの箱が正誤の色に光る。停止中も残す — 対比表の
          「あなたの回答」と重なるが、消すと盤面の丈がその分縮む */}
      <YakuSelectedChips
        selected={selectedYaku}
        disabled={isCountingDown || showFeedback}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        onRemove={handleToggleYaku}
      />

      {/* Submit button（チャレンジは押した瞬間に次問題へ進むため「回答する」） */}
      <ChallengeSubmitButton
        disabled={!hasSelection || showFeedback || isCountingDown}
        onClick={handleSubmit}
      >
        {isTraining ? t("checkButton") : t("answerButton")}
      </ChallengeSubmitButton>
    </div>
  );
}
