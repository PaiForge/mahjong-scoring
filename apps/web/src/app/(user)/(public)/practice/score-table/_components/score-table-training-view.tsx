"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useTrainingSession } from "../../_hooks/use-training-session";
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
 * 「わからない」自体はファクトリの `useBoardState` / `advanceOf` で扱える
 * ようになったが、この練習は出題条件を URL クエリから読む（`useSearchParams`）。
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
    handleAnswer,
    reveal,
    proceed,
  } = useTrainingSession();
  const generatorOptions = useScoreTableGeneratorOptions();
  const { question, advance } = useScoreTableQuestion(generatorOptions);

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref={EXIT_HREF}
      onReveal={() => {
        if (question !== undefined) reveal(advance);
      }}
      revealDisabled={showFeedback || question === undefined}
      isRevealed={isRevealed}
      onProceed={proceed}
    >
      {question === undefined ? (
        <ScoreTableGeneratingPlaceholder />
      ) : (
        <ScoreTableBoard
          question={question}
          onAdvance={advance}
          showFeedback={showFeedback}
          lastAnswerCorrect={lastAnswerCorrect}
          isRevealed={isRevealed}
          onAnswer={handleAnswer}
        />
      )}
    </TrainingShell>
  );
}

/**
 * 出題条件の読み出し前に出すシェル
 *
 * 「わからない」は盤面の `advance` に依存するため本体の外へ出せない。そのため
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
