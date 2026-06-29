"use client";

import { memo, useEffect } from "react";
import type { Tehai } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";
import { useAutoScale } from "../_hooks/use-auto-scale";

interface TehaiHandProps {
  /** 表示する手牌（純手牌 + 副露）。Tehai14 もそのまま渡せる。 */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** 自動スケール値の変化通知（コンテキスト牌などを同じ倍率で揃える用途） */
  readonly onScaleChange?: (scale: number) => void;
}

/**
 * 手牌の牌画像表示（純手牌 + 副露 + 横幅自動スケール）
 * 手牌牌表示
 *
 * 練習の出題盤面（TehaiDisplay）と各種早見表で共有する、牌の「出し方」の単一実装。
 * コンテキスト情報（場風・自風・ドラ等）は含めず、牌の並びのみを描画する。
 */
export const TehaiHand = memo(function TehaiHand({
  tehai,
  onScaleChange,
}: TehaiHandProps) {
  const { wrapperRef, contentRef, scale } = useAutoScale([tehai]);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  return (
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
  );
});
