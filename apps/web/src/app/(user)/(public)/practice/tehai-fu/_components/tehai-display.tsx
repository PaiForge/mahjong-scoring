"use client";

import { memo } from "react";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { TehaiDisplay as BaseTehaiDisplay } from "../../_components/tehai-display";

interface TehaiDisplayProps {
  readonly question: TehaiFuQuestion;
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 手牌の符計算における手牌表示
 * 手牌表示
 */
export const TehaiDisplay = memo(function TehaiDisplay({ question, onScaleChange }: TehaiDisplayProps) {
  return (
    <BaseTehaiDisplay
      tehai={question.tehai}
      context={question.context}
      translationNamespace="tehaiFu"
      onScaleChange={onScaleChange}
    />
  );
});
