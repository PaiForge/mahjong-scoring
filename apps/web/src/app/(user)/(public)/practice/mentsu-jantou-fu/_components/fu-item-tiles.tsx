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
 *
 * 置き場は牌 1 枚分の高さ（`h-hai-sm`）の flex 枠に固定する。`Furo` は
 * `inline-flex` なので、素の div に入れると行ボックスのベースライン揃えで
 * 下に 3〜10px の隙間が付き（横倒しの牌が先頭に来る形が最も広い）、平らな
 * 牌の行より高くなる。どの行が副露かは出題ごとに違うため、そのままだと
 * 出題が変わるたびに下の行の選択肢が動く。flex 枠の子は blockify されて
 * 行ボックスを持たず、副露も槓子も内側は牌 1 枚分の高さに収まる。
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

  return (
    <div
      className="flex h-hai-sm items-center"
      style={
        scale === undefined || scale >= 1
          ? undefined
          : { transform: `scale(${scale})`, transformOrigin: "left center" }
      }
    >
      {tiles}
    </div>
  );
}
