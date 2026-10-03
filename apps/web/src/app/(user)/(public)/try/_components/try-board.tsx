"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { isOya, judgeAnswer } from "@mahjong-scoring/core";
import type { JudgementResult, UserAnswer } from "@mahjong-scoring/core";

import { SignUpPanel } from "@/app/(user)/_components/sign-up-panel";
import { useIsClient } from "@/app/_hooks/use-is-client";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "@/app/(user)/(public)/practice/_components/practice-footer-actions";
import { QuestionPrompt } from "@/app/(user)/(public)/practice/_components/question-prompt";
import { TehaiMentsuBreakdown } from "@/app/(user)/(public)/practice/_components/tehai-mentsu-breakdown";
import { scrollToPracticeAnchor } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/score/_components/question-display";
import { ResultDisplay } from "@/app/(user)/(public)/practice/score/_components/result-display";
import { ScorePracticeAnswerForm } from "@/app/(user)/(public)/practice/score/_components/score-practice-answer-form";
import { ScoreAnswerFormSkeleton } from "@/app/(user)/(public)/practice/score/_components/score-practice-board-skeleton";

import { TRY_QUESTION } from "../_lib/try-question";

/**
 * 1 回の解答。回答せずに正解を開示したときはどちらも undefined
 * 体験解答
 */
interface TryAttempt {
  readonly userAnswer?: UserAnswer;
  readonly result?: JudgementResult;
}

/**
 * 体験ページの盤面
 * 体験盤面
 *
 * 総合演習の盤面（`ScorePracticeBoard`）と同じ部品を、固定の 1 問
 * （{@link TRY_QUESTION}）に対して並べる。違いは次の 3 点で、それ以外の
 * 見え方（盤面 → 出題文 → 回答フォーム、答え合わせでは面子分解 → 結果表）は
 * 総合演習に揃える。体験で見たものがそのまま本番の練習の姿であるため。
 *
 * - 問題を生成せず、サーバーにも聞かない。無料枠を消費しない
 * - 判定は標準ルール固定（端末ローカルのルール設定を読まない。問題側の
 *   TSDoc 参照）。回答フォームの選択肢だけはフォーム自身が設定を読むが、
 *   この手の正解には影響しない
 * - 「次の問題へ」の代わりに登録への誘導（{@link SignUpPanel}）を置く。
 *   フッターは「わからない」が、答え合わせ後は同じ位置で「もう一度解く」に
 *   替わる（並ぶ操作の数と位置を変えない）
 *
 * 回答フォームはハイドレーション後に出す（それまで同じ形のスケルトン）。
 * フォームの選択肢が端末ローカルのルール設定で変わるため、サーバーの HTML
 * と初回のクライアント描画がずれうる。盤面（手牌）は設定に依らないので
 * サーバーで描き、静的 HTML に牌姿が載る。
 */
export function TryBoard() {
  const t = useTranslations("tryDemo");
  const tScore = useTranslations("score");
  const tTraining = useTranslations("training");
  const isClient = useIsClient();

  const [attempt, setAttempt] = useState<TryAttempt | undefined>(undefined);
  // 「もう一度解く」でフォームを作り直す（入力欄を空に戻す）ための key
  const [attemptSeq, setAttemptSeq] = useState(0);
  const isAnswered = attempt !== undefined;

  // 回答・開示・やり直しのボタンはいずれも縦に長い盤面の下端にあるため、
  // 総合演習と同じく表示が切り替わる操作のたびに盤面の先頭へ戻す
  const handleSubmit = useCallback((answer: UserAnswer) => {
    scrollToPracticeAnchor();
    setAttempt({
      userAnswer: answer,
      result: judgeAnswer(TRY_QUESTION, answer),
    });
  }, []);

  const handleReveal = useCallback(() => {
    scrollToPracticeAnchor();
    setAttempt({});
  }, []);

  const handleRetry = useCallback(() => {
    scrollToPracticeAnchor();
    setAttempt(undefined);
    setAttemptSeq((seq) => seq + 1);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <QuestionDisplay
        question={TRY_QUESTION}
        mobileFrame="fullBleedFlushTop"
      />

      {isAnswered ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <TehaiMentsuBreakdown
              tehai={TRY_QUESTION.tehai}
              context={TRY_QUESTION}
            />
            <ResultDisplay
              question={TRY_QUESTION}
              userAnswer={attempt.userAnswer}
              result={attempt.result}
            />
          </div>
          <SignUpPanel
            title={t("signUp.title")}
            description={t("signUp.description")}
            cta={t("signUp.cta")}
            secondary={{ label: t("signUp.browse"), href: "/practice" }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <QuestionPrompt>{tScore("board.questionPrompt")}</QuestionPrompt>
          {isClient ? (
            <ScorePracticeAnswerForm
              key={attemptSeq}
              onSubmit={handleSubmit}
              isTsumo={TRY_QUESTION.isTsumo}
              isOya={isOya(TRY_QUESTION.jikaze)}
            />
          ) : (
            <ScoreAnswerFormSkeleton />
          )}
        </div>
      )}

      <PracticeFooterActions>
        {isAnswered ? (
          <PracticeFooterAction onClick={handleRetry}>
            {t("retry")}
          </PracticeFooterAction>
        ) : (
          <PracticeFooterAction onClick={handleReveal}>
            {tTraining("revealButton")}
          </PracticeFooterAction>
        )}
      </PracticeFooterActions>
    </div>
  );
}
