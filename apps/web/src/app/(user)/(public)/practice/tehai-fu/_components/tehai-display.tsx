"use client";

import { memo } from "react";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { DrillTehaiDisplay } from "../../_components/drill-tehai-display";

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
    <DrillTehaiDisplay
      tehai={question.tehai}
      context={question.context}
      translationNamespace="tehaiFu"
      onScaleChange={onScaleChange}
    />
  );
});
