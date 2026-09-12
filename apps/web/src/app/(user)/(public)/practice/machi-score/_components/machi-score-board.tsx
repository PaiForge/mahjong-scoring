"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { allowsDoubleYakuman, isOya } from "@mahjong-scoring/core";
import type { MachiCellAnswer, UserAnswer } from "@mahjong-scoring/core";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { useYakumanRules } from "@/app/_hooks/use-rule-settings-store";
import { Button } from "@/app/(user)/_components/button";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { useIsClient } from "../../../../../_hooks/use-is-client";
import { useScrollToElement } from "../../_hooks/use-scroll-to-element";
import {
  PRACTICE_SCROLL_ANCHOR_ID,
  scrollToPracticeAnchor,
} from "../../_lib/scroll-anchor";
import { QuestionPrompt } from "../../_components/question-prompt";
import { ScoreCounter } from "../../_components/score-counter";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "../../_components/practice-footer-actions";
import {
  parseGeneratorOptionsFromParams,
  parseModeFlagsFromParams,
} from "../../score/_lib/parse-practice-params";
import { ScorePracticeAnswerForm } from "../../score/_components/score-practice-answer-form";
import { MACHI_SCORE_PRACTICE_HREF } from "../../_lib/practice-catalog";
import {
  cellKeyOf,
  listCellRefs,
  useMachiScoreStore,
} from "../_hooks/use-machi-score-store";
import { formatCellAnswer } from "../_lib/format-cell-answer";
import { MACHI_SCORE_TOUR_ID } from "../_lib/tour-ids";
import { MachiPicker } from "./machi-picker";
import { MachiScoreBoardSkeleton } from "./machi-score-board-skeleton";
import { MachiScoreResult } from "./machi-score-result";
import { MachiScoreSpotlightTour } from "./machi-score-spotlight-tour";
import { TenpaiDisplay } from "./tenpai-display";
import { WaitCellGrid } from "./wait-cell-grid";

function MachiScoreBoardInner() {
  const t = useTranslations("machiScore");
  const tScore = useTranslations("score");
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
    nextQuestion,
    revealAnswer,
  } = useMachiScoreStore();

  const isClient = useIsClient();
  const appliedQueryRef = useRef<string | undefined>(undefined);
  const allowDoubleYakuman = allowsDoubleYakuman(useYakumanRules());

  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID, Boolean(currentQuestion));

  // 出題条件の適用はクエリの変化だけで判定する（理由は総合演習の盤面と同じ:
  // 問題の有無で見ると前回の問題が残ったまま条件が無視され、マウント一度きり
  // ではクエリだけ変わる遷移に追随できず、生成失敗時には初期化が止まらない）
  useEffect(() => {
    if (!isClient) return;

    const query = searchParams.toString();
    if (appliedQueryRef.current === query) return;
    appliedQueryRef.current = query;

    const store = useMachiScoreStore.getState();
    const { allowedRanges, includeParent, includeChild, includeFuro } =
      parseGeneratorOptionsFromParams(new URLSearchParams(query));
    store.setOptions({
      allowedRanges,
      includeParent,
      includeChild,
      includeFuro,
    });
    store.resetStats();
    store.generateNewQuestion();
  }, [isClient, searchParams]);

  const { requireYaku, simplifyMangan, requireFuForMangan, autoNext } =
    parseModeFlagsFromParams(new URLSearchParams(searchParams.toString()));

  const handleBackToSetup = () => {
    toastOnArrival(MACHI_SCORE_PRACTICE_HREF, t("exitToast"));
    router.push(MACHI_SCORE_PRACTICE_HREF);
  };

  const handleNext = () => {
    scrollToPracticeAnchor();
    nextQuestion();
  };

  const handleReveal = () => {
    scrollToPracticeAnchor();
    revealAnswer();
  };

  const handleSubmitMachi = () => {
    scrollToPracticeAnchor();
    submitMachi();
  };

  const handleProceed = () => {
    scrollToPracticeAnchor();
    proceedToCells();
  };

  // 当てはめると選択が解けて回答欄が消え、下にあった「回答する」が欄の
  // 高さぶん上へ跳ぶ。押した位置に留まると表もボタンも画面外になるので、
  // 他の切り替え操作と同じく盤面の先頭へ戻す（当てはめた結果の塊と、次に
  // 押す「回答する」が表の下に見える）
  const handleAssignScore = (answer: UserAnswer) => {
    scrollToPracticeAnchor();
    assignAnswer({ kind: "score", answer });
  };

  const handleAssignNoYaku = () => {
    scrollToPracticeAnchor();
    assignAnswer({ kind: "noYaku" });
  };

  const handleSubmitCells = () => {
    scrollToPracticeAnchor();
    submitCells({
      requireYaku,
      simplifyMangan,
      requireFuForMangan,
      allowDoubleYakuman,
    });

    if (autoNext) {
      const state = useMachiScoreStore.getState();
      if (state.isAllCorrect) {
        toast.success(t("board.correct"), { duration: 1500 });
        nextQuestion();
      }
    }
  };

  if (isClient && generationFailed) {
    return (
      <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
        <PageTitle>{t("title")}</PageTitle>
        <div className="space-y-6 py-8 text-center">
          <p className="text-sm leading-relaxed text-surface-700">
            {t("board.generationFailed")}
          </p>
          <Button variant="secondary" onClick={handleBackToSetup}>
            {t("board.backToSetup")}
          </Button>
        </div>
      </ContentContainer>
    );
  }

  if (!isClient || !currentQuestion) {
    return <MachiScoreBoardSkeleton />;
  }

  const isOyaQuestion = isOya(currentQuestion.jikaze);
  const formatAnswer = (answer: MachiCellAnswer, isTsumo: boolean) =>
    formatCellAnswer(answer, {
      t: tScore,
      noYakuLabel: t("cells.noYakuShort"),
      simplifyMangan,
      allowDoubleYakuman,
      isOyaTsumo: isOyaQuestion && isTsumo,
    });

  const cells = listCellRefs(currentQuestion);
  const remaining = cells.filter(
    (cell) => !(cellKeyOf(cell) in cellAnswers),
  ).length;
  // 選択中のマスは同じ列に限られる（ストアが保証する）ので先頭で列が決まる
  const selectedIsTsumo = selectedCells[0]?.isTsumo;
  const isSelecting = selectedIsTsumo !== undefined;
  const isAnswering = phase !== "result";

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* 裏ドラは待ちを答えるまで伏せる。ツアーの対象にするため div で包む
            （盤面は <sm で負のマージンを持つので、包んだ div も同じ幅になる）。
            聴牌形の説明は待ちを読む最初の段階だけに出す。あとの段階で
            同じ説明を繰り返すと冗長なので、対象の印を外してツアーに飛ばさせる */}
        <div
          data-tour-id={
            phase === "machi" ? MACHI_SCORE_TOUR_ID.board : undefined
          }
        >
          <TenpaiDisplay
            question={currentQuestion}
            showUraDora={phase !== "machi"}
            mobileFrame="fullBleedFlushTop"
          />
        </div>

        {phase === "machi" && (
          <div className="space-y-4">
            {/* 出題文の右端にヘルプツアーの「?」を添える。説明する操作は
                この下に並ぶので、ページの見出しより入口として近い */}
            <div className="flex items-center justify-center gap-1.5">
              <QuestionPrompt
                replacement={
                  machiJudgement && (
                    <p
                      className={`text-center text-sm font-bold ${
                        machiJudgement.isCorrect
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {machiJudgement.isCorrect
                        ? t("machi.correct", {
                            count: machiJudgement.correct.length,
                          })
                        : t("machi.incorrect")}
                    </p>
                  )
                }
              >
                {t("machi.prompt")}
              </QuestionPrompt>
              <MachiScoreSpotlightTour />
            </div>

            <div data-tour-id={MACHI_SCORE_TOUR_ID.picker}>
              <MachiPicker
                selected={selectedMachi}
                onToggle={toggleMachi}
                judgement={machiJudgement}
              />
            </div>

            {/* 選択数の行は判定後も高さを残す。消すとボタンとフッターが
                判定の瞬間に上へずれる */}
            <div className="space-y-2">
              <p className="min-h-4 text-center text-xs leading-4 text-surface-500">
                {machiJudgement
                  ? ""
                  : t("machi.selectedCount", { count: selectedMachi.length })}
              </p>
              <div data-tour-id={MACHI_SCORE_TOUR_ID.machiSubmit}>
                {machiJudgement ? (
                  <Button size="lg" fullWidth onClick={handleProceed}>
                    {t("machi.proceed")}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleSubmitMachi}
                    disabled={selectedMachi.length === 0}
                  >
                    {t("machi.submit")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === "cells" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-1.5">
              <QuestionPrompt>{t("cells.prompt")}</QuestionPrompt>
              <MachiScoreSpotlightTour />
            </div>

            <WaitCellGrid
              question={currentQuestion}
              cellAnswers={cellAnswers}
              selectedCells={selectedCells}
              formatAnswer={formatAnswer}
              onToggleCell={toggleCell}
            />

            {/* 回答欄はマスを選んだときだけ見せる。選ぶ前から無効の欄を置くと
                「押すと欄が出る」という因果が見えず、何を選べば答えられるのか
                が伝わらない。選んだマスは表の色（琥珀）と塊で分かるので、
                「選択中: n マス」の見出しは持たない。ヘルプツアーは選択が無い間
                この欄を飛ばす（data-tour-id は見えている欄にだけ付ける）。
                欄は列（ツモ / ロン）ごとに 1 つずつ、1 問の間ずっと mount した
                まま hidden で出し入れする — 回答の形（支払いの形・役なしの
                有無）が列で違うため欄は分けるが、入力は当てはめるまでどの
                マスにも入っていないので、選択を解いた・別の列を押したの拍子に
                欄を作り直すと誤タップ 1 回で入力が失われる。作り直すのは
                当てはめて回答がマスに移ったとき（draftSeq）と次の問題
                （questionSeq）だけ */}
            {(["tsumo", "ron"] as const).map((column) => {
              const isTsumo = column === "tsumo";
              const isShown = selectedIsTsumo === isTsumo;
              return (
                <div
                  key={column}
                  hidden={!isShown}
                  className="rounded-lg bg-surface-50 p-4"
                  data-tour-id={
                    isShown ? MACHI_SCORE_TOUR_ID.answerForm : undefined
                  }
                >
                  <ScorePracticeAnswerForm
                    key={`${questionSeq}:${draftSeq[column]}`}
                    onSubmit={handleAssignScore}
                    isTsumo={isTsumo}
                    isOya={isOyaQuestion}
                    requireYaku={requireYaku}
                    simplifyMangan={simplifyMangan}
                    requireFuForMangan={requireFuForMangan}
                    submitLabel={t("cells.assign")}
                    // 「役なし」はロンにしか無い回答なので、ロンの欄にだけ出す。
                    // 置き場の「役」の行は常に出し、ツモとロンで高さを変えない
                    reserveYakuRow
                    noYaku={
                      isTsumo
                        ? undefined
                        : {
                            label: t("cells.noYaku"),
                            onSelect: handleAssignNoYaku,
                          }
                    }
                  />
                </div>
              );
            })}

            {/* 「回答する」はマスを選んでいる間（回答中）も押させない。
                回答中は入力の途中で、押せると入力を捨てて古い回答で答え合わせに
                進んでしまう。何をすれば押せるかを注記で言う（選択中なら当てはめ
                るか解く、未回答が残るならその数） */}
            <div className="space-y-2">
              {(isSelecting || remaining > 0) && (
                <p className="text-center text-xs text-surface-500">
                  {isSelecting
                    ? t("cells.selecting")
                    : t("cells.remaining", { count: remaining })}
                </p>
              )}
              <div data-tour-id={MACHI_SCORE_TOUR_ID.cellsSubmit}>
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleSubmitCells}
                  disabled={remaining > 0 || isSelecting}
                >
                  {t("cells.submit")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {phase === "result" && (
          <MachiScoreResult
            key={questionSeq}
            question={currentQuestion}
            machiJudgement={machiJudgement}
            cellAnswers={cellAnswers}
            cellResults={cellResults}
            formatAnswer={formatAnswer}
            requireYaku={requireYaku}
            simplifyMangan={simplifyMangan}
            requireFuForMangan={requireFuForMangan}
            onNext={handleNext}
            helpAction={<MachiScoreSpotlightTour />}
          />
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
 * 待ち別点数計算のメインボード
 * 待ち別練習ボード
 *
 * 1 問を「待ち牌を選ぶ → マスに点数を当てはめる → 答え合わせ」の 3 段階で
 * 解く。段階の状態はストア（{@link useMachiScoreStore}）が持ち、この
 * コンポーネントは段階ごとの画面を切り替えるだけ。
 */
export function MachiScoreBoard() {
  return (
    <Suspense fallback={<MachiScoreBoardSkeleton />}>
      <MachiScoreBoardInner />
    </Suspense>
  );
}
