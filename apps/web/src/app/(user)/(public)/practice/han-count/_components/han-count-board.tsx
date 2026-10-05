"use client";

import { tehaiContextOf } from "@mahjong-scoring/features/board/score-question-context";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { useTranslations } from "next-intl";
import type { useGeneratedScoreQuestion } from "@mahjong-scoring/features/practice/use-generated-score-question";
import { TehaiDisplay } from "../../_components/tehai-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { HanBreakdown } from "./han-breakdown";
import { HanCountAnswerForm } from "./han-count-answer-form";
import type { HanCountQuestionResult } from "@mahjong-scoring/features/practice/han-count/types";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";
import { useHanCountAnswer } from "@mahjong-scoring/features/practice/han-count/use-han-count-answer";

/**
 * 出題状態（{@link useGeneratedScoreQuestion} の戻り値）
 *
 * チャレンジ・トレーニングどちらのビューも同じ形の状態を作って渡す。
 */
export type HanCountQuestionState = ReturnType<
  typeof useGeneratedScoreQuestion
>;

type HanCountBoardProps = RecordingPracticeBoardProps<HanCountQuestionResult> &
  HanCountQuestionState;

/**
 * 翻数即答の出題盤面（手牌の提示と翻数入力）
 *
 * 回答ロジックは `useHanCountAnswer` が持ち、チャレンジ・トレーニング両モードで共有する。
 *
 * トレーニングの答え合わせでは、選択肢の下に翻数の内訳（{@link HanBreakdown}）を
 * 足す。正解の翻数が緑に染まるだけでは、どの役を数え落としたのかが分からず
 * 次も同じ間違いをする。時間制限のあるチャレンジには出さない — 読ませている
 * 間もタイマーが進むうえ、内訳は結果ページの問題別詳細が引き受ける。
 *
 * 置き場所は選択肢グリッドの下で、閉じた状態から始める。手牌も選択肢の色も
 * 動かさないまま下に 1 行増えるだけで済み、開いても伸びるのは下方向だけ
 * （読んでいる最中に読んでいるものが動かない）。開閉の見た目と操作は結果ページの
 * 問題別詳細と同じ ▶ で、内訳を見る操作が画面によって変わらない。
 */
export function HanCountBoard({
  question,
  questionIndex,
  advanceQuestion,
  showFeedback,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: HanCountBoardProps) {
  const t = useTranslations("hanCountChallenge");
  const { handleSubmit, correctHan, showBreakdown } = useHanCountAnswer({
    question,
    advanceQuestion,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="hanCount"
      />
    );
  }

  return (
    <div className="space-y-4">
      <TehaiDisplay
        tehai={question.tehai}
        context={tehaiContextOf(question)}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <HanCountAnswerForm
        correctHan={correctHan}
        questionIndex={questionIndex}
        showFeedback={showFeedback}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
      />

      {/* 面子分解は正解開示の一部。回答中に見せると符や待ちの答えが割れるため
          止まっている間だけ出す（結果ページの問題詳細と同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showBreakdown && (
        <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
      )}

      {showBreakdown && (
        <HanBreakdown
          yakuDetails={question.yakuDetails ?? []}
          correctHan={correctHan}
        />
      )}
    </div>
  );
}
