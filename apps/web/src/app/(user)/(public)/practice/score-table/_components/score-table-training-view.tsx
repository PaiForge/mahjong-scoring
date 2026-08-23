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
 * TrainingShell の onSkip / skipDisabled に、盤面側の `advance` を
 * 渡す必要があるため（他のトレーニングはスキップ機能を持たない）。
 * ファクトリに「盤面の状態をシェルへ引き上げる」経路を足すと
 * 1箇所のために設定項目が増えるので、ここは意図的に例外としている。
 */
function ScoreTableTrainingViewInner() {
  const t = useTranslations("scoreTableChallenge");
  const {
    correctCount,
    totalCount,
    showFeedback,
    lastAnswerCorrect,
    handleAnswer,
  } = useTrainingSession();
  const generatorOptions = useScoreTableGeneratorOptions();
  const { question, advance } = useScoreTableQuestion(generatorOptions);

  return (
    <TrainingShell
      title={t("title")}
      correctCount={correctCount}
      totalCount={totalCount}
      exitHref={EXIT_HREF}
      onSkip={advance}
      skipDisabled={showFeedback || question === undefined}
    >
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
    </TrainingShell>
  );
}

/**
 * 出題条件の読み出し前に出すシェル
 *
 * スキップは盤面の `advance` に依存するため本体の外へ出せない。そのため
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
