"use client";

import { memo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { getKazeName } from "@mahjong-scoring/core";
import type { Tehai14, HaiKindId, Kazehai } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiHand } from "../../_components/tehai-hand";

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
  // 牌の並びは共有コンポーネント TehaiHand に委譲し、その自動スケール値を
  // コンテキスト牌（和了牌・ドラ）にも同じ倍率で適用するため state で受け取る。
  const [scale, setScale] = useState(1);

  const handleScaleChange = useCallback(
    (next: number) => {
      setScale(next);
      onScaleChange?.(next);
    },
    [onScaleChange],
  );

  return (
    <div className="mt-4 rounded-xl border border-surface-200 bg-white p-2">
      <TehaiHand tehai={tehai} onScaleChange={handleScaleChange} />
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
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center top",
            }}
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
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center top",
              }}
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
