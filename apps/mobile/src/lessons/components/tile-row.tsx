import { Hai } from "@pai-forge/mahjong-react-ui";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { HaiSize } from "@pai-forge/mahjong-react-ui";
import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";

import { FuroTiles } from "../../board/furo-tiles";
import { AutoScale } from "../../components/auto-scale";
import { colors } from "../../lib/theme";

/** 表のセルに並べる牌の大きさ（web の待ちの例と同じ `xs`） */
export const CELL_TILE_SIZE: HaiSize = "xs";

/** `xs` の牌の高さ（横向きの牌の幅と同じ）。縮める行の高さに使う */
const CELL_TILE_HEIGHT = 34;

/**
 * 例示に並べる牌（web の `TileSet`）
 * 例示牌
 */
export function TileSet({
  tiles,
  size = "sm",
}: {
  readonly tiles: readonly HaiKindId[];
  readonly size?: HaiSize;
}) {
  return (
    <View style={styles.row}>
      {tiles.map((hai, i) => (
        <Hai key={i} hai={hai} size={size} />
      ))}
    </View>
  );
}

/**
 * 例示に並べる面子（web の `MentsuSet`）
 * 例示面子
 *
 * 鳴いた 1 枚を横向きに、暗槓は両端を伏せて置く（`FuroTiles` が面子から決める）。
 */
export function MentsuSet({
  mentsu,
  size = "sm",
}: {
  readonly mentsu: CompletedMentsu;
  readonly size?: HaiSize;
}) {
  return <FuroTiles mentsu={mentsu} furo={mentsu.furo} size={size} />;
}

/**
 * 手の内 ＋ 和了牌（web の `MachiTiles` と確認問題の待ちの並び）
 * 待ち例示牌
 */
export function MachiTiles({
  tiles,
  agariHai,
  size = "sm",
}: {
  readonly tiles: readonly HaiKindId[];
  readonly agariHai: HaiKindId;
  readonly size?: HaiSize;
}) {
  return (
    <View style={styles.machi}>
      <TileSet tiles={tiles} size={size} />
      <Text style={styles.plus}>+</Text>
      <TileSet tiles={[agariHai]} size={size} />
    </View>
  );
}

/**
 * 表のセルに収まるまで縮める牌の並び
 * セル内の牌
 *
 * web の例示表は牌の列が牌の枚数で幅を決めて縮まない（表が横に広がる）。
 * モバイルの表は列の幅を比で割るので、牌は `xs` で描き、それでも溢れる
 * 並び（双碰待ちの 5 枚）はセルの幅まで縮める。
 */
export function CellTiles({ children }: { readonly children: ReactNode }) {
  return (
    // 基準幅は 1（行の高さは常に倍率 1 の高さ）。溢れる並びだけを縮める
    <AutoScale referenceWidth={1} naturalHeight={CELL_TILE_HEIGHT} anchor="top">
      {children}
    </AutoScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  machi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  plus: {
    fontSize: 12,
    color: colors.surface400,
  },
});
