import { useMemo } from "react";
import type {
  ScoreQuestionDisplayData,
  TehaiContext,
} from "@mahjong-scoring/features/board/tehai-context";

import { TehaiDisplay } from "../../board/tehai-display";

/**
 * 点数計算系の出題表示
 * 問題表示
 *
 * web の `score/_components/question-display.tsx` の移植。盤面そのものは
 * 全練習共通の {@link TehaiDisplay} に委譲し、この層は平坦な出題データから
 * 手牌と盤面コンテキストを切り分けるだけで見た目は持たない。点数即答・
 * 満貫以上の点数計算・和了形の点数計算・結果の一覧で共有する。
 */
export function QuestionDisplay({
  question,
}: {
  readonly question: ScoreQuestionDisplayData;
}) {
  const context = useMemo<TehaiContext>(() => {
    const { tehai: _tehai, ...rest } = question;
    return rest;
  }, [question]);

  return <TehaiDisplay tehai={question.tehai} context={context} />;
}
