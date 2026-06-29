"use client";

import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface YakuExampleHandProps {
  readonly tiles: readonly HaiKindId[];
}

/**
 * 役チートシートの例示手牌（牌画像の横並び）
 * 役例示手牌表示
 *
 * 枚数が多い手（清一色・国士・槓子系）でも収まるよう折り返す。
 */
export function YakuExampleHand({ tiles }: YakuExampleHandProps) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {tiles.map((hai, i) => (
        <Hai key={i} hai={hai} size="sm" />
      ))}
    </div>
  );
}
