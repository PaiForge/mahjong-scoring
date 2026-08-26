"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { getKazeName, isOya } from "@mahjong-scoring/core";
import type { AgariContext, Tehai, HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiHand } from "../../_components/tehai-hand";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { useDoraDisplayMode } from "@/app/_hooks/use-display-settings-store";
import { resolveDoraTiles } from "@/app/_lib/dora-display";

/**
 * 出題盤面の手牌表示に必要なコンテキスト情報
 * 出題コンテキスト
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
  readonly uraDoraMarkers?: readonly HaiKindId[];
};

interface TehaiDisplayProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  readonly context: TehaiContext;
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 出題盤面の手牌表示コンポーネント
 * 手牌表示
 *
 * 符・翻・点数のどの練習でも同じ盤面を出す。上段に手牌の外から来る条件
 * （場・自風・親子・リーチ・ドラ）を 1 行で並べ、下段に手牌を置く。
 * 和了牌とツモ・ロンの別は手牌側（TehaiHand）が牌のそばに出すため、
 * ここでは扱わない。
 *
 * 文言はすべて common から引く。盤面はどの練習でも同じものを見せる以上、
 * 練習ごとの辞書に同じ語を持たせる理由がない。
 */
export const TehaiDisplay = memo(function TehaiDisplayComponent({
  tehai,
  context,
  onScaleChange,
}: TehaiDisplayProps) {
  const t = useTranslations("common");
  const doraDisplay = useDoraDisplayMode();
  const isIndicator = doraDisplay === "indicator";
  const [showDoraInfo, setShowDoraInfo] = useState(false);
  // 牌の並びは共有コンポーネント TehaiHand に委譲し、その自動スケール値を
  // 上段のドラ牌にも同じ倍率で適用するため state で受け取る。
  const [scale, setScale] = useState(1);

  const doraTiles = useMemo(
    () => resolveDoraTiles(context.doraMarkers ?? [], doraDisplay),
    [context.doraMarkers, doraDisplay],
  );
  const uraDoraTiles = useMemo(
    () => resolveDoraTiles(context.uraDoraMarkers ?? [], doraDisplay),
    [context.uraDoraMarkers, doraDisplay],
  );

  const handleScaleChange = useCallback(
    (next: number) => {
      setScale(next);
      onScaleChange?.(next);
    },
    [onScaleChange],
  );

  const oya = isOya(context.jikaze);

  return (
    <div className="mt-4 rounded-xl border-3 border-ink bg-primary-800 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white">
        <div>
          {getKazeName(context.bakaze)}
          {t("round")} {getKazeName(context.jikaze)}
          {t("wind")}
          <span className={oya ? "ml-2 text-yellow-300" : "ml-2"}>
            {oya ? t("dealer") : t("nonDealer")}
          </span>
        </div>

        {context.isRiichi && (
          <span className="text-xs font-bold text-red-400">{t("riichi")}</span>
        )}

        {doraTiles.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/70">
              {t(isIndicator ? "doraIndicator" : "dora")}
            </span>
            <button
              type="button"
              onClick={() => setShowDoraInfo(true)}
              className="inline-flex size-4 items-center justify-center rounded-full text-[10px] text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label={t("showDetailInfo")}
            >
              ?
            </button>
            {/* ドラは「1 + 槓子数」枚あるため、槓の入った手では 1 行に収まらない。
                折り返して行からはみ出させない */}
            <div
              className="flex flex-wrap gap-0.5"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "left center",
              }}
            >
              {doraTiles.map((tile, i) => (
                <Hai key={i} hai={tile} size="sm" />
              ))}
            </div>
          </div>
        )}

        {uraDoraTiles.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-white/70">
              {t(isIndicator ? "uraDoraIndicator" : "uraDora")}
            </span>
            <div
              className="flex flex-wrap gap-0.5"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "left center",
              }}
            >
              {uraDoraTiles.map((tile, i) => (
                <Hai key={`ura-${i}`} hai={tile} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>

      <TehaiHand
        tehai={tehai}
        agariHai={context.agariHai}
        agariLabel={context.isTsumo ? t("tsumo") : t("ron")}
        onScaleChange={handleScaleChange}
      />

      <InfoModal
        isOpen={showDoraInfo}
        onClose={() => setShowDoraInfo(false)}
        title={t("doraInfoTitle")}
        closeLabel={t("close")}
      >
        <p className="whitespace-pre-line">
          {t(isIndicator ? "doraInfoIndicator" : "doraInfoActual")}
        </p>
      </InfoModal>
    </div>
  );
});
