"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { getKazeName } from "@mahjong-scoring/core";
import type { TehaiFuQuestion } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useAutoScale } from "../../_hooks/use-auto-scale";

interface TehaiDisplayProps {
  readonly question: TehaiFuQuestion;
}

/**
 * 手牌の符計算における手牌表示
 * 手牌表示
 */
export const TehaiDisplay = memo(function TehaiDisplay({ question }: TehaiDisplayProps) {
  const t = useTranslations("tehaiFu");
  const { wrapperRef, contentRef, scale } = useAutoScale([question]);

  return (
    <div className="mt-4 rounded-xl border border-surface-200 bg-white p-2 shadow-sm">
      <div
        ref={wrapperRef}
        className="relative overflow-hidden"
        style={{ height: `${45 * scale}px` }}
      >
        <div
          ref={contentRef}
          className="absolute left-0 top-0 flex items-end whitespace-nowrap"
          style={{ transformOrigin: "left top" }}
        >
          <div className="flex shrink-0">
            {question.tehai.closed.map((kindId, i) => (
              <Hai key={i} hai={kindId} size="sm" />
            ))}
          </div>
          {question.tehai.exposed.length > 0 && (
            <div className="flex shrink-0 ml-1">
              {question.tehai.exposed.map((mentsu, i) => (
                <Furo key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-6 text-xs">
        <div className="text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(question.context.bakaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(question.context.jikaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agari")}</span>
          <div className="mt-0.5 flex justify-center">
            <Hai hai={question.context.agariHai} size="sm" />
          </div>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agariType")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {question.context.isTsumo ? t("tsumo") : t("ron")}
          </p>
        </div>
      </div>
    </div>
  );
});
