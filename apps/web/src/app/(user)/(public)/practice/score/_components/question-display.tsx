"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import { TehaiDisplay } from "../../_components/tehai-display";
import type {
  ScoreQuestionDisplayData,
  TehaiContext,
} from "@mahjong-scoring/features/board/tehai-context";

interface QuestionDisplayProps {
  readonly question: ScoreQuestionDisplayData;
  /** モバイルでの盤面の広げ方（{@link TehaiDisplay} にそのまま渡す） */
  readonly mobileFrame?: ComponentProps<typeof TehaiDisplay>["mobileFrame"];
}

/**
 * 点数計算系の出題表示
 * 問題表示
 *
 * 盤面そのものは全練習共通の {@link TehaiDisplay} に委譲する。この層は
 * 平坦な出題データから手牌と盤面コンテキストを切り分けるだけで、
 * 見た目は持たない。
 */
export function QuestionDisplay({
  question,
  mobileFrame,
}: QuestionDisplayProps) {
  const context = useMemo<TehaiContext>(() => {
    const { tehai: _tehai, ...rest } = question;
    return rest;
  }, [question]);

  return (
    <TehaiDisplay
      tehai={question.tehai}
      context={context}
      mobileFrame={mobileFrame}
    />
  );
}
