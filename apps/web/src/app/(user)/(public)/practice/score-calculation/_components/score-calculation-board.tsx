"use client";

import { isOya } from "@mahjong-scoring/core";
import { useMemo } from "react";
import { QuestionGeneratingPlaceholder } from "../../_components/question-generating-placeholder";
import { QuestionPrompt } from "../../_components/question-prompt";
import { useTranslations } from "next-intl";
import {
  useRuleSettingsStore,
  useYakumanRules,
} from "@/app/_hooks/use-rule-settings-store";
import { RevealedScoreAnswer } from "../../_components/revealed-score-answer";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";
import { scoreTableFocusOf } from "../../_lib/score-table-focus";
import { useScoreQuestionBoard } from "../../_hooks/use-score-question-board";
import { useTrainingAnswerVisibility } from "../../_hooks/use-training-mode";
import { QuestionDisplay } from "../../score/_components/question-display";
import { ScoreChallengeAnswerForm } from "../../_components/score-challenge-answer-form";
import type { ScoreCalculationQuestionResult } from "../_lib/types";
import type { RecordingPracticeBoardProps } from "../../_lib/practice-board-props";
import { ruleBoundaryExclusions } from "../../_lib/rule-boundary";

type ScoreCalculationBoardProps =
  RecordingPracticeBoardProps<ScoreCalculationQuestionResult>;

/**
 * 点数計算の出題盤面（手牌の提示と点数の回答）
 *
 * 出題状態と回答ロジックを内包し、チャレンジ・トレーニング両モードで共有する。
 *
 * 盤面は他の練習（`HanCountBoard` 等）と同じく、フィードバック枠で囲まずに
 * 単体で置く。囲むと盤面自身の枠と二重になり、狭い画面ではそのぶん手牌が
 * 小さくなる。回答直後の正誤は、回答した select 自身の枠と地の色が返す
 * （選択肢を持つ練習が選択肢ボタンを染めるのと同じ配色・同じタイミング）。
 */
export function ScoreCalculationBoard({
  showFeedback,
  lastAnswerCorrect,
  isCountingDown = false,
  isTraining = false,
  onAnswer,
  onRecordResult,
}: ScoreCalculationBoardProps) {
  const t = useTranslations("scoreCalculationChallenge");
  const renfonpaiAs4Fu = useRuleSettingsStore((s) => s.renfonpaiAs4Fu);
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  const yakumanRules = useYakumanRules();
  // チャレンジ（記録あり）では、ルール設定の採否で正解が割れる手を出題から
  // 落とす（理由は `_lib/rule-boundary.ts`）
  const generateOptions = useMemo(
    () => ({
      renfonpaiAs4Fu,
      kiriageMangan,
      yakumanRules,
      ...ruleBoundaryExclusions(isTraining),
    }),
    [renfonpaiAs4Fu, kiriageMangan, yakumanRules, isTraining],
  );

  const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
    generateOptions,
    showFeedback,
    onAnswer,
    onRecordResult,
  });
  // トレーニングでは開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
  // 正解のときは出さない — 選んだ値がそのまま正解で、select の色が正誤を示している
  const { showAnswer, showBreakdown } =
    useTrainingAnswerVisibility(lastAnswerCorrect);

  if (!question) {
    return (
      <QuestionGeneratingPlaceholder
        label={t("generating")}
        boardHeight="scoreCalculation"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Question display */}
      <QuestionDisplay
        question={question}
        mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
      />

      <QuestionPrompt
        replacement={
          showAnswer ? (
            <RevealedScoreAnswer
              answer={paymentToScoreTableAnswer(question.answer.payment)}
              translationNamespace="scoreCalculationChallenge"
              scoreTableFocus={scoreTableFocusOf({
                isOya: isOya(question.jikaze),
                isTsumo: question.isTsumo,
                han: question.answer.han,
                fu: question.answer.fu,
              })}
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
        translationNamespace="scoreCalculationChallenge"
        isTraining={isTraining}
      />

      {/* 面子分解は正解開示の一部。回答中に見せると符や待ちの答えが割れるため
          止まっている間だけ出す（結果ページの問題詳細と同じ材料）。置き場所が
          手牌の直下ではなく末尾なのは、開示の瞬間に回答欄を動かさないため */}
      {showBreakdown && (
        <TehaiMentsuBreakdown tehai={question.tehai} context={question} />
      )}
    </div>
  );
}
