import { StyleSheet, View } from "react-native";
import { MentsuType } from "@mahjong-scoring/core";
import type { MentsuJantouFuItem } from "@mahjong-scoring/core";

import { FuroTiles } from "../../../board/furo-tiles";
import { HAI_SM_HEIGHT } from "../../../board/tehai-hand";
import { Tile } from "../../../components/tile";

/**
 * 牌の描き分けに必要な回答行の情報
 * 符行牌情報
 */
export type FuItemTilesSource = Pick<
  MentsuJantouFuItem,
  "tiles" | "type" | "isOpen" | "originalMentsu"
>;

/**
 * 回答行の牌の並び
 * 符行の牌
 *
 * web の `FuItemTiles` の移植。副露と槓子は手牌と同じく横倒しで晒し、それ
 * 以外は牌を平らに並べる。出題中の回答行と結果の振り返りで同じ見た目に
 * するため、この描き分けを 1 箇所に置く。明刻か暗刻かは符の答えそのもの
 * なので、両方で揃っている必要がある。
 *
 * 置き場は牌 1 枚分の高さに固定し、どの行が副露かで下の行の選択肢が
 * 動かないようにする。
 *
 * @param highlightedTileIndex - 和了牌として枠を付ける牌の位置（この要素で
 *   和了していなければ undefined）。晒して見せる要素（副露・槓子）は和了牌に
 *   なり得ないため反映しない
 */
export function FuItemTiles({
  item,
  highlightedTileIndex,
}: {
  readonly item: FuItemTilesSource;
  readonly highlightedTileIndex?: number;
}) {
  return (
    <View style={styles.frame}>
      {item.originalMentsu &&
      (item.isOpen || item.type === MentsuType.Kantsu) ? (
        <FuroTiles
          mentsu={item.originalMentsu}
          furo={item.originalMentsu.furo}
          size="sm"
        />
      ) : (
        <View style={styles.row}>
          {item.tiles.map((tile, i) => (
            <Tile
              key={i}
              hai={tile}
              size="sm"
              highlighted={i === highlightedTileIndex}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: HAI_SM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    gap: 2,
  },
});
