"use client";

import { memo, useEffect, useMemo } from "react";
import type { HaiKindId, Tehai } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useAutoScale } from "../_hooks/use-auto-scale";
import { splitAgariHai } from "../_lib/agari-hai";

/** size="sm" の牌の高さ（px）。globals.css の .h-hai-sm と合わせる */
export const HAI_SM_HEIGHT = 45;
/** size="sm" の牌の幅（px）。globals.css の .w-hai-sm と合わせる */
const HAI_SM_WIDTH = 32;
/** 和了牌ラベルが牌の上に足す高さ（px）。text-[10px] leading-none + mb-0.5 */
const AGARI_LABEL_HEIGHT = 12;
/** 和了牌を純手牌から離す間隔（px）。`ml-4` */
const AGARI_GAP = 16;

/**
 * 行の高さの基準にする手の自然幅（px）
 * 基準手牌幅
 *
 * 門前の 13 枚に間隔を空けて和了牌を置いた、最も普通の並び。行の高さは
 * この幅が収まる倍率で決め、鳴きが多くてこれより広い手はその高さの中で
 * さらに縮める（{@link TehaiHand} 参照）。状況行（{@link import("../practice/_components/tehai-display").TehaiDisplay}）も
 * 同じ基準で高さを決め、手牌と行の高さの関係を一定に保つ。
 */
export const REFERENCE_HAND_WIDTH =
  13 * HAI_SM_WIDTH + AGARI_GAP + HAI_SM_WIDTH;

interface TehaiHandProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /**
   * 和了牌。渡すと純手牌から1枚抜き、間隔を空けて右側に開示する。
   * 和了形ではない手牌（役の早見表など）では省略する。
   */
  readonly agariHai?: HaiKindId;
  /**
   * 和了牌に添えるラベル（「ツモ」「ロン」）。訳語は呼び出し側で解決する。
   * この共有コンポーネントは牌の並びだけを負い、辞書の名前空間を知らない。
   */
  readonly agariLabel?: string;
  /**
   * 和了ラベルを載せる面の明暗。既定は濃い出題盤面（TehaiDisplay）。
   * 早見表のような明るい面に置くときだけ "light" を渡す。
   */
  readonly agariLabelTone?: "dark" | "light";
  /** 自動スケール値の変化通知（コンテキスト牌などを同じ倍率で揃える用途） */
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 手牌の牌画像表示（純手牌 + 和了牌 + 副露 + 横幅自動スケール）
 * 手牌牌表示
 *
 * 練習の出題盤面（TehaiDisplay）と各種早見表で共有する、牌の「出し方」の単一実装。
 * コンテキスト情報（場風・自風・ドラ等）は含めず、牌の並びのみを描画する。
 *
 * 並びは実卓の開示に合わせる。理牌した純手牌を隙間なく並べ、間隔を空けて
 * 和了牌（ツモ牌・ロン牌）を右に置き、さらに広い間隔を空けて副露を並べる。
 * 和了牌を純手牌に混ぜたまま出すと、どの牌で和了したのかが並びから読めない。
 * ロン牌を横向きに倒す実卓の作法は採らない。牌の高さが変わって行が揃わないため。
 *
 * 和了牌には枠を付け、ツモ・ロンの別をラベルとして真上に添える。牌そのものの
 * そばに出ていれば、盤面の下に「和了牌」「和了」の欄を別に設けなくて済む。
 * ラベルの色は載せる面に合わせて `agariLabelTone` で切り替える。
 *
 * 行の高さは幅から決め、手の中身では変えない。牌は幅に収まる倍率まで縮む
 * ため、「収まる倍率 × 牌の高さ」で行の高さを決めると、鳴きの数と種類で
 * 自然幅が変わるたびに行の高さが揺れる（幅 390px で 36〜42px）。出題が
 * 変わるたびに下の選択肢が動き、制限時間の中で「さっきボタンがあった場所」を
 * 押す操作が外れる。基準の手（{@link REFERENCE_HAND_WIDTH}）が収まる倍率で
 * 行の高さを固定し、それより広い手は行の中で左下を軸にさらに縮める。余る
 * 隙間は牌の上に出る（基準より広い手だけ、幅 390px で最大 10px 程度）。
 */
export const TehaiHand = memo(function TehaiHandComponent({
  tehai,
  agariHai,
  agariLabel,
  agariLabelTone = "dark",
  onScaleChange,
}: TehaiHandProps) {
  const { wrapperRef, contentRef, scale, referenceScale } = useAutoScale(
    [tehai, agariHai, agariLabel],
    { referenceWidth: REFERENCE_HAND_WIDTH },
  );

  const { closedTiles, separatedAgariHai } = useMemo(
    () => splitAgariHai(tehai.closed, agariHai),
    [tehai.closed, agariHai],
  );

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden"
      style={{
        height: `${(HAI_SM_HEIGHT + (agariLabel ? AGARI_LABEL_HEIGHT : 0)) * referenceScale}px`,
      }}
    >
      <div
        ref={contentRef}
        className="absolute bottom-0 left-0 flex items-end whitespace-nowrap"
        style={{ transformOrigin: "left bottom" }}
      >
        <div className="flex shrink-0">
          {closedTiles.map((kindId, i) => (
            <Hai key={i} hai={kindId} size="sm" />
          ))}
        </div>
        {separatedAgariHai !== undefined && (
          <div className="ml-4 flex shrink-0 flex-col items-center">
            {agariLabel !== undefined && (
              <span
                className={`mb-0.5 text-[10px] font-bold leading-none ${
                  agariLabelTone === "light"
                    ? "text-surface-500"
                    : "text-white/70"
                }`}
              >
                {agariLabel}
              </span>
            )}
            <Hai hai={separatedAgariHai} size="sm" highlighted />
          </div>
        )}
        {tehai.exposed.length > 0 && (
          <div className="flex shrink-0 ml-8">
            {tehai.exposed.map((mentsu, i) => (
              <Furo key={i} mentsu={mentsu} furo={mentsu.furo} size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
