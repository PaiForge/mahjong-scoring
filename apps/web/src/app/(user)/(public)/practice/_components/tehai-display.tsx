"use client";

import { memo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getKazeName } from "@mahjong-scoring/core";
import type { Tehai14, HaiKindId, Kazehai } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useAutoScale } from "../_hooks/use-auto-scale";

/**
 * 練習共通の手牌表示に必要なコンテキスト情報
 * 練習コンテキスト
 */
export interface TehaiContext {
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly isRiichi?: boolean;
  readonly doraMarkers?: readonly HaiKindId[];
}

interface TehaiDisplayProps {
  readonly tehai: Tehai14;
  readonly context: TehaiContext;
  readonly translationNamespace: string;
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 練習共通の手牌表示コンポーネント
 * 手牌表示
 */
export const TehaiDisplay = memo(function TehaiDisplay({
  tehai,
  context,
  translationNamespace,
  onScaleChange,
}: TehaiDisplayProps) {
  const t = useTranslations(translationNamespace);
  const { wrapperRef, contentRef, scale } = useAutoScale([tehai]);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

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
            {tehai.closed.map((kindId, i) => (
              <Hai key={i} hai={kindId} size="sm" />
            ))}
          </div>
          {tehai.exposed.length > 0 && (
            <div className="flex shrink-0 ml-1">
              {tehai.exposed.map((mentsu, i) => (
                <Furo key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs">
        <div className="text-center">
          <span className="text-surface-400">{t("bakaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(context.bakaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("jikaze")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {getKazeName(context.jikaze)}
          </p>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agari")}</span>
          <div
            className="mt-0.5 flex justify-center"
            style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
          >
            <Hai hai={context.agariHai} size="sm" />
          </div>
        </div>
        <div className="text-center">
          <span className="text-surface-400">{t("agariType")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {context.isTsumo ? t("tsumo") : t("ron")}
          </p>
        </div>
        {context.isRiichi && (
          <div className="text-center">
            <span className="text-surface-400">{t("riichi")}</span>
            <p className="mt-0.5 font-bold text-red-600">&#x25CF;</p>
          </div>
        )}
        {context.doraMarkers && context.doraMarkers.length > 0 && (
          <div className="text-center">
            <span className="text-surface-400">{t("dora")}</span>
            <div
              className="mt-0.5 flex justify-center gap-0.5"
              style={{ transform: `scale(${scale})`, transformOrigin: "center top" }}
            >
              {context.doraMarkers.map((marker, i) => (
                <Hai key={i} hai={marker} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
