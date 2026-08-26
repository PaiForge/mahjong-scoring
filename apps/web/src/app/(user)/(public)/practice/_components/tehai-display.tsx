"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getKazeName } from "@mahjong-scoring/core";
import type { AgariContext, Tehai, HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiHand } from "../../_components/tehai-hand";
import { useDoraDisplayMode } from "@/app/_hooks/use-display-settings-store";
import { resolveDoraTiles } from "@/app/_lib/dora-display";

/**
 * 練習共通の手牌表示に必要なコンテキスト情報
 * 練習コンテキスト
 *
 * core の {@link AgariContext} に表示上の任意項目を足したもの。
 * リーチ表示とドラ表示はそれを持たない練習からも使われるため任意。
 *
 * ドラは常に「表示牌」で受け取る。表示牌のまま出すか、ドラそのものへ
 * 読み替えて出すかは表示設定で決まる。
 */
export type TehaiContext = AgariContext & {
  readonly isRiichi?: boolean;
  readonly doraMarkers?: readonly HaiKindId[];
};

interface TehaiDisplayProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  readonly context: TehaiContext;
  readonly translationNamespace: string;
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 練習共通の手牌表示コンポーネント
 * 手牌表示
 *
 * 和了牌は下の情報欄に並べず、手牌の右へ間隔を空けて開示する（TehaiHand）。
 * 実卓と同じ並びになり、情報欄で同じ牌を二度出さずに済む。
 */
export const TehaiDisplay = memo(function TehaiDisplayComponent({
  tehai,
  context,
  translationNamespace,
  onScaleChange,
}: TehaiDisplayProps) {
  const t = useTranslations(translationNamespace);
  const tCommon = useTranslations("common");
  const doraDisplay = useDoraDisplayMode();
  // 牌の並びは共有コンポーネント TehaiHand に委譲し、その自動スケール値を
  // コンテキスト牌（ドラ）にも同じ倍率で適用するため state で受け取る。
  const [scale, setScale] = useState(1);

  const doraTiles = useMemo(
    () => resolveDoraTiles(context.doraMarkers ?? [], doraDisplay),
    [context.doraMarkers, doraDisplay],
  );

  const handleScaleChange = useCallback(
    (next: number) => {
      setScale(next);
      onScaleChange?.(next);
    },
    [onScaleChange],
  );

  return (
    <div className="mt-4 rounded-xl border-3 border-ink bg-white p-2">
      <TehaiHand
        tehai={tehai}
        agariHai={context.agariHai}
        onScaleChange={handleScaleChange}
      />
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
          <span className="text-surface-400">{t("agariType")}</span>
          <p className="mt-0.5 font-bold text-surface-900">
            {context.isTsumo ? t("tsumo") : t("ron")}
          </p>
        </div>
        {context.isRiichi && (
          <div className="text-center">
            <span className="text-surface-400">{t("riichi")}</span>
            <p className="mt-0.5 font-bold text-destructive">&#x25CF;</p>
          </div>
        )}
        {doraTiles.length > 0 && (
          <div className="text-center">
            <span className="text-surface-400">
              {tCommon(doraDisplay === "indicator" ? "doraIndicator" : "dora")}
            </span>
            <div
              className="mt-0.5 flex justify-center gap-0.5"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center top",
              }}
            >
              {doraTiles.map((tile, i) => (
                <Hai key={i} hai={tile} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
