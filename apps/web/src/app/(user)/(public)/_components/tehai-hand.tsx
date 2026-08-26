"use client";

import { memo, useEffect, useMemo } from "react";
import type { HaiKindId, Tehai } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useAutoScale } from "../_hooks/use-auto-scale";
import { splitAgariHai } from "../_lib/agari-hai";

/** size="sm" の牌の高さ（px）。globals.css の .h-hai-sm と合わせる */
export const HAI_SM_HEIGHT = 45;
/** 和了牌ラベルが牌の上に足す高さ（px）。text-[10px] leading-none + mb-0.5 */
const AGARI_LABEL_HEIGHT = 12;

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
 * ラベルの色は濃い盤面（TehaiDisplay）に載る前提の白抜き。
 */
export const TehaiHand = memo(function TehaiHandComponent({
  tehai,
  agariHai,
  agariLabel,
  onScaleChange,
}: TehaiHandProps) {
  const { wrapperRef, contentRef, scale } = useAutoScale([
    tehai,
    agariHai,
    agariLabel,
  ]);

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
        height: `${(HAI_SM_HEIGHT + (agariLabel ? AGARI_LABEL_HEIGHT : 0)) * scale}px`,
      }}
    >
      <div
        ref={contentRef}
        className="absolute left-0 top-0 flex items-end whitespace-nowrap"
        style={{ transformOrigin: "left top" }}
      >
        <div className="flex shrink-0">
          {closedTiles.map((kindId, i) => (
            <Hai key={i} hai={kindId} size="sm" />
          ))}
        </div>
        {separatedAgariHai !== undefined && (
          <div className="ml-4 flex shrink-0 flex-col items-center">
            {agariLabel !== undefined && (
              <span className="mb-0.5 text-[10px] font-bold leading-none text-white/70">
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
