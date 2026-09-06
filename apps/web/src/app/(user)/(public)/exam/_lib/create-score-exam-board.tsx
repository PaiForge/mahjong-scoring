"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { RevealedScoreAnswer } from "@/app/(user)/(public)/practice/_components/revealed-score-answer";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import type { UseScoreQuestionBoardParams } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import { useTrainingMode } from "@/app/(user)/(public)/practice/_hooks/use-training-mode";
import { paymentToScoreTableAnswer } from "@/app/(user)/(public)/practice/_lib/payment-adapter";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";
import type { ScoreQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import type { ScoreOptionRange } from "@/app/(user)/(public)/practice/score/_lib/get-available-scores";
import { ScoreExamAnswerForm } from "../_components/score-exam-answer-form";

interface CreateScoreExamBoardConfig {
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 出題条件（各級の `_lib/types.ts` の `EXAM_GENERATE_OPTIONS`） */
  readonly generateOptions: UseScoreQuestionBoardParams["generateOptions"];
  /**
   * 回答の選択肢を固定する範囲。`generateOptions.allowedRanges` と揃えること
   * （揃っていないと正解が選択肢に無い問題が出る）。点数帯を絞らない出題は
   * `"all"` を渡す。
   */
  readonly scoreRange: ScoreOptionRange;
  /**
   * 生成の最大試行回数。成立率が低い出題条件（平和・満貫以上）だけが上書きする。
   * 省略時は `useScoreQuestionBoard` の既定値。
   */
  readonly maxRetries?: number;
}

/**
 * 昇級試験（点数計算）の出題盤面を生成するファクトリー関数
 * 昇級試験盤面生成
 *
 * 級ごとに違うのは出題条件・点数帯・翻訳名前空間だけで、手牌の提示から回答
 * フォームまでの構図は共通なので、盤面そのものはここ 1 箇所で組む。各級の
 * `_components/<級>-exam-board.tsx` はこの関数を呼ぶだけになり、そのファイルの
 * TSDoc が「その級で何を測っているか」を書く場所になる。
 *
 * どの級も役一覧を表示しない。受験者が手牌から翻数（級によっては符も）を自力で
 * 数えるのが試験の要件であり、役を出すと最初の判断を肩代わりしてしまうため。
 *
 * 盤面はフィードバック枠で囲まずに単体で置く。盤面が自前で枠を持つため二重枠に
 * なり、狭い画面ではそのぶん手牌が小さくなる。正誤は回答した select 自身の枠と
 * 地の色が返し（{@link ScoreExamAnswerForm} 参照）、選択肢を持つ試験（符）が
 * 選択肢ボタンを染めるのと同じ配色・同じタイミングになる。本番の試験では正解
 * そのものは出さず、答え合わせは結果ページの問題別フィードバック一覧で行う。
 *
 * 同じ盤面を模試（`/exam/<級>/training`。時間無制限・記録なしのトレーニング）
 * でも描く。模試では回答後の停止中と「わからない」の開示中に正解の点数を
 * 出題の直下に出す（練習の点数計算ドリルと同じ答え合わせ）。出題条件・
 * 選択肢は本番と同じで、違うのは答え合わせの有無だけ。
 *
 * @remarks
 * ルール設定ストア（連風牌4符・切り上げ満貫）を読まないことがこの盤面の不変条件。
 * 合格ラインは全受験者に同じ 1 本で、出題も選択肢も端末ローカルの設定に
 * 依存してはならない（設定を変えた端末で有利にも不利にもならないこと）。模試も
 * 本番と同じ問題・同じ選択肢で解けることに意味があるため、この不変条件は
 * 模試でも崩さない。各級の `_lib/__tests__/exam-options.test.ts` がこのモジュールを
 * 含めて import を検査する。
 */
export function createScoreExamBoard(
  config: CreateScoreExamBoardConfig,
): ComponentType<RecordingPracticeBoardProps<ScoreQuestionResult>> {
  const { translationNamespace, generateOptions, scoreRange, maxRetries } =
    config;

  function ScoreExamBoard({
    showFeedback,
    lastAnswerCorrect,
    isCountingDown = false,
    isTraining = false,
    onAnswer,
    onRecordResult,
  }: RecordingPracticeBoardProps<ScoreQuestionResult>) {
    const t = useTranslations(translationNamespace);

    const { question, questionIndex, handleSubmit } = useScoreQuestionBoard({
      generateOptions,
      maxRetries,
      showFeedback,
      onAnswer,
      onRecordResult,
    });
    // 模試では開示時だけでなく回答後の停止中も正解を出す（答え合わせ用）。
    // 本番の試験ではどちらも立たない（トレーニングのビューだけが提供する）
    const { isRevealed, isHolding } = useTrainingMode();
    const showAnswer = isRevealed || isHolding;

    if (!question) {
      // 出来上がった盤面と同じ高さで待つ（`loading.tsx` のフォールバックと同値）
      return (
        <QuestionGeneratingPlaceholder
          label={t("generating")}
          boardHeight="scoreExam"
        />
      );
    }

    return (
      <div className="space-y-6">
        <QuestionDisplay
          question={question}
          mobileFrame={isTraining ? "fullBleedFlushTop" : "fullBleed"}
        />

        {showAnswer && (
          <RevealedScoreAnswer
            answer={paymentToScoreTableAnswer(question.answer.payment)}
            translationNamespace={translationNamespace}
          />
        )}

        <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

        <ScoreExamAnswerForm
          question={question}
          questionIndex={questionIndex}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
          showFeedback={showFeedback}
          lastAnswerCorrect={lastAnswerCorrect}
          translationNamespace={translationNamespace}
          scoreRange={scoreRange}
        />
      </div>
    );
  }

  ScoreExamBoard.displayName = `ScoreExamBoard(${translationNamespace})`;

  return ScoreExamBoard;
}
