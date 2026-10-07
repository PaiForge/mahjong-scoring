"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { isOya } from "@mahjong-scoring/core";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { Button } from "@/app/(user)/_components/button";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { useScorePracticeStore } from "../_hooks/use-score-practice-store";
import type { UserAnswer } from "@mahjong-scoring/core";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { useAutoAdvanceOnCorrect } from "@/app/_hooks/use-training-settings-store";
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
import { GenerationFailedNotice } from "./generation-failed-notice";
import { ResultDisplay } from "./result-display";
import { ScoreCounter } from "../../_components/score-counter";
import { ScoreSpotlightTour } from "./score-spotlight-tour";
import { SCORE_TOUR_ID } from "../_lib/tour-ids";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "../../_components/practice-footer-actions";
import { AnswerTimeBadge } from "../../_components/answer-time-badge";
import { PracticeQuotaPaywall } from "../../_components/practice-quota-paywall";
import { PracticeQuotaRemaining } from "../../_components/practice-quota-remaining";
import {
  canResumePractice,
  usePracticeQuota,
} from "../../_hooks/use-practice-quota";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

/** 出題条件を選ぶ設定画面。「終了」で戻る先 */
const SETUP_HREF = "/practice/score";

function ScorePracticeBoardInner() {
  const t = useTranslations("score");
  const tt = useTranslations("training");
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
    revealAnswer,
  } = useScorePracticeStore();

  const isClient = useIsClient();
  const tq = useTranslations("practiceQuota");
  // 問題の生成はサーバーの許可（無料枠の消費）を挟む。生成そのものは
  // 今までどおりブラウザ側のストアが行う
  const { requestQuestion, refreshGate, isChecking, gate } = usePracticeQuota(
    "score",
    () => useScorePracticeStore.getState().generateNewQuestion(),
  );

  useEffect(() => {
    if (gate?.kind === "rateLimited") toast.error(tq("rateLimited"));
  }, [gate, tq]);
  // 出題条件を適用済みのクエリ文字列。undefined はこの盤面でまだ一度も
  // 初期化していないことを表す
  const appliedQueryRef = useRef<string | undefined>(undefined);

  // 練習開始直後（最初の問題が用意されたら）、グローバルヘッダ分のオフセットを
  // 解消して問題を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID, Boolean(currentQuestion));

  // 出題条件はストア（モジュールスコープで、ページを離れても破棄されない）へ
  // 移し替えてから問題を作る。判定を「クエリが変わったか」で行うのが要点:
  //
  // - 「問題がまだ無いか」で見ると、前回の練習の問題が残っている限り初期化が
  //   走らず、教本から `?yaku=chiitoitsu` で入っても絞り込みが無視されて
  //   前回の問題（回答済みならその結果表示）がそのまま出る。ストアを空に
  //   戻すのは設定画面の「開始」だけなので、それ以外の経路で離れると必ず踏む
  // - マウント一度きりで見ると、同じ play のままクエリだけ変える遷移
  //   （平和の練習 → 七対子の練習）で条件が入れ替わらない
  // - 逆に「問題がまだ無いか」を条件に足すと、生成失敗（generationFailed）の
  //   ときに問題が入らないまま初期化を呼び続けて止まらなくなる
  //
  // 「クエリが変わったか」は 2 段で見る。このマウントの中（ref）と、ストアに
  // 残った問題がどの条件のものか（`appliedQuery`）。後者が同じなら盤面を
  // 離れて戻ってきただけ（料金ページを見てブラウザバック等）なので、解答中の
  // 問題を引き継ぎ、無料枠を消費し直さない。引き継げる条件は
  // `canResumePractice` が決める（上限で止まっていたら聞き直す等）。
  // リロードはストアごと消えるので対象外で、これまでどおり 1 問消費する
  useEffect(() => {
    if (!isClient) return;

    const query = searchParams.toString();
    if (appliedQueryRef.current === query) return;
    appliedQueryRef.current = query;

    const store = useScorePracticeStore.getState();
    if (
      store.appliedQuery === query &&
      canResumePractice("score", {
        hasQuestion: store.currentQuestion !== undefined,
        generationFailed: store.generationFailed,
      })
    ) {
      // 残数と特典の表示だけ、離れている間の変化（購入・ログイン・日付）に
      // 追随させる。問題はそのまま
      if (store.currentQuestion) void refreshGate();
      return;
    }

    // 条件を移し、統計を戻し、前回の問題を消してから聞く。統計を戻さないと
    // 別の条件で入り直した練習の頭から前回の成績がカウンタに出たままになる。
    // 問題を消すのは、生成がサーバーの許可（無料枠の消費）を待ってから走る
    // ため — 消さないと返事が届くまで前回の問題（回答済みならその結果表示）が
    // 新しい条件の盤面に出たままになり、遅い回線では答えられる
    store.applyPracticeQuery(
      query,
      parseGeneratorOptionsFromParams(new URLSearchParams(query)),
    );
    void requestQuestion();
  }, [isClient, searchParams, requestQuestion, refreshGate]);

  const { requireYaku, simplifyMangan, requireFuForMangan, measureTime } =
    parseModeFlagsFromParams(new URLSearchParams(searchParams.toString()));
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();

  // 回答時間の計測（Pro の拡張機能）。設定のフラグだけでなく、サーバーが
  // 返した特典にも含まれているときだけ出す
  const showAnswerTime =
    measureTime &&
    gate?.kind === "open" &&
    gate.benefits.includes(PlanBenefit.PracticeTools);

  const handleBackToSetup = useCallback(() => {
    // 他の練習（challenge-shell / training-shell）の「終了」と同じく、
    // 離脱したことをトーストで知らせてから設定画面へ戻す。トーストは
    // 設定画面に着いてから出す（ここで出すと表示時間が遷移の裏で減り、
    // 視線も切り替わる本文側にあるため見落とされる）。
    // 文言はこの練習のもの — チャレンジでもトレーニングでもないため
    toastOnArrival(SETUP_HREF, t("exitToast"));
    router.push(SETUP_HREF);
  }, [router, t]);

  // 回答・開示・次へ進むのボタンはいずれも縦に長い盤面の下端にあり、押した位置の
  // ままだと手牌も結果表示も画面外に残る。他の練習（セッションフック）と同じく、
  // 表示が切り替わる操作のたびに練習の先頭へ戻す。
  const handleNext = useCallback(() => {
    scrollToPracticeAnchor();
    void requestQuestion();
  }, [requestQuestion]);

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

      if (autoAdvanceOnCorrect) {
        const state = useScorePracticeStore.getState();
        if (state.judgementResult?.isCorrect) {
          // 連続で解く練習なので既定より短く消す（見た目は GlobalToaster が持つ）
          toast.success(t("board.correct"), { duration: 1500 });
          void requestQuestion();
        }
      }
    },
    [
      submitAnswer,
      requestQuestion,
      requireYaku,
      simplifyMangan,
      requireFuForMangan,
      autoAdvanceOnCorrect,
      t,
    ],
  );

  if (isClient && generationFailed) {
    return (
      <GenerationFailedNotice
        translationNamespace="score"
        onBackToSetup={() => router.push("/practice/score")}
      />
    );
  }

  // 無料枠を使い切った。問題は生成していないので盤面ごと置き換える
  if (gate?.kind === "blocked") {
    return (
      <PracticeQuotaPaywall
        menu="score"
        translationNamespace="score"
        limit={gate.limit}
        signedIn={gate.signedIn}
        onBackToSetup={handleBackToSetup}
      />
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
          tourId={SCORE_TOUR_ID.board}
        />

        {/* Answer area（開示時は userAnswer / judgementResult なしで結果表示を出す）
            答え合わせの組み方（面子分解 → 表 を 1 組にして、その下に「次の問題へ」）
            と余白は聴牌形の点数計算の結果（MachiScoreResult）と同じにする。
            面子分解は正解開示の一部で、回答中に見せると符の答えが割れるため
            回答後にのみ出す。置き場所が手牌の直下なのは TehaiMentsuBreakdown の
            TSDoc のとおり */}
        {isAnswered ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <TehaiMentsuBreakdown
                tehai={currentQuestion.tehai}
                context={currentQuestion}
              />
              <ResultDisplay
                question={currentQuestion}
                userAnswer={userAnswer}
                result={judgementResult}
                requireYaku={requireYaku}
                simplifyMangan={simplifyMangan}
                requireFuForMangan={requireFuForMangan}
              />
            </div>
            <Button
              size="lg"
              fullWidth
              onClick={handleNext}
              disabled={isChecking}
            >
              {t("result.next")}
            </Button>
          </div>
        ) : (
          /* 出題文はフォームの見出しなので、盤面全体の余白ではなく
             フォームと近い間隔で組にする */
          <div className="space-y-4">
            {/* 出題文の右端にヘルプツアーの「?」を添える。説明する欄は
                この下に並ぶので、ページの見出しより入口として近い
                （聴牌形の点数計算と同じ置き方） */}
            <div className="flex items-center justify-center gap-1.5">
              <QuestionPrompt>{t("board.questionPrompt")}</QuestionPrompt>
              <ScoreSpotlightTour
                simplifyMangan={simplifyMangan}
                requireFuForMangan={requireFuForMangan}
              />
            </div>

            <ScorePracticeAnswerForm
              key={questionSeq}
              onSubmit={handleSubmit}
              disabled={isAnswered}
              isTsumo={currentQuestion.isTsumo}
              isOya={isOya(currentQuestion.jikaze)}
              requireYaku={requireYaku}
              simplifyMangan={simplifyMangan}
              requireFuForMangan={requireFuForMangan}
            />
          </div>
        )}

        {/* 無料枠の残りと回答時間。どちらも無いときは何も描かない */}
        {(gate?.kind === "open" || showAnswerTime) && (
          <div className="space-y-1">
            {showAnswerTime && (
              <AnswerTimeBadge key={questionSeq} running={!isAnswered} />
            )}
            <PracticeQuotaRemaining
              remaining={gate?.kind === "open" ? gate.remaining : undefined}
              showPlanLink={!isAnswered}
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

        {/* Reveal / Quit: 他の練習（training-shell）と同じく、カウンタの下に
            「わからない」→「終了する」の順で縦に並べる。回答フォームの直下に
            置くと、この練習だけ正解開示の位置が違うことになる。
            回答・開示後も消さずに無効化して残すのは、終了リンクの位置を
            動かさないため */}
        <PracticeFooterActions>
          <div data-tour-id={SCORE_TOUR_ID.reveal}>
            <PracticeFooterAction onClick={handleReveal} disabled={isAnswered}>
              {tt("revealButton")}
            </PracticeFooterAction>
          </div>
          <PracticeFooterAction onClick={handleBackToSetup}>
            {tt("exitButton")}
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
