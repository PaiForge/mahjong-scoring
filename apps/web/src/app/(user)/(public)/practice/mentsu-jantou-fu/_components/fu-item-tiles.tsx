"use client";

import { MentsuType } from "@mahjong-scoring/core";
import type { MentsuJantouFuItem } from "@mahjong-scoring/core";
import { Hai, Furo } from "@pai-forge/mahjong-react-ui";

/**
 * 牌の描き分けに必要な回答行の情報
 * 符行牌情報
 */
export type FuItemTilesSource = Pick<
  MentsuJantouFuItem,
  "tiles" | "type" | "isOpen" | "originalMentsu"
>;

interface FuItemTilesProps {
  readonly item: FuItemTilesSource;
  /**
   * 和了牌として枠を付ける牌の位置（この要素で和了していなければ undefined）
   *
   * 晒して見せる要素（副露・槓子）は和了牌になり得ないため反映しない。
   */
  readonly highlightedTileIndex?: number;
  /** 1 未満のとき、左端を軸にこの倍率まで縮める */
  readonly scale?: number;
}

/**
 * 回答行の牌の並び
 * 符行の牌
 *
 * 副露と槓子は手牌と同じく横倒しで晒し、それ以外は牌を平らに並べる。出題中の
 * 回答行と結果ページの振り返りで同じ見た目にするため、この描き分けを 1 箇所に
 * 置く。明刻か暗刻かは符の答えそのものなので、両方で揃っている必要がある。
 */
export function FuItemTiles({
  item,
  highlightedTileIndex,
  scale,
}: FuItemTilesProps) {
  const tiles =
    item.originalMentsu && (item.isOpen || item.type === MentsuType.Kantsu) ? (
      <Furo
        mentsu={item.originalMentsu}
        furo={item.originalMentsu.furo}
        size="sm"
      />
    ) : (
      <div className="flex gap-0.5">
        {item.tiles.map((tile, i) => (
          <Hai
            key={i}
            hai={tile}
            size="sm"
            highlighted={i === highlightedTileIndex}
          />
        ))}
      </div>
    );

  if (scale === undefined || scale >= 1) return tiles;

  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
    >
      {tiles}
    </div>
  );
}
