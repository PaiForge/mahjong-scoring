import type { ViewStyle } from "react-native";

import { borderWidth, colors, radius } from "./theme";

/**
 * 内側の情報カードの枠（web の `rounded-panel border border-panel bg-white`）
 * パネル枠
 *
 * 表示だけのカード・表・設定のカード・開閉する枠・入力欄が共有する。線は
 * すべて 1px（web と同じフラット）で、押せる面との違いは枠ではなく塗り
 * （ボタンの緑・帯色）と押している間の地の色で示す。
 */
export const panelFrame: ViewStyle = {
  borderWidth: borderWidth.panel,
  borderColor: colors.panel,
  borderRadius: radius.panel,
  backgroundColor: colors.white,
  overflow: "hidden",
};
