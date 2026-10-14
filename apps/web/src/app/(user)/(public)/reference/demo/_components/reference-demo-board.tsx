"use client";

import { judgeAnswer } from "@mahjong-scoring/core";
import type { UserAnswer } from "@mahjong-scoring/core";
import { scoreAnswerToUserAnswer } from "@mahjong-scoring/features/results/payment-adapter";

import { QuestionDisplay } from "@/app/(user)/(public)/practice/agari-score/_components/question-display";
import { ResultDisplay } from "@/app/(user)/(public)/practice/agari-score/_components/result-display";
import { TRY_QUESTION } from "@/app/(user)/(public)/try/_lib/try-question";

/**
 * 全問正解した回答（役もすべて選んだもの）
 * サンプル回答
 *
 * 見せたいのは早見表との連動で、正誤ではない。不正解を混ぜると赤い印に目が
 * 行くため、回答はすべて正解にする。
 */
const SAMPLE_ANSWER: UserAnswer = {
  ...scoreAnswerToUserAnswer(TRY_QUESTION.answer),
  yakus: (TRY_QUESTION.yakuDetails ?? []).map((detail) => detail.name),
};

const SAMPLE_RESULT = judgeAnswer(TRY_QUESTION, SAMPLE_ANSWER);

/**
 * 早見表の連動サンプルの盤面
 * 連動サンプル盤面
 *
 * 和了形の点数計算の答え合わせと同じ部品（{@link QuestionDisplay} と
 * {@link ResultDisplay}）を、体験ページと同じ固定の 1 問
 * （{@link TRY_QUESTION}）で答え終えた状態から出す。役名を押すと役一覧、
 * 点数を押すと点数表がモーダルで開くのは本番の練習と同じ部品の振る舞いで、
 * このページ固有の仕掛けは無い。役の行を出す（`requireYaku`）のは、点数表と
 * 役一覧の両方の連動を 1 画面で見せるため。
 */
export function ReferenceDemoBoard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <QuestionDisplay question={TRY_QUESTION} mobileFrame="fullBleed" />
      <ResultDisplay
        question={TRY_QUESTION}
        userAnswer={SAMPLE_ANSWER}
        result={SAMPLE_RESULT}
        requireYaku
      />
    </div>
  );
}
