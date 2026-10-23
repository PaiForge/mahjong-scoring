"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "./question-generating-placeholder";
import { QuestionPrompt } from "./question-prompt";
import { RevealedScoreQuestionAnswer } from "./revealed-score-answer";
import { TehaiMentsuBreakdown } from "./tehai-mentsu-breakdown";
import { AnswerReviewPanel } from "./answer-review-panel";
import { ScoreBreakdownPanel } from "./score-breakdown-panel";
import { hasMentsuBreakdown } from "@mahjong-scoring/features/board/mentsu-breakdown";
import {
  buildScoreAnswerBreakdown,
  hasScoreAnswerBreakdown,
} from "@mahjong-scoring/features/results/score-answer-breakdown";
import { scoreTableFocusOfQuestion } from "@mahjong-scoring/features/score-table/focus";
import { ScoreChallengeAnswerForm } from "./score-challenge-answer-form";
import {
  useScoreQuestionBoard,
  type UseScoreQuestionBoardParams,
} from "@mahjong-scoring/features/practice/use-score-question-board";
import { useTrainingAnswerVisibility } from "@mahjong-scoring/features/practice/use-training-mode";
import { QuestionDisplay } from "../agari-score/_components/question-display";
import type { ScoreOptionRange } from "@mahjong-scoring/features/practice/score/get-available-scores";
import type { PlayBoardHeight } from "../_lib/board-area-height";
import type { ScoreQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
import type { RecordingPracticeBoardProps } from "@mahjong-scoring/features/practice/board-props";

interface ScoreCalculationQuestionBoardProps extends RecordingPracticeBoardProps<ScoreQuestionResult> {
  /** 出題オプション（再生成のたびに使用するため安定参照を渡すこと） */
  readonly generateOptions: UseScoreQuestionBoardParams["generateOptions"];
  /** 生成中表示・問題文・回答欄の文言を引く辞書の namespace */
  readonly translationNamespace: string;
  /** 生成中プレースホルダの高さ（`loading.tsx` のフォールバックと同値にする） */
  readonly boardHeight: PlayBoardHeight;
  /** 回答欄に並べる点数の範囲（省略時は全範囲） */
  readonly scoreRange?: ScoreOptionRange;
  /** 手牌の直下（問題文の上）に出題の一部として添える材料（役一覧等） */
  readonly renderQuestionSupplement?: (question: ScoreQuestion) => ReactNode;
  /**
   * 役一覧を与件として出す練習か（`renderQuestionSupplement` で役一覧を添える
   * 満貫以上の点数計算）。トレーニングの答え合わせから翻数の内訳を落とし、
   * 符の内訳だけを出す（与件の役一覧と同じ表を 2 度出さない）
   */
  readonly yakuGiven?: boolean;
}

/**
 * 手牌を見て点数を答える出題盤面（手牌の提示と点数の回答）
 * 点数計算盤面
 *
 * 点数計算・満貫以上点数計算の練習で共有する。違いは出題条件
 * （`generateOptions`）・回答欄の点数の範囲・手牌に添える材料と、それが
 * 役一覧なら答え合わせの内訳から翻数を落とすこと（`yakuGiven`）だけで、
 * 画面の構図と答え合わせの出し方は同じ。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。回答直後の正誤は、回答した select 自身の枠と地の色が返す
 * （選択肢を持つ練習が選択肢ボタンを染めるのと同じ配色・同じタイミング）。
 */
export function ScoreCalculationQuestionBoard({
  generateOptions,
  translationNamespace,
  boardHeight,
  scoreRange,
  renderQuestionSupplement,
  yakuGiven = false,
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: ScoreCalculationQuestionBoardProps) {
  const t = useTranslations(translationNamespace);
  const tBreakdown = useTranslations("challenge.yakuBreakdown");

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
    onPresentQuestion,
  });
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、select の色が正誤を示している
  const { showAnswer, showBreakdown } =
    useTrainingAnswerVisibility(lastAnswerCorrect);

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight={boardHeight}
      />
    );
  }

  const breakdown = buildScoreAnswerBreakdown(question, tBreakdown, {
    yakuGiven,
  });

  return (
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay
        question={question}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      {renderQuestionSupplement?.(question)}

      <QuestionPrompt
        replacement={
          showAnswer ? (
            <RevealedScoreQuestionAnswer
              question={question}
              translationNamespace={translationNamespace}
            />
          ) : undefined
        }
      >
        {t("questionPrompt")}
      </QuestionPrompt>

      {/* Answer form */}
      <ScoreChallengeAnswerForm
        question={question}
        questionIndex={questionIndex}
        onSubmit={handleSubmit}
        disabled={showFeedback || isCountingDown}
        showFeedback={showFeedback}
        lastAnswerCorrect={lastAnswerCorrect}
        translationNamespace={translationNamespace}
        scoreRange={scoreRange}
        isTraining={isTraining}
      />

      {/* 面子分解と内訳は正解開示の一部。回答中に見せると符や待ちの答えが
          割れるため止まっている間だけ、1 枚の面（AnswerReviewPanel）に入れて
          出す（結果ページの問題詳細・模試の答え合わせと同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため。
          面の直下にシェルの「次の問題へ」が続くので、枠で境目を付ける。
          正解の点数だけでは「点数表の引き間違い」と「翻数・符の数え間違い」を
          切り分けられないので、符と翻数の内訳を 1 つの入口から切り替えて
          出す。符は 4 翻以下だけ（符で満貫に届いた手は出し、5 翻以上は符が
          点数に効かないので出さない）。役一覧が与件の練習では翻数を出さない。
          問題ごとに作り直して閉じた状態へ戻す。面子分解を持たない手（七対子・
          国士無双）で内訳も無ければ面ごと出さない（空の枠を置かない） */}
      {showBreakdown &&
        (hasMentsuBreakdown(question.tehai, question) ||
          hasScoreAnswerBreakdown(breakdown)) && (
          <AnswerReviewPanel>
            <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
            <ScoreBreakdownPanel
              key={questionIndex}
              {...breakdown}
              scoreTableFocus={scoreTableFocusOfQuestion(question)}
              surface="sunken"
            />
          </AnswerReviewPanel>
        )}
    </div>
  );
}
