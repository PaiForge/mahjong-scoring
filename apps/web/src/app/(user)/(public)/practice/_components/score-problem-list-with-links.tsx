"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ScoreQuestionResult } from "../_lib/score-question-result";
import { buildReferenceUrl } from "../_lib/build-reference-url";
import { formatScoreAnswer } from "../_lib/format-score-answer";
import { ScoreProblemList } from "./score-problem-list";

interface ScoreProblemListWithLinksProps {
  readonly results: readonly ScoreQuestionResult[];
  /**
   * i18n の翻訳ネームスペース（例: "scoreTableChallenge"）
   * 翻訳ネームスペース
   */
  readonly translationNamespace: string;
}

/**
 * 点数系練習共通の問題別フィードバック一覧（正解リンク付き）
 * 点数問題一覧（リンク付き）
 *
 * ScoreProblemList をラップし、正解値を点数表参照ページへのリンクとして表示する。
 * 点数表練習・点数計算練習で共通して使用される。
 */
export function ScoreProblemListWithLinks({
  results,
  translationNamespace,
}: ScoreProblemListWithLinksProps) {
  const t = useTranslations(translationNamespace);

  return (
    <ScoreProblemList
      results={results}
      translationNamespace={translationNamespace}
      renderCorrectAnswer={(answer, result) => (
        <Link
          href={buildReferenceUrl(result)}
          className="text-primary-600 underline hover:text-primary-800"
          target="_blank"
          rel="noopener noreferrer"
        >
          {formatScoreAnswer(answer, t)}
        </Link>
      )}
      formatAnswer={formatScoreAnswer}
    />
  );
}
