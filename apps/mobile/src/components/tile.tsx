import { View } from "react-native";
import { Hai, type HaiProps } from "@pai-forge/mahjong-react-ui";

/**
 * 押せない牌（表示だけ）
 * 表示牌
 *
 * @pai-forge/mahjong-react-ui の `Hai` は `onClick` を渡さなくても常に
 * `Pressable` で包まれて描かれる。React Native のタッチは最も内側の
 * Pressable が受け取るため、選択肢ボタンの中に `Hai` を置くと牌がタップを
 * 奪い、ボタンの `onPress` が呼ばれない（牌の上を押しても答えられない）。
 * 表示だけの牌はこれで包み、タッチを外側へ素通しさせる。牌そのものを
 * 押させたいとき（牌を選ぶ盤面）だけ `Hai` に `onClick` を渡して直接使う。
 */
export function Tile(props: Omit<HaiProps, "onClick">) {
  return (
    <View pointerEvents="none">
      <Hai {...props} />
    </View>
  );
}
