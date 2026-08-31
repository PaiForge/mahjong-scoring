"use client";

import type { ComponentType } from "react";
import { useTranslations } from "next-intl";
import type { ScoreRange } from "@mahjong-scoring/core";
import { QuestionGeneratingPlaceholder } from "@/app/(user)/(public)/practice/_components/question-generating-placeholder";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { useScoreQuestionBoard } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import type { UseScoreQuestionBoardParams } from "@/app/(user)/(public)/practice/_hooks/use-score-question-board";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";
import type { ScoreQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { ScoreExamAnswerForm } from "../_components/score-exam-answer-form";

interface CreateScoreExamBoardConfig {
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 出題条件（各級の `_lib/types.ts` の `EXAM_GENERATE_OPTIONS`） */
  readonly generateOptions: UseScoreQuestionBoardParams["generateOptions"];
  /**
   * 回答の選択肢を固定する点数帯。`generateOptions.allowedRanges` と揃えること
   * （揃っていないと正解が選択肢に無い問題が出る）。
   */
  readonly scoreRange: ScoreRange;
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
 * 盤面はフィードバック枠で囲まずに単体で置く。ミス1回で終了する試験では正誤は
 * ライフ表示が示し、答え合わせは結果ページの問題別フィードバック一覧で行うため、
 * 盤面の外にもう一枚枠を重ねる理由がない（狭い画面では二重枠のぶん手牌も小さくなる）。
 *
 * @remarks
 * ルール設定ストア（連風牌4符・切り上げ満貫）を読まないことがこの盤面の不変条件。
 * 試験は `leaderboardKey` を分けずに全受験者のベストスコアを同じ土俵で比較するため、
 * 出題も選択肢も端末ローカルの設定に依存してはならない。各級の
 * `_lib/__tests__/exam-options.test.ts` がこのモジュールを含めて import を検査する。
 */
export function createScoreExamBoard(
  config: CreateScoreExamBoardConfig,
): ComponentType<RecordingPracticeBoardProps<ScoreQuestionResult>> {
  const { translationNamespace, generateOptions, scoreRange, maxRetries } =
    config;

  function ScoreExamBoard({
    showFeedback,
    isCountingDown = false,
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

    if (!question) {
      return <QuestionGeneratingPlaceholder label={t("generating")} />;
    }

    return (
      <div className="space-y-6">
        <QuestionDisplay question={question} mobileFrame="fullBleed" />

        <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

        <ScoreExamAnswerForm
          question={question}
          questionIndex={questionIndex}
          onSubmit={handleSubmit}
          disabled={showFeedback || isCountingDown}
          translationNamespace={translationNamespace}
          scoreRange={scoreRange}
        />
      </div>
    );
  }

  ScoreExamBoard.displayName = `ScoreExamBoard(${translationNamespace})`;

  return ScoreExamBoard;
}
