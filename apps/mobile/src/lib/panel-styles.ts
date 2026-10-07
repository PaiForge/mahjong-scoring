import type { ViewStyle } from "react-native";

import { borderWidth, colors, radius } from "./theme";

/**
 * 内側の情報カードの枠（web の `rounded-panel border border-panel bg-white`）
 * パネル枠
 *
 * 表示だけのカード・表・設定のカード・開閉する枠・入力欄が共有する。太枠 +
 * ハードシャドウは「押して始める面」の記号なので、押せないものはこの細い枠で区切る。
 */
export const panelFrame: ViewStyle = {
  borderWidth: borderWidth.panel,
  borderColor: colors.panel,
  borderRadius: radius.panel,
  backgroundColor: colors.white,
  overflow: "hidden",
};
