import type { ViewStyle } from "react-native";
import type { MachiTileMark } from "@mahjong-scoring/features/practice/machi-score/machi-tile-mark";

import { colors } from "../../../lib/theme";

/**
 * 判定後の牌の枠と背景（web の `MACHI_TILE_MARK_CLASSES`）
 * 牌の判定配色
 *
 * 待ち牌を選ぶ画面と答え合わせで同じ語彙を使う: 緑 = 待ちで選んだ /
 * 赤 = 待ちではないのに選んだ / 緑の破線 = 待ちだが選ばなかった。見落としだけ
 * 破線なのは、選んでいない牌を塗ると「選んだ」ように見えるため。
 */
export const MACHI_TILE_MARK_STYLES: Readonly<
  Record<MachiTileMark, ViewStyle>
> = {
  correct: {
    borderColor: colors.success,
    backgroundColor: colors.successSubtle,
  },
  extra: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
  },
  missed: {
    borderColor: colors.success,
    borderStyle: "dashed",
    backgroundColor: colors.white,
  },
};
