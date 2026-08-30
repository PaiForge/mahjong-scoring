"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
import { TrainingModeProvider } from "../../_hooks/use-training-mode";
import { TrainingShell } from "../../_components/training-shell";
import { ScoreTableBoard } from "./score-table-board";
import { ScoreTableGeneratingPlaceholder } from "./score-table-generating-placeholder";
import { useScoreTableGeneratorOptions } from "../_hooks/use-score-table-query-selection";
import { useScoreTableQuestion } from "../_hooks/use-score-table-question";

/** シェルの体裁を揃えるための定数（本体とフォールバックで共有する） */
const EXIT_HREF = "/practice/score-table";

/**
 * このビューだけ createTrainingView を使わずに手書きしている。
 *
 * この練習は出題条件を URL クエリから読む（`useSearchParams`）。
 * 状態を引き上げるとビュー全体が Suspense 境界の内側に入り、フォールバック
 * 側でもシェルを描いてプリレンダー HTML に見出し・終了リンクを残す必要が
 * あるため、境界の外殻ごとここで組み立てている。
 */
function ScoreTableTrainingViewInner() {
  const t = useTranslations("scoreTableChallenge");
  const {
    correctCount,
    totalCount,
    showFeedback,
    lastAnswerCorrect,
    isRevealed,
    isHolding,
    handleAnswer,
    reveal,
    proceed,
  } = useTrainingSession();
  const generatorOptions = useScoreTableGeneratorOptions();
  const { question, advance } = useScoreTableQuestion(generatorOptions);

  // 盤面から登録される「次へ進む」操作（ファクトリ版と同じ配線）
  const [registeredAdvance, setRegisteredAdvance] = useState<
    (() => void) | undefined
  >(undefined);
  const registerAdvance = useCallback(
    (next: (() => void) | undefined) => setRegisteredAdvance(() => next),
    [],
  );
  const trainingMode = useMemo(
    () => ({ isRevealed, isHolding, registerAdvance }),
    [isRevealed, isHolding, registerAdvance],
  );

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref={EXIT_HREF}
      onReveal={() => {
        if (registeredAdvance) reveal(registeredAdvance);
      }}
      revealDisabled={showFeedback || registeredAdvance === undefined}
      isRevealed={isRevealed}
      isHolding={isHolding}
      onProceed={proceed}
    >
      <TrainingModeProvider value={trainingMode}>
        {question === undefined ? (
          <ScoreTableGeneratingPlaceholder />
        ) : (
          <ScoreTableBoard
            question={question}
            onAdvance={advance}
            showFeedback={showFeedback}
            lastAnswerCorrect={lastAnswerCorrect}
            onAnswer={handleAnswer}
          />
        )}
      </TrainingModeProvider>
    </TrainingShell>
  );
}

/**
 * 出題条件の読み出し前に出すシェル
 *
 * 「わからない」は盤面が登録する操作に依存するため本体の外へ出せない。そのため
 * ビュー全体が境界の内側になり、フォールバックでもシェルを描いて
 * プリレンダー HTML に見出し・スコア表示・終了リンクを残す。
 */
function ScoreTableTrainingFallback() {
  const t = useTranslations("scoreTableChallenge");
  return (
    <TrainingShell
      title={t("title")}
      correctCount={0}
      totalCount={0}
      exitHref={EXIT_HREF}
    >
      <ScoreTableGeneratingPlaceholder />
    </TrainingShell>
  );
}

export function ScoreTableTrainingView() {
  return (
    <Suspense fallback={<ScoreTableTrainingFallback />}>
      <ScoreTableTrainingViewInner />
    </Suspense>
  );
}
