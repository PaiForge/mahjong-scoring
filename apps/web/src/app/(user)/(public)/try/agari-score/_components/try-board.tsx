"use client";

import { useCallback, useState, type ReactNode } from "react";
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
import { useScrollToElement } from "@/app/(user)/(public)/practice/_hooks/use-scroll-to-element";
import {
  PRACTICE_SCROLL_ANCHOR_ID,
  scrollToPracticeAnchor,
} from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { QuestionDisplay } from "@/app/(user)/(public)/practice/agari-score/_components/question-display";
import { ResultDisplay } from "@/app/(user)/(public)/practice/agari-score/_components/result-display";
import { ScorePracticeAnswerForm } from "@/app/(user)/(public)/practice/agari-score/_components/score-practice-answer-form";
import { ScoreAnswerFormSkeleton } from "@/app/(user)/(public)/practice/agari-score/_components/agari-score-board-skeleton";

import { TRY_QUESTION } from "../_lib/try-question";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

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
 * 和了形の点数計算の盤面（`AgariScoreBoard`）と同じ部品を、固定の 1 問
 * （{@link TRY_QUESTION}）に対して並べる。違いは次の 3 点で、それ以外の
 * 見え方（盤面 → 出題文 → 回答フォーム、答え合わせでは面子分解 → 結果表）は
 * 和了形の点数計算に揃える。体験で見たものがそのまま本番の練習の姿であるため。
 *
 * - 問題を生成せず、サーバーにも聞かない。無料枠を消費しない
 * - 判定は標準ルール固定（端末ローカルのルール設定を読まない。問題側の
 *   TSDoc 参照）。回答フォームの選択肢だけはフォーム自身が設定を読むが、
 *   この手の正解には影響しない
 * - 「次の問題へ」の代わりに登録への誘導（{@link SignUpPanel}）を置く。
 *   フッターの「わからない」は解く前だけ出す。答え合わせのあとは解き直しを
 *   置かず、行き先（`afterAnswer` のホームへ戻るリンクと練習の入口）だけを残す
 *   — 同じ 1 問を解き直しても新しく分かることは無い
 *
 * 回答フォームはハイドレーション後に出す（それまで同じ形のスケルトン）。
 * フォームの選択肢が端末ローカルのルール設定で変わるため、サーバーの HTML
 * と初回のクライアント描画がずれうる。盤面（手牌）は設定に依らないので
 * サーバーで描き、静的 HTML に牌姿が載る。
 */
export function TryBoard({
  afterAnswer,
}: {
  /**
   * 答え合わせのあとにだけ、フッターの下へ出す導線（ホームへ戻るリンクと
   * 練習の入口）。解く前に練習のカードが並ぶと、体験の 1 問より先に目に入る。
   * サーバーコンポーネントを渡すため、ページから要素で受け取る
   */
  readonly afterAnswer?: ReactNode;
} = {}) {
  const t = useTranslations("tryDemo");
  const tScore = useTranslations("agariScore");
  const tTraining = useTranslations("training");
  const isClient = useIsClient();

  const [attempt, setAttempt] = useState<TryAttempt | undefined>(undefined);
  const isAnswered = attempt !== undefined;

  // 開いた直後にグローバルヘッダとタイトル帯を画面外へ送り、盤面を最上部に
  // 出す（練習の play 画面と同じ）。はじめ方ガイドからのリンクはハッシュ付き
  // だが、最初に描くフレームの位置を決めるのはこの hook で、直接開いたときも
  // 同じ。ハッシュは Next の遷移時のスクロールを同じ要素へ向ける補助
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  // 回答・開示のボタンはいずれも縦に長い盤面の下端にあるため、
  // 和了形の点数計算と同じく表示が切り替わる操作のたびに盤面の先頭へ戻す
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

  return (
    <>
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
              secondary={{ label: t("signUp.browse"), href: PRACTICE_PATH }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <QuestionPrompt>{tScore("board.questionPrompt")}</QuestionPrompt>
            {isClient ? (
              <ScorePracticeAnswerForm
                onSubmit={handleSubmit}
                isTsumo={TRY_QUESTION.isTsumo}
                isOya={isOya(TRY_QUESTION.jikaze)}
                autoSubmit
              />
            ) : (
              <ScoreAnswerFormSkeleton />
            )}
          </div>
        )}

        {!isAnswered && (
          <PracticeFooterActions>
            <PracticeFooterAction onClick={handleReveal}>
              {tTraining("revealButton")}
            </PracticeFooterAction>
          </PracticeFooterActions>
        )}
      </div>
      {isAnswered && afterAnswer}
    </>
  );
}
