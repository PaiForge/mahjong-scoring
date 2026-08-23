"use client";

import { Hai, HaiBack } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface TileSetProps {
  readonly tiles: readonly HaiKindId[];
  /** 裏向きで描画する牌の位置（暗槓の両端など） */
  readonly faceDownIndexes?: readonly number[];
}

/**
 * 教本の例示に並べる牌
 * 例示牌
 *
 * `Hai` は "use client" を要するため、サーバーコンポーネントの教本から
 * 牌のセルだけを切り出して差し込めるようにする。
 */
export function TileSet({ tiles, faceDownIndexes = [] }: TileSetProps) {
  return (
    <div className="flex gap-1">
      {tiles.map((hai, i) =>
        faceDownIndexes.includes(i) ? (
          <HaiBack key={i} size="sm" />
        ) : (
          <Hai key={i} hai={hai} size="sm" />
        ),
      )}
    </div>
  );
}
