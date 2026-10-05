"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_YAKU_HAN_RANGE } from "@mahjong-scoring/core";
import type { YakuHanRange } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { YakuHanPrompt } from "./yaku-han-prompt";
import { YakuHanAnswerForm } from "./yaku-han-answer-form";
import type { YakuHanQuestionResult } from "@mahjong-scoring/features/practice/yaku-han/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useYakuHanBoard } from "@mahjong-scoring/features/practice/yaku-han/use-yaku-han-board";

interface YakuHanBoardProps extends RecordingPracticeBoardProps<YakuHanQuestionResult> {
  /** 出題範囲（役のフィルタ）。未指定時は全役から出題する */
  readonly range?: YakuHanRange;
}

/**
 * 役翻数の出題盤面（役名・状態の提示と翻数入力）
 *
 * 出題状態と回答ロジックは `useYakuHanBoard` が持ち、チャレンジ・トレーニング両モードで共有する。
 */
export function YakuHanBoard({
  showFeedback,
  isCountingDown = false,
  range = DEFAULT_YAKU_HAN_RANGE,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: YakuHanBoardProps) {
  const t = useTranslations("yakuHanChallenge");
  const { question, questionIndex, handleSubmit } = useYakuHanBoard({
    range,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="yakuHan"
      />
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* 出題を囲む枠。盤面では役名が白いカードの上に浮いてしまうため、
          ここで面を与える（デモは「問題方式」セクションの枠が面になるため
          持たせない） */}
      <div className="rounded-xl border-3 border-ink bg-white py-8">
        <YakuHanPrompt
          yakuName={question.yakuName}
          isMenzen={question.isMenzen}
        />
      </div>

      <YakuHanAnswerForm
        correctHan={question.correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />
    </div>
  );
}
