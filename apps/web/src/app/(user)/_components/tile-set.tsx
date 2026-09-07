"use client";

import { Hai } from "@pai-forge/mahjong-react-ui";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";
import type { HaiKindId } from "@mahjong-scoring/core";

interface TileSetProps {
  readonly tiles: readonly HaiKindId[];
  /** 牌の大きさ。並べる枚数が多く表の幅を圧迫する章では小さくする */
  readonly size?: HaiSize;
}

/**
 * 例示に並べる牌
 * 例示牌
 *
 * 牌の種類や、面子に切り出せない形（雀頭・待ちの形・14 枚の手牌）を並べる。
 * 面子 1 つを見せるときは、鳴きの有無まで描く {@link MentsuSet} を使う。
 *
 * `Hai` は "use client" を要するため、サーバーコンポーネント（教本の章・
 * 用語集の用語ページ）から牌のセルだけを切り出して差し込めるようにする。
 */
export function TileSet({ tiles, size = "sm" }: TileSetProps) {
  return (
    <div className="flex gap-1">
      {tiles.map((hai, i) => (
        <Hai key={i} hai={hai} size={size} />
      ))}
    </div>
  );
}
