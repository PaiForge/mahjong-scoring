"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { useAutoAdvanceOnCorrect } from "@/app/_hooks/use-training-settings-store";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { useScrollToElement } from "../../_hooks/use-scroll-to-element";
import {
  PRACTICE_SCROLL_ANCHOR_ID,
  scrollToPracticeAnchor,
} from "../../_lib/scroll-anchor";
import { ScoreCounter } from "../../_components/score-counter";
import { AnswerTimeBadge } from "../../_components/answer-time-badge";
import { PracticeQuotaPaywall } from "../../_components/practice-quota-paywall";
import { PracticeQuotaRemaining } from "../../_components/practice-quota-remaining";
import { usePracticeQuota } from "../../_hooks/use-practice-quota";
import { showsAnswerTime } from "@mahjong-scoring/features/quota/gate";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "../../_components/practice-footer-actions";
import { parseModeFlagsFromParams } from "../../agari-score/_lib/parse-practice-params";
import { GenerationFailedNotice } from "../../agari-score/_components/generation-failed-notice";
import { TENPAI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";
import { useTenpaiScoreStore } from "../_hooks/use-tenpai-score-store";
import { useTenpaiScoreQuery } from "../_hooks/use-tenpai-score-query";
import { cellAnswerFormatters } from "@mahjong-scoring/features/practice/tenpai-score/format-cell-answer";
import { TENPAI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import { TenpaiScoreBoardSkeleton } from "./tenpai-score-board-skeleton";
import { HandPresentationNotice } from "../../_components/hand-presentation-notice";
import { HandPresentationProvider } from "../../_components/hand-presentation-provider";
import { TenpaiCellsPhase } from "./tenpai-cells-phase";
import { TenpaiMachiPhase } from "./tenpai-machi-phase";
import { TenpaiScoreResult } from "./tenpai-score-result";
import { TenpaiDisplay } from "./tenpai-display";

function TenpaiScoreBoardInner() {
  const t = useTranslations("tenpaiScore");
  const tScore = useTranslations("agariScore");
  const tt = useTranslations("training");
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentQuestion,
    phase,
    generationFailed,
    questionSeq,
    draftSeq,
    selectedMachi,
    machiJudgement,
    selectedCells,
    cellAnswers,
    cellResults,
    stats,
    toggleMachi,
    submitMachi,
    proceedToCells,
    toggleCell,
    assignAnswer,
    submitCells,
    revealAnswer,
  } = useTenpaiScoreStore();

  const isClient = useIsClient();
  const tq = useTranslations("practiceQuota");
  const { requestQuestion, refreshGate, isChecking, gate } = usePracticeQuota(
    "tenpai-score",
    () => useTenpaiScoreStore.getState().generateNewQuestion(),
  );

  useEffect(() => {
    if (gate?.kind === "rateLimited") toast.error(tq("rateLimited"));
  }, [gate, tq]);
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  // 問題ができるのを待たずに送る（理由は agari-score-board と同じ）
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);
  useTenpaiScoreQuery({ isClient, searchParams, requestQuestion, refreshGate });

  const { measureTime, ...modeFlags } = parseModeFlagsFromParams(
    new URLSearchParams(searchParams.toString()),
  );
  const autoAdvanceOnCorrect = useAutoAdvanceOnCorrect();
  const showAnswerTime = showsAnswerTime(measureTime, gate);

  const handleBackToSetup = () => {
    toastOnArrival(TENPAI_SCORE_PRACTICE_HREF, t("exitToast"));
    router.push(TENPAI_SCORE_PRACTICE_HREF);
  };

  const handleNext = () => {
    if (isChecking) return;
    scrollToPracticeAnchor();
    void requestQuestion();
  };

  const handleReveal = () => {
    scrollToPracticeAnchor();
    revealAnswer();
  };

  const handleSubmitCells = () => {
    submitCells({ ...modeFlags, allowDoubleYakuman });
    if (autoAdvanceOnCorrect && useTenpaiScoreStore.getState().isAllCorrect) {
      toast.success(t("board.correct"), { duration: 1500 });
      void requestQuestion();
    }
  };

  if (isClient && generationFailed) {
    return (
      <GenerationFailedNotice
        translationNamespace="tenpaiScore"
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  if (gate?.kind === "blocked") {
    return (
      <PracticeQuotaPaywall
        menu="tenpai-score"
        translationNamespace="tenpaiScore"
        limit={gate.limit}
        signedIn={gate.signedIn}
        onBackToSetup={handleBackToSetup}
      />
    );
  }

  if (!isClient || !currentQuestion) {
    return <TenpaiScoreBoardSkeleton />;
  }

  const isOyaQuestion = isOya(currentQuestion.jikaze);
  const { formatAnswer, formatAnswerLines } = cellAnswerFormatters({
    t: tScore,
    noYakuLabel: t("cells.noYakuShort"),
    exactHan: modeFlags.exactHan,
    allowDoubleYakuman,
    isOya: isOyaQuestion,
  });
  const isAnswering = phase !== "result";

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>
      <HandPresentationNotice />

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* 裏ドラは待ちを答えるまで伏せる。
            聴牌形の説明は待ちを読む最初の段階だけに出す。あとの段階で
            同じ説明を繰り返すと冗長なので、対象の印を外してツアーに飛ばさせる */}
        <TenpaiDisplay
          question={currentQuestion}
          showUraDora={phase !== "machi"}
          mobileFrame="fullBleedFlushTop"
          tourId={phase === "machi" ? TENPAI_SCORE_TOUR_ID.board : undefined}
        />

        {phase === "machi" && (
          <TenpaiMachiPhase
            selectedMachi={selectedMachi}
            machiJudgement={machiJudgement}
            requireHanFu={modeFlags.requireHanFu}
            onToggle={toggleMachi}
            onSubmit={submitMachi}
            onProceed={proceedToCells}
          />
        )}

        {phase === "cells" && (
          <TenpaiCellsPhase
            question={currentQuestion}
            cellAnswers={cellAnswers}
            selectedCells={selectedCells}
            questionSeq={questionSeq}
            draftSeq={draftSeq}
            modeFlags={modeFlags}
            isOya={isOyaQuestion}
            formatAnswer={formatAnswer}
            onToggleCell={toggleCell}
            onAssign={assignAnswer}
            onSubmit={handleSubmitCells}
          />
        )}

        {phase === "result" && (
          <TenpaiScoreResult
            key={questionSeq}
            question={currentQuestion}
            selectedMachi={selectedMachi}
            machiJudgement={machiJudgement}
            cellAnswers={cellAnswers}
            cellResults={cellResults}
            formatAnswerLines={formatAnswerLines}
            {...modeFlags}
            onNext={handleNext}
          />
        )}

        {(gate?.kind === "open" || showAnswerTime) && (
          <div className="space-y-1">
            {showAnswerTime && (
              <AnswerTimeBadge key={questionSeq} running={isAnswering} />
            )}
            <PracticeQuotaRemaining
              remaining={gate?.kind === "open" ? gate.remaining : undefined}
              showPlanLink={phase === "machi" && !machiJudgement}
            />
          </div>
        )}

        <ScoreCounter
          correct={stats.correct}
          incorrect={stats.total - stats.correct}
          correctLabel={t("board.correctLabel")}
          incorrectLabel={t("board.incorrectLabel")}
        />

        <PracticeFooterActions>
          <PracticeFooterAction onClick={handleReveal} disabled={!isAnswering}>
            {tt("revealButton")}
          </PracticeFooterAction>
          <PracticeFooterAction onClick={handleBackToSetup}>
            {tt("exitButton")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}

/**
 * 聴牌形の点数計算のメインボード
 * 聴牌形練習ボード
 *
 * 1 問を「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の 3 段階で
 * 解く。段階の状態はストア（{@link useTenpaiScoreStore}）が持ち、この
 * コンポーネントは段階ごとの画面を切り替えるだけ。
 */
export function TenpaiScoreBoard() {
  return (
    <Suspense fallback={<TenpaiScoreBoardSkeleton />}>
      {/* 手牌の見せ方が決まるまで盤面をマウントしない。出題の開始・再開の
          判定（クエリの適用・回数制限のゲート）は盤面の effect のまま */}
      <HandPresentationProvider fallback={<TenpaiScoreBoardSkeleton />}>
        <TenpaiScoreBoardInner />
      </HandPresentationProvider>
    </Suspense>
  );
}
