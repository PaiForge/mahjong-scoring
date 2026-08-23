"use client";

import { Hai, HaiBack } from "@pai-forge/mahjong-react-ui";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface TileSetProps {
  readonly tiles: readonly HaiKindId[];
  /** 裏向きで描画する牌の位置（暗槓の両端など） */
  readonly faceDownIndexes?: readonly number[];
  /** 牌の大きさ。並べる枚数が多く表の幅を圧迫する章では小さくする */
  readonly size?: HaiSize;
}

/**
 * 教本の例示に並べる牌
 * 例示牌
 *
 * `Hai` は "use client" を要するため、サーバーコンポーネントの教本から
 * 牌のセルだけを切り出して差し込めるようにする。
 */
export function TileSet({
  tiles,
  faceDownIndexes = [],
  size = "sm",
}: TileSetProps) {
  return (
    <div className="flex gap-1">
      {tiles.map((hai, i) =>
        faceDownIndexes.includes(i) ? (
          <HaiBack key={i} size={size} />
        ) : (
          <Hai key={i} hai={hai} size={size} />
        ),
      )}
    </div>
  );
}
