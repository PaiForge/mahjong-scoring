import { Image, StyleSheet, View } from "react-native";
import {
  getHaiSizePixels,
  Hai,
  toTileImageSource,
  useTileImage,
  type HaiSize,
} from "@pai-forge/mahjong-react-ui";
import { MentsuType, Tacha } from "@mahjong-scoring/core";
import type { CompletedMentsu, Furo } from "@mahjong-scoring/core";

/** 横向きに置く牌が無い（暗槓・鳴いていない面子）ことを表す位置 */
const NO_ROTATION = -1;

/**
 * 横向きに置く牌の位置
 * 鳴き牌位置
 *
 * 実卓と同じく、上家から鳴いたら左端、対面なら中央、下家なら右端の牌を
 * 横向きにする（@pai-forge/mahjong-react-ui の `Furo` と同じ規則）。
 */
function rotatedIndex(furo: Furo | undefined, length: number): number {
  if (furo === undefined) return NO_ROTATION;
  switch (furo.from) {
    case Tacha.Kamicha:
      return 0;
    case Tacha.Toimen:
      return 1;
    case Tacha.Shimocha:
      return length - 1;
    default:
      return NO_ROTATION;
  }
}

/** 牌の裏面（暗槓の両端に伏せて置く） */
export function TileBack({ size = "sm" }: { readonly size?: HaiSize }) {
  const source = useTileImage("back");
  const { width, height } = getHaiSizePixels(size);
  return (
    <View style={[styles.back, { width, height }]}>
      <Image
        source={toTileImageSource(source)}
        style={styles.backImage}
        resizeMode="cover"
      />
    </View>
  );
}

/**
 * 副露（鳴いた面子・暗槓）の牌の並び
 * 副露表示
 *
 * @pai-forge/mahjong-react-ui の `Furo` は web 専用（`div` と Tailwind の
 * クラスで並べる）で、React Native では描けない（ネイティブでは `div` が
 * 無く落ち、web 版の RN でも並びが崩れる）。同じ規則（鳴いた相手の位置の
 * 牌を横向きに、暗槓は両端を伏せる）で RN の View に並べ直す。
 */
export function FuroTiles({
  mentsu,
  furo,
  size = "sm",
}: {
  readonly mentsu: CompletedMentsu;
  readonly furo?: Furo;
  readonly size?: HaiSize;
}) {
  const { hais } = mentsu;
  if (mentsu.type === MentsuType.Kantsu && furo === undefined) {
    return (
      <View style={styles.row} pointerEvents="none">
        <TileBack size={size} />
        <Hai hai={hais[1]} size={size} />
        <Hai hai={hais[2]} size={size} />
        <TileBack size={size} />
      </View>
    );
  }
  const rotated = rotatedIndex(furo, hais.length);
  return (
    <View style={styles.row} pointerEvents="none">
      {hais.map((hai, i) => (
        <Hai key={i} hai={hai} size={size} rotated={i === rotated} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1,
  },
  back: {
    overflow: "hidden",
    borderRadius: 4,
  },
  backImage: {
    width: "100%",
    height: "100%",
  },
});
