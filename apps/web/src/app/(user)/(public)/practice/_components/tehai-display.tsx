"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getKazeName, isOya } from "@mahjong-scoring/core";
import type { AgariContext, Tehai, HaiKindId } from "@mahjong-scoring/core";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { TehaiHand, HAI_SM_HEIGHT } from "../../_components/tehai-hand";
import { useAutoScale } from "../../_hooks/use-auto-scale";
import { RiichiStick } from "./riichi-stick";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { useDoraDisplayMode } from "@/app/_hooks/use-display-settings-store";
import { resolveDoraTiles } from "@/app/_lib/dora-display";

/** 牌を含まない状況行の高さ（px）。リーチ棒とその名札が収まる高さ */
const TEXT_ROW_HEIGHT = 22;

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
  /** 裏ドラ表示牌。リーチしている出題でのみ表示する */
  readonly uraDoraMarkers?: readonly HaiKindId[];
};

interface TehaiDisplayProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  readonly context: TehaiContext;
  readonly onScaleChange?: (scale: number) => void;
  /**
   * モバイル（<sm）で盤面をどこまで広げるか。sm 以上はどれを選んでも
   * 同じ（角丸＋四辺の太枠＋余白）で、狭い画面での見え方だけが変わる。
   *
   * - `"inset"`（既定）— 白カードの内側に収める。説明や一覧の中に置く盤面は
   *   地の文と幅が揃っている方が読みやすい
   * - `"fullBleed"` — 左右だけ画面端まで。牌は枠に収まる倍率まで自動で縮むため、
   *   狭い画面では盤面の幅がそのまま牌の大きさになる。上には余白を残す
   *   （チャレンジはタイマーとライフが盤面の上に載る）
   * - `"fullBleedFlushTop"` — 上も詰めてカード上端の枠線に密着させる。盤面が
   *   カードの先頭に来る画面（トレーニング・点数計算）用。ここで余白を残すと、
   *   タイトル帯と盤面の間に用の無い白帯が出る
   *
   * 打ち消す余白は白カード（ContentContainer）の `p-4`。カードは <sm で
   * フルブリードなので、`-mx-4` で盤面が画面端に届き、`-mt-4` で上端に届く。
   * カード直下でなくても、間に挟まるのが中央寄せ（`mx-auto max-w-md` 等）や
   * `space-y-*` のラッパーだけなら同じように働く。
   */
  readonly mobileFrame?: MobileFrame;
}

/** モバイルでの盤面の広げ方 */
type MobileFrame = keyof typeof MOBILE_FRAME_CLASSES;

/**
 * 盤面の枠。広げるときは角丸と接する辺の枠線を落とし、左右のパディングも
 * 詰めて牌に幅を回す（白カード自身の <sm 表示と同じ作法）。上端に密着させる
 * ときは、カードの上枠（4px）と二重にならないよう自前の上枠も落とす。
 */
const MOBILE_FRAME_CLASSES = {
  inset: "mt-4 rounded-xl border-3 p-3",
  fullBleed:
    "-mx-4 mt-4 rounded-none border-x-0 border-y-3 px-2 py-3 sm:mx-0 sm:rounded-xl sm:border-x-3 sm:px-3",
  fullBleedFlushTop:
    "-mx-4 -mt-4 rounded-none border-x-0 border-t-0 border-b-3 px-2 py-3 sm:mx-0 sm:mt-4 sm:rounded-xl sm:border-x-3 sm:border-t-3 sm:px-3",
} as const;

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
  mobileFrame = "inset",
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
  // 裏ドラはリーチしている出題でのみ見せる。ここで空にしておくことで、
  // 描画の有無と状況行の高さ計算が同じ条件を見る。
  const uraDoraTiles = useMemo(
    () =>
      context.isRiichi
        ? resolveDoraTiles(context.uraDoraMarkers ?? [], doraDisplay)
        : [],
    [context.isRiichi, context.uraDoraMarkers, doraDisplay],
  );

  const handleScaleChange = useCallback(
    (next: number) => {
      setScale(next);
      onScaleChange?.(next);
    },
    [onScaleChange],
  );

  const hasDoraTiles = doraTiles.length > 0 || uraDoraTiles.length > 0;
  const infoRowHeight = hasDoraTiles ? HAI_SM_HEIGHT : TEXT_ROW_HEIGHT;

  // 状況行は折り返さず、手牌と同じ倍率まで縮めて幅に収める。牌の大きさが
  // 手牌と揃い、狭い画面でも「東場 西家 子」が 2 行に割れない。
  // 手牌より状況行の方が長くなる手（槓が多くドラが増える）だけは、
  // 収まる倍率まで自分でさらに縮む。
  const {
    wrapperRef: infoWrapperRef,
    contentRef: infoContentRef,
    scale: infoScale,
  } = useAutoScale([context, doraTiles, uraDoraTiles], scale);

  const oya = isOya(context.jikaze);

  return (
    <div
      className={`border-ink bg-primary-800 ${MOBILE_FRAME_CLASSES[mobileFrame]}`}
    >
      <div
        ref={infoWrapperRef}
        className="relative mb-3 overflow-hidden"
        style={{ height: `${infoRowHeight * infoScale}px` }}
      >
        <div
          ref={infoContentRef}
          className="absolute left-0 top-0 flex items-center gap-x-4 whitespace-nowrap text-sm text-white"
          style={{ height: `${infoRowHeight}px`, transformOrigin: "left top" }}
        >
          <div>
            {getKazeName(context.bakaze)}
            {t("round")} {getKazeName(context.jikaze)}
            {t("wind")}
            <span className={oya ? "ml-2 text-yellow-300" : "ml-2"}>
              {oya ? t("dealer") : t("nonDealer")}
            </span>
          </div>

          {context.isRiichi && <RiichiStick label={t("riichi")} />}

          {doraTiles.length > 0 && (
            <DoraGroup
              label={t(isIndicator ? "doraIndicator" : "dora")}
              tiles={doraTiles}
            >
              <button
                type="button"
                onClick={() => setShowDoraInfo(true)}
                className="inline-flex size-4 items-center justify-center rounded-full text-[10px] text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                aria-label={t("showDetailInfo")}
              >
                ?
              </button>
            </DoraGroup>
          )}

          {uraDoraTiles.length > 0 && (
            <DoraGroup
              label={t(isIndicator ? "uraDoraIndicator" : "uraDora")}
              tiles={uraDoraTiles}
            />
          )}
        </div>
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

interface DoraGroupProps {
  readonly label: string;
  readonly tiles: readonly HaiKindId[];
  /** ラベルの直後に挟む要素（ドラの見方を開く「?」ボタン） */
  readonly children?: ReactNode;
}

/** 状況行のドラ・裏ドラ（名札 + 牌列） */
function DoraGroup({ label, tiles, children }: DoraGroupProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-white/70">{label}</span>
      {children}
      <div className="flex gap-0.5">
        {tiles.map((tile, i) => (
          <Hai key={i} hai={tile} size="sm" />
        ))}
      </div>
    </div>
  );
}
