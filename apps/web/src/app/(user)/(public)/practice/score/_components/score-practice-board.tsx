"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isOya } from "@mahjong-scoring/core";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { Button } from "@/app/(user)/_components/button";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { useScorePracticeStore } from "../_hooks/use-score-practice-store";
import type { UserAnswer } from "@mahjong-scoring/core";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { useScrollToElement } from "../../_hooks/use-scroll-to-element";
import {
  PRACTICE_SCROLL_ANCHOR_ID,
  scrollToPracticeAnchor,
} from "../../_lib/scroll-anchor";
import {
  parseGeneratorOptionsFromParams,
  parseModeFlagsFromParams,
} from "../_lib/parse-practice-params";
import { QuestionDisplay } from "./question-display";
import { TehaiMentsuBreakdown } from "../../_components/tehai-mentsu-breakdown";
import { QuestionPrompt } from "../../_components/question-prompt";
import { ScorePracticeAnswerForm } from "./score-practice-answer-form";
import { ScorePracticeBoardSkeleton } from "./score-practice-board-skeleton";
import { ResultDisplay } from "./result-display";
import { ScoreCounter } from "../../_components/score-counter";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "../../_components/practice-footer-actions";

/** 正解トーストの表示スタイル */
function ScorePracticeBoardInner() {
  const t = useTranslations("score");
  const tc = useTranslations("challenge");
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentQuestion,
    userAnswer,
    judgementResult,
    isAnswered,
    generationFailed,
    questionSeq,
    stats,
    submitAnswer,
    nextQuestion,
    revealAnswer,
  } = useScorePracticeStore();

  const isClient = useIsClient();
  // 出題条件を適用済みのクエリ文字列。undefined はこの盤面でまだ一度も
  // 初期化していないことを表す
  const appliedQueryRef = useRef<string | undefined>(undefined);

  // 練習開始直後（最初の問題が用意されたら）、グローバルヘッダ分のオフセットを
  // 解消して問題を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID, Boolean(currentQuestion));

  // 出題条件はストア（モジュールスコープで、ページを離れても破棄されない）へ
  // 移し替えてから問題を作る。判定を「クエリが変わったか」だけで行うのが要点:
  //
  // - 「問題がまだ無いか」で見ると、前回の練習の問題が残っている限り初期化が
  //   走らず、教本から `?yaku=chiitoitsu` で入っても絞り込みが無視されて
  //   前回の問題（回答済みならその結果表示）がそのまま出る。ストアを空に
  //   戻すのは設定画面の「開始」だけなので、それ以外の経路で離れると必ず踏む
  // - マウント一度きりで見ると、同じ play のままクエリだけ変える遷移
  //   （平和の練習 → 七対子の練習）で条件が入れ替わらない
  // - 逆に「問題がまだ無いか」を条件に足すと、生成失敗（generationFailed）の
  //   ときに問題が入らないまま初期化を呼び続けて止まらなくなる
  useEffect(() => {
    if (!isClient) return;

    const query = searchParams.toString();
    if (appliedQueryRef.current === query) return;
    appliedQueryRef.current = query;

    const store = useScorePracticeStore.getState();
    store.setOptions(
      parseGeneratorOptionsFromParams(new URLSearchParams(query)),
    );
    // 統計も同じストアに載っている。ここで戻さないと、別の条件で入り直した
    // 練習の頭から前回の成績がカウンタに出たままになる
    store.resetStats();
    store.generateNewQuestion();
  }, [isClient, searchParams]);

  const { requireYaku, simplifyMangan, requireFuForMangan, autoNext } =
    parseModeFlagsFromParams(new URLSearchParams(searchParams.toString()));

  const handleBackToSetup = useCallback(() => {
    // 他の練習（challenge-shell / training-shell）の「終了」と同じく、
    // 離脱したことをトーストで知らせてから設定画面へ戻す。
    toast(tc("quit.toast"));
    router.push("/practice/score");
  }, [router, tc]);

  // 回答・開示・次へ進むのボタンはいずれも縦に長い盤面の下端にあり、押した位置の
  // ままだと手牌も結果表示も画面外に残る。他の練習（セッションフック）と同じく、
  // 表示が切り替わる操作のたびに練習の先頭へ戻す。
  const handleNext = useCallback(() => {
    scrollToPracticeAnchor();
    nextQuestion();
  }, [nextQuestion]);

  // 「わからない」: 無回答のまま正解を開示する（統計には入らない）。
  // 旧仕様のスキップ（開示なしで次問題へ）は、開示後の「次の問題へ」連打で代替できる
  const handleReveal = useCallback(() => {
    scrollToPracticeAnchor();
    revealAnswer();
  }, [revealAnswer]);

  const handleSubmit = useCallback(
    (answer: UserAnswer) => {
      scrollToPracticeAnchor();
      submitAnswer(answer, requireYaku, simplifyMangan, requireFuForMangan);

      if (autoNext) {
        const state = useScorePracticeStore.getState();
        if (state.judgementResult?.isCorrect) {
          // 連続で解く練習なので既定より短く消す（見た目は GlobalToaster が持つ）
          toast.success(t("board.correct"), { duration: 1500 });
          nextQuestion();
        }
      }
    },
    [
      submitAnswer,
      nextQuestion,
      requireYaku,
      simplifyMangan,
      requireFuForMangan,
      autoNext,
      t,
    ],
  );

  // 生成失敗: リトライを使い切っても出題条件に合う手牌を作れなかった。
  // このときスケルトンを出し続けると操作手段が無いまま固まる（終了ボタンも
  // 盤面の一部なので描かれない）ため、条件を変えて戻る導線を明示する。
  if (isClient && generationFailed) {
    return (
      <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
        <PageTitle>{t("title")}</PageTitle>
        <div className="space-y-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-surface-700">
            {t("board.generationFailed")}
          </p>
          <Button
            variant="secondary"
            onClick={() => router.push("/practice/score")}
          >
            {t("board.backToSetup")}
          </Button>
        </div>
      </ContentContainer>
    );
  }

  // クライアントマウント前・問題生成前はどちらも本体と同形のスケルトンを表示し、
  // 実コンテンツへの差し替え時にレイアウトシフト（CLS）が起きないようにする。
  if (!isClient || !currentQuestion) {
    return <ScorePracticeBoardSkeleton />;
  }

  return (
    // fillViewport はスクロール先をタイトル帯ではなくカード領域（本文）に置く。
    // 他の練習（challenge-shell / training-shell）と同じく、開始時も回答・開示・
    // 次へのたびに盤面が画面最上部へ来る（タイトルはスクロールで画面外へ送る）。
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>

      {/* 要素間の余白を ContentContainer カードのパディング（p-4 sm:p-6 md:p-8）と同じ
          レスポンシブ値に揃え、最終要素である「終了する」の上下余白を均等にする。 */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Question */}
        {/* 盤面はカードの先頭。タイトル帯との間に白帯が出ないよう上も詰める */}
        <QuestionDisplay
          question={currentQuestion}
          mobileFrame="fullBleedFlushTop"
        />

        {/* 面子分解は正解開示の一部。回答中に見せると符の答えが割れるため、
            回答後にのみ手牌の直下へ出す */}
        {isAnswered && (
          <TehaiMentsuBreakdown
            tehai={currentQuestion.tehai}
            context={currentQuestion}
          />
        )}

        {/* Answer area（開示時は userAnswer / judgementResult なしで結果表示を出す） */}
        {isAnswered ? (
          <ResultDisplay
            question={currentQuestion}
            userAnswer={userAnswer}
            result={judgementResult}
            onNext={handleNext}
            requireYaku={requireYaku}
            simplifyMangan={simplifyMangan}
            requireFuForMangan={requireFuForMangan}
          />
        ) : (
          /* 出題文はフォームの見出しなので、盤面全体の余白ではなく
             フォームと近い間隔で組にする */
          <div className="space-y-4">
            <QuestionPrompt>{t("board.questionPrompt")}</QuestionPrompt>

            <ScorePracticeAnswerForm
              key={questionSeq}
              onSubmit={handleSubmit}
              disabled={isAnswered}
              isTsumo={currentQuestion.isTsumo}
              isOya={isOya(currentQuestion.jikaze)}
              requireYaku={requireYaku}
              simplifyMangan={simplifyMangan}
              requireFuForMangan={requireFuForMangan}
              onReveal={handleReveal}
            />
          </div>
        )}

        {/* Footer: 正解 / 不正解 カウンタ（旧・上部の "0 / 0" を移設） */}
        <ScoreCounter
          correct={stats.correct}
          incorrect={stats.total - stats.correct}
          correctLabel={t("board.correctLabel")}
          incorrectLabel={t("board.incorrectLabel")}
        />

        {/* Quit button */}
        <PracticeFooterActions>
          <PracticeFooterAction onClick={handleBackToSetup}>
            {tc("quitButton")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}

/**
 * 点数計算練習のメインボード
 * 練習ボード
 */
export function ScorePracticeBoard() {
  return (
    <Suspense fallback={<ScorePracticeBoardSkeleton />}>
      <ScorePracticeBoardInner />
    </Suspense>
  );
}
